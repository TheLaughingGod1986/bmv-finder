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
    domains: [
      'images.unsplash.com', 
      'via.placeholder.com',
      // Property website image domains
      'st.zoocdn.com',                    // Zoopla images
      'media.rightmove.co.uk',            // Rightmove images
      'images.zoopla.co.uk',              // Zoopla images (alternative)
      'media.onthemarket.com',            // OnTheMarket images
      'media.primelocation.com',          // PrimeLocation images
      'media.zoopla.co.uk',               // Zoopla media
      'images.rightmove.co.uk',           // Rightmove images (alternative)
      'zoopla-static.akamaized.net',      // Zoopla CDN
      'rightmove-static.akamaized.net',   // Rightmove CDN
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    // Disable image optimization for external images to avoid CORS issues
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Remote patterns for better external image handling
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'st.zoocdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.rightmove.co.uk',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.zoopla.co.uk',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.onthemarket.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.primelocation.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'zoopla-static.akamaized.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rightmove-static.akamaized.net',
        port: '',
        pathname: '/**',
      },
    ],
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

