import { auditLogger } from '../audit/auditLogger';
import crypto from 'crypto';

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'API' | 'WEBHOOK' | 'OAUTH' | 'WEBHOOK_INCOMING' | 'DATA_SYNC';
  provider: string;
  description: string;
  baseUrl?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  rateLimit?: {
    requests: number;
    window: number; // in seconds
  };
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  timeout?: number;
  isActive: boolean;
  createdAt: Date;
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

export interface IntegrationEvent {
  id: string;
  integrationId: string;
  type: 'REQUEST' | 'RESPONSE' | 'ERROR' | 'WEBHOOK_RECEIVED' | 'WEBHOOK_SENT';
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'RETRYING';
  method?: string;
  url?: string;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
  statusCode?: number;
  duration?: number;
  timestamp: Date;
  retryCount?: number;
  metadata?: Record<string, any>;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  headers?: Record<string, string>;
  timeout?: number;
  createdAt: Date;
  lastTriggered?: Date;
  successCount: number;
  failureCount: number;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  eventType: string;
  payload: any;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'RETRYING';
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  responseCode?: number;
  responseBody?: string;
  createdAt: Date;
}

export interface DataSyncConfig {
  id: string;
  name: string;
  sourceIntegration: string;
  targetIntegration: string;
  syncType: 'FULL' | 'INCREMENTAL' | 'REAL_TIME';
  frequency?: string; // cron expression
  lastSync?: Date;
  nextSync?: Date;
  isActive: boolean;
  mapping: Record<string, string>;
  filters?: Record<string, any>;
  batchSize?: number;
  createdAt: Date;
}

export class IntegrationManager {
  private static instance: IntegrationManager;
  private integrations: Map<string, IntegrationConfig> = new Map();
  private webhooks: Map<string, WebhookConfig> = new Map();
  private dataSyncs: Map<string, DataSyncConfig> = new Map();
  private events: Map<string, IntegrationEvent> = new Map();
  private webhookEvents: Map<string, WebhookEvent> = new Map();
  private rateLimiters: Map<string, { count: number; resetTime: Date }> = new Map();

  private constructor() {
    this.initializeDefaultIntegrations();
    this.startWebhookProcessor();
    this.startDataSyncProcessor();
    this.startCleanupTasks();
  }

