import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Property Intelligence Platform',
  description: 'Privacy Policy for Property Intelligence Platform. Learn how we collect, use, and protect your personal information when using our property investment research services.',
  keywords: 'privacy policy, data protection, personal information, property platform privacy, GDPR compliance, user data privacy, property investment privacy',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/privacy`,
  },
  openGraph: {
    title: 'Privacy Policy | Property Intelligence Platform',
    description: 'Privacy Policy for Property Intelligence Platform. Learn how we collect, use, and protect your personal information.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/privacy`,
    siteName: 'Property Intelligence Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Property Intelligence Platform Privacy Policy',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Property Intelligence Platform',
    description: 'Privacy Policy for Property Intelligence Platform.',
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