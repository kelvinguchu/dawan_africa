import { CollectionConfig, Forbidden } from 'payload'
import type { CollectionAfterChangeHook, Access, User } from 'payload'
import { RichText } from '../blocks/richText/schema.ts'
import { Cover } from '../blocks/cover/schema.ts'
import { Image } from '../blocks/image/schema.ts'
import { Video } from '../blocks/video/schema.ts'
import { PDF } from '../blocks/pdf/schema.ts'
import slugify from 'slugify'
import { ObjectId } from 'mongodb'
import { generateAudioAfterChange, deleteAudioBeforeDelete } from '../components/audio/audioHooks'

// Define allowed content creator roles
const CONTENT_CREATOR_ROLES = ['analyst', 'columnist', 'reporter', 'contributor'] as const
const ADMIN_ROLE = 'admin' as const

// role checking functions
const isAdmin = (user: User | null): boolean => {
  return Boolean(user?.roles?.includes(ADMIN_ROLE))
}

const isContentCreator = (user: User | null): boolean => {
  return Boolean(
    user?.roles?.some((role: string) =>
      CONTENT_CREATOR_ROLES.includes(role as (typeof CONTENT_CREATOR_ROLES)[number]),
    ),
  )
}

const isAuthorizedUser = (user: User | null): boolean => {
  return isAdmin(user) || isContentCreator(user)
}

// Helper function to map blog post status to staging status
const mapBlogStatusToStagingStatus = (blogStatus: string): string => {
  switch (blogStatus) {
    case 'pending':
      return 'pending'
    case 'published':
      return 'published'
    default:
      return 'pending'
  }
}

// Access control functions with proper typing
const createAccess: Access = ({ req }) => {
  return isAuthorizedUser(req.user)
}

const readAccess: Access = ({ req }) => {
  const user = req.user

  // Admins can see all posts
  if (isAdmin(user)) {
    return true
  }

  // Content creators can see published posts + their own pending posts
  if (isContentCreator(user)) {
    return {
      or: [
        { status: { equals: 'published' } },
        {
          and: [{ status: { equals: 'pending' } }, { author: { equals: user?.id } }],
        },
      ],
    } as any
  }

  // Public users (including frontend API calls) can ONLY see published posts
  return { status: { equals: 'published' } }
}

const updateAccess: Access = ({ req }) => {
  return isAdmin(req.user)
}

const deleteAccess: Access = ({ req }) => {
  return isAdmin(req.user)
}

// Workflow management hook with proper typing
const workflowAfterChangeHook: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
  context,
}) => {
  const user = req.user

  // Skip workflow processing if this update came from staging sync or internal tasks
  if (context?.skipWorkflowSync || context?.internalTask) {
    console.log('⏭️ [WORKFLOW] Skipping workflow processing (staging sync or internal task)')
    return doc
  }

  // Only process workflow for authorized users
  if (!isAuthorizedUser(user)) {
    console.log('🚫 [WORKFLOW] Unauthorized user, skipping workflow')
    return doc
  }

  try {
    // Handle post submission - create staging entry when post is created as pending
    // Note: Admins can bypass staging by creating posts directly as 'published'
    if (operation === 'create' && doc.status === 'pending') {
      console.log(`📝 [WORKFLOW] New post "${doc.name}" submitted for review (ID: ${doc.id})`)
      console.log(`🔍 [WORKFLOW] Post author: ${doc.author}, User role: ${user?.roles}`)

      // Verify that pending posts should NOT appear on frontend
      if (doc.status === 'pending') {
        console.log(`⚠️ [WORKFLOW] CRITICAL: Post is PENDING - should NOT appear on frontend!`)
      }

      // Create staging entry for new submission - using any type to handle staging collection
      await (req.payload as any).create({
        collection: 'staging',
        data: {
          blogPost: doc.id,
          status: 'pending',
          submittedBy: doc.author,
          submittedAt: new Date(),
        },
        req,
      })
      console.log(`✅ [WORKFLOW] Staging entry created for new post "${doc.name}"`)
    }

    // Handle admin direct publishing (bypassing staging)
    if (isAdmin(user) && operation === 'create' && doc.status === 'published') {
      console.log(
        `🚀 [WORKFLOW] Admin created post "${doc.name}" directly as published (bypassing staging)`,
      )
    }

    // Handle admin status changes - update staging entry
    if (isAdmin(user) && operation === 'update' && doc.status !== previousDoc?.status) {
      console.log(
        `👑 [WORKFLOW] Admin status change detected: ${previousDoc?.status} → ${doc.status}`,
      )

      // Verify status change logic
      if (doc.status === 'published') {
        console.log(`🎉 [WORKFLOW] Post "${doc.name}" is now PUBLISHED and will appear on frontend`)
      } else if (doc.status === 'pending') {
        console.log(
          `⏸️ [WORKFLOW] Post "${doc.name}" is now PENDING and should NOT appear on frontend`,
        )
      }

      // Find staging entry for this post - using any type to handle staging collection
      const stagingResult = await (req.payload as any).find({
        collection: 'staging',
        where: {
          blogPost: { equals: doc.id },
        },
        limit: 1,
      })

      if (stagingResult.totalDocs > 0) {
        const stagingDoc = stagingResult.docs[0]
        const stagingStatus = mapBlogStatusToStagingStatus(doc.status)

        await (req.payload as any).update({
          collection: 'staging',
          id: stagingDoc.id,
          data: {
            status: stagingStatus,
            reviewedBy: user?.id,
            reviewedAt: stagingStatus === 'published' ? new Date() : undefined,
          },
          req,
        })
        console.log(`✅ [WORKFLOW] Staging entry updated: status → ${stagingStatus}`)
      }
    }
  } catch (error) {
    console.error(`❌ [WORKFLOW] Error managing staging workflow:`, error)
    // Don't throw error to avoid breaking the main operation
  }

  return doc
}