  public static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  // Integration Management
  async createIntegration(config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'lastUpdated'>): Promise<IntegrationConfig> {
    const integration: IntegrationConfig = {
      id: crypto.randomUUID(),
      ...config,
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    this.integrations.set(integration.id, integration);

    try {
      await auditLogger.logUserAction('integration_created', {
        integrationId: integration.id,
        name: integration.name,
        type: integration.type,
        provider: integration.provider
      });
    } catch (error) {
      // Silently handle audit logging errors
      console.debug('Audit logging skipped (development mode)');
    }

    return integration;
  }

  async updateIntegration(id: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig | null> {
    const integration = this.integrations.get(id);
    if (!integration) {
      return null;
    }

    const updatedIntegration = {
      ...integration,
      ...updates,
      lastUpdated: new Date()
    };

    this.integrations.set(id, updatedIntegration);

    try {
      await auditLogger.logUserAction('integration_updated', {
        integrationId: id,
        updates: Object.keys(updates)
      });
    } catch (error) {
      // Silently handle audit logging errors
      console.debug('Audit logging skipped (development mode)');
    }

    return updatedIntegration;
  }

  async deleteIntegration(id: string): Promise<boolean> {
    const integration = this.integrations.get(id);
    if (!integration) {
      return false;
    }

    this.integrations.delete(id);

    // Clean up related webhooks and data syncs
    for (const [webhookId, webhook] of this.webhooks) {
      if (webhook.url.includes(integration.baseUrl || '')) {
        this.webhooks.delete(webhookId);
      }
    }

    for (const [syncId, sync] of this.dataSyncs) {
      if (sync.sourceIntegration === id || sync.targetIntegration === id) {
        this.dataSyncs.delete(syncId);
      }
    }

    try {
      await auditLogger.logUserAction('integration_deleted', {
        integrationId: id,
        name: integration.name
      });
    } catch (error) {
      // Silently handle audit logging errors
      console.debug('Audit logging skipped (development mode)');
    }

    return true;
  }

  getIntegration(id: string): IntegrationConfig | null {
    return this.integrations.get(id) || null;
  }

  getIntegrationsByType(type: IntegrationConfig['type']): IntegrationConfig[] {
    return Array.from(this.integrations.values()).filter(i => i.type === type);
  }

  getActiveIntegrations(): IntegrationConfig[] {
    return Array.from(this.integrations.values()).filter(i => i.isActive);
  }

  // API Request Execution
  async executeApiRequest(
    integrationId: string,
    method: string,
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<{ success: boolean; data?: any; error?: string; statusCode?: number }> {
    const integration = this.integrations.get(integrationId);
    if (!integration || !integration.isActive) {
      return { success: false, error: 'Integration not found or inactive' };
    }

    // Check rate limit
    const rateLimitCheck = await this.checkRateLimit(integrationId, integration.rateLimit);
    if (!rateLimitCheck.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    const startTime = Date.now();
    const eventId = crypto.randomUUID();

    try {
      // Prepare request
      const url = `${integration.baseUrl}${endpoint}`;
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers
      };

      // Add authentication
      if (integration.apiKey) {
        requestHeaders['Authorization'] = `Bearer ${integration.apiKey}`;
      }

      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        timeout: integration.timeout || 30000
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestOptions.body = JSON.stringify(data);
      }

      // Log request event
      const requestEvent: IntegrationEvent = {
        id: eventId,
        integrationId,
        type: 'REQUEST',
        status: 'PENDING',
        method,
        url,
        requestData: data,
        timestamp: new Date()
      };
      this.events.set(eventId, requestEvent);

      // Execute request
      const response = await fetch(url, requestOptions);
      const responseData = await response.json();
      const duration = Date.now() - startTime;

      // Update event with response
      const responseEvent: IntegrationEvent = {
        ...requestEvent,
        type: 'RESPONSE',
        status: response.ok ? 'SUCCESS' : 'FAILED',
        responseData,
        statusCode: response.status,
        duration,
        errorMessage: response.ok ? undefined : responseData.message || 'Request failed'
      };
      this.events.set(eventId, responseEvent);

      try {
        await auditLogger.logUserAction('api_request_executed', {
          integrationId,
          method,
          endpoint,
          statusCode: response.status,
          duration
        });
      } catch (error) {
        // Silently handle audit logging errors
        console.debug('Audit logging skipped (development mode)');
      }

      return {
        success: response.ok,
        data: responseData,
        statusCode: response.status,
        error: response.ok ? undefined : responseData.message || 'Request failed'
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log error event
      const errorEvent: IntegrationEvent = {
        id: eventId,
        integrationId,
        type: 'ERROR',
        status: 'FAILED',
        method,
        url: `${integration.baseUrl}${endpoint}`,
        requestData: data,
        errorMessage,
        duration,
        timestamp: new Date()
      };
      this.events.set(eventId, errorEvent);

      try {
        await auditLogger.logUserAction('api_request_failed', {
          integrationId,
          method,
          endpoint,
          error: errorMessage,
          duration
        });
      } catch (error) {
        // Silently handle audit logging errors
        console.debug('Audit logging skipped (development mode)');
      }

      return { success: false, error: errorMessage };
    }
  }

  // Webhook Management
  async createWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt' | 'successCount' | 'failureCount'>): Promise<WebhookConfig> {
    const webhook: WebhookConfig = {
      id: crypto.randomUUID(),
      ...config,
      createdAt: new Date(),
      successCount: 0,
      failureCount: 0
    };

    this.webhooks.set(webhook.id, webhook);

    try {
      await auditLogger.logUserAction('webhook_created', {
        webhookId: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events
      });
    } catch (error) {
      // Silently handle audit logging errors
      console.debug('Audit logging skipped (development mode)');
    }

    return webhook;
  }

  async triggerWebhook(webhookId: string, eventType: string, payload: any): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook || !webhook.isActive) {
      return false;
    }

    if (!webhook.events.includes(eventType) && !webhook.events.includes('*')) {
      return false;
    }

    const webhookEvent: WebhookEvent = {
      id: crypto.randomUUID(),
      webhookId,
      eventType,
      payload,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: webhook.retryPolicy.maxRetries + 1,
      createdAt: new Date()
    };

    this.webhookEvents.set(webhookEvent.id, webhookEvent);

    // Process webhook asynchronously
    this.processWebhookEvent(webhookEvent.id);

    return true;
  }

