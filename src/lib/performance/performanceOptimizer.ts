import { auditLogger } from '../audit/auditLogger';

export interface PerformanceMetrics {
  id: string;
  type: 'api' | 'database' | 'elasticsearch' | 'cache' | 'system';
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface QueryOptimization {
  id: string;
  query: string;
  originalTime: number;
  optimizedTime: number;
  improvement: number;
  optimization: string;
  timestamp: string;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  cacheSize: number;
  evictionRate: number;
  averageResponseTime: number;
}

export interface DatabaseMetrics {
  connectionPool: {
    active: number;
    idle: number;
    total: number;
    waiting: number;
  };
  queryPerformance: {
    slowQueries: number;
    averageQueryTime: number;
    totalQueries: number;
  };
  indexUsage: {
    used: number;
    unused: number;
    recommendations: string[];
  };
}

export interface ElasticsearchMetrics {
  clusterHealth: 'green' | 'yellow' | 'red';
  nodeCount: number;
  indexCount: number;
  documentCount: number;
  queryPerformance: {
    averageQueryTime: number;
    slowQueries: number;
    totalQueries: number;
  };
  indexPerformance: {
    averageIndexTime: number;
    totalIndexed: number;
    failedIndexes: number;
  };
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    free: number;
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    free: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

export interface PerformanceRecommendation {
  id: string;
  type: 'database' | 'cache' | 'api' | 'elasticsearch' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedImprovement: number;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  createdAt: string;
  completedAt?: string;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetrics[] = [];
  private queryOptimizations: QueryOptimization[] = [];
  private recommendations: PerformanceRecommendation[] = [];
  private cacheMetrics: CacheMetrics = {
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    cacheSize: 0,
    evictionRate: 0,
    averageResponseTime: 0,
  };

