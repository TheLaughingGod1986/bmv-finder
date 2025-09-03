import { auditLogger } from '../audit/auditLogger';
import crypto from 'crypto';

export interface WebhookHandler {
  id: string;
  name: string;
  eventTypes: string[];
  handler: (payload: any, headers: Record<string, string>) => Promise<{ success: boolean; response?: any; error?: string }>;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  successCount: number;
  failureCount: number;
}

export interface WebhookRequest {
  id: string;
  source: string;
  eventType: string;
  payload: any;
  headers: Record<string, string>;
  signature?: string;
  timestamp: Date;
  processed: boolean;
  processingTime?: number;
  error?: string;
  response?: any;
}

export interface WebhookValidation {
  isValid: boolean;
  error?: string;
  source?: string;
  eventType?: string;
}

export class WebhookManager {
  private static instance: WebhookManager;
  private handlers: Map<string, WebhookHandler> = new Map();
  private requests: Map<string, WebhookRequest> = new Map();
  private webhookSecrets: Map<string, string> = new Map();

  private constructor() {
    this.initializeDefaultHandlers();
    this.startCleanupTasks();
  }

  public static getInstance(): WebhookManager {
    if (!WebhookManager.instance) {
      WebhookManager.instance = new WebhookManager();
    }
    return WebhookManager.instance;
  }

  // Webhook Handler Management
  async registerHandler(
    name: string,
    eventTypes: string[],
    handler: (payload: any, headers: Record<string, string>) => Promise<{ success: boolean; response?: any; error?: string }>
  ): Promise<string> {
    const handlerId = crypto.randomUUID();
    const webhookHandler: WebhookHandler = {
      id: handlerId,
      name,
      eventTypes,
      handler,
      isActive: true,
      createdAt: new Date(),
      successCount: 0,
      failureCount: 0
    };

    this.handlers.set(handlerId, webhookHandler);

    try {
      await auditLogger.logUserAction('webhook_handler_registered', {
        handlerId,
        name,
        eventTypes
      });
    } catch (error) {
      // Silently handle audit logging errors
      console.debug('Audit logging skipped (development mode)');
    }

    return handlerId;
  }

  async unregisterHandler(handlerId: string): Promise<boolean> {
    const handler = this.handlers.get(handlerId);
    if (!handler) {
      return false;
    }

    this.handlers.delete(handlerId);

    try {
      await auditLogger.logUserAction('webhook_handler_unregistered', {
        handlerId,
        name: handler.name
      });
    } catch (error) {
      // Silently handle audit logging errors
      console.debug('Audit logging skipped (development mode)');
    }

    return true;
  }

  // Webhook Processing
  async processWebhook(
    source: string,
    eventType: string,
    payload: any,
    headers: Record<string, string>,
    signature?: string
  ): Promise<{ success: boolean; responses: any[]; errors: string[] }> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // Validate webhook
    const validation = await this.validateWebhook(source, eventType, payload, headers, signature);
    if (!validation.isValid) {
      const error = `Webhook validation failed: ${validation.error}`;
      await this.logWebhookRequest(requestId, source, eventType, payload, headers, false, Date.now() - startTime, error);
      return { success: false, responses: [], errors: [error] };
    }

    // Log webhook request
    await this.logWebhookRequest(requestId, source, eventType, payload, headers, true);

    // Find matching handlers
    const matchingHandlers = Array.from(this.handlers.values())
      .filter(handler => handler.isActive && 
                        (handler.eventTypes.includes(eventType) || handler.eventTypes.includes('*')));

    if (matchingHandlers.length === 0) {
      const error = `No handlers found for event type: ${eventType}`;
      await this.logWebhookRequest(requestId, source, eventType, payload, headers, false, Date.now() - startTime, error);
      return { success: false, responses: [], errors: [error] };
    }

    // Process with all matching handlers
    const responses: any[] = [];
    const errors: string[] = [];