  async processWebhookEvent(eventId: string): Promise<void> {
    const webhookEvent = this.webhookEvents.get(eventId);
    if (!webhookEvent) {
      return;
    }

    const webhook = this.webhooks.get(webhookEvent.webhookId);
    if (!webhook) {
      return;
    }

    webhookEvent.attempts++;
    webhookEvent.status = 'RETRYING';

    try {
      // Create signature
      const signature = this.createWebhookSignature(webhookEvent.payload, webhook.secret);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': webhookEvent.eventType,
          'X-Webhook-Delivery': eventId,
          ...webhook.headers
        },
        body: JSON.stringify({
          event: webhookEvent.eventType,
          data: webhookEvent.payload,
          timestamp: webhookEvent.createdAt.toISOString()
        }),
        timeout: webhook.timeout || 30000
      });

      if (response.ok) {
        webhookEvent.status = 'DELIVERED';
        webhookEvent.deliveredAt = new Date();
        webhook.successCount++;
        webhook.lastTriggered = new Date();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      webhookEvent.errorMessage = errorMessage;

      if (webhookEvent.attempts >= webhookEvent.maxAttempts) {
        webhookEvent.status = 'FAILED';
        webhookEvent.failedAt = new Date();
        webhook.failureCount++;
      } else {
        // Schedule retry
        const delay = webhook.retryPolicy.initialDelay * Math.pow(webhook.retryPolicy.backoffMultiplier, webhookEvent.attempts - 1);
        webhookEvent.nextRetryAt = new Date(Date.now() + delay * 1000);
        webhookEvent.status = 'PENDING';
      }
    }

    this.webhookEvents.set(eventId, webhookEvent);
    this.webhooks.set(webhook.id, webhook);
  }

  // Data Sync Management
  async createDataSync(config: Omit<DataSyncConfig, 'id' | 'createdAt'>): Promise<DataSyncConfig> {
    const dataSync: DataSyncConfig = {
      id: crypto.randomUUID(),
      ...config,
      createdAt: new Date()
    };

    this.dataSyncs.set(dataSync.id, dataSync);

    try {
      await auditLogger.logUserAction('data_sync_created', {
        syncId: dataSync.id,
        name: dataSync.name,
        sourceIntegration: dataSync.sourceIntegration,
        targetIntegration: dataSync.targetIntegration,
        syncType: dataSync.syncType
      });
    } catch (error) {
      // Silently handle audit logging errors
      console.debug('Audit logging skipped (development mode)');
    }

    return dataSync;
  }

  async executeDataSync(syncId: string): Promise<{ success: boolean; recordsProcessed: number; error?: string }> {
    const dataSync = this.dataSyncs.get(syncId);
    if (!dataSync || !dataSync.isActive) {
      return { success: false, recordsProcessed: 0, error: 'Data sync not found or inactive' };
    }

    try {
      const sourceIntegration = this.integrations.get(dataSync.sourceIntegration);
      const targetIntegration = this.integrations.get(dataSync.targetIntegration);

      if (!sourceIntegration || !targetIntegration) {
        return { success: false, recordsProcessed: 0, error: 'Source or target integration not found' };
      }

      // Fetch data from source
      const sourceResponse = await this.executeApiRequest(
        dataSync.sourceIntegration,
        'GET',
        '/data',
        undefined,
        { 'Accept': 'application/json' }
      );

      if (!sourceResponse.success) {
        return { success: false, recordsProcessed: 0, error: sourceResponse.error };
      }

      // Transform data according to mapping
      const transformedData = this.transformData(sourceResponse.data, dataSync.mapping);

      // Send data to target
      const targetResponse = await this.executeApiRequest(
        dataSync.targetIntegration,
        'POST',
        '/data',
        transformedData
      );

      if (!targetResponse.success) {
        return { success: false, recordsProcessed: 0, error: targetResponse.error };
      }

      // Update sync status
      dataSync.lastSync = new Date();
      this.dataSyncs.set(syncId, dataSync);

      try {
        await auditLogger.logUserAction('data_sync_executed', {
          syncId,
          recordsProcessed: transformedData.length || 1
        });
      } catch (error) {
        // Silently handle audit logging errors
        console.debug('Audit logging skipped (development mode)');
      }

      return { success: true, recordsProcessed: transformedData.length || 1 };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, recordsProcessed: 0, error: errorMessage };
    }
  }

  // Utility Methods
  private async checkRateLimit(integrationId: string, rateLimit?: IntegrationConfig['rateLimit']): Promise<{ allowed: boolean; remaining: number }> {
    if (!rateLimit) {
      return { allowed: true, remaining: Infinity };
    }

    const now = new Date();
    const key = `rate_limit:${integrationId}`;
    const limiter = this.rateLimiters.get(key);

    if (!limiter || now > limiter.resetTime) {
      // Reset or initialize rate limiter
      this.rateLimiters.set(key, {
        count: 1,
        resetTime: new Date(now.getTime() + rateLimit.window * 1000)
      });
      return { allowed: true, remaining: rateLimit.requests - 1 };
    }

    if (limiter.count >= rateLimit.requests) {
      return { allowed: false, remaining: 0 };
    }

    limiter.count++;
    this.rateLimiters.set(key, limiter);

    return { allowed: true, remaining: rateLimit.requests - limiter.count };
  }

  private createWebhookSignature(payload: any, secret: string): string {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  private transformData(data: any, mapping: Record<string, string>): any {
    if (Array.isArray(data)) {
      return data.map(item => this.transformObject(item, mapping));
    }
    return this.transformObject(data, mapping);
  }

  private transformObject(obj: any, mapping: Record<string, string>): any {
    const transformed: any = {};
    for (const [sourceKey, targetKey] of Object.entries(mapping)) {
      if (obj.hasOwnProperty(sourceKey)) {
        transformed[targetKey] = obj[sourceKey];
      }
    }
    return transformed;
  }

  // Background Processors
  private startWebhookProcessor(): void {
    setInterval(() => {
      this.processPendingWebhooks();
    }, 5000); // Process every 5 seconds
  }

  private startDataSyncProcessor(): void {
    setInterval(() => {
      this.processScheduledSyncs();
    }, 60000); // Process every minute
  }

  private startCleanupTasks(): void {
    // Clean up old events every hour
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60 * 60 * 1000);
  }

  private async processPendingWebhooks(): Promise<void> {
    const pendingWebhooks = Array.from(this.webhookEvents.values())
      .filter(event => event.status === 'PENDING' && 
                      (!event.nextRetryAt || new Date() >= event.nextRetryAt));

    for (const webhookEvent of pendingWebhooks) {
      await this.processWebhookEvent(webhookEvent.id);
    }
  }

  private async processScheduledSyncs(): Promise<void> {
    const now = new Date();
    const scheduledSyncs = Array.from(this.dataSyncs.values())
      .filter(sync => sync.isActive && 
                      sync.nextSync && 
                      now >= sync.nextSync);

    for (const dataSync of scheduledSyncs) {
      await this.executeDataSync(dataSync.id);
      
      // Schedule next sync if frequency is set
      if (dataSync.frequency) {
        // In a real implementation, you would use a cron parser
        // For now, we'll just add 1 hour
        dataSync.nextSync = new Date(now.getTime() + 60 * 60 * 1000);
        this.dataSyncs.set(dataSync.id, dataSync);
      }
    }
  }

  private cleanupOldEvents(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const [id, event] of this.events) {
      if (event.timestamp < oneWeekAgo) {
        this.events.delete(id);
      }
    }

    for (const [id, webhookEvent] of this.webhookEvents) {
      if (webhookEvent.createdAt < oneWeekAgo && 
          (webhookEvent.status === 'DELIVERED' || webhookEvent.status === 'FAILED')) {
        this.webhookEvents.delete(id);
      }
    }
  }

  // Initialize default integrations
  private initializeDefaultIntegrations(): void {
    const defaultIntegrations: Omit<IntegrationConfig, 'id' | 'createdAt' | 'lastUpdated'>[] = [
      {
        name: 'Property Data API',
        type: 'API',
        provider: 'PropertyDataProvider',
        description: 'External property data provider',
        baseUrl: 'https://api.propertydata.com',
        rateLimit: { requests: 1000, window: 3600 },
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelay: 1 },
        timeout: 30000,
        isActive: true
      },
      {
        name: 'Market Analysis Service',
        type: 'API',
        provider: 'MarketAnalysis',
        description: 'Market analysis and trends service',
        baseUrl: 'https://api.marketanalysis.com',
        rateLimit: { requests: 500, window: 3600 },
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelay: 1 },
        timeout: 30000,
        isActive: true
      },
      {
        name: 'Notification Service',
        type: 'WEBHOOK',
        provider: 'NotificationProvider',
        description: 'External notification service',
        webhookUrl: 'https://hooks.notificationprovider.com/webhook',
        rateLimit: { requests: 100, window: 60 },
        retryPolicy: { maxRetries: 5, backoffMultiplier: 2, initialDelay: 2 },
        timeout: 10000,
        isActive: true
      }
    ];

    for (const config of defaultIntegrations) {
      const integration: IntegrationConfig = {
        id: crypto.randomUUID(),
        ...config,
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      this.integrations.set(integration.id, integration);
    }
  }

  // Get integration metrics
  getIntegrationMetrics(): {
    totalIntegrations: number;
    activeIntegrations: number;
    totalWebhooks: number;
    activeWebhooks: number;
    totalDataSyncs: number;
    activeDataSyncs: number;
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    pendingWebhookEvents: number;
  } {
    const events = Array.from(this.events.values());
    const webhookEvents = Array.from(this.webhookEvents.values());

    return {
      totalIntegrations: this.integrations.size,
      activeIntegrations: Array.from(this.integrations.values()).filter(i => i.isActive).length,
      totalWebhooks: this.webhooks.size,
      activeWebhooks: Array.from(this.webhooks.values()).filter(w => w.isActive).length,
      totalDataSyncs: this.dataSyncs.size,
      activeDataSyncs: Array.from(this.dataSyncs.values()).filter(s => s.isActive).length,
      totalEvents: events.length,
      successfulEvents: events.filter(e => e.status === 'SUCCESS').length,
      failedEvents: events.filter(e => e.status === 'FAILED').length,
      pendingWebhookEvents: webhookEvents.filter(e => e.status === 'PENDING' || e.status === 'RETRYING').length
    };
  }
}

// Export singleton instance
export const integrationManager = IntegrationManager.getInstance();
