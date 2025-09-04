import { auditLogger } from '../audit/auditLogger';

export interface DeploymentConfig {
  id: string;
  name: string;
  environment: 'development' | 'staging' | 'production';
  platform: 'vercel' | 'aws' | 'azure' | 'gcp' | 'docker' | 'kubernetes';
  region: string;
  domain: string;
  ssl: boolean;
  cdn: boolean;
  monitoring: boolean;
  backup: boolean;
  scaling: {
    minInstances: number;
    maxInstances: number;
    autoScale: boolean;
  };
  resources: {
    cpu: string;
    memory: string;
    storage: string;
  };
  environmentVariables: { [key: string]: string };
  secrets: string[];
  healthChecks: HealthCheck[];
  rollbackStrategy: RollbackStrategy;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheck {
  id: string;
  name: string;
  type: 'http' | 'tcp' | 'grpc' | 'custom';
  endpoint: string;
  interval: number;
  timeout: number;
  retries: number;
  expectedStatus?: number;
  expectedResponse?: string;
  enabled: boolean;
}

export interface RollbackStrategy {
  type: 'automatic' | 'manual' | 'blue-green' | 'canary';
  threshold: number;
  duration: number;
  healthCheckFailures: number;
  enabled: boolean;
}

export interface DeploymentStep {
  id: string;
  name: string;
  type: 'build' | 'test' | 'deploy' | 'verify' | 'rollback';
  command: string;
  timeout: number;
  retries: number;
  parallel: boolean;
  dependencies: string[];
  environment: 'build' | 'runtime';
  enabled: boolean;
}

export interface DeploymentPipeline {
  id: string;
  name: string;
  description: string;
  trigger: 'manual' | 'push' | 'schedule' | 'webhook';
  branch: string;
  steps: DeploymentStep[];
  notifications: NotificationConfig[];
  environment: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  recipients: string[];
  events: ('start' | 'success' | 'failure' | 'rollback')[];
  enabled: boolean;
}

export interface DeploymentHistory {
  id: string;
  pipelineId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled' | 'rollback';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  commitHash: string;
  commitMessage: string;
  triggeredBy: string;
  environment: string;
  steps: DeploymentStepResult[];
  logs: string[];
  artifacts: string[];
  rollbackReason?: string;
}

export interface DeploymentStepResult {
  stepId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  logs: string[];
  error?: string;
}

export interface InfrastructureTemplate {
  id: string;
  name: string;
  platform: string;
  description: string;
  template: string;
  variables: { [key: string]: any };
  version: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export class DeploymentManager {
  private static instance: DeploymentManager;
  private configs: Map<string, DeploymentConfig> = new Map();
  private pipelines: Map<string, DeploymentPipeline> = new Map();
  private history: Map<string, DeploymentHistory[]> = new Map();
  private templates: Map<string, InfrastructureTemplate> = new Map();

  public static getInstance(): DeploymentManager {
    if (!DeploymentManager.instance) {
      DeploymentManager.instance = new DeploymentManager();
    }
    return DeploymentManager.instance;
  }

  constructor() {
    this.initializeDefaultConfigurations();
    this.initializeDefaultPipelines();
    this.initializeDefaultTemplates();
  }

  private initializeDefaultConfigurations(): void {
    // Production Configuration
    const productionConfig: DeploymentConfig = {
      id: 'production-config',
      name: 'Production Environment',
      environment: 'production',
      platform: 'vercel',
      region: 'us-east-1',
      domain: 'bmv-finder.com',
      ssl: true,
      cdn: true,
      monitoring: true,
      backup: true,
      scaling: {
        minInstances: 2,
        maxInstances: 10,
        autoScale: true,
      },
      resources: {
        cpu: '2 vCPU',
        memory: '4GB',
        storage: '20GB',
      },
      environmentVariables: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: 'https://bmv-finder.com',
        DATABASE_URL: '${DATABASE_URL}',
        REDIS_URL: '${REDIS_URL}',
        ELASTICSEARCH_URL: '${ELASTICSEARCH_URL}',
        SUPABASE_URL: '${SUPABASE_URL}',
        SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
        JWT_SECRET: '${JWT_SECRET}',
        ENCRYPTION_KEY: '${ENCRYPTION_KEY}',
        GOOGLE_CLIENT_ID: '${GOOGLE_CLIENT_ID}',
        GOOGLE_CLIENT_SECRET: '${GOOGLE_CLIENT_SECRET}',
        STRIPE_PUBLIC_KEY: '${STRIPE_PUBLIC_KEY}',
        STRIPE_SECRET_KEY: '${STRIPE_SECRET_KEY}',
        STRIPE_WEBHOOK_SECRET: '${STRIPE_WEBHOOK_SECRET}',
        SENDGRID_API_KEY: '${SENDGRID_API_KEY}',
        TWILIO_ACCOUNT_SID: '${TWILIO_ACCOUNT_SID}',
        TWILIO_AUTH_TOKEN: '${TWILIO_AUTH_TOKEN}',
        AWS_ACCESS_KEY_ID: '${AWS_ACCESS_KEY_ID}',
        AWS_SECRET_ACCESS_KEY: '${AWS_SECRET_ACCESS_KEY}',
        AWS_REGION: 'us-east-1',
        AWS_S3_BUCKET: '${AWS_S3_BUCKET}',
        OPENAI_API_KEY: '${OPENAI_API_KEY}',
        RIGHTMOVE_API_KEY: '${RIGHTMOVE_API_KEY}',
        ZOOPLA_API_KEY: '${ZOOPLA_API_KEY}',
        LAND_REGISTRY_API_KEY: '${LAND_REGISTRY_API_KEY}',
      },
      secrets: [
        'DATABASE_URL',
        'REDIS_URL',
        'ELASTICSEARCH_URL',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'JWT_SECRET',
        'ENCRYPTION_KEY',
        'GOOGLE_CLIENT_SECRET',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'SENDGRID_API_KEY',
        'TWILIO_AUTH_TOKEN',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_S3_BUCKET',
        'OPENAI_API_KEY',
        'RIGHTMOVE_API_KEY',
        'ZOOPLA_API_KEY',
        'LAND_REGISTRY_API_KEY',
      ],
      healthChecks: [
        {
          id: 'main-health-check',
          name: 'Main Application Health Check',
          type: 'http',
          endpoint: '/api/health-check',
          interval: 30,
          timeout: 10,
          retries: 3,
          expectedStatus: 200,
          enabled: true,
        },
        {
          id: 'database-health-check',
          name: 'Database Health Check',
          type: 'http',
          endpoint: '/api/health/database',
          interval: 60,
          timeout: 15,
          retries: 2,
          expectedStatus: 200,
          enabled: true,
        },
        {
          id: 'elasticsearch-health-check',
          name: 'Elasticsearch Health Check',
          type: 'http',
          endpoint: '/api/health/elasticsearch',
          interval: 60,
          timeout: 15,
          retries: 2,
          expectedStatus: 200,
          enabled: true,
        },
      ],
      rollbackStrategy: {
        type: 'automatic',
        threshold: 5,
        duration: 300,
        healthCheckFailures: 3,
        enabled: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.configs.set(productionConfig.id, productionConfig);

    // Staging Configuration
    const stagingConfig: DeploymentConfig = {
      id: 'staging-config',
      name: 'Staging Environment',
      environment: 'staging',
      platform: 'vercel',
      region: 'us-east-1',
      domain: 'staging.bmv-finder.com',
      ssl: true,
      cdn: false,
      monitoring: true,
      backup: false,
      scaling: {
        minInstances: 1,
        maxInstances: 3,
        autoScale: false,
      },
      resources: {
        cpu: '1 vCPU',
        memory: '2GB',
        storage: '10GB',
      },
      environmentVariables: {
        NODE_ENV: 'staging',
        NEXT_PUBLIC_APP_URL: 'https://staging.bmv-finder.com',
        DATABASE_URL: '${STAGING_DATABASE_URL}',
        REDIS_URL: '${STAGING_REDIS_URL}',
        ELASTICSEARCH_URL: '${STAGING_ELASTICSEARCH_URL}',
        SUPABASE_URL: '${STAGING_SUPABASE_URL}',
        SUPABASE_ANON_KEY: '${STAGING_SUPABASE_ANON_KEY}',
        JWT_SECRET: '${STAGING_JWT_SECRET}',
        ENCRYPTION_KEY: '${STAGING_ENCRYPTION_KEY}',
        GOOGLE_CLIENT_ID: '${STAGING_GOOGLE_CLIENT_ID}',
        GOOGLE_CLIENT_SECRET: '${STAGING_GOOGLE_CLIENT_SECRET}',
        STRIPE_PUBLIC_KEY: '${STAGING_STRIPE_PUBLIC_KEY}',
        STRIPE_SECRET_KEY: '${STAGING_STRIPE_SECRET_KEY}',
        STRIPE_WEBHOOK_SECRET: '${STAGING_STRIPE_WEBHOOK_SECRET}',
      },
      secrets: [
        'STAGING_DATABASE_URL',
        'STAGING_REDIS_URL',
        'STAGING_ELASTICSEARCH_URL',
        'STAGING_SUPABASE_URL',
        'STAGING_SUPABASE_ANON_KEY',
        'STAGING_JWT_SECRET',
        'STAGING_ENCRYPTION_KEY',
        'STAGING_GOOGLE_CLIENT_SECRET',
        'STAGING_STRIPE_SECRET_KEY',
        'STAGING_STRIPE_WEBHOOK_SECRET',
      ],
      healthChecks: [
        {
          id: 'staging-health-check',
          name: 'Staging Health Check',
          type: 'http',
          endpoint: '/api/health-check',
          interval: 60,
          timeout: 15,
          retries: 2,
          expectedStatus: 200,
          enabled: true,
        },
      ],
      rollbackStrategy: {
        type: 'manual',
        threshold: 3,
        duration: 180,
        healthCheckFailures: 2,
        enabled: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.configs.set(stagingConfig.id, stagingConfig);
  }

  private initializeDefaultPipelines(): void {
    // Production Pipeline
    const productionPipeline: DeploymentPipeline = {
      id: 'production-pipeline',
      name: 'Production Deployment Pipeline',
      description: 'Automated deployment pipeline for production environment',
      trigger: 'push',
      branch: 'main',
      steps: [
        {
          id: 'build',
          name: 'Build Application',
          type: 'build',
          command: 'npm run build',
          timeout: 600,
          retries: 2,
          parallel: false,
          dependencies: [],
          environment: 'build',
          enabled: true,
        },
        {
          id: 'test',
          name: 'Run Tests',
          type: 'test',
          command: 'npm run test',
          timeout: 300,
          retries: 1,
          parallel: false,
          dependencies: ['build'],
          environment: 'build',
          enabled: true,
        },
        {
          id: 'security-scan',
          name: 'Security Scan',
          type: 'test',
          command: 'npm audit && npm run security-scan',
          timeout: 180,
          retries: 1,
          parallel: false,
          dependencies: ['build'],
          environment: 'build',
          enabled: true,
        },
        {
          id: 'deploy',
          name: 'Deploy to Production',
          type: 'deploy',
          command: 'vercel --prod',
          timeout: 900,
          retries: 2,
          parallel: false,
          dependencies: ['test', 'security-scan'],
          environment: 'runtime',
          enabled: true,
        },
        {
          id: 'verify',
          name: 'Verify Deployment',
          type: 'verify',
          command: 'npm run health-check',
          timeout: 120,
          retries: 3,
          parallel: false,
          dependencies: ['deploy'],
          environment: 'runtime',
          enabled: true,
        },
      ],
      notifications: [
        {
          type: 'slack',
          recipients: ['#deployments'],
          events: ['start', 'success', 'failure', 'rollback'],
          enabled: true,
        },
        {
          type: 'email',
          recipients: ['devops@bmv-finder.com'],
          events: ['failure', 'rollback'],
          enabled: true,
        },
      ],
      environment: 'production',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.pipelines.set(productionPipeline.id, productionPipeline);

    // Staging Pipeline
    const stagingPipeline: DeploymentPipeline = {
      id: 'staging-pipeline',
      name: 'Staging Deployment Pipeline',
      description: 'Automated deployment pipeline for staging environment',
      trigger: 'push',
      branch: 'develop',
      steps: [
        {
          id: 'build-staging',
          name: 'Build Staging Application',
          type: 'build',
          command: 'npm run build:staging',
          timeout: 600,
          retries: 2,
          parallel: false,
          dependencies: [],
          environment: 'build',
          enabled: true,
        },
        {
          id: 'test-staging',
          name: 'Run Staging Tests',
          type: 'test',
          command: 'npm run test:staging',
          timeout: 300,
          retries: 1,
          parallel: false,
          dependencies: ['build-staging'],
          environment: 'build',
          enabled: true,
        },
        {
          id: 'deploy-staging',
          name: 'Deploy to Staging',
          type: 'deploy',
          command: 'vercel --target staging',
          timeout: 600,
          retries: 2,
          parallel: false,
          dependencies: ['test-staging'],
          environment: 'runtime',
          enabled: true,
        },
        {
          id: 'verify-staging',
          name: 'Verify Staging Deployment',
          type: 'verify',
          command: 'npm run health-check:staging',
          timeout: 120,
          retries: 2,
          parallel: false,
          dependencies: ['deploy-staging'],
          environment: 'runtime',
          enabled: true,
        },
      ],
      notifications: [
        {
          type: 'slack',
          recipients: ['#staging-deployments'],
          events: ['start', 'success', 'failure'],
          enabled: true,
        },
      ],
      environment: 'staging',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.pipelines.set(stagingPipeline.id, stagingPipeline);
  }

  private initializeDefaultTemplates(): void {
    // Vercel Template
    const vercelTemplate: InfrastructureTemplate = {
      id: 'vercel-template',
      name: 'Vercel Deployment Template',
      platform: 'vercel',
      description: 'Template for deploying to Vercel platform',
      template: `{
  "version": 2,
  "name": "bmv-finder",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "framework": "nextjs"
}`,
      variables: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: 'https://bmv-finder.com',
        REGION: 'iad1',
        MAX_DURATION: 30,
      },
      version: '1.0.0',
      tags: ['vercel', 'nextjs', 'production'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(vercelTemplate.id, vercelTemplate);

    // Docker Template
    const dockerTemplate: InfrastructureTemplate = {
      id: 'docker-template',
      name: 'Docker Deployment Template',
      platform: 'docker',
      description: 'Template for containerized deployment',
      template: `FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \\
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \\
  elif [ -f package-lock.json ]; then npm ci; \\
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \\
  else echo "Lockfile not found." && exit 1; \\
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]`,
      variables: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      version: '1.0.0',
      tags: ['docker', 'container', 'production'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(dockerTemplate.id, dockerTemplate);
  }

  // Add deployment configuration
  public addConfig(config: DeploymentConfig): boolean {
    try {
      this.configs.set(config.id, config);

      auditLogger.logSystemEvent('deployment_config_created', {
        configId: config.id,
        name: config.name,
        environment: config.environment,
        platform: config.platform,
      });

      return true;
    } catch (error) {
      console.error('Error adding deployment configuration:', error);
      return false;
    }
  }

  // Get deployment configuration
  public getConfig(id: string): DeploymentConfig | null {
    return this.configs.get(id) || null;
  }

  // Get all deployment configurations
  public getAllConfigs(): DeploymentConfig[] {
    return Array.from(this.configs.values());
  }

  // Add deployment pipeline
  public addPipeline(pipeline: DeploymentPipeline): boolean {
    try {
      this.pipelines.set(pipeline.id, pipeline);

      auditLogger.logSystemEvent('deployment_pipeline_created', {
        pipelineId: pipeline.id,
        name: pipeline.name,
        environment: pipeline.environment,
        trigger: pipeline.trigger,
      });

      return true;
    } catch (error) {
      console.error('Error adding deployment pipeline:', error);
      return false;
    }
  }

  // Get deployment pipeline
  public getPipeline(id: string): DeploymentPipeline | null {
    return this.pipelines.get(id) || null;
  }

  // Get all deployment pipelines
  public getAllPipelines(): DeploymentPipeline[] {
    return Array.from(this.pipelines.values());
  }

  // Execute deployment pipeline
  public async executePipeline(pipelineId: string, triggeredBy: string, commitHash: string, commitMessage: string): Promise<DeploymentHistory | null> {
    try {
      const pipeline = this.pipelines.get(pipelineId);
      if (!pipeline || !pipeline.enabled) {
        return null;
      }

      const deployment: DeploymentHistory = {
        id: this.generateId(),
        pipelineId,
        status: 'pending',
        startedAt: new Date().toISOString(),
        commitHash,
        commitMessage,
        triggeredBy,
        environment: pipeline.environment,
        steps: [],
        logs: [],
        artifacts: [],
      };

      // Initialize step results
      pipeline.steps.forEach(step => {
        deployment.steps.push({
          stepId: step.id,
          status: 'pending',
          startedAt: '',
          logs: [],
        });
      });

      // Store deployment history
      if (!this.history.has(pipelineId)) {
        this.history.set(pipelineId, []);
      }
      this.history.get(pipelineId)!.push(deployment);

      // Execute pipeline steps
      deployment.status = 'running';
      deployment.startedAt = new Date().toISOString();

      for (const step of pipeline.steps) {
        if (!step.enabled) {
          continue;
        }

        const stepResult = deployment.steps.find(s => s.stepId === step.id);
        if (!stepResult) {
          continue;
        }

        stepResult.status = 'running';
        stepResult.startedAt = new Date().toISOString();

        try {
          // Simulate step execution
          await this.executeStep(step, stepResult);
          stepResult.status = 'success';
        } catch (error) {
          stepResult.status = 'failed';
          stepResult.error = error instanceof Error ? error.message : 'Unknown error';
          deployment.status = 'failed';
          break;
        }

        stepResult.completedAt = new Date().toISOString();
        stepResult.duration = new Date(stepResult.completedAt).getTime() - new Date(stepResult.startedAt).getTime();
      }

      if (deployment.status === 'running') {
        deployment.status = 'success';
      }

      deployment.completedAt = new Date().toISOString();
      deployment.duration = new Date(deployment.completedAt).getTime() - new Date(deployment.startedAt).getTime();

      // Send notifications
      await this.sendNotifications(pipeline, deployment);

      auditLogger.logSystemEvent('deployment_executed', {
        deploymentId: deployment.id,
        pipelineId,
        status: deployment.status,
        environment: deployment.environment,
        triggeredBy,
        duration: deployment.duration,
      });

      return deployment;
    } catch (error) {
      console.error('Error executing deployment pipeline:', error);
      return null;
    }
  }

  // Execute individual step
  private async executeStep(step: DeploymentStep, stepResult: DeploymentStepResult): Promise<void> {
    // Simulate step execution time
    const executionTime = Math.random() * 10000 + 2000; // 2-12 seconds
    await new Promise(resolve => setTimeout(resolve, executionTime));

    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error(`Step ${step.name} failed: Simulated error`);
    }

    // Add mock logs
    stepResult.logs.push(`Starting ${step.name}...`);
    stepResult.logs.push(`Executing command: ${step.command}`);
    stepResult.logs.push(`Step completed successfully`);
  }

  // Send notifications
  private async sendNotifications(pipeline: DeploymentPipeline, deployment: DeploymentHistory): Promise<void> {
    for (const notification of pipeline.notifications) {
      if (!notification.enabled) {
        continue;
      }

      const shouldNotify = notification.events.includes(deployment.status as any);
      if (!shouldNotify) {
        continue;
      }

      // Simulate notification sending
      console.log(`Sending ${notification.type} notification to ${notification.recipients.join(', ')}: Deployment ${deployment.status}`);
    }
  }

  // Get deployment history
  public getDeploymentHistory(pipelineId: string): DeploymentHistory[] {
    return this.history.get(pipelineId) || [];
  }

  // Get latest deployment
  public getLatestDeployment(pipelineId: string): DeploymentHistory | null {
    const history = this.getDeploymentHistory(pipelineId);
    return history.length > 0 ? history[history.length - 1] : null;
  }

  // Rollback deployment
  public async rollbackDeployment(pipelineId: string, deploymentId: string, reason: string): Promise<boolean> {
    try {
      const history = this.getDeploymentHistory(pipelineId);
      const deployment = history.find(d => d.id === deploymentId);
      
      if (!deployment) {
        return false;
      }

      deployment.status = 'rollback';
      deployment.rollbackReason = reason;

      auditLogger.logSystemEvent('deployment_rollback', {
        deploymentId,
        pipelineId,
        reason,
        environment: deployment.environment,
      });

      return true;
    } catch (error) {
      console.error('Error rolling back deployment:', error);
      return false;
    }
  }

  // Add infrastructure template
  public addTemplate(template: InfrastructureTemplate): boolean {
    try {
      this.templates.set(template.id, template);

      auditLogger.logSystemEvent('infrastructure_template_created', {
        templateId: template.id,
        name: template.name,
        platform: template.platform,
        version: template.version,
      });

      return true;
    } catch (error) {
      console.error('Error adding infrastructure template:', error);
      return false;
    }
  }

  // Get infrastructure template
  public getTemplate(id: string): InfrastructureTemplate | null {
    return this.templates.get(id) || null;
  }

  // Get all infrastructure templates
  public getAllTemplates(): InfrastructureTemplate[] {
    return Array.from(this.templates.values());
  }

  // Generate deployment guide
  public generateDeploymentGuide(configId: string): string {
    const config = this.configs.get(configId);
    if (!config) {
      return 'Configuration not found';
    }

    return `
# ${config.name} Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the BMV Finder application to the ${config.environment} environment.

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- ${config.platform} account and CLI tools
- Environment variables configured
- SSL certificate (if required)

## Environment Configuration

### Required Environment Variables
${Object.entries(config.environmentVariables).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

### Secrets Management
${config.secrets.map(secret => `- \`${secret}\`: [SECRET]`).join('\n')}

## Deployment Steps

### 1. Build Application
\`\`\`bash
npm run build
\`\`\`

### 2. Run Tests
\`\`\`bash
npm run test
\`\`\`

### 3. Deploy to ${config.platform}
\`\`\`bash
# For Vercel
vercel --prod

# For Docker
docker build -t bmv-finder .
docker run -p 3000:3000 bmv-finder

# For Kubernetes
kubectl apply -f k8s/
\`\`\`

### 4. Verify Deployment
\`\`\`bash
curl -f ${config.domain}/api/health-check
\`\`\`

## Health Checks
${config.healthChecks.map(check => `
### ${check.name}
- **Type**: ${check.type}
- **Endpoint**: ${check.endpoint}
- **Interval**: ${check.interval}s
- **Timeout**: ${check.timeout}s
- **Retries**: ${check.retries}
`).join('')}

## Monitoring
- **Platform**: ${config.platform}
- **Region**: ${config.region}
- **Domain**: ${config.domain}
- **SSL**: ${config.ssl ? 'Enabled' : 'Disabled'}
- **CDN**: ${config.cdn ? 'Enabled' : 'Disabled'}

## Scaling Configuration
- **Min Instances**: ${config.scaling.minInstances}
- **Max Instances**: ${config.scaling.maxInstances}
- **Auto Scale**: ${config.scaling.autoScale ? 'Enabled' : 'Disabled'}

## Resources
- **CPU**: ${config.resources.cpu}
- **Memory**: ${config.resources.memory}
- **Storage**: ${config.resources.storage}

## Rollback Strategy
- **Type**: ${config.rollbackStrategy.type}
- **Threshold**: ${config.rollbackStrategy.threshold}%
- **Duration**: ${config.rollbackStrategy.duration}s
- **Health Check Failures**: ${config.rollbackStrategy.healthCheckFailures}
- **Enabled**: ${config.rollbackStrategy.enabled ? 'Yes' : 'No'}

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version and dependencies
2. **Deployment Timeouts**: Increase timeout values in configuration
3. **Health Check Failures**: Verify endpoint accessibility and response format
4. **Environment Variables**: Ensure all required variables are set

### Logs and Monitoring
- Check application logs for errors
- Monitor health check endpoints
- Review deployment history for patterns
- Use monitoring dashboards for performance metrics

## Support
For deployment issues, contact the DevOps team or check the troubleshooting guide.
`;
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const deploymentManager = DeploymentManager.getInstance();
