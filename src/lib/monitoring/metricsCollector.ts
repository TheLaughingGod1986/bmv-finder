import { EventEmitter } from 'events';
import { PerformanceMetrics, AlertManager, getAlertManager } from './performanceAlerting';
import { getDatabasePerformanceMonitor } from '@/lib/database/performanceMonitor';

// System metrics interface
export interface SystemMetrics {
  timestamp: Date;
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  disk: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

// API metrics interface
export interface APIMetrics {
  timestamp: Date;
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number; // requests per second
  };
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
  errors: {
    count: number;
    rate: number;
    byType: Record<string, number>;
  };
  endpoints: Record<string, {
    requests: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
}

// Cache metrics interface
export interface CacheMetrics {
  timestamp: Date;
  redis: {
    connected: boolean;
    memory: {
      used: number;
      peak: number;
    };
    operations: {
      hits: number;
      misses: number;
      hitRate: number;
    };
    keys: {
      total: number;
      expired: number;
      evicted: number;
    };
  };
  memory: {
    size: number;
    hitRate: number;
    evictions: number;
  };
}

// Metrics collector class
export class MetricsCollector extends EventEmitter {
  private alertManager: AlertManager;
  private isCollecting = false;
  private collectionInterval: NodeJS.Timeout | null = null;
  private apiMetrics: APIMetrics[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private cacheMetrics: CacheMetrics[] = [];
  private maxHistorySize = 1000;
  private requestCounts = new Map<string, number>();
  private responseTimes = new Map<string, number[]>();
  private errorCounts = new Map<string, number>();

  constructor() {
    super();
    this.alertManager = getAlertManager();
  }

  // Start metrics collection
  startCollection(intervalMs: number = 30000): void {
    if (this.isCollecting) return;

    this.isCollecting = true;
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    console.log('📊 Metrics collection started');
  }

  // Stop metrics collection
  stopCollection(): void {
    if (!this.isCollecting) return;

    this.isCollecting = false;
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    console.log('📊 Metrics collection stopped');
  }

  // Collect all metrics
  private async collectMetrics(): Promise<void> {
    try {
      const [systemMetrics, cacheMetrics] = await Promise.all([
        this.collectSystemMetrics(),
        this.collectCacheMetrics()
      ]);

      // Add to history
      this.systemMetrics.push(systemMetrics);
      this.cacheMetrics.push(cacheMetrics);

      // Maintain history size
      if (this.systemMetrics.length > this.maxHistorySize) {
        this.systemMetrics = this.systemMetrics.slice(-this.maxHistorySize);
      }
      if (this.cacheMetrics.length > this.maxHistorySize) {
        this.cacheMetrics = this.cacheMetrics.slice(-this.maxHistorySize);
      }

      // Create combined performance metrics
      const performanceMetrics: PerformanceMetrics = {
        timestamp: new Date(),
        api: {
          responseTime: this.calculateAverageResponseTime(),
          throughput: this.calculateThroughput(),
          errorRate: this.calculateErrorRate(),
          uptime: this.calculateUptime()
        },
        database: {
          connectionPool: await this.getDatabaseConnectionPool(),
          queryTime: await this.getDatabaseQueryTime(),
          slowQueries: await this.getDatabaseSlowQueries()
        },
        cache: {
          hitRate: cacheMetrics.redis.operations.hitRate,
          missRate: 100 - cacheMetrics.redis.operations.hitRate,
          evictions: cacheMetrics.redis.keys.evicted
        },
        system: {
          memoryUsage: systemMetrics.memory.percentage,
          cpuUsage: systemMetrics.cpu.usage,
          diskUsage: systemMetrics.disk.percentage
        }
      };

      // Process metrics for alerts
      this.alertManager.processMetrics(performanceMetrics);

      // Emit metrics event
      this.emit('metrics', {
        system: systemMetrics,
        cache: cacheMetrics,
        performance: performanceMetrics
      });

    } catch (error) {
      console.error('❌ Failed to collect metrics:', error);
    }
  }

  // Collect system metrics
  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date();

    // Get memory usage
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal + memUsage.external;
    const usedMemory = memUsage.heapUsed;
    const freeMemory = totalMemory - usedMemory;

    // Get CPU usage (simplified)
    const cpuUsage = await this.getCPUUsage();

    // Get disk usage (simplified)
    const diskUsage = await this.getDiskUsage();

    return {
      timestamp,
      memory: {
        used: usedMemory,
        free: freeMemory,
        total: totalMemory,
        percentage: Math.round((usedMemory / totalMemory) * 100 * 100) / 100
      },
      cpu: {
        usage: cpuUsage,
        loadAverage: process.platform === 'linux' ? require('os').loadavg() : [0, 0, 0]
      },
      disk: {
        used: diskUsage.used,
        free: diskUsage.free,
        total: diskUsage.total,
        percentage: diskUsage.percentage
      },
      network: {
        bytesIn: 0, // Would need network monitoring
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0
      }
    };
  }

