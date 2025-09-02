// Webhook and event system for real-time integrations

import { advancedCache } from './advancedCache';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enabled: boolean;
  headers?: Record<string, string>;
  filters?: Record<string, any>;
}

interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  source: string;
  metadata?: Record<string, any>;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt: string;
  nextRetry?: string;
  response?: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  };
  error?: string;
}

interface EventSubscription {
  id: string;
  subscriber: string;
  events: string[];
  filters?: Record<string, any>;
  callback: (event: WebhookEvent) => Promise<void>;
  enabled: boolean;
}

class WebhookManager {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private subscriptions: Map<string, EventSubscription> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private isProcessing = false;

  constructor() {
    this.initializeWebhooks();
    this.startEventProcessor();
  }

  // Initialize default webhooks
  private initializeWebhooks(): void {
    // Property alerts webhook
    this.addWebhook({
      id: 'property-alerts',
      name: 'Property Alerts',
      url: process.env.PROPERTY_ALERTS_WEBHOOK_URL || '',
      events: ['property.new', 'property.price_change', 'property.bmv_opportunity'],
      secret: process.env.PROPERTY_ALERTS_WEBHOOK_SECRET,
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 5000,
      enabled: !!process.env.PROPERTY_ALERTS_WEBHOOK_URL,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PropertyIntelligence-Webhook/1.0'
      }
    });

