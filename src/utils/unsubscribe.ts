import crypto from 'crypto'

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://dawan.africa'
const SECRET = process.env.UNSUBSCRIBE_TOKEN_SECRET

// Validate that the secret is set at startup
if (!SECRET) {
  throw new Error(
    'UNSUBSCRIBE_TOKEN_SECRET environment variable is required. ' +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
  )
}

/** Utility function to normalize email addresses for consistent token generation */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/** Helper that builds a timestamped HMAC token */
function generateSecureToken(email: string): string {
  const normalizedEmail = normalizeEmail(email)
  const timestamp = Date.now().toString()
  const data = `${normalizedEmail}:${timestamp}`
  const hmac = crypto.createHmac('sha256', SECRET!) // Non-null assertion since we validate at startup
  hmac.update(data)
  const signature = hmac.digest('hex')

  // Return timestamp:signature format for verification
  return `${timestamp}:${signature}`
}

/** Public function – returns full unsubscribe URL with secure token */
export function buildUnsubscribeUrl(email: string): string {
  const normalizedEmail = normalizeEmail(email)
  const token = generateSecureToken(normalizedEmail)

  const query = new URLSearchParams({
    email: normalizedEmail,
    token,
  })

  return `${BASE_URL}/api/newsletter/unsubscribe?${query.toString()}`
}

/** Helper to escape URLs for HTML attributes */
export function escapeUrlForHtml(url: string): string {
  return url.replace(/&/g, '&amp;')
}
