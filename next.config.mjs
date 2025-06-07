import { withPayload } from '@payloadcms/next/withPayload'
import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
}

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // disable: process.env.NODE_ENV === 'development',
  importScripts: ['/index.js'],
  fallbacks: {
    image: '/favicon.png',
    document: '/offline.html',
  },
})

export default withPWAConfig(withPayload(nextConfig, { devBundleServerPackages: false }))
