import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Media Management',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt Text',
      admin: {
        description: 'Alternative text for images (important for accessibility)',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      admin: {
        description: 'Optional caption for the media file',
      },
    },
  ],
  upload: {
    // Allow images, videos, and PDF files
    mimeTypes: [
      'image/*',
      'video/*',
      'application/pdf',
      // Specific video formats for better browser support
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
    ],
    // For images, generate thumbnails
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
  },
  hooks: {
    beforeValidate: [
      ({ req }) => {
        // Add size validation based on file type
        if (req.file) {
          const { mimetype, size } = req.file

          // Different size limits for different file types
          if (mimetype?.startsWith('image/') && size > 20000000) {
            // 20MB for images
            throw new Error('Image files must be smaller than 20MB')
          }

          if (mimetype?.startsWith('video/') && size > 300000000) {
            // 300MB for videos
            throw new Error('Video files must be smaller than 300MB')
          }

          if (mimetype === 'application/pdf' && size > 50000000) {
            // 50MB for PDFs
            throw new Error('PDF files must be smaller than 50MB')
          }
        }
      },
    ],
  },
}
