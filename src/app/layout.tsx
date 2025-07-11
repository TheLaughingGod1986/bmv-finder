import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";
import { ToastProvider } from './components/ToastProvider';
import Navigation from './components/Navigation';
import ResponsiveHeader from './components/ResponsiveHeader';
// import AnchorLinks from './components/AnchorLinks';
import SupabaseUserProvider from './components/SupabaseUserProvider';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "UK Property Prices | Search House Prices & Market Trends",
  description: "Instantly search and analyze UK sold house prices using the latest Land Registry data. View historical property data, market trends, and regional price analysis for free. Your go-to tool for property research.",
  keywords: "sold property prices, uk house prices, land registry data, property price check, house price trends, property market analysis, property valuation, real estate data",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UK Property Prices"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: "no",
  themeColor: "#3b82f6"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta property="og:title" content="UK Property Prices" />
        <meta property="og:description" content="View UK Land Registry sold property prices, trends, and analytics in a modern, mobile-friendly interface." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/" />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="UK Property Prices" />
        <meta name="twitter:description" content="View UK Land Registry sold property prices, trends, and analytics in a modern, mobile-friendly interface." />
        <meta name="twitter:image" content="/og-image.png" />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="UK Property Prices" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="UK Property Prices" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3b82f6" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-white text-gray-900`}>
        <a href="#main-content" className="sr-only focus:not-sr-only absolute left-2 top-2 bg-blue-600 text-white px-3 py-1 rounded z-50">Skip to main content</a>
        <SupabaseUserProvider>
          <Navigation />
          <ResponsiveHeader />
          {/* <AnchorLinks /> */}
          <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#F5F5DC]">
            <ToastProvider>
              {children}
            </ToastProvider>
          </main>
        </SupabaseUserProvider>
        <Analytics />
        <SpeedInsights />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  // navigator.serviceWorker.register('/sw.js')
                });
              }
            `,
          }}
        ></script>
        {/* Unregister all service workers for all users */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  registrations.forEach(function(registration) {
                    registration.unregister();
                  });
                });
              }
            `,
          }}
        ></script>
      </body>
    </html>
  );
}
