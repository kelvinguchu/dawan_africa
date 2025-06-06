import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import crypto from 'crypto'

// Utility function to normalize email addresses for consistent querying
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

// Secure HMAC token verification for unsubscribe links
function verifyUnsubscribeToken(email: string, token: string): boolean {
  const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET
  if (!secret) {
    console.error('UNSUBSCRIBE_TOKEN_SECRET environment variable is required')
    return false
  }

  try {
    // Token format: timestamp:signature
    const [timestamp, signature] = token.split(':')
    if (!timestamp || !signature) {
      return false
    }

    // Fix: Validate timestamp is a valid number before calculating age
    const timestampNum = parseInt(timestamp)
    if (isNaN(timestampNum)) {
      return false
    }

    // Verify token age (optional: reject tokens older than 30 days)
    const tokenAge = Date.now() - timestampNum
    const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    if (tokenAge > maxAge) {
      return false
    }

    // Verify signature
    const data = `${email}:${timestamp}`
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(data)
    const expectedSignature = hmac.digest('hex')

    // Fix: Ensure buffers have same length before calling timingSafeEqual
    const signatureBuffer = Buffer.from(signature, 'hex')
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex')

    if (signatureBuffer.length !== expectedSignatureBuffer.length) {
      return false
    }

    // Use timing-safe comparison
    return crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  } catch (error) {
    console.error('Token verification error:', error)
    return false
  }
}

