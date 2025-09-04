export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'API' | 'WEBHOOK' | 'FILE_SYNC';
  provider: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  configuration: {
    baseUrl?: string;
    apiKey?: string;
    rateLimit?: number;
    timeout?: number;
  };
  authentication: {
    type: 'API_KEY' | 'OAUTH2' | 'BASIC';
    credentials: Record<string, any>;
  };
  endpoints: IntegrationEndpoint[];
  createdAt: string;
}

export interface IntegrationEndpoint {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  parameters: {
    required: string[];
    optional: string[];
  };
}

export interface IntegrationExecution {
  id: string;
  integrationId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
}

export class IntegrationManager {
  private static instance: IntegrationManager;
  private integrations: Map<string, IntegrationConfig> = new Map();
  private executions: Map<string, IntegrationExecution[]> = new Map();

  public static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  constructor() {
    this.initializeDefaultIntegrations();
  }

  private initializeDefaultIntegrations(): void {
    this.addIntegration({
      id: 'rightmove-api',
      name: 'Rightmove Property Data',
      type: 'API',
      provider: 'Rightmove',
      status: 'INACTIVE',
      configuration: {
        baseUrl: 'https://api.rightmove.co.uk',
        rateLimit: 100,
        timeout: 30000,
      },
      authentication: {
        type: 'API_KEY',
        credentials: {},
      },
      endpoints: [
        {
          id: 'search-properties',
          name: 'Search Properties',
          path: '/properties/search',
          method: 'GET',
          description: 'Search for properties on Rightmove',
          parameters: {
            required: ['location', 'radius'],
            optional: ['minPrice', 'maxPrice'],
          },
        },
      ],
      createdAt: new Date().toISOString(),
    });
  }

  public addIntegration(config: IntegrationConfig): boolean {
    try {
      this.integrations.set(config.id, config);
      return true;
    } catch (error) {
      console.error('Error adding integration:', error);
      return false;
    }
  }

  public getIntegration(id: string): IntegrationConfig | null {
    return this.integrations.get(id) || null;
  }

  public getAllIntegrations(): IntegrationConfig[] {
    return Array.from(this.integrations.values());
  }

  public getActiveIntegrations(): IntegrationConfig[] {
    return Array.from(this.integrations.values()).filter(integration => integration.status === 'ACTIVE');
  }

  public async executeIntegration(id: string, parameters?: Record<string, any>): Promise<IntegrationExecution | null> {
    try {
      const integration = this.integrations.get(id);
      if (!integration || integration.status !== 'ACTIVE') {
        return null;
      }

      const execution: IntegrationExecution = {
        id: this.generateId(),
        integrationId: id,
        status: 'PENDING',
        startTime: new Date().toISOString(),
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
      };

      if (!this.executions.has(id)) {
        this.executions.set(id, []);
      }
      this.executions.get(id)!.push(execution);

      execution.status = 'RUNNING';

      // Mock execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      execution.status = 'SUCCESS';
      execution.endTime = new Date().toISOString();
      execution.recordsProcessed = 100;
      execution.recordsSuccessful = 95;
      execution.recordsFailed = 5;

      return execution;
    } catch (error) {
      console.error('Error executing integration:', error);
      return null;
    }
  }

  public getIntegrationExecutions(id: string, limit: number = 50): IntegrationExecution[] {
    const executions = this.executions.get(id) || [];
    return executions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export const integrationManager = IntegrationManager.getInstance();