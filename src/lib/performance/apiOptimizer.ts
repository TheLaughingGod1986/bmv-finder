import { NextRequest, NextResponse } from 'next/server';
import { enhancedCache } from './enhancedCache';
import { auditLogger } from '../audit/auditLogger';

export interface APIMetrics {
  endpoint: string;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  throughput: number;
  lastRequest: Date;
  slowestRequest: number;
  fastestRequest: number;
}

export interface OptimizationConfig {
  enableCaching: boolean;
  enableCompression: boolean;
  enableRateLimiting: boolean;
  enableRequestDeduplication: boolean;
  cacheTTL: number;
  maxConcurrentRequests: number;
  timeoutMs: number;
}

export interface RequestContext {
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  requestId: string;
}

export class APIOptimizer {
  private static instance: APIOptimizer;
  private metrics: Map<string, APIMetrics> = new Map();
  private requestQueue: Map<string, Promise<any>> = new Map();
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();
  private config: OptimizationConfig;

  private constructor() {
    this.config = {
      enableCaching: true,
      enableCompression: true,
      enableRateLimiting: true,
      enableRequestDeduplication: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      maxConcurrentRequests: 100,
      timeoutMs: 30000 // 30 seconds
    };

    this.startMetricsCollection();
  }

  public static getInstance(): APIOptimizer {
    if (!APIOptimizer.instance) {
      APIOptimizer.instance = new APIOptimizer();
    }
    return APIOptimizer.instance;
  }

  // Optimize API request with caching, rate limiting, and deduplication
  async optimizeRequest<T>(
    endpoint: string,
    handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse<T>>,
    request: NextRequest,
    context: RequestContext
  ): Promise<NextResponse<T>> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(endpoint, request, context);

