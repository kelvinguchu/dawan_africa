import { CollectionAfterChangeHook, CollectionBeforeDeleteHook } from 'payload'
import { deleteAudioFromUploadthing } from './audioUtils'

// Simple in-memory lock to prevent concurrent audio generation for the same post
const audioGenerationLocks = new Set<string>()

/**
 * Helper function to create an AbortSignal with timeout that properly cleans up timers
 * @param timeoutMs - Timeout in milliseconds
 * @returns AbortSignal that will abort after the specified timeout
 */
const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
  if (typeof AbortSignal?.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs)
  }

  // Fallback for older Node.js versions with proper cleanup
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  // Clean up timer when signal is aborted (prevents timer leak)
  controller.signal.addEventListener('abort', () => clearTimeout(timer))

  return controller.signal
}

// Hook that triggers audio generation only for published posts
export const generateAudioAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  context,
  req,
}) => {
  console.log('\n🔧 [AUDIO HOOK] Audio generation hook triggered!')
  console.log(`🔧 [AUDIO HOOK] Operation: ${operation}`)
  console.log(`🔧 [AUDIO HOOK] Post ID: ${doc.id}`)
  console.log(`🔧 [AUDIO HOOK] Post Name: "${doc.name}"`)
  console.log(`🔧 [AUDIO HOOK] Current Status: ${doc.status}`)
  console.log(`🔧 [AUDIO HOOK] Previous Status: ${previousDoc?.status || 'N/A'}`)

  // Check context flags to prevent infinite loops and skip internal tasks
  if (context?.triggerAfterChange === false || context?.internalTask === true) {
    console.log(
      '⏭️ [AUDIO HOOK] Skipping audio generation (internal task or triggerAfterChange flag)',
    )
    return doc
  }

  // Check if audio generation is already in progress for this post
  if (audioGenerationLocks.has(doc.id)) {
    console.log('⏭️ [AUDIO HOOK] Skipping audio generation (already in progress for this post)')
    return doc
  }

  // Handle audio cleanup for unpublished posts
  if (doc.status !== 'published' && doc.audioUrl) {
    console.log(`🗑️ [AUDIO HOOK] Post status is "${doc.status}" - cleaning up existing audio file`)
    try {
      await deleteAudioFromUploadthing(doc.audioUrl)
      console.log('✅ [AUDIO HOOK] Audio file deleted due to unpublished status')

      // Clear the audioUrl field from the database to prevent stale links
      // Use internal task context and override access to prevent hook cascades and race conditions
      await req.payload.update({
        collection: 'blogPosts',
        id: doc.id,
        overrideAccess: true, // Skip ACL for internal task
        data: { audioUrl: null },
        context: { triggerAfterChange: false, internalTask: true },
      })
      console.log('✅ [AUDIO HOOK] AudioUrl field cleared from database')

      return { ...doc, audioUrl: null }
    } catch (deleteError) {
      console.error('❌ [AUDIO HOOK] Error deleting audio file for unpublished post:', deleteError)
    }
    return doc
  }

  // Only generate audio for published posts
  if (doc.status !== 'published') {
    console.log(
      `⏭️ [AUDIO HOOK] Post status is "${doc.status}" - skipping audio generation (only published posts get audio)`,
    )
    return doc
  }

  console.log('✅ [AUDIO HOOK] Post is published - proceeding with audio generation checks...')

  // Check environment variables
  if (
    !(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64 ||
      (process.env.GOOGLE_APPLICATION_PROJECT_ID &&
        process.env.GOOGLE_CLIENT_EMAIL &&
        process.env.GOOGLE_APPLICATION_PRIVATE_KEY)
    ) ||
    !process.env.UPLOADTHING_TOKEN
  ) {
    console.log('❌ [AUDIO HOOK] Audio generation skipped: missing environment variables')
    console.log(
      '❌ [AUDIO HOOK] Required: GOOGLE_APPLICATION_CREDENTIALS_BASE64 OR (GOOGLE_APPLICATION_PROJECT_ID + GOOGLE_CLIENT_EMAIL + GOOGLE_APPLICATION_PRIVATE_KEY) + UPLOADTHING_TOKEN',
    )
    return doc
  }

  try {
    // Check if content has changed (for updates) or if this is a newly published post
    const statusChangedToPublished =
      operation === 'update' && previousDoc?.status !== 'published' && doc.status === 'published'

    const contentChanged =
      operation === 'create' ||
      !previousDoc ||
      doc.name !== previousDoc.name ||
      JSON.stringify(doc.layout) !== JSON.stringify(previousDoc.layout)

    const shouldGenerateAudio =
      (operation === 'create' && doc.status === 'published') || // New published post
      statusChangedToPublished || // Status changed to published
      (contentChanged && doc.status === 'published') // Content changed on published post

    if (!shouldGenerateAudio) {
      console.log('⏭️ [AUDIO HOOK] No relevant changes detected for audio generation')
      return doc
    }

    if (statusChangedToPublished) {
      console.log('🎉 [AUDIO HOOK] Post status changed to published - generating audio!')
    } else if (contentChanged) {
      console.log(
        '✅ [AUDIO HOOK] Content changes detected on published post - regenerating audio...',
      )
    }

    // Add lock to prevent concurrent generation
    audioGenerationLocks.add(doc.id)
    console.log('🔒 [AUDIO HOOK] Added lock for post ID:', doc.id)

    // If this is an update and there's an existing audio file, delete it
    if (operation === 'update' && previousDoc?.audioUrl) {
      console.log('🗑️ [AUDIO HOOK] Deleting previous audio file...')
      try {
        await deleteAudioFromUploadthing(previousDoc.audioUrl)
        console.log('✅ [AUDIO HOOK] Previous audio file deleted successfully')
      } catch (deleteError) {
        console.error('❌ [AUDIO HOOK] Error deleting previous audio file:', deleteError)
      }
    }

    // Trigger audio generation via API call (fire and forget - no waiting)
    console.log('🚀 [AUDIO HOOK] Triggering async audio generation via API...')

    // Get the base URL for the API call - use localhost for development
    const isDevelopment = process.env.NODE_ENV === 'development'
    const baseUrl = isDevelopment
      ? 'http://localhost:3000'
      : (process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000')
    const apiUrl = `${baseUrl}/api/generate-audio/${doc.id}`

    console.log(`🌐 [AUDIO HOOK] API URL: ${apiUrl}`)

    // Fire and forget - don't wait for the response to avoid transaction issues
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout with proper cleanup to prevent timer leaks
      signal: createTimeoutSignal(5 * 60 * 1000), // 5 minutes
    })
      .then(async (response) => {
        if (response.ok) {
          const result = await response.json()
          console.log(`✅ [AUDIO HOOK] Audio generation API call successful for post "${doc.name}"`)
          console.log(`✅ [AUDIO HOOK] Result:`, result)

          if (result.duration) {
            console.log(`⏱️ [AUDIO HOOK] Audio generation took ${result.duration}ms`)
          }
        } else {
          console.error(
            `❌ [AUDIO HOOK] Audio generation API call failed:`,
            response.status,
            response.statusText,
          )

          // Try to parse error response
          try {
            const errorData = await response.json()
            console.error(`❌ [AUDIO HOOK] Error details:`, errorData)

            if (response.status === 408) {
              console.error(
                `⏰ [AUDIO HOOK] Request timed out - this is expected for long audio generation`,
              )
            }
          } catch (parseError) {
            console.error(`❌ [AUDIO HOOK] Could not parse error response`)
          }
        }
      })
      .catch((error) => {
        console.error(`❌ [AUDIO HOOK] Error calling audio generation API:`, error)

        // Provide more specific error handling
        if (error.name === 'AbortError' || error.message?.includes('timeout')) {
          console.error(
            `⏰ [AUDIO HOOK] API call timed out - this is expected for complex audio generation`,
          )
        } else if (error.name === 'TypeError' && error.message?.includes('fetch failed')) {
          console.error(`🌐 [AUDIO HOOK] Network error - server may be overloaded or unreachable`)
        }
      })
      .finally(() => {
        // Remove lock when done (success or failure)
        audioGenerationLocks.delete(doc.id)
        console.log('🔓 [AUDIO HOOK] Removed lock for post ID:', doc.id)
      })

    console.log('🎉 [AUDIO HOOK] Audio generation API call triggered successfully (async)')
  } catch (error) {
    console.error('\n❌ [AUDIO HOOK] Error in audio generation hook:', error)
    // Remove lock on error
    audioGenerationLocks.delete(doc.id)
    console.log('🔓 [AUDIO HOOK] Removed lock for post ID (error):', doc.id)
  }

  console.log('🔚 [AUDIO HOOK] Hook completed (audio generation running in background)')
  return doc
}

// Hook to delete audio file when a blog post is deleted
export const deleteAudioBeforeDelete: CollectionBeforeDeleteHook = async ({ req, id }) => {
  try {
    // Fetch the document to get the audio URL before deletion
    const doc = await req.payload.findByID({
      collection: 'blogPosts',
      id,
      depth: 0,
    })

    if (doc.audioUrl) {
      console.log(`🗑️ [AUDIO HOOK] Deleting audio file for post "${doc.name}" before deletion`)
      await deleteAudioFromUploadthing(doc.audioUrl)
      console.log(`✅ [AUDIO HOOK] Audio file deleted for post "${doc.name}"`)
    }
  } catch (error) {
    console.error(
      `❌ [AUDIO HOOK] Failed to delete audio file for post ID ${id}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

  return true
}