  // Collect cache metrics
  private async collectCacheMetrics(): Promise<CacheMetrics> {
    const timestamp = new Date();

    // Redis metrics (simplified)
    const redisMetrics = await this.getRedisMetrics();

    // Memory cache metrics
    const memoryCacheMetrics = {
      size: this.getMemoryCacheSize(),
      hitRate: this.getMemoryCacheHitRate(),
      evictions: this.getMemoryCacheEvictions()
    };

    return {
      timestamp,
      redis: redisMetrics,
      memory: memoryCacheMetrics
    };
  }

  // Get CPU usage
  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = Date.now();
        
        const userTime = endUsage.user / 1000000; // Convert to seconds
        const systemTime = endUsage.system / 1000000;
        const totalTime = (endTime - startTime) / 1000;
        
        const cpuUsage = ((userTime + systemTime) / totalTime) * 100;
        resolve(Math.min(100, Math.max(0, cpuUsage)));
      }, 100);
    });
  }

  // Get disk usage
  private async getDiskUsage(): Promise<{
    used: number;
    free: number;
    total: number;
    percentage: number;
  }> {
    // Simplified disk usage - in production, use a library like 'diskusage'
    return {
      used: 0,
      free: 0,
      total: 0,
      percentage: 0
    };
  }

  // Get Redis metrics
  private async getRedisMetrics(): Promise<{
    connected: boolean;
    memory: { used: number; peak: number };
    operations: { hits: number; misses: number; hitRate: number };
    keys: { total: number; expired: number; evicted: number };
  }> {
    // Simplified Redis metrics - in production, use Redis client
    return {
      connected: true,
      memory: { used: 0, peak: 0 },
      operations: { hits: 0, misses: 0, hitRate: 0 },
      keys: { total: 0, expired: 0, evicted: 0 }
    };
  }

  // Get memory cache size
  private getMemoryCacheSize(): number {
    // Implementation would depend on cache implementation
    return 0;
  }

  // Get memory cache hit rate
  private getMemoryCacheHitRate(): number {
    // Implementation would depend on cache implementation
    return 0;
  }

  // Get memory cache evictions
  private getMemoryCacheEvictions(): number {
    // Implementation would depend on cache implementation
    return 0;
  }

  // Record API request
  recordAPIRequest(endpoint: string, responseTime: number, success: boolean): void {
    // Update request counts
    const currentCount = this.requestCounts.get(endpoint) || 0;
    this.requestCounts.set(endpoint, currentCount + 1);

    // Update response times
    const times = this.responseTimes.get(endpoint) || [];
    times.push(responseTime);
    if (times.length > 100) {
      times.shift(); // Keep only last 100 measurements
    }
    this.responseTimes.set(endpoint, times);

    // Update error counts
    if (!success) {
      const errorCount = this.errorCounts.get(endpoint) || 0;
      this.errorCounts.set(endpoint, errorCount + 1);
    }

    // Emit API metrics event
    this.emit('api-request', {
      endpoint,
      responseTime,
      success,
      timestamp: new Date()
    });
  }

  // Calculate average response time
  private calculateAverageResponseTime(): number {
    let totalTime = 0;
    let totalRequests = 0;

    for (const times of this.responseTimes.values()) {
      totalTime += times.reduce((sum, time) => sum + time, 0);
      totalRequests += times.length;
    }

    return totalRequests > 0 ? Math.round((totalTime / totalRequests) * 100) / 100 : 0;
  }

  // Calculate throughput
  private calculateThroughput(): number {
    let totalRequests = 0;
    for (const count of this.requestCounts.values()) {
      totalRequests += count;
    }
    return totalRequests; // requests per collection interval
  }

  // Calculate error rate
  private calculateErrorRate(): number {
    let totalRequests = 0;
    let totalErrors = 0;

    for (const [endpoint, count] of this.requestCounts.entries()) {
      totalRequests += count;
      totalErrors += this.errorCounts.get(endpoint) || 0;
    }

    return totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 10000) / 100 : 0;
  }

  // Calculate uptime
  private calculateUptime(): number {
    // Simplified uptime calculation
    return 99.9; // Would need proper uptime tracking
  }

  // Get database connection pool
  private async getDatabaseConnectionPool(): Promise<number> {
    try {
      const dbMonitor = getDatabasePerformanceMonitor();
      const stats = dbMonitor.getMetrics();
      return stats.connectionPoolStats.totalConnections;
    } catch (error) {
      return 0;
    }
  }

  // Get database query time
  private async getDatabaseQueryTime(): Promise<number> {
    try {
      const dbMonitor = getDatabasePerformanceMonitor();
      const stats = dbMonitor.getMetrics();
      return stats.averageQueryTime;
    } catch (error) {
      return 0;
    }
  }

  // Get database slow queries
  private async getDatabaseSlowQueries(): Promise<number> {
    try {
      const dbMonitor = getDatabasePerformanceMonitor();
      const stats = dbMonitor.getMetrics();
      return stats.slowQueries;
    } catch (error) {
      return 0;
    }
  }

  // Get metrics history
  getMetricsHistory(type: 'system' | 'cache' | 'api', limit?: number): any[] {
    let history: any[];
    
    switch (type) {
      case 'system':
        history = [...this.systemMetrics];
        break;
      case 'cache':
        history = [...this.cacheMetrics];
        break;
      case 'api':
        history = [...this.apiMetrics];
        break;
      default:
        history = [];
    }

    history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? history.slice(0, limit) : history;
  }

  // Get current metrics
  getCurrentMetrics(): {
    system: SystemMetrics | null;
    cache: CacheMetrics | null;
    api: APIMetrics | null;
  } {
    return {
      system: this.systemMetrics[this.systemMetrics.length - 1] || null,
      cache: this.cacheMetrics[this.cacheMetrics.length - 1] || null,
      api: this.apiMetrics[this.apiMetrics.length - 1] || null
    };
  }

  // Get API endpoint statistics
  getAPIEndpointStats(): Record<string, {
    requests: number;
    avgResponseTime: number;
    errorRate: number;
  }> {
    const stats: Record<string, any> = {};

    for (const [endpoint, count] of this.requestCounts.entries()) {
      const times = this.responseTimes.get(endpoint) || [];
      const errors = this.errorCounts.get(endpoint) || 0;
      
      stats[endpoint] = {
        requests: count,
        avgResponseTime: times.length > 0 
          ? Math.round((times.reduce((sum, time) => sum + time, 0) / times.length) * 100) / 100
          : 0,
        errorRate: count > 0 ? Math.round((errors / count) * 10000) / 100 : 0
      };
    }

    return stats;
  }

  // Clear metrics history
  clearHistory(): void {
    this.systemMetrics = [];
    this.cacheMetrics = [];
    this.apiMetrics = [];
    this.requestCounts.clear();
    this.responseTimes.clear();
    this.errorCounts.clear();
    console.log('📊 Metrics history cleared');
  }

  // Export metrics data
  exportMetricsData(): {
    system: SystemMetrics[];
    cache: CacheMetrics[];
    api: APIMetrics[];
    timestamp: Date;
  } {
    return {
      system: [...this.systemMetrics],
      cache: [...this.cacheMetrics],
      api: [...this.apiMetrics],
      timestamp: new Date()
    };
  }
}

// Singleton metrics collector instance
let metricsCollector: MetricsCollector | null = null;

export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new MetricsCollector();
    metricsCollector.startCollection();
  }
  return metricsCollector;
}
