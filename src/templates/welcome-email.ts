interface WelcomeEmailParams {
  firstName?: string
  email: string
}

interface WelcomeEmailContent {
  subject: string
  html: string
}

export function generateWelcomeEmail({
  firstName,
  email,
}: WelcomeEmailParams): WelcomeEmailContent {
  const subject = 'Welcome to Dawan Africa Newsletter!'

  // Use configurable site URL from environment variable with fallback
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dawan.africa'

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Dawan Africa</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="${siteUrl}/dark-mode-logo.png" alt="Dawan Africa" style="max-width: 200px; height: auto;">
    </div>
    
    <h1 style="color: #2aaac6; text-align: center;">Welcome to Dawan Africa Newsletter!</h1>
    
    ${firstName ? `<p>Dear ${firstName},</p>` : '<p>Hello,</p>'}
    
    <p>Thank you for subscribing to the Dawan Africa newsletter! We're excited to have you join our community of readers who stay informed about the latest news and developments across Africa.</p>
    
    <p>Here's what you can expect from us:</p>
    <ul>
      <li>📰 Breaking news from across the African continent</li>
      <li>💼 Business and economic insights</li>
      <li>🏛️ Political developments and analysis</li>
      <li>🌍 Cultural stories and perspectives</li>
      <li>🚀 Innovation and technology updates</li>
    </ul>
    
    <p>We'll be sending you our newsletter regularly with hand-picked stories that matter most to you.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${siteUrl}" style="background-color: #2aaac6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Visit Our Website</a>
    </div>
    
    <p>If you have any questions or feedback, feel free to reply to this email. We'd love to hear from you!</p>
    
    <p>Best regards,<br>The Dawan Africa Team</p>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
      <p>
        You received this email because you subscribed to our newsletter.
        <br>
        <a href="${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}" style="color: #2aaac6;">Unsubscribe</a> | 
        <a href="${siteUrl}" style="color: #2aaac6;">Visit our website</a>
      </p>
      <p>
        Dawan Africa<br>
        Marinio Rd, Mogadishu, Somalia
      </p>
    </div>
  </body>
</html>
  `.trim()

  return {
    subject,
    html,
  }
}
