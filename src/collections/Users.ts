import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    forgotPassword: {
      generateEmailHTML: (args: any) => {
        const { req, token, user } = args || {}

        // Escape HTML entities to prevent XSS
        const escapeHtml = (unsafe: string): string => {
          return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
        }

        // Provide fallback URL if environment variable is not set
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dawan.africa'

        // Sanitize token (should be safe but ensure it's properly encoded)
        const safeToken = encodeURIComponent(token || '')
        const resetPasswordURL = `${baseUrl}/reset-password?token=${safeToken}`

        // Escape user email for safe HTML embedding
        const safeUserEmail = escapeHtml(user?.email || 'Unknown User')

        return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Dawan Africa</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <img src="https://dawan.africa/dark-mode-logo.png" alt="Dawan Africa" style="max-width: 200px; height: auto;">
    </div>
    
    <!-- Content -->
    <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #2aaac6; text-align: center; margin-bottom: 24px; font-size: 28px;">Reset Your Password</h1>
      
      <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">We received a request to reset the password for your Dawan Africa account associated with <strong>${safeUserEmail}</strong>.</p>
      
      <p style="font-size: 16px; margin-bottom: 30px;">Click the button below to reset your password. This link will expire in 1 hour for security reasons.</p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${resetPasswordURL}" style="background: linear-gradient(135deg, #2aaac6 0%, #1e90a6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(42, 170, 198, 0.3);">Reset My Password</a>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-bottom: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 14px; color: #2aaac6; word-break: break-all; background-color: #f1f5f9; padding: 12px; border-radius: 4px; margin-bottom: 30px;">${escapeHtml(resetPasswordURL)}</p>
      
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
      
      <p style="font-size: 16px; margin-bottom: 8px;">Best regards,</p>
      <p style="font-size: 16px; margin-bottom: 0; font-weight: 600; color: #2aaac6;">The Dawan Africa Team</p>
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
      <p style="margin: 8px 0;">
        <strong>Dawan Africa</strong><br>
        Uncovering the Continent — Through Its Own Lens
      </p>
      <p style="margin: 8px 0;">
        Marinio Rd, Mogadishu, Somalia<br>
        <a href="mailto:info@dawan.africa" style="color: #2aaac6; text-decoration: none;">info@dawan.africa</a> | 
        <a href="https://dawan.africa" style="color: #2aaac6; text-decoration: none;">dawan.africa</a>
      </p>
      <p style="margin: 16px 0 0 0; font-size: 11px; color: #94a3b8;">
        This email was sent because a password reset was requested for your account.<br>
        If you did not request this, please contact our support team.
      </p>
    </div>
  </body>
</html>
        `
      },
      generateEmailSubject: (args: any) => {
        const { req, user } = args || {}
        return `Reset Your Password - Dawan Africa`
      },
    },
  },
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
