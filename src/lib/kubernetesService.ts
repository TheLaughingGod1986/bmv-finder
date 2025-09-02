import { performanceMonitor } from './performanceMonitor';
import { errorHandler } from './errorHandler';
import { loadBalancer } from './loadBalancer';
import { monitoringSystem } from './monitoringSystem';

interface KubernetesPod {
  name: string;
  namespace: string;
  status: 'Running' | 'Pending' | 'Failed' | 'Succeeded' | 'Unknown';
  ready: boolean;
  restartCount: number;
  age: string;
  ip: string;
  node: string;
  resourceUsage: {
    cpu: string;
    memory: string;
    cpuLimit: string;
    memoryLimit: string;
  };
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

interface KubernetesService {
  name: string;
  namespace: string;
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName';
  clusterIP: string;
  externalIP?: string;
  ports: Array<{
    port: number;
    targetPort: number;
    protocol: string;
  }>;
  selector: Record<string, string>;
  endpoints: string[];
  age: string;
}

interface KubernetesDeployment {
  name: string;
  namespace: string;
  replicas: number;
  availableReplicas: number;
  updatedReplicas: number;
  readyReplicas: number;
  strategy: 'RollingUpdate' | 'Recreate';
  maxSurge: number;
  maxUnavailable: number;
  age: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

interface KubernetesConfigMap {
  name: string;
  namespace: string;
  data: Record<string, string>;
  age: string;
  labels: Record<string, string>;
}

interface KubernetesSecret {
  name: string;
  namespace: string;
  type: string;
  data: Record<string, string>;
  age: string;
  labels: Record<string, string>;
}

interface KubernetesNode {
  name: string;
  status: 'Ready' | 'NotReady' | 'Unknown';
  roles: string[];
  age: string;
  version: string;
  internalIP: string;
  externalIP?: string;
  capacity: {
    cpu: string;
    memory: string;
    pods: string;
  };
  allocatable: {
    cpu: string;
    memory: string;
    pods: string;
  };
  conditions: Array<{
    type: string;
    status: string;
    lastHeartbeatTime: string;
    lastTransitionTime: string;
    reason: string;
    message: string;
  }>;
}

interface KubernetesNamespace {
  name: string;
  status: string;
  age: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

interface KubernetesMetrics {
  pods: {
    total: number;
    running: number;
    pending: number;
    failed: number;
    succeeded: number;
    unknown: number;
  };
  services: {
    total: number;
    clusterIP: number;
    nodePort: number;
    loadBalancer: number;
    externalName: number;
  };
  deployments: {
    total: number;
    available: number;
    unavailable: number;
    updating: number;
  };
  nodes: {
    total: number;
    ready: number;
    notReady: number;
    unknown: number;
  };
  namespaces: number;
}

interface KubernetesConfig {
  enableAutoScaling: boolean;
  enableHealthChecks: boolean;
  enableResourceMonitoring: boolean;
  enableRollingUpdates: boolean;
  enableCanaryDeployments: boolean;
  enableBlueGreenDeployments: boolean;
  enableHorizontalPodAutoscaler: boolean;
  enableVerticalPodAutoscaler: boolean;
  enablePodDisruptionBudgets: boolean;
  enableNetworkPolicies: boolean;
  enableResourceQuotas: boolean;
  enableLimitRanges: boolean;
  enablePriorityClasses: boolean;
  enableTaintsAndTolerations: boolean;
  enableNodeAffinity: boolean;
  enablePodAffinity: boolean;
  enablePodAntiAffinity: boolean;
  enableTopologySpreadConstraints: boolean;
  enablePodSecurityPolicies: boolean;
  enablePodSecurityStandards: boolean;
}

class KubernetesService {
  private config: KubernetesConfig;
  private pods: Map<string, KubernetesPod> = new Map();
  private services: Map<string, KubernetesService> = new Map();
  private deployments: Map<string, KubernetesDeployment> = new Map();
  private configMaps: Map<string, KubernetesConfigMap> = new Map();
  private secrets: Map<string, KubernetesSecret> = new Map();
  private nodes: Map<string, KubernetesNode> = new Map();
  private namespaces: Map<string, KubernetesNamespace> = new Map();
  private monitoringInterval: NodeJS.Timeout;
  private isInitialized: boolean = false;

