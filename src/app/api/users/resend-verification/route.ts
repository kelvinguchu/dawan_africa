import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await req.json()
    const { email } = body

    // Validate email is provided
    if (!email) {
      return NextResponse.json({ message: 'Email address is required.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Find the user by email
    const existingUser = await payload.find({
      collection: 'users',
      where: { email: { equals: normalizedEmail } },
      limit: 1,
    })

    if (existingUser.docs.length === 0) {
      // For security, don't reveal if email exists or not
      return NextResponse.json(
        { message: 'If an account with this email exists, a verification email has been sent.' },
        { status: 200 },
      )
    }

    const user = existingUser.docs[0]

    // Check if user is already verified
    if (user._verified || user.isEmailVerified) {
      return NextResponse.json(
        { message: 'This email address is already verified.' },
        { status: 400 },
      )
    }

    // Generate a new verification token 
    const crypto = await import('crypto')
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Update user with new verification token
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        _verificationToken: verificationToken,
      },
    })

    // Get the base URL for the verification link
    const baseUrl =
      process.env.NEXT_PUBLIC_SERVER_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`

    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`

    // Send verification email using Payload's sendEmail method
    await payload.sendEmail({
      to: normalizedEmail,
      subject: 'Verify Your Email Address - Dawan Africa',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2aaac6 0%, #238da1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e5e5;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hello ${user.name || normalizedEmail},</p>
              <p style="font-size: 16px; margin-bottom: 25px;">
                Thank you for creating an account with Dawan Africa! To complete your registration and access all features, please verify your email address.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: #2aaac6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 25px;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              <p style="font-size: 14px; word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 3px;">
                ${verificationUrl}
              </p>
              <p style="font-size: 14px; color: #666; margin-top: 25px;">
                This verification link will expire in 24 hours for security reasons.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
              <p style="font-size: 12px; color: #999; text-align: center;">
                If you didn't create an account with Dawan Africa, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
Hello ${user.name || normalizedEmail},

Thank you for creating an account with Dawan Africa! To complete your registration, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours for security reasons.

If you didn't create an account with Dawan Africa, you can safely ignore this email.

Best regards,
The Dawan Africa Team
      `.trim(),
    })

    return NextResponse.json({ message: 'Verification email sent successfully.' }, { status: 200 })
  } catch (error: any) {
    console.error('Resend verification error:', error)

    return NextResponse.json(
      { message: 'An error occurred while sending the verification email. Please try again.' },
      { status: 500 },
    )
  }
}
