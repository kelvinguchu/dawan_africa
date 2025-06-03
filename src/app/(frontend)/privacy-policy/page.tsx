import React from 'react'
import type { Metadata } from 'next'
import PrivacyPolicy from '@/components/privacy-policy/PrivacyPolicy'

export const metadata: Metadata = {
  title: 'Privacy Policy | Dawan Africa',
  description:
    'Privacy Policy for Dawan Africa - Learn how we collect, use, and protect your personal information on our platform.',
  openGraph: {
    title: 'Privacy Policy | Dawan Africa',
    description:
      'Privacy Policy for Dawan Africa - Learn how we collect, use, and protect your personal information on our platform.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Dawan Africa',
    description:
      'Privacy Policy for Dawan Africa - Learn how we collect, use, and protect your personal information on our platform.',
  },
}

const PrivacyPolicyPage: React.FC = () => {
  return <PrivacyPolicy />
}

export default PrivacyPolicyPage
