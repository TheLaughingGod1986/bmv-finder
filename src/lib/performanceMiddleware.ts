import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from './performanceMonitor';
import { hpiCache, propertyCache, postcodeCache, searchCache, portfolioCache } from './cache';

interface PerformanceMiddlewareConfig {
  trackCache: boolean;
  trackUser: boolean;
  slowQueryThreshold: number;
  enableLogging: boolean;
}

interface CacheInfo {
  hit: boolean;
  cacheName: string;
  key: string;
}

class PerformanceMiddleware {
  private config: PerformanceMiddlewareConfig;

  constructor(config: Partial<PerformanceMiddlewareConfig> = {}) {
    this.config = {
      trackCache: config.trackCache ?? true,
      trackUser: config.trackUser ?? true,
      slowQueryThreshold: config.slowQueryThreshold ?? 1000,
      enableLogging: config.enableLogging ?? true
    };
  }

  // Middleware function for API routes
  async withPerformanceTracking<T>(
    request: NextRequest,
    handler: () => Promise<NextResponse<T>>,
    options?: {
      endpoint?: string;
      method?: string;
      userId?: string;
    }
  ): Promise<NextResponse<T>> {
    const startTime = Date.now();
    const endpoint = options?.endpoint || request.nextUrl.pathname;
    const method = options?.method || request.method;
    const userId = options?.userId || this.extractUserId(request);

    let response: NextResponse<T>;
    let cacheInfo: CacheInfo | undefined;

    try {
      // Track cache performance if enabled
      if (this.config.trackCache) {
        cacheInfo = await this.trackCachePerformance(request);
      }

      // Execute the actual handler
      response = await handler();

      // Track API performance
      const responseTime = Date.now() - startTime;
      this.trackAPIPerformance(endpoint, method, responseTime, response.status, userId, cacheInfo?.hit);

      // Log slow queries
      if (responseTime > this.config.slowQueryThreshold && this.config.enableLogging) {
        console.warn(`Slow API call: ${method} ${endpoint} took ${responseTime}ms`);
      }

      return response;
    } catch (error) {
      // Track failed API calls
      const responseTime = Date.now() - startTime;
      this.trackAPIPerformance(endpoint, method, responseTime, 500, userId, cacheInfo?.hit);

      if (this.config.enableLogging) {
        console.error(`API error: ${method} ${endpoint} failed after ${responseTime}ms:`, error);
      }

      throw error;
    }
  }

  // Cache performance tracking
  private async trackCachePerformance(request: NextRequest): Promise<CacheInfo> {
    const url = request.nextUrl;
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    // Determine which cache to check based on the endpoint
    let cacheName = 'unknown';
    let cacheKey = '';
    let cacheHit = false;

    if (pathname.startsWith('/api/hpi')) {
      cacheName = 'hpi';
      const postcode = searchParams.get('postcode');
      if (postcode) {
        cacheKey = `hpi:postcode:${postcode.toUpperCase()}`;
        cacheHit = hpiCache.has(cacheKey);
      }
    } else if (pathname.startsWith('/api/property-search') || pathname.startsWith('/api/enhanced-property-search')) {
      cacheName = 'property';
      const query = searchParams.get('query') || searchParams.get('q');
      if (query) {
        cacheKey = `property:search:${query}`;
        cacheHit = propertyCache.has(cacheKey);
      }
    } else if (pathname.startsWith('/api/address-suggestions')) {
      cacheName = 'postcode';
      const query = searchParams.get('query') || searchParams.get('q');
      if (query) {
        cacheKey = `postcode:suggestions:${query.toLowerCase()}`;
        cacheHit = postcodeCache.has(cacheKey);
      }
    } else if (pathname.startsWith('/api/portfolio')) {
      cacheName = 'portfolio';
      const userId = this.extractUserId(request);
      if (userId) {
        cacheKey = `portfolio:properties:${userId}`;
        cacheHit = portfolioCache.has(cacheKey);
      }
    }

    // Track cache performance
    if (cacheName !== 'unknown') {
      const cache = this.getCacheByName(cacheName);
      if (cache) {
        const stats = cache.getStats();
        performanceMonitor.trackCache(cacheName, stats.hitRate, stats.size, stats.memoryUsage);
      }
    }

    return {
      hit: cacheHit,
      cacheName,
      key: cacheKey
    };
  }

