import type { CollectionConfig } from 'payload'
import { convertLexicalToHTMLAsync } from '@payloadcms/richtext-lexical/html-async'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import DOMPurify from 'isomorphic-dompurify'
import crypto from 'crypto'

// HTML escaping function to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// Utility function to redact email addresses for logging
function redactEmail(email: string): string {
  if (!email || typeof email !== 'string') return '[REDACTED]'
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return '[REDACTED]'
  const redactedLocal = localPart.substring(0, 2) + '*'.repeat(Math.max(0, localPart.length - 2))
  return `${redactedLocal}@${domain}`
}

// Utility function to normalize email addresses for consistent token generation
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

// Secure HMAC token generation for unsubscribe links
function generateSecureUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET
  if (!secret) {
    throw new Error('UNSUBSCRIBE_TOKEN_SECRET environment variable is required')
  }

  // Fix: Normalize email before generating token to match verification logic
  const normalizedEmail = normalizeEmail(email)
  const timestamp = Date.now().toString()
  const data = `${normalizedEmail}:${timestamp}`
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(data)
  const signature = hmac.digest('hex')

  // Return timestamp:signature format for verification
  return `${timestamp}:${signature}`
}

// Email template function (simplified without relationships)
async function generateEmailHTML(
  content: any,
  subject: string,
  subscriberEmail: string,
  unsubscribeUrl: string,
): Promise<string> {
  // Convert Lexical rich text to HTML using Payload's async converter
  let htmlContent = ''

  if (content?.root) {
    try {
      // Convert Lexical to HTML (no relationships to populate since we disabled them)
      htmlContent = await convertLexicalToHTMLAsync({
        data: content,
      })

      // Apply custom styling to the generated HTML
      htmlContent = enhanceHTMLWithStyling(htmlContent)

      // Fix: Sanitize HTML content to prevent XSS attacks
      htmlContent = DOMPurify.sanitize(htmlContent, {
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
          'i',
          'b',
          'ul',
          'ol',
          'li',
          'blockquote',
          'a',
          'img',
          'div',
          'span',
          'table',
          'thead',
          'tbody',
          'tr',
          'td',
          'th',
        ],
        ALLOWED_ATTR: [
          'href',
          'src',
          'alt',
          'title',
          'style',
          'target',
          'width',
          'height',
          'class',
          'id',
        ],
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
      })
    } catch (error) {
      console.error('Error converting Lexical to HTML:', error)
      htmlContent =
        '<p style="margin: 8px 0; color: #333; line-height: 1.6; font-size: 16px;">Content could not be processed</p>'
    }
  } else {
    htmlContent =
      '<p style="margin: 8px 0; color: #333; line-height: 1.6; font-size: 16px;">No content available</p>'
  }

  // Fix: Escape subject in HTML to prevent XSS
  const escapedSubject = escapeHtml(subject)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${escapedSubject}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        
        /* Main styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #f4f4f4;
            font-family: 'Arial', sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        
        .header {
            background-color: #0f172a;
            padding: 40px 30px;
            text-align: center;
        }
        
        .header img {
            max-width: 180px;
            height: auto;
            display: block;
            margin: 0 auto 20px auto;
        }
        
        .header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
            line-height: 1.2;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .content p {
            margin: 0 0 20px 0;
            color: #333333;
            font-size: 16px;
            line-height: 1.6;
        }
        
        .content p:last-child {
            margin-bottom: 0;
        }
        
        .cta-section {
            text-align: center;
            margin: 30px 0;
        }
        
        .cta-button {
            display: inline-block;
            background-color: #2aaac6;
            color: #ffffff !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        
        .cta-button:hover {
            background-color: #1e90a6;
        }
        
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer p {
            margin: 8px 0;
            font-size: 14px;
            color: #6c757d;
            line-height: 1.4;
        }
        
        .footer a {
            color: #2aaac6;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        .unsubscribe {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
        }
        
        .unsubscribe p {
            font-size: 12px;
            color: #868e96;
        }
        
        /* Responsive styles */
        @media screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            
            .header, .content, .footer {
                padding: 20px !important;
            }
            
            .header h1 {
                font-size: 24px !important;
            }
            
            .header img {
                max-width: 150px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <img src="https://dawan.africa/dark-mode-logo.png" alt="Dawan Africa" />
            <h1>${escapedSubject}</h1>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            ${htmlContent}
            
            <div class="cta-section">
                <a href="https://dawan.africa" class="cta-button">Visit Our Website</a>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p><strong>Dawan Africa</strong></p>
            <p>Uncovering the Continent — Through Its Own Lens</p>
            <p>
                <a href="mailto:info@dawan.africa">info@dawan.africa</a> | 
                <a href="https://dawan.africa">www.dawan.africa</a>
            </p>
            <p>Marinio Rd, Mogadishu, Somalia | +252628881171</p>
            
            <div class="unsubscribe">
                <p>This email was sent to ${subscriberEmail}</p>
                <p>
                    <a href="${unsubscribeUrl}">Unsubscribe</a> | 
                    <a href="https://dawan.africa/newsletter">Update Preferences</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim()
}

