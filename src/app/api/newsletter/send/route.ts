import { NextRequest, NextResponse } from 'next/server'
import { getNewsletterSender } from '@/lib/newsletter-sender'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    // 🔒 Authentication Check: Verify admin permissions
    const payload = await getPayload({ config })

    // Verify user session and admin role using Payload's auth method
    let authResult
    try {
      // Use Payload's authentication with request headers
      authResult = await payload.auth({ headers: request.headers })
    } catch (authError) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Invalid authentication credentials' }, { status: 401 })
    }

    // Check if user exists and has admin role
    const { user } = authResult
    if (!user || !user.roles?.includes('admin')) {
      return NextResponse.json(
        {
          error: 'Unauthorized access: Administrator privileges required',
          details: 'Only admin users can send newsletter campaigns',
        },
        { status: 403 },
      )
    }

    console.log(`✅ Admin authentication verified for user: ${user.email}`)

    const body = await request.json()
    const { campaignId, isTest = false, testEmails = [] } = body

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    if (isTest && testEmails.length === 0) {
      return NextResponse.json(
        { error: 'Test emails are required for test campaigns' },
        { status: 400 },
      )
    }

    console.log(`${isTest ? 'Test' : 'Live'} newsletter campaign initiated: ${campaignId}`)

    const newsletterSender = await getNewsletterSender()
    const result = await newsletterSender.sendCampaign({
      campaignId,
      isTest,
      testEmails: isTest ? testEmails : undefined,
    })

    return NextResponse.json({
      success: true,
      message: isTest
        ? `Test campaign sent successfully to ${result.sentCount} recipients`
        : `Campaign sent successfully to ${result.sentCount} recipients`,
      data: {
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        errors: result.errors,
      },
    })
  } catch (error) {
    console.error('Newsletter sending error:', error)

    return NextResponse.json(
      {
        error: 'Failed to send newsletter campaign',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
