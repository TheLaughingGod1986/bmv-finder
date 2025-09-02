import { PoolClient } from 'pg';
import { DatabaseConnectionManager } from './connectionPool';

// Performance metrics interface
export interface DatabaseMetrics {
  queryCount: number;
  averageQueryTime: number;
  slowQueries: number;
  connectionPoolStats: {
    totalConnections: number;
    idleConnections: number;
    waitingConnections: number;
  };
  errorCount: number;
  cacheHitRate: number;
  lastUpdated: Date;
}

// Query performance data
interface QueryPerformance {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any[];
  error?: string;
}

// Database performance monitor
export class DatabasePerformanceMonitor {
  private dbManager: DatabaseConnectionManager;
  private queryHistory: QueryPerformance[] = [];
  private maxHistorySize = 1000;
  private slowQueryThreshold = 1000; // 1 second
  private metrics: DatabaseMetrics;
  private isMonitoring = false;

  constructor(dbManager: DatabaseConnectionManager) {
    this.dbManager = dbManager;
    this.metrics = this.initializeMetrics();
  }

  // Initialize metrics
  private initializeMetrics(): DatabaseMetrics {
    return {
      queryCount: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      connectionPoolStats: {
        totalConnections: 0,
        idleConnections: 0,
        waitingConnections: 0
      },
      errorCount: 0,
      cacheHitRate: 0,
      lastUpdated: new Date()
    };
  }

  // Start monitoring
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('📊 Database performance monitoring started');

