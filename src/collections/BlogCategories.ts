import { CollectionConfig } from 'payload'

export const BlogCategories: CollectionConfig = {
  slug: 'blogCategories',
  admin: {
    useAsTitle: 'name',
    group: 'Content Management',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