  // Performance thresholds
  private readonly THRESHOLDS = {
    api: {
      responseTime: 1000, // 1 second
      throughput: 100, // requests per second
    },
    database: {
      queryTime: 500, // 500ms
      connectionPool: 0.8, // 80% utilization
    },
    elasticsearch: {
      queryTime: 200, // 200ms
      indexTime: 100, // 100ms
    },
    cache: {
      hitRate: 0.8, // 80%
      responseTime: 50, // 50ms
    },
    system: {
      cpuUsage: 0.8, // 80%
      memoryUsage: 0.8, // 80%
      diskUsage: 0.9, // 90%
    },
  };

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Record performance metrics
  public async recordMetric(metric: Omit<PerformanceMetrics, 'id' | 'timestamp'>): Promise<PerformanceMetrics> {
    const performanceMetric: PerformanceMetrics = {
      id: this.generateId(),
      ...metric,
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(performanceMetric);

    // Check for performance issues and generate recommendations
    await this.analyzePerformance(performanceMetric);

    // Log to audit system
    await auditLogger.logSystemEvent('performance_metric_recorded', {
      type: metric.type,
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
    });

    return performanceMetric;
  }

  // Analyze performance and generate recommendations
  private async analyzePerformance(metric: PerformanceMetrics): Promise<void> {
    const threshold = this.THRESHOLDS[metric.type as keyof typeof this.THRESHOLDS];
    if (!threshold) return;

    let isIssue = false;
    let recommendation: Partial<PerformanceRecommendation> = {};

    switch (metric.type) {
      case 'api':
        if (metric.name === 'response_time' && metric.value > threshold.responseTime) {
          isIssue = true;
          recommendation = {
            type: 'api',
            priority: metric.value > threshold.responseTime * 2 ? 'critical' : 'high',
            title: 'API Response Time Optimization',
            description: `API response time (${metric.value}ms) exceeds threshold (${threshold.responseTime}ms)`,
            impact: 'User experience degradation, potential timeouts',
            effort: 'medium',
            estimatedImprovement: Math.round((metric.value - threshold.responseTime) / metric.value * 100),
          };
        }
        break;

      case 'database':
        if (metric.name === 'query_time' && metric.value > threshold.queryTime) {
          isIssue = true;
          recommendation = {
            type: 'database',
            priority: metric.value > threshold.queryTime * 2 ? 'critical' : 'high',
            title: 'Database Query Optimization',
            description: `Database query time (${metric.value}ms) exceeds threshold (${threshold.queryTime}ms)`,
            impact: 'Slow application performance, poor user experience',
            effort: 'high',
            estimatedImprovement: Math.round((metric.value - threshold.queryTime) / metric.value * 100),
          };
        }
        break;

      case 'elasticsearch':
        if (metric.name === 'query_time' && metric.value > threshold.queryTime) {
          isIssue = true;
          recommendation = {
            type: 'elasticsearch',
            priority: metric.value > threshold.queryTime * 2 ? 'critical' : 'high',
            title: 'Elasticsearch Query Optimization',
            description: `Elasticsearch query time (${metric.value}ms) exceeds threshold (${threshold.queryTime}ms)`,
            impact: 'Slow search performance, poor user experience',
            effort: 'medium',
            estimatedImprovement: Math.round((metric.value - threshold.queryTime) / metric.value * 100),
          };
        }
        break;

      case 'cache':
        if (metric.name === 'hit_rate' && metric.value < threshold.hitRate) {
          isIssue = true;
          recommendation = {
            type: 'cache',
            priority: metric.value < threshold.hitRate * 0.5 ? 'critical' : 'high',
            title: 'Cache Hit Rate Optimization',
            description: `Cache hit rate (${(metric.value * 100).toFixed(1)}%) below threshold (${(threshold.hitRate * 100).toFixed(1)}%)`,
            impact: 'Increased database load, slower response times',
            effort: 'medium',
            estimatedImprovement: Math.round((threshold.hitRate - metric.value) / threshold.hitRate * 100),
          };
        }
        break;

      case 'system':
        if (metric.name === 'cpu_usage' && metric.value > threshold.cpuUsage) {
          isIssue = true;
          recommendation = {
            type: 'system',
            priority: metric.value > 0.95 ? 'critical' : 'high',
            title: 'CPU Usage Optimization',
            description: `CPU usage (${(metric.value * 100).toFixed(1)}%) exceeds threshold (${(threshold.cpuUsage * 100).toFixed(1)}%)`,
            impact: 'System slowdown, potential crashes',
            effort: 'high',
            estimatedImprovement: Math.round((metric.value - threshold.cpuUsage) / metric.value * 100),
          };
        }
        break;
    }

    if (isIssue && recommendation.type) {
      await this.createRecommendation(recommendation as PerformanceRecommendation);
    }
  }

  // Create performance recommendation
  public async createRecommendation(recommendation: Omit<PerformanceRecommendation, 'id' | 'createdAt' | 'status'>): Promise<PerformanceRecommendation> {
    const perfRecommendation: PerformanceRecommendation = {
      id: this.generateId(),
      ...recommendation,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.recommendations.push(perfRecommendation);

    // Log to audit system
    await auditLogger.logSystemEvent('performance_recommendation_created', {
      type: recommendation.type,
      priority: recommendation.priority,
      title: recommendation.title,
    });

    return perfRecommendation;
  }

  // Get performance metrics
  public async getMetrics(filters?: {
    type?: string;
    name?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
  }): Promise<PerformanceMetrics[]> {
    let filteredMetrics = [...this.metrics];

    if (filters) {
      if (filters.type) {
        filteredMetrics = filteredMetrics.filter(m => m.type === filters.type);
      }
      if (filters.name) {
        filteredMetrics = filteredMetrics.filter(m => m.name === filters.name);
      }
      if (filters.startTime) {
        filteredMetrics = filteredMetrics.filter(m => m.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        filteredMetrics = filteredMetrics.filter(m => m.timestamp <= filters.endTime!);
      }
    }

    return filteredMetrics
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, filters?.limit || 100);
  }

  // Get performance recommendations
  public async getRecommendations(filters?: {
    type?: string;
    priority?: string;
    status?: string;
    limit?: number;
  }): Promise<PerformanceRecommendation[]> {
    let filteredRecommendations = [...this.recommendations];

    if (filters) {
      if (filters.type) {
        filteredRecommendations = filteredRecommendations.filter(r => r.type === filters.type);
      }
      if (filters.priority) {
        filteredRecommendations = filteredRecommendations.filter(r => r.priority === filters.priority);
      }
      if (filters.status) {
        filteredRecommendations = filteredRecommendations.filter(r => r.status === filters.status);
      }
    }

    return filteredRecommendations
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, filters?.limit || 50);
  }

  // Update recommendation status
  public async updateRecommendationStatus(id: string, status: PerformanceRecommendation['status']): Promise<boolean> {
    const recommendation = this.recommendations.find(r => r.id === id);
    if (!recommendation) return false;

    recommendation.status = status;
    if (status === 'completed') {
      recommendation.completedAt = new Date().toISOString();
    }

    // Log to audit system
    await auditLogger.logSystemEvent('performance_recommendation_updated', {
      id,
      status,
      title: recommendation.title,
    });

    return true;
  }

  // Get cache metrics
  public async getCacheMetrics(): Promise<CacheMetrics> {
    return { ...this.cacheMetrics };
  }

  // Update cache metrics
  public async updateCacheMetrics(metrics: Partial<CacheMetrics>): Promise<void> {
    this.cacheMetrics = { ...this.cacheMetrics, ...metrics };
  }

  // Get database metrics (simulated)
  public async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    // In a real implementation, this would query the actual database
    return {
      connectionPool: {
        active: Math.floor(Math.random() * 20) + 5,
        idle: Math.floor(Math.random() * 10) + 2,
        total: 30,
        waiting: Math.floor(Math.random() * 5),
      },
      queryPerformance: {
        slowQueries: Math.floor(Math.random() * 10),
        averageQueryTime: Math.floor(Math.random() * 200) + 50,
        totalQueries: Math.floor(Math.random() * 1000) + 500,
      },
      indexUsage: {
        used: Math.floor(Math.random() * 20) + 15,
        unused: Math.floor(Math.random() * 5),
        recommendations: [
          'Add index on user_id column',
          'Optimize property search query',
          'Consider partitioning large tables',
        ],
      },
    };
  }

