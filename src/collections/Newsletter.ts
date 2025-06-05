import type { CollectionConfig } from 'payload'

export const Newsletter: CollectionConfig = {
  slug: 'newsletter',
  labels: {
    singular: 'Newsletter Subscription',
    plural: 'Newsletter Subscriptions',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'status', 'subscribedAt', 'source'],
    group: 'Marketing',
  },
  access: {
    // Only admins can view newsletter subscriptions
    read: ({ req: { user } }) => {
      return Boolean(user?.roles?.includes('admin'))
    },
    create: () => true, // Allow public subscription via API
    update: ({ req: { user } }) => {
      return Boolean(user?.roles?.includes('admin'))
    },
    delete: ({ req: { user } }) => {
      return Boolean(user?.roles?.includes('admin'))
    },
  },
  hooks: {
    beforeChange: [
      ({ operation, data, originalDoc }) => {
        // Set subscribedAt timestamp when creating a new subscription
        if (operation === 'create' && !data.subscribedAt) {
          data.subscribedAt = new Date().toISOString()
        }

        // Set unsubscribedAt timestamp when status changes to 'unsubscribed'
        if (operation === 'update' && data.status === 'unsubscribed') {
          // Only set unsubscribedAt if it's not already set and the status is actually changing
          if (!data.unsubscribedAt && originalDoc?.status !== 'unsubscribed') {
            data.unsubscribedAt = new Date().toISOString()
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Last Name',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'subscribed',
      options: [
        {
          label: 'Subscribed',
          value: 'subscribed',
        },
        {
          label: 'Unsubscribed',
          value: 'unsubscribed',
        },
        {
          label: 'Bounced',
          value: 'bounced',
        },
        {
          label: 'Cleaned',
          value: 'cleaned',
        },
      ],
    },
    {
      name: 'source',
      type: 'select',
      label: 'Subscription Source',
      defaultValue: 'website',
      options: [
        {
          label: 'Website Popup',
          value: 'popup',
        },
        {
          label: 'Website Footer',
          value: 'footer',
        },
        {
          label: 'Website Form',
          value: 'website',
        },
        {
          label: 'Manual Import',
          value: 'import',
        },
        {
          label: 'Admin Panel',
          value: 'admin',
        },
      ],
    },
    {
      name: 'subscribedAt',
      type: 'date',
      label: 'Subscribed At',
      admin: {
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'unsubscribedAt',
      type: 'date',
      label: 'Unsubscribed At',
      admin: {
        condition: (data) => data.status === 'unsubscribed',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'preferences',
      type: 'group',
      label: 'Email Preferences',
      fields: [
        {
          name: 'frequency',
          type: 'select',
          label: 'Email Frequency',
          defaultValue: 'weekly',
          options: [
            {
              label: 'Daily',
              value: 'daily',
            },
            {
              label: 'Weekly',
              value: 'weekly',
            },
            {
              label: 'Monthly',
              value: 'monthly',
            },
          ],
        },
        {
          name: 'categories',
          type: 'array',
          label: 'Interested Categories',
          fields: [
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'blogCategories',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
