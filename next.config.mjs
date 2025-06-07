import { withPayload } from '@payloadcms/next/withPayload'
import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  // Video and media optimization
  async headers() {
    return [
      {
        // Apply headers to all video files
        source: '/(.*\\.(?:mp4|webm|avi|mov|wmv|flv|mkv|m4v))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // Cache videos for 1 year
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes', // Enable range requests for video streaming
          },
          {
            key: 'Content-Type',
            value: 'video/mp4', // Ensure proper MIME type
          },
        ],
      },
      {
        // Optimize for streaming requests
        source: '/:path*',
        headers: [
          {
            key: 'X-Accel-Buffering',
            value: 'no', // Disable buffering for streaming
          },
        ],
      },
    ]
  },
  // Optimize image and video delivery
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS domains for flexibility
      },
    ],
    formats: ['image/webp', 'image/avif'], // Use modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2678400, // 31 days
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
