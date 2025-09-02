import { EventEmitter } from 'events';

// Alert severity levels
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Alert types
export enum AlertType {
  PERFORMANCE = 'performance',
  ERROR = 'error',
  SECURITY = 'security',
  CAPACITY = 'capacity',
  AVAILABILITY = 'availability'
}

// Alert interface
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: Date;
  acknowledged?: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

// Alert rule interface
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  condition: (metrics: any) => boolean;
  threshold?: number;
  cooldown?: number; // minutes
  enabled: boolean;
  channels: AlertChannel[];
  lastTriggered?: Date;
}

// Alert channel interface
export interface AlertChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

// Performance metrics interface
export interface PerformanceMetrics {
  timestamp: Date;
  api: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
  };
  database: {
    connectionPool: number;
    queryTime: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictions: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
  };
}

// Alert manager class
export class AlertManager extends EventEmitter {
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private channels: Map<string, AlertChannel> = new Map();
  private metricsHistory: PerformanceMetrics[] = [];
  private maxHistorySize = 1000;

  constructor() {
    super();
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
  }

  // Initialize default alert rules
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high_response_time',
        name: 'High API Response Time',
        description: 'API response time exceeds threshold',
        type: AlertType.PERFORMANCE,
        severity: AlertSeverity.HIGH,
        condition: (metrics) => metrics.api.responseTime > 2000,
        threshold: 2000,
        cooldown: 5,
        enabled: true,
        channels: []
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'API error rate exceeds threshold',
        type: AlertType.ERROR,
        severity: AlertSeverity.CRITICAL,
        condition: (metrics) => metrics.api.errorRate > 5,
        threshold: 5,
        cooldown: 2,
        enabled: true,
        channels: []
      },
      {
        id: 'low_uptime',
        name: 'Low Uptime',
        description: 'System uptime below threshold',
        type: AlertType.AVAILABILITY,
        severity: AlertSeverity.CRITICAL,
        condition: (metrics) => metrics.api.uptime < 99,
        threshold: 99,
        cooldown: 1,
        enabled: true,
        channels: []
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        description: 'System memory usage exceeds threshold',
        type: AlertType.CAPACITY,
        severity: AlertSeverity.MEDIUM,
        condition: (metrics) => metrics.system.memoryUsage > 80,
        threshold: 80,
        cooldown: 10,
        enabled: true,
        channels: []
      },
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        description: 'System CPU usage exceeds threshold',
        type: AlertType.CAPACITY,
        severity: AlertSeverity.MEDIUM,
        condition: (metrics) => metrics.system.cpuUsage > 85,
        threshold: 85,
        cooldown: 10,
        enabled: true,
        channels: []
      },
      {
        id: 'database_slow_queries',
        name: 'Database Slow Queries',
        description: 'High number of slow database queries',
        type: AlertType.PERFORMANCE,
        severity: AlertSeverity.MEDIUM,
        condition: (metrics) => metrics.database.slowQueries > 10,
        threshold: 10,
        cooldown: 15,
        enabled: true,
        channels: []
      },
      {
        id: 'low_cache_hit_rate',
        name: 'Low Cache Hit Rate',
        description: 'Cache hit rate below threshold',
        type: AlertType.PERFORMANCE,
        severity: AlertSeverity.LOW,
        condition: (metrics) => metrics.cache.hitRate < 70,
        threshold: 70,
        cooldown: 30,
        enabled: true,
        channels: []
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  // Initialize default alert channels
  private initializeDefaultChannels(): void {
    const defaultChannels: AlertChannel[] = [
      {
        id: 'console',
        name: 'Console Logging',
        type: 'webhook',
        config: {
          url: 'console://',
          format: 'text'
        },
        enabled: true
      },
      {
        id: 'email_admin',
        name: 'Admin Email',
        type: 'email',
        config: {
          to: process.env.ADMIN_EMAIL || 'admin@bmvfinder.com',
          from: process.env.ALERT_EMAIL || 'alerts@bmvfinder.com'
        },
        enabled: false
      }
    ];

    defaultChannels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });
  }

  // Add alert rule
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    console.log(`📋 Alert rule added: ${rule.name}`);
  }

  // Remove alert rule
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      console.log(`📋 Alert rule removed: ${ruleId}`);
    }
    return removed;
  }

  // Update alert rule
  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    const updatedRule = { ...rule, ...updates };
    this.rules.set(ruleId, updatedRule);
    console.log(`📋 Alert rule updated: ${ruleId}`);
    return true;
  }

  // Add alert channel
  addChannel(channel: AlertChannel): void {
    this.channels.set(channel.id, channel);
    console.log(`📡 Alert channel added: ${channel.name}`);
  }

  // Remove alert channel
  removeChannel(channelId: string): boolean {
    const removed = this.channels.delete(channelId);
    if (removed) {
      console.log(`📡 Alert channel removed: ${channelId}`);
    }
    return removed;
  }

  // Process metrics and check for alerts
  processMetrics(metrics: PerformanceMetrics): void {
    // Add to history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
    }

    // Check all enabled rules
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (rule.lastTriggered) {
        const cooldownMs = (rule.cooldown || 0) * 60 * 1000;
        if (Date.now() - rule.lastTriggered.getTime() < cooldownMs) {
          continue;
        }
      }

      // Check condition
      if (rule.condition(metrics)) {
        this.triggerAlert(rule, metrics);
        rule.lastTriggered = new Date();
      }
    }

    // Emit metrics event
    this.emit('metrics', metrics);
  }

  // Trigger alert
  private triggerAlert(rule: AlertRule, metrics: PerformanceMetrics): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: rule.type,
      severity: rule.severity,
      title: rule.name,
      message: rule.description,
      timestamp: new Date(),
      source: 'performance-monitor',
      metadata: {
        ruleId: rule.id,
        threshold: rule.threshold,
        currentValue: this.getCurrentValue(rule.id, metrics)
      }
    };

    this.alerts.set(alert.id, alert);

    // Send to channels
    this.sendAlert(alert, rule.channels);

    // Emit alert event
    this.emit('alert', alert);

    console.warn(`🚨 Alert triggered: ${alert.title} (${alert.severity})`);
  }

  // Get current value for alert
  private getCurrentValue(ruleId: string, metrics: PerformanceMetrics): number {
    switch (ruleId) {
      case 'high_response_time':
        return metrics.api.responseTime;
      case 'high_error_rate':
        return metrics.api.errorRate;
      case 'low_uptime':
        return metrics.api.uptime;
      case 'high_memory_usage':
        return metrics.system.memoryUsage;
      case 'high_cpu_usage':
        return metrics.system.cpuUsage;
      case 'database_slow_queries':
        return metrics.database.slowQueries;
      case 'low_cache_hit_rate':
        return metrics.cache.hitRate;
      default:
        return 0;
    }
  }

  // Send alert to channels
  private async sendAlert(alert: Alert, channels: AlertChannel[]): Promise<void> {
    for (const channel of channels) {
      if (!channel.enabled) continue;

      try {
        await this.sendToChannel(alert, channel);
      } catch (error) {
        console.error(`❌ Failed to send alert to channel ${channel.name}:`, error);
      }
    }
  }

  // Send alert to specific channel
  private async sendToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
    const message = this.formatAlertMessage(alert);

    switch (channel.type) {
      case 'console':
        console.log(`🚨 ALERT: ${message}`);
        break;
      case 'email':
        await this.sendEmail(channel, alert, message);
        break;
      case 'slack':
        await this.sendSlack(channel, alert, message);
        break;
      case 'webhook':
        await this.sendWebhook(channel, alert, message);
        break;
      case 'sms':
        await this.sendSMS(channel, alert, message);
        break;
    }
  }

  // Format alert message
  private formatAlertMessage(alert: Alert): string {
    return `${alert.title}\n` +
           `Severity: ${alert.severity.toUpperCase()}\n` +
           `Type: ${alert.type}\n` +
           `Message: ${alert.message}\n` +
           `Time: ${alert.timestamp.toISOString()}\n` +
           `Source: ${alert.source}`;
  }

  // Send email alert
  private async sendEmail(channel: AlertChannel, alert: Alert, message: string): Promise<void> {
    // Implementation would depend on email service (SendGrid, AWS SES, etc.)
    console.log(`📧 Email alert sent to ${channel.config.to}: ${alert.title}`);
  }

  // Send Slack alert
  private async sendSlack(channel: AlertChannel, alert: Alert, message: string): Promise<void> {
    // Implementation would use Slack webhook
    console.log(`💬 Slack alert sent to ${channel.config.channel}: ${alert.title}`);
  }

  // Send webhook alert
  private async sendWebhook(channel: AlertChannel, alert: Alert, message: string): Promise<void> {
    const response = await fetch(channel.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BMV-Finder-Alerts/1.0'
      },
      body: JSON.stringify({
        alert,
        message,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  // Send SMS alert
  private async sendSMS(channel: AlertChannel, alert: Alert, message: string): Promise<void> {
    // Implementation would depend on SMS service (Twilio, AWS SNS, etc.)
    console.log(`📱 SMS alert sent to ${channel.config.to}: ${alert.title}`);
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    this.emit('alert-acknowledged', alert);
    return true;
  }

  // Resolve alert
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();

    this.emit('alert-resolved', alert);
    return true;
  }

  // Get active alerts
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  // Get all alerts
  getAllAlerts(limit?: number): Alert[] {
    const alerts = Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? alerts.slice(0, limit) : alerts;
  }

  // Get alert rules
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  // Get alert channels
  getChannels(): AlertChannel[] {
    return Array.from(this.channels.values());
  }

  // Get metrics history
  getMetricsHistory(limit?: number): PerformanceMetrics[] {
    const history = [...this.metricsHistory]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? history.slice(0, limit) : history;
  }

  // Get alert statistics
  getAlertStats(): {
    total: number;
    active: number;
    resolved: number;
    bySeverity: Record<AlertSeverity, number>;
    byType: Record<AlertType, number>;
  } {
    const alerts = Array.from(this.alerts.values());
    
    const stats = {
      total: alerts.length,
      active: alerts.filter(a => !a.resolved).length,
      resolved: alerts.filter(a => a.resolved).length,
      bySeverity: {
        [AlertSeverity.LOW]: 0,
        [AlertSeverity.MEDIUM]: 0,
        [AlertSeverity.HIGH]: 0,
        [AlertSeverity.CRITICAL]: 0
      },
      byType: {
        [AlertType.PERFORMANCE]: 0,
        [AlertType.ERROR]: 0,
        [AlertType.SECURITY]: 0,
        [AlertType.CAPACITY]: 0,
        [AlertType.AVAILABILITY]: 0
      }
    };

    alerts.forEach(alert => {
      stats.bySeverity[alert.severity]++;
      stats.byType[alert.type]++;
    });

    return stats;
  }

  // Clear old alerts
  clearOldAlerts(olderThanDays: number = 30): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    let cleared = 0;
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.timestamp < cutoff) {
        this.alerts.delete(id);
        cleared++;
      }
    }

    console.log(`🧹 Cleared ${cleared} old alerts`);
    return cleared;
  }
}

// Singleton alert manager instance
let alertManager: AlertManager | null = null;

export function getAlertManager(): AlertManager {
  if (!alertManager) {
    alertManager = new AlertManager();
  }
  return alertManager;
}