// Function to enhance HTML with our custom styling
function enhanceHTMLWithStyling(html: string): string {
  return (
    html
      // Style paragraphs
      .replace(/<p>/g, '<p style="margin: 8px 0; color: #333; line-height: 1.6; font-size: 16px;">')
      // Style headings
      .replace(
        /<h1>/g,
        '<h1 style="font-size: 28px; font-weight: bold; margin: 16px 0 8px 0; color: #2aaac6;">',
      )
      .replace(
        /<h2>/g,
        '<h2 style="font-size: 24px; font-weight: bold; margin: 14px 0 6px 0; color: #2aaac6;">',
      )
      .replace(
        /<h3>/g,
        '<h3 style="font-size: 20px; font-weight: bold; margin: 12px 0 6px 0; color: #333;">',
      )
      .replace(
        /<h4>/g,
        '<h4 style="font-size: 18px; font-weight: bold; margin: 10px 0 4px 0; color: #333;">',
      )
      .replace(
        /<h5>/g,
        '<h5 style="font-size: 16px; font-weight: bold; margin: 8px 0 4px 0; color: #333;">',
      )
      .replace(
        /<h6>/g,
        '<h6 style="font-size: 14px; font-weight: bold; margin: 8px 0 4px 0; color: #333;">',
      )
      // Style lists
      .replace(/<ul>/g, '<ul style="margin: 8px 0; padding-left: 20px;">')
      .replace(/<ol>/g, '<ol style="margin: 8px 0; padding-left: 20px;">')
      .replace(/<li>/g, '<li style="margin: 2px 0; color: #333; line-height: 1.6;">')
      // Style blockquotes
      .replace(
        /<blockquote>/g,
        '<blockquote style="margin: 8px 0; padding: 12px; border-left: 4px solid #2aaac6; background-color: #f8f9fa; font-style: italic; color: #555;">',
      )
      // Style horizontal rules
      .replace(
        /<hr\s*\/?>/g,
        '<hr style="margin: 12px 0; border: none; border-top: 2px solid #e9ecef;" />',
      )
      // Style links
      .replace(/<a /g, '<a style="color: #2aaac6; text-decoration: underline;" ')
      // Style code
      .replace(
        /<code>/g,
        '<code style="background-color: #f1f1f1; padding: 2px 4px; border-radius: 3px; font-family: monospace;">',
      )
  )
}

