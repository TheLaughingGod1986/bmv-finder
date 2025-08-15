import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Property Intelligence Platform',
  description: 'Terms of Service for Property Intelligence Platform. Read our terms and conditions for using our property investment research and analysis services.',
  keywords: 'terms of service, terms and conditions, property platform terms, user agreement, property investment terms, platform usage terms',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/terms`,
  },
  openGraph: {
    title: 'Terms of Service | Property Intelligence Platform',
    description: 'Terms of Service for Property Intelligence Platform. Read our terms and conditions for using our property investment research services.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/terms`,
    siteName: 'Property Intelligence Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Property Intelligence Platform Terms of Service',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Property Intelligence Platform',
    description: 'Terms of Service for Property Intelligence Platform.',
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