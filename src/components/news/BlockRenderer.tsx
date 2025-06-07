import React from 'react'
import Image from 'next/image'
import { Media } from '@/payload-types'
import { ExternalLink, FileText, Quote, Download } from 'lucide-react'
import { CopyButton } from './CopyButton'

interface BlockRendererProps {
  block: any // Using 'any' for now, should be replaced with specific block types
  hideTextOverlay?: boolean
}

const RichTextBlock: React.FC<{ content: any }> = ({ content }) => {
  // HTML string content - Render directly
  if (typeof content === 'string') {
    return (
      <div
        className="prose prose-sm sm:prose-base lg:prose-lg max-w-none article-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  // Check if content might be stored under a different property name
  const blockContent = content ?? {}

  // Check if we have text content directly (some Payload configs use this structure)
  if (blockContent.text) {
    return (
      <div
        className="prose prose-sm sm:prose-base lg:prose-lg max-w-none article-content"
        dangerouslySetInnerHTML={{ __html: blockContent.text }}
      />
    )
  }

  // Lexical editor structure handling
  if (blockContent.root?.children) {
    // Convert Lexical structure to JSX
    return (
      <div className="article-content">
        {blockContent.root.children.map((node: any, index: number) => {
          switch (node.type) {
            case 'paragraph':
              return (
                <p key={index} className="relative group">
                  {node.children.map((textNode: any, i: number) => {
                    // Handle text formatting
                    const textContent = textNode.text
                    let className = ''

                    if (textNode.format & 1) className += ' font-bold'
                    if (textNode.format & 2) className += ' italic'
                    if (textNode.format & 4) className += ' underline'
                    if (textNode.format & 8) className += ' line-through'
                    if (textNode.format & 16) className += ' text-sm'
                    if (textNode.format & 32) className += ' uppercase'
                    if (textNode.format & 64)
                      className += ' text-code inline bg-gray-100 px-1.5 py-0.5 rounded font-mono'

                    return (
                      <span key={i} className={className || undefined}>
                        {textContent}
                      </span>
                    )
                  })}
                </p>
              )
            case 'heading':
              // Create the appropriate heading level
              const tag = node.tag || 2 // Default to h2 if not specified
              const headingContent = node.children.map((textNode: any) => textNode.text).join('')

              if (tag === 1) {
                return (
                  <h1 key={index} className="scroll-mt-24 group">
                    <a
                      href={`#${headingContent.toLowerCase().replace(/\s+/g, '-')}`}
                      className="no-underline"
                    >
                      {headingContent}
                      <span className="opacity-0 group-hover:opacity-100 ml-2 text-blue-500 transition-opacity">
                        #
                      </span>
                    </a>
                  </h1>
                )
              } else if (tag === 2) {
                return (
                  <h2
                    key={index}
                    className="scroll-mt-24 group"
                    id={headingContent.toLowerCase().replace(/\s+/g, '-')}
                  >
                    <a
                      href={`#${headingContent.toLowerCase().replace(/\s+/g, '-')}`}
                      className="no-underline"
                    >
                      {headingContent}
                      <span className="opacity-0 group-hover:opacity-100 ml-2 text-blue-500 transition-opacity">
                        #
                      </span>
                    </a>
                  </h2>
                )
              } else if (tag === 3) {
                return (
                  <h3
                    key={index}
                    className="scroll-mt-24 group"
                    id={headingContent.toLowerCase().replace(/\s+/g, '-')}
                  >
                    <a
                      href={`#${headingContent.toLowerCase().replace(/\s+/g, '-')}`}
                      className="no-underline"
                    >
                      {headingContent}
                      <span className="opacity-0 group-hover:opacity-100 ml-2 text-blue-500 transition-opacity">
                        #
                      </span>
                    </a>
                  </h3>
                )
              } else if (tag === 4) {
                return <h4 key={index}>{headingContent}</h4>
              } else if (tag === 5) {
                return <h5 key={index}>{headingContent}</h5>
              } else {
                return <h6 key={index}>{headingContent}</h6>
              }
            case 'list':
              const ListTag = node.listType === 'number' ? 'ol' : 'ul'
              return (
                <ListTag
                  key={index}
                  className={node.listType === 'number' ? 'custom-ol' : 'custom-ul'}
                >
                  {node.children.map((listItem: any, i: number) => (
                    <li key={i} className="my-2">
                      {listItem.children.map((paraNode: any, j: number) => (
                        <React.Fragment key={j}>
                          {paraNode.children
                            .map((textNode: any, k: number) => textNode.text)
                            .join('')}
                        </React.Fragment>
                      ))}
                    </li>
                  ))}
                </ListTag>
              )
            case 'quote':
              return (
                <blockquote
                  key={index}
                  className="relative pl-6 py-2 my-8 text-gray-700 border-l-4 border-blue-500 bg-blue-50/50 rounded-r-lg"
                >
                  <Quote className="absolute left-4 top-4 text-blue-300/30 h-16 w-16 -z-10" />
                  <div className="relative z-10">
                    {node.children.map((paraNode: any, i: number) => (
                      <p key={i} className="italic not-italic">
                        {paraNode.children
                          .map((textNode: any, j: number) => textNode.text)
                          .join('')}
                      </p>
                    ))}
                  </div>
                </blockquote>
              )
            case 'code':
              const codeText = node.children.map((textNode: any) => textNode.text).join('\n')
              return (
                <div key={index} className="my-6">
                  <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 text-sm rounded-t-md">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Code</span>
                    </div>
                    <CopyButton text={codeText} />
                  </div>
                  <pre className="bg-gray-900 p-4 rounded-b-md overflow-auto text-gray-100">
                    <code>{codeText}</code>
                  </pre>
                </div>
              )
            case 'image':
              if (node.src) {
                return (
                  <figure key={index} className="my-8">
                    <div className="rounded-lg overflow-hidden shadow-lg">
                      <Image
                        src={node.src}
                        alt={node.altText || ''}
                        width={node.width || 800}
                        height={node.height || 600}
                        className="w-full h-auto"
                      />
                    </div>
                    {node.caption && (
                      <figcaption className="text-center text-gray-600 mt-3 text-sm">
                        {node.caption}
                      </figcaption>
                    )}
                  </figure>
                )
              }
              return null
            case 'upload':
              // Handle upload nodes from Lexical editor
              if (!node.value) return null

              const uploadData: any =
                typeof node.value === 'string'
                  ? null // TODO: resolve from a pre-loaded media map if available
                  : node.value

              if (!uploadData) {
                // If we have a string ID but no resolved data, show a placeholder
                return (
                  <div
                    key={index}
                    className="my-8 p-4 bg-gray-50 border border-gray-300 rounded-lg text-center"
                  >
                    <p className="text-gray-600 text-sm">
                      Media content (ID: {typeof node.value === 'string' ? node.value : 'unknown'})
                      - requires population to display
                    </p>
                  </div>
                )
              }

              const isVideo = uploadData.mimeType?.startsWith('video/')
              const isPDF = uploadData.mimeType === 'application/pdf'
              const isImage = uploadData.mimeType?.startsWith('image/')

              if (isVideo) {
                return (
                  <figure key={index} className="my-8">
                    <div className="rounded-lg overflow-hidden shadow-lg bg-black">
                      <video
                        src={uploadData.url}
                        controls
                        className="w-full h-auto"
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    {uploadData.caption && (
                      <figcaption className="text-center text-gray-600 mt-3 text-sm">
                        {uploadData.caption}
                      </figcaption>
                    )}
                  </figure>
                )
              } else if (isPDF) {
                return (
                  <div
                    key={index}
                    className="my-8 border border-gray-300 rounded-lg overflow-hidden"
                  >
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-red-600 mr-2" />
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {uploadData.filename || 'Document'}
                            </h3>
                            {uploadData.caption && (
                              <p className="text-sm text-gray-600 mt-1">{uploadData.caption}</p>
                            )}
                          </div>
                        </div>
                        <a
                          href={uploadData.url}
                          download
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </div>
                    </div>
                    <div className="bg-white">
                      <iframe
                        src={`${uploadData.url}#toolbar=1`}
                        width="100%"
                        height={600}
                        className="border-0"
                        title={uploadData.filename || 'Document'}
                      >
                        <p>
                          Your browser does not support PDFs.
                          <a href={uploadData.url} className="text-blue-600 hover:text-blue-800">
                            Download the PDF
                          </a>
                        </p>
                      </iframe>
                    </div>
                  </div>
                )
              } else if (isImage) {
                return (
                  <figure key={index} className="my-8">
                    <div className="rounded-lg overflow-hidden shadow-lg">
                      <Image
                        src={uploadData.url}
                        alt={uploadData.alt || ''}
                        width={uploadData.width || 800}
                        height={uploadData.height || 600}
                        className="w-full h-auto"
                      />
                    </div>
                    {uploadData.caption && (
                      <figcaption className="text-center text-gray-600 mt-3 text-sm">
                        {uploadData.caption}
                      </figcaption>
                    )}
                  </figure>
                )
              }

              return null
            case 'link':
              const url = node.url || ''
              const isExternal = url.startsWith('http')
              return (
                <a
                  key={index}
                  href={url}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className="text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                >
                  {node.children.map((textNode: any) => textNode.text).join('')}
                  {isExternal && <ExternalLink className="ml-1 h-3 w-3" />}
                </a>
              )
            default:
              // Handle any other node types
              return <div key={index}>[Unsupported block type: {node.type}]</div>
          }
        })}
      </div>
    )
  }

  return (
    <div className="article-content">
      <p className="text-gray-700 italic">[Content structure issue - could not render content]</p>
    </div>
  )
}

const ImageBlock: React.FC<{ image: Media | string | null; altText?: string }> = ({
  image,
  altText,
}) => {
  const imageUrl = typeof image === 'string' ? null : image?.url
  const alt = altText ?? (typeof image === 'string' ? 'Image' : (image?.alt ?? 'Article image'))
  const imageObj = typeof image === 'string' ? null : image

  if (!imageUrl)
    return (
      <div className="my-8 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        [Image not available]
      </div>
    )

  return (
    <figure className="my-8">
      <div className="rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-[1.01] duration-300">
        <Image
          src={imageUrl}
          alt={alt}
          width={imageObj?.width ?? 1200}
          height={imageObj?.height ?? 800}
          className="w-full h-auto object-contain max-h-[500px] sm:max-h-[600px] md:max-h-[700px]"
        />
      </div>
      {alt && <figcaption className="text-center text-sm text-gray-600 mt-3">{alt}</figcaption>}
    </figure>
  )
}

const CoverBlock: React.FC<{
  image?: Media | string | null
  heading?: any
  subheading?: string
  hideTextOverlay?: boolean
}> = ({ image, heading, subheading, hideTextOverlay }) => {
  const imageUrl = typeof image === 'string' ? null : image?.url
  const imageObj = typeof image === 'string' ? null : image

  // Extract heading text from Lexical data structure if available
  let headingText = 'Article Heading'

  if (heading && typeof heading === 'object') {
    // Try to extract from Lexical structure
    if (heading.root?.children?.[0]?.children?.[0]?.text) {
      headingText = heading.root.children[0].children[0].text
    } else if (heading.children?.[0]?.text) {
      headingText = heading.children[0].text
    }
  } else if (typeof heading === 'string') {
    headingText = heading
  }

  return (
    <div className="my-8 sm:my-10 md:my-12 relative rounded-xl overflow-hidden shadow-xl min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
      {imageUrl ? (
        // With image
        <>
          <Image
            src={imageUrl}
            alt={headingText}
            fill
            className="object-cover"
            priority
            sizes="(min-width: 1280px) 1200px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </>
      ) : (
        // Without image - gradient background
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-800"></div>
      )}

      {!hideTextOverlay && (
        <div className="relative z-10 flex flex-col justify-center items-center text-center h-full p-6 sm:p-10 md:p-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 max-w-3xl drop-shadow-md">
            {headingText}
          </h2>
          {subheading && (
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-2xl font-light drop-shadow-sm">
              {subheading}
            </p>
          )}
        </div>
      )}

      {/* Visual elements */}
      <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-r from-white/0 via-white/10 to-white/0"></div>
    </div>
  )
}

// Loading skeleton displayed while video metadata loads
const VideoSkeleton: React.FC = () => (
  <div className="my-8">
    <div className="rounded-lg overflow-hidden shadow-lg bg-gray-100 animate-pulse">
      <div className="aspect-video bg-gray-200 flex items-center justify-center">
        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-l-[12px] border-l-gray-400 border-y-[8px] border-y-transparent ml-1"></div>
        </div>
      </div>
    </div>
  </div>
)

// Optimized video component with progressive loading and error handling
const OptimizedVideo: React.FC<{
  videoUrl: string
  caption?: string
  autoplay?: boolean
  muted?: boolean
  controls?: boolean
  loop?: boolean
}> = ({ videoUrl, caption, autoplay = false, muted = false, controls = true, loop = false }) => {
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)

  return (
    <figure className="my-8">
      <div className="rounded-lg overflow-hidden shadow-lg bg-black relative">
        {/* Loading skeleton - shown until video metadata loads */}
        {isLoading && (
          <div className="absolute inset-0 z-10">
            <VideoSkeleton />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="aspect-video bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p>Unable to load video</p>
            </div>
          </div>
        )}

        {/* Actual video element */}
        <video
          src={videoUrl}
          autoPlay={autoplay}
          muted={muted}
          controls={controls}
          loop={loop}
          preload="metadata" // Load metadata only for faster initial loading
          playsInline // Required for iOS inline playback
          className={`w-full h-auto transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          style={{ aspectRatio: '16/9' }} // Prevent layout shift
          onLoadedMetadata={() => {
            setIsLoading(false)
          }}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
          aria-label={caption || 'Video content'}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {caption && (
        <figcaption className="text-center text-gray-600 mt-3 text-sm">{caption}</figcaption>
      )}
    </figure>
  )
}

// Video block component that handles different video input types
const VideoBlock: React.FC<{
  video?: Media | string | null
  autoplay?: boolean
  muted?: boolean
  controls?: boolean
  loop?: boolean
}> = ({ video, autoplay = false, muted = false, controls = true, loop = false }) => {
  const videoUrl = typeof video === 'string' ? video : (video as Media | null)?.url
  const videoObj = typeof video === 'string' ? null : video
  const caption = videoObj?.caption

  if (!videoUrl) {
    return (
      <div className="my-8 p-6 bg-gray-50 border border-gray-300 rounded-lg text-center">
        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-600">Video not available</p>
      </div>
    )
  }

  // Video element handles its own loading states
  return (
    <OptimizedVideo
      videoUrl={videoUrl}
      caption={caption || undefined}
      autoplay={autoplay}
      muted={muted}
      controls={controls}
      loop={loop}
    />
  )
}

// PDF Block Component
const PDFBlock: React.FC<{
  pdf?: Media | string | null
  showDownloadButton?: boolean
  showPreview?: boolean
  previewHeight?: number
}> = ({ pdf, showDownloadButton = true, showPreview = true, previewHeight = 600 }) => {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    // Detect mobile devices
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
      return mobileRegex.test(userAgent) || window.innerWidth <= 768
    }

    setIsMobile(checkMobile())

    // Listen for resize to handle orientation changes
    const handleResize = () => setIsMobile(checkMobile())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const pdfUrl = typeof pdf === 'string' ? pdf : pdf?.url
  const pdfObj = typeof pdf === 'string' ? null : pdf
  const fileName = pdfObj?.filename || 'Document'
  const caption = pdfObj?.caption
  const fileSize = pdfObj?.filesize ? `${Math.round(pdfObj.filesize / 1024)} KB` : null

  if (!pdfUrl) {
    return (
      <div className="my-8 p-6 bg-slate-50 border border-slate-200 rounded-lg text-center">
        <p className="text-slate-600">PDF document not available</p>
      </div>
    )
  }

  return (
    <div className="my-8 border border-slate-200 rounded-lg overflow-hidden shadow-md">
      {/* Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h3 className="font-medium text-slate-900">{fileName}</h3>
              {caption && <p className="text-sm text-slate-600 mt-1">{caption}</p>}
              {fileSize && <p className="text-xs text-slate-500 mt-0.5">{fileSize}</p>}
            </div>
          </div>

          <div className="flex gap-2">
            {/* View button - always available */}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View
            </a>

            {/* Download button - only if explicitly allowed */}
            {showDownloadButton && (
              <a
                href={pdfUrl}
                download
                className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            )}
          </div>
        </div>
      </div>

      {/* PDF Preview */}
      {showPreview && (
        <div className="bg-white">
          {isMobile ? (
            // Mobile-friendly PDF viewer
            <div className="p-8 text-center bg-slate-50">
              <div className="max-w-sm mx-auto">
                <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
                  <FileText className="h-10 w-10 text-red-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">PDF Document</h4>
                <p className="text-sm text-slate-600 mb-6">
                  PDF previews aren&apos;t supported on mobile devices.
                  {fileSize && ` (File size: ${fileSize})`}
                </p>

                {/* Only show buttons if download is allowed */}
                {showDownloadButton && (
                  <div className="space-y-3">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-3 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <ExternalLink className="h-4 w-4 inline mr-2" />
                      Open in Browser
                    </a>
                    <a
                      href={pdfUrl}
                      download
                      className="block w-full px-4 py-3 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                    >
                      <Download className="h-4 w-4 inline mr-2" />
                      Download PDF
                    </a>
                  </div>
                )}

                {showDownloadButton && (
                  <p className="text-xs text-slate-500 mt-4">
                    Tip: Use &ldquo;Open in Browser&rdquo; to view in your device&apos;s PDF viewer
                  </p>
                )}

                {/* If download not allowed, show message */}
                {!showDownloadButton && (
                  <p className="text-sm text-slate-500 italic">This document is for viewing only</p>
                )}
              </div>
            </div>
          ) : (
            // Desktop iframe preview
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              width="100%"
              height={previewHeight}
              className="border-0"
              title={fileName}
              loading="lazy"
            >
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 mb-4">Your browser does not support PDF previews.</p>

                {/* Only show fallback buttons if download is allowed */}
                {showDownloadButton && (
                  <div className="space-y-2">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 mr-2 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open PDF
                    </a>
                    <a
                      href={pdfUrl}
                      download
                      className="inline-flex items-center px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </div>
                )}
              </div>
            </iframe>
          )}
        </div>
      )}
    </div>
  )
}

// This component will map blockType to the actual rendering component
export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, hideTextOverlay }) => {
  switch (block.blockType?.toLowerCase()) {
    case 'richtext':
    case 'richText':
      // Try different property names that Payload CMS might use for rich text content
      const richtextContent = block.content || block.text || block.value || block.richText || block
      return <RichTextBlock content={richtextContent} />
    case 'image':
      return <ImageBlock image={block.image} altText={block.alt} />
    case 'video':
      return (
        <VideoBlock
          video={block.video}
          autoplay={block.autoplay}
          muted={block.muted}
          controls={block.controls}
          loop={block.loop}
        />
      )
    case 'pdf':
      return (
        <PDFBlock
          pdf={block.pdf}
          showDownloadButton={block.showDownloadButton}
          showPreview={block.showPreview}
          previewHeight={block.previewHeight}
        />
      )
    case 'cover':
      return (
        <CoverBlock
          image={block.image}
          heading={block.heading}
          subheading={block.subheading}
          hideTextOverlay={hideTextOverlay}
        />
      )
    default:
      return (
        <div className="my-8 p-6 bg-amber-50 border border-amber-300 rounded-lg">
          <p className="font-medium text-amber-800 mb-3">
            Unsupported content block: {block.blockType}
          </p>
          <pre className="text-xs bg-white/50 p-4 rounded border border-amber-200 text-amber-700 overflow-x-auto">
            {JSON.stringify(block, null, 2)}
          </pre>
        </div>
      )
  }
}
