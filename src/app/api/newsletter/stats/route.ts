import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(request: NextRequest) {
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
          details: 'Only admin users can access newsletter statistics',
        },
        { status: 403 },
      )
    }

    console.log(`✅ Admin authentication verified for stats access: ${user.email}`)

    // Get subscriber counts by status - payload.count() returns number directly
    const [subscribedCount, unsubscribedCount, bouncedCount, cleanedCount, totalCampaigns] =
      await Promise.all([
        payload.count({
          collection: 'newsletter',
          where: { status: { equals: 'subscribed' } },
        }),
        payload.count({
          collection: 'newsletter',
          where: { status: { equals: 'unsubscribed' } },
        }),
        payload.count({
          collection: 'newsletter',
          where: { status: { equals: 'bounced' } },
        }),
        payload.count({
          collection: 'newsletter',
          where: { status: { equals: 'cleaned' } },
        }),
        payload.count({
          collection: 'newsletterCampaigns',
          where: { status: { equals: 'sent' } },
        }),
      ])

    const response = {
      memberCount: subscribedCount,
      unsubscribeCount: unsubscribedCount,
      cleanedCount: cleanedCount,
      bouncedCount: bouncedCount,
      campaignsSent: totalCampaigns,
      audienceName: 'Dawan Africa Newsletter',
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    // Log the full error for debugging but don't expose internal details
    console.error('Newsletter stats error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available')

    // Return generic error message without exposing internal details
    return NextResponse.json(
      {
        error: 'Failed to fetch newsletter statistics',
        details: 'An internal error occurred. Please try again later.',
      },
      { status: 500 },
    )
  }
}
