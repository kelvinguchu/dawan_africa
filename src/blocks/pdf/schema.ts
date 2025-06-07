import { Block } from 'payload'

export const PDF: Block = {
  slug: 'pdf',
  labels: {
    singular: 'PDF Document',
    plural: 'PDF Documents',
  },
  fields: [
    {
      name: 'pdf',
      type: 'upload',
      label: 'PDF File',
      relationTo: 'media',
      required: true,
      filterOptions: {
        mimeType: { equals: 'application/pdf' },
      },
      admin: {
        description: 'Upload a PDF document',
      },
    },
    {
      name: 'showDownloadButton',
      type: 'checkbox',
      label: 'Show Download Button',
      defaultValue: true,
      admin: {
        description: 'Whether to display a download button for the PDF',
      },
    },
    {
      name: 'showPreview',
      type: 'checkbox',
      label: 'Show Preview',
      defaultValue: true,
      admin: {
        description: 'Whether to show an embedded preview of the PDF (may not work on all devices)',
      },
    },
    {
      name: 'previewHeight',
      type: 'number',
      label: 'Preview Height (px)',
      defaultValue: 600,
      admin: {
        description: 'Height of the PDF preview in pixels',
        condition: (data) => data?.showPreview === true,
      },
    },
  ],
}
