import { auditLogger } from '../audit/auditLogger';

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  events: string[];
  headers: Record<string, string>;
  authentication: {
    type: 'NONE' | 'API_KEY' | 'BASIC' | 'BEARER' | 'HMAC';
    credentials: Record<string, any>;
  };
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  rateLimit: {
    requests: number;
    period: 'SECOND' | 'MINUTE' | 'HOUR';
  };
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  eventType: string;
  payload: any;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;
  createdAt: string;
  sentAt?: string;
  errorMessage?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  status: 'SUCCESS' | 'FAILED';
  responseCode: number;
  responseTime: number;
  responseBody?: string;
  errorMessage?: string;
  createdAt: string;
}

export class WebhookManager {
  private static instance: WebhookManager;
  private webhooks: Map<string, WebhookConfig> = new Map();
  private events: Map<string, WebhookEvent[]> = new Map();
  private deliveries: Map<string, WebhookDelivery[]> = new Map();
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();

  public static getInstance(): WebhookManager {
    if (!WebhookManager.instance) {
      WebhookManager.instance = new WebhookManager();
    }
    return WebhookManager.instance;
  }

  constructor() {
    this.initializeDefaultWebhooks();
  }

  private initializeDefaultWebhooks(): void {
    // Property alert webhook
    this.addWebhook({
      id: 'property-alert-webhook',
      name: 'Property Alert Notifications',
      url: 'https://api.example.com/webhooks/property-alerts',
      method: 'POST',
      events: ['property.created', 'property.updated', 'property.deleted'],
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BMV-Finder-Webhook/1.0',
      },
      authentication: {
        type: 'API_KEY',
        credentials: {
          apiKey: 'your-api-key-here',
        },
      },
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      rateLimit: {
        requests: 100,
        period: 'MINUTE',
      },
      status: 'INACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Market update webhook
    this.addWebhook({
      id: 'market-update-webhook',
      name: 'Market Update Notifications',
      url: 'https://api.example.com/webhooks/market-updates',
      method: 'POST',
      events: ['market.analysis.completed', 'market.trends.updated'],
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BMV-Finder-Webhook/1.0',
      },
      authentication: {
        type: 'HMAC',
        credentials: {
          secret: 'your-webhook-secret',
        },
      },
      retryPolicy: {
        maxRetries: 5,
        retryDelay: 2000,
        backoffMultiplier: 1.5,
      },
      rateLimit: {
        requests: 50,
        period: 'MINUTE',
      },
      status: 'INACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Add webhook
  public addWebhook(config: WebhookConfig): boolean {
    try {
      if (!this.validateWebhookConfig(config)) {
        return false;
      }

      this.webhooks.set(config.id, config);
      this.events.set(config.id, []);
      this.deliveries.set(config.id, []);

      auditLogger.logSystemEvent('webhook_added', {
        webhookId: config.id,
        name: config.name,
        url: config.url,
        events: config.events,
      });

      return true;
    } catch (error) {
      console.error('Error adding webhook:', error);
      return false;
    }
  }

  // Update webhook
  public updateWebhook(id: string, updates: Partial<WebhookConfig>): boolean {
    try {
      const existing = this.webhooks.get(id);
      if (!existing) {
        return false;
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      if (!this.validateWebhookConfig(updated)) {
        return false;
      }

      this.webhooks.set(id, updated);

      auditLogger.logSystemEvent('webhook_updated', {
        webhookId: id,
        updates: Object.keys(updates),
      });

      return true;
    } catch (error) {
      console.error('Error updating webhook:', error);
      return false;
    }
  }

  // Remove webhook
  public removeWebhook(id: string): boolean {
    try {
      const webhook = this.webhooks.get(id);
      if (!webhook) {
        return false;
      }

      this.webhooks.delete(id);
      this.events.delete(id);
      this.deliveries.delete(id);
      this.rateLimiters.delete(id);

      auditLogger.logSystemEvent('webhook_removed', {
        webhookId: id,
        name: webhook.name,
      });

      return true;
    } catch (error) {
      console.error('Error removing webhook:', error);
      return false;
    }
  }

  // Get webhook
  public getWebhook(id: string): WebhookConfig | null {
    return this.webhooks.get(id) || null;
  }

  // Get all webhooks
  public getAllWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  // Get active webhooks
  public getActiveWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values()).filter(webhook => webhook.status === 'ACTIVE');
  }

  // Get webhooks by event type
  public getWebhooksByEvent(eventType: string): WebhookConfig[] {
    return Array.from(this.webhooks.values()).filter(webhook => 
      webhook.status === 'ACTIVE' && webhook.events.includes(eventType)
    );
  }

  // Send webhook event
  public async sendWebhookEvent(eventType: string, payload: any): Promise<WebhookEvent[]> {
    try {
      const webhooks = this.getWebhooksByEvent(eventType);
      const events: WebhookEvent[] = [];

      for (const webhook of webhooks) {
        const event = await this.createWebhookEvent(webhook.id, eventType, payload);
        if (event) {
          events.push(event);
          await this.deliverWebhookEvent(webhook, event);
        }
      }

      return events;
    } catch (error) {
      console.error('Error sending webhook event:', error);
      return [];
    }
  }

  // Create webhook event
  private async createWebhookEvent(webhookId: string, eventType: string, payload: any): Promise<WebhookEvent | null> {
    try {
      const webhook = this.webhooks.get(webhookId);
      if (!webhook) {
        return null;
      }

      const event: WebhookEvent = {
        id: this.generateId(),
        webhookId,
        eventType,
        payload,
        status: 'PENDING',
        attempts: 0,
        maxAttempts: webhook.retryPolicy.maxRetries,
        createdAt: new Date().toISOString(),
      };

      if (!this.events.has(webhookId)) {
        this.events.set(webhookId, []);
      }
      this.events.get(webhookId)!.push(event);

      return event;
    } catch (error) {
      console.error('Error creating webhook event:', error);
      return null;
    }
  }

  // Deliver webhook event
  private async deliverWebhookEvent(webhook: WebhookConfig, event: WebhookEvent): Promise<void> {
    try {
      // Check rate limit
      if (!this.checkRateLimit(webhook.id, webhook.rateLimit)) {
        event.status = 'PENDING';
        event.nextRetryAt = new Date(Date.now() + 60000).toISOString(); // Retry in 1 minute
        return;
      }

      event.status = 'SENT';
      event.attempts++;

      const startTime = Date.now();
      
      // Prepare headers
      const headers = { ...webhook.headers };
      
      // Add authentication
      if (webhook.authentication.type === 'API_KEY') {
        headers['Authorization'] = `Bearer ${webhook.authentication.credentials.apiKey}`;
      } else if (webhook.authentication.type === 'HMAC') {
        const signature = this.generateHMACSignature(JSON.stringify(event.payload), webhook.authentication.credentials.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      // Send webhook
      const response = await fetch(webhook.url, {
        method: webhook.method,
        headers,
        body: JSON.stringify({
          event: event.eventType,
          data: event.payload,
          timestamp: event.createdAt,
          id: event.id,
        }),
      });

      const responseTime = Date.now() - startTime;
      const responseBody = await response.text();

      // Create delivery record
      const delivery: WebhookDelivery = {
        id: this.generateId(),
        webhookId: webhook.id,
        eventId: event.id,
        status: response.ok ? 'SUCCESS' : 'FAILED',
        responseCode: response.status,
        responseTime,
        responseBody: responseBody.length > 1000 ? responseBody.substring(0, 1000) + '...' : responseBody,
        createdAt: new Date().toISOString(),
      };

      if (!response.ok) {
        delivery.errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        event.status = 'FAILED';
        event.errorMessage = delivery.errorMessage;
      } else {
        event.sentAt = new Date().toISOString();
      }

      // Store delivery
      if (!this.deliveries.has(webhook.id)) {
        this.deliveries.set(webhook.id, []);
      }
      this.deliveries.get(webhook.id)!.push(delivery);

      // Log delivery
      auditLogger.logSystemEvent('webhook_delivered', {
        webhookId: webhook.id,
        eventId: event.id,
        status: delivery.status,
        responseCode: delivery.responseCode,
        responseTime: delivery.responseTime,
      });

    } catch (error) {
      console.error('Error delivering webhook:', error);
      
      event.status = 'FAILED';
      event.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      event.attempts++;

      // Schedule retry if attempts remaining
      if (event.attempts < event.maxAttempts) {
        const webhook = this.webhooks.get(event.webhookId);
        if (webhook) {
          const retryDelay = webhook.retryPolicy.retryDelay * Math.pow(webhook.retryPolicy.backoffMultiplier, event.attempts - 1);
          event.nextRetryAt = new Date(Date.now() + retryDelay).toISOString();
          event.status = 'RETRYING';
        }
      }
    }
  }

  // Check rate limit
  private checkRateLimit(webhookId: string, rateLimit: WebhookConfig['rateLimit']): boolean {
    const now = Date.now();
    const periodMs = this.getPeriodMs(rateLimit.period);
    const resetTime = now + periodMs;

    const limiter = this.rateLimiters.get(webhookId);
    
    if (!limiter || now >= limiter.resetTime) {
      this.rateLimiters.set(webhookId, {
        count: 1,
        resetTime,
      });
      return true;
    }

    if (limiter.count >= rateLimit.requests) {
      return false;
    }

    limiter.count++;
    return true;
  }

  // Get period in milliseconds
  private getPeriodMs(period: string): number {
    switch (period) {
      case 'SECOND': return 1000;
      case 'MINUTE': return 60000;
      case 'HOUR': return 3600000;
      default: return 60000;
    }
  }

  // Generate HMAC signature
  private generateHMACSignature(payload: string, secret: string): string {
    // In a real implementation, this would use crypto.createHmac
    return `sha256=${Buffer.from(payload + secret).toString('base64')}`;
  }

  // Get webhook events
  public getWebhookEvents(webhookId: string, limit: number = 50): WebhookEvent[] {
    const events = this.events.get(webhookId) || [];
    return events
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Get webhook deliveries
  public getWebhookDeliveries(webhookId: string, limit: number = 50): WebhookDelivery[] {
    const deliveries = this.deliveries.get(webhookId) || [];
    return deliveries
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Retry failed webhook events
  public async retryFailedEvents(): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      for (const [webhookId, events] of this.events.entries()) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook || webhook.status !== 'ACTIVE') {
          continue;
        }

        const failedEvents = events.filter(event => 
          event.status === 'RETRYING' && 
          event.nextRetryAt && 
          event.nextRetryAt <= now &&
          event.attempts < event.maxAttempts
        );

        for (const event of failedEvents) {
          await this.deliverWebhookEvent(webhook, event);
        }
      }
    } catch (error) {
      console.error('Error retrying failed webhook events:', error);
    }
  }

  // Validate webhook configuration
  private validateWebhookConfig(config: WebhookConfig): boolean {
    if (!config.id || !config.name || !config.url) {
      return false;
    }

    if (!config.events || config.events.length === 0) {
      return false;
    }

    if (!config.method || !['POST', 'PUT', 'PATCH'].includes(config.method)) {
      return false;
    }

    return true;
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const webhookManager = WebhookManager.getInstance();