  constructor(config: Partial<KubernetesConfig> = {}) {
    this.config = {
      enableAutoScaling: config.enableAutoScaling ?? true,
      enableHealthChecks: config.enableHealthChecks ?? true,
      enableResourceMonitoring: config.enableResourceMonitoring ?? true,
      enableRollingUpdates: config.enableRollingUpdates ?? true,
      enableCanaryDeployments: config.enableCanaryDeployments ?? true,
      enableBlueGreenDeployments: config.enableBlueGreenDeployments ?? true,
      enableHorizontalPodAutoscaler: config.enableHorizontalPodAutoscaler ?? true,
      enableVerticalPodAutoscaler: config.enableVerticalPodAutoscaler ?? true,
      enablePodDisruptionBudgets: config.enablePodDisruptionBudgets ?? true,
      enableNetworkPolicies: config.enableNetworkPolicies ?? true,
      enableResourceQuotas: config.enableResourceQuotas ?? true,
      enableLimitRanges: config.enableLimitRanges ?? true,
      enablePriorityClasses: config.enablePriorityClasses ?? true,
      enableTaintsAndTolerations: config.enableTaintsAndTolerations ?? true,
      enableNodeAffinity: config.enableNodeAffinity ?? true,
      enablePodAffinity: config.enablePodAffinity ?? true,
      enablePodAntiAffinity: config.enablePodAntiAffinity ?? true,
      enableTopologySpreadConstraints: config.enableTopologySpreadConstraints ?? true,
      enablePodSecurityPolicies: config.enablePodSecurityPolicies ?? true,
      enablePodSecurityStandards: config.enablePodSecurityStandards ?? true
    };

    this.initializeKubernetesService();
  }

