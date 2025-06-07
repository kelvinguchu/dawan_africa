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
              if (node.value && typeof node.value === 'object') {
                const uploadData = node.value
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

// Video Block Component
const VideoBlock: React.FC<{
  video?: Media | string | null
  autoplay?: boolean
  muted?: boolean
  controls?: boolean
  loop?: boolean
}> = ({ video, autoplay = false, muted = false, controls = true, loop = false }) => {
  const videoUrl = typeof video === 'string' ? null : video?.url
  const videoObj = typeof video === 'string' ? null : video
  const caption = videoObj?.caption // Get caption from media object

  if (!videoUrl) {
    return (
      <div className="my-8 p-6 bg-gray-50 border border-gray-300 rounded-lg text-center">
        <p className="text-gray-600">Video not available</p>
      </div>
    )
  }

  return (
    <figure className="my-8">
      <div className="rounded-lg overflow-hidden shadow-lg bg-black">
        <video
          src={videoUrl}
          autoPlay={autoplay}
          muted={muted}
          controls={controls}
          loop={loop}
          className="w-full h-auto"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
      {caption && (
        <figcaption className="text-center text-gray-600 mt-3 text-sm">{caption}</figcaption>
      )}
    </figure>
  )
}

// PDF Block Component
const PDFBlock: React.FC<{
  pdf?: Media | string | null
  showDownloadButton?: boolean
  showPreview?: boolean
  previewHeight?: number
}> = ({ pdf, showDownloadButton = true, showPreview = true, previewHeight = 600 }) => {
  const pdfUrl = typeof pdf === 'string' ? null : pdf?.url
  const pdfObj = typeof pdf === 'string' ? null : pdf
  const fileName = pdfObj?.filename || 'Document'
  const caption = pdfObj?.caption // Get caption from media object

  if (!pdfUrl) {
    return (
      <div className="my-8 p-6 bg-gray-50 border border-gray-300 rounded-lg text-center">
        <p className="text-gray-600">PDF document not available</p>
      </div>
    )
  }

  return (
    <div className="my-8 border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h3 className="font-medium text-gray-900">{fileName}</h3>
              {caption && <p className="text-sm text-gray-600 mt-1">{caption}</p>}
            </div>
          </div>
          {showDownloadButton && (
            <a
              href={pdfUrl}
              download
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          )}
        </div>
      </div>

      {/* PDF Preview */}
      {showPreview && (
        <div className="bg-white">
          <iframe
            src={`${pdfUrl}#toolbar=1`}
            width="100%"
            height={previewHeight}
            className="border-0"
            title={fileName}
          >
            <p>
              Your browser does not support PDFs.
              <a href={pdfUrl} className="text-blue-600 hover:text-blue-800">
                Download the PDF
              </a>
            </p>
          </iframe>
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
    // Add cases for other block types like 'recentBlogPosts', etc.
    // case 'recentBlogPosts':
    //   return <RecentBlogPostsBlock posts={block.shownPosts} />;
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