// Generate plain text version
function generateEmailText(
  content: any,
  subject: string,
  subscriberEmail: string,
  unsubscribeUrl: string,
): string {
  let textContent = ''

  if (content?.root?.children) {
    textContent = convertLexicalNodesToText(content.root.children).trim()
  } else {
    textContent = 'No content available'
  }

  function convertLexicalNodesToText(nodes: any[]): string {
    return nodes
      .map((node) => {
        return convertLexicalNodeToText(node)
      })
      .join('')
  }

  function convertLexicalNodeToText(node: any): string {
    if (!node) return ''

    // Handle text nodes
    if (node.type === 'text') {
      return node.text || ''
    }

    // Handle different node types
    switch (node.type) {
      case 'paragraph':
        const paragraphContent = node.children ? convertLexicalNodesToText(node.children) : ''
        return paragraphContent + '\n'

      case 'heading':
        const headingContent = node.children ? convertLexicalNodesToText(node.children) : ''
        const level = node.tag?.replace('h', '') || '1'
        const prefix = level === '1' ? '# ' : level === '2' ? '## ' : level === '3' ? '### ' : ''
        return prefix + headingContent + '\n\n'

      case 'list':
        const listContent = node.children ? convertLexicalNodesToText(node.children) : ''
        return listContent + '\n'

      case 'listitem':
        const listItemContent = node.children ? convertLexicalNodesToText(node.children) : ''
        return '• ' + listItemContent.replace(/\n+$/, '') + '\n'

      case 'quote':
        const quoteContent = node.children ? convertLexicalNodesToText(node.children) : ''
        return '> ' + quoteContent.replace(/\n+$/, '') + '\n\n'

      case 'horizontalrule':
        return '─────────────────────────────────────\n\n'

      case 'link':
        const linkContent = node.children ? convertLexicalNodesToText(node.children) : ''
        const url = node.fields?.url || node.url || '#'
        return `${linkContent} (${url})`

      case 'linebreak':
        return '\n'

      default:
        // For unknown nodes, try to render children if they exist
        if (node.children) {
          return convertLexicalNodesToText(node.children)
        }
        return ''
    }
  }

  return `
DAWAN AFRICA NEWSLETTER
${subject}
================================

${textContent}

Visit our website: https://dawan.africa

================================
ABOUT DAWAN AFRICA

Uncovering the Continent — Through Its Own Lens

Contact Us:
Email: info@dawan.africa
Website: https://dawan.africa
Address: Marinio Rd, Mogadishu, Somalia
Phone: +252628881171

================================
SUBSCRIPTION DETAILS

This email was sent to: ${subscriberEmail}

Manage your subscription:
• Unsubscribe: ${unsubscribeUrl}
• Update preferences: https://dawan.africa/newsletter

© ${new Date().getFullYear()} Dawan Africa. All rights reserved.
  `.trim()
}