  // Initialize Kubernetes service
  private async initializeKubernetesService(): Promise<void> {
    try {
      // Initialize default namespace
      this.namespaces.set('default', {
        name: 'default',
        status: 'Active',
        age: '1d',
        labels: { 'kubernetes.io/metadata.name': 'default' },
        annotations: {}
      });

      // Initialize default nodes
      this.nodes.set('node-1', {
        name: 'node-1',
        status: 'Ready',
        roles: ['worker'],
        age: '1d',
        version: 'v1.28.0',
        internalIP: '192.168.1.100',
        externalIP: '203.0.113.100',
        capacity: { cpu: '8', memory: '32Gi', pods: '110' },
        allocatable: { cpu: '7', memory: '30Gi', pods: '100' },
        conditions: [
          {
            type: 'Ready',
            status: 'True',
            lastHeartbeatTime: new Date().toISOString(),
            lastTransitionTime: new Date().toISOString(),
            reason: 'KubeletReady',
            message: 'kubelet is posting ready status'
          }
        ]
      });

      this.nodes.set('node-2', {
        name: 'node-2',
        status: 'Ready',
        roles: ['worker'],
        age: '1d',
        version: 'v1.28.0',
        internalIP: '192.168.1.101',
        externalIP: '203.0.113.101',
        capacity: { cpu: '8', memory: '32Gi', pods: '110' },
        allocatable: { cpu: '7', memory: '30Gi', pods: '100' },
        conditions: [
          {
            type: 'Ready',
            status: 'True',
            lastHeartbeatTime: new Date().toISOString(),
            lastTransitionTime: new Date().toISOString(),
            reason: 'KubeletReady',
            message: 'kubelet is posting ready status'
          }
        ]
      });

      // Initialize default deployments
      this.deployments.set('bmv-finder-api', {
        name: 'bmv-finder-api',
        namespace: 'default',
        replicas: 3,
        availableReplicas: 3,
        updatedReplicas: 3,
        readyReplicas: 3,
        strategy: 'RollingUpdate',
        maxSurge: 1,
        maxUnavailable: 0,
        age: '1d',
        labels: { app: 'bmv-finder-api', tier: 'backend' },
        annotations: {}
      });

      this.deployments.set('bmv-finder-frontend', {
        name: 'bmv-finder-frontend',
        namespace: 'default',
        replicas: 2,
        availableReplicas: 2,
        updatedReplicas: 2,
        readyReplicas: 2,
        strategy: 'RollingUpdate',
        maxSurge: 1,
        maxUnavailable: 0,
        age: '1d',
        labels: { app: 'bmv-finder-frontend', tier: 'frontend' },
        annotations: {}
      });

      // Initialize default services
      this.services.set('bmv-finder-api-service', {
        name: 'bmv-finder-api-service',
        namespace: 'default',
        type: 'ClusterIP',
        clusterIP: '10.96.0.10',
        ports: [{ port: 3000, targetPort: 3000, protocol: 'TCP' }],
        selector: { app: 'bmv-finder-api' },
        endpoints: ['10.244.0.10:3000', '10.244.0.11:3000', '10.244.0.12:3000'],
        age: '1d'
      });

      this.services.set('bmv-finder-frontend-service', {
        name: 'bmv-finder-frontend-service',
        namespace: 'default',
        type: 'LoadBalancer',
        clusterIP: '10.96.0.11',
        externalIP: '203.0.113.200',
        ports: [{ port: 80, targetPort: 3000, protocol: 'TCP' }],
        selector: { app: 'bmv-finder-frontend' },
        endpoints: ['10.244.0.20:3000', '10.244.0.21:3000'],
        age: '1d'
      });

      // Initialize default pods
      this.pods.set('bmv-finder-api-1', {
        name: 'bmv-finder-api-1',
        namespace: 'default',
        status: 'Running',
        ready: true,
        restartCount: 0,
        age: '1d',
        ip: '10.244.0.10',
        node: 'node-1',
        resourceUsage: {
          cpu: '150m',
          memory: '512Mi',
          cpuLimit: '500m',
          memoryLimit: '1Gi'
        },
        labels: { app: 'bmv-finder-api', tier: 'backend', pod: 'bmv-finder-api-1' },
        annotations: {}
      });

      this.pods.set('bmv-finder-api-2', {
        name: 'bmv-finder-api-2',
        namespace: 'default',
        status: 'Running',
        ready: true,
        restartCount: 0,
        age: '1d',
        ip: '10.244.0.11',
        node: 'node-1',
        resourceUsage: {
          cpu: '120m',
          memory: '480Mi',
          cpuLimit: '500m',
          memoryLimit: '1Gi'
        },
        labels: { app: 'bmv-finder-api', tier: 'backend', pod: 'bmv-finder-api-2' },
        annotations: {}
      });

      this.pods.set('bmv-finder-api-3', {
        name: 'bmv-finder-api-3',
        namespace: 'default',
        status: 'Running',
        ready: true,
        restartCount: 0,
        age: '1d',
        ip: '10.244.0.12',
        node: 'node-2',
        resourceUsage: {
          cpu: '180m',
          memory: '520Mi',
          cpuLimit: '500m',
          memoryLimit: '1Gi'
        },
        labels: { app: 'bmv-finder-api', tier: 'backend', pod: 'bmv-finder-api-3' },
        annotations: {}
      });

      this.pods.set('bmv-finder-frontend-1', {
        name: 'bmv-finder-frontend-1',
        namespace: 'default',
        status: 'Running',
        ready: true,
        restartCount: 0,
        age: '1d',
        ip: '10.244.0.20',
        node: 'node-1',
        resourceUsage: {
          cpu: '80m',
          memory: '256Mi',
          cpuLimit: '200m',
          memoryLimit: '512Mi'
        },
        labels: { app: 'bmv-finder-frontend', tier: 'frontend', pod: 'bmv-finder-frontend-1' },
        annotations: {}
      });

      this.pods.set('bmv-finder-frontend-2', {
        name: 'bmv-finder-frontend-2',
        namespace: 'default',
        status: 'Running',
        ready: true,
        restartCount: 0,
        age: '1d',
        ip: '10.244.0.21',
        node: 'node-2',
        resourceUsage: {
          cpu: '90m',
          memory: '280Mi',
          cpuLimit: '200m',
          memoryLimit: '512Mi'
        },
        labels: { app: 'bmv-finder-frontend', tier: 'frontend', pod: 'bmv-finder-frontend-2' },
        annotations: {}
      });

      // Initialize config maps
      this.configMaps.set('bmv-finder-config', {
        name: 'bmv-finder-config',
        namespace: 'default',
        data: {
          'NODE_ENV': 'production',
          'DATABASE_URL': 'postgresql://user:pass@db:5432/bmv_finder',
          'REDIS_URL': 'redis://redis:6379',
          'ELASTICSEARCH_URL': 'http://elasticsearch:9200'
        },
        age: '1d',
        labels: { app: 'bmv-finder' },
        annotations: {}
      });

      // Initialize secrets
      this.secrets.set('bmv-finder-secrets', {
        name: 'bmv-finder-secrets',
        namespace: 'default',
        type: 'Opaque',
        data: {
          'JWT_SECRET': 'base64encodedsecret',
          'STRIPE_SECRET_KEY': 'base64encodedstripekey',
          'DATABASE_PASSWORD': 'base64encodeddbpass'
        },
        age: '1d',
        labels: { app: 'bmv-finder' },
        annotations: {}
      });

      // Start monitoring
      if (this.config.enableResourceMonitoring) {
        this.startResourceMonitoring();
      }

      this.isInitialized = true;
      console.log('✅ Kubernetes service initialized with', this.pods.size, 'pods and', this.deployments.size, 'deployments');
      
      performanceMonitor.trackMetric('kubernetes_service_init', 1, 'status', { 
        status: 'success', 
        pods: this.pods.size,
        deployments: this.deployments.size,
        services: this.services.size,
        nodes: this.nodes.size
      });
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'kubernetes_service_init',
        method: 'INIT',
        metadata: {}
      });
      this.isInitialized = false;
    }
  }

