import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await req.json()
    const { name, email, password } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required.' },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { message: 'Please provide a valid email address.' },
        { status: 400 },
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long.' },
        { status: 400 },
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check if user already exists
    const existingUser = await payload.find({
      collection: 'users',
      where: { email: { equals: normalizedEmail } },
      limit: 1,
    })

    if (existingUser.docs.length > 0) {
      return NextResponse.json(
        { message: 'An account with this email address already exists.' },
        { status: 400 },
      )
    }

    // Create the user with email verification disabled initially
    // Payload will automatically generate a verification token and send email
    const newUser = await payload.create({
      collection: 'users',
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: password,
        roles: ['user'],
        subscriptionTier: 'free',
        isEmailVerified: false,
        // Payload will set _verified: false and generate _verificationToken automatically
      },
    })

    // Return success without sensitive information
    return NextResponse.json(
      {
        message: 'Account created successfully! Please check your email to verify your account.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    // Handle Payload-specific errors
    if (error.message?.includes('E11000') || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { message: 'An account with this email address already exists.' },
        { status: 400 },
      )
    }

    if (error.message?.includes('validation')) {
      return NextResponse.json(
        { message: 'Invalid user data provided. Please check your inputs.' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { message: 'An error occurred while creating your account. Please try again.' },
      { status: 500 },
    )
  }
}
