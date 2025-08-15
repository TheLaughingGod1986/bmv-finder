import { Client } from '@elastic/elasticsearch';
import { hpiCache, cacheKeys, CACHE_TTL } from './cache';

interface OptimizedQueryConfig {
  index: string;
  size?: number;
  timeout?: string;
  requestTimeout?: number;
  maxRetries?: number;
}

class ElasticsearchOptimizer {
  private client: Client;
  private connectionPool: Map<string, Client> = new Map();
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor(client: Client) {
    this.client = client;
  }

  // Optimized HPI search with caching
  async searchHpiOptimized(params: {
    postcode?: string;
    region?: string;
    dateRange?: { start: string; end: string };
    size?: number;
  }) {
    const cacheKey = this.generateHpiCacheKey(params);
    
    // Check cache first
    const cached = hpiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Build optimized query
    const query = this.buildOptimizedHpiQuery(params);
    
    try {
      const result = await this.client.search({
        index: 'house_price_index',
        size: params.size || 100,
        timeout: '30s',
        body: query,
        requestTimeout: 30000,
        maxRetries: 3,
      } as any);

      const data = result.hits.hits.map((hit: any) => hit._source);
      
      // Cache the result
      hpiCache.set(cacheKey, data, CACHE_TTL.HPI_DATA);
      
      return data;
    } catch (error) {
      console.error('Elasticsearch HPI search error:', error);
      throw error;
    }
  }

  // Optimized property search with aggregation caching
  async searchPropertiesOptimized(params: {
    query: string;
    filters?: any;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const cacheKey = this.generatePropertyCacheKey(params);
    
    // Check cache for non-paginated results
    if (!params.page || params.page === 1) {
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
    }

    // Build optimized query with proper pagination
    const query = this.buildOptimizedPropertyQuery(params);
    
    try {
      const result = await this.client.search({
        index: 'property_sales',
        size: params.pageSize || 20,
        from: ((params.page || 1) - 1) * (params.pageSize || 20),
        timeout: '30s',
        body: query,
        requestTimeout: 30000,
        maxRetries: 3,
      } as any);

      const data = {
        hits: result.hits.hits.map((hit: any) => hit._source),
        total: typeof result.hits.total === 'object' ? result.hits.total.value : result.hits.total || 0,
        aggregations: result.aggregations,
      };

      // Cache first page results
      if (!params.page || params.page === 1) {
        this.queryCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: CACHE_TTL.PROPERTY_SEARCH,
        });
      }

      return data;
    } catch (error) {
      console.error('Elasticsearch property search error:', error);
      throw error;
    }
  }

  // Batch processing for multiple postcodes
  async batchSearchHpi(postcodes: string[]) {
    const batchSize = 50; // Process in batches of 50
    const results: any[] = [];

    for (let i = 0; i < postcodes.length; i += batchSize) {
      const batch = postcodes.slice(i, i + batchSize);
      
      try {
        const batchResults = await Promise.all(
          batch.map(postcode => 
            this.searchHpiOptimized({ postcode }).catch(error => ({
              postcode,
              error: error.message,
              data: null
            }))
          )
        );
        
        results.push(...batchResults);
        
        // Add small delay between batches to prevent overwhelming ES
        if (i + batchSize < postcodes.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Batch search error for batch ${i / batchSize + 1}:`, error);
        // Continue with next batch
      }
    }

    return results;
  }

  // Optimized aggregation queries
  async getAggregationsOptimized(params: {
    field: string;
    filters?: any;
    size?: number;
  }) {
    const cacheKey = `agg:${params.field}:${JSON.stringify(params.filters)}`;
    
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    const query = {
      size: 0,
      query: params.filters ? { bool: { filter: params.filters } } : { match_all: {} },
      aggs: {
        [params.field]: {
          terms: {
            field: params.field,
            size: params.size || 100
          }
        }
      }
    };

    try {
      const result = await this.client.search({
        index: 'property_sales',
        body: query,
        timeout: '30s',
        requestTimeout: 30000,
      } as any);

      const data = (result.aggregations as any)?.[params.field]?.buckets || [];
      
      this.queryCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: CACHE_TTL.PROPERTY_SEARCH,
      });

      return data;
    } catch (error) {
      console.error('Elasticsearch aggregation error:', error);
      throw error;
    }
  }

  // Connection pooling for multiple indices
  getClientForIndex(index: string): Client {
    if (!this.connectionPool.has(index)) {
      // Create new client for this index with optimized settings
      const client = new Client({
        node: this.client.connectionPool.connections[0].url.toString(),
        tls: { rejectUnauthorized: false },
        maxRetries: 3,
        requestTimeout: 30000,
        sniffOnStart: false,
        sniffInterval: false,
      } as any);
      
      this.connectionPool.set(index, client);
    }
    
    return this.connectionPool.get(index)!;
  }

  // Clean up connections
  cleanup() {
    for (const client of this.connectionPool.values()) {
      client.close();
    }
    this.connectionPool.clear();
    this.queryCache.clear();
  }

  private generateHpiCacheKey(params: any): string {
    return cacheKeys.hpi.postcode(params.postcode || params.region || 'unknown');
  }

  private generatePropertyCacheKey(params: any): string {
    const filters = params.filters ? JSON.stringify(params.filters) : 'none';
    return cacheKeys.property.search(params.query, filters);
  }

  private buildOptimizedHpiQuery(params: any) {
    const query: any = {
      query: {
        bool: {
          must: []
        }
      },
      sort: [
        { date: { order: 'desc' } }
      ]
    };

    if (params.postcode) {
      query.query.bool.must.push({
        term: { postcode: params.postcode.toUpperCase() }
      });
    }

    if (params.region) {
      query.query.bool.must.push({
        term: { region: params.region }
      });
    }

    if (params.dateRange) {
      query.query.bool.must.push({
        range: {
          date: {
            gte: params.dateRange.start,
            lte: params.dateRange.end
          }
        }
      });
    }

    return query;
  }

  private buildOptimizedPropertyQuery(params: any) {
    const query: any = {
      query: {
        bool: {
          should: [],
          filter: []
        }
      },
      sort: []
    };

    // Build search query
    if (params.query) {
      const normalizedQuery = params.query.trim();
      
      // Check if it's a postcode
      const postcodeRegex = /^[A-Z]{1,2}[0-9][0-9A-Z]? ?[0-9][A-Z]{2}$/i;
      if (postcodeRegex.test(normalizedQuery)) {
        query.query.bool.should.push(
          { match_phrase: { postcode: normalizedQuery.toUpperCase() } },
          { match_phrase: { postcode: normalizedQuery.toUpperCase().replace(/\s/g, '') } }
        );
      } else {
        // Fuzzy search for other fields
        query.query.bool.should.push(
          { match: { street: { query: normalizedQuery, fuzziness: 'AUTO' } } },
          { match: { town_city: { query: normalizedQuery, fuzziness: 'AUTO' } } },
          { match: { locality: { query: normalizedQuery, fuzziness: 'AUTO' } } }
        );
      }
    }

    // Add filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query.query.bool.filter.push({
              terms: { [field]: value }
            });
          } else {
            query.query.bool.filter.push({
              term: { [field]: value }
            });
          }
        }
      });
    }

    // Add sorting
    if (params.sortBy) {
      query.sort.push({
        [params.sortBy]: { order: params.sortOrder || 'desc' }
      });
    }

    // Add date sorting as default
    if (!params.sortBy || params.sortBy !== 'dateOfTransfer') {
      query.sort.push({
        dateOfTransfer: { order: 'desc' }
      });
    }

    return query;
  }
}

export default ElasticsearchOptimizer; 