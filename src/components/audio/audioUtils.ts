import 'dotenv/config'
import { generateAudioFromText } from './textToSpeech'
import { UTApi, UTFile } from 'uploadthing/server'

// Helper function to extract text from Lexical rich text editor data
const extractTextFromLexicalNode = (node: any): string => {
  console.log(`🔍 [TEXT EXTRACTION] Processing node type: ${node.type}`)

  if (node.type === 'text') {
    const text = node.text || ''
    console.log(`🔍 [TEXT EXTRACTION] Text node: "${text}"`)
    return text
  }
  if (node.children && Array.isArray(node.children)) {
    console.log(`🔍 [TEXT EXTRACTION] Container node with ${node.children.length} children`)
    const childrenText = node.children.map(extractTextFromLexicalNode).join(' ')
    console.log(
      `🔍 [TEXT EXTRACTION] Container text result: "${childrenText.substring(0, 50)}${childrenText.length > 50 ? '...' : ''}"`,
    )
    return childrenText
  }
  console.log(`🔍 [TEXT EXTRACTION] Unknown node type, returning empty string`)
  return ''
}

export const extractTextFromLayout = (layout: any[] = []): string => {
  console.log(`\n📄 [LAYOUT EXTRACTION] Starting layout text extraction...`)
  console.log(`📄 [LAYOUT EXTRACTION] Layout blocks: ${layout.length}`)

  const textParts: string[] = []

  for (let i = 0; i < layout.length; i++) {
    const block = layout[i]
    console.log(`📄 [LAYOUT EXTRACTION] Block ${i + 1}/${layout.length}:`)
    console.log(`📄 [LAYOUT EXTRACTION]   - Block type: ${block.blockType}`)
    console.log(`📄 [LAYOUT EXTRACTION]   - Has content: ${!!block.content}`)
    console.log(
      `📄 [LAYOUT EXTRACTION]   - Has content.root: ${!!(block.content && block.content.root)}`,
    )
    console.log(
      `📄 [LAYOUT EXTRACTION]   - Has content.root.children: ${!!(block.content && block.content.root && block.content.root.children)}`,
    )

    if (
      block.blockType === 'richtext' &&
      block.content &&
      block.content.root &&
      block.content.root.children
    ) {
      console.log(
        `📄 [LAYOUT EXTRACTION]   - Children count: ${block.content.root.children.length}`,
      )
      const blockText = block.content.root.children.map(extractTextFromLexicalNode).join(' ')
      console.log(
        `📄 [LAYOUT EXTRACTION]   - Extracted text (${blockText.length} chars): "${blockText.substring(0, 100)}${blockText.length > 100 ? '...' : ''}"`,
      )

      if (blockText) {
        textParts.push(blockText)
        console.log(`📄 [LAYOUT EXTRACTION]   - ✅ Text added to parts`)
      } else {
        console.log(`📄 [LAYOUT EXTRACTION]   - ⚠️ Empty text, not added`)
      }
    } else {
      console.log(
        `📄 [LAYOUT EXTRACTION]   - ⏭️ Skipping block (not richtext or missing content structure)`,
      )
    }
  }

  const finalText = textParts.join('\n\n')
  console.log(
    `📄 [LAYOUT EXTRACTION] Final extracted text (${finalText.length} chars): "${finalText.substring(0, 200)}${finalText.length > 200 ? '...' : ''}"`,
  )
  console.log(`📄 [LAYOUT EXTRACTION] Layout extraction complete\n`)

  return finalText
}

const GOOGLE_TTS_CHARACTER_LIMIT = 300