  // Get Elasticsearch metrics (simulated)
  public async getElasticsearchMetrics(): Promise<ElasticsearchMetrics> {
    // In a real implementation, this would query Elasticsearch cluster
    return {
      clusterHealth: 'green',
      nodeCount: 3,
      indexCount: 15,
      documentCount: Math.floor(Math.random() * 1000000) + 500000,
      queryPerformance: {
        averageQueryTime: Math.floor(Math.random() * 100) + 50,
        slowQueries: Math.floor(Math.random() * 20),
        totalQueries: Math.floor(Math.random() * 5000) + 2000,
      },
      indexPerformance: {
        averageIndexTime: Math.floor(Math.random() * 50) + 25,
        totalIndexed: Math.floor(Math.random() * 10000) + 5000,
        failedIndexes: Math.floor(Math.random() * 10),
      },
    };
  }

  // Get system metrics (simulated)
  public async getSystemMetrics(): Promise<SystemMetrics> {
    // In a real implementation, this would query system resources
    return {
      cpu: {
        usage: Math.random() * 0.8,
        cores: 8,
        loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2],
      },
      memory: {
        used: Math.floor(Math.random() * 8000000000) + 4000000000, // 4-12GB
        total: 16000000000, // 16GB
        free: Math.floor(Math.random() * 8000000000) + 2000000000, // 2-10GB
        usage: Math.random() * 0.8,
      },
      disk: {
        used: Math.floor(Math.random() * 500000000000) + 200000000000, // 200-700GB
        total: 1000000000000, // 1TB
        free: Math.floor(Math.random() * 500000000000) + 200000000000, // 200-700GB
        usage: Math.random() * 0.7,
      },
      network: {
        bytesIn: Math.floor(Math.random() * 1000000000) + 500000000,
        bytesOut: Math.floor(Math.random() * 1000000000) + 500000000,
        packetsIn: Math.floor(Math.random() * 1000000) + 500000,
        packetsOut: Math.floor(Math.random() * 1000000) + 500000,
      },
    };
  }

