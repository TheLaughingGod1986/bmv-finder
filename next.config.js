/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  // output: 'standalone',
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
  
  // ESLint configuration - ignore errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Security headers
  async headers() {
    // Only set CSP in production
    if (process.env.NODE_ENV !== 'production') return [];
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://maps.googleapis.com https://maps.gstatic.com;",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com;",
              "connect-src *;",
              "img-src * blob: data:;",
              "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com;",
              "frame-src https://js.stripe.com;"
            ].join(' ')
          }
        ]
      }
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

