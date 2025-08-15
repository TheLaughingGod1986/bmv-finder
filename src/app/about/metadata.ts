import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Property Intelligence Platform',
  description: 'Learn about Property Intelligence Platform - the leading AI-powered property investment research platform. Discover our mission, team, and commitment to data-driven property investment decisions.',
  keywords: 'about us, property intelligence platform, property investment platform, AI property analysis, UK property data, property investment team, property research platform',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/about`,
  },
  openGraph: {
    title: 'About Property Intelligence Platform | AI-Powered Investment Research',
    description: 'Learn about Property Intelligence Platform - the leading AI-powered property investment research platform. Discover our mission, team, and commitment to data-driven property investment decisions.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/about`,
    siteName: 'Property Intelligence Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'About Property Intelligence Platform - AI-Powered Investment Research',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Property Intelligence Platform | AI-Powered Investment Research',
    description: 'Learn about Property Intelligence Platform - the leading AI-powered property investment research platform.',
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