// Function to split text into manageable chunks for TTS
export const chunkText = (text: string): string[] => {
  const MAX_CHUNK_SIZE = GOOGLE_TTS_CHARACTER_LIMIT
  const chunks: string[] = []

  // Define break points in order of preference (better breaks first)
  const sentenceEnders = ['. ', '! ', '? ']
  const breakPoints = [
    '; ',
    ', ',
    ' and ',
    ' or ',
    ' but ',
    ' the ',
    ' is ',
    ' was ',
    ' are ',
    ' were ',
    ' ',
  ]

  let remaining = text.trim()

  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHUNK_SIZE) {
      // Remaining text fits in one chunk
      chunks.push(remaining)
      break
    }

    // First try to find sentence endings within the limit
    let bestBreakIndex = -1
    let bestBreakPoint = ''

    // Priority 1: Look for sentence endings
    for (const breakPoint of sentenceEnders) {
      const searchLimit = Math.min(MAX_CHUNK_SIZE, remaining.length)
      const lastIndex = remaining.lastIndexOf(breakPoint, searchLimit)

      if (lastIndex > 0 && lastIndex + breakPoint.length <= searchLimit) {
        bestBreakIndex = lastIndex + breakPoint.length
        bestBreakPoint = breakPoint
        break
      }
    }

    // Priority 2: If no sentence ending found, look for other break points
    if (bestBreakIndex === -1) {
      for (const breakPoint of breakPoints) {
        const searchLimit = Math.min(MAX_CHUNK_SIZE, remaining.length)
        const lastIndex = remaining.lastIndexOf(breakPoint, searchLimit)

        if (lastIndex > bestBreakIndex && lastIndex > 0) {
          bestBreakIndex = lastIndex + breakPoint.length
          bestBreakPoint = breakPoint
          break
        }
      }
    }

    // Priority 3: Force split if still no break point found
    if (bestBreakIndex === -1) {
      let forceSplitIndex = Math.min(MAX_CHUNK_SIZE, remaining.length)

      // Look backwards from the limit to find a space (word boundary)
      for (let i = forceSplitIndex; i > forceSplitIndex - 50 && i > 0; i--) {
        if (remaining[i] === ' ') {
          forceSplitIndex = i + 1
          break
        }
      }

      bestBreakIndex = forceSplitIndex
      console.log(
        '    Warning: Force-splitting text at character ' +
          forceSplitIndex +
          ' (no natural break point found)',
      )
    }

    // Extract the chunk
    const chunk = remaining.substring(0, bestBreakIndex).trim()
    if (chunk.length > 0) {
      if (chunk.length > MAX_CHUNK_SIZE) {
        console.log('    Warning: Chunk still too long, emergency splitting...')
        const emergencyChunks = emergencySplitText(chunk, MAX_CHUNK_SIZE / 2)
        chunks.push(...emergencyChunks)
      } else {
        chunks.push(chunk)
      }
    }

    remaining = remaining.substring(bestBreakIndex).trim()
  }

  return chunks.filter((chunk) => chunk.length > 0)
}

// Emergency function to split extremely long text into very small chunks
const emergencySplitText = (text: string, maxSize: number): string[] => {
  const chunks: string[] = []
  let remaining = text

  while (remaining.length > maxSize) {
    let splitIndex = maxSize
    for (let i = maxSize; i > maxSize - 20 && i > 0; i--) {
      if (remaining[i] === ' ') {
        splitIndex = i
        break
      }
    }

    chunks.push(remaining.substring(0, splitIndex).trim())
    remaining = remaining.substring(splitIndex).trim()
  }

  if (remaining.length > 0) {
    chunks.push(remaining)
  }

  return chunks
}

// Function to concatenate WAV audio buffers
export const concatenateWavBuffers = (audioBuffers: Buffer[]): Buffer | null => {
  if (audioBuffers.length === 0) return null
  if (audioBuffers.length === 1) return audioBuffers[0]

  const WAV_HEADER_SIZE = 44

  const audioDataChunks = audioBuffers.map((buffer) => {
    if (buffer.length <= WAV_HEADER_SIZE) {
      console.warn('    Warning: Audio buffer too small, might be corrupted')
      return Buffer.alloc(0)
    }
    return buffer.slice(WAV_HEADER_SIZE)
  })

  const totalAudioDataSize = audioDataChunks.reduce((sum, chunk) => sum + chunk.length, 0)

  if (totalAudioDataSize === 0) {
    console.error('    Error: No audio data found in buffers')
    return null
  }

  const firstBuffer = audioBuffers[0]
  const newHeader = Buffer.from(firstBuffer.slice(0, WAV_HEADER_SIZE))

  const totalFileSize = WAV_HEADER_SIZE + totalAudioDataSize - 8
  newHeader.writeUInt32LE(totalFileSize, 4)

  newHeader.writeUInt32LE(totalAudioDataSize, 40)

  const combinedBuffer = Buffer.concat([newHeader, ...audioDataChunks])

  console.log(
    `    Combined ${audioBuffers.length} audio chunks into single WAV file (${totalAudioDataSize} bytes of audio data)`,
  )

  return combinedBuffer
}

