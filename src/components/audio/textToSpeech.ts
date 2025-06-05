import 'dotenv/config'
import textToSpeech from '@google-cloud/text-to-speech'
import type { TextToSpeechClient } from '@google-cloud/text-to-speech'

// Function to get Google Cloud credentials
const getGoogleCloudCredentials = () => {
  // Skip credential loading during build time or when not needed
  if (process.env.NODE_ENV === 'production' && !process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
    throw new Error('Google Cloud credentials are required in production')
  }

  // In development, skip base64 processing entirely and use fallback methods
  if (process.env.NODE_ENV === 'development') {
    // Method 2: Individual environment variables (preferred for development)
    if (
      process.env.GOOGLE_APPLICATION_PROJECT_ID &&
      process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_APPLICATION_PRIVATE_KEY
    ) {
      return {
        projectId: process.env.GOOGLE_APPLICATION_PROJECT_ID,
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_APPLICATION_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
      }
    }

    // In development, return null to disable TTS instead of throwing error
    return null
  }

  // Method 1: Base64 encoded credentials (only for production)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
    try {
      const base64String = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64.trim()

      // Validate base64 string is not empty
      if (!base64String) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS_BASE64 is empty')
      }

      const decodedString = Buffer.from(base64String, 'base64').toString()

      // Validate decoded string is not empty
      if (!decodedString || decodedString.trim() === '') {
        throw new Error('Decoded credentials string is empty')
      }

      const credentials = JSON.parse(decodedString)

      // Validate required fields exist
      if (!credentials.project_id || !credentials.client_email || !credentials.private_key) {
        throw new Error(
          'Missing required fields in credentials: project_id, client_email, or private_key',
        )
      }

      return {
        projectId: credentials.project_id,
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
      }
    } catch (error) {
      console.error('Failed to parse base64 credentials:', error)
      // In production, throw the error
      if (process.env.NODE_ENV === 'production') {
        throw error
      }
    }
  }

  // Method 2: Individual environment variables (fallback for production)
  if (
    process.env.GOOGLE_APPLICATION_PROJECT_ID &&
    process.env.GOOGLE_CLIENT_EMAIL &&
    process.env.GOOGLE_APPLICATION_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.GOOGLE_APPLICATION_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_APPLICATION_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    }
  }

  // During CI/build time, return null to prevent crashes
  if (process.env.CI) {
    return null
  }

  throw new Error(
    'Google Cloud credentials not found. Please set either GOOGLE_APPLICATION_CREDENTIALS_BASE64 or individual environment variables.',
  )
}

// Creates a client with custom timeout settings - but only if credentials are available
let client: TextToSpeechClient | null = null

try {
  const credentials = getGoogleCloudCredentials()
  if (credentials) {
    client = new textToSpeech.TextToSpeechClient({
      ...credentials,
      // Set custom timeout and retry settings
      timeout: 120000, // 2 minutes timeout per request
      retrySettings: {
        totalTimeoutMillis: 180000, // 3 minutes total timeout
        initialRetryDelayMillis: 1000, // Start with 1 second delay
        retryDelayMultiplier: 2, // Double the delay each retry
        maxRetryDelayMillis: 30000, // Max 30 seconds between retries
        maxRetries: 3, // Maximum 3 retries
      },
    })
  }
} catch (error) {
  console.warn('⚠️ Could not initialize Google Cloud TTS client:', error)
  client = null
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000, // Start with 1 second
  maxDelayMs: 30000, // Max 30 seconds
  backoffMultiplier: 2,
}

// Helper function to wait for a specified time
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Helper function to calculate exponential backoff delay
const calculateBackoffDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt)
  return Math.min(delay, RETRY_CONFIG.maxDelayMs)
}

export async function generateAudioFromText(textToSynthesize: string): Promise<Buffer> {
  // Check if client is available
  if (!client) {
    throw new Error(
      'Google Cloud TTS client is not available. Please check your credentials configuration.',
    )
  }

  console.log(
    `🎤 [TTS] Starting TTS synthesis for text (${textToSynthesize.length} chars): "${textToSynthesize.substring(0, 100)}${textToSynthesize.length > 100 ? '...' : ''}"`,
  )

  // Construct the request
  const request = {
    input: { text: textToSynthesize },
    // Select the language and SSML voice gender (optional)
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Chirp-HD-F',
    },
    // select the type of audio encoding
    audioConfig: { audioEncoding: 'LINEAR16' as const },
  }

  console.log(
    `🎤 [TTS] Request config: ${JSON.stringify({ voice: request.voice, audioConfig: request.audioConfig })}`,
  )

  let lastError: Error | null = null

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = calculateBackoffDelay(attempt - 1)
        console.log(
          `🔄 [TTS] Retry attempt ${attempt}/${RETRY_CONFIG.maxRetries} after ${delay}ms delay...`,
        )
        await sleep(delay)
      }

      console.log(
        `🎤 [TTS] Calling Google TTS API... (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})`,
      )

      // Performs the text-to-speech request with timeout
      const [response] = await client.synthesizeSpeech(request)

      console.log(`🎤 [TTS] TTS API response received`)
      console.log(`🎤 [TTS] Audio content exists: ${!!response?.audioContent}`)

      if (!response?.audioContent) {
        const error = new Error('No audio content received from Google TTS')
        console.error('❌ [TTS] No audio content received from Google TTS')
        throw error
      }

      const audioBuffer = response.audioContent as Buffer
      console.log(`✅ [TTS] TTS synthesis successful (${audioBuffer.length} bytes)`)

      if (attempt > 0) {
        console.log(`🎉 [TTS] Success on retry attempt ${attempt}!`)
      }

      return audioBuffer
    } catch (error) {
      lastError = error as Error
      console.error(`❌ [TTS] Error on attempt ${attempt + 1}:`, error)

      // Check if this is a timeout or retryable error
      const isRetryable = isRetryableError(error)
      const isLastAttempt = attempt === RETRY_CONFIG.maxRetries

      if (isLastAttempt || !isRetryable) {
        console.error(`❌ [TTS] Final failure after ${attempt + 1} attempts`)
        console.error(`❌ [TTS] Failed text: "${textToSynthesize.substring(0, 200)}..."`)
        break
      }

      console.log(
        `⏳ [TTS] Will retry... (${RETRY_CONFIG.maxRetries - attempt} attempts remaining)`,
      )
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error('TTS generation failed after all retries')
}

// Helper function to determine if an error is retryable
function isRetryableError(error: any): boolean {
  if (!error) return false

  const errorMessage = error.message?.toLowerCase() || ''
  const errorCode = error.code

  // Retry on timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('deadline exceeded')) {
    return true
  }

  // Retry on rate limit errors (code 8 = RESOURCE_EXHAUSTED)
  if (errorCode === 8) {
    return true
  }

  // Retry on temporary server errors (code 14 = UNAVAILABLE)
  if (errorCode === 14) {
    return true
  }

  // Retry on internal server errors (code 13 = INTERNAL)
  if (errorCode === 13) {
    return true
  }

  // Don't retry on client errors like invalid input (code 3 = INVALID_ARGUMENT)
  if (errorCode === 3) {
    return false
  }

  // Default to retryable for unknown errors
  return true
}