    // Update metrics every 30 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 30000);
  }

  // Stop monitoring
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('📊 Database performance monitoring stopped');
  }

  // Record query performance
  recordQuery(query: string, duration: number, params?: any[], error?: string): void {
    const queryPerf: QueryPerformance = {
      query: this.sanitizeQuery(query),
      duration,
      timestamp: new Date(),
      params,
      error
    };

    // Add to history
    this.queryHistory.push(queryPerf);

    // Maintain history size
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory = this.queryHistory.slice(-this.maxHistorySize);
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn(`🐌 Slow query detected (${duration}ms):`, query.substring(0, 100));
    }

    // Log errors
    if (error) {
      console.error(`❌ Query error:`, error, query.substring(0, 100));
    }
  }

  // Update metrics
  private updateMetrics(): void {
    const poolStats = this.dbManager.getPoolStats();
    
    // Calculate query statistics
    const recentQueries = this.queryHistory.filter(
      q => Date.now() - q.timestamp.getTime() < 300000 // Last 5 minutes
    );

    const totalDuration = recentQueries.reduce((sum, q) => sum + q.duration, 0);
    const averageQueryTime = recentQueries.length > 0 ? totalDuration / recentQueries.length : 0;
    const slowQueries = recentQueries.filter(q => q.duration > this.slowQueryThreshold).length;
    const errorCount = recentQueries.filter(q => q.error).length;

    this.metrics = {
      queryCount: recentQueries.length,
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      slowQueries,
      connectionPoolStats: {
        totalConnections: poolStats.totalCount,
        idleConnections: poolStats.idleCount,
        waitingConnections: poolStats.waitingCount
      },
      errorCount,
      cacheHitRate: 0, // Would need cache implementation
      lastUpdated: new Date()
    };
  }

  // Get current metrics
  getMetrics(): DatabaseMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  // Get slow queries
  getSlowQueries(limit: number = 10): QueryPerformance[] {
    return this.queryHistory
      .filter(q => q.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  // Get query statistics by pattern
  getQueryStats(pattern?: string): {
    count: number;
    averageDuration: number;
    maxDuration: number;
    minDuration: number;
    errorRate: number;
  } {
    let queries = this.queryHistory;
    
    if (pattern) {
      queries = queries.filter(q => q.query.toLowerCase().includes(pattern.toLowerCase()));
    }

    if (queries.length === 0) {
      return {
        count: 0,
        averageDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        errorRate: 0
      };
    }

    const durations = queries.map(q => q.duration);
    const errors = queries.filter(q => q.error).length;

    return {
      count: queries.length,
      averageDuration: Math.round((durations.reduce((sum, d) => sum + d, 0) / durations.length) * 100) / 100,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      errorRate: Math.round((errors / queries.length) * 10000) / 100
    };
  }

  // Get performance report
  getPerformanceReport(): {
    summary: DatabaseMetrics;
    slowQueries: QueryPerformance[];
    recommendations: string[];
    healthScore: number;
  } {
    const metrics = this.getMetrics();
    const slowQueries = this.getSlowQueries(5);
    const recommendations: string[] = [];
    let healthScore = 100;

    // Analyze performance and generate recommendations
    if (metrics.averageQueryTime > 500) {
      recommendations.push('Average query time is high - consider query optimization');
      healthScore -= 20;
    }

    if (metrics.slowQueries > 10) {
      recommendations.push('Too many slow queries detected - review and optimize');
      healthScore -= 15;
    }

    if (metrics.connectionPoolStats.waitingConnections > 5) {
      recommendations.push('High connection pool wait time - consider increasing pool size');
      healthScore -= 10;
    }

    if (metrics.errorCount > 5) {
      recommendations.push('High error rate - investigate query failures');
      healthScore -= 25;
    }

    if (metrics.connectionPoolStats.idleConnections === 0 && metrics.connectionPoolStats.totalConnections > 15) {
      recommendations.push('All connections in use - consider connection pool optimization');
      healthScore -= 15;
    }

    // Add specific recommendations based on slow queries
    const slowQueryPatterns = new Set(
      slowQueries.map(q => this.extractQueryPattern(q.query))
    );

    if (slowQueryPatterns.has('SELECT *')) {
      recommendations.push('Avoid SELECT * queries - specify only needed columns');
    }

    if (slowQueryPatterns.has('ORDER BY') && !slowQueryPatterns.has('LIMIT')) {
      recommendations.push('Add LIMIT clause to ORDER BY queries for better performance');
    }

    if (slowQueryPatterns.has('LIKE %')) {
      recommendations.push('Consider full-text search instead of LIKE queries with leading wildcards');
    }

    return {
      summary: metrics,
      slowQueries,
      recommendations,
      healthScore: Math.max(0, healthScore)
    };
  }

  // Extract query pattern for analysis
  private extractQueryPattern(query: string): string {
    const lowerQuery = query.toLowerCase().trim();
    
    if (lowerQuery.startsWith('select *')) return 'SELECT *';
    if (lowerQuery.includes('order by')) return 'ORDER BY';
    if (lowerQuery.includes('like \'%') || lowerQuery.includes('like "%')) return 'LIKE %';
    if (lowerQuery.includes('group by')) return 'GROUP BY';
    if (lowerQuery.includes('having')) return 'HAVING';
    if (lowerQuery.includes('subquery')) return 'SUBQUERY';
    
    return 'OTHER';
  }

  // Sanitize query for logging
  private sanitizeQuery(query: string): string {
    // Remove sensitive data and normalize whitespace
    return query
      .replace(/\s+/g, ' ')
      .replace(/\$\d+/g, '?')
      .trim();
  }

  // Clear history
  clearHistory(): void {
    this.queryHistory = [];
    console.log('📊 Database performance history cleared');
  }

  // Export performance data
  exportPerformanceData(): {
    metrics: DatabaseMetrics;
    queryHistory: QueryPerformance[];
    timestamp: Date;
  } {
    return {
      metrics: this.getMetrics(),
      queryHistory: [...this.queryHistory],
      timestamp: new Date()
    };
  }
}

// Database health checker
export class DatabaseHealthChecker {
  private dbManager: DatabaseConnectionManager;
  private performanceMonitor: DatabasePerformanceMonitor;

  constructor(dbManager: DatabaseConnectionManager, performanceMonitor: DatabasePerformanceMonitor) {
    this.dbManager = dbManager;
    this.performanceMonitor = performanceMonitor;
  }

  // Comprehensive health check
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
      value?: any;
    }>;
    recommendations: string[];
  }> {
    const checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
      value?: any;
    }> = [];

    let score = 100;

    // Connection pool health
    try {
      const poolStats = this.dbManager.getPoolStats();
      checks.push({
        name: 'Connection Pool',
        status: poolStats.isConnected ? 'pass' : 'fail',
        message: poolStats.isConnected ? 'Connection pool is healthy' : 'Connection pool is not connected',
        value: poolStats
      });

      if (!poolStats.isConnected) score -= 30;
      if (poolStats.waitingCount > 5) {
        checks.push({
          name: 'Connection Wait Time',
          status: 'warning',
          message: 'High connection wait time detected',
          value: poolStats.waitingCount
        });
        score -= 10;
      }
    } catch (error) {
      checks.push({
        name: 'Connection Pool',
        status: 'fail',
        message: 'Failed to check connection pool',
        value: error
      });
      score -= 30;
    }

    // Database connectivity
    try {
      const healthCheck = await this.dbManager.healthCheck();
      checks.push({
        name: 'Database Connectivity',
        status: healthCheck.status === 'healthy' ? 'pass' : 'fail',
        message: healthCheck.status === 'healthy' ? 'Database is accessible' : 'Database is not accessible',
        value: healthCheck.responseTime
      });

      if (healthCheck.status !== 'healthy') score -= 40;
      if (healthCheck.responseTime > 1000) {
        checks.push({
          name: 'Response Time',
          status: 'warning',
          message: 'Database response time is high',
          value: healthCheck.responseTime
        });
        score -= 15;
      }
    } catch (error) {
      checks.push({
        name: 'Database Connectivity',
        status: 'fail',
        message: 'Database connectivity check failed',
        value: error
      });
      score -= 40;
    }

    // Performance metrics
    try {
      const metrics = this.performanceMonitor.getMetrics();
      checks.push({
        name: 'Query Performance',
        status: metrics.averageQueryTime < 500 ? 'pass' : metrics.averageQueryTime < 1000 ? 'warning' : 'fail',
        message: `Average query time: ${metrics.averageQueryTime}ms`,
        value: metrics.averageQueryTime
      });

      if (metrics.averageQueryTime > 1000) score -= 20;
      else if (metrics.averageQueryTime > 500) score -= 10;

      checks.push({
        name: 'Error Rate',
        status: metrics.errorCount < 5 ? 'pass' : metrics.errorCount < 10 ? 'warning' : 'fail',
        message: `Error count: ${metrics.errorCount}`,
        value: metrics.errorCount
      });

      if (metrics.errorCount > 10) score -= 15;
      else if (metrics.errorCount > 5) score -= 8;
    } catch (error) {
      checks.push({
        name: 'Performance Metrics',
        status: 'fail',
        message: 'Failed to retrieve performance metrics',
        value: error
      });
      score -= 10;
    }

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 80) status = 'healthy';
    else if (score >= 60) status = 'warning';
    else status = 'critical';

    // Generate recommendations
    const recommendations: string[] = [];
    if (score < 80) {
      recommendations.push('Review database performance and optimize queries');
    }
    if (checks.some(c => c.name === 'Connection Pool' && c.status === 'fail')) {
      recommendations.push('Check database connection configuration');
    }
    if (checks.some(c => c.name === 'Database Connectivity' && c.status === 'fail')) {
      recommendations.push('Verify database server is running and accessible');
    }

    return {
      status,
      score: Math.max(0, score),
      checks,
      recommendations
    };
  }
}

// Singleton instances
let performanceMonitor: DatabasePerformanceMonitor | null = null;
let healthChecker: DatabaseHealthChecker | null = null;

export function getDatabasePerformanceMonitor(): DatabasePerformanceMonitor {
  if (!performanceMonitor) {
    const dbManager = require('./connectionPool').getDatabaseManager();
    performanceMonitor = new DatabasePerformanceMonitor(dbManager);
    performanceMonitor.startMonitoring();
  }
  return performanceMonitor;
}

export function getDatabaseHealthChecker(): DatabaseHealthChecker {
  if (!healthChecker) {
    const dbManager = require('./connectionPool').getDatabaseManager();
    const perfMonitor = getDatabasePerformanceMonitor();
    healthChecker = new DatabaseHealthChecker(dbManager, perfMonitor);
  }
  return healthChecker;
}
