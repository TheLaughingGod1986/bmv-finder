import { NextRequest, NextResponse } from 'next/server';

interface APIMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
  error?: string;
}

interface PerformanceStats {
  avgResponseTime: number;
  totalRequests: number;
  successRate: number;
  errorRate: number;
  slowestEndpoints: Array<{
    endpoint: string;
    avgResponseTime: number;
    requestCount: number;
  }>;
  recentErrors: Array<{
    endpoint: string;
    error: string;
    timestamp: number;
  }>;
}

class APIPerformanceMonitor {
  private metrics: APIMetric[] = [];
  private maxMetrics = 10000; // Keep last 10k requests

  // Track API call
  trackAPICall(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    userAgent?: string,
    ip?: string,
    error?: string
  ): void {
    const metric: APIMetric = {
      endpoint,
      method,
      responseTime,
      statusCode,
      timestamp: Date.now(),
      userAgent,
      ip,
      error
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests
    if (responseTime > 2000) {
      console.warn(`🐌 Slow API request: ${method} ${endpoint} took ${responseTime}ms`);
    }

    // Log errors
    if (statusCode >= 400) {
      console.error(`❌ API error: ${method} ${endpoint} returned ${statusCode}`, error);
    }
  }

  // Get performance statistics
  getPerformanceStats(timeRange?: { start: number; end: number }): PerformanceStats {
    let filteredMetrics = this.metrics;

    if (timeRange) {
      filteredMetrics = this.metrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return {
        avgResponseTime: 0,
        totalRequests: 0,
        successRate: 0,
        errorRate: 0,
        slowestEndpoints: [],
        recentErrors: []
      };
    }

    const totalRequests = filteredMetrics.length;
    const successfulRequests = filteredMetrics.filter(m => m.statusCode < 400).length;
    const avgResponseTime = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;

    // Group by endpoint for slowest endpoints
    const endpointStats = new Map<string, { totalTime: number; count: number }>();
    filteredMetrics.forEach(m => {
      const key = `${m.method} ${m.endpoint}`;
      const existing = endpointStats.get(key) || { totalTime: 0, count: 0 };
      endpointStats.set(key, {
        totalTime: existing.totalTime + m.responseTime,
        count: existing.count + 1
      });
    });

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgResponseTime: stats.totalTime / stats.count,
        requestCount: stats.count
      }))
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 10);

    // Recent errors
    const recentErrors = filteredMetrics
      .filter(m => m.statusCode >= 400)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20)
      .map(m => ({
        endpoint: `${m.method} ${m.endpoint}`,
        error: m.error || `HTTP ${m.statusCode}`,
        timestamp: m.timestamp
      }));

    return {
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      totalRequests,
      successRate: Math.round((successfulRequests / totalRequests) * 10000) / 100,
      errorRate: Math.round(((totalRequests - successfulRequests) / totalRequests) * 10000) / 100,
      slowestEndpoints,
      recentErrors
    };
  }

  // Get health status
  getHealthStatus(): { status: string; score: number; issues: string[] } {
    const stats = this.getPerformanceStats();
    const issues: string[] = [];
    let score = 100;

    if (stats.avgResponseTime > 2000) {
      issues.push(`High average response time: ${stats.avgResponseTime}ms`);
      score -= 20;
    }

    if (stats.successRate < 95) {
      issues.push(`Low success rate: ${stats.successRate}%`);
      score -= 30;
    }

    if (stats.errorRate > 5) {
      issues.push(`High error rate: ${stats.errorRate}%`);
      score -= 25;
    }

    if (stats.slowestEndpoints.length > 0 && stats.slowestEndpoints[0].avgResponseTime > 5000) {
      issues.push(`Very slow endpoint: ${stats.slowestEndpoints[0].endpoint}`);
      score -= 15;
    }

    let status = 'healthy';
    if (score < 50) status = 'critical';
    else if (score < 80) status = 'warning';

    return { status, score: Math.max(0, score), issues };
  }

  // Clear old metrics
  clearOldMetrics(olderThanHours: number = 24): void {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }
}

// Singleton instance
export const apiPerformanceMonitor = new APIPerformanceMonitor();

// Middleware wrapper for automatic tracking
export function withAPITracking(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const endpoint = req.nextUrl.pathname;
    const method = req.method;
    const userAgent = req.headers.get('user-agent') || undefined;
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

    try {
      const response = await handler(req);
      const responseTime = Date.now() - startTime;

      apiPerformanceMonitor.trackAPICall(
        endpoint,
        method,
        responseTime,
        response.status,
        userAgent,
        ip
      );

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      apiPerformanceMonitor.trackAPICall(
        endpoint,
        method,
        responseTime,
        500,
        userAgent,
        ip,
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  };
}