  // Start resource monitoring
  private startResourceMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.updateResourceUsage();
    }, 30000); // Every 30 seconds
  }

  // Update resource usage for pods
  private async updateResourceUsage(): Promise<void> {
    try {
      for (const pod of this.pods.values()) {
        // Simulate resource usage changes
        const cpuUsage = Math.floor(Math.random() * 200) + 50; // 50-250m
        const memoryUsage = Math.floor(Math.random() * 300) + 200; // 200-500Mi

        pod.resourceUsage.cpu = `${cpuUsage}m`;
        pod.resourceUsage.memory = `${memoryUsage}Mi`;

        // Update pod status based on resource usage
        if (cpuUsage > 400 || memoryUsage > 800) {
          pod.status = 'Pending';
          pod.ready = false;
        } else {
          pod.status = 'Running';
          pod.ready = true;
        }
      }

      // Update deployment status
      for (const deployment of this.deployments.values()) {
        const deploymentPods = Array.from(this.pods.values()).filter(
          pod => pod.labels.app === deployment.labels.app
        );

        deployment.availableReplicas = deploymentPods.filter(pod => pod.ready).length;
        deployment.readyReplicas = deploymentPods.filter(pod => pod.ready).length;
        deployment.updatedReplicas = deploymentPods.length;
      }
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'kubernetes_resource_monitoring',
        method: 'RESOURCE_MONITORING',
        metadata: {}
      });
    }
  }

  // Get all pods
  getPods(): KubernetesPod[] {
    return Array.from(this.pods.values());
  }

  // Get pods by namespace
  getPodsByNamespace(namespace: string): KubernetesPod[] {
    return Array.from(this.pods.values()).filter(pod => pod.namespace === namespace);
  }

  // Get pods by label selector
  getPodsByLabelSelector(selector: Record<string, string>): KubernetesPod[] {
    return Array.from(this.pods.values()).filter(pod => {
      return Object.entries(selector).every(([key, value]) => 
        pod.labels[key] === value
      );
    });
  }

  // Get all services
  getServices(): KubernetesService[] {
    return Array.from(this.services.values());
  }

  // Get services by namespace
  getServicesByNamespace(namespace: string): KubernetesService[] {
    return Array.from(this.services.values()).filter(service => service.namespace === namespace);
  }

  // Get all deployments
  getDeployments(): KubernetesDeployment[] {
    return Array.from(this.deployments.values());
  }

  // Get deployments by namespace
  getDeploymentsByNamespace(namespace: string): KubernetesDeployment[] {
    return Array.from(this.deployments.values()).filter(deployment => deployment.namespace === namespace);
  }

  // Get all nodes
  getNodes(): KubernetesNode[] {
    return Array.from(this.nodes.values());
  }

  // Get all namespaces
  getNamespaces(): KubernetesNamespace[] {
    return Array.from(this.namespaces.values());
  }

  // Get all config maps
  getConfigMaps(): KubernetesConfigMap[] {
    return Array.from(this.configMaps.values());
  }

  // Get all secrets
  getSecrets(): KubernetesSecret[] {
    return Array.from(this.secrets.values());
  }

  // Get pod by name
  getPod(podName: string): KubernetesPod | undefined {
    return this.pods.get(podName);
  }

  // Get service by name
  getService(serviceName: string): KubernetesService | undefined {
    return this.services.get(serviceName);
  }

  // Get deployment by name
  getDeployment(deploymentName: string): KubernetesDeployment | undefined {
    return this.deployments.get(deploymentName);
  }

  // Get node by name
  getNode(nodeName: string): KubernetesNode | undefined {
    return this.nodes.get(nodeName);
  }

  // Get namespace by name
  getNamespace(namespaceName: string): KubernetesNamespace | undefined {
    return this.namespaces.get(namespaceName);
  }

  // Get config map by name
  getConfigMap(configMapName: string): KubernetesConfigMap | undefined {
    return this.configMaps.get(configMapName);
  }

  // Get secret by name
  getSecret(secretName: string): KubernetesSecret | undefined {
    return this.configMaps.get(secretName);
  }

  // Scale deployment
  scaleDeployment(deploymentName: string, replicas: number): boolean {
    const deployment = this.deployments.get(deploymentName);
    if (deployment) {
      deployment.replicas = replicas;
      
      // Simulate scaling by updating pod count
      if (replicas > deployment.availableReplicas) {
        // Scale up
        for (let i = deployment.availableReplicas; i < replicas; i++) {
          const newPodName = `${deploymentName}-${i + 1}`;
          const newNode = i % 2 === 0 ? 'node-1' : 'node-2';
          const newPodIP = `10.244.0.${20 + i}`;
          
          this.pods.set(newPodName, {
            name: newPodName,
            namespace: deployment.namespace,
            status: 'Running',
            ready: true,
            restartCount: 0,
            age: '0s',
            ip: newPodIP,
            node: newNode,
            resourceUsage: {
              cpu: '100m',
              memory: '400Mi',
              cpuLimit: deployment.labels.tier === 'backend' ? '500m' : '200m',
              memoryLimit: deployment.labels.tier === 'backend' ? '1Gi' : '512Mi'
            },
            labels: { ...deployment.labels, pod: newPodName },
            annotations: {}
          });
        }
      } else if (replicas < deployment.availableReplicas) {
        // Scale down
        const podsToRemove = Array.from(this.pods.values())
          .filter(pod => pod.labels.app === deployment.labels.app)
          .slice(replicas);
        
        for (const pod of podsToRemove) {
          this.pods.delete(pod.name);
        }
      }

      deployment.availableReplicas = replicas;
      deployment.readyReplicas = replicas;
      deployment.updatedReplicas = replicas;

      console.log(`📈 Scaled deployment ${deploymentName} to ${replicas} replicas`);
      
      performanceMonitor.trackMetric('kubernetes_deployment_scaled', 1, 'count', {
        deploymentName,
        replicas,
        action: replicas > deployment.availableReplicas ? 'scale_up' : 'scale_down'
      });

      return true;
    }
    return false;
  }

  // Rolling update deployment
  async rollingUpdateDeployment(deploymentName: string, imageTag: string): Promise<boolean> {
    const deployment = this.deployments.get(deploymentName);
    if (!deployment || !this.config.enableRollingUpdates) {
      return false;
    }

    try {
      console.log(`🔄 Starting rolling update for deployment ${deploymentName} to image tag ${imageTag}`);
      
      // Simulate rolling update
      const totalPods = deployment.replicas;
      const maxUnavailable = deployment.maxUnavailable;
      const maxSurge = deployment.maxSurge;
      
      let updatedPods = 0;
      let unavailablePods = 0;
      
      while (updatedPods < totalPods) {
        // Calculate how many pods can be updated
        const canUpdate = Math.min(
          maxSurge,
          totalPods - updatedPods + unavailablePods
        );
        
        if (canUpdate > 0) {
          // Update pods
          const podsToUpdate = Array.from(this.pods.values())
            .filter(pod => pod.labels.app === deployment.labels.app)
            .slice(updatedPods, updatedPods + canUpdate);
          
          for (const pod of podsToUpdate) {
            // Simulate pod update
            pod.status = 'Pending';
            pod.ready = false;
            pod.restartCount++;
            
            // Simulate update delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            pod.status = 'Running';
            pod.ready = true;
            pod.age = '0s';
            updatedPods++;
          }
        }
        
        // Wait for pods to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      deployment.updatedReplicas = totalPods;
      deployment.readyReplicas = totalPods;
      deployment.availableReplicas = totalPods;
      
      console.log(`✅ Rolling update completed for deployment ${deploymentName}`);
      
      performanceMonitor.trackMetric('kubernetes_rolling_update', 1, 'status', {
        deploymentName,
        imageTag,
        status: 'completed'
      });
      
      return true;
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'kubernetes_rolling_update',
        method: 'ROLLING_UPDATE',
        metadata: { deploymentName, imageTag }
      });
      return false;
    }
  }

  // Get Kubernetes metrics
  getMetrics(): KubernetesMetrics {
    const pods = Array.from(this.pods.values());
    const services = Array.from(this.services.values());
    const deployments = Array.from(this.deployments.values());
    const nodes = Array.from(this.nodes.values());

    return {
      pods: {
        total: pods.length,
        running: pods.filter(pod => pod.status === 'Running').length,
        pending: pods.filter(pod => pod.status === 'Pending').length,
        failed: pods.filter(pod => pod.status === 'Failed').length,
        succeeded: pods.filter(pod => pod.status === 'Succeeded').length,
        unknown: pods.filter(pod => pod.status === 'Unknown').length
      },
      services: {
        total: services.length,
        clusterIP: services.filter(service => service.type === 'ClusterIP').length,
        nodePort: services.filter(service => service.type === 'NodePort').length,
        loadBalancer: services.filter(service => service.type === 'LoadBalancer').length,
        externalName: services.filter(service => service.type === 'ExternalName').length
      },
      deployments: {
        total: deployments.length,
        available: deployments.reduce((sum, deployment) => sum + deployment.availableReplicas, 0),
        unavailable: deployments.reduce((sum, deployment) => sum + (deployment.replicas - deployment.availableReplicas), 0),
        updating: deployments.reduce((sum, deployment) => sum + (deployment.replicas - deployment.updatedReplicas), 0)
      },
      nodes: {
        total: nodes.length,
        ready: nodes.filter(node => node.status === 'Ready').length,
        notReady: nodes.filter(node => node.status === 'NotReady').length,
        unknown: nodes.filter(node => node.status === 'Unknown').length
      },
      namespaces: this.namespaces.size
    };
  }

  // Get comprehensive Kubernetes status
  getStatus(): {
    metrics: KubernetesMetrics;
    health: 'excellent' | 'good' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check pod health
    if (metrics.pods.failed > 0) {
      issues.push(`🚨 ${metrics.pods.failed} pods are in failed state`);
      recommendations.push('🔍 Investigate failed pods and check logs for errors');
    }

    if (metrics.pods.pending > metrics.pods.total * 0.2) {
      issues.push(`⚠️ High number of pending pods: ${metrics.pods.pending}`);
      recommendations.push('📊 Check resource availability and node capacity');
    }

    // Check deployment health
    if (metrics.deployments.unavailable > 0) {
      issues.push(`⚠️ ${metrics.deployments.unavailable} deployment replicas are unavailable`);
      recommendations.push('🔄 Review deployment configuration and resource limits');
    }

    // Check node health
    if (metrics.nodes.notReady > 0) {
      issues.push(`🚨 ${metrics.nodes.notReady} nodes are not ready`);
      recommendations.push('🖥️ Check node health and network connectivity');
    }

    // Calculate overall health
    let health: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
    
    if (metrics.pods.failed > 0 || metrics.nodes.notReady > 0) {
      health = 'critical';
    } else if (metrics.pods.pending > metrics.pods.total * 0.1 || metrics.deployments.unavailable > 0) {
      health = 'warning';
    } else if (metrics.pods.pending > 0) {
      health = 'good';
    }

    return {
      metrics,
      health,
      issues,
      recommendations
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<KubernetesConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring if needed
    if (newConfig.enableResourceMonitoring !== undefined) {
      if (newConfig.enableResourceMonitoring && !this.monitoringInterval) {
        this.startResourceMonitoring();
      } else if (!newConfig.enableResourceMonitoring && this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }
    }
  }

  // Get current configuration
  getConfig(): KubernetesConfig {
    return { ...this.config };
  }

  // Check if system is initialized
  isSystemInitialized(): boolean {
    return this.isInitialized;
  }

  // Cleanup resources
  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

// Create singleton instance
export const kubernetesService = new KubernetesService();

// Export types and utilities
export type { 
  KubernetesPod, 
  KubernetesService, 
  KubernetesDeployment, 
  KubernetesConfigMap, 
  KubernetesSecret, 
  KubernetesNode, 
  KubernetesNamespace, 
  KubernetesMetrics, 
  KubernetesConfig 
};
export { KubernetesService };

export default kubernetesService;
