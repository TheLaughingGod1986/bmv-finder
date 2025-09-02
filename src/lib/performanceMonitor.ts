interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface APIMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: number;
  userId?: string;
  cacheHit?: boolean;
}

interface CacheMetric {
  cacheName: string;
  hitRate: number;
  size: number;
  memoryUsage: number;
  timestamp: number;
}

interface SystemMetric {
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: APIMetric[] = [];
  private cacheMetrics: CacheMetric[] = [];
  private systemMetrics: SystemMetric[] = [];
  private maxMetrics: number = 10000;
  private isEnabled: boolean = true;

  constructor() {
    // Start system monitoring
    this.startSystemMonitoring();
  }

  // API Performance Tracking
  trackAPI(endpoint: string, method: string, responseTime: number, statusCode: number, userId?: string, cacheHit?: boolean): void {
    if (!this.isEnabled) return;

    const metric: APIMetric = {
      endpoint,
      method,
      responseTime,
      statusCode,
      timestamp: Date.now(),
      userId,
      cacheHit
    };

    this.apiMetrics.push(metric);
    this.trimMetrics(this.apiMetrics);

    // Log slow API calls
    if (responseTime > 1000) {
      console.warn(`Slow API call detected: ${method} ${endpoint} took ${responseTime}ms`);
    }
  }

  // Cache Performance Tracking
  trackCache(cacheName: string, hitRate: number, size: number, memoryUsage: number): void {
    if (!this.isEnabled) return;

    const metric: CacheMetric = {
      cacheName,
      hitRate,
      size,
      memoryUsage,
      timestamp: Date.now()
    };

    this.cacheMetrics.push(metric);
    this.trimMetrics(this.cacheMetrics);
  }

  // System Performance Tracking
  trackSystem(memoryUsage: number, cpuUsage: number, activeConnections: number): void {
    if (!this.isEnabled) return;

    const metric: SystemMetric = {
      memoryUsage,
      cpuUsage,
      activeConnections,
      timestamp: Date.now()
    };

    this.systemMetrics.push(metric);
    this.trimMetrics(this.systemMetrics);
  }

