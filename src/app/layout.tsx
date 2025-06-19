import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Sold Property Prices",
  description: "View UK Land Registry sold property prices, trends, and analytics in a modern, mobile-friendly interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta property="og:title" content="Sold Property Prices" />
        <meta property="og:description" content="View UK Land Registry sold property prices, trends, and analytics in a modern, mobile-friendly interface." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/" />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sold Property Prices" />
        <meta name="twitter:description" content="View UK Land Registry sold property prices, trends, and analytics in a modern, mobile-friendly interface." />
        <meta name="twitter:image" content="/og-image.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only absolute left-2 top-2 bg-blue-600 text-white px-3 py-1 rounded z-50">Skip to main content</a>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
