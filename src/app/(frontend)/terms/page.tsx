import React from 'react'
import type { Metadata } from 'next'
import TermsAndConditions from '@/components/terms/TermsAndConditions'

export const metadata: Metadata = {
  title: 'Terms and Conditions | Dawan Africa',
  description:
    'Terms and Conditions for Dawan Africa - Learn about our terms of service, user accounts, subscription policies, and acceptable use guidelines.',
  openGraph: {
    title: 'Terms and Conditions | Dawan Africa',
    description:
      'Terms and Conditions for Dawan Africa - Learn about our terms of service, user accounts, subscription policies, and acceptable use guidelines.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms and Conditions | Dawan Africa',
    description:
      'Terms and Conditions for Dawan Africa - Learn about our terms of service, user accounts, subscription policies, and acceptable use guidelines.',
  },
}

const TermsAndConditionsPage: React.FC = () => {
  return <TermsAndConditions />
}

export default TermsAndConditionsPage
