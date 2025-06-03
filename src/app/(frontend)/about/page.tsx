import React from 'react'
import type { Metadata } from 'next'
import { AboutHero } from '@/components/about/AboutHero'
import { AboutContent } from '@/components/about/AboutContent'
import { OurPlatforms } from '@/components/about/OurPlatforms'

export const metadata: Metadata = {
  title: 'About Us - Dawan Media Group',
  description:
    'Learn about Dawan Media Group, a dynamic media company established in 2023, dedicated to covering the Horn of Africa region with comprehensive news, analysis, and cultural stories.',
  openGraph: {
    title: 'About Us - Dawan Media Group',
    description:
      'Uncovering the Continent — Through Its Own Lens. Learn about our mission, platforms, and commitment to connecting communities across languages and borders.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us - Dawan Media Group',
    description:
      'Learn about Dawan Media Group and our mission to inform, engage, and connect communities across the Horn of Africa.',
  },
  keywords: [
    'Dawan Media Group',
    'About Us',
    'Horn of Africa',
    'Somali News',
    'African Media',
    'Dawan TV',
    'Dawan Africa',
    'Bawabah Africa',
    'Somalia',
    'Ethiopia',
    'Kenya',
    'Djibouti',
    'Eritrea',
  ],
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <AboutHero />

      {/* Main Content Section */}
      <AboutContent />

      {/* Our Platforms Section */}
      <OurPlatforms />
    </div>
  )
}
