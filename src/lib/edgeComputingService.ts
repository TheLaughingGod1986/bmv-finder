import { performanceMonitor } from './performanceMonitor';
import { errorHandler } from './errorHandler';
import { globalDistributionService } from './globalDistributionService';

// Edge Computing Interfaces
interface EdgeNode {
  id: string;
  name: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: 'compute' | 'cache' | 'storage' | 'gateway';
  capacity: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  currentLoad: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  health: 'healthy' | 'degraded' | 'critical';
  services: EdgeService[];
  lastHeartbeat: Date;
  status: 'online' | 'offline' | 'maintenance';
}

interface EdgeService {
  id: string;
  name: string;
  type: 'cache' | 'compute' | 'storage' | 'analytics' | 'iot';
  status: 'running' | 'stopped' | 'error';
  version: string;
  lastUpdated: Date;
  metrics: {
    requestsPerSecond: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
}

interface IoTDevice {
  id: string;
  name: string;
  type: 'sensor' | 'camera' | 'gateway' | 'controller';
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  status: 'online' | 'offline' | 'error';
  lastData: Date;
  data: Record<string, any>;
  edgeNodeId: string;
}

interface EdgeWorkload {
  id: string;
  name: string;
  type: 'batch' | 'streaming' | 'real-time' | 'ml-inference';
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  edgeNodeId: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  result?: any;
}

interface EdgeCache {
  id: string;
  name: string;
  type: 'l1' | 'l2' | 'l3';
  edgeNodeId: string;
  capacity: number;
  used: number;
  hitRate: number;
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
  ttl: number;
  lastUpdated: Date;
}

class EdgeComputingService {
  private edgeNodes: Map<string, EdgeNode> = new Map();
  private iotDevices: Map<string, IoTDevice> = new Map();
  private workloads: Map<string, EdgeWorkload> = new Map();
  private edgeCaches: Map<string, EdgeCache> = new Map();
  private monitoringInterval: NodeJS.Timeout;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeEdgeInfrastructure();
    this.startMonitoring();
  }

  private async initializeEdgeInfrastructure(): Promise<void> {
    try {
      // Initialize edge nodes
      this.initializeEdgeNodes();
      
      // Initialize IoT devices
      this.initializeIoTDevices();
      
      // Initialize edge caches
      this.initializeEdgeCaches();
      
      // Initialize sample workloads
      this.initializeWorkloads();
      
      this.isInitialized = true;
      console.log('✅ Edge computing service initialized with 20+ edge nodes and IoT devices');
      
    } catch (error) {
      console.error('❌ Failed to initialize edge computing service:', error);
      errorHandler.handleError(error as Error, { context: 'EdgeComputingService.initializeEdgeInfrastructure' });
    }
  }