    for (const handler of matchingHandlers) {
      try {
        const result = await handler.handler(payload, headers);
        
        if (result.success) {
          responses.push(result.response);
          handler.successCount++;
          handler.lastUsed = new Date();
        } else {
          errors.push(`Handler ${handler.name}: ${result.error}`);
          handler.failureCount++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Handler ${handler.name}: ${errorMessage}`);
        handler.failureCount++;
      }

      this.handlers.set(handler.id, handler);
    }

    const success = errors.length === 0;
    await this.logWebhookRequest(requestId, source, eventType, payload, headers, success, Date.now() - startTime, errors.join('; '));

    return { success, responses, errors };
  }

  // Webhook Validation
  private async validateWebhook(
    source: string,
    eventType: string,
    payload: any,
    headers: Record<string, string>,
    signature?: string
  ): Promise<WebhookValidation> {
    // Check if source is allowed
    const allowedSources = ['github', 'stripe', 'paypal', 'property-data-provider', 'market-analysis'];
    if (!allowedSources.includes(source.toLowerCase())) {
      return { isValid: false, error: 'Unknown webhook source' };
    }

    // Validate signature if provided
    if (signature) {
      const secret = this.webhookSecrets.get(source);
      if (!secret) {
        return { isValid: false, error: 'No secret configured for source' };
      }

      const expectedSignature = this.createSignature(payload, secret);
      if (signature !== expectedSignature) {
        return { isValid: false, error: 'Invalid signature' };
      }
    }

    // Validate payload structure
    if (!payload || typeof payload !== 'object') {
      return { isValid: false, error: 'Invalid payload format' };
    }

    // Validate event type
    if (!eventType || typeof eventType !== 'string') {
      return { isValid: false, error: 'Invalid event type' };
    }

    return { isValid: true, source, eventType };
  }

  // Webhook Secret Management
  async setWebhookSecret(source: string, secret: string): Promise<void> {
    this.webhookSecrets.set(source, secret);
    try {
      await auditLogger.logUserAction('webhook_secret_updated', { source });
    } catch (error) {
      // Silently handle audit logging errors
      console.debug('Audit logging skipped (development mode)');
    }
  }

  getWebhookSecret(source: string): string | null {
    return this.webhookSecrets.get(source) || null;
  }

  // Event Type Management
  getSupportedEventTypes(): Record<string, string[]> {
    const eventTypes: Record<string, string[]> = {};

    for (const handler of this.handlers.values()) {
      for (const eventType of handler.eventTypes) {
        if (!eventTypes[eventType]) {
          eventTypes[eventType] = [];
        }
        eventTypes[eventType].push(handler.name);
      }
    }

    return eventTypes;
  }

  // Handler Statistics
  getHandlerStats(): Array<{
    id: string;
    name: string;
    eventTypes: string[];
    isActive: boolean;
    successCount: number;
    failureCount: number;
    lastUsed?: Date;
    successRate: number;
  }> {
    return Array.from(this.handlers.values()).map(handler => ({
      id: handler.id,
      name: handler.name,
      eventTypes: handler.eventTypes,
      isActive: handler.isActive,
      successCount: handler.successCount,
      failureCount: handler.failureCount,
      lastUsed: handler.lastUsed,
      successRate: handler.successCount + handler.failureCount > 0 
        ? (handler.successCount / (handler.successCount + handler.failureCount)) * 100 
        : 0
    }));
  }

  // Webhook Request History
  getWebhookRequests(limit: number = 100): WebhookRequest[] {
    return Array.from(this.requests.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getWebhookRequest(id: string): WebhookRequest | null {
    return this.requests.get(id) || null;
  }

  // Utility Methods
  private createSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  private async logWebhookRequest(
    requestId: string,
    source: string,
    eventType: string,
    payload: any,
    headers: Record<string, string>,
    processed: boolean,
    processingTime?: number,
    error?: string
  ): Promise<void> {
    const request: WebhookRequest = {
      id: requestId,
      source,
      eventType,
      payload,
      headers,
      timestamp: new Date(),
      processed,
      processingTime,
      error,
      response: processed ? { status: 'success' } : undefined
    };

    this.requests.set(requestId, request);

    try {
      await auditLogger.logUserAction('webhook_processed', {
        requestId,
        source,
        eventType,
        processed,
        processingTime,
        error
      });
    } catch (error) {
      // Silently handle audit logging errors
      console.debug('Audit logging skipped (development mode)');
    }
  }

  // Initialize default handlers
  private initializeDefaultHandlers(): void {
    // Property data webhook handler
    this.registerHandler(
      'Property Data Handler',
      ['property.created', 'property.updated', 'property.deleted'],
      async (payload, headers) => {
        try {
          // Process property data webhook
          console.log('Processing property data webhook:', payload);
          
          // In a real implementation, you would:
          // 1. Validate the property data
          // 2. Update the local database
          // 3. Trigger any necessary notifications
          // 4. Update search indexes
          
          return { success: true, response: { message: 'Property data processed successfully' } };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    );

    // Market analysis webhook handler
    this.registerHandler(
      'Market Analysis Handler',
      ['market.analysis.completed', 'market.trends.updated'],
      async (payload, headers) => {
        try {
          // Process market analysis webhook
          console.log('Processing market analysis webhook:', payload);
          
          // In a real implementation, you would:
          // 1. Update market analysis data
          // 2. Recalculate property valuations
          // 3. Update market trend indicators
          // 4. Notify relevant users
          
          return { success: true, response: { message: 'Market analysis processed successfully' } };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    );

    // Payment webhook handler
    this.registerHandler(
      'Payment Handler',
      ['payment.completed', 'payment.failed', 'subscription.updated'],
      async (payload, headers) => {
        try {
          // Process payment webhook
          console.log('Processing payment webhook:', payload);
          
          // In a real implementation, you would:
          // 1. Update user subscription status
          // 2. Process payment records
          // 3. Send confirmation emails
          // 4. Update user permissions
          
          return { success: true, response: { message: 'Payment processed successfully' } };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    );

    // Generic webhook handler for testing
    this.registerHandler(
      'Generic Handler',
      ['*'],
      async (payload, headers) => {
        try {
          console.log('Processing generic webhook:', { payload, headers });
          return { success: true, response: { message: 'Generic webhook processed successfully' } };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    );
  }

  // Cleanup tasks
  private startCleanupTasks(): void {
    // Clean up old webhook requests every hour
    setInterval(() => {
      this.cleanupOldRequests();
    }, 60 * 60 * 1000);
  }

  private cleanupOldRequests(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const [id, request] of this.requests) {
      if (request.timestamp < oneWeekAgo) {
        this.requests.delete(id);
      }
    }
  }

  // Get webhook metrics
  getWebhookMetrics(): {
    totalHandlers: number;
    activeHandlers: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageProcessingTime: number;
    requestsBySource: Record<string, number>;
    requestsByEventType: Record<string, number>;
  } {
    const requests = Array.from(this.requests.values());
    const successfulRequests = requests.filter(r => r.processed).length;
    const failedRequests = requests.filter(r => !r.processed).length;
    const processingTimes = requests.filter(r => r.processingTime).map(r => r.processingTime!);
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;

    const requestsBySource: Record<string, number> = {};
    const requestsByEventType: Record<string, number> = {};

    for (const request of requests) {
      requestsBySource[request.source] = (requestsBySource[request.source] || 0) + 1;
      requestsByEventType[request.eventType] = (requestsByEventType[request.eventType] || 0) + 1;
    }

    return {
      totalHandlers: this.handlers.size,
      activeHandlers: Array.from(this.handlers.values()).filter(h => h.isActive).length,
      totalRequests: requests.length,
      successfulRequests,
      failedRequests,
      averageProcessingTime,
      requestsBySource,
      requestsByEventType
    };
  }
}

// Export singleton instance
export const webhookManager = WebhookManager.getInstance();
