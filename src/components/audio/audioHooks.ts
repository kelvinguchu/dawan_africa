import { CollectionAfterChangeHook, CollectionBeforeDeleteHook } from 'payload'
import { deleteAudioFromUploadthing } from './audioUtils'

// Simple in-memory lock to prevent concurrent audio generation for the same post
const audioGenerationLocks = new Set<string>()

// Simple hook that triggers audio generation via API call (no transaction conflicts)
export const generateAudioAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  context,
}) => {
  console.log('\n🔧 [AUDIO HOOK] Audio generation hook triggered!')
  console.log(`🔧 [AUDIO HOOK] Operation: ${operation}`)
  console.log(`🔧 [AUDIO HOOK] Post ID: ${doc.id}`)
  console.log(`🔧 [AUDIO HOOK] Post Name: "${doc.name}"`)

  // Check context flag to prevent infinite loops (if API call somehow triggers this)
  if (context?.triggerAfterChange === false) {
    console.log('⏭️ [AUDIO HOOK] Skipping audio generation (triggerAfterChange flag set to false)')
    return doc
  }

  // Check if audio generation is already in progress for this post
  if (audioGenerationLocks.has(doc.id)) {
    console.log('⏭️ [AUDIO HOOK] Skipping audio generation (already in progress for this post)')
    return doc
  }

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
    // Check if content has changed (for updates) or if this is a new post
    const contentChanged =
      operation === 'create' ||
      !previousDoc ||
      doc.name !== previousDoc.name ||
      JSON.stringify(doc.layout) !== JSON.stringify(previousDoc.layout)

    if (!contentChanged) {
      console.log('⏭️ [AUDIO HOOK] No content changes detected, skipping audio generation')
      return doc
    }

    console.log('✅ [AUDIO HOOK] Content changes detected, proceeding with audio generation...')

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
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5 * 60 * 1000), // 5 minute timeout
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
      console.log(`Deleting audio file for post "${doc.name}" before deletion`)
      await deleteAudioFromUploadthing(doc.audioUrl)
      console.log(`✅ Audio file deleted for post "${doc.name}"`)
    }
  } catch (error) {
    console.error(
      `❌ Failed to delete audio file for post ID ${id}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

  return true
}
