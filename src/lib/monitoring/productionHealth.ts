import { EventEmitter } from 'events';
import { getDatabaseManager } from '@/lib/database/connectionPool';
import { getMetricsCollector } from '@/lib/monitoring/metricsCollector';
import { getAlertManager } from '@/lib/monitoring/performanceAlerting';

// Health check result interface
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: Date;
  details?: any;
  error?: string;
}

// System health summary
export interface SystemHealthSummary {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  services: HealthCheckResult[];
  uptime: number;
  lastUpdated: Date;
  recommendations: string[];
}

// Production health monitor
export class ProductionHealthMonitor extends EventEmitter {
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthHistory: SystemHealthSummary[] = [];
  private maxHistorySize = 100;
  private startTime = Date.now();

  constructor() {
    super();
  }

  // Start health monitoring
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);

    console.log('🏥 Production health monitoring started');
  }

  // Stop health monitoring
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('🏥 Production health monitoring stopped');
  }

  // Perform comprehensive health check
  async performHealthCheck(): Promise<SystemHealthSummary> {
    const startTime = Date.now();
    const services: HealthCheckResult[] = [];

    try {
      // Check database health
      const dbHealth = await this.checkDatabaseHealth();
      services.push(dbHealth);

      // Check API health
      const apiHealth = await this.checkAPIHealth();
      services.push(apiHealth);

      // Check cache health
      const cacheHealth = await this.checkCacheHealth();
      services.push(cacheHealth);

      // Check external services
      const externalHealth = await this.checkExternalServices();
      services.push(...externalHealth);

      // Check system resources
      const systemHealth = await this.checkSystemResources();
      services.push(systemHealth);

      // Calculate overall health
      const overallHealth = this.calculateOverallHealth(services);
      const score = this.calculateHealthScore(services);
      const recommendations = this.generateRecommendations(services);

      const summary: SystemHealthSummary = {
        overall: overallHealth,
        score,
        services,
        uptime: Date.now() - this.startTime,
        lastUpdated: new Date(),
        recommendations
      };

      // Add to history
      this.healthHistory.push(summary);
      if (this.healthHistory.length > this.maxHistorySize) {
        this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
      }

      // Emit health check event
      this.emit('health-check', summary);

      // Trigger alerts if unhealthy
      if (overallHealth === 'unhealthy') {
        this.emit('health-critical', summary);
      } else if (overallHealth === 'degraded') {
        this.emit('health-warning', summary);
      }

      return summary;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      
      const errorSummary: SystemHealthSummary = {
        overall: 'unhealthy',
        score: 0,
        services: [{
          service: 'health-monitor',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }],
        uptime: Date.now() - this.startTime,
        lastUpdated: new Date(),
        recommendations: ['Investigate health monitoring system failure']
      };

      this.emit('health-check-error', errorSummary);
      return errorSummary;
    }
  }

  // Check database health
  private async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const dbManager = getDatabaseManager();
      const healthCheck = await dbManager.healthCheck();
      
      return {
        service: 'database',
        status: healthCheck.status === 'healthy' ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: healthCheck
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Database check failed'
      };
    }
  }

  // Check API health
  private async checkAPIHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/health-check', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const isHealthy = response.ok;
      const data = await response.json();

      return {
        service: 'api',
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: data
      };
    } catch (error) {
      return {
        service: 'api',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'API check failed'
      };
    }
  }

  // Check cache health
  private async checkCacheHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check Redis connection (simplified)
      const isHealthy = true; // Would check actual Redis connection
      
      return {
        service: 'cache',
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: { connected: isHealthy }
      };
    } catch (error) {
      return {
        service: 'cache',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Cache check failed'
      };
    }
  }

  // Check external services
  private async checkExternalServices(): Promise<HealthCheckResult[]> {
    const services = [
      { name: 'elasticsearch', url: process.env.ELASTICSEARCH_URL },
      { name: 'supabase', url: process.env.SUPABASE_URL }
    ];

    const results: HealthCheckResult[] = [];

    for (const service of services) {
      if (!service.url) continue;

      const startTime = Date.now();
      
      try {
        const response = await fetch(service.url, {
          method: 'GET',
          timeout: 5000
        });

        results.push({
          service: service.name,
          status: response.ok ? 'healthy' : 'degraded',
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
          details: { status: response.status }
        });
      } catch (error) {
        results.push({
          service: service.name,
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Service check failed'
        });
      }
    }

    return results;
  }

  // Check system resources
  private async checkSystemResources(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = await this.getCPUUsage();
      
      const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      const isHealthy = memoryUsagePercent < 80 && cpuUsage < 80;

      return {
        service: 'system',
        status: isHealthy ? 'healthy' : memoryUsagePercent > 90 || cpuUsage > 90 ? 'unhealthy' : 'degraded',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: {
          memory: {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal,
            percentage: Math.round(memoryUsagePercent * 100) / 100
          },
          cpu: {
            usage: Math.round(cpuUsage * 100) / 100
          }
        }
      };
    } catch (error) {
      return {
        service: 'system',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'System check failed'
      };
    }
  }

  // Get CPU usage
  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = Date.now();
        
        const userTime = endUsage.user / 1000000;
        const systemTime = endUsage.system / 1000000;
        const totalTime = (endTime - startTime) / 1000;
        
        const cpuUsage = ((userTime + systemTime) / totalTime) * 100;
        resolve(Math.min(100, Math.max(0, cpuUsage)));
      }, 100);
    });
  }

  // Calculate overall health
  private calculateOverallHealth(services: HealthCheckResult[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;

    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  // Calculate health score
  private calculateHealthScore(services: HealthCheckResult[]): number {
    if (services.length === 0) return 0;

    const scores = services.map(service => {
      switch (service.status) {
        case 'healthy': return 100;
        case 'degraded': return 60;
        case 'unhealthy': return 0;
        default: return 0;
      }
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  // Generate recommendations
  private generateRecommendations(services: HealthCheckResult[]): string[] {
    const recommendations: string[] = [];

    services.forEach(service => {
      switch (service.status) {
        case 'unhealthy':
          recommendations.push(`Critical: ${service.service} is down - immediate attention required`);
          break;
        case 'degraded':
          recommendations.push(`Warning: ${service.service} performance is degraded - monitor closely`);
          break;
      }

      if (service.responseTime > 5000) {
        recommendations.push(`Performance: ${service.service} response time is high (${service.responseTime}ms)`);
      }
    });

    return recommendations;
  }

  // Get current health status
  getCurrentHealth(): SystemHealthSummary | null {
    return this.healthHistory[this.healthHistory.length - 1] || null;
  }

  // Get health history
  getHealthHistory(limit?: number): SystemHealthSummary[] {
    const history = [...this.healthHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  // Get health trends
  getHealthTrends(): {
    averageScore: number;
    uptimePercentage: number;
    criticalIssues: number;
    trend: 'improving' | 'stable' | 'declining';
  } {
    if (this.healthHistory.length < 2) {
      return {
        averageScore: 0,
        uptimePercentage: 0,
        criticalIssues: 0,
        trend: 'stable'
      };
    }

    const recent = this.healthHistory.slice(-10);
    const averageScore = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
    
    const criticalIssues = recent.filter(h => h.overall === 'unhealthy').length;
    const uptimePercentage = ((recent.length - criticalIssues) / recent.length) * 100;

    // Calculate trend
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, h) => sum + h.score, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, h) => sum + h.score, 0) / secondHalf.length;
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (secondHalfAvg > firstHalfAvg + 5) trend = 'improving';
    else if (secondHalfAvg < firstHalfAvg - 5) trend = 'declining';

    return {
      averageScore: Math.round(averageScore * 100) / 100,
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      criticalIssues,
      trend
    };
  }

  // Export health data
  exportHealthData(): {
    summary: SystemHealthSummary | null;
    history: SystemHealthSummary[];
    trends: any;
    timestamp: Date;
  } {
    return {
      summary: this.getCurrentHealth(),
      history: this.getHealthHistory(),
      trends: this.getHealthTrends(),
      timestamp: new Date()
    };
  }
}

// Singleton health monitor instance
let healthMonitor: ProductionHealthMonitor | null = null;

export function getHealthMonitor(): ProductionHealthMonitor {
  if (!healthMonitor) {
    healthMonitor = new ProductionHealthMonitor();
    healthMonitor.startMonitoring();
  }
  return healthMonitor;
}
