'use client'
import React, { useEffect, useState } from 'react'
import { useFormFields } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import type { BlogPost } from '@/payload-types'

const BlogPostPreview: UIFieldClientComponent = () => {
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get the blogPost field value from the form
  const blogPostField = useFormFields(([fields]) => fields.blogPost)

  useEffect(() => {
    const fetchBlogPost = async () => {
      const blogPostId = blogPostField?.value

      if (!blogPostId) {
        setBlogPost(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Fetch the blog post data using Payload's API
        const response = await fetch(`/api/blogPosts/${blogPostId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch blog post')
        }

        const data = await response.json()
        setBlogPost(data)
      } catch (err) {
        console.error('Error fetching blog post for preview:', err)
        setError('Failed to load blog post preview')
      } finally {
        setLoading(false)
      }
    }

    fetchBlogPost()
  }, [blogPostField?.value])

  if (!blogPostField?.value) {
    return null
  }

  if (loading) {
    return (
      <div className="field-type ui">
        <div
          style={{
            padding: '16px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
            📄 Blog Post Preview
          </h3>
          <div style={{ color: '#666', fontStyle: 'italic' }}>Loading blog post preview...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="field-type ui">
        <div
          style={{
            padding: '16px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: '#fef2f2',
          }}
        >
          <h3
            style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#dc2626' }}
          >
            ❌ Preview Error
          </h3>
          <div style={{ color: '#dc2626' }}>{error}</div>
        </div>
      </div>
    )
  }

  if (!blogPost) {
    return null
  }

  // Safely extract content preview from the layout blocks
  const getContentPreview = (layout: BlogPost['layout']): string => {
    if (!layout || !Array.isArray(layout)) {
      return 'No content available'
    }

    try {
      // Find the first richtext block
      const richtextBlock = layout.find((block) => block.blockType === 'richtext')

      if (!richtextBlock || richtextBlock.blockType !== 'richtext') {
        return 'No text content found'
      }

      const content = richtextBlock.content

      if (!content?.root?.children) {
        return 'No content available'
      }

      // Extract text from the rich text content
      let text = ''
      const extractText = (node: any) => {
        if (node.text) text += node.text + ' '
        if (node.children) node.children.forEach(extractText)
      }

      content.root.children.forEach(extractText)
      const cleanText = text.trim()

      return cleanText.length > 200
        ? `${cleanText.substring(0, 200)}...`
        : cleanText || 'No text content'
    } catch (err) {
      console.error('Error extracting content preview:', err)
      return 'Unable to preview content'
    }
  }

  const contentPreview = getContentPreview(blogPost.layout)

  // Safely get author information
  const getAuthorName = (author: BlogPost['author']): string => {
    if (typeof author === 'string') {
      return 'Author ID: ' + author
    }
    if (typeof author === 'object' && author) {
      return author.name || author.email || 'Unknown Author'
    }
    return 'Unknown Author'
  }

  const authorName = getAuthorName(blogPost.author)

  return (
    <div className="field-type ui">
      <div
        style={{
          padding: '16px',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
          📄 Blog Post Preview
        </h3>

        <div style={{ marginBottom: '12px' }}>
          <strong style={{ color: '#333', fontSize: '18px' }}>
            {blogPost.name || 'Untitled Post'}
          </strong>
        </div>

        {blogPost.slug && (
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>
            <strong>Slug:</strong> /{blogPost.slug}
          </div>
        )}

        <div
          style={{
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            lineHeight: '1.5',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
            CONTENT PREVIEW:
          </div>
          <div style={{ color: '#333' }}>{contentPreview}</div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            fontSize: '14px',
            color: '#666',
          }}
        >
          <div>
            <strong>Author:</strong> {authorName}
          </div>
          <div>
            <strong>Status:</strong>
            <span
              style={{
                marginLeft: '4px',
                padding: '2px 6px',
                backgroundColor: blogPost.status === 'published' ? '#22c55e' : '#f59e0b',
                color: 'white',
                borderRadius: '3px',
                fontSize: '12px',
              }}
            >
              {blogPost.status === 'published' ? '🚀 Published' : '⏳ Pending'}
            </span>
          </div>
          <div>
            <strong>Created:</strong> {new Date(blogPost.createdAt).toLocaleDateString()}
          </div>
          <div>
            <strong>Updated:</strong> {new Date(blogPost.updatedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Additional metadata */}
        {(blogPost.views || blogPost.likes) && (
          <div
            style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #e0e0e0',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '14px',
              color: '#666',
            }}
          >
            {blogPost.views && (
              <div>
                <strong>Views:</strong> {blogPost.views.toLocaleString()}
              </div>
            )}
            {blogPost.likes && (
              <div>
                <strong>Likes:</strong> {blogPost.likes.toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogPostPreview
