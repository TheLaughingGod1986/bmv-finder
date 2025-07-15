const { Client } = require('@elastic/elasticsearch');

class ElasticsearchService {
  constructor(logger) {
    this.logger = logger;
    this.client = null;
    this.indexName = 'epc_property_data';
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    this.initializeClient();
  }

  /**
   * Initialize Elasticsearch client
   */
  initializeClient() {
    try {
      // Use environment variables or default to local Elasticsearch
      const esConfig = {
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
        auth: {
          username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
          password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
        },
        tls: process.env.ELASTICSEARCH_TLS === 'true' ? {
          rejectUnauthorized: false
        } : undefined
      };

      this.client = new Client(esConfig);
      
      this.logger.info('Elasticsearch client initialized', {
        node: esConfig.node,
        indexName: this.indexName
      });

      // Ensure index exists
      this.ensureIndexExists();

    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch client', {
        error: error.message,
        stack: error.stack
      });
      this.client = null;
    }
  }

  /**
   * Ensure the EPC index exists with proper mapping
   */
  async ensureIndexExists() {
    if (!this.client) return;

    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName
      });

      if (!indexExists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              'index.mapping.total_fields.limit': 2000
            },
            mappings: {
              properties: {
                postcode: { type: 'keyword' },
                house_number: { type: 'keyword' },
                address: { type: 'text' },
                bedrooms: { type: 'integer' },
                epc_rating: { type: 'keyword' },
                floor_area_m2: { type: 'float' },
                property_type: { type: 'keyword' },
                construction_year: { type: 'integer' },
                current_energy_rating: { type: 'keyword' },
                potential_energy_rating: { type: 'keyword' },
                epc_date: { type: 'date' },
                certificate_id: { type: 'keyword' },
                cached_at: { type: 'date' },
                expires_at: { type: 'date' },
                // Additional fields for better search
                full_address: { type: 'text' },
                search_terms: { type: 'text' }
              }
            }
          }
        });

        this.logger.info('EPC index created successfully', { indexName: this.indexName });
      }
    } catch (error) {
      this.logger.error('Failed to ensure index exists', {
        error: error.message,
        indexName: this.indexName
      });
    }
  }

  /**
   * Generate cache key for property lookup
   * @param {string} postcode - Normalized postcode
   * @param {string} number - Normalized house number
   * @returns {string} Cache key
   */
  generateCacheKey(postcode, number) {
    return `${postcode}_${number}`.toLowerCase();
  }

  /**
   * Check if cached data exists and is still valid
   * @param {string} postcode - Normalized postcode
   * @param {string} number - Normalized house number
   * @returns {Object|null} Cached property data or null
   */
  async getCachedPropertyData(postcode, number) {
    if (!this.client) {
      this.logger.warn('Elasticsearch client not available, skipping cache lookup');
      return null;
    }

    try {
      const cacheKey = this.generateCacheKey(postcode, number);
      const now = new Date();

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                { term: { postcode: postcode } },
                { term: { house_number: number } },
                { range: { expires_at: { gt: now.toISOString() } } }
              ]
            }
          },
          size: 1,
          sort: [{ cached_at: { order: 'desc' } }]
        }
      });

      if (response.hits.hits.length > 0) {
        const cachedData = response.hits.hits[0]._source;
        
        this.logger.info('Cache hit for property data', {
          postcode,
          number,
          cacheKey,
          cachedAt: cachedData.cached_at
        });

        // Remove internal cache fields before returning
        const { cached_at, expires_at, search_terms, ...propertyData } = cachedData;
        return propertyData;
      }

      this.logger.info('Cache miss for property data', { postcode, number, cacheKey });
      return null;

    } catch (error) {
      this.logger.error('Error retrieving cached property data', {
        error: error.message,
        postcode,
        number
      });
      return null;
    }
  }

  /**
   * Cache property data in Elasticsearch
   * @param {string} postcode - Normalized postcode
   * @param {string} number - Normalized house number
   * @param {Object} propertyData - Property data to cache
   */
  async cachePropertyData(postcode, number, propertyData) {
    if (!this.client) {
      this.logger.warn('Elasticsearch client not available, skipping cache storage');
      return;
    }

    try {
      const cacheKey = this.generateCacheKey(postcode, number);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.cacheTTL);

      const documentToCache = {
        postcode: postcode,
        house_number: number,
        cached_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        search_terms: `${postcode} ${number} ${propertyData.address || ''}`.toLowerCase(),
        ...propertyData
      };

      await this.client.index({
        index: this.indexName,
        id: cacheKey,
        body: documentToCache,
        refresh: 'wait_for'
      });

      this.logger.info('Property data cached successfully', {
        postcode,
        number,
        cacheKey,
        expiresAt: expiresAt.toISOString()
      });

    } catch (error) {
      this.logger.error('Error caching property data', {
        error: error.message,
        postcode,
        number
      });
    }
  }

  /**
   * Search for properties by postcode (for bulk operations)
   * @param {string} postcode - Postcode to search
   * @param {number} size - Number of results to return
   * @returns {Array} Array of property data
   */
  async searchPropertiesByPostcode(postcode, size = 50) {
    if (!this.client) return [];

    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                { term: { postcode: postcode.toUpperCase() } },
                { range: { expires_at: { gt: new Date().toISOString() } } }
              ]
            }
          },
          size: size,
          sort: [{ cached_at: { order: 'desc' } }]
        }
      });

      return response.hits.hits.map(hit => {
        const { cached_at, expires_at, search_terms, ...propertyData } = hit._source;
        return propertyData;
      });

    } catch (error) {
      this.logger.error('Error searching properties by postcode', {
        error: error.message,
        postcode
      });
      return [];
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  async getCacheStats() {
    if (!this.client) return null;

    try {
      const response = await this.client.indices.stats({
        index: this.indexName
      });

      const indexStats = response.indices[this.indexName];
      
      return {
        documentCount: indexStats.total.docs.count,
        indexSize: indexStats.total.store.size_in_bytes,
        cacheHitRate: indexStats.total.get.hit_count / (indexStats.total.get.hit_count + indexStats.total.get.miss_count) || 0
      };

    } catch (error) {
      this.logger.error('Error getting cache statistics', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Clean expired cache entries
   * @returns {number} Number of deleted documents
   */
  async cleanExpiredCache() {
    if (!this.client) return 0;

    try {
      const response = await this.client.deleteByQuery({
        index: this.indexName,
        body: {
          query: {
            range: {
              expires_at: {
                lt: new Date().toISOString()
              }
            }
          }
        },
        refresh: true
      });

      const deletedCount = response.deleted || 0;
      
      this.logger.info('Cleaned expired cache entries', {
        deletedCount,
        indexName: this.indexName
      });

      return deletedCount;

    } catch (error) {
      this.logger.error('Error cleaning expired cache', {
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Check if Elasticsearch is available
   * @returns {boolean} True if available
   */
  async isAvailable() {
    if (!this.client) return false;

    try {
      await this.client.ping();
      return true;
    } catch (error) {
      this.logger.error('Elasticsearch health check failed', {
        error: error.message
      });
      return false;
    }
  }
}

module.exports = ElasticsearchService; 