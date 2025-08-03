import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";
import { ToastProvider } from './components/ToastProvider';
import ClientNavigation from './components/ClientNavigation';
import SupabaseUserProvider from './components/SupabaseUserProvider';
import ScrollToTop from './components/ScrollToTop';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Footer from './components/Footer';
import { SearchLimitProvider } from './components/SearchLimitContext';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "BMV Finder | Find Below Market Value Properties in the UK",
  description: "Discover below market value properties across the UK with our powerful property research platform. Access 25 million property sales, AI-powered BMV analysis, and professional tools to make smarter property investment decisions.",
  keywords: "BMV properties, below market value, property investment, UK property prices, land registry data, property analysis, investment opportunities, property market trends, property web app, mobile property search, real estate investment platform, property research, house prices, property valuation",
  authors: [{ name: "BMV Finder" }],
  creator: "BMV Finder",
  publisher: "BMV Finder",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  metadataBase: new URL('https://bmvfinder.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "BMV Finder | Find Below Market Value Properties in the UK",
    description: "Discover below market value properties across the UK with our powerful property research platform. Access 25 million property sales, AI-powered BMV analysis, and professional tools to make smarter property investment decisions.",
    url: 'https://bmvfinder.com',
    siteName: 'BMV Finder',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BMV Finder - UK Property Investment Platform & Web App',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BMV Finder | Find Below Market Value Properties in the UK',
    description: 'Discover below market value properties across the UK with our powerful property research platform. Access 25 million property sales and AI-powered BMV analysis.',
    images: ['/og-image.png'],
    creator: '@bmvfinder',
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
    google: 'your-google-verification-code',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'BMV Finder',
    'application-name': 'BMV Finder',
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
        <meta name="application-name" content="BMV Finder" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BMV Finder" />
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
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        {/* Organization & Product JSON-LD Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "BMV Finder",
            "url": "https://bmvfinder.com",
            "logo": "https://bmvfinder.com/icon-192.png",
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
            "name": "BMV Finder Property Insights Platform",
            "image": [
              "https://bmvfinder.com/og-image.png"
            ],
            "description": "Instantly analyze UK property prices, BMV opportunities, and market trends. Compare plans for investors, buyers, and professionals.",
            "brand": {
              "@type": "Brand",
              "name": "BMV Finder"
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
          <SearchLimitProvider>
            <ClientNavigation />
            <main 
              id="main-content" 
              tabIndex={-1} 
              className="min-h-screen bg-neutral-light relative"
            >
              <ToastProvider>
                {children}
              </ToastProvider>
            </main>
            <Footer />
            <ScrollToTop />
            <PWAInstallPrompt />
          </SearchLimitProvider>
        </SupabaseUserProvider>
        <Analytics />
        <SpeedInsights />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
