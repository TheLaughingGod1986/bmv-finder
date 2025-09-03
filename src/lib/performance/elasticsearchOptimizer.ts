import { auditLogger } from '../audit/auditLogger';

export interface ElasticsearchMetrics {
  queryCount: number;
  averageQueryTime: number;
  slowQueries: number;
  errorRate: number;
  cacheHitRate: number;
  indexSize: Record<string, number>;
  shardStats: Record<string, { primary: number; replica: number; unassigned: number }>;
  clusterHealth: 'green' | 'yellow' | 'red';
}

export interface QueryOptimization {
  originalQuery: any;
  optimizedQuery: any;
  improvements: string[];
  estimatedPerformanceGain: number;
  executionTime: number;
}

export interface IndexOptimization {
  index: string;
  currentMapping: any;
  recommendedMapping: any;
  improvements: string[];
  estimatedImpact: 'high' | 'medium' | 'low';
}

export class ElasticsearchOptimizer {
  private static instance: ElasticsearchOptimizer;
  private metrics: ElasticsearchMetrics;
  private queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  private slowQueries: Array<{ query: any; time: number; timestamp: Date }> = [];
  private indexRecommendations: IndexOptimization[] = [];

  private constructor() {
    this.metrics = {
      queryCount: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      errorRate: 0,
      cacheHitRate: 0,
      indexSize: {},
      shardStats: {},
      clusterHealth: 'green'
    };

    this.initializeIndexRecommendations();
    this.startMetricsCollection();
  }

  public static getInstance(): ElasticsearchOptimizer {
    if (!ElasticsearchOptimizer.instance) {
      ElasticsearchOptimizer.instance = new ElasticsearchOptimizer();
    }
    return ElasticsearchOptimizer.instance;
  }

  // Optimize Elasticsearch query
  async optimizeQuery(
    index: string,
    query: any,
    options: {
      size?: number;
      sort?: any[];
      _source?: string[];
      aggs?: any;
      timeout?: string;
      userId?: string;
    } = {}
  ): Promise<QueryOptimization> {
    const startTime = Date.now();
    const improvements: string[] = [];
    let optimizedQuery = { ...query };
    let estimatedGain = 0;

    // 1. Optimize size parameter
    if (!options.size || options.size > 10000) {
      optimizedQuery.size = Math.min(options.size || 100, 10000);
      improvements.push('Limited result size to prevent memory issues');
      estimatedGain += 15;
    }

    // 2. Optimize _source filtering
    if (!options._source && !query._source) {
      optimizedQuery._source = this.getRecommendedSourceFields(index);
      improvements.push('Added source filtering to reduce network overhead');
      estimatedGain += 20;
    }

    // 3. Optimize query structure
    const queryOptimizations = this.optimizeQueryStructure(query);
    if (queryOptimizations.length > 0) {
      improvements.push(...queryOptimizations);
      estimatedGain += 25;
    }

    // 4. Add caching for repeated queries
    const cacheKey = this.generateCacheKey(index, optimizedQuery, options);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      improvements.push('Query result served from cache');
      estimatedGain += 40;
    }

    // 5. Optimize aggregations
    if (query.aggs || options.aggs) {
      const aggOptimizations = this.optimizeAggregations(query.aggs || options.aggs);
      if (aggOptimizations.length > 0) {
        improvements.push(...aggOptimizations);
        estimatedGain += 30;
      }
    }

    // 6. Add timeout if not specified
    if (!options.timeout) {
      optimizedQuery.timeout = '30s';
      improvements.push('Added query timeout to prevent hanging requests');
    }

    const executionTime = Date.now() - startTime;

