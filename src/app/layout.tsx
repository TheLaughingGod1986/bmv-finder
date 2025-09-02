import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";
import "./mobile.css";
import { ToastProvider } from './components/ToastProvider';
import ClientNavigation from './components/ClientNavigation';
import SupabaseUserProvider from './components/SupabaseUserProvider';
import ScrollToTop from './components/ScrollToTop';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Footer from './components/Footer';
import { SearchLimitProvider } from './components/SearchLimitContext';
import { MockAuthProvider } from './components/MockAuthProvider';
import { RealAuthProvider } from '@/lib/auth/realAuth';
import { HybridAuthProvider } from '@/lib/auth/hybridAuth';
import { ThemeProvider } from '@/lib/theme';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import MobilePerformanceMonitor from './components/MobilePerformanceMonitor';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
      title: "Property Intelligence Platform | AI-Powered Investment Research",
  description: "Discover below market value properties across the UK with our powerful property research platform. Access 25 million property sales, AI-powered BMV analysis, and professional tools to make smarter property investment decisions.",
  keywords: "BMV properties, below market value, property investment, UK property prices, land registry data, property analysis, investment opportunities, property market trends, property web app, mobile property search, real estate investment platform, property research, house prices, property valuation",
  authors: [{ name: "Property Intelligence Platform" }],
  creator: "Property Intelligence Platform",
  publisher: "Property Intelligence Platform",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'),
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  themeColor: '#3A7CA5',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BMV Finder',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'msapplication-TileColor': '#3A7CA5',
    'msapplication-config': '/browserconfig.xml',
  },
  openGraph: {
    title: "Property Intelligence Platform | AI-Powered Investment Research",
    description: "Discover below market value properties across the UK with our powerful property research platform. Access 25 million property sales, AI-powered BMV analysis, and professional tools to make smarter property investment decisions.",
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com',
    siteName: 'Property Intelligence Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Property Intelligence Platform - AI-Powered Investment Research',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Property Intelligence Platform | AI-Powered Investment Research',
    description: 'Discover below market value properties across the UK with our powerful property research platform. Access 25 million property sales and AI-powered BMV analysis.',
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
  verification: {
    // Add your Google Search Console verification code here when available
    // google: process.env.GOOGLE_VERIFICATION_CODE,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Property Intelligence Platform',
    'application-name': 'Property Intelligence Platform',
    'msapplication-TileColor': '#3A7CA5',
    'msapplication-tap-highlight': 'no',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#3A7CA5",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Property Intelligence Platform" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Property Intelligence Platform" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3A7CA5" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3A7CA5" />
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192.png" />
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3A7CA5" />
        {/* Organization & Product JSON-LD Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Property Intelligence Platform",
            "url": process.env.NEXT_PUBLIC_APP_URL || "https://bmvfinder.com",
            "logo": `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/icon-192.png`,
            "sameAs": [
              "https://twitter.com/bmvfinder"
            ],
            "description": "Professional property investment platform with BMV scoring, market analysis, and UK Land Registry data. Find below-market-value properties and make informed investment decisions."
          })
        }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Property Intelligence Platform",
            "image": [
              `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/og-image.png`
            ],
            "description": "Instantly analyze UK property prices, BMV opportunities, and market trends. Compare plans for investors, buyers, and professionals.",
            "brand": {
              "@type": "Brand",
              "name": "Property Intelligence Platform"
            },
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "0",
              "highPrice": "490",
              "priceCurrency": "GBP",
              "offerCount": 3,
              "offers": [
                {
                  "@type": "Offer",
                  "name": "Starter Plan",
                  "price": "0",
                  "priceCurrency": "GBP",
                  "availability": "https://schema.org/InStock"
                },
                {
                  "@type": "Offer",
                  "name": "Pro Plan",
                  "price": "19",
                  "priceCurrency": "GBP",
                  "availability": "https://schema.org/InStock"
                },
                {
                  "@type": "Offer",
                  "name": "Elite Plan",
                  "price": "49",
                  "priceCurrency": "GBP",
                  "availability": "https://schema.org/InStock"
                }
              ]
            }
          })
        }} />
        {/* WebSite Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Property Intelligence Platform",
            "url": process.env.NEXT_PUBLIC_APP_URL || "https://bmvfinder.com",
            "description": "AI-powered property investment research platform with BMV analysis, market trends, and UK Land Registry data.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/search?q={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Property Intelligence Platform",
              "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXT_PUBLIC_APP_URL || 'https://bmvfinder.com'}/icon-192.png`
              }
            }
          })
        }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-neutral-100 text-primary-700 leading-relaxed`}>
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only absolute left-4 top-4 bg-primary-700 text-white px-4 py-2 rounded-lg z-50 font-semibold shadow-lg transition-all duration-200 hover:bg-primary-800"
        >
          Skip to main content
        </a>
        <SupabaseUserProvider>
          <MockAuthProvider>
            <RealAuthProvider>
              <HybridAuthProvider>
                <ThemeProvider>
                  <SearchLimitProvider>
                    <ClientNavigation />
                    <main 
                      id="main-content" 
                      tabIndex={-1} 
                      className="min-h-screen bg-neutral-light dark:bg-gray-900 relative"
                    >
                      <ToastProvider>
                        {children}
                      </ToastProvider>
                    </main>
                    <Footer />
                    <ScrollToTop />
                    <PWAInstallPrompt />
                    <ServiceWorkerRegistration />
                    <MobilePerformanceMonitor />
                  </SearchLimitProvider>
                </ThemeProvider>
              </HybridAuthProvider>
            </RealAuthProvider>
          </MockAuthProvider>
        </SupabaseUserProvider>
        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
        
        {/* Service Worker Registration */}
      </body>
    </html>
  );
}