// Generate HTML error page for invalid unsubscribe tokens
function generateInvalidTokenHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invalid Unsubscribe Link - Dawan Africa</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .error-icon {
            font-size: 48px;
            color: #dc3545;
            margin-bottom: 20px;
        }
        h1 {
            color: #dc3545;
            margin-bottom: 20px;
            font-size: 24px;
        }
        p {
            line-height: 1.6;
            margin-bottom: 20px;
            color: #666;
        }
        .btn {
            display: inline-block;
            background-color: #2aaac6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px;
            font-weight: 500;
        }
        .btn:hover {
            background-color: #1e90a6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">⚠️</div>
        <h1>Invalid Unsubscribe Link</h1>
        <p>This unsubscribe link is invalid, expired, or has already been used.</p>
        <p>If you're trying to unsubscribe from our newsletter, please:</p>
        <ul style="text-align: left; display: inline-block;">
            <li>Check that you've used the complete link from your email</li>
            <li>Make sure the link hasn't expired (links are valid for 30 days)</li>
            <li>Contact us directly if you continue to have issues</li>
        </ul>
        <div style="margin-top: 30px;">
            <a href="https://dawan.africa" class="btn">Visit Our Website</a>
            <a href="mailto:info@dawan.africa" class="btn">Contact Support</a>
        </div>
    </div>
</body>
</html>
  `.trim()
}

// Generate HTML error page for email not found
function generateEmailNotFoundHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Not Found - Dawan Africa</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .info-icon {
            font-size: 48px;
            color: #17a2b8;
            margin-bottom: 20px;
        }
        h1 {
            color: #17a2b8;
            margin-bottom: 20px;
            font-size: 24px;
        }
        p {
            line-height: 1.6;
            margin-bottom: 20px;
            color: #666;
        }
        .btn {
            display: inline-block;
            background-color: #2aaac6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px;
            font-weight: 500;
        }
        .btn:hover {
            background-color: #1e90a6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="info-icon">ℹ️</div>
        <h1>Email Not Found</h1>
        <p>The email address provided was not found in our newsletter subscription list.</p>
        <p>This could mean:</p>
        <ul style="text-align: left; display: inline-block;">
            <li>You may have already unsubscribed</li>
            <li>The email address might be typed incorrectly</li>
            <li>You might not be subscribed to our newsletter</li>
        </ul>
        <div style="margin-top: 30px;">
            <a href="https://dawan.africa" class="btn">Visit Our Website</a>
            <a href="mailto:info@dawan.africa" class="btn">Contact Support</a>
        </div>
    </div>
</body>
</html>
  `.trim()
}

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const url = new URL(req.url)
  const email = url.searchParams.get('email')
  const token = url.searchParams.get('token')

  // Basic validation
  if (!email || !token) {
    return new Response(generateEmailNotFoundHTML(), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  try {
    // Fix: Normalize email before querying
    const normalizedEmail = normalizeEmail(email)

    // Fix: Use secure token verification
    if (!verifyUnsubscribeToken(normalizedEmail, token)) {
      return new Response(generateInvalidTokenHTML(), {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Fix: Use normalized email in database query
    const subscribers = await payload.find({
      collection: 'newsletter',
      where: {
        email: { equals: normalizedEmail },
      },
      limit: 1,
    })

    if (subscribers.docs.length === 0) {
      return new Response(generateEmailNotFoundHTML(), {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    const subscriber = subscribers.docs[0]

    // Remove subscriber from database entirely
    await payload.delete({
      collection: 'newsletter',
      id: subscriber.id,
    })

    // Remove contact from Resend if RESEND_API_KEY is available
    if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        // Remove contact from Resend by email
        await resend.contacts.remove({
          email: normalizedEmail,
          audienceId: process.env.RESEND_AUDIENCE_ID,
        })

        console.log(`Successfully removed ${normalizedEmail} from Resend audience`)
      } catch (resendError) {
        // Log the error but don't fail the unsubscribe process
        console.error('Failed to remove contact from Resend:', resendError)
        // The unsubscribe still succeeded from our database perspective
      }
    } else {
      console.warn(
        'RESEND_API_KEY or RESEND_AUDIENCE_ID not configured - contact not removed from Resend',
      )
    }

    // Return success page
    const successHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Successfully Unsubscribed - Dawan Africa</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .success-icon {
            font-size: 48px;
            color: #28a745;
            margin-bottom: 20px;
        }
        h1 {
            color: #28a745;
            margin-bottom: 20px;
            font-size: 24px;
        }
        p {
            line-height: 1.6;
            margin-bottom: 20px;
            color: #666;
        }
        .btn {
            display: inline-block;
            background-color: #2aaac6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px;
            font-weight: 500;
        }
        .btn:hover {
            background-color: #1e90a6;
        }
        .secondary-btn {
            background-color: #6c757d;
        }
        .secondary-btn:hover {
            background-color: #545b62;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✅</div>
        <h1>Successfully Unsubscribed</h1>
        <p>You have been successfully removed from our newsletter and all email systems.</p>
        <p>We're sorry to see you go! If you change your mind, you can always subscribe again on our website.</p>
        <div style="margin-top: 30px;">
            <a href="https://dawan.africa" class="btn">Visit Our Website</a>
            <a href="https://dawan.africa/newsletter" class="btn secondary-btn">Subscribe Again</a>
        </div>
        <p style="font-size: 14px; color: #999; margin-top: 30px;">
            If you continue to receive emails after unsubscribing, please contact us at 
            <a href="mailto:info@dawan.africa" style="color: #2aaac6;">info@dawan.africa</a>
        </p>
    </div>
</body>
</html>
    `.trim()

    return new Response(successHTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return new Response(generateInvalidTokenHTML(), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await req.json()
    const { email } = body

    // Fix: Return JSON responses for API consistency instead of HTML
    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    // Fix: Normalize email before processing
    const normalizedEmail = normalizeEmail(email)

    // Fix: Use normalized email in database query
    const subscribers = await payload.find({
      collection: 'newsletter',
      where: {
        email: { equals: normalizedEmail },
      },
      limit: 1,
    })

    if (subscribers.docs.length === 0) {
      return NextResponse.json(
        { error: 'Email address not found in our subscription list' },
        { status: 404 },
      )
    }

    const subscriber = subscribers.docs[0]

    // Remove subscriber from database entirely
    await payload.delete({
      collection: 'newsletter',
      id: subscriber.id,
    })

    // Remove contact from Resend if RESEND_API_KEY is available
    if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        // Remove contact from Resend by email
        await resend.contacts.remove({
          email: normalizedEmail,
          audienceId: process.env.RESEND_AUDIENCE_ID,
        })

        console.log(`Successfully removed ${normalizedEmail} from Resend audience`)
      } catch (resendError) {
        // Log the error but don't fail the unsubscribe process
        console.error('Failed to remove contact from Resend:', resendError)
        // The unsubscribe still succeeded from our database perspective
      }
    } else {
      console.warn(
        'RESEND_API_KEY or RESEND_AUDIENCE_ID not configured - contact not removed from Resend',
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter and removed from all systems',
    })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
