import { Block } from 'payload'

export const Video: Block = {
  slug: 'video',
  labels: {
    singular: 'Video',
    plural: 'Videos',
  },
  fields: [
    {
      name: 'video',
      type: 'upload',
      label: 'Video File',
      relationTo: 'media',
      required: true,
      filterOptions: {
        mimeType: { contains: 'video' },
      },
      admin: {
        description: 'Upload a video file (MP4, WebM, etc.)',
      },
    },
    {
      name: 'autoplay',
      type: 'checkbox',
      label: 'Autoplay',
      defaultValue: false,
      admin: {
        description:
          'Whether the video should start playing automatically (note: most browsers require videos to be muted for autoplay)',
      },
    },
    {
      name: 'muted',
      type: 'checkbox',
      label: 'Muted',
      defaultValue: false,
      admin: {
        description: 'Whether the video should be muted by default',
      },
    },
    {
      name: 'controls',
      type: 'checkbox',
      label: 'Show Controls',
      defaultValue: true,
      admin: {
        description: 'Whether to show video player controls (play, pause, volume, etc.)',
      },
    },
    {
      name: 'loop',
      type: 'checkbox',
      label: 'Loop',
      defaultValue: false,
      admin: {
        description: 'Whether the video should loop continuously',
      },
    },
  ],
}
