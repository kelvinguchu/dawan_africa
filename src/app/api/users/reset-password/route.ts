import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await req.json()
    const { token, password } = body

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json({ message: 'Token and password are required.' }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long.' },
        { status: 400 },
      )
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return NextResponse.json(
        { message: 'Password must contain at least one lowercase letter.' },
        { status: 400 },
      )
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return NextResponse.json(
        { message: 'Password must contain at least one uppercase letter.' },
        { status: 400 },
      )
    }

    if (!/(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { message: 'Password must contain at least one number.' },
        { status: 400 },
      )
    }

    try {
      // Use Payload's built-in reset password functionality
      const result = await payload.resetPassword({
        collection: 'users',
        data: {
          token: token.trim(),
          password: password,
        },
        overrideAccess: true, // Required property for reset password operation
      })

      if (result && result.user) {
        return NextResponse.json(
          {
            message: 'Password reset successfully.',
            user: {
              id: result.user.id,
              email: result.user.email,
              name: result.user.name,
            },
          },
          { status: 200 },
        )
      } else {
        return NextResponse.json(
          { message: 'Failed to reset password. Please try again.' },
          { status: 400 },
        )
      }
    } catch (resetError: any) {
      console.error('Reset password error:', resetError)

      // Handle specific Payload errors
      if (
        resetError.message?.includes('Invalid token') ||
        resetError.message?.includes('expired') ||
        resetError.message?.includes('Token not found')
      ) {
        return NextResponse.json(
          { message: 'Invalid or expired reset token. Please request a new password reset.' },
          { status: 401 },
        )
      }

      if (resetError.message?.includes('User not found')) {
        return NextResponse.json(
          { message: 'Reset token not found. Please request a new password reset.' },
          { status: 404 },
        )
      }

      // For validation errors
      if (resetError.name === 'ValidationError' || resetError.errors) {
        const errorMessage = resetError.message || 'Invalid password format.'
        return NextResponse.json({ message: errorMessage }, { status: 400 })
      }

      // Generic error for other cases
      return NextResponse.json(
        { message: 'Unable to reset password. Please try again later.' },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error('Reset password API error:', error)

    return NextResponse.json(
      { message: 'An unexpected error occurred. Please try again later.' },
      { status: 500 },
    )
  }
}
