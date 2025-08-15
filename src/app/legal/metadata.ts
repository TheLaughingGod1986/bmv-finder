import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal Information | Property Intelligence Platform',
  description: 'Legal information and disclaimers for Property Intelligence Platform. Important information about our services, data sources, and terms of use for property investment research.',
  keywords: 'legal information, property platform legal, investment disclaimers, property data legal, terms of service, privacy policy, property investment legal',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/legal`,
  },
  openGraph: {
    title: 'Legal Information | Property Intelligence Platform',
    description: 'Legal information and disclaimers for Property Intelligence Platform. Important information about our services and terms of use.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/legal`,
    siteName: 'Property Intelligence Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Property Intelligence Platform Legal Information',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legal Information | Property Intelligence Platform',
    description: 'Legal information and disclaimers for Property Intelligence Platform.',
    images: ['/og-image.png'],
    creator: '@propertyintelligence',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}; 