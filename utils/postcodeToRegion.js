// Postcode to HPI region mapping utility
// Based on UK postcode areas and their corresponding HPI regions

const POSTCODE_REGION_MAP = {
  // London
  'E': 'London',
  'N': 'London',
  'W': 'London',
  'SW': 'London',
  'SE': 'London',
  'NW': 'London',
  
  // South East
  'GU': 'South East',
  'RG': 'South East',
  'SL': 'South East',
  'SO': 'South East',
  'PO': 'South East',
  'BN': 'South East',
  'TN': 'South East',
  'CT': 'South East',
  'ME': 'South East',
  'DA': 'South East',
  'RH': 'South East',
  'HP': 'South East',
  'LU': 'South East',
  'MK': 'South East',
  'OX': 'South East',
  
  // South West
  'BA': 'South West',
  'BS': 'South West',
  'DT': 'South West',
  'EX': 'South West',
  'GL': 'South West',
  'PL': 'South West',
  'SN': 'South West',
  'SP': 'South West',
  'TA': 'South West',
  'TQ': 'South West',
  'TR': 'South West',
  
  // East of England
  'AL': 'East of England',
  'CB': 'East of England',
  'CM': 'East of England',
  'CO': 'East of England',
  'IP': 'East of England',
  'NR': 'East of England',
  'SG': 'East of England',
  'SS': 'East of England',
  
  // West Midlands
  'B': 'West Midlands',
  'CV': 'West Midlands',
  'DY': 'West Midlands',
  'HR': 'West Midlands',
  'LE': 'West Midlands',
  'NG': 'West Midlands',
  'ST': 'West Midlands',
  'TF': 'West Midlands',
  'WS': 'West Midlands',
  'WV': 'West Midlands',
  
  // East Midlands
  'DE': 'East Midlands',
  'DN': 'East Midlands',
  'LN': 'East Midlands',
  'PE': 'East Midlands',
  'S': 'East Midlands',
  
  // Yorkshire and The Humber
  'BD': 'Yorkshire and The Humber',
  'HD': 'Yorkshire and The Humber',
  'HG': 'Yorkshire and The Humber',
  'HU': 'Yorkshire and The Humber',
  'HX': 'Yorkshire and The Humber',
  'LS': 'Yorkshire and The Humber',
  'WF': 'Yorkshire and The Humber',
  'YO': 'Yorkshire and The Humber',
  
  // North West
  'BB': 'North West',
  'BL': 'North West',
  'CA': 'North West',
  'CH': 'North West',
  'CW': 'North West',
  'FY': 'North West',
  'L': 'North West',
  'LA': 'North West',
  'M': 'North West',
  'OL': 'North West',
  'PR': 'North West',
  'SK': 'North West',
  'WA': 'North West',
  'WN': 'North West',
  
  // North East
  'DH': 'North East',
  'DL': 'North East',
  'NE': 'North East',
  'SR': 'North East',
  'TS': 'North East',
  
  // Wales
  'CF': 'Wales',
  'LD': 'Wales',
  'LL': 'Wales',
  'NP': 'Wales',
  'SA': 'Wales',
  'SY': 'Wales',
  
  // Scotland
  'AB': 'Scotland',
  'DD': 'Scotland',
  'DG': 'Scotland',
  'EH': 'Scotland',
  'FK': 'Scotland',
  'G': 'Scotland',
  'HS': 'Scotland',
  'IV': 'Scotland',
  'KA': 'Scotland',
  'KW': 'Scotland',
  'KY': 'Scotland',
  'ML': 'Scotland',
  'PA': 'Scotland',
  'PH': 'Scotland',
  'TD': 'Scotland',
  'ZE': 'Scotland',
  
  // Northern Ireland
  'BT': 'Northern Ireland'
};

/**
 * Convert a UK postcode to its corresponding HPI region
 * @param {string} postcode - The postcode to convert (e.g., "SW1A 1AA")
 * @returns {string} The HPI region name
 */
function postcodeToRegion(postcode) {
  if (!postcode || typeof postcode !== 'string') {
    return 'United Kingdom';
  }
  
  // Clean and normalize the postcode
  const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
  
  // Try 2-letter prefixes first (more specific)
  for (const [prefix, region] of Object.entries(POSTCODE_REGION_MAP)) {
    if (prefix.length === 2 && cleanPostcode.startsWith(prefix)) {
      return region;
    }
  }
  
  // Try 1-letter prefixes
  const firstChar = cleanPostcode.charAt(0);
  if (POSTCODE_REGION_MAP[firstChar]) {
    return POSTCODE_REGION_MAP[firstChar];
  }
  
  // Default fallback
  return 'United Kingdom';
}

/**
 * Get all available regions
 * @returns {string[]} Array of all HPI region names
 */
function getAllRegions() {
  return [...new Set(Object.values(POSTCODE_REGION_MAP))].sort();
}

/**
 * Get region code for a region name
 * @param {string} region - The region name
 * @returns {string} The region code
 */
function getRegionCode(region) {
  const codeMap = {
    'North East': 'E12000001',
    'North West': 'E12000002',
    'Yorkshire and The Humber': 'E12000003',
    'East Midlands': 'E12000004',
    'West Midlands': 'E12000005',
    'East of England': 'E12000006',
    'London': 'E12000007',
    'South East': 'E12000008',
    'South West': 'E12000009',
    'Wales': 'W92000004',
    'Scotland': 'S92000003',
    'Northern Ireland': 'N92000002',
    'United Kingdom': 'K02000001'
  };
  return codeMap[region] || region;
}

/**
 * Get region type (England, Wales, Scotland, Northern Ireland, UK)
 * @param {string} region - The region name
 * @returns {string} The region type
 */
function getRegionType(region) {
  if (region === 'United Kingdom') return 'UK';
  if (region === 'Wales') return 'Wales';
  if (region === 'Scotland') return 'Scotland';
  if (region === 'Northern Ireland') return 'Northern Ireland';
  return 'England';
}

/**
 * Validate if a postcode format is valid (basic validation)
 * @param {string} postcode - The postcode to validate
 * @returns {boolean} True if valid format
 */
function isValidPostcodeFormat(postcode) {
  if (!postcode || typeof postcode !== 'string') return false;
  
  // Basic UK postcode format validation
  const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
  return postcodeRegex.test(postcode.trim());
}

/**
 * Get postcode area (first part before space)
 * @param {string} postcode - The full postcode
 * @returns {string} The postcode area
 */
function getPostcodeArea(postcode) {
  if (!postcode || typeof postcode !== 'string') return '';
  
  const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
  
  // Extract area code (1-2 letters + numbers)
  const areaMatch = cleanPostcode.match(/^[A-Z]{1,2}[0-9]/);
  return areaMatch ? areaMatch[0] : '';
}

// Export functions
module.exports = {
  postcodeToRegion,
  getAllRegions,
  getRegionCode,
  getRegionType,
  isValidPostcodeFormat,
  getPostcodeArea,
  POSTCODE_REGION_MAP
};

// ES6 module export (if using ES modules)
if (typeof exports !== 'undefined' && typeof module !== 'undefined' && module.exports) {
  module.exports = {
    postcodeToRegion,
    getAllRegions,
    getRegionCode,
    getRegionType,
    isValidPostcodeFormat,
    getPostcodeArea,
    POSTCODE_REGION_MAP
  };
} 