    // Market updates webhook
    this.addWebhook({
      id: 'market-updates',
      name: 'Market Updates',
      url: process.env.MARKET_UPDATES_WEBHOOK_URL || '',
      events: ['market.trend_change', 'market.opportunity', 'market.risk'],
      secret: process.env.MARKET_UPDATES_WEBHOOK_SECRET,
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 5000,
      enabled: !!process.env.MARKET_UPDATES_WEBHOOK_URL,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PropertyIntelligence-Webhook/1.0'
      }
    });

    // Analytics webhook
    this.addWebhook({
      id: 'analytics',
      name: 'Analytics Updates',
      url: process.env.ANALYTICS_WEBHOOK_URL || '',
      events: ['analytics.insight', 'analytics.forecast', 'analytics.recommendation'],
      secret: process.env.ANALYTICS_WEBHOOK_SECRET,
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 5000,
      enabled: !!process.env.ANALYTICS_WEBHOOK_URL,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PropertyIntelligence-Webhook/1.0'
      }
    });
  }

  // Add webhook configuration
  addWebhook(config: WebhookConfig): void {
    this.webhooks.set(config.id, config);
  }

  // Remove webhook
  removeWebhook(webhookId: string): boolean {
    return this.webhooks.delete(webhookId);
  }

  // Subscribe to events
  subscribe(subscription: EventSubscription): void {
    this.subscriptions.set(subscription.id, subscription);
  }

  // Unsubscribe from events
  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  // Emit event
  async emitEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<void> {
    const webhookEvent: WebhookEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date().toISOString()
    };

    // Add to event queue
    this.eventQueue.push(webhookEvent);

    // Process internal subscriptions immediately
    await this.processInternalSubscriptions(webhookEvent);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processEventQueue();
    }
  }

  // Process internal subscriptions
  private async processInternalSubscriptions(event: WebhookEvent): Promise<void> {
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.enabled) continue;
      if (!subscription.events.includes(event.type)) continue;
      if (!this.matchesFilters(event, subscription.filters)) continue;

      try {
        await subscription.callback(event);
      } catch (error) {
        console.error(`Internal subscription ${subscription.id} failed:`, error);
      }
    }
  }

  // Process event queue
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (!event) continue;

      await this.deliverToWebhooks(event);
    }

    this.isProcessing = false;
  }

  // Deliver event to webhooks
  private async deliverToWebhooks(event: WebhookEvent): Promise<void> {
    for (const webhook of this.webhooks.values()) {
      if (!webhook.enabled) continue;
      if (!webhook.events.includes(event.type)) continue;
      if (!this.matchesFilters(event, webhook.filters)) continue;

      await this.deliverToWebhook(webhook, event);
    }
  }

  // Deliver to specific webhook
  private async deliverToWebhook(webhook: WebhookConfig, event: WebhookEvent): Promise<void> {
    const deliveryId = this.generateDeliveryId();
    const delivery: WebhookDelivery = {
      id: deliveryId,
      webhookId: webhook.id,
      eventId: event.id,
      status: 'pending',
      attempts: 0,
      lastAttempt: new Date().toISOString()
    };

    this.deliveries.set(deliveryId, delivery);

    // Attempt delivery
    await this.attemptDelivery(webhook, event, delivery);
  }

  // Attempt webhook delivery
  private async attemptDelivery(
    webhook: WebhookConfig,
    event: WebhookEvent,
    delivery: WebhookDelivery
  ): Promise<void> {
    delivery.attempts++;
    delivery.lastAttempt = new Date().toISOString();
    delivery.status = 'retrying';

    try {
      const payload = this.createWebhookPayload(event, webhook);
      const response = await this.sendWebhook(webhook, payload);

      delivery.status = 'delivered';
      delivery.response = {
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.text()
      };

      console.log(`Webhook ${webhook.id} delivered successfully`);

    } catch (error: any) {
      delivery.error = error.message;
      delivery.status = 'failed';

      // Schedule retry if attempts remaining
      if (delivery.attempts < webhook.retryAttempts) {
        const retryDelay = webhook.retryDelay * Math.pow(2, delivery.attempts - 1);
        delivery.nextRetry = new Date(Date.now() + retryDelay).toISOString();
        delivery.status = 'retrying';

        // Schedule retry
        setTimeout(() => {
          this.attemptDelivery(webhook, event, delivery);
        }, retryDelay);

        console.log(`Webhook ${webhook.id} failed, retrying in ${retryDelay}ms`);
      } else {
        console.error(`Webhook ${webhook.id} failed after ${delivery.attempts} attempts:`, error);
      }
    }

    this.deliveries.set(delivery.id, delivery);
  }

  // Send webhook request
  private async sendWebhook(webhook: WebhookConfig, payload: any): Promise<Response> {
    const headers: Record<string, string> = {
      ...webhook.headers,
      'X-Webhook-Event': payload.event.type,
      'X-Webhook-Timestamp': payload.event.timestamp
    };

    // Add signature if secret provided
    if (webhook.secret) {
      const signature = this.createSignature(JSON.stringify(payload), webhook.secret);
      headers['X-Webhook-Signature'] = signature;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(webhook.timeout)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  // Create webhook payload
  private createWebhookPayload(event: WebhookEvent, webhook: WebhookConfig): any {
    return {
      event: {
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        source: event.source
      },
      data: event.data,
      metadata: event.metadata
    };
  }

  // Create webhook signature
  private createSignature(payload: string, secret: string): string {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  // Check if event matches filters
  private matchesFilters(event: WebhookEvent, filters?: Record<string, any>): boolean {
    if (!filters) return true;

    for (const [key, value] of Object.entries(filters)) {
      const eventValue = this.getNestedValue(event, key);
      if (eventValue !== value) return false;
    }

    return true;
  }

  // Get nested value from object
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Generate unique IDs
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateDeliveryId(): string {
    return `del_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Start event processor
  private startEventProcessor(): void {
    // Process events every 100ms
    setInterval(() => {
      if (!this.isProcessing && this.eventQueue.length > 0) {
        this.processEventQueue();
      }
    }, 100);

    // Clean up old deliveries every hour
    setInterval(() => {
      this.cleanupOldDeliveries();
    }, 60 * 60 * 1000);
  }

  // Clean up old deliveries
  private cleanupOldDeliveries(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    for (const [id, delivery] of this.deliveries.entries()) {
      if (new Date(delivery.lastAttempt).getTime() < cutoff) {
        this.deliveries.delete(id);
      }
    }
  }

  // Public methods

  // Get webhook status
  getWebhookStatus(): Record<string, { config: WebhookConfig; deliveries: WebhookDelivery[] }> {
    const status: Record<string, { config: WebhookConfig; deliveries: WebhookDelivery[] }> = {};

    for (const webhook of this.webhooks.values()) {
      const deliveries = Array.from(this.deliveries.values())
        .filter(d => d.webhookId === webhook.id);

      status[webhook.id] = {
        config: {
          ...webhook,
          secret: webhook.secret ? '***' : undefined
        },
        deliveries
      };
    }

    return status;
  }

  // Get delivery statistics
  getDeliveryStats(): {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    retrying: number;
  } {
    const deliveries = Array.from(this.deliveries.values());
    
    return {
      total: deliveries.length,
      delivered: deliveries.filter(d => d.status === 'delivered').length,
      failed: deliveries.filter(d => d.status === 'failed').length,
      pending: deliveries.filter(d => d.status === 'pending').length,
      retrying: deliveries.filter(d => d.status === 'retrying').length
    };
  }

  // Test webhook
  async testWebhook(webhookId: string): Promise<{ success: boolean; error?: string }> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    const testEvent: WebhookEvent = {
      id: this.generateEventId(),
      type: 'test',
      data: { message: 'Test webhook delivery' },
      timestamp: new Date().toISOString(),
      source: 'webhook-manager'
    };

    try {
      await this.deliverToWebhook(webhook, testEvent);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Retry failed deliveries
  async retryFailedDeliveries(): Promise<number> {
    const failedDeliveries = Array.from(this.deliveries.values())
      .filter(d => d.status === 'failed');

    let retried = 0;
    for (const delivery of failedDeliveries) {
      const webhook = this.webhooks.get(delivery.webhookId);
      if (!webhook) continue;

      const event: WebhookEvent = {
        id: delivery.eventId,
        type: 'retry',
        data: {},
        timestamp: new Date().toISOString(),
        source: 'webhook-manager'
      };

      delivery.status = 'retrying';
      delivery.attempts = 0;
      delivery.error = undefined;

      await this.attemptDelivery(webhook, event, delivery);
      retried++;
    }

    return retried;
  }
}

// Singleton instance
export const webhookManager = new WebhookManager();

// Export types
export type { WebhookConfig, WebhookEvent, WebhookDelivery, EventSubscription };