    try {
      // 1. Rate limiting check
      if (this.config.enableRateLimiting) {
        const rateLimitResult = this.checkRateLimit(context.ip, endpoint);
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
            { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() } }
          );
        }
      }

      // 2. Request deduplication
      if (this.config.enableRequestDeduplication && this.requestQueue.has(cacheKey)) {
        const result = await this.requestQueue.get(cacheKey);
        this.recordMetrics(endpoint, Date.now() - startTime, false, true);
        return result;
      }

      // 3. Cache check
      if (this.config.enableCaching && request.method === 'GET') {
        const cachedResponse = await enhancedCache.get<NextResponse<T>>(cacheKey, 'api_responses');
        if (cachedResponse) {
          this.recordMetrics(endpoint, Date.now() - startTime, false, true);
          return cachedResponse;
        }
      }

      // 4. Execute handler
      const requestPromise = this.executeWithTimeout(handler, request, context);
      
      if (this.config.enableRequestDeduplication) {
        this.requestQueue.set(cacheKey, requestPromise);
      }

      const response = await requestPromise;

      // 5. Cache successful responses
      if (this.config.enableCaching && request.method === 'GET' && response.status === 200) {
        await enhancedCache.set(cacheKey, response, 'api_responses', this.config.cacheTTL);
      }

      // 6. Record metrics
      this.recordMetrics(endpoint, Date.now() - startTime, false, false);

      return response;

    } catch (error) {
      this.recordMetrics(endpoint, Date.now() - startTime, true, false);
      
      // Log error for monitoring
      await auditLogger.logSystemEvent('api_error', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        context
      }, 'high');

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    } finally {
      // Clean up request queue
      if (this.config.enableRequestDeduplication) {
        this.requestQueue.delete(cacheKey);
      }
    }
  }

  // Batch multiple API requests for efficiency
  async batchRequests<T>(
    requests: Array<{
      endpoint: string;
      handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse<T>>;
      request: NextRequest;
      context: RequestContext;
    }>
  ): Promise<NextResponse<T>[]> {
    const startTime = Date.now();
    const results: NextResponse<T>[] = [];

    try {
      // Group requests by endpoint for potential optimization
      const groupedRequests = this.groupRequestsByEndpoint(requests);

      // Process each group
      for (const [endpoint, groupRequests] of groupedRequests) {
        if (groupRequests.length === 1) {
          // Single request - use normal optimization
          const result = await this.optimizeRequest(
            endpoint,
            groupRequests[0].handler,
            groupRequests[0].request,
            groupRequests[0].context
          );
          results.push(result);
        } else {
          // Multiple requests - use batch optimization
          const batchResults = await this.optimizeBatchGroup(endpoint, groupRequests);
          results.push(...batchResults);
        }
      }

      return results;
    } catch (error) {
      console.error('Batch request error:', error);
      throw error;
    }
  }

  // Get API performance metrics
  getMetrics(endpoint?: string): APIMetrics | Map<string, APIMetrics> {
    if (endpoint) {
      return this.metrics.get(endpoint) || this.createEmptyMetrics(endpoint);
    }
    return new Map(this.metrics);
  }

  // Get performance recommendations
  getRecommendations(): Array<{
    endpoint: string;
    issue: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const recommendations: Array<{
      endpoint: string;
      issue: string;
      recommendation: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    for (const [endpoint, metrics] of this.metrics) {
      // High response time
      if (metrics.averageResponseTime > 2000) {
        recommendations.push({
          endpoint,
          issue: 'High average response time',
          recommendation: 'Consider adding caching or optimizing database queries',
          priority: 'high'
        });
      }

      // High error rate
      if (metrics.errorRate > 5) {
        recommendations.push({
          endpoint,
          issue: 'High error rate',
          recommendation: 'Investigate and fix error sources',
          priority: 'high'
        });
      }

      // Low cache hit rate
      if (metrics.cacheHitRate < 30 && this.config.enableCaching) {
        recommendations.push({
          endpoint,
          issue: 'Low cache hit rate',
          recommendation: 'Review cache keys and TTL settings',
          priority: 'medium'
        });
      }

      // High throughput with slow response
      if (metrics.throughput > 100 && metrics.averageResponseTime > 1000) {
        recommendations.push({
          endpoint,
          issue: 'High load with slow responses',
          recommendation: 'Consider horizontal scaling or request queuing',
          priority: 'medium'
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Update optimization configuration
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Private helper methods
  private generateCacheKey(
    endpoint: string,
    request: NextRequest,
    context: RequestContext
  ): string {
    const url = new URL(request.url);
    const params = url.searchParams.toString();
    const userId = context.userId || 'anonymous';
    
    return `api:${endpoint}:${userId}:${params}`;
  }

  private checkRateLimit(ip: string, endpoint: string): { allowed: boolean; retryAfter: number } {
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100; // Max requests per minute

    const current = this.rateLimiters.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset or initialize
      this.rateLimiters.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true, retryAfter: 0 };
    }

    if (current.count >= maxRequests) {
      return { 
        allowed: false, 
        retryAfter: Math.ceil((current.resetTime - now) / 1000) 
      };
    }

    current.count++;
    return { allowed: true, retryAfter: 0 };
  }

  private async executeWithTimeout<T>(
    handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse<T>>,
    request: NextRequest,
    context: RequestContext
  ): Promise<NextResponse<T>> {
    return Promise.race([
      handler(request, context),
      new Promise<NextResponse<T>>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout'));
        }, this.config.timeoutMs);
      })
    ]);
  }

  private groupRequestsByEndpoint<T>(
    requests: Array<{
      endpoint: string;
      handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse<T>>;
      request: NextRequest;
      context: RequestContext;
    }>
  ): Map<string, typeof requests> {
    const grouped = new Map<string, typeof requests>();

    for (const request of requests) {
      const existing = grouped.get(request.endpoint) || [];
      existing.push(request);
      grouped.set(request.endpoint, existing);
    }

    return grouped;
  }

  private async optimizeBatchGroup<T>(
    endpoint: string,
    requests: Array<{
      handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse<T>>;
      request: NextRequest;
      context: RequestContext;
    }>
  ): Promise<NextResponse<T>[]> {
    // For now, execute requests in parallel
    // In a real implementation, you might optimize based on the endpoint type
    const promises = requests.map(req => 
      this.optimizeRequest(endpoint, req.handler, req.request, req.context)
    );

    return Promise.all(promises);
  }

  private recordMetrics(
    endpoint: string,
    responseTime: number,
    isError: boolean,
    fromCache: boolean
  ): void {
    const existing = this.metrics.get(endpoint) || this.createEmptyMetrics(endpoint);
    
    existing.requestCount++;
    existing.averageResponseTime = 
      (existing.averageResponseTime * (existing.requestCount - 1) + responseTime) / existing.requestCount;
    
    if (isError) {
      existing.errorRate = (existing.errorRate * (existing.requestCount - 1) + 1) / existing.requestCount;
    } else {
      existing.errorRate = (existing.errorRate * (existing.requestCount - 1)) / existing.requestCount;
    }

    if (fromCache) {
      existing.cacheHitRate = (existing.cacheHitRate * (existing.requestCount - 1) + 1) / existing.requestCount;
    } else {
      existing.cacheHitRate = (existing.cacheHitRate * (existing.requestCount - 1)) / existing.requestCount;
    }

    existing.lastRequest = new Date();
    existing.slowestRequest = Math.max(existing.slowestRequest, responseTime);
    existing.fastestRequest = Math.min(existing.fastestRequest, responseTime);
    existing.throughput = existing.requestCount / ((Date.now() - existing.lastRequest.getTime()) / 1000 / 60);

    this.metrics.set(endpoint, existing);
  }

  private createEmptyMetrics(endpoint: string): APIMetrics {
    return {
      endpoint,
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      cacheHitRate: 0,
      throughput: 0,
      lastRequest: new Date(),
      slowestRequest: 0,
      fastestRequest: Infinity
    };
  }

  private startMetricsCollection(): void {
    // Clean up old rate limiters every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, limiter] of this.rateLimiters) {
        if (now > limiter.resetTime) {
          this.rateLimiters.delete(key);
        }
      }
    }, 60 * 1000);

    // Log performance warnings every 5 minutes
    setInterval(() => {
      const recommendations = this.getRecommendations();
      if (recommendations.length > 0) {
        console.warn('API Performance Issues Detected:', recommendations);
      }
    }, 5 * 60 * 1000);
  }
}

// Export singleton instance
export const apiOptimizer = APIOptimizer.getInstance();

// Higher-order function to wrap API handlers with optimization
export function withAPIOptimization<T>(
  handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse<T>>,
  endpoint: string
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const context: RequestContext = {
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
      requestId: crypto.randomUUID()
    };

    return apiOptimizer.optimizeRequest(endpoint, handler, request, context);
  };
}
