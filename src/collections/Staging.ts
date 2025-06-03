import type { CollectionConfig, Access, User } from 'payload'

// Type-safe admin checking function
const isAdmin = (user: User | null): boolean => {
  return Boolean(user?.roles?.includes('admin'))
}

// Access control functions
const adminOnlyAccess: Access = ({ req }) => {
  return isAdmin(req.user)
}

export const Staging: CollectionConfig = {
  slug: 'staging',
  labels: {
    singular: 'Staging Review',
    plural: 'Staging Reviews',
  },
  admin: {
    useAsTitle: 'blogPost',
    defaultColumns: [
      'blogPost',
      'status',
      'submittedBy',
      'submittedAt',
      'reviewedBy',
      'reviewedAt',
    ],
    listSearchableFields: ['blogPost'],
    group: 'Content Management',
    pagination: {
      defaultLimit: 25,
    },
    description:
      'Review and approve blog posts submitted by content creators. Simple workflow for content approval.',
  },
  access: {
    // Only admins can access the staging collection
    create: adminOnlyAccess,
    read: adminOnlyAccess,
    update: adminOnlyAccess,
    delete: adminOnlyAccess,
  },
  fields: [
    {
      name: 'blogPost',
      type: 'relationship',
      relationTo: 'blogPosts',
      label: 'Blog Post',
      required: true,
      maxDepth: 1,
      admin: {
        description:
          'The blog post being reviewed. Only pending posts are available for selection.',
        allowCreate: false,
      },
      filterOptions: () => {
        // Only show posts that are pending review
        return {
          status: {
            equals: 'pending',
          },
        }
      },
    },
    // Preview UI field for the selected blog post
    {
      name: 'postPreview',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/BlogPostPreview',
        },
        condition: (data) => {
          // Only show preview when a blog post is selected
          return Boolean(data?.blogPost)
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Review Status',
      defaultValue: 'pending',
      options: [
        { label: '⏳ Pending Review', value: 'pending' },
        { label: '🚀 Published', value: 'published' },
      ],
      admin: {
        description:
          'Current status of the review process. Change to Published to approve the post.',
        position: 'sidebar',
      },
      required: true,
    },
    {
      name: 'submittedAt',
      type: 'date',
      label: 'Submitted At',
      admin: {
        readOnly: true,
        description: 'When the post was submitted for review.',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      access: {
        // Only system can set submission date
        update: () => false,
      },
      hooks: {
        beforeChange: [
          ({ value, operation }) => {
            // Auto-set submission date on creation
            if (operation === 'create' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Submitted By',
      maxDepth: 1,
      admin: {
        readOnly: true,
        description: 'The content creator who submitted this post for review.',
        allowCreate: false,
      },
      access: {
        // Only system can set submittedBy field
        update: () => false,
      },
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Reviewed By',
      maxDepth: 1,
      admin: {
        description: 'The admin who reviewed this post.',
        allowCreate: false,
      },
      hooks: {
        beforeChange: [
          ({ req, value, operation }) => {
            // Auto-set reviewer to current admin user when status changes
            const user = req.user as User | null
            if (user?.roles?.includes('admin') && operation === 'update' && !value) {
              return user.id
            }
            return value
          },
        ],
      },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      label: 'Reviewed At',
      admin: {
        description: 'When the review was completed.',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      hooks: {
        beforeChange: [
          ({ value, data, operation }) => {
            // Auto-set review date when status changes to published
            if (operation === 'update' && data?.status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'workflowHistory',
      type: 'array',
      label: 'Workflow History',
      admin: {
        readOnly: true,
        description: 'Automatic log of status changes and actions.',
      },
      fields: [
        {
          name: 'action',
          type: 'text',
          required: true,
        },
        {
          name: 'performedBy',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        {
          name: 'performedAt',
          type: 'date',
          required: true,
        },
        {
          name: 'fromStatus',
          type: 'text',
        },
        {
          name: 'toStatus',
          type: 'text',
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation, originalDoc }) => {
        const user = req.user as User | null

        // Add workflow history entry for status changes
        if (operation === 'update' && user) {
          const workflowEntry = {
            action: `Status changed to ${data.status}`,
            performedBy: user.id,
            performedAt: new Date(),
            fromStatus: originalDoc?.status ?? 'unknown',
            toStatus: data.status,
          }

          data.workflowHistory ??= []
          data.workflowHistory.push(workflowEntry)
        }

        return data
      },
    ],
    afterChange: [
      // Sync staging status changes back to blog posts
      async ({ doc, previousDoc, operation, req }) => {
        const user = req.user as User | null

        // Only process for admin users and when status actually changes
        if (!user?.roles?.includes('admin') || !doc.blogPost) return doc

        const statusChanged = operation === 'update' && doc.status !== previousDoc?.status
        if (!statusChanged) return doc

        try {
          console.log(
            `🔄 [STAGING SYNC] Syncing status change: ${previousDoc?.status} → ${doc.status}`,
          )

          // Normalize blogPost to ID string (handle both string and populated object)
          const blogPostId = typeof doc.blogPost === 'string' ? doc.blogPost : doc.blogPost?.id

          if (!blogPostId) {
            console.error('❌ [STAGING SYNC] No valid blog post ID found')
            return doc
          }

          // Map staging status to blog post status
          let blogStatus: string
          switch (doc.status) {
            case 'pending':
              blogStatus = 'pending'
              break
            case 'published':
              blogStatus = 'published'
              break
            default:
              blogStatus = 'pending'
          }

          // Update the blog post status using normalized ID
          await (req.payload as any).update({
            collection: 'blogPosts',
            id: blogPostId,
            data: {
              status: blogStatus,
            },
            req,
            // Prevent infinite loop with workflow hook, but allow audio generation
            context: {
              skipWorkflowSync: true,
            },
          })

          console.log(`✅ [STAGING SYNC] Blog post status updated to: ${blogStatus}`)
        } catch (error) {
          console.error(`❌ [STAGING SYNC] Error syncing status to blog post:`, error)
          // Don't throw error to avoid breaking the staging operation
        }

        return doc
      },
    ],
  },
}
