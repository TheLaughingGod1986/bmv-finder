/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
  
  // Security headers
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';

    // Comprehensive Content Security Policy for all external libraries and services
    // 
    // External services included:
    // - Stripe: Payment processing (js.stripe.com, api.stripe.com, hooks.stripe.com)
    // - Google Analytics: Analytics tracking (googletagmanager.com, google-analytics.com)
    // - Vercel: Performance monitoring (vercel-scripts.com, vercel-insights.com)
    // - Google Fonts: Typography (fonts.googleapis.com, fonts.gstatic.com)
    // - Google Maps: Location services (maps.googleapis.com, maps.gstatic.com)
    // - External APIs: Postcodes.io, Land Registry, EPC, ONS, Elasticsearch
    // - Image services: Unsplash, placeholder images
    // - Development: unsafe-eval and unsafe-inline for development mode only
    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value: isDev
          ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://www.google.com https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; img-src 'self' data: https: blob: https://images.unsplash.com https://via.placeholder.com https://maps.googleapis.com https://maps.gstatic.com; worker-src 'self' blob:; connect-src 'self' https: wss: https://api.stripe.com https://api.postcodes.io https://landregistry.data.gov.uk https://epc.opendatacommunities.org https://www.ons.gov.uk https://5210a2528e1a499e8b6ee0214cd4fbca.us-central1.gcp.cloud.es.io https://vitals.vercel-insights.com https://va.vercel-scripts.com https://www.google-analytics.com https://www.googletagmanager.com https://maps.googleapis.com https://maps.gstatic.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self';"
          : "default-src 'self'; script-src 'self' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://www.google.com https://maps.googleapis.com; style-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; img-src 'self' data: https: blob: https://images.unsplash.com https://via.placeholder.com https://maps.googleapis.com https://maps.gstatic.com; worker-src 'self' blob:; connect-src 'self' https: wss: https://api.stripe.com https://api.postcodes.io https://landregistry.data.gov.uk https://epc.opendatacommunities.org https://www.ons.gov.uk https://5210a2528e1a499e8b6ee0214cd4fbca.us-central1.gcp.cloud.es.io https://vitals.vercel-insights.com https://va.vercel-scripts.com https://www.google-analytics.com https://www.googletagmanager.com https://maps.googleapis.com https://maps.gstatic.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self';"
      }
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './src'),
    };

    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Rewrites
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health-check',
      },
    ];
  },
};

module.exports = nextConfig;