export const NewsletterCampaigns: CollectionConfig = {
  slug: 'newsletterCampaigns',
  labels: {
    singular: 'Newsletter Campaign',
    plural: 'Newsletter Campaigns',
  },
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'status', 'sentAt'],
    group: 'Marketing',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
    create: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
    update: ({ req: { user }, data }) => {
      // Only allow updates if user is admin AND campaign is not sent/failed
      // Allow internal system updates (when overrideAccess is used) for status transitions
      const isAdmin = Boolean(user?.roles?.includes('admin'))
      const canEdit = !data?.status || data.status === 'draft' || data.status === 'send_now'
      return isAdmin && canEdit
    },
    delete: ({ req: { user } }) => {
      // Only allow deletion if user is admin
      // Note: During delete operations, we cannot access the document data
      // so we rely on admin role check only. More granular checks should be done in UI
      const isAdmin = Boolean(user?.roles?.includes('admin'))
      return isAdmin
    },
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req, previousDoc }) => {
        console.log('📧 Newsletter hook triggered:', {
          operation,
          currentStatus: doc.status,
          previousStatus: previousDoc?.status,
          docId: doc.id,
        })

        // Trigger when:
        // 1. Creating a new campaign with status 'send_now'
        // 2. Updating a campaign and status changes to 'send_now'
        const isNewSendNow = operation === 'create' && doc.status === 'send_now'
        const isStatusChangedToSendNow =
          operation === 'update' && previousDoc?.status !== 'send_now' && doc.status === 'send_now'

        console.log('📧 Hook conditions:', {
          isNewSendNow,
          isStatusChangedToSendNow,
        })

        if (isNewSendNow || isStatusChangedToSendNow) {
          console.log('📧 Starting email campaign process...')

          // Process emails in the background without updating the document immediately
          // This prevents write conflicts
          setImmediate(async () => {
            try {
              console.log('📧 Processing campaign:', doc.subject)

              // Get newsletter subscribers (all emails in DB are subscribed)
              const subscribers = await req.payload.find({
                collection: 'newsletter',
                limit: 10000,
              })

              console.log('📧 Subscribers found:', subscribers.docs.length)

              if (subscribers.docs.length === 0) {
                console.log('📧 No subscribers found, marking as failed')
                await req.payload.update({
                  collection: 'newsletterCampaigns',
                  id: doc.id,
                  data: {
                    status: 'failed', // Use proper failed status
                    errorLog: 'No active subscribers found',
                    sentCount: 0,
                    failedCount: 0,
                  } as any,
                  context: { triggerAfterChange: false },
                  overrideAccess: true,
                })
                return
              }

              let sentCount = 0
              let failedCount = 0
              const errors: string[] = []

              console.log('📧 Starting to send emails to subscribers...')

              // Function to chunk array into smaller batches
              const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
                const chunks: T[][] = []
                for (let i = 0; i < array.length; i += chunkSize) {
                  chunks.push(array.slice(i, i + chunkSize))
                }
                return chunks
              }

              // Function to send email to a single subscriber
              const sendEmailToSubscriber = async (
                subscriber: any,
                index: number,
                total: number,
              ) => {
                // Fix: Redact email addresses in logs to prevent PII leakage
                const redactedEmail = redactEmail(subscriber.email)
                console.log(`📧 Sending email ${index + 1}/${total} to: ${redactedEmail}`)

                try {
                  // Fix: Generate secure unsubscribe token with normalized email
                  const normalizedEmail = normalizeEmail(subscriber.email)
                  const secureToken = generateSecureUnsubscribeToken(subscriber.email)
                  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || 'https://dawan.africa'}/api/newsletter/unsubscribe?email=${encodeURIComponent(normalizedEmail)}&token=${encodeURIComponent(secureToken)}`

                  // Generate both HTML and text versions
                  const htmlContent = await generateEmailHTML(
                    doc.content,
                    doc.subject,
                    normalizedEmail,
                    unsubscribeUrl,
                  )
                  const textContent = generateEmailText(
                    doc.content,
                    doc.subject,
                    normalizedEmail,
                    unsubscribeUrl,
                  )

                  const emailResult = await req.payload.sendEmail({
                    to: subscriber.email, // Use original email for delivery
                    subject: doc.subject,
                    html: htmlContent,
                    text: textContent,
                    replyTo: 'info@dawan.africa',
                  })

                  console.log('📧 Email result:', emailResult)

                  // Check if email was actually sent successfully
                  // Payload's sendEmail returns undefined when email is not configured
                  if (emailResult === undefined) {
                    throw new Error(
                      'Email service not configured - check Resend API key and domain verification',
                    )
                  }

                  console.log('📧 Email sent successfully to:', redactedEmail)
                  return { success: true, subscriber: redactedEmail }
                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                  console.log('📧 Email failed:', errorMessage)
                  return { success: false, subscriber: redactedEmail, error: errorMessage }
                }
              }

              // Process emails in batches of 10 to avoid overwhelming the email service
              const BATCH_SIZE = 10
              const subscriberBatches = chunkArray(subscribers.docs, BATCH_SIZE)

              console.log(
                `📧 Processing ${subscribers.docs.length} subscribers in ${subscriberBatches.length} batches of ${BATCH_SIZE}`,
              )

              for (let batchIndex = 0; batchIndex < subscriberBatches.length; batchIndex++) {
                const batch = subscriberBatches[batchIndex]
                console.log(
                  `📧 Processing batch ${batchIndex + 1}/${subscriberBatches.length} with ${batch.length} subscribers`,
                )

                // Send emails in parallel within this batch
                const batchPromises = batch.map((subscriber, index) => {
                  const globalIndex = batchIndex * BATCH_SIZE + index
                  return sendEmailToSubscriber(subscriber, globalIndex, subscribers.docs.length)
                })

                const batchResults = await Promise.all(batchPromises)

                // Process batch results
                batchResults.forEach((result) => {
                  if (result.success) {
                    sentCount++
                  } else {
                    failedCount++
                    // Fix: Don't include PII in error logs
                    errors.push(`Failed to send to ${result.subscriber}: ${result.error}`)
                  }
                })

                // Add a small delay between batches to be respectful to the email service
                if (batchIndex < subscriberBatches.length - 1) {
                  console.log('📧 Waiting 2 seconds before next batch...')
                  await new Promise((resolve) => setTimeout(resolve, 2000))
                }
              }

              console.log('📧 Campaign completed:', { sentCount, failedCount })

              // Fix: Set proper finalStatus based on success/failure counts
              const finalStatus = failedCount === 0 ? 'sent' : 'failed'
              const updateData = {
                status: finalStatus,
                sentAt: new Date().toISOString(),
                sentCount,
                failedCount,
                errorLog: errors.length > 0 ? errors.join('\n') : undefined,
              }

              console.log('📧 Updating campaign status:', finalStatus)

              await req.payload.update({
                collection: 'newsletterCampaigns',
                id: doc.id,
                data: updateData as any,
                context: { triggerAfterChange: false },
                overrideAccess: true,
              })

              console.log('📧 Campaign update completed')
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error'
              console.log('📧 Campaign error:', errorMessage)

              // Update status to failed
              try {
                await req.payload.update({
                  collection: 'newsletterCampaigns',
                  id: doc.id,
                  data: {
                    status: 'failed',
                    errorLog: `Campaign error: ${errorMessage}`,
                    sentCount: 0,
                    failedCount: 0,
                  } as any,
                  context: { triggerAfterChange: false },
                  overrideAccess: true,
                })
                console.log('📧 Campaign marked as failed')
              } catch (updateError) {
                console.log('📧 Failed to update campaign status:', updateError)
              }
            }
          })
        } else {
          console.log('📧 Hook conditions not met, skipping email processing')
        }
      },
    ],
  },
  fields: [
    {
      name: 'subject',
      type: 'text',
      required: true,
      label: 'Email Subject',
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: 'Email Content',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => {
          // Exclude RelationshipFeature from the editor
          return defaultFeatures.filter((feature) => feature.key !== 'relationship')
        },
      }),
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'send_now',
      admin: {
        condition: (data) => {
          // Allow editing only if status is draft or send_now
          return !data.status || data.status === 'draft' || data.status === 'send_now'
        },
        components: {
          Cell: './components/admin/StatusCell',
        },
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Send Now', value: 'send_now' },
      ],
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        readOnly: true,
        condition: (data) => data.status === 'sent' || data.status === 'failed',
      },
    },
    {
      name: 'sentCount',
      type: 'number',
      label: 'Emails Sent',
      admin: {
        readOnly: true,
        condition: (data) => data.status === 'sent' || data.status === 'failed',
      },
    },
    {
      name: 'failedCount',
      type: 'number',
      label: 'Failed Emails',
      admin: {
        readOnly: true,
        condition: (data) =>
          data.status === 'failed' || (data.status === 'sent' && data.failedCount > 0),
      },
    },
    {
      name: 'errorLog',
      type: 'textarea',
      label: 'Error Log',
      admin: {
        readOnly: true,
        condition: (data) =>
          data.status === 'failed' || (data.errorLog && data.errorLog.length > 0),
      },
    },
  ],
}
