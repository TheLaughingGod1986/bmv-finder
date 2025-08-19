// Market Configuration - Centralized constants to replace hardcoded values
// This file should be the single source of truth for market-related configuration

export interface MarketConfig {
  // HPI Region Codes
  hpiRegions: {
    [key: string]: string;
  };
  
  // Postcode to Region Mapping
  postcodeToRegion: {
    [key: string]: string;
  };
  
  // Local Authority to HPI Region Mapping
  localAuthorityToHPIRegion: {
    [key: string]: string;
  };
  
  // Base Rental Rates by Region and Property Type
  baseRentalRates: {
    [region: string]: {
      [propertyType: string]: {
        [bedrooms: number]: number;
      };
    };
  };
  
  // Market Analysis Configuration
  marketAnalysis: {
    defaultHPIIndex: number;
    defaultYoYGrowth: number;
    salesDataYears: number;
    maxSearchResults: number;
    confidenceThresholds: {
      high: number;
      medium: number;
      low: number;
    };
    minSalesForAnalysis: number;
    defaultRentalYield: number;
  };
  
  // Prediction Configuration
  predictions: {
    defaultConfidence: number;
    valueRangeMultipliers: {
      min: number;
      max: number;
    };
    growthMultipliers: {
      conservative: number;
      moderate: number;
      aggressive: number;
    };
    confidenceCalculation: {
      minConfidence: number;
      maxConfidence: number;
      weightMultiplier: number;
    };
    valueRangeCalculation: {
      confidenceFactor: number;
      rangeMultiplier: number;
    };
  };
  
  // BMV Scoring Configuration
  bmvScoring: {
    maxScore: number;
    weightFactors: {
      hpiGrowth: number;
      salesVolume: number;
      priceTrend: number;
      rentalYield: number;
    };
    investmentValueMultiplier: number;
    potentialSavingsMultiplier: number;
    confidenceCalculation: {
      minConfidence: number;
      maxConfidence: number;
      salesMultiplier: number;
    };
  };
  
  // API Configuration
  api: {
    defaultTimeouts: {
      elasticsearch: number;
      external: number;
    };
    rateLimits: {
      default: number;
      enhanced: number;
      predictions: number;
    };
    searchLimits: {
      default: number;
      max: number;
      pagination: number;
    };
  };
  
  // Economic Indicators
  economicIndicators: {
    inflation: {
      current: number;
      projected: number;
    };
    interestRates: {
      current: number;
      projected: number;
    };
    growthRates: {
      conservative: number;
      moderate: number;
      aggressive: number;
    };
  };
  
  // Fallback Values
  fallbacks: {
    propertyValues: {
      default: number;
      min: number;
      max: number;
    };
    confidence: {
      default: number;
      min: number;
      max: number;
    };
    growth: {
      default: number;
      min: number;
      max: number;
    };
  };
  
  // Data Quality Thresholds
  dataQuality: {
    minSalesForReliableAnalysis: number;
    minHPIDataPoints: number;
    confidenceThresholds: {
      high: number;
      medium: number;
      low: number;
    };
  };
}