// Main function to generate audio for a blog post
export const generateAudioForPost = async (post: {
  id: string
  name?: string
  slug?: string
  layout?: any[]
  audioUrl?: string
}): Promise<string | null> => {
  console.log('\n🎯 [AUDIO UTILS] Starting generateAudioForPost...')
  console.log(`🎯 [AUDIO UTILS] Post ID: ${post.id}`)
  console.log(`🎯 [AUDIO UTILS] Post Name: "${post.name}"`)
  console.log(`🎯 [AUDIO UTILS] Post Slug: "${post.slug}"`)
  console.log(`🎯 [AUDIO UTILS] Layout exists: ${!!post.layout}`)
  console.log(`🎯 [AUDIO UTILS] Layout length: ${post.layout ? post.layout.length : 0}`)

  try {
    console.log(`🎯 [AUDIO UTILS] Generating audio for post: "${post.name}" (ID: ${post.id})`)

    const titleText = post.name || ''
    console.log(`🎯 [AUDIO UTILS] Title text: "${titleText}"`)

    console.log('🎯 [AUDIO UTILS] Extracting text from layout...')
    const layoutText = extractTextFromLayout(post.layout)
    console.log(
      `🎯 [AUDIO UTILS] Layout text extracted (${layoutText.length} chars): "${layoutText.substring(0, 100)}${layoutText.length > 100 ? '...' : ''}"`,
    )

    const fullTextToSynthesize = (titleText + '.\n\n' + layoutText).trim()
    console.log(
      `🎯 [AUDIO UTILS] Full text to synthesize (${fullTextToSynthesize.length} chars): "${fullTextToSynthesize.substring(0, 200)}${fullTextToSynthesize.length > 200 ? '...' : ''}"`,
    )

    if (!fullTextToSynthesize || fullTextToSynthesize === '.') {
      console.log('⚠️ [AUDIO UTILS] No text content found to synthesize.')
      return null
    }

    console.log('🔧 [AUDIO UTILS] Splitting text into chunks...')
    const textChunks = chunkText(fullTextToSynthesize)
    console.log(`🔧 [AUDIO UTILS] Text split into ${textChunks.length} chunks`)

    if (textChunks.length === 0) {
      console.log('⚠️ [AUDIO UTILS] No valid text chunks to synthesize after splitting.')
      return null
    }

    // Log each chunk
    textChunks.forEach((chunk, index) => {
      console.log(
        `🔧 [AUDIO UTILS] Chunk ${index + 1}/${textChunks.length} (${chunk.length} chars): "${chunk.substring(0, 50)}${chunk.length > 50 ? '...' : ''}"`,
      )
    })

    console.log(`🎵 [AUDIO UTILS] Synthesizing ${textChunks.length} audio chunk(s)...`)

    const audioBuffers: Buffer[] = []
    const failedChunks: Array<{ index: number; chunk: string; error: any }> = []
    let chunkIndex = 0

    for (const chunk of textChunks) {
      chunkIndex++
      console.log(
        `🎵 [AUDIO UTILS] Synthesizing chunk ${chunkIndex}/${textChunks.length} (${chunk.length} chars)...`,
      )

      let chunkSuccess = false
      let lastChunkError: any = null

      // Try to process this chunk with retries
      for (let chunkAttempt = 1; chunkAttempt <= 2; chunkAttempt++) {
        // Allow 2 attempts per chunk
        try {
          if (chunkAttempt > 1) {
            console.log(
              `🔄 [AUDIO UTILS] Retrying chunk ${chunkIndex} (attempt ${chunkAttempt}/2)...`,
            )
            // Wait a bit before retry
            await new Promise((resolve) => setTimeout(resolve, 2000))
          }

          const audioBufferChunk = await generateAudioFromText(chunk)

          if (audioBufferChunk && audioBufferChunk.length > 0) {
            console.log(
              `✅ [AUDIO UTILS] Chunk ${chunkIndex} synthesized successfully (${audioBufferChunk.length} bytes)`,
            )
            audioBuffers.push(audioBufferChunk)
            chunkSuccess = true
            break // Success, exit retry loop
          } else {
            console.warn(
              `⚠️ [AUDIO UTILS] Warning: TTS generation for chunk ${chunkIndex} returned no data.`,
            )
            lastChunkError = new Error('No audio data returned')
          }
        } catch (chunkError) {
          lastChunkError = chunkError
          console.error(
            `❌ [AUDIO UTILS] Error synthesizing chunk ${chunkIndex} (attempt ${chunkAttempt}/2):`,
            chunkError,
          )

          // If this is not the last attempt, continue to retry
          if (chunkAttempt < 2) {
            console.log(`⏳ [AUDIO UTILS] Will retry chunk ${chunkIndex}...`)
          }
        }
      }

      // If chunk failed after all retries
      if (!chunkSuccess) {
        console.error(`❌ [AUDIO UTILS] Chunk ${chunkIndex} failed after all retries`)
        console.error(`❌ [AUDIO UTILS] Failed chunk text: "${chunk.substring(0, 100)}..."`)
        failedChunks.push({ index: chunkIndex, chunk, error: lastChunkError })
      }
    }

    console.log(
      `🔧 [AUDIO UTILS] Audio synthesis complete. Got ${audioBuffers.length}/${textChunks.length} buffers`,
    )

    // Handle results based on success/failure ratio
    const successRate = audioBuffers.length / textChunks.length
    console.log(
      `📊 [AUDIO UTILS] Success rate: ${(successRate * 100).toFixed(1)}% (${audioBuffers.length}/${textChunks.length} chunks)`,
    )

    if (audioBuffers.length === 0) {
      throw new Error(
        `All text chunks failed to convert to audio (0/${textChunks.length} successful)`,
      )
    }

    if (successRate < 0.5) {
      // Less than 50% success
      throw new Error(
        `Too many chunks failed: only ${audioBuffers.length}/${textChunks.length} chunks succeeded. Aborting to maintain audio quality.`,
      )
    }

    if (failedChunks.length > 0) {
      console.warn(
        `⚠️ [AUDIO UTILS] Warning: ${failedChunks.length} chunks failed, but continuing with ${audioBuffers.length} successful chunks`,
      )
      console.warn(
        `⚠️ [AUDIO UTILS] Failed chunk indices: ${failedChunks.map((f) => f.index).join(', ')}`,
      )
    }

    console.log(`🔗 [AUDIO UTILS] Concatenating ${audioBuffers.length} audio buffers...`)
    const finalAudioBuffer = concatenateWavBuffers(audioBuffers)

    if (!finalAudioBuffer) {
      throw new Error('Failed to concatenate audio buffers')
    }

    console.log(
      `✅ [AUDIO UTILS] Audio concatenated successfully (${finalAudioBuffer.length} bytes)`,
    )

    // Upload to Uploadthing - correct initialization
    console.log('☁️ [AUDIO UTILS] Initializing UploadThing API...')

    // Use UPLOADTHING_TOKEN as requested by user
    const uploadthingKey = process.env.UPLOADTHING_TOKEN
    console.log(`☁️ [AUDIO UTILS] Using UploadThing key: ${uploadthingKey ? 'FOUND' : 'MISSING'}`)

    const utapi = new UTApi({
      token: uploadthingKey,
    })

    const filename = `audio-${post.slug || post.id}-${Date.now()}.wav`
    console.log(`☁️ [AUDIO UTILS] Upload filename: ${filename}`)

    // Create UTFile correctly
    console.log('☁️ [AUDIO UTILS] Creating UTFile object...')
    const fileToUpload = new UTFile([finalAudioBuffer], filename)
    console.log(`☁️ [AUDIO UTILS] UTFile created with size: ${finalAudioBuffer.length} bytes`)

    console.log(`☁️ [AUDIO UTILS] Uploading audio file "${filename}" to Uploadthing...`)

    try {
      const uploadResponse = await utapi.uploadFiles([fileToUpload])
      console.log(
        '☁️ [AUDIO UTILS] Upload response received:',
        JSON.stringify(uploadResponse, null, 2),
      )

      if (
        uploadResponse &&
        uploadResponse[0] &&
        uploadResponse[0].data &&
        uploadResponse[0].data.url
      ) {
        const audioUrl = uploadResponse[0].data.url
        console.log(`✅ [AUDIO UTILS] Audio uploaded successfully. URL: ${audioUrl}`)
        return audioUrl
      } else {
        console.error('❌ [AUDIO UTILS] Uploadthing upload failed - invalid response structure')
        console.error('❌ [AUDIO UTILS] Upload response:', uploadResponse)
        throw new Error('Uploadthing upload failed or did not return a URL')
      }
    } catch (uploadError) {
      console.error('❌ [AUDIO UTILS] Upload error:', uploadError)
      throw new Error(
        `Uploadthing upload failed: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`,
      )
    }
  } catch (error) {
    console.error(`❌ [AUDIO UTILS] Error generating audio for post ID ${post.id}:`)
    console.error(`❌ [AUDIO UTILS] Error type: ${error?.constructor?.name || 'Unknown'}`)
    console.error(
      `❌ [AUDIO UTILS] Error message: ${error instanceof Error ? error.message : String(error)}`,
    )
    console.error(`❌ [AUDIO UTILS] Full error:`, error)
    throw error
  }
}

// Function to delete audio file from Uploadthing
export const deleteAudioFromUploadthing = async (audioUrl: string): Promise<void> => {
  try {
    if (!audioUrl) return

    // Extract file key from Uploadthing URL
    const urlParts = audioUrl.split('/')
    const fileKey = urlParts[urlParts.length - 1]

    if (!fileKey) {
      console.warn('Could not extract file key from audio URL:', audioUrl)
      return
    }

    const utapi = new UTApi()
    await utapi.deleteFiles([fileKey])
    console.log(`  🗑️ Deleted old audio file: ${fileKey}`)
  } catch (error) {
    console.error('Error deleting audio file from Uploadthing:', error)
    // Don't throw here - we don't want audio deletion failure to break the post update
  }
}
