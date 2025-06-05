import { getPayload } from 'payload'
import config from '@/payload.config'
import { Newsletter } from '@/payload-types'
import crypto from 'crypto'
import DOMPurify from 'isomorphic-dompurify'

interface SendNewsletterOptions {
  campaignId: string
  isTest?: boolean
  testEmails?: string[]
}

interface NewsletterRecipient {
  email: string
  firstName?: string
  lastName?: string
  unsubscribeToken?: string
}

export class NewsletterSender {
  private payload: any

  private constructor() {
    // Private constructor - use static factory method instead
  }

  /**
   * Static factory method to create and initialize NewsletterSender instance
   */
  static async create(): Promise<NewsletterSender> {
    const instance = new NewsletterSender()
    await instance.initializePayload()
    return instance
  }

  private async initializePayload() {
    this.payload = await getPayload({ config })
  }

  /**
   * Get all subscribed newsletter recipients using pagination
   */
  async getRecipients(): Promise<NewsletterRecipient[]> {
    // Payload is guaranteed to be initialized via factory method

    const whereClause = {
      status: { equals: 'subscribed' },
    }

    const allRecipients: NewsletterRecipient[] = []
    let currentPage = 1
    const pageSize = 1000
    let hasNextPage = true

    // Fix: Implement pagination to fetch all subscribers without silently dropping any
    while (hasNextPage) {
      try {
        console.log(`Fetching newsletter recipients page ${currentPage}...`)

        const response = await this.payload.find({
          collection: 'newsletter',
          where: whereClause,
          limit: pageSize,
          page: currentPage,
        })

        // Convert subscribers to recipients with secure tokens
        const pageRecipients = response.docs.map((subscriber: Newsletter) => ({
          email: subscriber.email,
          firstName: subscriber.firstName,
          lastName: subscriber.lastName,
          unsubscribeToken: this.generateUnsubscribeToken(subscriber.email),
        }))

        // Add current page results to our collection
        allRecipients.push(...pageRecipients)

        // Check if there are more pages to fetch
        hasNextPage = response.hasNextPage
        currentPage++

        // Log progress for monitoring large recipient lists
        console.log(
          `Fetched ${pageRecipients.length} recipients from page ${currentPage - 1}. ` +
            `Total so far: ${allRecipients.length}. Has next page: ${hasNextPage}`,
        )

        // Add a small delay between requests to avoid overwhelming the database
        if (hasNextPage) {
          await this.delay(50) // 50ms delay between pages
        }
      } catch (error) {
        console.error(`Error fetching recipients page ${currentPage}:`, error)
        throw new Error(
          `Failed to fetch newsletter recipients on page ${currentPage}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }

    console.log(`✅ Successfully fetched ${allRecipients.length} total newsletter recipients`)
    return allRecipients
  }

  /**
   * Send newsletter campaign
   */
  async sendCampaign(options: SendNewsletterOptions): Promise<{
    success: boolean
    sentCount: number
    failedCount: number
    errors: string[]
  }> {
    // Payload is guaranteed to be initialized via factory method

    try {
      // Get campaign details
      const campaign = await this.payload.findByID({
        collection: 'newsletterCampaigns',
        id: options.campaignId,
      })

      if (!campaign) {
        throw new Error('Campaign not found')
      }

      // Fix: Only check allowed enum values
      if (campaign.status !== 'draft' && campaign.status !== 'send_now') {
        throw new Error('Campaign must be in draft or send_now status to send')
      }

      // Note: We don't update status here since the enum only allows 'draft' | 'send_now'
      // The actual sending is handled by the collection hooks in NewsletterCampaigns.ts

      let recipients: NewsletterRecipient[]

      if (options.isTest && options.testEmails) {
        // Send to test emails
        recipients = options.testEmails.map((email) => ({ email }))
      } else {
        // Get all subscribed recipients
        recipients = await this.getRecipients()
      }

      const results = await this.sendToRecipients(campaign, recipients, options.isTest)

      // For test campaigns, we can return results without updating the campaign
      // For live campaigns, the collection hooks handle status updates
      return {
        success: results.failedCount === 0,
        ...results,
      }
    } catch (error) {
      // For live campaigns, collection hooks will handle status updates
      // We only throw the error for proper error handling
      throw error
    }
  }

  /**
   * Send emails to recipients using Payload's sendEmail (Resend)
   */
  private async sendToRecipients(
    campaign: any,
    recipients: NewsletterRecipient[],
    isTest: boolean = false,
  ): Promise<{
    sentCount: number
    failedCount: number
    errors: string[]
  }> {
    let sentCount = 0
    let failedCount = 0
    const errors: string[] = []

    // Convert rich text content to HTML with sanitization
    const htmlContent = this.convertRichTextToHTML(campaign.content)
    const unsubscribeFooter = this.getUnsubscribeFooter()

    for (const recipient of recipients) {
      try {
        // Personalize content
        const personalizedSubject = this.personalizeContent(campaign.subject, recipient)
        const personalizedHTML = this.personalizeContent(htmlContent + unsubscribeFooter, recipient)

        // Use Payload's sendEmail method (which uses Resend)
        await this.payload.sendEmail({
          to: recipient.email,
          subject: isTest ? `[TEST] ${personalizedSubject}` : personalizedSubject,
          html: personalizedHTML,
        })

        sentCount++
      } catch (error) {
        failedCount++
        const errorMessage = `Failed to send to ${recipient.email}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
        errors.push(errorMessage)
        console.error(errorMessage)
      }

      // Add delay to avoid overwhelming the email service
      if (!isTest) {
        await this.delay(100) // 100ms delay between emails
      }
    }

    return { sentCount, failedCount, errors }
  }

  /**
   * Convert Payload rich text to HTML with security sanitization
   */
  private convertRichTextToHTML(richTextContent: any): string {
    if (!richTextContent) return ''

    let htmlContent = ''

    // This is a simplified conversion - you may need to expand this
    // based on your rich text content structure
    if (typeof richTextContent === 'string') {
      htmlContent = richTextContent
    } else if (richTextContent.root && richTextContent.root.children) {
      // Handle Payload's rich text format
      htmlContent = this.processRichTextNodes(richTextContent.root.children)
    }

    // Fix: Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(htmlContent, {
      ALLOWED_TAGS: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'strong',
        'em',
        'u',
        'b',
        'i',
        'ul',
        'ol',
        'li',
        'a',
        'img',
        'table',
        'thead',
        'tbody',
        'tr',
        'td',
        'th',
        'div',
        'span',
        'blockquote',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'style'],
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      ADD_ATTR: ['target', 'rel'],
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'iframe'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      SANITIZE_DOM: true,
      FORCE_BODY: false,
      SAFE_FOR_TEMPLATES: false,
    })
  }

  /**
   * Process rich text nodes recursively
   */
  private processRichTextNodes(nodes: any[]): string {
    return nodes
      .map((node) => {
        if (node.type === 'paragraph') {
          const content = node.children ? this.processRichTextNodes(node.children) : ''
          return `<p>${content}</p>`
        }

        if (node.type === 'heading') {
          const content = node.children ? this.processRichTextNodes(node.children) : ''
          const level = node.tag || 'h2'
          return `<${level}>${content}</${level}>`
        }

        if (node.type === 'text') {
          let text = node.text || ''
          if (node.bold) text = `<strong>${text}</strong>`
          if (node.italic) text = `<em>${text}</em>`
          if (node.underline) text = `<u>${text}</u>`
          return text
        }

        if (node.type === 'link') {
          const content = node.children ? this.processRichTextNodes(node.children) : ''
          return `<a href="${node.url}">${content}</a>`
        }

        // Handle other node types as needed
        return node.text || ''
      })
      .join('')
  }

  /**
   * Escape HTML special characters to prevent XSS attacks
   */
  private escapeHtml(text: string): string {
    const htmlEscapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    }

    return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char])
  }

  /**
   * Personalize email content with recipient data (with XSS protection)
   */
  private personalizeContent(content: string, recipient: NewsletterRecipient): string {
    // Fix: Escape all recipient fields before inserting them into HTML content
    const safeFirstName = this.escapeHtml(recipient.firstName || '')
    const safeLastName = this.escapeHtml(recipient.lastName || '')
    const safeEmail = this.escapeHtml(recipient.email)
    const safeUnsubscribeToken = this.escapeHtml(recipient.unsubscribeToken || '')

    return content
      .replace(/{{firstName}}/g, safeFirstName)
      .replace(/{{lastName}}/g, safeLastName)
      .replace(/{{email}}/g, safeEmail)
      .replace(/{{unsubscribeToken}}/g, safeUnsubscribeToken)
  }

  /**
   * Generate unsubscribe footer
   */
  private getUnsubscribeFooter(): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dawan.africa'
    return `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p>
          You received this email because you subscribed to Dawan Africa newsletter.
          <br>
          <a href="${baseUrl}/api/newsletter/unsubscribe?email={{email}}&token={{unsubscribeToken}}" style="color: #2aaac6;">
            Unsubscribe
          </a> | 
          <a href="${baseUrl}" style="color: #2aaac6;">
            Visit our website
          </a>
        </p>
        <p>
          Dawan Africa<br>
          Marinio Rd, Mogadishu, Somalia
        </p>
      </div>
    `
  }

  /**
   * Generate secure unsubscribe token using HMAC
   */
  private generateUnsubscribeToken(email: string): string {
    // Fix: Use secure HMAC-based token generation instead of base64
    const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET
    if (!secret) {
      throw new Error('UNSUBSCRIBE_TOKEN_SECRET environment variable is required')
    }
    const timestamp = Date.now().toString()
    const payload = `${email}:${timestamp}`

    // Create HMAC signature
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    const signature = hmac.digest('hex')

    // Return base64-encoded payload and signature
    const token = Buffer.from(`${payload}:${signature}`).toString('base64url')

    return token
  }

  /**
   * Verify unsubscribe token
   */
  public static verifyUnsubscribeToken(email: string, token: string): boolean {
    try {
      const secret =
        process.env.UNSUBSCRIBE_TOKEN_SECRET || 'your-secure-secret-key-change-in-production'

      // Decode the token
      const decoded = Buffer.from(token, 'base64url').toString()
      const parts = decoded.split(':')

      if (parts.length !== 3) return false

      const [tokenEmail, timestamp, signature] = parts

      // Verify email matches
      if (tokenEmail !== email) return false

      // Verify timestamp is not too old (30 days)
      const tokenTime = parseInt(timestamp)
      const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
      if (Date.now() - tokenTime > maxAge) return false

      // Verify HMAC signature
      const payload = `${tokenEmail}:${timestamp}`
      const hmac = crypto.createHmac('sha256', secret)
      hmac.update(payload)
      const expectedSignature = hmac.digest('hex')

      // Use timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      )
    } catch (error) {
      console.error('Token verification error:', error)
      return false
    }
  }

  /**
   * Add delay between operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Create and export a singleton instance using the factory method
let newsletterSenderInstance: NewsletterSender | null = null

export const getNewsletterSender = async (): Promise<NewsletterSender> => {
  if (!newsletterSenderInstance) {
    newsletterSenderInstance = await NewsletterSender.create()
  }
  return newsletterSenderInstance
}
