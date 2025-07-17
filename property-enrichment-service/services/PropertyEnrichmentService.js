const axios = require('axios');
const ElasticsearchService = require('./ElasticsearchService');

class PropertyEnrichmentService {
  constructor(logger) {
    this.logger = logger;
    this.epcApiBaseUrl = process.env.EPC_API_BASE_URL || 'https://epc.opendatacommunities.org';
    this.epcApiToken = process.env.EPC_API_TOKEN;
    
    // Initialize Elasticsearch service for caching
    this.elasticsearchService = new ElasticsearchService(logger);
    
    if (!this.epcApiToken) {
      this.logger.warn('EPC API token not provided. Service will not be able to fetch EPC data.');
    }
  }

  /**
   * Main method to enrich property data
   * @param {string} postcode - UK postcode
   * @param {string} number - House number/name
   * @returns {Object|null} Enriched property data or null if not found
   */
  async enrichPropertyData(postcode, number) {
    try {
      this.logger.info('Starting property enrichment', { postcode, number });

      // Normalize postcode and number
      const normalizedPostcode = this.normalizePostcode(postcode);
      const normalizedNumber = this.normalizeHouseNumber(number);

      // First, check cache
      const cachedData = await this.elasticsearchService.getCachedPropertyData(normalizedPostcode, normalizedNumber);
      if (cachedData) {
        this.logger.info('Returning cached property data', {
          postcode: normalizedPostcode,
          number: normalizedNumber,
          source: 'cache'
        });
        return cachedData;
      }

      // Check enhanced properties index
      const enhancedData = await this.elasticsearchService.getEnhancedPropertyData(normalizedPostcode, normalizedNumber);
      if (enhancedData) {
        this.logger.info('Returning enhanced property data', {
          postcode: normalizedPostcode,
          number: normalizedNumber,
          source: 'enhanced'
        });
        return enhancedData;
      }

      // If not in cache, fetch from EPC API
      const epcData = await this.fetchEPCData(normalizedPostcode, normalizedNumber);
      
      if (!epcData || epcData.length === 0) {
        this.logger.info('No EPC data found', { postcode: normalizedPostcode, number: normalizedNumber });
        return null;
      }

      // Find the best match for the address
      const bestMatch = this.findBestAddressMatch(epcData, normalizedNumber, normalizedPostcode);
      
      if (!bestMatch) {
        this.logger.info('No matching property found in EPC data', { postcode: normalizedPostcode, number: normalizedNumber });
        return null;
      }

      // Format the response
      const enrichedData = this.formatPropertyData(bestMatch, normalizedNumber, normalizedPostcode);

      // Cache the result
      await this.elasticsearchService.cachePropertyData(normalizedPostcode, normalizedNumber, enrichedData);

      this.logger.info('Property enrichment completed successfully', {
        postcode: normalizedPostcode,
        number: normalizedNumber,
        found: true,
        source: 'api'
      });

      return enrichedData;

    } catch (error) {
      this.logger.error('Error in property enrichment', {
        error: error.message,
        postcode,
        number,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Fetch EPC data from the Open Data Communities API
   * @param {string} postcode - Normalized postcode
   * @param {string} number - Normalized house number
   * @returns {Array} Array of EPC records
   */
  async fetchEPCData(postcode, number) {
    try {
      if (!this.epcApiToken) {
        throw new Error('EPC API token not configured');
      }

      // Build the search query
      const searchQuery = this.buildEPCSearchQuery(postcode, number);
      
      this.logger.info('Fetching EPC data', { 
        postcode, 
        number, 
        searchQuery,
        url: `${this.epcApiBaseUrl}/api/v1/domestic/search`
      });

      const response = await axios.get(`${this.epcApiBaseUrl}/api/v1/domestic/search`, {
        params: searchQuery,
        headers: {
          'Authorization': `Bearer ${this.epcApiToken}`,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.status !== 200) {
        throw new Error(`EPC API returned status ${response.status}`);
      }

      const data = response.data;
      
      this.logger.info('EPC data fetched successfully', {
        postcode,
        number,
        resultCount: data.rows ? data.rows.length : 0
      });

      return data.rows || [];

    } catch (error) {
      this.logger.error('Error fetching EPC data', {
        error: error.message,
        postcode,
        number,
        stack: error.stack
      });
      
      // Return empty array instead of throwing to allow graceful degradation
      return [];
    }
  }

  /**
   * Build search query for EPC API
   * @param {string} postcode - Normalized postcode
   * @param {string} number - Normalized house number
   * @returns {Object} Search parameters
   */
  buildEPCSearchQuery(postcode, number) {
    const query = {
      postcode: postcode,
      size: 50 // Limit results
    };

    // Add house number/name if provided
    if (number) {
      query.address = number;
    }

    return query;
  }

  /**
   * Find the best matching property from EPC data
   * @param {Array} epcData - Array of EPC records
   * @param {string} targetNumber - Target house number
   * @param {string} targetPostcode - Target postcode
   * @returns {Object|null} Best matching EPC record
   */
  findBestAddressMatch(epcData, targetNumber, targetPostcode) {
    if (!epcData || epcData.length === 0) {
      return null;
    }

    // First, try exact match
    let exactMatch = epcData.find(record => {
      const recordNumber = this.normalizeHouseNumber(record.address || '');
      const recordPostcode = this.normalizePostcode(record.postcode || '');
      
      return recordNumber === targetNumber && recordPostcode === targetPostcode;
    });

    if (exactMatch) {
      this.logger.info('Found exact address match', { targetNumber, targetPostcode });
      return exactMatch;
    }

    // If no exact match, try partial matches
    const partialMatches = epcData.filter(record => {
      const recordNumber = this.normalizeHouseNumber(record.address || '');
      const recordPostcode = this.normalizePostcode(record.postcode || '');
      
      // Check if postcode matches and number is similar
      return recordPostcode === targetPostcode && 
             (recordNumber.includes(targetNumber) || targetNumber.includes(recordNumber));
    });

    if (partialMatches.length > 0) {
      this.logger.info('Found partial address match', { 
        targetNumber, 
        targetPostcode, 
        matchCount: partialMatches.length 
      });
      return partialMatches[0]; // Return first partial match
    }

    // If still no match, return the first record with matching postcode
    const postcodeMatch = epcData.find(record => {
      const recordPostcode = this.normalizePostcode(record.postcode || '');
      return recordPostcode === targetPostcode;
    });

    if (postcodeMatch) {
      this.logger.info('Found postcode-only match', { targetPostcode });
      return postcodeMatch;
    }

    return null;
  }

  /**
   * Format property data for API response
   * @param {Object} epcRecord - EPC record
   * @param {string} number - House number
   * @param {string} postcode - Postcode
   * @returns {Object} Formatted property data
   */
  formatPropertyData(epcRecord, number, postcode) {
    const address = `${number} ${epcRecord.street || ''}, ${postcode}`.trim();
    
    return {
      address: address,
      bedrooms: this.extractBedrooms(epcRecord),
      epc_rating: this.extractEPCRating(epcRecord),
      floor_area_m2: this.extractFloorArea(epcRecord),
      property_type: this.extractPropertyType(epcRecord),
      // Additional useful data
      construction_year: epcRecord.construction_year,
      current_energy_rating: epcRecord.current_energy_rating,
      potential_energy_rating: epcRecord.potential_energy_rating,
      epc_date: epcRecord.inspection_date,
      certificate_id: epcRecord.certificate_id
    };
  }

  /**
   * Extract number of bedrooms from EPC record
   * @param {Object} epcRecord - EPC record
   * @returns {number|null} Number of bedrooms
   */
  extractBedrooms(epcRecord) {
    const bedrooms = epcRecord.number_of_bedrooms;
    if (bedrooms && !isNaN(bedrooms)) {
      return parseInt(bedrooms);
    }
    return null;
  }

  /**
   * Extract EPC rating from EPC record
   * @param {Object} epcRecord - EPC record
   * @returns {string|null} EPC rating (A-G)
   */
  extractEPCRating(epcRecord) {
    const rating = epcRecord.current_energy_efficiency || epcRecord.current_energy_rating;
    if (rating && /^[A-G]$/i.test(rating)) {
      return rating.toUpperCase();
    }
    return null;
  }

  /**
   * Extract floor area from EPC record
   * @param {Object} epcRecord - EPC record
   * @returns {number|null} Floor area in square meters
   */
  extractFloorArea(epcRecord) {
    const area = epcRecord.total_floor_area;
    if (area && !isNaN(area)) {
      return parseFloat(area);
    }
    return null;
  }

  /**
   * Extract property type from EPC record
   * @param {Object} epcRecord - EPC record
   * @returns {string|null} Property type
   */
  extractPropertyType(epcRecord) {
    const propertyType = epcRecord.property_type;
    if (propertyType) {
      // Normalize property type
      const normalized = propertyType.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
    return null;
  }

  /**
   * Normalize UK postcode format
   * @param {string} postcode - Raw postcode
   * @returns {string} Normalized postcode
   */
  normalizePostcode(postcode) {
    if (!postcode) return '';
    
    // Remove spaces and convert to uppercase
    return postcode.replace(/\s+/g, '').toUpperCase();
  }

  /**
   * Normalize house number/name
   * @param {string} number - Raw house number/name
   * @returns {string} Normalized house number/name
   */
  normalizeHouseNumber(number) {
    if (!number) return '';
    
    // Remove extra spaces and convert to lowercase for comparison
    return number.trim().toLowerCase();
  }
}

module.exports = PropertyEnrichmentService; 