  // Optimize database query
  public async optimizeQuery(query: string, originalTime: number): Promise<QueryOptimization> {
    // Simulate query optimization
    const optimization = this.generateQueryOptimization(query);
    const optimizedTime = Math.max(originalTime * 0.3, originalTime - 100); // At least 30% improvement
    const improvement = ((originalTime - optimizedTime) / originalTime) * 100;

    const queryOptimization: QueryOptimization = {
      id: this.generateId(),
      query,
      originalTime,
      optimizedTime,
      improvement,
      optimization,
      timestamp: new Date().toISOString(),
    };

    this.queryOptimizations.push(queryOptimization);

    // Log to audit system
    await auditLogger.logSystemEvent('query_optimized', {
      originalTime,
      optimizedTime,
      improvement,
      optimization,
    });

    return queryOptimization;
  }

  // Generate query optimization suggestions
  private generateQueryOptimization(query: string): string {
    const optimizations = [
      'Added index on WHERE clause columns',
      'Optimized JOIN order',
      'Used LIMIT to reduce result set',
      'Added covering index',
      'Optimized subquery to JOIN',
      'Used EXISTS instead of IN',
      'Added composite index',
      'Optimized GROUP BY clause',
    ];

    return optimizations[Math.floor(Math.random() * optimizations.length)];
  }

  // Get query optimizations
  public async getQueryOptimizations(limit: number = 50): Promise<QueryOptimization[]> {
    return this.queryOptimizations
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Get performance summary
  public async getPerformanceSummary(): Promise<{
    overallScore: number;
    metrics: {
      api: number;
      database: number;
      elasticsearch: number;
      cache: number;
      system: number;
    };
    recommendations: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    recentOptimizations: number;
  }> {
    const recentMetrics = this.metrics.filter(
      m => Date.now() - new Date(m.timestamp).getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    // Calculate scores for each component
    const apiScore = this.calculateComponentScore(recentMetrics, 'api');
    const databaseScore = this.calculateComponentScore(recentMetrics, 'database');
    const elasticsearchScore = this.calculateComponentScore(recentMetrics, 'elasticsearch');
    const cacheScore = this.calculateComponentScore(recentMetrics, 'cache');
    const systemScore = this.calculateComponentScore(recentMetrics, 'system');

    const overallScore = Math.round((apiScore + databaseScore + elasticsearchScore + cacheScore + systemScore) / 5);

    const recommendations = this.recommendations.reduce(
      (acc, rec) => {
        acc.total++;
        acc[rec.priority]++;
        return acc;
      },
      { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
    );

    const recentOptimizations = this.queryOptimizations.filter(
      opt => Date.now() - new Date(opt.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    ).length;

    return {
      overallScore,
      metrics: {
        api: apiScore,
        database: databaseScore,
        elasticsearch: elasticsearchScore,
        cache: cacheScore,
        system: systemScore,
      },
      recommendations,
      recentOptimizations,
    };
  }

  // Calculate component performance score
  private calculateComponentScore(metrics: PerformanceMetrics[], type: string): number {
    const componentMetrics = metrics.filter(m => m.type === type);
    if (componentMetrics.length === 0) return 100;

    const threshold = this.THRESHOLDS[type as keyof typeof this.THRESHOLDS];
    if (!threshold) return 100;

    let score = 100;
    for (const metric of componentMetrics) {
      if (metric.name === 'response_time' && metric.value > threshold.responseTime) {
        score -= Math.min(50, (metric.value - threshold.responseTime) / threshold.responseTime * 50);
      } else if (metric.name === 'query_time' && metric.value > threshold.queryTime) {
        score -= Math.min(50, (metric.value - threshold.queryTime) / threshold.queryTime * 50);
      } else if (metric.name === 'hit_rate' && metric.value < threshold.hitRate) {
        score -= Math.min(50, (threshold.hitRate - metric.value) / threshold.hitRate * 50);
      } else if (metric.name === 'cpu_usage' && metric.value > threshold.cpuUsage) {
        score -= Math.min(50, (metric.value - threshold.cpuUsage) / threshold.cpuUsage * 50);
      }
    }

    return Math.max(0, Math.round(score));
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();
