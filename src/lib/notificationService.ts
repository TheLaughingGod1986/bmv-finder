// Real-time notification service for property alerts and system notifications

interface NotificationPayload {
  id: string;
  type: 'property_alert' | 'market_update' | 'system_alert' | 'portfolio_update' | 'price_drop' | 'new_listing';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: number;
  read: boolean;
  userId?: string;
  channels: NotificationChannel[];
}

interface NotificationChannel {
  type: 'push' | 'email' | 'sms' | 'in_app' | 'webhook';
  enabled: boolean;
  config?: any;
}

interface NotificationRule {
  id: string;
  userId: string;
  name: string;
  type: string;
  conditions: NotificationCondition[];
  channels: NotificationChannel[];
  enabled: boolean;
  createdAt: number;
  lastTriggered?: number;
}

interface NotificationCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'between' | 'in';
  value: any;
  value2?: any; // For 'between' operator
}

interface NotificationTemplate {
  id: string;
  type: string;
  title: string;
  message: string;
  variables: string[];
  channels: NotificationChannel[];
}

class NotificationService {
  private notifications: Map<string, NotificationPayload> = new Map();
  private rules: Map<string, NotificationRule> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private subscribers: Map<string, Set<(notification: NotificationPayload) => void>> = new Map();
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.initializeTemplates();
    this.initializeEventSource();
  }

  // Initialize notification templates
  private initializeTemplates() {
    const templates: NotificationTemplate[] = [
      {
        id: 'property_price_drop',
        type: 'price_drop',
        title: '💰 Price Drop Alert',
        message: 'Property at {address} has dropped by {percentage}% to {new_price}. BMV Score: {bmv_score}%',
        variables: ['address', 'percentage', 'new_price', 'bmv_score'],
        channels: [
          { type: 'push', enabled: true },
          { type: 'email', enabled: true },
          { type: 'in_app', enabled: true }
        ]
      },
      {
        id: 'new_bmv_property',
        type: 'new_listing',
        title: '🏠 New BMV Property Found',
        message: 'New below market value property found: {address}. BMV Score: {bmv_score}%, Estimated Value: {estimated_value}',
        variables: ['address', 'bmv_score', 'estimated_value'],
        channels: [
          { type: 'push', enabled: true },
          { type: 'email', enabled: true },
          { type: 'in_app', enabled: true }
        ]
      },
      {
        id: 'market_trend_alert',
        type: 'market_update',
        title: '📈 Market Trend Alert',
        message: 'Market trend detected in {area}: {trend_type} of {percentage}% over {period}',
        variables: ['area', 'trend_type', 'percentage', 'period'],
        channels: [
          { type: 'push', enabled: true },
          { type: 'email', enabled: false },
          { type: 'in_app', enabled: true }
        ]
      },
      {
        id: 'portfolio_performance',
        type: 'portfolio_update',
        title: '📊 Portfolio Update',
        message: 'Your portfolio performance: {performance}% this month. Top performer: {top_property}',
        variables: ['performance', 'top_property'],
        channels: [
          { type: 'push', enabled: true },
          { type: 'email', enabled: true },
          { type: 'in_app', enabled: true }
        ]
      },
      {
        id: 'system_maintenance',
        type: 'system_alert',
        title: '🔧 System Maintenance',
        message: 'Scheduled maintenance will begin at {start_time}. Expected duration: {duration}',
        variables: ['start_time', 'duration'],
        channels: [
          { type: 'push', enabled: true },
          { type: 'email', enabled: true },
          { type: 'in_app', enabled: true }
        ]
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Initialize Server-Sent Events for real-time notifications
  private initializeEventSource() {
    if (typeof window === 'undefined') return;

    try {
      this.eventSource = new EventSource('/api/notifications/stream');
      
      this.eventSource.onopen = () => {
        console.log('Notification stream connected');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const notification: NotificationPayload = JSON.parse(event.data);
          this.handleIncomingNotification(notification);
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      };

      this.eventSource.onerror = () => {
        console.error('Notification stream error');
        this.handleReconnection();
      };

      this.eventSource.addEventListener('notification', (event) => {
        try {
          const notification: NotificationPayload = JSON.parse(event.data);
          this.handleIncomingNotification(notification);
        } catch (error) {
          console.error('Failed to parse notification event:', error);
        }
      });

    } catch (error) {
      console.error('Failed to initialize notification stream:', error);
    }
  }

  // Handle reconnection logic
  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      setTimeout(() => {
        console.log(`Attempting to reconnect notification stream (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initializeEventSource();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached for notification stream');
    }
  }

  // Handle incoming notifications
  private handleIncomingNotification(notification: NotificationPayload) {
    // Store notification
    this.notifications.set(notification.id, notification);

    // Notify subscribers
    const subscribers = this.subscribers.get(notification.userId || 'global') || new Set();
    subscribers.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });

    // Show browser notification if permission granted
    this.showBrowserNotification(notification);

    // Update notification count
    this.updateNotificationCount();
  }

  // Show browser notification
  private showBrowserNotification(notification: NotificationPayload) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: notification.id,
        data: notification.data,
        requireInteraction: notification.priority === 'urgent',
        silent: notification.priority === 'low'
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        this.markAsRead(notification.id);
      };

      // Auto-close after 5 seconds for non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    }
  }

  // Subscribe to notifications
  subscribe(userId: string, callback: (notification: NotificationPayload) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    
    this.subscribers.get(userId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(userId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(userId);
        }
      }
    };
  }

  // Create notification rule
  createRule(rule: Omit<NotificationRule, 'id' | 'createdAt'>): string {
    const id = this.generateId();
    const newRule: NotificationRule = {
      ...rule,
      id,
      createdAt: Date.now()
    };

    this.rules.set(id, newRule);
    return id;
  }

  // Update notification rule
  updateRule(id: string, updates: Partial<NotificationRule>): boolean {
    const rule = this.rules.get(id);
    if (!rule) return false;

    this.rules.set(id, { ...rule, ...updates });
    return true;
  }

  // Delete notification rule
  deleteRule(id: string): boolean {
    return this.rules.delete(id);
  }

  // Get user's notification rules
  getUserRules(userId: string): NotificationRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.userId === userId);
  }

  // Send notification
  async sendNotification(notification: Omit<NotificationPayload, 'id' | 'timestamp' | 'read'>): Promise<string> {
    const id = this.generateId();
    const fullNotification: NotificationPayload = {
      ...notification,
      id,
      timestamp: Date.now(),
      read: false
    };

    // Store notification
    this.notifications.set(id, fullNotification);

    // Send to server
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullNotification)
      });
    } catch (error) {
      console.error('Failed to send notification to server:', error);
    }

    // Handle locally
    this.handleIncomingNotification(fullNotification);

    return id;
  }

  // Send templated notification
  async sendTemplatedNotification(
    templateId: string,
    userId: string,
    variables: Record<string, any>,
    data?: any
  ): Promise<string | null> {
    const template = this.templates.get(templateId);
    if (!template) {
      console.error(`Template ${templateId} not found`);
      return null;
    }

    // Replace variables in template
    let title = template.title;
    let message = template.message;

    template.variables.forEach(variable => {
      const value = variables[variable] || `{${variable}}`;
      title = title.replace(`{${variable}}`, value);
      message = message.replace(`{${variable}}`, value);
    });

    return this.sendNotification({
      type: template.type as any,
      title,
      message,
      data,
      priority: 'medium',
      userId,
      channels: template.channels
    });
  }

  // Mark notification as read
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.read = true;
    this.notifications.set(notificationId, notification);
    this.updateNotificationCount();
    return true;
  }

  // Mark all notifications as read
  markAllAsRead(userId?: string): number {
    let count = 0;
    this.notifications.forEach((notification, id) => {
      if (!notification.read && (!userId || notification.userId === userId)) {
        notification.read = true;
        this.notifications.set(id, notification);
        count++;
      }
    });
    
    if (count > 0) {
      this.updateNotificationCount();
    }
    
    return count;
  }

  // Get notifications
  getNotifications(userId?: string, limit: number = 50): NotificationPayload[] {
    const notifications = Array.from(this.notifications.values())
      .filter(notification => !userId || notification.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return notifications;
  }

  // Get unread count
  getUnreadCount(userId?: string): number {
    return Array.from(this.notifications.values())
      .filter(notification => 
        !notification.read && 
        (!userId || notification.userId === userId)
      ).length;
  }

  // Update notification count in UI
  private updateNotificationCount() {
    const count = this.getUnreadCount();
    
    // Update document title
    if (count > 0) {
      document.title = `(${count}) Property Intelligence Platform`;
    } else {
      document.title = 'Property Intelligence Platform';
    }

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('notificationCountUpdate', { 
      detail: { count } 
    }));
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Cleanup
  destroy() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.subscribers.clear();
    this.notifications.clear();
    this.rules.clear();
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get notification statistics
  getStats(): { total: number; unread: number; byType: Record<string, number> } {
    const notifications = Array.from(this.notifications.values());
    const byType: Record<string, number> = {};

    notifications.forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
    });

    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType
    };
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Export types
export type { 
  NotificationPayload, 
  NotificationChannel, 
  NotificationRule, 
  NotificationCondition, 
  NotificationTemplate 
};
