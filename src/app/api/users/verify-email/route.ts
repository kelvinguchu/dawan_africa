import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await req.json()
    const { token } = body

    // Validate token
    if (!token) {
      return NextResponse.json({ message: 'Verification token is required.' }, { status: 400 })
    }

    // Use Payload's built-in email verification functionality
    const result = await payload.verifyEmail({
      collection: 'users',
      token: token.trim(),
    })

    if (result) {
      return NextResponse.json(
        { message: 'Email verified successfully! You can now access all features.' },
        { status: 200 },
      )
    } else {
      return NextResponse.json(
        { message: 'Invalid or expired verification token.' },
        { status: 400 },
      )
    }
  } catch (error: any) {
    // Handle specific Payload errors
    if (error.message?.includes('Invalid token') || error.message?.includes('expired')) {
      return NextResponse.json(
        {
          message:
            'Invalid or expired verification token. Please request a new verification email.',
        },
        { status: 400 },
      )
    }

    if (error.message?.includes('already verified')) {
      return NextResponse.json(
        { message: 'Email is already verified! You can proceed to login.' },
        { status: 200 },
      )
    }

    return NextResponse.json(
      { message: 'An error occurred during email verification. Please try again.' },
      { status: 500 },
    )
  }
}
