import { performanceMonitor } from './performanceMonitor';
import { errorHandler } from './errorHandler';
import { redisService } from './redisService';

interface ServerInstance {
  id: string;
  host: string;
  port: number;
  health: 'healthy' | 'unhealthy' | 'degraded';
  load: number; // 0-100
  responseTime: number;
  activeConnections: number;
  maxConnections: number;
  lastHealthCheck: number;
  uptime: number;
  version: string;
  region: string;
}

interface LoadBalancerConfig {
  algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' | 'least-response-time';
  healthCheckInterval: number;
  healthCheckTimeout: number;
  maxRetries: number;
  enableStickySessions: boolean;
  stickySessionTimeout: number;
  enableAutoScaling: boolean;
  minInstances: number;
  maxInstances: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  scaleCooldown: number;
}

interface ScalingMetrics {
  currentInstances: number;
  targetInstances: number;
  lastScaleUp: number;
  lastScaleDown: number;
  scaleUpCount: number;
  scaleDownCount: number;
  averageLoad: number;
  averageResponseTime: number;
}

class LoadBalancer {
  private config: LoadBalancerConfig;
  private instances: Map<string, ServerInstance> = new Map();
  private currentIndex: number = 0;
  private sessionMap: Map<string, string> = new Map(); // sessionId -> instanceId
  private healthCheckInterval: NodeJS.Timeout;
  private autoScalingInterval: NodeJS.Timeout;
  private isInitialized: boolean = false;

  constructor(config: Partial<LoadBalancerConfig> = {}) {
    this.config = {
      algorithm: config.algorithm || 'least-response-time',
      healthCheckInterval: config.healthCheckInterval || 30000, // 30 seconds
      healthCheckTimeout: config.healthCheckTimeout || 5000, // 5 seconds
      maxRetries: config.maxRetries || 3,
      enableStickySessions: config.enableStickySessions ?? true,
      stickySessionTimeout: config.stickySessionTimeout || 300000, // 5 minutes
      enableAutoScaling: config.enableAutoScaling ?? true,
      minInstances: config.minInstances || 2,
      maxInstances: config.maxInstances || 10,
      scaleUpThreshold: config.scaleUpThreshold || 80, // 80% load
      scaleDownThreshold: config.scaleDownThreshold || 30, // 30% load
      scaleCooldown: config.scaleCooldown || 300000 // 5 minutes
    };

    this.initializeLoadBalancer();
  }

