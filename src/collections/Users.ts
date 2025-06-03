import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'User Management',
    defaultColumns: ['name', 'email', 'roles', 'subscriptionTier', 'isEmailVerified', 'createdAt'],
    listSearchableFields: ['name', 'email'],
    description:
      'Manage user accounts and roles for the blog platform. Assign content creator roles to enable post submission workflow.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Full Name',
    },
    {
      name: 'profilePicture',
      type: 'upload',
      relationTo: 'media',
      label: "User's profile picture.",
      maxDepth: 1,
      admin: {
        description: 'Upload a profile picture for the user.',
      },
    },
    {
      name: 'roles',
      type: 'select',
      label: 'User Roles',
      hasMany: true,
      defaultValue: ['user'],
      options: [
        { label: '👑 Admin', value: 'admin' },
        { label: '📊 Analyst', value: 'analyst' },
        { label: '✍️ Columnist', value: 'columnist' },
        { label: '📰 Reporter', value: 'reporter' },
        { label: '🤝 Contributor', value: 'contributor' },
        { label: '👤 User', value: 'user' },
      ],
      admin: {
        description:
          'Select the roles for this user. Content creators can write posts, admins can approve them.',
      },
      access: {
        // Only admins can assign roles during creation
        create: ({ req }) => {
          const user = req.user
          return Boolean(user?.roles?.includes('admin'))
        },
        // Only admins can modify user roles
        update: ({ req }) => {
          const user = req.user
          return Boolean(user?.roles?.includes('admin'))
        },
      },
    },
    {
      name: 'subscriptionTier',
      type: 'select',
      label: 'Subscription Tier',
      defaultValue: 'free',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Premium', value: 'premium' },
      ],
      admin: {
        description: 'User subscription level for premium content access.',
      },
    },
    {
      name: 'isEmailVerified',
      type: 'checkbox',
      label: 'Has the user verified their email address?',
      defaultValue: false,
      admin: {
        readOnly: true,
        description: 'Automatically updated when user verifies their email.',
      },
    },
    {
      name: 'favoritedPosts',
      type: 'relationship',
      relationTo: 'blogPosts',
      hasMany: true,
      label: 'Posts the user has favorited.',
      maxDepth: 0,
      admin: {
        description: 'Blog posts marked as favorites by this user.',
        allowCreate: false,
      },
    },
    {
      name: 'likedPosts',
      type: 'relationship',
      relationTo: 'blogPosts',
      hasMany: true,
      label: 'Posts the user has liked.',
      maxDepth: 0,
      admin: {
        description: 'Blog posts liked by this user.',
        allowCreate: false,
      },
    },
  ],
  access: {
    // Users can create accounts (registration)
    create: () => true,

    // Content creators and admins can read user profiles for author selection
    read: ({ req }) => {
      const user = req.user
      if (!user) return false

      // Admins can read all user profiles
      if (user.roles?.includes('admin')) {
        return true
      }

      // Content creators can read profiles of other content creators and admins for author selection
      // This allows proper display in the admin panel
      if (
        user.roles?.some((role: string) =>
          ['analyst', 'columnist', 'reporter', 'contributor'].includes(role),
        )
      ) {
        return {
          or: [
            { id: { equals: user.id } },
            { roles: { in: ['admin', 'analyst', 'columnist', 'reporter', 'contributor'] } },
          ],
        } as any
      }

      // Regular users can only read their own profile
      return { id: { equals: user.id } }
    },

    // Users can update their own profile, admins can update all
    update: ({ req }) => {
      const user = req.user
      if (!user) return false

      // Admins can update all user profiles
      if (user.roles?.includes('admin')) {
        return true
      }

      // Users can only update their own profile
      return { id: { equals: user.id } }
    },

    // Only admins can delete user accounts
    delete: ({ req }) => {
      const user = req.user
      return Boolean(user?.roles?.includes('admin'))
    },
  },
}