export const BlogPost: CollectionConfig = {
  slug: 'blogPosts',
  access: {
    create: createAccess,
    read: readAccess,
    update: updateAccess,
    delete: deleteAccess,
  },
  hooks: {
    afterChange: [workflowAfterChangeHook, generateAudioAfterChange],
    beforeDelete: [deleteAudioBeforeDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Title',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'This is automatically generated from the title.',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            return data?.name ? slugify(data.name, { lower: true, strict: true }) : value
          },
        ],
      },
      required: true,
    },
    {
      name: 'statusDisplay',
      type: 'text',
      label: 'Status',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Current status of your post. Contact an admin to change this.',
        condition: (data, siblingData, { user }) => {
          // Show this read-only field for content creators
          return !isAdmin(user)
        },
      },
      hooks: {
        beforeValidate: [
          ({ data }) => {
            // Always sync with the actual status field
            return data?.status === 'published' ? '🚀 Published' : '⏳ Pending Review'
          },
        ],
      },
      access: {
        create: ({ req }) => isContentCreator(req.user),
        update: () => false, // Never allow direct updates to this display field
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'pending',
      options: [
        { label: '⏳ Pending Review', value: 'pending' },
        { label: '🚀 Published', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Change the publication status of this post.',
        condition: (data, siblingData, { user }) => {
          // Show this editable field for admins only
          return isAdmin(user)
        },
      },
      access: {
        // Only admins can set status to published on creation (content creators use default 'pending')
        create: ({ req, data }) => {
          const user = req.user
          if (!user) return false

          // Admins can set any status on creation
          if (isAdmin(user)) return true

          // Content creators can only create pending posts (or use default)
          if (isContentCreator(user)) {
            return !data?.status || data.status === 'pending'
          }

          return false
        },
        // Only admins can update status - this makes it read-only for content creators
        update: ({ req }) => isAdmin(req.user),
      },
      required: true,
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Layout',
      blocks: [RichText, Cover, Image, Video, PDF],
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'blogCategories',
      hasMany: true,
      label: 'Categories',
      maxDepth: 1,
      admin: {
        position: 'sidebar',
        allowCreate: false,
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      label: 'Author',
      required: true,
      maxDepth: 1,
      admin: {
        position: 'sidebar',
        allowCreate: false,
        description:
          'Select an author from content creators and admins. Regular users are excluded.',
      },
      filterOptions: () => {
        // Exclude users who only have the 'user' role
        // Show users who have any role other than 'user' or have multiple roles
        return {
          or: [
            // Users with admin role
            { roles: { contains: 'admin' } },
            // Users with analyst role
            { roles: { contains: 'analyst' } },
            // Users with columnist role
            { roles: { contains: 'columnist' } },
            // Users with reporter role
            { roles: { contains: 'reporter' } },
            // Users with contributor role
            { roles: { contains: 'contributor' } },
          ],
        }
      },
      access: {
        // Prevent author spoofing on create
        create: ({ req, data }) => {
          const user = req.user
          if (!user) return false

          // Admins may set any author
          if (isAdmin(user)) return true

          // Content creators may *only* set themselves
          return data?.author === user.id
        },
        // Content creators can only set themselves as author, admins can set anyone
        update: ({ req, data }) => {
          const user = req.user
          if (!user) return false

          // Admins can set any author
          if (isAdmin(user)) {
            return true
          }

          // Content creators can only set themselves as author
          if (isContentCreator(user)) {
            return data?.author === user.id
          }

          return false
        },
      },
      // Even safer: always override for content creators
      hooks: {
        beforeChange: [
          ({ req }) => {
            const user = req.user
            if (isContentCreator(user)) {
              return user?.id
            }
          },
        ],
      },
    },
    {
      name: 'likes',
      type: 'number',
      label: 'Likes',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        // Only admins can update likes count
        update: ({ req }) => isAdmin(req.user),
      },
      validate: (value: any) => {
        if (typeof value === 'number' && value < 0) {
          return 'Likes cannot be negative'
        }
        return true
      },
    },
    {
      name: 'favoritesCount',
      type: 'number',
      label: 'Favorites Count',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        // Only admins can update favorites count
        update: ({ req }) => isAdmin(req.user),
      },
      validate: (value: any) => {
        if (typeof value === 'number' && value < 0) {
          return 'Favorites count cannot be negative'
        }
        return true
      },
    },
    {
      name: 'views',
      type: 'number',
      label: 'Views',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        // Only admins can update views count
        update: ({ req }) => isAdmin(req.user),
      },
      validate: (value: any) => {
        if (typeof value === 'number' && value < 0) {
          return 'Views cannot be negative'
        }
        return true
      },
    },
    {
      name: 'isEditorsPick',
      type: 'checkbox',
      label: "Editor's Pick",
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
      access: {
        // Only admins can mark posts as editor's pick
        update: ({ req }) => isAdmin(req.user),
      },
    },
    {
      name: 'audioUrl',
      type: 'text',
      label: 'Audio URL',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'URL of the generated audio file for this post.',
      },
    },
  ],
  endpoints: [
    {
      path: '/increment-view/:id',
      method: 'post',
      handler: async (req) => {
        const idFromParams = req.routeParams?.id
        if (typeof idFromParams !== 'string') {
          return Response.json({ error: 'Invalid post ID format' }, { status: 400 })
        }

        try {
          // Get the MongoDB collection through Payload's db.collections interface
          const collection = req.payload.db.collections.blogPosts.collection

          // Convert string ID to MongoDB ObjectId
          const objectId = new ObjectId(idFromParams)

          // Use MongoDB's native $inc operator for atomic increment
          // This is a single atomic operation - no read required
          const result = await collection.updateOne({ _id: objectId }, { $inc: { views: 1 } })

          if (result.matchedCount === 0) {
            return Response.json({ error: 'Post not found' }, { status: 404 })
          }

          return Response.json({
            success: true,
            message: 'View count incremented successfully',
          })
        } catch (error) {
          // Guard against BSONError by checking error name instead of import
          if (error instanceof Error && error.name === 'BSONError') {
            return Response.json({ error: 'Invalid post ID format' }, { status: 400 })
          }

          req.payload.logger.error(
            `Error incrementing view count for post ${idFromParams}: ${error instanceof Error ? error.message : String(error)}`,
          )

          if (error instanceof Forbidden) {
            return Response.json({ error: 'Forbidden' }, { status: 403 })
          }

          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  ],
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'name',
      'status',
      'author',
      'categories',
      'views',
      'isEditorsPick',
      'updatedAt',
    ],
    listSearchableFields: ['name', 'slug'],
    group: 'Content Management',
    pagination: {
      defaultLimit: 20,
    },
    description: 'Manage blog posts and content.',
  },
}
