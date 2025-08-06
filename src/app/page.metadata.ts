export const metadata = {
  title: 'Property Intelligence Platform | AI-Powered Investment Research',
  description: 'Access 25 million property sales, AI-powered BMV analysis, and professional tools to make smarter property investment decisions.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/`,
  },
  openGraph: {
    title: 'Property Intelligence Platform | AI-Powered Investment Research',
    description: 'Access 25 million property sales, AI-powered BMV analysis, and professional tools to make smarter property investment decisions.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/`,
    siteName: 'Property Intelligence Platform',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Property Intelligence Platform',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Property Intelligence Platform | AI-Powered Investment Research',
    description: 'Access 25 million property sales, AI-powered BMV analysis, and professional tools to make smarter property investment decisions.',
    images: ['/icon-512.png'],
    site: '@propertyintelligence',
  },
}; 