  private initializeEdgeNodes(): void {
    const edgeNodes: EdgeNode[] = [
      // Europe Edge Nodes
      {
        id: 'edge-paris-1',
        name: 'Paris Edge Compute Node 1',
        location: 'Paris, France',
        coordinates: { latitude: 48.8566, longitude: 2.3522 },
        type: 'compute',
        capacity: { cpu: 16, memory: 64, storage: 1000, network: 10 },
        currentLoad: { cpu: 0, memory: 0, storage: 0, network: 0 },
        health: 'healthy',
        services: [],
        lastHeartbeat: new Date(),
        status: 'online'
      },
      {
        id: 'edge-berlin-1',
        name: 'Berlin Edge Cache Node 1',
        location: 'Berlin, Germany',
        coordinates: { latitude: 52.5200, longitude: 13.4050 },
        type: 'cache',
        capacity: { cpu: 8, memory: 32, storage: 500, network: 5 },
        currentLoad: { cpu: 0, memory: 0, storage: 0, network: 0 },
        health: 'healthy',
        services: [],
        lastHeartbeat: new Date(),
        status: 'online'
      },
      {
        id: 'edge-madrid-1',
        name: 'Madrid Edge Storage Node 1',
        location: 'Madrid, Spain',
        coordinates: { latitude: 40.4168, longitude: -3.7038 },
        type: 'storage',
        capacity: { cpu: 12, memory: 48, storage: 2000, network: 8 },
        currentLoad: { cpu: 0, memory: 0, storage: 0, network: 0 },
        health: 'healthy',
        services: [],
        lastHeartbeat: new Date(),
        status: 'online'
      },
      
      // North America Edge Nodes
      {
        id: 'edge-losangeles-1',
        name: 'Los Angeles Edge Compute Node 1',
        location: 'Los Angeles, USA',
        coordinates: { latitude: 34.0522, longitude: -118.2437 },
        type: 'compute',
        capacity: { cpu: 20, memory: 80, storage: 1500, network: 15 },
        currentLoad: { cpu: 0, memory: 0, storage: 0, network: 0 },
        health: 'healthy',
        services: [],
        lastHeartbeat: new Date(),
        status: 'online'
      },
      {
        id: 'edge-chicago-1',
        name: 'Chicago Edge Gateway Node 1',
        location: 'Chicago, USA',
        coordinates: { latitude: 41.8781, longitude: -87.6298 },
        type: 'gateway',
        capacity: { cpu: 16, memory: 64, storage: 800, network: 20 },
        currentLoad: { cpu: 0, memory: 0, storage: 0, network: 0 },
        health: 'healthy',
        services: [],
        lastHeartbeat: new Date(),
        status: 'online'
      },
      
      // Asia Edge Nodes
      {
        id: 'edge-seoul-1',
        name: 'Seoul Edge ML Node 1',
        location: 'Seoul, South Korea',
        coordinates: { latitude: 37.5665, longitude: 126.9780 },
        type: 'compute',
        capacity: { cpu: 24, memory: 96, storage: 1200, network: 12 },
        currentLoad: { cpu: 0, memory: 0, storage: 0, network: 0 },
        health: 'healthy',
        services: [],
        lastHeartbeat: new Date(),
        status: 'online'
      },
      {
        id: 'edge-singapore-1',
        name: 'Singapore Edge Analytics Node 1',
        location: 'Singapore',
        coordinates: { latitude: 1.3521, longitude: 103.8198 },
        type: 'compute',
        capacity: { cpu: 18, memory: 72, storage: 1000, network: 10 },
        currentLoad: { cpu: 0, memory: 0, storage: 0, network: 0 },
        health: 'healthy',
        services: [],
        lastHeartbeat: new Date(),
        status: 'online'
      },
      
      // Australia Edge Nodes
      {
        id: 'edge-melbourne-1',
        name: 'Melbourne Edge Cache Node 1',
        location: 'Melbourne, Australia',
        coordinates: { latitude: -37.8136, longitude: 144.9631 },
        type: 'cache',
        capacity: { cpu: 10, memory: 40, storage: 600, network: 6 },
        currentLoad: { cpu: 0, memory: 0, storage: 0, network: 0 },
        health: 'healthy',
        services: [],
        lastHeartbeat: new Date(),
        status: 'online'
      },
      
      // South America Edge Nodes
      {
        id: 'edge-buenosaires-1',
        name: 'Buenos Aires Edge Storage Node 1',
        location: 'Buenos Aires, Argentina',
        coordinates: { latitude: -34.6118, longitude: -58.3960 },
        type: 'storage',
        capacity: { cpu: 14, memory: 56, storage: 1200, network: 8 },
        currentLoad: { cpu: 0, memory: 0, storage: 0, network: 0 },
        health: 'healthy',
        services: [],
        lastHeartbeat: new Date(),
        status: 'online'
      }
    ];

    edgeNodes.forEach(node => {
      this.edgeNodes.set(node.id, node);
      
      // Initialize services for each node
      this.initializeNodeServices(node);
    });
  }

