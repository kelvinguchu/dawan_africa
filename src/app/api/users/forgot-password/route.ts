import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await req.json()
    const { email } = body

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { message: 'Please provide a valid email address.' },
        { status: 400 },
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // First, verify that a user with this email exists in our system
    const existingUser = await payload.find({
      collection: 'users',
      where: {
        email: { equals: normalizedEmail },
      },
      limit: 1,
    })

    if (existingUser.docs.length === 0) {
      // User doesn't exist - tell them directly
      return NextResponse.json(
        {
          message:
            'No account found with that email address. Please check your email or create a new account.',
        },
        { status: 404 },
      )
    }

    // User exists, proceed with password reset using Payload's built-in functionality
    try {
      await payload.forgotPassword({
        collection: 'users',
        data: { email: normalizedEmail },
        disableEmail: false,
      })

      return NextResponse.json(
        { message: 'Password reset instructions have been sent to your email address.' },
        { status: 200 },
      )
    } catch (forgotPasswordError: any) {
      console.error('Forgot password error:', forgotPasswordError)

      // Check for specific Payload errors
      if (forgotPasswordError.message?.includes('User not found')) {
        // This shouldn't happen as we checked above, but handle gracefully
        return NextResponse.json(
          { message: 'No account found with that email address.' },
          { status: 404 },
        )
      }

      // For other errors (email service issues, etc.), return appropriate response
      return NextResponse.json(
        { message: 'Unable to send reset email. Please try again later.' },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error('Forgot password API error:', error)

    return NextResponse.json(
      { message: 'An unexpected error occurred. Please try again later.' },
      { status: 500 },
    )
  }
}
