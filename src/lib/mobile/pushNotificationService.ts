import { auditLogger } from '../audit/auditLogger';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  vibrate?: number[];
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  renotify?: boolean;
}

export interface NotificationPreferences {
  userId: string;
  propertyAlerts: boolean;
  marketUpdates: boolean;
  priceChanges: boolean;
  newListings: boolean;
  investmentOpportunities: boolean;
  systemUpdates: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private subscriptions: Map<string, PushSubscription> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private vapidPublicKey: string = '';

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  constructor() {
    this.initializeVAPID();
  }

  // Initialize VAPID keys
  private initializeVAPID(): void {
    // In a real implementation, these would be loaded from environment variables
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  }

  // Check if push notifications are supported
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 
           'serviceWorker' in navigator && 
           'PushManager' in window;
  }

  // Request notification permission
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    
    // Log permission request
    await auditLogger.logSystemEvent('notification_permission_requested', {
      permission,
      timestamp: new Date().toISOString(),
    });

    return permission;
  }

  // Subscribe to push notifications
  public async subscribe(userId: string): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    try {
      // Check if already subscribed
      const existingSubscription = await this.getExistingSubscription();
      if (existingSubscription) {
        this.subscriptions.set(userId, existingSubscription);
        return existingSubscription;
      }

      // Request permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      // Register service worker
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      // Store subscription
      this.subscriptions.set(userId, subscription);

      // Log subscription
      await auditLogger.logSystemEvent('push_notification_subscribed', {
        userId,
        endpoint: subscription.endpoint,
        timestamp: new Date().toISOString(),
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  public async unsubscribe(userId: string): Promise<boolean> {
    try {
      const subscription = this.subscriptions.get(userId);
      if (!subscription) {
        return false;
      }

      const success = await subscription.unsubscribe();
      if (success) {
        this.subscriptions.delete(userId);
        
        // Log unsubscription
        await auditLogger.logSystemEvent('push_notification_unsubscribed', {
          userId,
          timestamp: new Date().toISOString(),
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Get existing subscription
  private async getExistingSubscription(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription;
    } catch (error) {
      console.error('Failed to get existing subscription:', error);
      return null;
    }
  }

  // Send notification to user
  public async sendNotification(
    userId: string, 
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      const subscription = this.subscriptions.get(userId);
      if (!subscription) {
        console.warn('No subscription found for user:', userId);
        return false;
      }

      // Check user preferences
      const preferences = this.preferences.get(userId);
      if (preferences && !this.shouldSendNotification(preferences, payload)) {
        console.log('Notification blocked by user preferences');
        return false;
      }

      // Send notification via API
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          payload,
          userId,
        }),
      });

      if (response.ok) {
        // Log notification sent
        await auditLogger.logSystemEvent('push_notification_sent', {
          userId,
          title: payload.title,
          timestamp: new Date().toISOString(),
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  // Send notification to multiple users
  public async sendBulkNotification(
    userIds: string[], 
    payload: NotificationPayload
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const promises = userIds.map(async (userId) => {
      try {
        const success = await this.sendNotification(userId, payload);
        if (success) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
        failed++;
      }
    });

    await Promise.all(promises);

    return { sent, failed };
  }

  // Set notification preferences
  public setPreferences(userId: string, preferences: NotificationPreferences): void {
    this.preferences.set(userId, preferences);
  }

  // Get notification preferences
  public getPreferences(userId: string): NotificationPreferences | null {
    return this.preferences.get(userId) || null;
  }

  // Check if notification should be sent based on preferences
  private shouldSendNotification(
    preferences: NotificationPreferences, 
    payload: NotificationPayload
  ): boolean {
    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const startTime = this.parseTime(preferences.quietHours.start);
      const endTime = this.parseTime(preferences.quietHours.end);

      if (this.isInQuietHours(currentTime, startTime, endTime)) {
        return false;
      }
    }

    // Check notification type preferences
    const notificationType = payload.data?.type;
    switch (notificationType) {
      case 'property_alert':
        return preferences.propertyAlerts;
      case 'market_update':
        return preferences.marketUpdates;
      case 'price_change':
        return preferences.priceChanges;
      case 'new_listing':
        return preferences.newListings;
      case 'investment_opportunity':
        return preferences.investmentOpportunities;
      case 'system_update':
        return preferences.systemUpdates;
      default:
        return true;
    }
  }

  // Parse time string (HH:MM) to minutes
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Check if current time is in quiet hours
  private isInQuietHours(currentTime: number, startTime: number, endTime: number): boolean {
    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Create notification payloads for different types
  public createPropertyAlertPayload(property: any): NotificationPayload {
    return {
      title: 'New Property Alert',
      body: `Found ${property.bedrooms} bed property in ${property.postcode} for £${property.price?.toLocaleString()}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'property_alert',
        propertyId: property.id,
        url: `/property/${property.id}`,
      },
      actions: [
        {
          action: 'view',
          title: 'View Property',
          icon: '/icons/checkmark.png',
        },
        {
          action: 'add_to_watchlist',
          title: 'Add to Watchlist',
          icon: '/icons/plus.png',
        },
      ],
      vibrate: [100, 50, 100],
      requireInteraction: true,
      tag: `property-${property.id}`,
    };
  }

  public createMarketUpdatePayload(update: any): NotificationPayload {
    return {
      title: 'Market Update',
      body: `${update.region} property prices ${update.change > 0 ? 'increased' : 'decreased'} by ${Math.abs(update.change)}%`,
      icon: '/icons/icon-192x192.png',
      data: {
        type: 'market_update',
        region: update.region,
        change: update.change,
        url: '/market/analysis',
      },
      actions: [
        {
          action: 'view_analysis',
          title: 'View Analysis',
          icon: '/icons/chart.png',
        },
      ],
      tag: `market-${update.region}`,
    };
  }

  public createPriceChangePayload(property: any, oldPrice: number, newPrice: number): NotificationPayload {
    const change = newPrice - oldPrice;
    const changePercent = ((change / oldPrice) * 100).toFixed(1);
    
    return {
      title: 'Price Change Alert',
      body: `Property in ${property.postcode} price ${change > 0 ? 'increased' : 'decreased'} by £${Math.abs(change).toLocaleString()} (${changePercent}%)`,
      icon: '/icons/icon-192x192.png',
      data: {
        type: 'price_change',
        propertyId: property.id,
        oldPrice,
        newPrice,
        change,
        changePercent,
        url: `/property/${property.id}`,
      },
      actions: [
        {
          action: 'view_property',
          title: 'View Property',
          icon: '/icons/eye.png',
        },
      ],
      tag: `price-${property.id}`,
    };
  }

  // Convert VAPID key to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get subscription status
  public async getSubscriptionStatus(userId: string): Promise<{
    subscribed: boolean;
    permission: NotificationPermission;
    subscription?: PushSubscription;
  }> {
    const permission = Notification.permission;
    const subscription = this.subscriptions.get(userId);
    
    return {
      subscribed: !!subscription,
      permission,
      subscription: subscription || undefined,
    };
  }

  // Clear all subscriptions (for testing)
  public clearSubscriptions(): void {
    this.subscriptions.clear();
  }

  // Clear all preferences (for testing)
  public clearPreferences(): void {
    this.preferences.clear();
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();
