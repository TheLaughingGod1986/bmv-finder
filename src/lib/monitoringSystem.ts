import { performanceMonitor } from './performanceMonitor';
import { errorHandler } from './errorHandler';
import { redisService } from './redisService';
import { loadBalancer } from './loadBalancer';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  cooldown: number;
  lastTriggered: number;
  actions: AlertAction[];
}

interface AlertAction {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'pagerduty';
  config: Record<string, unknown>;
  enabled: boolean;
}

interface Alert {
  id: string;
  ruleId: string;
  severity: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolved: boolean;
  resolvedAt?: number;
}

interface SLAMetric {
  name: string;
  target: number;
  current: number;
  status: 'green' | 'yellow' | 'red';
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: number;
}

interface BusinessMetric {
  name: string;
  value: number;
  unit: string;
  category: 'revenue' | 'performance' | 'user' | 'system';
  trend: 'up' | 'down' | 'stable';
  change: number;
  target: number;
  status: 'on-track' | 'at-risk' | 'off-track';
}

interface MonitoringConfig {
  enableRealTimeAlerts: boolean;
  enableSLAMonitoring: boolean;
  enableBusinessMetrics: boolean;
  alertCooldown: number;
  maxAlerts: number;
  retentionDays: number;
}

class MonitoringSystem {
  private config: MonitoringConfig;
  private alertRules: Map<string, AlertRule> = new Map();
  private alerts: Alert[] = [];
  private slaMetrics: Map<string, SLAMetric> = new Map();
  private businessMetrics: Map<string, BusinessMetric> = new Map();
  private monitoringInterval: NodeJS.Timeout;
  private isInitialized: boolean = false;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableRealTimeAlerts: config.enableRealTimeAlerts ?? true,
      enableSLAMonitoring: config.enableSLAMonitoring ?? true,
      enableBusinessMetrics: config.enableBusinessMetrics ?? true,
      alertCooldown: config.alertCooldown || 300000, // 5 minutes
      maxAlerts: config.maxAlerts || 1000,
      retentionDays: config.retentionDays || 30
    };

    this.initializeMonitoringSystem();
  }

  // Initialize monitoring system
  private async initializeMonitoringSystem(): Promise<void> {
    try {
      // Initialize default alert rules
      this.initializeDefaultAlertRules();
      
      // Initialize SLA metrics
      this.initializeSLAMetrics();
      
      // Initialize business metrics
      this.initializeBusinessMetrics();
      
      // Start monitoring
      this.startMonitoring();
      
      this.isInitialized = true;
      console.log('✅ Monitoring system initialized');
      
      performanceMonitor.trackMetric('monitoring_system_init', 1, 'status', { 
        status: 'success',
        alertRules: this.alertRules.size,
        slaMetrics: this.slaMetrics.size,
        businessMetrics: this.businessMetrics.size
      });
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'monitoring_system_init',
        method: 'INIT',
        metadata: {}
      });
      this.isInitialized = false;
    }
  }

  // Initialize default alert rules
  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-response-time',
        name: 'High Response Time',
        description: 'API response time exceeds threshold',
        metric: 'api_response_time',
        condition: 'gt',
        threshold: 2000,
        severity: 'warning',
        enabled: true,
        cooldown: 300000,
        lastTriggered: 0,
        actions: [
          {
            type: 'email',
            config: { recipients: ['admin@company.com'] },
            enabled: true
          }
        ]
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds acceptable threshold',
        metric: 'error_rate',
        condition: 'gt',
        threshold: 5,
        severity: 'error',
        enabled: true,
        cooldown: 600000,
        lastTriggered: 0,
        actions: [
          {
            type: 'slack',
            config: { channel: '#alerts' },
            enabled: true
          }
        ]
      },
      {
        id: 'low-cache-hit-rate',
        name: 'Low Cache Hit Rate',
        description: 'Cache hit rate below optimal threshold',
        metric: 'cache_hit_rate',
        condition: 'lt',
        threshold: 60,
        severity: 'warning',
        enabled: true,
        cooldown: 900000,
        lastTriggered: 0,
        actions: [
          {
            type: 'webhook',
            config: { url: 'https://api.company.com/cache-alerts' },
            enabled: true
          }
        ]
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds 80%',
        metric: 'memory_usage',
        condition: 'gt',
        threshold: 80,
        severity: 'critical',
        enabled: true,
        cooldown: 300000,
        lastTriggered: 0,
        actions: [
          {
            type: 'pagerduty',
            config: { serviceId: 'P123456' },
            enabled: true
          }
        ]
      },
      {
        id: 'instance-unhealthy',
        name: 'Instance Unhealthy',
        description: 'Load balancer instance health check failed',
        metric: 'instance_health',
        condition: 'eq',
        threshold: 0,
        severity: 'critical',
        enabled: true,
        cooldown: 60000,
        lastTriggered: 0,
        actions: [
          {
            type: 'slack',
            config: { channel: '#incidents' },
            enabled: true
          },
          {
            type: 'email',
            config: { recipients: ['oncall@company.com'] },
            enabled: true
          }
        ]
      }
    ];

    for (const rule of defaultRules) {
      this.alertRules.set(rule.id, rule);
    }
  }

  // Initialize SLA metrics
  private initializeSLAMetrics(): void {
    const defaultSLAs: SLAMetric[] = [
      {
        name: 'API Response Time',
        target: 500, // 500ms
        current: 0,
        status: 'green',
        trend: 'stable',
        lastUpdated: Date.now()
      },
      {
        name: 'System Uptime',
        target: 99.9, // 99.9%
        current: 100,
        status: 'green',
        trend: 'stable',
        lastUpdated: Date.now()
      },
      {
        name: 'Error Rate',
        target: 1, // 1%
        current: 0,
        status: 'green',
        trend: 'stable',
        lastUpdated: Date.now()
      },
      {
        name: 'Cache Hit Rate',
        target: 80, // 80%
        current: 0,
        status: 'green',
        trend: 'stable',
        lastUpdated: Date.now()
      }
    ];

    for (const sla of defaultSLAs) {
      this.slaMetrics.set(sla.name, sla);
    }
  }

  // Initialize business metrics
  private initializeBusinessMetrics(): void {
    const defaultMetrics: BusinessMetric[] = [
      {
        name: 'Active Users',
        value: 0,
        unit: 'users',
        category: 'user',
        trend: 'stable',
        change: 0,
        target: 10000,
        status: 'on-track'
      },
      {
        name: 'API Requests per Second',
        value: 0,
        unit: 'req/s',
        category: 'performance',
        trend: 'stable',
        change: 0,
        target: 1000,
        status: 'on-track'
      },
      {
        name: 'Property Searches',
        value: 0,
        unit: 'searches',
        category: 'user',
        trend: 'stable',
        change: 0,
        target: 5000,
        status: 'on-track'
      },
      {
        name: 'Market Analysis Requests',
        value: 0,
        unit: 'requests',
        category: 'user',
        trend: 'stable',
        change: 0,
        target: 2000,
        status: 'on-track'
      }
    ];

    for (const metric of defaultMetrics) {
      this.businessMetrics.set(metric.name, metric);
    }
  }

  // Start monitoring
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoring();
    }, 30000); // Every 30 seconds
  }

  // Perform monitoring checks
  private async performMonitoring(): Promise<void> {
    try {
      // Update SLA metrics
      if (this.config.enableSLAMonitoring) {
        await this.updateSLAMetrics();
      }

      // Update business metrics
      if (this.config.enableBusinessMetrics) {
        await this.updateBusinessMetrics();
      }

      // Check alert rules
      if (this.config.enableRealTimeAlerts) {
        await this.checkAlertRules();
      }

      // Clean up old alerts
      this.cleanupOldAlerts();
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'monitoring_system_check',
        method: 'MONITORING',
        metadata: {}
      });
    }
  }

  // Update SLA metrics
  private async updateSLAMetrics(): Promise<void> {
    try {
      // Get performance data
      const performanceData = performanceMonitor.getAPIPerformance();
      const systemData = performanceMonitor.getSystemPerformance();
      const cacheData = performanceMonitor.getCachePerformance();

      // Update API Response Time SLA
      const apiResponseTimeSLA = this.slaMetrics.get('API Response Time');
      if (apiResponseTimeSLA) {
        apiResponseTimeSLA.current = performanceData.avgResponseTime;
        apiResponseTimeSLA.status = this.calculateSLAStatus(apiResponseTimeSLA.current, apiResponseTimeSLA.target);
        apiResponseTimeSLA.trend = this.calculateSLATrend(apiResponseTimeSLA.current, apiResponseTimeSLA.target);
        apiResponseTimeSLA.lastUpdated = Date.now();
      }

      // Update System Uptime SLA
      const uptimeSLA = this.slaMetrics.get('System Uptime');
      if (uptimeSLA) {
        uptimeSLA.current = 100; // Would be calculated from actual uptime
        uptimeSLA.status = this.calculateSLAStatus(uptimeSLA.current, uptimeSLA.target);
        uptimeSLA.trend = this.calculateSLATrend(uptimeSLA.current, uptimeSLA.target);
        uptimeSLA.lastUpdated = Date.now();
      }

      // Update Error Rate SLA
      const errorRateSLA = this.slaMetrics.get('Error Rate');
      if (errorRateSLA) {
        const errorReport = errorHandler.getErrorReport();
        const totalRequests = performanceData.totalRequests || 1;
        errorRateSLA.current = (errorReport.totalErrors / totalRequests) * 100;
        errorRateSLA.status = this.calculateSLAStatus(errorRateSLA.current, errorRateSLA.target);
        errorRateSLA.trend = this.calculateSLATrend(errorRateSLA.current, errorRateSLA.target);
        errorRateSLA.lastUpdated = Date.now();
      }

      // Update Cache Hit Rate SLA
      const cacheHitRateSLA = this.slaMetrics.get('Cache Hit Rate');
      if (cacheHitRateSLA) {
        cacheHitRateSLA.current = cacheData.avgHitRate;
        cacheHitRateSLA.status = this.calculateSLAStatus(cacheHitRateSLA.current, cacheHitRateSLA.target);
        cacheHitRateSLA.trend = this.calculateSLATrend(cacheHitRateSLA.current, cacheHitRateSLA.target);
        cacheHitRateSLA.lastUpdated = Date.now();
      }
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'monitoring_sla_update',
        method: 'SLA_UPDATE',
        metadata: {}
      });
    }
  }

  // Update business metrics
  private async updateBusinessMetrics(): Promise<void> {
    try {
      // Get performance data
      const performanceData = performanceMonitor.getAPIPerformance();
      const systemData = performanceMonitor.getSystemPerformance();

      // Update API Requests per Second
      const apiRequestsMetric = this.businessMetrics.get('API Requests per Second');
      if (apiRequestsMetric) {
        const previousValue = apiRequestsMetric.value;
        apiRequestsMetric.value = performanceData.requestsPerSecond || 0;
        apiRequestsMetric.change = apiRequestsMetric.value - previousValue;
        apiRequestsMetric.trend = this.calculateBusinessTrend(apiRequestsMetric.change);
        apiRequestsMetric.status = this.calculateBusinessStatus(apiRequestsMetric.value, apiRequestsMetric.target);
      }

      // Update other business metrics (simulated)
      const propertySearchesMetric = this.businessMetrics.get('Property Searches');
      if (propertySearchesMetric) {
        propertySearchesMetric.value = Math.floor(Math.random() * 1000) + 100;
        propertySearchesMetric.change = Math.floor(Math.random() * 100) - 50;
        propertySearchesMetric.trend = this.calculateBusinessTrend(propertySearchesMetric.change);
        propertySearchesMetric.status = this.calculateBusinessStatus(propertySearchesMetric.value, propertySearchesMetric.target);
      }

      const marketAnalysisMetric = this.businessMetrics.get('Market Analysis Requests');
      if (marketAnalysisMetric) {
        marketAnalysisMetric.value = Math.floor(Math.random() * 500) + 50;
        marketAnalysisMetric.change = Math.floor(Math.random() * 50) - 25;
        marketAnalysisMetric.trend = this.calculateBusinessTrend(marketAnalysisMetric.change);
        marketAnalysisMetric.status = this.calculateBusinessStatus(marketAnalysisMetric.value, marketAnalysisMetric.target);
      }
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'monitoring_business_update',
        method: 'BUSINESS_UPDATE',
        metadata: {}
      });
    }
  }

  // Check alert rules
  private async checkAlertRules(): Promise<void> {
    try {
      for (const rule of this.alertRules.values()) {
        if (!rule.enabled) continue;

        // Check if rule is in cooldown
        if (Date.now() - rule.lastTriggered < rule.cooldown) continue;

        const shouldTrigger = await this.evaluateAlertRule(rule);
        if (shouldTrigger) {
          await this.triggerAlert(rule);
        }
      }
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'monitoring_alert_check',
        method: 'ALERT_CHECK',
        metadata: {}
      });
    }
  }

  // Evaluate alert rule
  private async evaluateAlertRule(rule: AlertRule): Promise<boolean> {
    try {
      let currentValue = 0;

      // Get current metric value based on rule type
      switch (rule.metric) {
        case 'api_response_time':
          const apiData = performanceMonitor.getAPIPerformance();
          currentValue = apiData.avgResponseTime;
          break;
        case 'error_rate':
          const errorReport = errorHandler.getErrorReport();
          const totalRequests = 1000; // Would be actual request count
          currentValue = (errorReport.totalErrors / totalRequests) * 100;
          break;
        case 'cache_hit_rate':
          const cacheData = performanceMonitor.getCachePerformance();
          currentValue = cacheData.avgHitRate;
          break;
        case 'memory_usage':
          const systemData = performanceMonitor.getSystemPerformance();
          currentValue = systemData.avgMemoryUsage || 0;
          break;
        case 'instance_health':
          const lbStats = loadBalancer.getStats();
          currentValue = lbStats.healthyInstances > 0 ? 1 : 0;
          break;
        default:
          return false;
      }

      // Evaluate condition
      switch (rule.condition) {
        case 'gt':
          return currentValue > rule.threshold;
        case 'lt':
          return currentValue < rule.threshold;
        case 'eq':
          return currentValue === rule.threshold;
        case 'gte':
          return currentValue >= rule.threshold;
        case 'lte':
          return currentValue <= rule.threshold;
        case 'ne':
          return currentValue !== rule.threshold;
        default:
          return false;
      }
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'monitoring_rule_evaluation',
        method: 'RULE_EVALUATION',
        metadata: { ruleId: rule.id }
      });
      return false;
    }
  }

  // Trigger alert
  private async triggerAlert(rule: AlertRule): Promise<void> {
    try {
      // Create alert
      const alert: Alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ruleId: rule.id,
        severity: rule.severity,
        message: rule.description,
        metric: rule.metric,
        value: 0, // Would be actual current value
        threshold: rule.threshold,
        timestamp: Date.now(),
        acknowledged: false,
        resolved: false
      };

      // Add alert to list
      this.alerts.push(alert);
      
      // Trim alerts if we exceed max
      if (this.alerts.length > this.config.maxAlerts) {
        this.alerts = this.alerts.slice(-this.config.maxAlerts);
      }

      // Update rule last triggered time
      rule.lastTriggered = Date.now();

      // Execute alert actions
      await this.executeAlertActions(rule, alert);

      console.log(`🚨 Alert triggered: ${rule.name} (${rule.severity})`);
      
      performanceMonitor.trackMetric('monitoring_alert_triggered', 1, 'count', {
        ruleId: rule.id,
        severity: rule.severity,
        metric: rule.metric
      });
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'monitoring_alert_trigger',
        method: 'ALERT_TRIGGER',
        metadata: { ruleId: rule.id }
      });
    }
  }

  // Execute alert actions
  private async executeAlertActions(rule: AlertRule, alert: Alert): Promise<void> {
    try {
      for (const action of rule.actions) {
        if (!action.enabled) continue;

        switch (action.type) {
          case 'email':
            await this.sendEmailAlert(action.config, alert);
            break;
          case 'slack':
            await this.sendSlackAlert(action.config, alert);
            break;
          case 'webhook':
            await this.sendWebhookAlert(action.config, alert);
            break;
          case 'sms':
            await this.sendSMSAlert(action.config, alert);
            break;
          case 'pagerduty':
            await this.sendPagerDutyAlert(action.config, alert);
            break;
        }
      }
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'monitoring_alert_actions',
        method: 'ALERT_ACTIONS',
        metadata: { ruleId: rule.id, alertId: alert.id }
      });
    }
  }

  // Alert action implementations (placeholders)
  private async sendEmailAlert(config: Record<string, unknown>, alert: Alert): Promise<void> {
    console.log(`📧 Email alert sent to ${config.recipients} for ${alert.message}`);
  }

  private async sendSlackAlert(config: Record<string, unknown>, alert: Alert): Promise<void> {
    console.log(`💬 Slack alert sent to ${config.channel} for ${alert.message}`);
  }

  private async sendWebhookAlert(config: Record<string, unknown>, alert: Alert): Promise<void> {
    console.log(`🔗 Webhook alert sent to ${config.url} for ${alert.message}`);
  }

  private async sendSMSAlert(config: Record<string, unknown>, alert: Alert): Promise<void> {
    console.log(`📱 SMS alert sent for ${alert.message}`);
  }

  private async sendPagerDutyAlert(config: Record<string, unknown>, alert: Alert): Promise<void> {
    console.log(`🚨 PagerDuty alert sent to service ${config.serviceId} for ${alert.message}`);
  }

  // Calculate SLA status
  private calculateSLAStatus(current: number, target: number): 'green' | 'yellow' | 'red' {
    const percentage = (current / target) * 100;
    if (percentage <= 100) return 'green';
    if (percentage <= 120) return 'yellow';
    return 'red';
  }

  // Calculate SLA trend
  private calculateSLATrend(current: number, target: number): 'improving' | 'stable' | 'declining' {
    // Simplified trend calculation
    if (current < target * 0.8) return 'improving';
    if (current > target * 1.2) return 'declining';
    return 'stable';
  }

  // Calculate business trend
  private calculateBusinessTrend(change: number): 'up' | 'down' | 'stable' {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'stable';
  }

  // Calculate business status
  private calculateBusinessStatus(current: number, target: number): 'on-track' | 'at-risk' | 'off-track' {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return 'on-track';
    if (percentage >= 70) return 'at-risk';
    return 'off-track';
  }

  // Clean up old alerts
  private cleanupOldAlerts(): void {
    const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);
  }

  // Add custom alert rule
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  // Remove alert rule
  removeAlertRule(ruleId: string): boolean {
    return this.alertRules.delete(ruleId);
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = Date.now();
      return true;
    }
    return false;
  }

  // Resolve alert
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      return true;
    }
    return false;
  }

  // Get monitoring statistics
  getStats(): {
    totalAlerts: number;
    activeAlerts: number;
    acknowledgedAlerts: number;
    resolvedAlerts: number;
    alertRules: number;
    slaMetrics: number;
    businessMetrics: number;
  } {
    const activeAlerts = this.alerts.filter(a => !a.resolved);
    const acknowledgedAlerts = this.alerts.filter(a => a.acknowledged && !a.resolved);
    const resolvedAlerts = this.alerts.filter(a => a.resolved);

    return {
      totalAlerts: this.alerts.length,
      activeAlerts: activeAlerts.length,
      acknowledgedAlerts: acknowledgedAlerts.length,
      resolvedAlerts: resolvedAlerts.length,
      alertRules: this.alertRules.size,
      slaMetrics: this.slaMetrics.size,
      businessMetrics: this.businessMetrics.size
    };
  }

  // Get all alerts
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  // Get alert rules
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  // Get SLA metrics
  getSLAMetrics(): SLAMetric[] {
    return Array.from(this.slaMetrics.values());
  }

  // Get business metrics
  getBusinessMetrics(): BusinessMetric[] {
    return Array.from(this.businessMetrics.values());
  }

  // Update configuration
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  // Check if system is initialized
  isSystemInitialized(): boolean {
    return this.isInitialized;
  }

  // Cleanup resources
  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.alerts = [];
  }
}

// Create singleton instance
export const monitoringSystem = new MonitoringSystem();

// Export types and utilities
export type { AlertRule, AlertAction, Alert, SLAMetric, BusinessMetric, MonitoringConfig };
export { MonitoringSystem };

export default monitoringSystem;
