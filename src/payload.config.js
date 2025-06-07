import { uploadthingStorage } from '@payloadcms/storage-uploadthing'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { resendAdapter } from '@payloadcms/email-resend'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { BlogPost } from './collections/BlogPosts'
import { BlogCategories } from './collections/BlogCategories'
import { Staging } from './collections/Staging'
import { Newsletter } from './collections/Newsletter'
import { NewsletterCampaigns } from './collections/NewsletterCampaigns'

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/* -------------------------------------------------------------------------- */
/*                           Main Payload configuration                        */
/* -------------------------------------------------------------------------- */

export default buildConfig({
  /* ------------------------------ Admin panel ----------------------------- */
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- Dawan Africa',
      favicon: '/favicon.png',
      ogImage: '/og-default.png',
      icons: [
        {
          rel: 'icon',
          type: 'image/png',
          url: '/favicon.png',
        },
      ],
    },
    components: {
      graphics: {
        Logo: './components/admin/Logo.tsx',
        Icon: './components/admin/Icon.tsx',
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },

  /* ------------------------------- Content ------------------------------- */
  collections: [Users, Media, BlogPost, BlogCategories, Staging, Newsletter, NewsletterCampaigns],
  editor: lexicalEditor(),

  /* ----------------------------- Misc settings ---------------------------- */
  secret: process.env.PAYLOAD_SECRET ?? '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  /* --------------------------------- Mongo -------------------------------- */
  db: mongooseAdapter({
    url: process.env.DATABASE_URI ?? '',
    /**
     * Disable long‑running multi‑collection transactions so that large
     * uploads do not time‑out with `NoSuchTransaction` (code 251).
     * If you need ACID transactions elsewhere, set this to `true` and add
     * `disableTransaction: true` only to the Media create hook instead.
     */
    transactionOptions: false,
  }),

  /* -------------------------------- E‑mail -------------------------------- */
  email: resendAdapter({
    defaultFromAddress: 'info@dawan.africa',
    defaultFromName: 'Dawan Africa',
    apiKey: process.env.RESEND_API_KEY || '',
  }),

  /* ----------------------- Express body‑parser limits --------------------- */
  express: {
    json: { limit: '500mb' },
    urlencoded: { limit: '500mb', extended: true },
  },

  /* ---------------------- Global Payload upload limit --------------------- */
  upload: {
    limits: {
      fileSize: 300_000_000, // 300 MB in bytes
    },
  },

  /* ----------------------------- Image tooling ---------------------------- */
  sharp,

  /* -------------------------------- Plugins ------------------------------- */
  plugins: [
    /* -- UploadThing storage adapter – v3.39.1 ----------------------------- */
    uploadthingStorage({
      collections: {
        media: true, // Enable for the Media collection only
      },
      options: {
        token: process.env.UPLOADTHING_TOKEN, // Your UT secret
        acl: 'public-read',
        /**
         * Stream the binary directly from the browser → UploadThing/S3.
         * The request that reaches Payload therefore contains only JSON
         * metadata, easily within any serverless body‑size limit.
         */
        clientUploads: true,

        /**
         * Per‑type size caps (anything not listed inherits UploadThing defaults).
         * All values are human‑readable strings as documented by UploadThing.
         */
        routerInputConfig: {
          video: { maxFileSize: '300MB' },
          blob: { maxFileSize: '300MB' },
          pdf: { maxFileSize: '100MB' },
          image: { maxFileSize: '20MB' },
        },
      },
    }),

    /* -- Other plugins ----------------------------------------------------- */
    payloadCloudPlugin(),
    // storage‑adapter‑placeholder
  ],
})