  // Custom Metric Tracking
  trackMetric(name: string, value: number, unit: string, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);
    this.trimMetrics(this.metrics);
  }

  // Alias for trackMetric (for compatibility)
  trackCustomMetric(name: string, value: number, unit: string, metadata?: Record<string, unknown>): void {
    this.trackMetric(name, value, unit, metadata);
  }

  // Performance Analysis
  getAPIPerformance(endpoint?: string, timeRange?: { start: number; end: number }): {
    avgResponseTime: number;
    totalCalls: number;
    successRate: number;
    cacheHitRate: number;
    slowCalls: number;
  } {
    let filteredMetrics = this.apiMetrics;

    if (endpoint) {
      filteredMetrics = filteredMetrics.filter(m => m.endpoint === endpoint);
    }

    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return {
        avgResponseTime: 0,
        totalCalls: 0,
        successRate: 0,
        cacheHitRate: 0,
        slowCalls: 0
      };
    }

    const totalCalls = filteredMetrics.length;
    const avgResponseTime = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalCalls;
    const successRate = (filteredMetrics.filter(m => m.statusCode < 400).length / totalCalls) * 100;
    const cacheHitRate = (filteredMetrics.filter(m => m.cacheHit).length / totalCalls) * 100;
    const slowCalls = filteredMetrics.filter(m => m.responseTime > 1000).length;

    return {
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      totalCalls,
      successRate: Math.round(successRate * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      slowCalls
    };
  }

  getCachePerformance(cacheName?: string): {
    avgHitRate: number;
    avgSize: number;
    avgMemoryUsage: number;
    totalMetrics: number;
  } {
    let filteredMetrics = this.cacheMetrics;

    if (cacheName) {
      filteredMetrics = filteredMetrics.filter(m => m.cacheName === cacheName);
    }

    if (filteredMetrics.length === 0) {
      return {
        avgHitRate: 0,
        avgSize: 0,
        avgMemoryUsage: 0,
        totalMetrics: 0
      };
    }

    const totalMetrics = filteredMetrics.length;
    const avgHitRate = filteredMetrics.reduce((sum, m) => sum + m.hitRate, 0) / totalMetrics;
    const avgSize = filteredMetrics.reduce((sum, m) => sum + m.size, 0) / totalMetrics;
    const avgMemoryUsage = filteredMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / totalMetrics;

    return {
      avgHitRate: Math.round(avgHitRate * 100) / 100,
      avgSize: Math.round(avgSize * 100) / 100,
      avgMemoryUsage: Math.round(avgMemoryUsage * 100) / 100,
      totalMetrics
    };
  }

  getSystemPerformance(timeRange?: { start: number; end: number }): {
    avgMemoryUsage: number;
    avgCpuUsage: number;
    avgActiveConnections: number;
    totalMetrics: number;
  } {
    let filteredMetrics = this.systemMetrics;

    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return {
        avgMemoryUsage: 0,
        avgCpuUsage: 0,
        avgActiveConnections: 0,
        totalMetrics: 0
      };
    }

    const totalMetrics = filteredMetrics.length;
    const avgMemoryUsage = filteredMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / totalMetrics;
    const avgCpuUsage = filteredMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / totalMetrics;
    const avgActiveConnections = filteredMetrics.reduce((sum, m) => sum + m.activeConnections, 0) / totalMetrics;

    return {
      avgMemoryUsage: Math.round(avgMemoryUsage * 100) / 100,
      avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
      avgActiveConnections: Math.round(avgActiveConnections * 100) / 100,
      totalMetrics
    };
  }

  // Performance Alerts
  getPerformanceAlerts(): Array<{
    type: 'warning' | 'error' | 'critical';
    message: string;
    metric: string;
    value: number;
    threshold: number;
  }> {
    const alerts: Array<{
      type: 'warning' | 'error' | 'critical';
      message: string;
      metric: string;
      value: number;
      threshold: number;
    }> = [];

    // Check API performance
    const apiPerf = this.getAPIPerformance();
    if (apiPerf.avgResponseTime > 2000) {
      alerts.push({
        type: 'warning',
        message: 'API response time is high',
        metric: 'avgResponseTime',
        value: apiPerf.avgResponseTime,
        threshold: 2000
      });
    }

    if (apiPerf.successRate < 95) {
      alerts.push({
        type: 'error',
        message: 'API success rate is below threshold',
        metric: 'successRate',
        value: apiPerf.successRate,
        threshold: 95
      });
    }

    // Check cache performance
    const cachePerf = this.getCachePerformance();
    if (cachePerf.avgHitRate < 70) {
      alerts.push({
        type: 'warning',
        message: 'Cache hit rate is low',
        metric: 'avgHitRate',
        value: cachePerf.avgHitRate,
        threshold: 70
      });
    }

    // Check system performance
    const systemPerf = this.getSystemPerformance();
    if (systemPerf.avgMemoryUsage > 80) {
      alerts.push({
        type: 'critical',
        message: 'Memory usage is high',
        metric: 'avgMemoryUsage',
        value: systemPerf.avgMemoryUsage,
        threshold: 80
      });
    }

    return alerts;
  }

  // Performance Reports
  generatePerformanceReport(): {
    summary: {
      totalAPICalls: number;
      avgResponseTime: number;
      cacheHitRate: number;
      systemHealth: 'good' | 'warning' | 'critical';
    };
    details: {
      api: ReturnType<typeof this.getAPIPerformance>;
      cache: ReturnType<typeof this.getCachePerformance>;
      system: ReturnType<typeof this.getSystemPerformance>;
      alerts: ReturnType<typeof this.getPerformanceAlerts>;
    };
    recommendations: string[];
  } {
    const apiPerf = this.getAPIPerformance();
    const cachePerf = this.getCachePerformance();
    const systemPerf = this.getSystemPerformance();
    const alerts = this.getPerformanceAlerts();

    // Determine system health
    let systemHealth: 'good' | 'warning' | 'critical' = 'good';
    if (alerts.some(a => a.type === 'critical')) {
      systemHealth = 'critical';
    } else if (alerts.some(a => a.type === 'error' || a.type === 'warning')) {
      systemHealth = 'warning';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (apiPerf.avgResponseTime > 1000) {
      recommendations.push('Consider implementing database query optimization');
    }
    
    if (cachePerf.avgHitRate < 70) {
      recommendations.push('Review cache invalidation strategy and TTL settings');
    }
    
    if (systemPerf.avgMemoryUsage > 70) {
      recommendations.push('Monitor memory usage and consider scaling resources');
    }

    return {
      summary: {
        totalAPICalls: apiPerf.totalCalls,
        avgResponseTime: apiPerf.avgResponseTime,
        cacheHitRate: cachePerf.avgHitRate,
        systemHealth
      },
      details: {
        api: apiPerf,
        cache: cachePerf,
        system: systemPerf,
        alerts
      },
      recommendations
    };
  }

  // Utility Methods
  private trimMetrics<T>(metricsArray: T[]): void {
    if (metricsArray.length > this.maxMetrics) {
      const excess = metricsArray.length - this.maxMetrics;
      metricsArray.splice(0, excess);
    }
  }

  private startSystemMonitoring(): void {
    // Monitor system metrics every 30 seconds
    setInterval(() => {
      if (typeof process !== 'undefined') {
        const memUsage = process.memoryUsage();
        const memoryUsageMB = Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100;
        
        // Estimate CPU usage (simplified)
        const cpuUsage = Math.random() * 100; // In production, use actual CPU monitoring
        
        // Estimate active connections (simplified)
        const activeConnections = Math.floor(Math.random() * 100);
        
        this.trackSystem(memoryUsageMB, cpuUsage, activeConnections);
      }
    }, 30000);
  }

  // Control Methods
  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  clear(): void {
    this.metrics = [];
    this.apiMetrics = [];
    this.cacheMetrics = [];
    this.systemMetrics = [];
  }

  // Export data for external monitoring
  exportData(): {
    metrics: PerformanceMetric[];
    apiMetrics: APIMetric[];
    cacheMetrics: CacheMetric[];
    systemMetrics: SystemMetric[];
  } {
    return {
      metrics: [...this.metrics],
      apiMetrics: [...this.apiMetrics],
      cacheMetrics: [...this.cacheMetrics],
      systemMetrics: [...this.systemMetrics]
    };
  }

  // Comprehensive performance report
  getPerformanceReport(): {
    api: ReturnType<typeof this.getAPIPerformance>;
    cache: ReturnType<typeof this.getCachePerformance>;
    system: ReturnType<typeof this.getSystemPerformance>;
    alerts: ReturnType<typeof this.getPerformanceAlerts>;
    summary: {
      totalAPICalls: number;
      totalCacheOperations: number;
      totalSystemMetrics: number;
      overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
    };
  } {
    const api = this.getAPIPerformance();
    const cache = this.getCachePerformance();
    const system = this.getSystemPerformance();
    const alerts = this.getPerformanceAlerts();

    // Calculate overall health
    let overallHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
    if (alerts.some(a => a.type === 'critical')) {
      overallHealth = 'critical';
    } else if (alerts.some(a => a.type === 'error')) {
      overallHealth = 'warning';
    } else if (alerts.some(a => a.type === 'warning')) {
      overallHealth = 'good';
    }

    return {
      api,
      cache,
      system,
      alerts,
      summary: {
        totalAPICalls: this.apiMetrics.length,
        totalCacheOperations: this.cacheMetrics.length,
        totalSystemMetrics: this.systemMetrics.length,
        overallHealth
      }
    };
  }

  // Cache metrics for dashboard
  getCacheMetrics(): Record<string, {
    hitRate: number;
    size: number;
    memoryUsage: number;
    operations: number;
  }> {
    const cacheStats: Record<string, {
      hitRate: number;
      size: number;
      memoryUsage: number;
      operations: number;
    }> = {};

    // Group cache metrics by cache name
    this.cacheMetrics.forEach(metric => {
      if (!cacheStats[metric.cacheName]) {
        cacheStats[metric.cacheName] = {
          hitRate: 0,
          size: 0,
          memoryUsage: 0,
          operations: 0
        };
      }
      cacheStats[metric.cacheName].hitRate = metric.hitRate;
      cacheStats[metric.cacheName].size = metric.size;
      cacheStats[metric.cacheName].memoryUsage = metric.memoryUsage;
      cacheStats[metric.cacheName].operations++;
    });

    return cacheStats;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export types for external use
export type {
  PerformanceMetric,
  APIMetric,
  CacheMetric,
  SystemMetric
};

export default PerformanceMonitor;
