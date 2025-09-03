import { auditLogger } from '../audit/auditLogger';

export interface PushNotificationConfig {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  gcmSenderId?: string;
  endpoint: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  sound?: string;
  tag?: string;
  renotify?: boolean;
  timestamp?: number;
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
}

export interface SubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent: string;
  timestamp: number;
  userId?: string;
}

export interface NotificationPreferences {
  userId: string;
  propertyAlerts: boolean;
  marketUpdates: boolean;
  priceChanges: boolean;
  newListings: boolean;
  investmentOpportunities: boolean;
  systemNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
}

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private config: PushNotificationConfig | null = null;
  private subscriptions: Map<string, SubscriptionData> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private isSupported: boolean = false;

  private constructor() {
    this.checkSupport();
    this.loadStoredSubscriptions();
    this.loadUserPreferences();
  }

  public static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  // Initialize push notification system
  async initialize(config: PushNotificationConfig): Promise<boolean> {
    try {
      this.config = config;
      
      if (!this.isSupported) {
        console.warn('Push notifications not supported');
        return false;
      }

      // Register service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw-enhanced.js');
        console.log('Service Worker registered for push notifications');
        
        // Check for existing subscription
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          await this.handleSubscription(existingSubscription);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Request permission and subscribe to push notifications
  async subscribe(userId?: string): Promise<boolean> {
    try {
      if (!this.isSupported || !this.config) {
        throw new Error('Push notifications not supported or not configured');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Register service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Create subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.config.vapidPublicKey)
      });

      // Store subscription
      await this.handleSubscription(subscription, userId);

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription, userId);

      console.log('Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.isSupported) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription);
        this.subscriptions.delete(subscription.endpoint);
        localStorage.removeItem('push-subscription');
        console.log('Successfully unsubscribed from push notifications');
      }

      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Send push notification
  async sendNotification(
    payload: NotificationPayload,
    targetUsers?: string[],
    userId?: string
  ): Promise<boolean> {
    try {
      if (!this.config) {
        throw new Error('Push notification system not configured');
      }

      // Check if user has notifications enabled
      if (userId && !this.isNotificationEnabled(userId, payload)) {
        return false;
      }

      // Get target subscriptions
      const subscriptions = this.getTargetSubscriptions(targetUsers, userId);
      
      if (subscriptions.length === 0) {
        console.log('No active subscriptions found');
        return false;
      }

      // Send notifications
      const results = await Promise.allSettled(
        subscriptions.map(subscription => this.sendToSubscription(payload, subscription))
      );

      const successCount = results.filter(result => result.status === 'fulfilled').length;
      console.log(`Sent ${successCount}/${subscriptions.length} push notifications`);

      // Log notification send
      if (userId) {
        await auditLogger.logUserAction('push_notification_sent', {
          title: payload.title,
          targetUsers: targetUsers?.length || 0,
          successCount,
          totalSubscriptions: subscriptions.length
        }, userId);
      }

      return successCount > 0;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  // Send property alert notification
  async sendPropertyAlert(
    property: any,
    userId: string,
    alertType: 'new_listing' | 'price_change' | 'status_change'
  ): Promise<boolean> {
    const preferences = this.preferences.get(userId);
    if (!preferences?.propertyAlerts) {
      return false;
    }

    const payload: NotificationPayload = {
      title: this.getPropertyAlertTitle(alertType),
      body: this.getPropertyAlertBody(property, alertType),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'property_alert',
        propertyId: property.id,
        alertType,
        url: `/property/${property.id}`
      },
      actions: [
        {
          action: 'view',
          title: 'View Property',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'add_to_watchlist',
          title: 'Add to Watchlist',
          icon: '/icons/watchlist-icon.png'
        }
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200],
      tag: `property-${property.id}-${alertType}`
    };

    return this.sendNotification(payload, [userId], userId);
  }

  // Send market update notification
  async sendMarketUpdate(
    region: string,
    updateType: 'price_trend' | 'new_development' | 'market_analysis',
    userId: string
  ): Promise<boolean> {
    const preferences = this.preferences.get(userId);
    if (!preferences?.marketUpdates) {
      return false;
    }

    const payload: NotificationPayload = {
      title: 'Market Update',
      body: this.getMarketUpdateBody(region, updateType),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'market_update',
        region,
        updateType,
        url: `/market/analysis?region=${encodeURIComponent(region)}`
      },
      actions: [
        {
          action: 'view',
          title: 'View Analysis',
          icon: '/icons/analysis-icon.png'
        }
      ],
      tag: `market-${region}-${updateType}`
    };

    return this.sendNotification(payload, [userId], userId);
  }

  // Send investment opportunity notification
  async sendInvestmentOpportunity(
    opportunity: any,
    userId: string
  ): Promise<boolean> {
    const preferences = this.preferences.get(userId);
    if (!preferences?.investmentOpportunities) {
      return false;
    }

    const payload: NotificationPayload = {
      title: 'Investment Opportunity',
      body: `New ${opportunity.type} opportunity in ${opportunity.region}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'investment_opportunity',
        opportunityId: opportunity.id,
        url: `/opportunities/${opportunity.id}`
      },
      actions: [
        {
          action: 'view',
          title: 'View Opportunity',
          icon: '/icons/opportunity-icon.png'
        },
        {
          action: 'analyze',
          title: 'Analyze',
          icon: '/icons/analyze-icon.png'
        }
      ],
      requireInteraction: true,
      tag: `opportunity-${opportunity.id}`
    };

    return this.sendNotification(payload, [userId], userId);
  }

  // Update user notification preferences
  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    const currentPreferences = this.preferences.get(userId) || this.getDefaultPreferences(userId);
    const updatedPreferences = { ...currentPreferences, ...preferences };
    
    this.preferences.set(userId, updatedPreferences);
    localStorage.setItem(`notification-preferences-${userId}`, JSON.stringify(updatedPreferences));

    // Send preferences to server
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preferences: updatedPreferences })
      });
    } catch (error) {
      console.error('Failed to update preferences on server:', error);
    }
  }

  // Get user notification preferences
  getPreferences(userId: string): NotificationPreferences {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId);
  }

  // Check if notifications are enabled for user and type
  isNotificationEnabled(userId: string, payload: NotificationPayload): boolean {
    const preferences = this.preferences.get(userId);
    if (!preferences) return false;

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const startTime = this.timeToMinutes(preferences.quietHours.start);
      const endTime = this.timeToMinutes(preferences.quietHours.end);
      
      if (currentTime >= startTime && currentTime <= endTime) {
        return false;
      }
    }

    // Check notification type
    const data = payload.data;
    if (data?.type === 'property_alert' && !preferences.propertyAlerts) return false;
    if (data?.type === 'market_update' && !preferences.marketUpdates) return false;
    if (data?.type === 'investment_opportunity' && !preferences.investmentOpportunities) return false;
    if (data?.type === 'system' && !preferences.systemNotifications) return false;

    return true;
  }

  // Get subscription status
  async getSubscriptionStatus(): Promise<{
    isSubscribed: boolean;
    permission: NotificationPermission;
    endpoint?: string;
  }> {
    if (!this.isSupported) {
      return { isSubscribed: false, permission: 'denied' };
    }

    const permission = Notification.permission;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return {
      isSubscribed: !!subscription,
      permission,
      endpoint: subscription?.endpoint
    };
  }

  // Private helper methods
  private checkSupport(): void {
    this.isSupported = !!(
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  private async loadStoredSubscriptions(): Promise<void> {
    try {
      const stored = localStorage.getItem('push-subscription');
      if (stored) {
        const subscription = JSON.parse(stored);
        this.subscriptions.set(subscription.endpoint, subscription);
      }
    } catch (error) {
      console.error('Failed to load stored subscriptions:', error);
    }
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('notification-preferences-'));
      for (const key of keys) {
        const userId = key.replace('notification-preferences-', '');
        const preferences = JSON.parse(localStorage.getItem(key) || '{}');
        this.preferences.set(userId, preferences);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  }

  private async handleSubscription(subscription: PushSubscription, userId?: string): Promise<void> {
    const subscriptionData: SubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      },
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      userId
    };

    this.subscriptions.set(subscription.endpoint, subscriptionData);
    localStorage.setItem('push-subscription', JSON.stringify(subscriptionData));
  }

  private async sendSubscriptionToServer(subscription: PushSubscription, userId?: string): Promise<void> {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
              auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
            }
          },
          userId,
          userAgent: navigator.userAgent
        })
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  private getTargetSubscriptions(targetUsers?: string[], userId?: string): SubscriptionData[] {
    if (targetUsers) {
      return Array.from(this.subscriptions.values()).filter(sub => 
        sub.userId && targetUsers.includes(sub.userId)
      );
    } else if (userId) {
      return Array.from(this.subscriptions.values()).filter(sub => sub.userId === userId);
    } else {
      return Array.from(this.subscriptions.values());
    }
  }

  private async sendToSubscription(payload: NotificationPayload, subscription: SubscriptionData): Promise<void> {
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          payload
        })
      });
    } catch (error) {
      console.error('Failed to send to subscription:', error);
      throw error;
    }
  }

  private getPropertyAlertTitle(alertType: string): string {
    switch (alertType) {
      case 'new_listing': return 'New Property Listing';
      case 'price_change': return 'Price Change Alert';
      case 'status_change': return 'Property Status Update';
      default: return 'Property Alert';
    }
  }

  private getPropertyAlertBody(property: any, alertType: string): string {
    switch (alertType) {
      case 'new_listing':
        return `New ${property.propertyType} in ${property.postcode} - £${property.price?.toLocaleString()}`;
      case 'price_change':
        return `${property.address} price changed to £${property.price?.toLocaleString()}`;
      case 'status_change':
        return `${property.address} status updated`;
      default:
        return `Update for ${property.address}`;
    }
  }

  private getMarketUpdateBody(region: string, updateType: string): string {
    switch (updateType) {
      case 'price_trend':
        return `Price trends updated for ${region}`;
      case 'new_development':
        return `New development announced in ${region}`;
      case 'market_analysis':
        return `Market analysis available for ${region}`;
      default:
        return `Market update for ${region}`;
    }
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      propertyAlerts: true,
      marketUpdates: true,
      priceChanges: true,
      newListings: true,
      investmentOpportunities: true,
      systemNotifications: true,
      emailNotifications: false,
      smsNotifications: false,
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

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

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Export singleton instance
export const pushNotificationManager = PushNotificationManager.getInstance();