    return {
      originalQuery: query,
      optimizedQuery,
      improvements,
      estimatedPerformanceGain: Math.min(estimatedGain, 100),
      executionTime
    };
  }

  // Execute optimized Elasticsearch query
  async executeOptimizedQuery(
    index: string,
    query: any,
    options: {
      size?: number;
      sort?: any[];
      _source?: string[];
      aggs?: any;
      timeout?: string;
      userId?: string;
      cacheKey?: string;
      ttl?: number;
    } = {}
  ): Promise<any> {
    const startTime = Date.now();
    const { cacheKey, ttl = 300000, userId } = options;

    try {
      // Check cache first
      if (cacheKey) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          this.recordQueryMetrics(index, Date.now() - startTime, false, true);
          return cached;
        }
      }

      // Optimize the query
      const optimization = await this.optimizeQuery(index, query, options);

      // Execute the optimized query (placeholder for actual ES client)
      const result = await this.executeElasticsearchQuery(index, optimization.optimizedQuery, options);

      const executionTime = Date.now() - startTime;
      this.recordQueryMetrics(index, executionTime, false, false);

      // Cache the result
      if (cacheKey) {
        this.setCache(cacheKey, result, ttl);
      }

      // Log slow queries
      if (executionTime > 2000) {
        this.slowQueries.push({
          query: optimization.optimizedQuery,
          time: executionTime,
          timestamp: new Date()
        });

        if (userId) {
          await auditLogger.logSystemEvent('slow_elasticsearch_query', {
            index,
            query: optimization.optimizedQuery,
            executionTime,
            improvements: optimization.improvements
          }, 'medium');
        }
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordQueryMetrics(index, executionTime, true, false);
      throw error;
    }
  }

  // Get Elasticsearch performance metrics
  async getMetrics(): Promise<ElasticsearchMetrics> {
    // Update cluster health
    try {
      this.metrics.clusterHealth = await this.getClusterHealth();
    } catch (error) {
      console.warn('Could not fetch cluster health:', error);
    }

    // Update index sizes
    try {
      this.metrics.indexSize = await this.getIndexSizes();
    } catch (error) {
      console.warn('Could not fetch index sizes:', error);
    }

    // Update shard statistics
    try {
      this.metrics.shardStats = await this.getShardStats();
    } catch (error) {
      console.warn('Could not fetch shard stats:', error);
    }

    return { ...this.metrics };
  }

  // Get index optimization recommendations
  getIndexRecommendations(): IndexOptimization[] {
    return this.indexRecommendations;
  }

  // Apply index optimizations
  async applyIndexOptimizations(): Promise<{ applied: string[]; failed: string[] }> {
    const applied: string[] = [];
    const failed: string[] = [];

    for (const optimization of this.indexRecommendations) {
      try {
        await this.updateIndexMapping(optimization.index, optimization.recommendedMapping);
        applied.push(optimization.index);
      } catch (error) {
        failed.push(optimization.index);
        console.error(`Failed to optimize index ${optimization.index}:`, error);
      }
    }

    return { applied, failed };
  }

  // Private helper methods
  private optimizeQueryStructure(query: any): string[] {
    const improvements: string[] = [];

    // Check for inefficient wildcard queries
    if (this.hasWildcardQuery(query)) {
      improvements.push('Consider using match queries instead of wildcard queries for better performance');
    }

    // Check for missing filters
    if (this.needsFilterContext(query)) {
      improvements.push('Use filter context for exact matches to improve performance');
    }

    // Check for inefficient sorting
    if (this.hasInefficientSorting(query)) {
      improvements.push('Consider using doc values for sorting instead of field data');
    }

    // Check for missing pagination
    if (this.needsPagination(query)) {
      improvements.push('Add pagination to prevent large result sets');
    }

    return improvements;
  }

  private optimizeAggregations(aggs: any): string[] {
    const improvements: string[] = [];

    // Check for expensive aggregations
    if (this.hasExpensiveAggregations(aggs)) {
      improvements.push('Consider using sampling or reducing aggregation precision');
    }

    // Check for missing size limits
    if (this.needsAggregationSizeLimit(aggs)) {
      improvements.push('Add size limits to aggregations to prevent memory issues');
    }

    return improvements;
  }

  private getRecommendedSourceFields(index: string): string[] {
    const fieldRecommendations: Record<string, string[]> = {
      properties: ['id', 'address', 'postcode', 'property_type', 'bedrooms', 'price', 'beds', 'baths'],
      sales: ['id', 'address', 'postcode', 'price', 'date_of_transfer', 'property_type'],
      hpi: ['region', 'date', 'index', 'change', 'change_percentage'],
      portfolios: ['id', 'name', 'user_id', 'created_at', 'updated_at']
    };

    return fieldRecommendations[index] || ['id'];
  }

  private generateCacheKey(index: string, query: any, options: any): string {
    const queryStr = JSON.stringify(query);
    const optionsStr = JSON.stringify(options);
    return `es:${index}:${Buffer.from(queryStr + optionsStr).toString('base64')}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.result;
  }

  private setCache(key: string, value: any, ttl: number): void {
    this.queryCache.set(key, {
      result: value,
      timestamp: Date.now(),
      ttl
    });
  }

  private async executeElasticsearchQuery(index: string, query: any, options: any): Promise<any> {
    // Placeholder for actual Elasticsearch client execution
    // In a real implementation, this would use the Elasticsearch client
    return {
      hits: {
        total: { value: 0 },
        hits: []
      },
      took: 10,
      timed_out: false
    };
  }

  private async getClusterHealth(): Promise<'green' | 'yellow' | 'red'> {
    // Placeholder for actual cluster health check
    return 'green';
  }

  private async getIndexSizes(): Promise<Record<string, number>> {
    // Placeholder for actual index size retrieval
    return {
      properties: 1024 * 1024 * 100, // 100MB
      sales: 1024 * 1024 * 500, // 500MB
      hpi: 1024 * 1024 * 50 // 50MB
    };
  }

  private async getShardStats(): Promise<Record<string, { primary: number; replica: number; unassigned: number }>> {
    // Placeholder for actual shard statistics
    return {
      properties: { primary: 1, replica: 1, unassigned: 0 },
      sales: { primary: 2, replica: 1, unassigned: 0 },
      hpi: { primary: 1, replica: 0, unassigned: 0 }
    };
  }

  private async updateIndexMapping(index: string, mapping: any): Promise<void> {
    // Placeholder for actual mapping update
    console.log(`Updating mapping for index ${index}:`, mapping);
  }

  private recordQueryMetrics(index: string, time: number, isError: boolean, fromCache: boolean): void {
    this.metrics.queryCount++;
    this.metrics.averageQueryTime = 
      (this.metrics.averageQueryTime * (this.metrics.queryCount - 1) + time) / this.metrics.queryCount;

    if (isError) {
      this.metrics.errorRate = (this.metrics.errorRate * (this.metrics.queryCount - 1) + 1) / this.metrics.queryCount;
    } else {
      this.metrics.errorRate = (this.metrics.errorRate * (this.metrics.queryCount - 1)) / this.metrics.queryCount;
    }

    if (fromCache) {
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate * (this.metrics.queryCount - 1) + 1) / this.metrics.queryCount;
    } else {
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate * (this.metrics.queryCount - 1)) / this.metrics.queryCount;
    }

    if (time > 2000) {
      this.metrics.slowQueries++;
    }
  }

  // Query analysis helper methods
  private hasWildcardQuery(query: any): boolean {
    const queryStr = JSON.stringify(query);
    return queryStr.includes('*') || queryStr.includes('?');
  }

  private needsFilterContext(query: any): boolean {
    // Check if query has exact matches that could use filter context
    return query.bool && query.bool.must && 
           query.bool.must.some((clause: any) => 
             clause.term || clause.terms || clause.range
           );
  }

  private hasInefficientSorting(query: any): boolean {
    return query.sort && query.sort.some((sort: any) => 
      typeof sort === 'string' || 
      (typeof sort === 'object' && !sort._score)
    );
  }

  private needsPagination(query: any): boolean {
    return !query.from && (!query.size || query.size > 1000);
  }

  private hasExpensiveAggregations(aggs: any): boolean {
    const aggStr = JSON.stringify(aggs);
    return aggStr.includes('cardinality') || 
           aggStr.includes('scripted_metric') ||
           aggStr.includes('top_hits');
  }

  private needsAggregationSizeLimit(aggs: any): boolean {
    const aggStr = JSON.stringify(aggs);
    return aggStr.includes('terms') && !aggStr.includes('size');
  }

  private initializeIndexRecommendations(): void {
    this.indexRecommendations = [
      {
        index: 'properties',
        currentMapping: {},
        recommendedMapping: {
          properties: {
            postcode: { type: 'keyword' },
            property_type: { type: 'keyword' },
            bedrooms: { type: 'integer' },
            price: { type: 'integer' },
            address: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            }
          }
        },
        improvements: [
          'Add keyword mapping for postcode and property_type for exact matches',
          'Add text field with keyword subfield for address',
          'Optimize numeric fields for range queries'
        ],
        estimatedImpact: 'high'
      },
      {
        index: 'sales',
        currentMapping: {},
        recommendedMapping: {
          properties: {
            postcode: { type: 'keyword' },
            date_of_transfer: { type: 'date' },
            price: { type: 'integer' },
            property_type: { type: 'keyword' }
          }
        },
        improvements: [
          'Add date mapping for date_of_transfer field',
          'Add keyword mapping for postcode and property_type',
          'Optimize price field for range aggregations'
        ],
        estimatedImpact: 'high'
      }
    ];
  }

  private startMetricsCollection(): void {
    // Clean up old slow queries every hour
    setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      this.slowQueries = this.slowQueries.filter(q => q.timestamp > oneHourAgo);
    }, 60 * 60 * 1000);

    // Clean up query cache every 30 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.queryCache) {
        if (now - cached.timestamp > cached.ttl) {
          this.queryCache.delete(key);
        }
      }
    }, 30 * 60 * 1000);
  }
}

// Export singleton instance
export const elasticsearchOptimizer = ElasticsearchOptimizer.getInstance();