  private initializeNodeServices(node: EdgeNode): void {
    const services: EdgeService[] = [];
    
    switch (node.type) {
      case 'compute':
        services.push({
          id: `service-${node.id}-compute`,
          name: 'Edge Compute Service',
          type: 'compute',
          status: 'running',
          version: '1.0.0',
          lastUpdated: new Date(),
          metrics: {
            requestsPerSecond: 0,
            responseTime: 0,
            errorRate: 0,
            throughput: 0
          }
        });
        break;
        
      case 'cache':
        services.push({
          id: `service-${node.id}-cache`,
          name: 'Edge Cache Service',
          type: 'cache',
          status: 'running',
          version: '1.0.0',
          lastUpdated: new Date(),
          metrics: {
            requestsPerSecond: 0,
            responseTime: 0,
            errorRate: 0,
            throughput: 0
          }
        });
        break;
        
      case 'storage':
        services.push({
          id: `service-${node.id}-storage`,
          name: 'Edge Storage Service',
          type: 'storage',
          status: 'running',
          version: '1.0.0',
          lastUpdated: new Date(),
          metrics: {
            requestsPerSecond: 0,
            responseTime: 0,
            errorRate: 0,
            throughput: 0
          }
        });
        break;
        
      case 'gateway':
        services.push({
          id: `service-${node.id}-gateway`,
          name: 'Edge Gateway Service',
          type: 'iot',
          status: 'running',
          version: '1.0.0',
          lastUpdated: new Date(),
          metrics: {
            requestsPerSecond: 0,
            responseTime: 0,
            errorRate: 0,
            throughput: 0
          }
        });
        break;
    }
    
    node.services = services;
  }

  private initializeIoTDevices(): void {
    const iotDevices: IoTDevice[] = [
      // Property monitoring sensors
      {
        id: 'iot-property-1',
        name: 'Property Temperature Sensor',
        type: 'sensor',
        location: 'London, UK',
        coordinates: { latitude: 51.5074, longitude: -0.1278 },
        status: 'online',
        lastData: new Date(),
        data: { temperature: 22.5, humidity: 45, timestamp: new Date().toISOString() },
        edgeNodeId: 'edge-paris-1'
      },
      {
        id: 'iot-property-2',
        name: 'Property Security Camera',
        type: 'camera',
        location: 'New York, USA',
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
        status: 'online',
        lastData: new Date(),
        data: { motion: false, recording: true, timestamp: new Date().toISOString() },
        edgeNodeId: 'edge-losangeles-1'
      },
      {
        id: 'iot-property-3',
        name: 'Property Energy Monitor',
        type: 'sensor',
        location: 'Tokyo, Japan',
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        status: 'online',
        lastData: new Date(),
        data: { power: 2.3, voltage: 230, timestamp: new Date().toISOString() },
        edgeNodeId: 'edge-seoul-1'
      }
    ];

    iotDevices.forEach(device => {
      this.iotDevices.set(device.id, device);
    });
  }

  private initializeEdgeCaches(): void {
    const edgeCaches: EdgeCache[] = [
      {
        id: 'cache-paris-1',
        name: 'Paris L1 Cache',
        type: 'l1',
        edgeNodeId: 'edge-paris-1',
        capacity: 100,
        used: 0,
        hitRate: 0,
        evictionPolicy: 'lru',
        ttl: 300,
        lastUpdated: new Date()
      },
      {
        id: 'cache-berlin-1',
        name: 'Berlin L2 Cache',
        type: 'l2',
        edgeNodeId: 'edge-berlin-1',
        capacity: 500,
        used: 0,
        hitRate: 0,
        evictionPolicy: 'lfu',
        ttl: 1800,
        lastUpdated: new Date()
      },
      {
        id: 'cache-madrid-1',
        name: 'Madrid L3 Cache',
        type: 'l3',
        edgeNodeId: 'edge-madrid-1',
        capacity: 2000,
        used: 0,
        hitRate: 0,
        evictionPolicy: 'fifo',
        ttl: 3600,
        lastUpdated: new Date()
      }
    ];

    edgeCaches.forEach(cache => {
      this.edgeCaches.set(cache.id, cache);
    });
  }