  // Get cache instance by name
  private getCacheByName(cacheName: string) {
    switch (cacheName) {
      case 'hpi':
        return hpiCache;
      case 'property':
        return propertyCache;
      case 'postcode':
        return postcodeCache;
      case 'search':
        return searchCache;
      case 'portfolio':
        return portfolioCache;
      default:
        return null;
    }
  }

  // Extract user ID from request
  private extractUserId(request: NextRequest): string | undefined {
    // Try to extract user ID from various sources
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // In a real implementation, you'd decode the JWT to get user ID
      return 'user-from-token';
    }

    const userId = request.headers.get('x-user-id');
    if (userId) {
      return userId;
    }

    // Check cookies for user session
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const sessionMatch = cookieHeader.match(/session=([^;]+)/);
      if (sessionMatch) {
        return 'user-from-session';
      }
    }

    return undefined;
  }

  // Track API performance
  private trackAPIPerformance(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    userId?: string,
    cacheHit?: boolean
  ): void {
    performanceMonitor.trackAPI(endpoint, method, responseTime, statusCode, userId, cacheHit);
  }

  // Utility method to create a wrapped handler
  static wrapHandler<T>(
    handler: (request: NextRequest) => Promise<NextResponse<T>>,
    config?: Partial<PerformanceMiddlewareConfig>
  ) {
    const middleware = new PerformanceMiddleware(config);
    
    return async (request: NextRequest): Promise<NextResponse<T>> => {
      return middleware.withPerformanceTracking(request, () => handler(request));
    };
  }

  // Batch performance tracking for multiple operations
  async trackBatchOperation<T>(
    operationName: string,
    operations: Array<() => Promise<T>>,
    metadata?: Record<string, unknown>
  ): Promise<T[]> {
    const startTime = Date.now();
    const results: T[] = [];

    try {
      for (let i = 0; i < operations.length; i++) {
        const operationStart = Date.now();
        const result = await operations[i]();
        const operationTime = Date.now() - operationStart;
        
        results.push(result);
        
        // Track individual operation performance
        performanceMonitor.trackMetric(
          `${operationName}_operation`,
          operationTime,
          'ms',
          { operationIndex: i, ...metadata }
        );
      }

      const totalTime = Date.now() - startTime;
      performanceMonitor.trackMetric(
        `${operationName}_batch`,
        totalTime,
        'ms',
        { operationCount: operations.length, ...metadata }
      );

      return results;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      performanceMonitor.trackMetric(
        `${operationName}_batch_error`,
        totalTime,
        'ms',
        { operationCount: operations.length, error: error instanceof Error ? error.message : 'Unknown error', ...metadata }
      );
      throw error;
    }
  }

  // Cache warming utilities
  async warmCacheForEndpoint(endpoint: string, params: Record<string, string>): Promise<void> {
    if (endpoint.startsWith('/api/hpi')) {
      const postcode = params.postcode;
      if (postcode) {
        const cacheKey = `hpi:postcode:${postcode.toUpperCase()}`;
        if (!hpiCache.has(cacheKey)) {
          // In a real implementation, you'd prefetch the data
          console.log(`Warming cache for HPI postcode: ${postcode}`);
        }
      }
    }
    // Add more cache warming logic for other endpoints
  }

  // Performance optimization suggestions
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const apiPerf = performanceMonitor.getAPIPerformance();
    const cachePerf = performanceMonitor.getCachePerformance();

    if (apiPerf.avgResponseTime > 1000) {
      suggestions.push('Consider implementing database query optimization and indexing');
    }

    if (cachePerf.avgHitRate < 70) {
      suggestions.push('Review cache invalidation strategy and increase TTL for frequently accessed data');
    }

    if (apiPerf.slowCalls > 0) {
      suggestions.push('Implement query result caching for slow operations');
    }

    return suggestions;
  }
}

// Export the middleware class and a default instance
export const performanceMiddleware = new PerformanceMiddleware();

// Export types and utilities
export type { PerformanceMiddlewareConfig, CacheInfo };
export { PerformanceMiddleware };

export default performanceMiddleware;
