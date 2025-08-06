// App Configuration
export const config = {
  // App URLs
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://propertyintelligence.com',
  
  // Support & Contact
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@propertyintelligence.com',
  legalEmail: process.env.NEXT_PUBLIC_LEGAL_EMAIL || 'legal@propertyintelligence.com',
  privacyEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL || 'privacy@propertyintelligence.com',
  
  // Social Media Links
  social: {
    twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER || 'https://twitter.com/propertyintelligence',
    linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || 'https://linkedin.com/company/propertyintelligence',
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || 'https://facebook.com/propertyintelligence',
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || 'https://instagram.com/propertyintelligence',
    github: process.env.NEXT_PUBLIC_SOCIAL_GITHUB || 'https://github.com/TheLaughingGod1986/property-intelligence-platform',
  },
  
  // External APIs
  apis: {
    postcodes: 'https://api.postcodes.io',
    ons: 'https://api.ons.gov.uk',
    landRegistry: 'https://landregistry.data.gov.uk',
    epc: 'https://epc.opendatacommunities.org',
  },
  
  // Feature Flags
  features: {
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    notifications: process.env.ENABLE_NOTIFICATIONS === 'true',
    payments: process.env.ENABLE_PAYMENTS === 'true',
    predictions: process.env.ENABLE_PREDICTIONS === 'true',
  },
  
  // Limits & Thresholds
  limits: {
    searchResults: 1000,
    maxPropertiesPerPage: 50,
    maxSavedSearches: 10,
    maxWatchlistItems: 100,
  },
  
  // Cache Settings
  cache: {
    defaultTtl: 300000, // 5 minutes
    hpiDataTtl: 3600000, // 1 hour
    propertyDataTtl: 1800000, // 30 minutes
  },
} as const;

// Type-safe config access
export type Config = typeof config; 