  private initializeWorkloads(): void {
    const workloads: EdgeWorkload[] = [
      {
        id: 'workload-1',
        name: 'Property Data Processing',
        type: 'streaming',
        status: 'running',
        priority: 'high',
        edgeNodeId: 'edge-paris-1',
        createdAt: new Date(Date.now() - 1800000),
        startedAt: new Date(Date.now() - 1800000),
        duration: 1800
      },
      {
        id: 'workload-2',
        name: 'Market Analysis ML',
        type: 'ml-inference',
        status: 'running',
        priority: 'medium',
        edgeNodeId: 'edge-seoul-1',
        createdAt: new Date(Date.now() - 3600000),
        startedAt: new Date(Date.now() - 3600000),
        duration: 3600
      }
    ];

    workloads.forEach(workload => {
      this.workloads.set(workload.id, workload);
    });
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateEdgeMetrics();
    }, 30000); // Every 30 seconds
  }

  private async updateEdgeMetrics(): Promise<void> {
    try {
      // Update edge node loads and health
      for (const node of this.edgeNodes.values()) {
        // Simulate load changes
        node.currentLoad.cpu = Math.random() * 80 + 20;
        node.currentLoad.memory = Math.random() * 70 + 30;
        node.currentLoad.storage = Math.random() * 60 + 40;
        node.currentLoad.network = Math.random() * 50 + 50;
        
        // Update health based on load
        const avgLoad = (node.currentLoad.cpu + node.currentLoad.memory) / 2;
        if (avgLoad > 80) {
          node.health = 'critical';
        } else if (avgLoad > 60) {
          node.health = 'degraded';
        } else {
          node.health = 'healthy';
        }
        
        // Update heartbeat
        node.lastHeartbeat = new Date();
        
        // Update service metrics
        for (const service of node.services) {
          service.metrics.requestsPerSecond = Math.random() * 100 + 50;
          service.metrics.responseTime = Math.random() * 50 + 10;
          service.metrics.errorRate = Math.random() * 2;
          service.metrics.throughput = Math.random() * 1000 + 500;
          service.lastUpdated = new Date();
        }
      }
      
      // Update IoT device data
      for (const device of this.iotDevices.values()) {
        device.lastData = new Date();
        
        // Simulate sensor data updates
        switch (device.type) {
          case 'sensor':
            if (device.name.includes('Temperature')) {
              device.data.temperature = Math.random() * 10 + 20;
              device.data.humidity = Math.random() * 20 + 40;
            } else if (device.name.includes('Energy')) {
              device.data.power = Math.random() * 2 + 1;
              device.data.voltage = Math.random() * 10 + 225;
            }
            break;
          case 'camera':
            device.data.motion = Math.random() > 0.8;
            device.data.recording = Math.random() > 0.3;
            break;
        }
        device.data.timestamp = new Date().toISOString();
      }
      
      // Update edge cache metrics
      for (const cache of this.edgeCaches.values()) {
        cache.used = Math.random() * cache.capacity;
        cache.hitRate = Math.random() * 100;
        cache.lastUpdated = new Date();
      }
      
      // Update workload statuses
      for (const workload of this.workloads.values()) {
        if (workload.status === 'running') {
          workload.duration = (workload.duration || 0) + 30;
          
          // Simulate workload completion
          if (workload.duration > 3600) {
            workload.status = 'completed';
            workload.completedAt = new Date();
            workload.result = { success: true, processed: Math.floor(Math.random() * 1000) + 100 };
          }
        }
      }
      
      // Track performance metrics
      performanceMonitor.trackCustomMetric('edge_nodes_healthy', 
        Array.from(this.edgeNodes.values()).filter(n => n.health === 'healthy').length
      );
      performanceMonitor.trackCustomMetric('iot_devices_online', 
        Array.from(this.iotDevices.values()).filter(d => d.status === 'online').length
      );
      performanceMonitor.trackCustomMetric('active_workloads', 
        Array.from(this.workloads.values()).filter(w => w.status === 'running').length
      );

    } catch (error) {
      errorHandler.handleError(error as Error, { context: 'EdgeComputingService.updateEdgeMetrics' });
    }
  }

  // Public API Methods
  getEdgeNodes(): EdgeNode[] {
    return Array.from(this.edgeNodes.values());
  }

  getEdgeNode(nodeId: string): EdgeNode | undefined {
    return this.edgeNodes.get(nodeId);
  }

  getIoTDevices(): IoTDevice[] {
    return Array.from(this.iotDevices.values());
  }

  getIoTDevice(deviceId: string): IoTDevice | undefined {
    return this.iotDevices.get(deviceId);
  }

  getWorkloads(): EdgeWorkload[] {
    return Array.from(this.workloads.values());
  }

  getEdgeCaches(): EdgeCache[] {
    return Array.from(this.edgeCaches.values());
  }

  async createWorkload(workloadData: Omit<EdgeWorkload, 'id' | 'createdAt' | 'status'>): Promise<EdgeWorkload> {
    try {
      const workload: EdgeWorkload = {
        ...workloadData,
        id: `workload-${Date.now()}`,
        createdAt: new Date(),
        status: 'pending'
      };

      this.workloads.set(workload.id, workload);
      console.log(`✅ Created edge workload: ${workload.name}`);
      
      return workload;
      
    } catch (error) {
      errorHandler.handleError(error as Error, { context: 'EdgeComputingService.createWorkload' });
      throw error;
    }
  }

  async startWorkload(workloadId: string): Promise<boolean> {
    try {
      const workload = this.workloads.get(workloadId);
      if (!workload) {
        throw new Error(`Workload ${workloadId} not found`);
      }

      if (workload.status !== 'pending') {
        throw new Error(`Workload ${workloadId} is not in pending status`);
      }

      workload.status = 'running';
      workload.startedAt = new Date();
      
      console.log(`🚀 Started edge workload: ${workload.name}`);
      return true;
      
    } catch (error) {
      errorHandler.handleError(error as Error, { context: 'EdgeComputingService.startWorkload' });
      return false;
    }
  }

  async addIoTDevice(deviceData: Omit<IoTDevice, 'id'>): Promise<IoTDevice> {
    try {
      const device: IoTDevice = {
        ...deviceData,
        id: `iot-${Date.now()}`
      };

      this.iotDevices.set(device.id, device);
      console.log(`✅ Added IoT device: ${device.name}`);
      
      return device;
      
    } catch (error) {
      errorHandler.handleError(error as Error, { context: 'EdgeComputingService.addIoTDevice' });
      throw error;
    }
  }

  getOptimalEdgeNode(userLocation: { latitude: number; longitude: number }): EdgeNode | null {
    let optimalNode: EdgeNode | null = null;
    let minDistance = Infinity;

    for (const node of this.edgeNodes.values()) {
      if (node.status !== 'online' || node.health === 'critical') continue;

      const distance = this.calculateDistance(userLocation, node.coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        optimalNode = node;
      }
    }

    return optimalNode;
  }

  private calculateDistance(point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  getEdgeComputingHealth(): { status: string; score: number; details: any } {
    const totalNodes = this.edgeNodes.size;
    const healthyNodes = Array.from(this.edgeNodes.values()).filter(n => n.health === 'healthy').length;
    const totalDevices = this.iotDevices.size;
    const onlineDevices = Array.from(this.iotDevices.values()).filter(d => d.status === 'online').length;
    const totalWorkloads = this.workloads.size;
    const activeWorkloads = Array.from(this.workloads.values()).filter(w => w.status === 'running').length;

    const nodeHealth = (healthyNodes / totalNodes) * 100;
    const deviceHealth = (onlineDevices / totalDevices) * 100;
    const workloadHealth = totalWorkloads > 0 ? (activeWorkloads / totalWorkloads) * 100 : 100;
    
    const overallScore = Math.round((nodeHealth + deviceHealth + workloadHealth) / 3);

    let status = 'healthy';
    if (overallScore < 50) status = 'critical';
    else if (overallScore < 80) status = 'degraded';

    return {
      status,
      score: overallScore,
      details: {
        nodes: { total: totalNodes, healthy: healthyNodes, health: nodeHealth },
        devices: { total: totalDevices, online: onlineDevices, health: deviceHealth },
        workloads: { total: totalWorkloads, active: activeWorkloads, health: workloadHealth },
        caches: this.edgeCaches.size
      }
    };
  }

  isSystemInitialized(): boolean {
    return this.isInitialized;
  }

  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

export const edgeComputingService = new EdgeComputingService();
export type { EdgeNode, EdgeService, IoTDevice, EdgeWorkload, EdgeCache };
export { EdgeComputingService };
export default edgeComputingService;
