/**
 * Centralized configuration file
 * Replace all hardcoded values with configurable options
 */

export const CONFIG = {
  // API URLs
  API: {
    BASE_URL: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`,
    ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
    PROPERTY_ENRICHMENT_URL: process.env.PROPERTY_ENRICHMENT_SERVICE_URL || 'http://localhost:3002',
  },

  // Property Valuation
  VALUATION: {
    DEFAULT_BASE_VALUE: 200000,
    HIGH_VALUE_THRESHOLD: 1000000,
    LUXURY_THRESHOLD: 2000000,
    MIN_PROPERTY_VALUE: 50000,
    MAX_PROPERTY_VALUE: 10000000,
  },

  // Regional Codes (ONS Standard)
  REGIONS: {
    NORTH_EAST: 'E12000001',
    NORTH_WEST: 'E12000002',
    YORKSHIRE_HUMBER: 'E12000003',
    EAST_MIDLANDS: 'E12000004',
    WEST_MIDLANDS: 'E12000005',
    EAST_ENGLAND: 'E12000006',
    LONDON: 'E12000007',
    SOUTH_EAST: 'E12000008',
    SOUTH_WEST: 'E12000009',
    WALES: 'W92000004',
    SCOTLAND: 'S92000003',
    NORTHERN_IRELAND: 'N92000002',
    UK: 'K02000001',
  },

  // Postcode to Region Mapping
  POSTCODE_REGIONS: {
    'NE': 'E12000001', // North East
    'SR': 'E12000001', // North East
    'DL': 'E12000001', // North East
    'CA': 'E12000002', // North West
    'LA': 'E12000002', // North West
    'PR': 'E12000002', // North West
    'BB': 'E12000002', // North West
    'OL': 'E12000002', // North West
    'BL': 'E12000002', // North West
    'SK': 'E12000003', // Yorkshire and The Humber
    'HD': 'E12000003', // Yorkshire and The Humber
    'HG': 'E12000003', // Yorkshire and The Humber
    'LS': 'E12000003', // Yorkshire and The Humber
    'S': 'E12000003',  // Yorkshire and The Humber
    'WF': 'E12000003', // Yorkshire and The Humber
    'YO': 'E12000003', // Yorkshire and The Humber
    'DE': 'E12000004', // East Midlands
    'LE': 'E12000004', // East Midlands
    'NG': 'E12000004', // East Midlands
    'B': 'E12000005',  // West Midlands
    'CV': 'E12000005', // West Midlands
    'DY': 'E12000005', // West Midlands
    'HR': 'E12000005', // West Midlands
    'ST': 'E12000005', // West Midlands
    'WS': 'E12000005', // West Midlands
    'WR': 'E12000005', // West Midlands
    'CB': 'E12000006', // East of England
    'CM': 'E12000006', // East of England
    'CO': 'E12000006', // East of England
    'IP': 'E12000006', // East of England
    'LU': 'E12000006', // East of England
    'MK': 'E12000006', // East of England
    'NN': 'E12000006', // East of England
    'PE': 'E12000006', // East of England
    'SG': 'E12000006', // East of England
    'SS': 'E12000006', // East of England
    'E': 'E12000007',  // London
    'EC': 'E12000007', // London
    'N': 'E12000007',  // London
    'NW': 'E12000007', // London
    'SE': 'E12000007', // London
    'SW': 'E12000007', // London
    'W': 'E12000007',  // London
  },

  // Stamp Duty Bands
  STAMP_DUTY: {
    BANDS: [250000, 925000, 1500000],
    RATES: [0.02, 0.05, 0.10, 0.12],
  },

  // EPC Data
  EPC: {
    DEFAULT_COUNT: 526,
    SAMPLE_POSTCODE: 'SW1A1AA',
    SAMPLE_NUMBER: '1',
  },

  // Fallback Data (when APIs are unavailable)
  FALLBACK: {
    PROPERTIES_COUNT: 25000000,
    RECENT_SALES_COUNT: 5000000,
    HPI_COUNT: 150000,
    EPC_COUNT: 526,
  },

  // Rate Limiting
  RATE_LIMITS: {
    DEFAULT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    DEFAULT_MAX_REQUESTS: 100,
  },

  // Cache Settings
  CACHE: {
    DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
    LONG_TTL: 60 * 60 * 1000,   // 1 hour
  },
};

// Helper functions
export const getRegionFromPostcode = (postcode: string): string => {
  const prefix = postcode.substring(0, 2).toUpperCase();
  return CONFIG.POSTCODE_REGIONS[prefix] || CONFIG.REGIONS.SOUTH_EAST; // Default to South East
};

export const getApiUrl = (service: keyof typeof CONFIG.API): string => {
  return CONFIG.API[service];
};

export const getFallbackValue = (key: keyof typeof CONFIG.FALLBACK): number => {
  return CONFIG.FALLBACK[key];
}; 