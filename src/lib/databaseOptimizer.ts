import { performanceMonitor } from './performanceMonitor';
import { propertyCache, searchCache } from './cache';

interface QueryMetrics {
  query: string;
  executionTime: number;
  resultSize: number;
  cacheHit: boolean;
  timestamp: number;
  userId?: string;
}

interface DatabaseConfig {
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  enableQueryCache: boolean;
  enableSlowQueryLogging: boolean;
  slowQueryThreshold: number;
}

interface QueryCacheEntry {
  result: unknown;
  timestamp: number;
  ttl: number;
  accessCount: number;
}

class DatabaseOptimizer {
  private config: DatabaseConfig;
  private queryMetrics: QueryMetrics[] = [];
  private queryCache = new Map<string, QueryCacheEntry>();
  private maxQueryMetrics = 1000;
  private maxQueryCacheSize = 500;

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = {
      maxConnections: config.maxConnections || 10,
      connectionTimeout: config.connectionTimeout || 30000,
      queryTimeout: config.queryTimeout || 10000,
      enableQueryCache: config.enableQueryCache ?? true,
      enableSlowQueryLogging: config.enableSlowQueryLogging ?? true,
      slowQueryThreshold: config.slowQueryThreshold || 1000
    };

    // Start periodic cleanup
    this.startCleanup();
  }

  // Query execution with performance tracking
  async executeQuery<T>(
    query: string,
    params: unknown[] = [],
    options: {
      cacheKey?: string;
      ttl?: number;
      userId?: string;
      forceRefresh?: boolean;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const { cacheKey, ttl = 300000, userId, forceRefresh = false } = options;

    // Check query cache first
    if (this.config.enableQueryCache && cacheKey && !forceRefresh) {
      const cachedResult = this.getFromQueryCache<T>(cacheKey);
      if (cachedResult !== null) {
        this.trackQueryMetrics(query, Date.now() - startTime, 0, true, userId);
        return cachedResult;
      }
    }

    try {
      // Execute the actual query (placeholder for now)
      const result = await this.executeDatabaseQuery<T>(query, params);
      
      const executionTime = Date.now() - startTime;
      const resultSize = this.calculateResultSize(result);

      // Track query performance
      this.trackQueryMetrics(query, executionTime, resultSize, false, userId);

      // Cache the result if caching is enabled
      if (this.config.enableQueryCache && cacheKey) {
        this.setQueryCache(cacheKey, result, ttl);
      }

      // Log slow queries
      if (executionTime > this.config.slowQueryThreshold && this.config.enableSlowQueryLogging) {
        console.warn(`Slow query detected: ${query} took ${executionTime}ms`);
        this.analyzeSlowQuery(query, executionTime, resultSize);
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.trackQueryMetrics(query, executionTime, 0, false, userId);
      
      console.error(`Query execution failed: ${query}`, error);
      throw error;
    }
  }

  // Batch query execution for better performance
  async executeBatchQueries<T>(
    queries: Array<{
      query: string;
      params: unknown[];
      cacheKey?: string;
      ttl?: number;
    }>,
    options: {
      parallel?: boolean;
      userId?: string;
    } = {}
  ): Promise<T[]> {
    const { parallel = true, userId } = options;
    const startTime = Date.now();

    try {
      let results: T[];

      if (parallel) {
        // Execute queries in parallel for better performance
        const queryPromises = queries.map(({ query, params, cacheKey, ttl }) =>
          this.executeQuery<T>(query, params, { cacheKey, ttl, userId })
        );
        results = await Promise.all(queryPromises);
      } else {
        // Execute queries sequentially
        results = [];
        for (const { query, params, cacheKey, ttl } of queries) {
          const result = await this.executeQuery<T>(query, params, { cacheKey, ttl, userId });
          results.push(result);
        }
      }

      const totalTime = Date.now() - startTime;
      performanceMonitor.trackMetric(
        'batch_query_execution',
        totalTime,
        'ms',
        { queryCount: queries.length, parallel, userId }
      );

      return results;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      performanceMonitor.trackMetric(
        'batch_query_error',
        totalTime,
        'ms',
        { queryCount: queries.length, error: error instanceof Error ? error.message : 'Unknown error', userId }
      );
      throw error;
    }
  }

  // Query result caching
  private getFromQueryCache<T>(key: string): T | null {
    const entry = this.queryCache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.queryCache.delete(key);
      return null;
    }

    // Update access count
    entry.accessCount++;
    return entry.result as T;
  }

  private setQueryCache<T>(key: string, result: T, ttl: number): void {
    // Remove oldest entries if cache is full
    if (this.queryCache.size >= this.maxQueryCacheSize) {
      this.evictOldestCacheEntries();
    }

    this.queryCache.set(key, {
      result,
      timestamp: Date.now(),
      ttl,
      accessCount: 0
    });
  }

  private evictOldestCacheEntries(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.queryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.queryCache.delete(oldestKey);
    }
  }

  // Query performance tracking
  private trackQueryMetrics(
    query: string,
    executionTime: number,
    resultSize: number,
    cacheHit: boolean,
    userId?: string
  ): void {
    const metric: QueryMetrics = {
      query: this.sanitizeQuery(query),
      executionTime,
      resultSize,
      cacheHit,
      timestamp: Date.now(),
      userId
    };

    this.queryMetrics.push(metric);
    this.trimQueryMetrics();

    // Track in performance monitor
    performanceMonitor.trackMetric(
      'database_query',
      executionTime,
      'ms',
      { resultSize, cacheHit, userId }
    );
  }

  // Query analysis and optimization suggestions
  private analyzeSlowQuery(query: string, executionTime: number, resultSize: number): void {
    const suggestions: string[] = [];

    // Analyze query patterns and suggest optimizations
    if (query.toLowerCase().includes('select *')) {
      suggestions.push('Consider selecting only required columns instead of SELECT *');
    }

    if (query.toLowerCase().includes('order by') && !query.toLowerCase().includes('limit')) {
      suggestions.push('Add LIMIT clause to ORDER BY queries for better performance');
    }

    if (query.toLowerCase().includes('like %')) {
      suggestions.push('Avoid leading wildcards in LIKE queries - consider full-text search');
    }

    if (resultSize > 1000) {
      suggestions.push('Consider implementing pagination for large result sets');
    }

    if (suggestions.length > 0) {
      console.log(`Query optimization suggestions for slow query:`, suggestions);
    }
  }

  // Query sanitization for security and logging
  private sanitizeQuery(query: string): string {
    // Remove sensitive information and normalize for logging
    return query
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200); // Limit length for logging
  }

  // Calculate result size for performance tracking
  private calculateResultSize(result: unknown): number {
    if (Array.isArray(result)) {
      return result.length;
    }
    if (typeof result === 'object' && result !== null) {
      return Object.keys(result).length;
    }
    return 1;
  }

  // Placeholder for actual database query execution
  private async executeDatabaseQuery<T>(query: string, params: unknown[]): Promise<T> {
    // This is a placeholder - in production, you'd integrate with your actual database
    // For now, we'll simulate a database delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    // Return mock data based on query type
    if (query.toLowerCase().includes('select')) {
      return [] as T;
    }
    return {} as T;
  }

  // Performance analysis and reporting
  getQueryPerformanceReport(): {
    totalQueries: number;
    avgExecutionTime: number;
    cacheHitRate: number;
    slowQueries: number;
    topSlowQueries: Array<{ query: string; avgTime: number; count: number }>;
    recommendations: string[];
  } {
    if (this.queryMetrics.length === 0) {
      return {
        totalQueries: 0,
        avgExecutionTime: 0,
        cacheHitRate: 0,
        slowQueries: 0,
        topSlowQueries: [],
        recommendations: []
      };
    }

    const totalQueries = this.queryMetrics.length;
    const avgExecutionTime = this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries;
    const cacheHitRate = (this.queryMetrics.filter(m => m.cacheHit).length / totalQueries) * 100;
    const slowQueries = this.queryMetrics.filter(m => m.executionTime > this.config.slowQueryThreshold).length;

    // Analyze top slow queries
    const queryStats = new Map<string, { totalTime: number; count: number }>();
    for (const metric of this.queryMetrics) {
      const existing = queryStats.get(metric.query) || { totalTime: 0, count: 0 };
      existing.totalTime += metric.executionTime;
      existing.count += 1;
      queryStats.set(metric.query, existing);
    }

    const topSlowQueries = Array.from(queryStats.entries())
      .map(([query, stats]) => ({
        query,
        avgTime: Math.round(stats.totalTime / stats.count),
        count: stats.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    // Generate recommendations
    const recommendations: string[] = [];
    if (avgExecutionTime > 500) {
      recommendations.push('Consider implementing database indexing for frequently queried fields');
    }
    if (cacheHitRate < 50) {
      recommendations.push('Review query cache TTL settings and frequently accessed data patterns');
    }
    if (slowQueries > 0) {
      recommendations.push('Analyze slow queries and implement query optimization strategies');
    }

    return {
      totalQueries,
      avgExecutionTime: Math.round(avgExecutionTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      slowQueries,
      topSlowQueries,
      recommendations
    };
  }

  // Cache management
  clearQueryCache(): void {
    this.queryCache.clear();
  }

  getQueryCacheStats(): {
    size: number;
    hitRate: number;
    totalAccesses: number;
  } {
    const totalAccesses = Array.from(this.queryCache.values()).reduce((sum, entry) => sum + entry.accessCount, 0);
    const hitRate = this.queryMetrics.length > 0 ? 
      (this.queryMetrics.filter(m => m.cacheHit).length / this.queryMetrics.length) * 100 : 0;

    return {
      size: this.queryCache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalAccesses
    };
  }

  // Utility methods
  private trimQueryMetrics(): void {
    if (this.queryMetrics.length > this.maxQueryMetrics) {
      const excess = this.queryMetrics.length - this.maxQueryMetrics;
      this.queryMetrics.splice(0, excess);
    }
  }

  private startCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.queryCache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.queryCache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  // Configuration management
  updateConfig(newConfig: Partial<DatabaseConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): DatabaseConfig {
    return { ...this.config };
  }
}

// Create singleton instance
export const databaseOptimizer = new DatabaseOptimizer();

// Export types and utilities
export type { QueryMetrics, DatabaseConfig, QueryCacheEntry };
export { DatabaseOptimizer };

export default databaseOptimizer;
