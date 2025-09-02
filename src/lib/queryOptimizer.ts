// Advanced database query optimization service for Elasticsearch and PostgreSQL

import { esClient } from './esClient';
import { createClient } from '@supabase/supabase-js';

interface QueryOptimizationConfig {
  maxQueryTime: number; // milliseconds
  maxResults: number;
  enableCaching: boolean;
  cacheTimeout: number; // seconds
  enableQueryAnalysis: boolean;
  enableSlowQueryLogging: boolean;
  slowQueryThreshold: number; // milliseconds
}

interface QueryMetrics {
  queryId: string;
  queryType: string;
  executionTime: number;
  resultCount: number;
  cacheHit: boolean;
  optimizationApplied: string[];
  timestamp: Date;
}

interface OptimizedQuery {
  query: any;
  optimization: {
    applied: string[];
    estimatedTime: number;
    cacheKey?: string;
  };
}

class QueryOptimizer {
  private config: QueryOptimizationConfig;
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private queryMetrics: QueryMetrics[] = [];
  private slowQueries: QueryMetrics[] = [];

  constructor(config?: Partial<QueryOptimizationConfig>) {
    this.config = {
      maxQueryTime: 5000,
      maxResults: 10000,
      enableCaching: true,
      cacheTimeout: 300, // 5 minutes
      enableQueryAnalysis: true,
      enableSlowQueryLogging: true,
      slowQueryThreshold: 1000,
      ...config
    };

    // Clean up expired cache entries every 5 minutes
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000);
  }

  // Optimize Elasticsearch queries
  async optimizeElasticsearchQuery(
    index: string,
    query: any,
    options: {
      size?: number;
      sort?: any[];
      _source?: string[];
      aggs?: any;
      timeout?: string;
    } = {}
  ): Promise<OptimizedQuery> {
    const queryId = this.generateQueryId();
    const startTime = Date.now();
    
    const optimizations: string[] = [];
    
    // Apply query optimizations
    const optimizedQuery = { ...query };
    const optimizedOptions = { ...options };

    // 1. Limit result size
    if (!optimizedOptions.size || optimizedOptions.size > this.config.maxResults) {
      optimizedOptions.size = Math.min(optimizedOptions.size || 100, this.config.maxResults);
      optimizations.push('result_size_limit');
    }

    // 2. Add timeout
    if (!optimizedOptions.timeout) {
      optimizedOptions.timeout = `${this.config.maxQueryTime}ms`;
      optimizations.push('query_timeout');
    }

    // 3. Optimize source fields
    if (optimizedOptions._source && optimizedOptions._source.length > 20) {
      // Limit source fields to essential ones
      optimizedOptions._source = optimizedOptions._source.slice(0, 20);
      optimizations.push('source_field_limit');
    }

    // 4. Add query caching
    const cacheKey = this.generateCacheKey(index, optimizedQuery, optimizedOptions);
    if (this.config.enableCaching) {
      const cachedResult = this.getCachedQuery(cacheKey);
      if (cachedResult) {
        return {
          query: optimizedQuery,
          optimization: {
            applied: [...optimizations, 'cache_hit'],
            estimatedTime: 0,
            cacheKey
          }
        };
      }
    }

    // 5. Optimize sort fields
    if (optimizedOptions.sort && optimizedOptions.sort.length > 3) {
      optimizedOptions.sort = optimizedOptions.sort.slice(0, 3);
      optimizations.push('sort_field_limit');
    }

    // 6. Add query analysis
    if (this.config.enableQueryAnalysis) {
      this.analyzeQuery(optimizedQuery, optimizations);
    }

    const estimatedTime = this.estimateQueryTime(optimizedQuery, optimizedOptions);

    return {
      query: optimizedQuery,
      optimization: {
        applied: optimizations,
        estimatedTime,
        cacheKey: this.config.enableCaching ? cacheKey : undefined
      }
    };
  }

  // Execute optimized Elasticsearch query
  async executeElasticsearchQuery(
    index: string,
    query: any,
    options: any = {}
  ): Promise<any> {
    const queryId = this.generateQueryId();
    const startTime = Date.now();

    try {
      // Optimize the query
      const optimized = await this.optimizeElasticsearchQuery(index, query, options);
      
      // Execute the query
      const result = await esClient.search({
        index,
        ...optimized.query,
        ...options
      });

      const executionTime = Date.now() - startTime;
      const resultCount = result.hits?.hits?.length || 0;

      // Cache the result if caching is enabled
      if (this.config.enableCaching && optimized.optimization.cacheKey) {
        this.cacheQuery(optimized.optimization.cacheKey, result);
      }

      // Record metrics
      const metrics: QueryMetrics = {
        queryId,
        queryType: 'elasticsearch',
        executionTime,
        resultCount,
        cacheHit: optimized.optimization.applied.includes('cache_hit'),
        optimizationApplied: optimized.optimization.applied,
        timestamp: new Date()
      };

      this.recordQueryMetrics(metrics);

      // Log slow queries
      if (executionTime > this.config.slowQueryThreshold) {
        this.logSlowQuery(metrics);
      }

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`Query execution failed after ${executionTime}ms:`, error);
      throw error;
    }
  }

  // Optimize PostgreSQL queries
  async optimizePostgreSQLQuery(
    query: string,
    params: any[] = []
  ): Promise<{ query: string; params: any[]; optimization: string[] }> {
    const optimizations: string[] = [];
    let optimizedQuery = query;

    // 1. Add LIMIT if not present
    if (!query.toLowerCase().includes('limit') && !query.toLowerCase().includes('count(')) {
      optimizedQuery += ` LIMIT ${this.config.maxResults}`;
      optimizations.push('added_limit');
    }

    // 2. Optimize SELECT statements
    if (query.toLowerCase().includes('select *')) {
      // This would require schema analysis in a real implementation
      optimizations.push('select_optimization_needed');
    }

    // 3. Add query hints for common patterns
    if (query.toLowerCase().includes('order by') && !query.toLowerCase().includes('index')) {
      optimizations.push('index_hint_needed');
    }

    return {
      query: optimizedQuery,
      params,
      optimization: optimizations
    };
  }

  // Execute optimized PostgreSQL query
  async executePostgreSQLQuery(
    query: string,
    params: any[] = []
  ): Promise<any> {
    const queryId = this.generateQueryId();
    const startTime = Date.now();

    try {
      // Optimize the query
      const optimized = await this.optimizePostgreSQLQuery(query, params);
      
      // Execute the query (this would use Supabase client in real implementation)
      // const result = await supabase.rpc('execute_query', { query: optimized.query, params: optimized.params });
      
      const executionTime = Date.now() - startTime;

      // Record metrics
      const metrics: QueryMetrics = {
        queryId,
        queryType: 'postgresql',
        executionTime,
        resultCount: 0, // Would be actual result count
        cacheHit: false,
        optimizationApplied: optimized.optimization,
        timestamp: new Date()
      };

      this.recordQueryMetrics(metrics);

      // Log slow queries
      if (executionTime > this.config.slowQueryThreshold) {
        this.logSlowQuery(metrics);
      }

      // Return mock result for now
      return { data: [], error: null };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`PostgreSQL query execution failed after ${executionTime}ms:`, error);
      throw error;
    }
  }

  // Batch query optimization
  async optimizeBatchQueries(queries: Array<{ index: string; query: any; options?: any }>): Promise<OptimizedQuery[]> {
    const optimizedQueries: OptimizedQuery[] = [];

    for (const { index, query, options } of queries) {
      const optimized = await this.optimizeElasticsearchQuery(index, query, options);
      optimizedQueries.push(optimized);
    }

    return optimizedQueries;
  }

  // Execute batch queries
  async executeBatchQueries(queries: Array<{ index: string; query: any; options?: any }>): Promise<any[]> {
    const optimizedQueries = await this.optimizeBatchQueries(queries);
    const results: any[] = [];

    // Execute queries in parallel with concurrency limit
    const concurrencyLimit = 5;
    const chunks = this.chunkArray(optimizedQueries, concurrencyLimit);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (optimized, index) => {
        const originalQuery = queries[index];
        return this.executeElasticsearchQuery(originalQuery.index, optimized.query, originalQuery.options);
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }

  // Query performance analysis
  analyzeQuery(query: any, optimizations: string[]): void {
    const analysis = {
      queryComplexity: this.calculateQueryComplexity(query),
      optimizationScore: this.calculateOptimizationScore(optimizations),
      recommendations: this.generateRecommendations(query, optimizations)
    };

    if (this.config.enableQueryAnalysis) {
      console.log('Query Analysis:', analysis);
    }
  }

  // Calculate query complexity score
  private calculateQueryComplexity(query: any): number {
    let complexity = 0;
    
    if (query.bool) {
      complexity += 10;
      if (query.bool.must) complexity += query.bool.must.length * 2;
      if (query.bool.should) complexity += query.bool.should.length * 1;
      if (query.bool.filter) complexity += query.bool.filter.length * 1;
    }
    
    if (query.range) complexity += 5;
    if (query.term) complexity += 3;
    if (query.match) complexity += 4;
    if (query.prefix) complexity += 2;
    
    return complexity;
  }

  // Calculate optimization score
  private calculateOptimizationScore(optimizations: string[]): number {
    const optimizationWeights: Record<string, number> = {
      'cache_hit': 10,
      'result_size_limit': 8,
      'query_timeout': 6,
      'source_field_limit': 5,
      'sort_field_limit': 4,
      'added_limit': 7,
      'select_optimization_needed': -2,
      'index_hint_needed': -1
    };

    return optimizations.reduce((score, opt) => {
      return score + (optimizationWeights[opt] || 0);
    }, 0);
  }

  // Generate optimization recommendations
  private generateRecommendations(query: any, optimizations: string[]): string[] {
    const recommendations: string[] = [];

    if (!optimizations.includes('cache_hit') && this.config.enableCaching) {
      recommendations.push('Consider enabling query caching for better performance');
    }

    if (this.calculateQueryComplexity(query) > 20) {
      recommendations.push('Query complexity is high, consider breaking into smaller queries');
    }

    if (optimizations.includes('select_optimization_needed')) {
      recommendations.push('Avoid SELECT * queries, specify only needed fields');
    }

    if (optimizations.includes('index_hint_needed')) {
      recommendations.push('Consider adding database indexes for ORDER BY clauses');
    }

    return recommendations;
  }

  // Estimate query execution time
  private estimateQueryTime(query: any, options: any): number {
    let estimatedTime = 100; // Base time

    // Add time based on query complexity
    estimatedTime += this.calculateQueryComplexity(query) * 10;

    // Add time based on result size
    if (options.size) {
      estimatedTime += options.size * 0.1;
    }

    // Add time based on sort complexity
    if (options.sort) {
      estimatedTime += options.sort.length * 20;
    }

    return Math.min(estimatedTime, this.config.maxQueryTime);
  }

  // Cache management
  private generateCacheKey(index: string, query: any, options: any): string {
    const keyData = { index, query, options };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  private getCachedQuery(cacheKey: string): any | null {
    const cached = this.queryCache.get(cacheKey);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl * 1000) {
      this.queryCache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  private cacheQuery(cacheKey: string, data: any): void {
    this.queryCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cacheTimeout
    });
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.queryCache.entries()) {
      if (now - cached.timestamp > cached.ttl * 1000) {
        this.queryCache.delete(key);
      }
    }
  }

  // Metrics and monitoring
  private recordQueryMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);
    
    // Keep only last 1000 metrics
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }
  }

  private logSlowQuery(metrics: QueryMetrics): void {
    this.slowQueries.push(metrics);
    
    if (this.config.enableSlowQueryLogging) {
      console.warn(`Slow query detected:`, {
        queryId: metrics.queryId,
        executionTime: metrics.executionTime,
        queryType: metrics.queryType,
        optimizations: metrics.optimizationApplied
      });
    }
  }

  // Utility methods
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Get performance statistics
  getPerformanceStats(): {
    totalQueries: number;
    averageExecutionTime: number;
    cacheHitRate: number;
    slowQueries: number;
    optimizationScore: number;
  } {
    const totalQueries = this.queryMetrics.length;
    if (totalQueries === 0) {
      return {
        totalQueries: 0,
        averageExecutionTime: 0,
        cacheHitRate: 0,
        slowQueries: 0,
        optimizationScore: 0
      };
    }

    const totalExecutionTime = this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0);
    const cacheHits = this.queryMetrics.filter(m => m.cacheHit).length;
    const slowQueries = this.slowQueries.length;
    const totalOptimizationScore = this.queryMetrics.reduce((sum, m) => {
      return sum + this.calculateOptimizationScore(m.optimizationApplied);
    }, 0);

    return {
      totalQueries,
      averageExecutionTime: totalExecutionTime / totalQueries,
      cacheHitRate: (cacheHits / totalQueries) * 100,
      slowQueries,
      optimizationScore: totalOptimizationScore / totalQueries
    };
  }

  // Get slow query report
  getSlowQueryReport(): QueryMetrics[] {
    return [...this.slowQueries].sort((a, b) => b.executionTime - a.executionTime);
  }

  // Clear metrics and cache
  clearMetrics(): void {
    this.queryMetrics = [];
    this.slowQueries = [];
  }

  clearCache(): void {
    this.queryCache.clear();
  }
}

// Singleton instance
export const queryOptimizer = new QueryOptimizer();

// Export types
export type { QueryOptimizationConfig, QueryMetrics, OptimizedQuery };