// Default configuration - these should be overridden by environment variables or database
export const defaultMarketConfig: MarketConfig = {
  hpiRegions: {
    'E12000001': 'North East',
    'E12000002': 'North West',
    'E12000003': 'Yorkshire and The Humber',
    'E12000004': 'East Midlands',
    'E12000005': 'West Midlands',
    'E12000006': 'East of England',
    'E12000007': 'London',
    'E12000008': 'South East',
    'E12000009': 'South West'
  },
  
  postcodeToRegion: {
    'HP': 'E12000009', // South West
    'AL': 'E12000002', // East of England
    'NE': 'E12000001', // North East
    'NW': 'E12000002', // North West
    'YO': 'E12000003', // Yorkshire and The Humber
    'LE': 'E12000004', // East Midlands
    'B': 'E12000005',  // West Midlands
    'CV': 'E12000005', // West Midlands
    'WS': 'E12000005', // West Midlands
    'ST': 'E12000005', // West Midlands
    'CB': 'E12000006', // East of England
    'IP': 'E12000006', // East of England
    'NR': 'E12000006', // East of England
    'CM': 'E12000006', // East of England
    'SS': 'E12000007', // London
    'E': 'E12000007',  // London
    'N': 'E12000007',  // London
    'W': 'E12000007',  // London
    'SW': 'E12000007', // London
    'SE': 'E12000007', // London
    'BR': 'E12000007', // London
    'CR': 'E12000007', // London
    'DA': 'E12000007', // London
    'EN': 'E12000007', // London
    'HA': 'E12000007', // London
    'IG': 'E12000007', // London
    'KT': 'E12000007', // London
    'RM': 'E12000007', // London
    'SM': 'E12000007', // London
    'TN': 'E12000008', // South East
    'GU': 'E12000008', // South East
    'PO': 'E12000008', // South East
    'RG': 'E12000008', // South East
    'SL': 'E12000008', // South East
    'SO': 'E12000008', // South East
    'BH': 'E12000009', // South West
    'BS': 'E12000009', // South West
    'DT': 'E12000009', // South West
    'EX': 'E12000009', // South West
    'GL': 'E12000009', // South West
    'PL': 'E12000009', // South West
    'SN': 'E12000009', // South West
    'TA': 'E12000009', // South West
    'TR': 'E12000009', // South West
  },
  
  localAuthorityToHPIRegion: {
    'Newcastle upon Tyne': 'E12000001',
    'North Tyneside': 'E12000001',
    'South Tyneside': 'E12000001',
    'Sunderland': 'E12000001',
    'Gateshead': 'E12000001',
    'Durham': 'E12000001',
    'Northumberland': 'E12000001',
    'Stockton-on-Tees': 'E12000001',
    'Middlesbrough': 'E12000001',
    'Redcar and Cleveland': 'E12000001',
    'Hartlepool': 'E12000001',
    'Darlington': 'E12000001',
    'County Durham': 'E12000001',
    'Tyne and Wear': 'E12000001',
    'Greenwich': 'E12000007',
    'Lewisham': 'E12000007',
    'Southwark': 'E12000007',
    'Lambeth': 'E12000007',
    'Wandsworth': 'E12000007',
    'Hammersmith and Fulham': 'E12000007',
    'Kensington and Chelsea': 'E12000007',
    'Westminster': 'E12000007',
    'Camden': 'E12000007',
    'Islington': 'E12000007',
    'Hackney': 'E12000007',
    'Tower Hamlets': 'E12000007',
    'Newham': 'E12000007',
    'Barking and Dagenham': 'E12000007',
    'Havering': 'E12000007',
    'Redbridge': 'E12000007',
    'Waltham Forest': 'E12000007',
    'Haringey': 'E12000007',
    'Barnet': 'E12000007',
    'Harrow': 'E12000007',
    'Brent': 'E12000007',
    'Ealing': 'E12000007',
    'Hounslow': 'E12000007',
    'Richmond upon Thames': 'E12000007',
    'Kingston upon Thames': 'E12000007',
    'Merton': 'E12000007',
    'Sutton': 'E12000007',
    'Croydon': 'E12000007',
    'Bromley': 'E12000007',
    'Bexley': 'E12000007'
  },
  
  baseRentalRates: {
    // North East (NE) - Conservative rates
    'E12000001': {
      'Flat': { 1: 650, 2: 800, 3: 950, 4: 1150, 5: 1350 },
      'Terraced': { 1: 700, 2: 850, 3: 1000, 4: 1150, 5: 1350 },
      'Semi-Detached': { 1: 750, 2: 900, 3: 1050, 4: 1250, 5: 1450 },
      'Detached': { 1: 850, 2: 1050, 3: 1250, 4: 1450, 5: 1650 },
      'House': { 1: 750, 2: 900, 3: 1050, 4: 1250, 5: 1450 }
    },
    
    // London - Premium rates
    'E12000007': {
      'Flat': { 1: 1600, 2: 2100, 3: 2800, 4: 3500, 5: 4200 },
      'Terraced': { 1: 1800, 2: 2300, 3: 3000, 4: 3700, 5: 4400 },
      'Semi-Detached': { 1: 2000, 2: 2500, 3: 3200, 4: 3900, 5: 4600 },
      'Detached': { 1: 2200, 2: 2700, 3: 3400, 4: 4100, 5: 4800 },
      'House': { 1: 2000, 2: 2500, 3: 3200, 4: 3900, 5: 4600 }
    },
    
    // South East - High rates
    'E12000008': {
      'Flat': { 1: 1200, 2: 1600, 3: 2100, 4: 2600, 5: 3100 },
      'Terraced': { 1: 1400, 2: 1800, 3: 2300, 4: 2800, 5: 3300 },
      'Semi-Detached': { 1: 1600, 2: 2000, 3: 2500, 4: 3000, 5: 3500 },
      'Detached': { 1: 1800, 2: 2200, 3: 2700, 4: 3200, 5: 3700 },
      'House': { 1: 1600, 2: 2000, 3: 2500, 4: 3000, 5: 3500 }
    },
    
    // South West - Moderate rates
    'E12000009': {
      'Flat': { 1: 900, 2: 1200, 3: 1500, 4: 1800, 5: 2100 },
      'Terraced': { 1: 1100, 2: 1400, 3: 1700, 4: 2000, 5: 2300 },
      'Semi-Detached': { 1: 1300, 2: 1600, 3: 1900, 4: 2200, 5: 2500 },
      'Detached': { 1: 1500, 2: 1800, 3: 2100, 4: 2400, 5: 2700 },
      'House': { 1: 1300, 2: 1600, 3: 1900, 4: 2200, 5: 2500 }
    },
    
    // Default rates for other regions
    'default': {
      'Flat': { 1: 600, 2: 750, 3: 900, 4: 1100, 5: 1300 },
      'Terraced': { 1: 650, 2: 800, 3: 950, 4: 1100, 5: 1300 },
      'Semi-Detached': { 1: 700, 2: 850, 3: 1000, 4: 1200, 5: 1400 },
      'Detached': { 1: 800, 2: 1000, 3: 1200, 4: 1400, 5: 1600 },
      'House': { 1: 700, 2: 850, 3: 1000, 4: 1200, 5: 1400 }
    }
  },
  
  marketAnalysis: {
    defaultHPIIndex: 100,
    defaultYoYGrowth: 2.5,
    salesDataYears: 5,
    maxSearchResults: 1000,
    confidenceThresholds: {
      high: 80,
      medium: 60,
      low: 40
    },
    minSalesForAnalysis: 3,
    defaultRentalYield: 4.5
  },
  
  predictions: {
    defaultConfidence: 75,
    valueRangeMultipliers: {
      min: 0.9,
      max: 1.1
    },
    growthMultipliers: {
      conservative: 1.5,
      moderate: 2.5,
      aggressive: 4.0
    },
    confidenceCalculation: {
      minConfidence: 50,
      maxConfidence: 95,
      weightMultiplier: 100
    },
    valueRangeCalculation: {
      confidenceFactor: 0.2,
      rangeMultiplier: 0.2
    }
  },
  
  bmvScoring: {
    maxScore: 100,
    weightFactors: {
      hpiGrowth: 0.3,
      salesVolume: 0.2,
      priceTrend: 0.25,
      rentalYield: 0.25
    },
    investmentValueMultiplier: 0.92,
    potentialSavingsMultiplier: 0.08,
    confidenceCalculation: {
      minConfidence: 50,
      maxConfidence: 95,
      salesMultiplier: 10
    }
  },
  
  api: {
    defaultTimeouts: {
      elasticsearch: 30000,
      external: 10000
    },
    rateLimits: {
      default: 100,
      enhanced: 50,
      predictions: 25
    },
    searchLimits: {
      default: 100,
      max: 1000,
      pagination: 20
    }
  },
  
  economicIndicators: {
    inflation: {
      current: 3.2,
      projected: 2.0
    },
    interestRates: {
      current: 5.25,
      projected: 4.5
    },
    growthRates: {
      conservative: 1.5,
      moderate: 2.5,
      aggressive: 4.0
    }
  },
  
  fallbacks: {
    propertyValues: {
      default: 250000,
      min: 50000,
      max: 2000000
    },
    confidence: {
      default: 60,
      min: 25,
      max: 95
    },
    growth: {
      default: 2.5,
      min: 0.5,
      max: 8.0
    }
  },
  
  dataQuality: {
    minSalesForReliableAnalysis: 5,
    minHPIDataPoints: 2,
    confidenceThresholds: {
      high: 80,
      medium: 60,
      low: 40
    }
  }
};