  // Initialize load balancer with default instances
  private async initializeLoadBalancer(): Promise<void> {
    try {
      // Add default instances
      this.addInstance({
        id: 'instance-1',
        host: 'localhost',
        port: 3000,
        health: 'healthy',
        load: 0,
        responseTime: 0,
        activeConnections: 0,
        maxConnections: 1000,
        lastHealthCheck: Date.now(),
        uptime: 0,
        version: '1.0.0',
        region: 'local'
      });

      this.addInstance({
        id: 'instance-2',
        host: 'localhost',
        port: 3001,
        health: 'healthy',
        load: 0,
        responseTime: 0,
        activeConnections: 0,
        maxConnections: 1000,
        lastHealthCheck: Date.now(),
        uptime: 0,
        version: '1.0.0',
        region: 'local'
      });

      // Start health checking
      this.startHealthChecking();
      
      // Start auto-scaling
      if (this.config.enableAutoScaling) {
        this.startAutoScaling();
      }

      this.isInitialized = true;
      console.log('✅ Load balancer initialized with', this.instances.size, 'instances');
      
      performanceMonitor.trackMetric('load_balancer_init', 1, 'status', { 
        status: 'success', 
        instances: this.instances.size 
      });
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'load_balancer_init',
        method: 'INIT',
        metadata: {}
      });
      this.isInitialized = false;
    }
  }

  // Add a new server instance
  addInstance(instance: ServerInstance): void {
    this.instances.set(instance.id, {
      ...instance,
      lastHealthCheck: Date.now(),
      uptime: Date.now()
    });

    console.log(`➕ Added instance: ${instance.id} (${instance.host}:${instance.port})`);
    
    performanceMonitor.trackMetric('load_balancer_instance_added', 1, 'count', { 
      instanceId: instance.id, 
      region: instance.region 
    });
  }

  // Remove a server instance
  removeInstance(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (instance) {
      this.instances.delete(instanceId);
      console.log(`➖ Removed instance: ${instanceId}`);
      
      performanceMonitor.trackMetric('load_balancer_instance_removed', 1, 'count', { 
        instanceId, 
        region: instance.region 
      });
      
      return true;
    }
    return false;
  }

  // Get next available instance based on load balancing algorithm
  getNextInstance(sessionId?: string): ServerInstance | null {
    if (this.instances.size === 0) {
      return null;
    }

    // Check for sticky session
    if (this.config.enableStickySessions && sessionId) {
      const stickyInstanceId = this.sessionMap.get(sessionId);
      if (stickyInstanceId) {
        const stickyInstance = this.instances.get(stickyInstanceId);
        if (stickyInstance && stickyInstance.health === 'healthy') {
          return stickyInstance;
        }
      }
    }

    const healthyInstances = Array.from(this.instances.values())
      .filter(instance => instance.health === 'healthy');

    if (healthyInstances.length === 0) {
      return null;
    }

    let selectedInstance: ServerInstance;

    switch (this.config.algorithm) {
      case 'round-robin':
        selectedInstance = this.roundRobinSelection(healthyInstances);
        break;
      case 'least-connections':
        selectedInstance = this.leastConnectionsSelection(healthyInstances);
        break;
      case 'weighted':
        selectedInstance = this.weightedSelection(healthyInstances);
        break;
      case 'ip-hash':
        selectedInstance = this.ipHashSelection(healthyInstances, sessionId);
        break;
      case 'least-response-time':
      default:
        selectedInstance = this.leastResponseTimeSelection(healthyInstances);
        break;
    }

    // Update sticky session if enabled
    if (this.config.enableStickySessions && sessionId) {
      this.sessionMap.set(sessionId, selectedInstance.id);
      
      // Set timeout to remove sticky session
      setTimeout(() => {
        this.sessionMap.delete(sessionId);
      }, this.config.stickySessionTimeout);
    }

    return selectedInstance;
  }

  // Round-robin selection
  private roundRobinSelection(instances: ServerInstance[]): ServerInstance {
    this.currentIndex = (this.currentIndex + 1) % instances.length;
    return instances[this.currentIndex];
  }

  // Least connections selection
  private leastConnectionsSelection(instances: ServerInstance[]): ServerInstance {
    return instances.reduce((min, current) => 
      current.activeConnections < min.activeConnections ? current : min
    );
  }

  // Weighted selection based on instance capacity
  private weightedSelection(instances: ServerInstance[]): ServerInstance {
    const totalWeight = instances.reduce((sum, instance) => 
      sum + (instance.maxConnections - instance.activeConnections), 0
    );
    
    let random = Math.random() * totalWeight;
    
    for (const instance of instances) {
      const weight = instance.maxConnections - instance.activeConnections;
      if (random <= weight) {
        return instance;
      }
      random -= weight;
    }
    
    return instances[0];
  }

  // IP hash selection for consistent routing
  private ipHashSelection(instances: ServerInstance[], sessionId?: string): ServerInstance {
    if (!sessionId) {
      return instances[0];
    }
    
    const hash = this.hashString(sessionId);
    return instances[hash % instances.length];
  }

  // Least response time selection
  private leastResponseTimeSelection(instances: ServerInstance[]): ServerInstance {
    return instances.reduce((min, current) => 
      current.responseTime < min.responseTime ? current : min
    );
  }

  // Simple string hashing
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Update instance metrics
  updateInstanceMetrics(
    instanceId: string,
    metrics: Partial<Pick<ServerInstance, 'load' | 'responseTime' | 'activeConnections'>>
  ): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      Object.assign(instance, metrics);
      instance.lastHealthCheck = Date.now();
    }
  }

  // Start health checking
  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  // Perform health checks on all instances
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.instances.values()).map(instance =>
      this.checkInstanceHealth(instance)
    );

    try {
      await Promise.allSettled(healthCheckPromises);
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'load_balancer_health_check',
        method: 'HEALTH_CHECK',
        metadata: {}
      });
    }
  }

  // Check health of a specific instance
  private async checkInstanceHealth(instance: ServerInstance): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Simulate health check (replace with actual HTTP request in production)
      const isHealthy = await this.simulateHealthCheck(instance);
      
      const responseTime = Date.now() - startTime;
      
      // Update instance health
      const previousHealth = instance.health;
      instance.health = isHealthy ? 'healthy' : 'unhealthy';
      instance.responseTime = responseTime;
      instance.lastHealthCheck = Date.now();
      instance.uptime = Date.now() - instance.uptime;

      // Track health changes
      if (previousHealth !== instance.health) {
        performanceMonitor.trackMetric('load_balancer_health_change', 1, 'status', {
          instanceId: instance.id,
          previousHealth,
          newHealth: instance.health,
          responseTime
        });

        if (instance.health === 'unhealthy') {
          console.warn(`⚠️ Instance ${instance.id} is unhealthy`);
        } else if (instance.health === 'healthy') {
          console.log(`✅ Instance ${instance.id} recovered`);
        }
      }
    } catch (error) {
      instance.health = 'unhealthy';
      instance.lastHealthCheck = Date.now();
      
      await errorHandler.handleError(error as Error, {
        endpoint: 'load_balancer_instance_health',
        method: 'HEALTH_CHECK',
        metadata: { instanceId: instance.id }
      });
    }
  }

  // Simulate health check (replace with actual implementation)
  private async simulateHealthCheck(instance: ServerInstance): Promise<boolean> {
    // Simulate network delay and occasional failures
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    // 95% success rate for healthy instances
    if (instance.health === 'healthy') {
      return Math.random() > 0.05;
    }
    
    // 20% recovery rate for unhealthy instances
    return Math.random() > 0.8;
  }

  // Start auto-scaling
  private startAutoScaling(): void {
    this.autoScalingInterval = setInterval(async () => {
      await this.performAutoScaling();
    }, 60000); // Check every minute
  }

  // Perform auto-scaling based on current metrics
  private async performAutoScaling(): Promise<void> {
    try {
      const metrics = this.getScalingMetrics();
      const currentLoad = metrics.averageLoad;
      const currentInstances = metrics.currentInstances;

      let shouldScale = false;
      let scaleDirection: 'up' | 'down' | null = null;

      // Check if we need to scale up
      if (currentLoad > this.config.scaleUpThreshold && 
          currentInstances < this.config.maxInstances &&
          Date.now() - metrics.lastScaleUp > this.config.scaleCooldown) {
        shouldScale = true;
        scaleDirection = 'up';
      }
      // Check if we need to scale down
      else if (currentLoad < this.config.scaleDownThreshold && 
               currentInstances > this.config.minInstances &&
               Date.now() - metrics.lastScaleDown > this.config.scaleCooldown) {
        shouldScale = true;
        scaleDirection = 'down';
      }

      if (shouldScale && scaleDirection) {
        await this.executeScaling(scaleDirection);
      }
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'load_balancer_auto_scaling',
        method: 'AUTO_SCALING',
        metadata: {}
      });
    }
  }

  // Execute scaling operation
  private async executeScaling(direction: 'up' | 'down'): Promise<void> {
    try {
      if (direction === 'up') {
        await this.scaleUp();
      } else {
        await this.scaleDown();
      }
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'load_balancer_scaling_execution',
        method: 'SCALING',
        metadata: { direction }
      });
    }
  }

  // Scale up by adding new instances
  private async scaleUp(): Promise<void> {
    const newInstanceId = `instance-${Date.now()}`;
    const newInstance: ServerInstance = {
      id: newInstanceId,
      host: 'localhost',
      port: 3000 + Math.floor(Math.random() * 1000), // Random port
      health: 'healthy',
      load: 0,
      responseTime: 0,
      activeConnections: 0,
      maxConnections: 1000,
      lastHealthCheck: Date.now(),
      uptime: Date.now(),
      version: '1.0.0',
      region: 'local'
    };

    this.addInstance(newInstance);
    
    // Update scaling metrics
    const metrics = this.getScalingMetrics();
    metrics.lastScaleUp = Date.now();
    metrics.scaleUpCount++;
    
    console.log(`📈 Scaled up: Added instance ${newInstanceId}`);
    
    performanceMonitor.trackMetric('load_balancer_scale_up', 1, 'count', { 
      newInstanceId, 
      totalInstances: this.instances.size 
    });
  }

  // Scale down by removing instances
  private async scaleDown(): Promise<void> {
    const instances = Array.from(this.instances.values())
      .filter(instance => instance.health === 'healthy')
      .sort((a, b) => a.load - b.load);

    if (instances.length > this.config.minInstances) {
      const instanceToRemove = instances[0]; // Remove least loaded instance
      this.removeInstance(instanceToRemove.id);
      
      // Update scaling metrics
      const metrics = this.getScalingMetrics();
      metrics.lastScaleDown = Date.now();
      metrics.scaleDownCount++;
      
      console.log(`📉 Scaled down: Removed instance ${instanceToRemove.id}`);
      
      performanceMonitor.trackMetric('load_balancer_scale_down', 1, 'count', { 
        removedInstanceId: instanceToRemove.id, 
        totalInstances: this.instances.size 
      });
    }
  }

  // Get scaling metrics
  getScalingMetrics(): ScalingMetrics {
    const instances = Array.from(this.instances.values());
    const healthyInstances = instances.filter(instance => instance.health === 'healthy');
    
    const averageLoad = healthyInstances.length > 0 ? 
      healthyInstances.reduce((sum, instance) => sum + instance.load, 0) / healthyInstances.length : 0;
    
    const averageResponseTime = healthyInstances.length > 0 ? 
      healthyInstances.reduce((sum, instance) => sum + instance.responseTime, 0) / healthyInstances.length : 0;

    return {
      currentInstances: healthyInstances.length,
      targetInstances: this.config.minInstances,
      lastScaleUp: 0, // Would be tracked in production
      lastScaleDown: 0, // Would be tracked in production
      scaleUpCount: 0, // Would be tracked in production
      scaleDownCount: 0, // Would be tracked in production
      averageLoad: Math.round(averageLoad * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100
    };
  }

  // Get load balancer statistics
  getStats(): {
    totalInstances: number;
    healthyInstances: number;
    unhealthyInstances: number;
    totalConnections: number;
    averageLoad: number;
    averageResponseTime: number;
    algorithm: string;
    stickySessions: number;
    scalingMetrics: ScalingMetrics;
  } {
    const instances = Array.from(this.instances.values());
    const healthyInstances = instances.filter(instance => instance.health === 'healthy');
    const unhealthyInstances = instances.filter(instance => instance.health === 'unhealthy');
    
    const totalConnections = instances.reduce((sum, instance) => sum + instance.activeConnections, 0);
    const averageLoad = healthyInstances.length > 0 ? 
      healthyInstances.reduce((sum, instance) => sum + instance.load, 0) / healthyInstances.length : 0;
    const averageResponseTime = healthyInstances.length > 0 ? 
      healthyInstances.reduce((sum, instance) => sum + instance.responseTime, 0) / healthyInstances.length : 0;

    return {
      totalInstances: instances.length,
      healthyInstances: healthyInstances.length,
      unhealthyInstances: unhealthyInstances.length,
      totalConnections,
      averageLoad: Math.round(averageLoad * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      algorithm: this.config.algorithm,
      stickySessions: this.sessionMap.size,
      scalingMetrics: this.getScalingMetrics()
    };
  }

  // Get all instances
  getInstances(): ServerInstance[] {
    return Array.from(this.instances.values());
  }

  // Get instance by ID
  getInstance(instanceId: string): ServerInstance | undefined {
    return this.instances.get(instanceId);
  }

  // Update configuration
  updateConfig(newConfig: Partial<LoadBalancerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart services if needed
    if (newConfig.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.startHealthChecking();
    }
    
    if (newConfig.enableAutoScaling !== undefined) {
      if (newConfig.enableAutoScaling && !this.autoScalingInterval) {
        this.startAutoScaling();
      } else if (!newConfig.enableAutoScaling && this.autoScalingInterval) {
        clearInterval(this.autoScalingInterval);
      }
    }
  }

  // Get current configuration
  getConfig(): LoadBalancerConfig {
    return { ...this.config };
  }

  // Check if system is initialized
  isSystemInitialized(): boolean {
    return this.isInitialized;
  }

  // Cleanup resources
  cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.autoScalingInterval) {
      clearInterval(this.autoScalingInterval);
    }
    this.sessionMap.clear();
  }
}

// Create singleton instance
export const loadBalancer = new LoadBalancer();

// Export types and utilities
export type { ServerInstance, LoadBalancerConfig, ScalingMetrics };
export { LoadBalancer };

export default loadBalancer;
