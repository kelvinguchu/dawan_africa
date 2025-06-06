import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateWelcomeEmail } from '@/templates/welcome-email'

// Defer Resend client creation to avoid synchronous errors
function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is required')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

// Robust email validation using a comprehensive regex pattern
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false

  // Basic length checks
  if (email.length > 254) return false

  // Comprehensive email regex pattern that handles most real-world cases
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

  if (!emailRegex.test(email)) return false

  // Additional validation checks
  const parts = email.split('@')
  if (parts.length !== 2) return false

  const [local, domain] = parts

  // Local part validation
  if (local.length > 64 || local.length === 0) return false
  if (local.startsWith('.') || local.endsWith('.')) return false
  if (local.includes('..')) return false

  // Domain part validation
  if (domain.length === 0) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false
  if (domain.includes('..')) return false

  // Check domain parts length
  const domainParts = domain.split('.')
  if (domainParts.some((part) => part.length > 63 || part.length === 0)) return false

  return true
}

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, source = 'website' } = await request.json()

    // Enhanced email validation with early rejection of invalid formats
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          error: 'Please provide a valid email address',
        },
        { status: 400 },
      )
    }

    // Validate Resend configuration
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_AUDIENCE_KEY) {
      console.error('Missing Resend configuration:', {
        hasApiKey: !!process.env.RESEND_API_KEY,
        hasAudienceKey: !!process.env.RESEND_AUDIENCE_KEY,
      })
      return NextResponse.json({ error: 'Newsletter service configuration error' }, { status: 500 })
    }

    const payload = await getPayload({ config })

    let isNewSubscriber = false
    let payloadSubscriber

    // Fix: Use try-create-catch-update pattern to handle race conditions
    // This prevents duplicate key violations when multiple requests try to create the same subscriber
    try {
      // Attempt to create new subscription first (optimistic approach)
      isNewSubscriber = true
      payloadSubscriber = await payload.create({
        collection: 'newsletter',
        data: {
          email: email.toLowerCase().trim(),
          firstName: firstName?.trim() || '',
          lastName: lastName?.trim() || '',
          source,
          subscribedAt: new Date().toISOString(),
        },
      })
    } catch (createError: any) {
      // If creation fails (likely due to duplicate email), find and update existing subscriber
      console.log('Subscriber creation failed, attempting to update existing:', createError.message)

      try {
        const existingSubscriber = await payload.find({
          collection: 'newsletter',
          where: { email: { equals: email.toLowerCase().trim() } },
        })

        if (existingSubscriber.docs.length > 0) {
          const subscriber = existingSubscriber.docs[0]
          isNewSubscriber = false

          // Since we only store subscribed emails, if found, user is already subscribed
          return NextResponse.json(
            { message: 'You are already subscribed to our newsletter!' },
            { status: 200 },
          )
        } else {
          // This shouldn't happen, but if no existing subscriber found, re-throw the original error
          throw createError
        }
      } catch (fallbackError) {
        console.error(
          'Failed to find/update existing subscriber after creation failed:',
          fallbackError,
        )
        throw createError // Re-throw the original creation error
      }
    }

    // Add contact to Resend audience using deferred client creation
    try {
      const resend = getResend()
      await resend.contacts.create({
        email: email.toLowerCase().trim(),
        firstName: firstName?.trim() || '',
        lastName: lastName?.trim() || '',
        unsubscribed: false,
        audienceId: process.env.RESEND_AUDIENCE_KEY,
      })

      console.log('✅ Contact successfully added to Resend audience:', email)
    } catch (resendError: any) {
      console.error('❌ Failed to add contact to Resend audience:', {
        email,
        error: resendError.message,
        details: resendError,
      })

      // If it's a duplicate contact error, that's okay
      if (
        resendError.message?.includes('already exists') ||
        resendError.message?.includes('duplicate')
      ) {
        console.log('ℹ️ Contact already exists in Resend audience, continuing...')
      } else {
        // For other errors, we still want to continue with the welcome email
        console.error('⚠️ Continuing with welcome email despite Resend audience error')
      }
    }

    // Send welcome email
    await sendWelcomeEmail(payload, email, firstName)

    const message = isNewSubscriber
      ? 'Successfully subscribed to newsletter!'
      : 'Welcome back! Your subscription has been reactivated.'

    // Security fix: Remove internal Payload ID from response
    return NextResponse.json({
      message,
      subscriber: {
        email: payloadSubscriber.email,
        // All emails in database are subscribed by definition
        // Removed 'id' field to prevent exposure of internal database IDs
      },
    })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again later.' },
      { status: 500 },
    )
  }
}

async function sendWelcomeEmail(payload: any, email: string, firstName?: string) {
  try {
    // Generate email content using template
    const { subject, html } = generateWelcomeEmail({ firstName, email })

    await payload.sendEmail({
      to: email,
      subject,
      html,
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    // Don't throw error as subscription was successful
  }
}
