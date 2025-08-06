import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Product Roadmap | Property Intelligence Platform',
  description: 'Explore our product roadmap and upcoming features for Property Intelligence Platform. See what we\'re building next to enhance your property investment research and analysis capabilities.',
  keywords: 'product roadmap, property platform features, upcoming features, property investment tools, AI property analysis roadmap, property research platform development',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/roadmap`,
  },
  openGraph: {
    title: 'Product Roadmap | Property Intelligence Platform',
    description: 'Explore our product roadmap and upcoming features for Property Intelligence Platform. See what we\'re building next to enhance your property investment research.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/roadmap`,
    siteName: 'Property Intelligence Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Property Intelligence Platform Product Roadmap',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Product Roadmap | Property Intelligence Platform',
    description: 'Explore our product roadmap and upcoming features for Property Intelligence Platform.',
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