import { auditLogger } from '../audit/auditLogger';
import crypto from 'crypto';

export interface DeploymentConfig {
  id: string;
  name: string;
  environment: 'development' | 'staging' | 'production';
  platform: 'vercel' | 'aws' | 'azure' | 'gcp' | 'docker';
  region: string;
  domain: string;
  ssl: boolean;
  cdn: boolean;
  monitoring: boolean;
  backup: boolean;
  autoScaling: boolean;
  healthChecks: boolean;
  environmentVariables: Record<string, string>;
  secrets: Record<string, string>;
  dependencies: string[];
  buildCommand: string;
  startCommand: string;
  port: number;
  memory: string;
  cpu: string;
  replicas: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deployment {
  id: string;
  configId: string;
  version: string;
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed' | 'rolled_back';
  environment: string;
  platform: string;
  region: string;
  domain: string;
  buildLogs: string[];
  deploymentLogs: string[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
  commitHash: string;
  branch: string;
  triggeredBy: string;
  rollbackVersion?: string;
  healthCheckUrl: string;
  metrics: DeploymentMetrics;
  createdAt: Date;
}

export interface DeploymentMetrics {
  buildTime: number;
  deploymentTime: number;
  totalTime: number;
  successRate: number;
  errorCount: number;
  warningCount: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
}

export interface HealthCheck {
  id: string;
  deploymentId: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  statusCode: number;
  lastChecked: Date;
  consecutiveFailures: number;
  error?: string;
}

export interface RollbackPlan {
  id: string;
  deploymentId: string;
  targetVersion: string;
  reason: string;
  steps: RollbackStep[];
  estimatedTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  approvalRequired: boolean;
  createdAt: Date;
}

export interface RollbackStep {
  id: string;
  description: string;
  command: string;
  order: number;
  critical: boolean;
  estimatedDuration: number;
}

export interface DeploymentPipeline {
  id: string;
  name: string;
  description: string;
  stages: PipelineStage[];
  triggers: PipelineTrigger[];
  notifications: NotificationConfig[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStage {
  id: string;
  name: string;
  type: 'build' | 'test' | 'deploy' | 'verify' | 'rollback';
  order: number;
  parallel: boolean;
  timeout: number;
  retries: number;
  commands: string[];
  conditions: string[];
  artifacts: string[];
  environment: Record<string, string>;
}

export interface PipelineTrigger {
  type: 'git_push' | 'git_tag' | 'schedule' | 'manual' | 'webhook';
  condition: string;
  branch?: string;
  tag?: string;
  schedule?: string;
  webhookUrl?: string;
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  recipients: string[];
  events: string[];
  template: string;
  enabled: boolean;
}

export class DeploymentManager {
  private static instance: DeploymentManager;
  private configs: Map<string, DeploymentConfig> = new Map();
  private deployments: Map<string, Deployment> = new Map();
  private healthChecks: Map<string, HealthCheck[]> = new Map();
  private rollbackPlans: Map<string, RollbackPlan> = new Map();
  private pipelines: Map<string, DeploymentPipeline> = new Map();

  private constructor() {
    this.initializeDefaultConfigs();
    this.startHealthMonitoring();
  }

  public static getInstance(): DeploymentManager {
    if (!DeploymentManager.instance) {
      DeploymentManager.instance = new DeploymentManager();
    }
    return DeploymentManager.instance;
  }

  // Deployment Configuration Management
  async createDeploymentConfig(config: Omit<DeploymentConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeploymentConfig> {
    const deploymentConfig: DeploymentConfig = {
      id: crypto.randomUUID(),
      ...config,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.configs.set(deploymentConfig.id, deploymentConfig);

    try {
      await auditLogger.logUserAction('deployment_config_created', {
        configId: deploymentConfig.id,
        name: deploymentConfig.name,
        environment: deploymentConfig.environment,
        platform: deploymentConfig.platform
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return deploymentConfig;
  }

  async updateDeploymentConfig(configId: string, updates: Partial<DeploymentConfig>): Promise<DeploymentConfig | null> {
    const config = this.configs.get(configId);
    if (!config) {
      return null;
    }

    const updatedConfig = {
      ...config,
      ...updates,
      updatedAt: new Date()
    };

    this.configs.set(configId, updatedConfig);

    try {
      await auditLogger.logUserAction('deployment_config_updated', {
        configId,
        updates: Object.keys(updates)
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return updatedConfig;
  }

  // Deployment Execution
  async deploy(configId: string, version: string, triggeredBy: string, commitHash: string, branch: string): Promise<Deployment> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error('Deployment configuration not found');
    }

    const deployment: Deployment = {
      id: crypto.randomUUID(),
      configId,
      version,
      status: 'pending',
      environment: config.environment,
      platform: config.platform,
      region: config.region,
      domain: config.domain,
      buildLogs: [],
      deploymentLogs: [],
      startTime: new Date(),
      commitHash,
      branch,
      triggeredBy,
      healthCheckUrl: `${config.domain}/health`,
      metrics: {
        buildTime: 0,
        deploymentTime: 0,
        totalTime: 0,
        successRate: 0,
        errorCount: 0,
        warningCount: 0,
        resourceUsage: {
          cpu: 0,
          memory: 0,
          disk: 0
        },
        performance: {
          responseTime: 0,
          throughput: 0,
          errorRate: 0
        }
      },
      createdAt: new Date()
    };

    this.deployments.set(deployment.id, deployment);

    try {
      await auditLogger.logUserAction('deployment_started', {
        deploymentId: deployment.id,
        configId,
        version,
        environment: config.environment,
        triggeredBy
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    // Start deployment process
    this.executeDeployment(deployment, config);

    return deployment;
  }

  // Pipeline Management
  async createPipeline(pipeline: Omit<DeploymentPipeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeploymentPipeline> {
    const deploymentPipeline: DeploymentPipeline = {
      id: crypto.randomUUID(),
      ...pipeline,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.pipelines.set(deploymentPipeline.id, deploymentPipeline);

    try {
      await auditLogger.logUserAction('deployment_pipeline_created', {
        pipelineId: deploymentPipeline.id,
        name: deploymentPipeline.name
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return deploymentPipeline;
  }

  async executePipeline(pipelineId: string, triggerData: any): Promise<Deployment | null> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline || !pipeline.enabled) {
      return null;
    }

    // Check if trigger conditions are met
    const trigger = pipeline.triggers.find(t => this.evaluateTrigger(t, triggerData));
    if (!trigger) {
      return null;
    }

    // Find deployment config for this pipeline
    const config = Array.from(this.configs.values()).find(c => c.environment === 'production');
    if (!config) {
      return null;
    }

    // Execute pipeline stages
    return this.executePipelineStages(pipeline, config, triggerData);
  }

  // Health Monitoring
  async performHealthCheck(deploymentId: string): Promise<HealthCheck> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    const startTime = Date.now();
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    let statusCode = 200;
    let error: string | undefined;

    try {
      // Simulate health check
      const response = await fetch(deployment.healthCheckUrl, {
        method: 'GET',
        timeout: 5000
      });

      statusCode = response.status;
      if (response.status >= 500) {
        status = 'unhealthy';
        error = `HTTP ${response.status}`;
      } else if (response.status >= 400) {
        status = 'degraded';
        error = `HTTP ${response.status}`;
      }
    } catch (err) {
      status = 'unhealthy';
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const responseTime = Date.now() - startTime;

    const healthCheck: HealthCheck = {
      id: crypto.randomUUID(),
      deploymentId,
      url: deployment.healthCheckUrl,
      status,
      responseTime,
      statusCode,
      lastChecked: new Date(),
      consecutiveFailures: status === 'healthy' ? 0 : 1,
      error
    };

    // Update deployment health checks
    const existingChecks = this.healthChecks.get(deploymentId) || [];
    existingChecks.push(healthCheck);
    
    // Keep only last 100 health checks
    if (existingChecks.length > 100) {
      existingChecks.splice(0, existingChecks.length - 100);
    }
    
    this.healthChecks.set(deploymentId, existingChecks);

    return healthCheck;
  }

  // Rollback Management
  async createRollbackPlan(deploymentId: string, reason: string): Promise<RollbackPlan> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    const rollbackPlan: RollbackPlan = {
      id: crypto.randomUUID(),
      deploymentId,
      targetVersion: this.getPreviousVersion(deployment),
      reason,
      steps: [
        {
          id: crypto.randomUUID(),
          description: 'Stop current deployment',
          command: 'kubectl scale deployment app --replicas=0',
          order: 1,
          critical: true,
          estimatedDuration: 30
        },
        {
          id: crypto.randomUUID(),
          description: 'Deploy previous version',
          command: `kubectl set image deployment/app app=image:${this.getPreviousVersion(deployment)}`,
          order: 2,
          critical: true,
          estimatedDuration: 120
        },
        {
          id: crypto.randomUUID(),
          description: 'Verify rollback',
          command: 'kubectl rollout status deployment/app',
          order: 3,
          critical: true,
          estimatedDuration: 60
        }
      ],
      estimatedTime: 210,
      riskLevel: 'medium',
      approvalRequired: true,
      createdAt: new Date()
    };

    this.rollbackPlans.set(rollbackPlan.id, rollbackPlan);

    try {
      await auditLogger.logUserAction('rollback_plan_created', {
        rollbackPlanId: rollbackPlan.id,
        deploymentId,
        reason
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return rollbackPlan;
  }

  async executeRollback(rollbackPlanId: string, approvedBy: string): Promise<boolean> {
    const rollbackPlan = this.rollbackPlans.get(rollbackPlanId);
    if (!rollbackPlan) {
      return false;
    }

    const deployment = this.deployments.get(rollbackPlan.deploymentId);
    if (!deployment) {
      return false;
    }

    try {
      // Execute rollback steps
      for (const step of rollbackPlan.steps.sort((a, b) => a.order - b.order)) {
        await this.executeRollbackStep(step, deployment);
      }

      // Update deployment status
      deployment.status = 'rolled_back';
      deployment.rollbackVersion = rollbackPlan.targetVersion;
      deployment.endTime = new Date();
      deployment.duration = deployment.endTime.getTime() - deployment.startTime.getTime();

      this.deployments.set(deployment.id, deployment);

      try {
        await auditLogger.logUserAction('rollback_executed', {
          rollbackPlanId,
          deploymentId: deployment.id,
          approvedBy
        });
      } catch (error) {
        console.debug('Audit logging skipped (development mode)');
      }

      return true;
    } catch (error) {
      console.error('Rollback execution failed:', error);
      return false;
    }
  }

  // Private Methods
  private async executeDeployment(deployment: Deployment, config: DeploymentConfig): Promise<void> {
    try {
      // Update status to building
      deployment.status = 'building';
      deployment.buildLogs.push('Starting build process...');
      this.deployments.set(deployment.id, deployment);

      // Simulate build process
      await this.simulateBuild(deployment);

      // Update status to deploying
      deployment.status = 'deploying';
      deployment.deploymentLogs.push('Starting deployment...');
      this.deployments.set(deployment.id, deployment);

      // Simulate deployment process
      await this.simulateDeployment(deployment, config);

      // Update status to success
      deployment.status = 'success';
      deployment.endTime = new Date();
      deployment.duration = deployment.endTime.getTime() - deployment.startTime.getTime();
      this.deployments.set(deployment.id, deployment);

      try {
        await auditLogger.logUserAction('deployment_completed', {
          deploymentId: deployment.id,
          status: 'success',
          duration: deployment.duration
        });
      } catch (error) {
        console.debug('Audit logging skipped (development mode)');
      }

    } catch (error) {
      // Update status to failed
      deployment.status = 'failed';
      deployment.endTime = new Date();
      deployment.duration = deployment.endTime.getTime() - deployment.startTime.getTime();
      deployment.deploymentLogs.push(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.deployments.set(deployment.id, deployment);

      try {
        await auditLogger.logUserAction('deployment_failed', {
          deploymentId: deployment.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (auditError) {
        console.debug('Audit logging skipped (development mode)');
      }
    }
  }

  private async simulateBuild(deployment: Deployment): Promise<void> {
    const buildSteps = [
      'Installing dependencies...',
      'Running tests...',
      'Building application...',
      'Optimizing assets...',
      'Creating deployment package...'
    ];

    for (const step of buildSteps) {
      deployment.buildLogs.push(step);
      this.deployments.set(deployment.id, deployment);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    deployment.metrics.buildTime = 5000; // 5 seconds
  }

  private async simulateDeployment(deployment: Deployment, config: DeploymentConfig): Promise<void> {
    const deploymentSteps = [
      'Uploading deployment package...',
      'Updating infrastructure...',
      'Deploying application...',
      'Running health checks...',
      'Deployment complete!'
    ];

    for (const step of deploymentSteps) {
      deployment.deploymentLogs.push(step);
      this.deployments.set(deployment.id, deployment);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    deployment.metrics.deploymentTime = 10000; // 10 seconds
    deployment.metrics.totalTime = deployment.metrics.buildTime + deployment.metrics.deploymentTime;
  }

  private evaluateTrigger(trigger: PipelineTrigger, triggerData: any): boolean {
    switch (trigger.type) {
      case 'git_push':
        return triggerData.type === 'push' && 
               (!trigger.branch || triggerData.branch === trigger.branch);
      case 'git_tag':
        return triggerData.type === 'tag' && 
               (!trigger.tag || triggerData.tag === trigger.tag);
      case 'manual':
        return triggerData.type === 'manual';
      case 'webhook':
        return triggerData.type === 'webhook' && 
               triggerData.url === trigger.webhookUrl;
      default:
        return false;
    }
  }

  private async executePipelineStages(pipeline: DeploymentPipeline, config: DeploymentConfig, triggerData: any): Promise<Deployment> {
    // Create deployment
    const deployment = await this.deploy(config.id, 'pipeline-' + Date.now(), 'pipeline', 'commit-hash', 'main');

    // Execute stages
    for (const stage of pipeline.stages.sort((a, b) => a.order - b.order)) {
      await this.executePipelineStage(stage, deployment);
    }

    return deployment;
  }

  private async executePipelineStage(stage: PipelineStage, deployment: Deployment): Promise<void> {
    deployment.deploymentLogs.push(`Executing stage: ${stage.name}`);
    this.deployments.set(deployment.id, deployment);

    // Simulate stage execution
    for (const command of stage.commands) {
      deployment.deploymentLogs.push(`Running: ${command}`);
      this.deployments.set(deployment.id, deployment);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async executeRollbackStep(step: RollbackStep, deployment: Deployment): Promise<void> {
    deployment.deploymentLogs.push(`Rollback step: ${step.description}`);
    this.deployments.set(deployment.id, deployment);

    // Simulate step execution
    await new Promise(resolve => setTimeout(resolve, step.estimatedDuration * 100));
  }

  private getPreviousVersion(deployment: Deployment): string {
    // In a real implementation, this would query the deployment history
    return 'v1.0.0';
  }

  private initializeDefaultConfigs(): void {
    // Initialize with default deployment configurations
    const defaultConfigs: DeploymentConfig[] = [
      {
        id: crypto.randomUUID(),
        name: 'Production',
        environment: 'production',
        platform: 'vercel',
        region: 'us-east-1',
        domain: 'https://bmv-finder.vercel.app',
        ssl: true,
        cdn: true,
        monitoring: true,
        backup: true,
        autoScaling: true,
        healthChecks: true,
        environmentVariables: {
          NODE_ENV: 'production',
          NEXT_PUBLIC_APP_URL: 'https://bmv-finder.vercel.app'
        },
        secrets: {},
        dependencies: ['node', 'npm'],
        buildCommand: 'npm run build',
        startCommand: 'npm start',
        port: 3000,
        memory: '1GB',
        cpu: '1',
        replicas: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        name: 'Staging',
        environment: 'staging',
        platform: 'vercel',
        region: 'us-east-1',
        domain: 'https://staging-bmv-finder.vercel.app',
        ssl: true,
        cdn: false,
        monitoring: true,
        backup: false,
        autoScaling: false,
        healthChecks: true,
        environmentVariables: {
          NODE_ENV: 'staging',
          NEXT_PUBLIC_APP_URL: 'https://staging-bmv-finder.vercel.app'
        },
        secrets: {},
        dependencies: ['node', 'npm'],
        buildCommand: 'npm run build',
        startCommand: 'npm start',
        port: 3000,
        memory: '512MB',
        cpu: '0.5',
        replicas: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultConfigs.forEach(config => {
      this.configs.set(config.id, config);
    });
  }

  private startHealthMonitoring(): void {
    // Perform health checks every 5 minutes
    setInterval(() => {
      this.performHealthChecks();
    }, 5 * 60 * 1000);
  }

  private async performHealthChecks(): Promise<void> {
    for (const deployment of this.deployments.values()) {
      if (deployment.status === 'success') {
        try {
          await this.performHealthCheck(deployment.id);
        } catch (error) {
          console.error(`Health check failed for deployment ${deployment.id}:`, error);
        }
      }
    }
  }

  // Public getters
  getDeploymentConfig(configId: string): DeploymentConfig | null {
    return this.configs.get(configId) || null;
  }

  getAllDeploymentConfigs(): DeploymentConfig[] {
    return Array.from(this.configs.values());
  }

  getDeployment(deploymentId: string): Deployment | null {
    return this.deployments.get(deploymentId) || null;
  }

  getAllDeployments(): Deployment[] {
    return Array.from(this.deployments.values());
  }

  getHealthChecks(deploymentId: string): HealthCheck[] {
    return this.healthChecks.get(deploymentId) || [];
  }

  getRollbackPlan(rollbackPlanId: string): RollbackPlan | null {
    return this.rollbackPlans.get(rollbackPlanId) || null;
  }

  getAllRollbackPlans(): RollbackPlan[] {
    return Array.from(this.rollbackPlans.values());
  }

  getPipeline(pipelineId: string): DeploymentPipeline | null {
    return this.pipelines.get(pipelineId) || null;
  }

  getAllPipelines(): DeploymentPipeline[] {
    return Array.from(this.pipelines.values());
  }

  getDeploymentStats(): {
    totalDeployments: number;
    successfulDeployments: number;
    failedDeployments: number;
    averageDeploymentTime: number;
    successRate: number;
    activeDeployments: number;
  } {
    const deployments = this.getAllDeployments();
    const totalDeployments = deployments.length;
    const successfulDeployments = deployments.filter(d => d.status === 'success').length;
    const failedDeployments = deployments.filter(d => d.status === 'failed').length;
    const activeDeployments = deployments.filter(d => ['pending', 'building', 'deploying'].includes(d.status)).length;
    
    const averageDeploymentTime = deployments.length > 0 
      ? deployments.reduce((sum, d) => sum + (d.duration || 0), 0) / deployments.length 
      : 0;

    const successRate = totalDeployments > 0 ? (successfulDeployments / totalDeployments) * 100 : 0;

    return {
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      averageDeploymentTime,
      successRate,
      activeDeployments
    };
  }
}

// Export singleton instance
export const deploymentManager = DeploymentManager.getInstance();