// Function to get rental rate for a specific property
export function getRentalRate(
  regionCode: string, 
  propertyType: string, 
  bedrooms: number
): number {
  const regionRates = defaultMarketConfig.baseRentalRates[regionCode] || 
                     defaultMarketConfig.baseRentalRates['default'];
  
  const propertyRates = regionRates[propertyType] || regionRates['House'];
  const bedroomCount = Math.min(Math.max(bedrooms, 1), 5);
  
  return propertyRates[bedroomCount] || propertyRates[3]; // Default to 3-bedroom rate
}

// Function to get HPI region code for a local authority
export function getHPIRegion(localAuthority: string): string {
  return defaultMarketConfig.localAuthorityToHPIRegion[localAuthority] || 'E12000001';
}

// Function to get region code for a postcode
export function getRegionCode(postcode: string): string {
  const postcodeArea = postcode.substring(0, 2).toUpperCase();
  return defaultMarketConfig.postcodeToRegion[postcodeArea] || 'E92000001';
}

// Function to calculate confidence based on data quality
export function calculateDataConfidence(
  dataPoints: number,
  dataQuality: 'high' | 'medium' | 'low'
): number {
  const baseConfidence = Math.min(
    defaultMarketConfig.predictions.confidenceCalculation.maxConfidence,
    Math.max(
      defaultMarketConfig.predictions.confidenceCalculation.minConfidence,
      dataPoints * defaultMarketConfig.predictions.confidenceCalculation.weightMultiplier
    )
  );
  
  const qualityMultiplier = dataQuality === 'high' ? 1.0 : 
                           dataQuality === 'medium' ? 0.8 : 0.6;
  
  return Math.round(baseConfidence * qualityMultiplier);
}

// Function to calculate value range based on confidence
export function calculateValueRange(
  predictedValue: number,
  confidence: number
): { min: number; max: number } {
  const confidenceFactor = (100 - confidence) / 100;
  const rangeMultiplier = defaultMarketConfig.predictions.valueRangeCalculation.rangeMultiplier;
  
  const min = Math.round(predictedValue * (1 - confidenceFactor * rangeMultiplier));
  const max = Math.round(predictedValue * (1 + confidenceFactor * rangeMultiplier));
  
  return { min, max };
}

// Function to get fallback property value
export function getFallbackPropertyValue(
  postcode: string,
  propertyType: string
): number {
  const regionCode = getRegionCode(postcode);
  const isLondon = regionCode === 'E12000007';
  const isSouthEast = regionCode === 'E12000008';
  
  if (isLondon) return defaultMarketConfig.fallbacks.propertyValues.default * 2;
  if (isSouthEast) return defaultMarketConfig.fallbacks.propertyValues.default * 1.5;
  
  return defaultMarketConfig.fallbacks.propertyValues.default;
}

// Export the default config for use in other files
export default defaultMarketConfig;
