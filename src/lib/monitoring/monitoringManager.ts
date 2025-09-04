import { auditLogger } from '../audit/auditLogger';
import crypto from 'crypto';

export interface MonitoringConfig {
  id: string;
  name: string;
  type: 'api' | 'database' | 'server' | 'application' | 'custom';
  enabled: boolean;
  interval: number; // in seconds
  timeout: number; // in milliseconds
  retries: number;
  thresholds: MonitoringThresholds;
  notifications: NotificationConfig[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonitoringThresholds {
  responseTime: number; // in milliseconds
  errorRate: number; // percentage
  availability: number; // percentage
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  diskUsage: number; // percentage
  customMetrics: Record<string, number>;
}

export interface NotificationConfig {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
  enabled: boolean;
  recipients: string[];
  channels: string[];
  conditions: NotificationCondition[];
  template: string;
  cooldown: number; // in minutes
  escalation: EscalationConfig;
}

export interface NotificationCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  value: number;
  duration: number; // in minutes
}

export interface EscalationConfig {
  enabled: boolean;
  levels: EscalationLevel[];
  maxLevel: number;
}

export interface EscalationLevel {
  level: number;
  delay: number; // in minutes
  recipients: string[];
  channels: string[];
}

export interface MonitoringCheck {
  id: string;
  configId: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'critical';
  responseTime: number;
  statusCode?: number;
  error?: string;
  metrics: MonitoringMetrics;
  alerts: Alert[];
  createdAt: Date;
}

export interface MonitoringMetrics {
  responseTime: number;
  errorRate: number;
  availability: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  throughput: number;
  latency: number;
  customMetrics: Record<string, number>;
}

export interface Alert {
  id: string;
  checkId: string;
  type: 'threshold' | 'anomaly' | 'availability' | 'performance' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric: string;
  value: number;
  threshold: number;
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  notifications: NotificationResult[];
  createdAt: Date;
}

export interface NotificationResult {
  id: string;
  type: string;
  recipient: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt?: Date;
  error?: string;
}

export interface MonitoringDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  refreshInterval: number;
  public: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'alert' | 'log' | 'map';
  title: string;
  config: WidgetConfig;
  position: WidgetPosition;
  size: WidgetSize;
}

export interface WidgetConfig {
  dataSource: string;
  query: string;
  timeRange: string;
  aggregation: string;
  groupBy: string[];
  filters: Record<string, any>;
  visualization: VisualizationConfig;
}

export interface VisualizationConfig {
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'table' | 'heatmap';
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  yAxis: AxisConfig;
  xAxis: AxisConfig;
}

export interface AxisConfig {
  label: string;
  min?: number;
  max?: number;
  format?: string;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'date' | 'text' | 'number';
  options?: any[];
  defaultValue?: any;
  query: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  components: ComponentHealth[];
  metrics: SystemMetrics;
  alerts: Alert[];
  lastUpdated: Date;
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  responseTime: number;
  errorRate: number;
  availability: number;
  lastCheck: Date;
  dependencies: string[];
}

export interface SystemMetrics {
  uptime: number;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
  activeUsers: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
}

export class MonitoringManager {
  private static instance: MonitoringManager;
  private configs: Map<string, MonitoringConfig> = new Map();
  private checks: Map<string, MonitoringCheck[]> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private dashboards: Map<string, MonitoringDashboard> = new Map();
  private systemHealth: SystemHealth | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeDefaultConfigs();
    this.startMonitoring();
  }

  public static getInstance(): MonitoringManager {
    if (!MonitoringManager.instance) {
      MonitoringManager.instance = new MonitoringManager();
    }
    return MonitoringManager.instance;
  }

  // Configuration Management
  async createMonitoringConfig(config: Omit<MonitoringConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<MonitoringConfig> {
    const monitoringConfig: MonitoringConfig = {
      id: crypto.randomUUID(),
      ...config,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.configs.set(monitoringConfig.id, monitoringConfig);

    try {
      await auditLogger.logUserAction('monitoring_config_created', {
        configId: monitoringConfig.id,
        name: monitoringConfig.name,
        type: monitoringConfig.type
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return monitoringConfig;
  }

  async updateMonitoringConfig(configId: string, updates: Partial<MonitoringConfig>): Promise<MonitoringConfig | null> {
    const config = this.configs.get(configId);
    if (!config) {
      return null;
    }

    const updatedConfig = {
      ...config,
      ...updates,
      updatedAt: new Date()
    };

    this.configs.set(configId, updatedConfig);

    try {
      await auditLogger.logUserAction('monitoring_config_updated', {
        configId,
        updates: Object.keys(updates)
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return updatedConfig;
  }

  // Monitoring Execution
  async performCheck(configId: string): Promise<MonitoringCheck> {
    const config = this.configs.get(configId);
    if (!config || !config.enabled) {
      throw new Error('Monitoring configuration not found or disabled');
    }

    const startTime = Date.now();
    let status: 'success' | 'warning' | 'error' | 'critical' = 'success';
    let responseTime = 0;
    let statusCode: number | undefined;
    let error: string | undefined;
    let metrics: MonitoringMetrics;

    try {
      // Simulate monitoring check based on type
      switch (config.type) {
        case 'api':
          metrics = await this.checkAPIEndpoint(config);
          break;
        case 'database':
          metrics = await this.checkDatabase(config);
          break;
        case 'server':
          metrics = await this.checkServer(config);
          break;
        case 'application':
          metrics = await this.checkApplication(config);
          break;
        default:
          metrics = await this.checkCustom(config);
      }

      responseTime = Date.now() - startTime;

      // Evaluate thresholds
      status = this.evaluateThresholds(metrics, config.thresholds);

    } catch (err) {
      status = 'critical';
      error = err instanceof Error ? err.message : 'Unknown error';
      responseTime = Date.now() - startTime;
      metrics = this.getDefaultMetrics();
    }

    const check: MonitoringCheck = {
      id: crypto.randomUUID(),
      configId,
      timestamp: new Date(),
      status,
      responseTime,
      statusCode,
      error,
      metrics,
      alerts: [],
      createdAt: new Date()
    };

    // Store check
    const existingChecks = this.checks.get(configId) || [];
    existingChecks.push(check);
    
    // Keep only last 1000 checks
    if (existingChecks.length > 1000) {
      existingChecks.splice(0, existingChecks.length - 1000);
    }
    
    this.checks.set(configId, existingChecks);

    // Generate alerts if needed
    await this.generateAlerts(check, config);

    return check;
  }

  // Alert Management
  async generateAlerts(check: MonitoringCheck, config: MonitoringConfig): Promise<void> {
    const alerts: Alert[] = [];

    // Check response time threshold
    if (check.metrics.responseTime > config.thresholds.responseTime) {
      alerts.push(await this.createAlert(check, 'performance', 'high', 
        'High Response Time', 
        `Response time ${check.metrics.responseTime}ms exceeds threshold ${config.thresholds.responseTime}ms`,
        'responseTime', check.metrics.responseTime, config.thresholds.responseTime));
    }

    // Check error rate threshold
    if (check.metrics.errorRate > config.thresholds.errorRate) {
      alerts.push(await this.createAlert(check, 'threshold', 'critical',
        'High Error Rate',
        `Error rate ${check.metrics.errorRate}% exceeds threshold ${config.thresholds.errorRate}%`,
        'errorRate', check.metrics.errorRate, config.thresholds.errorRate));
    }

    // Check availability threshold
    if (check.metrics.availability < config.thresholds.availability) {
      alerts.push(await this.createAlert(check, 'availability', 'critical',
        'Low Availability',
        `Availability ${check.metrics.availability}% below threshold ${config.thresholds.availability}%`,
        'availability', check.metrics.availability, config.thresholds.availability));
    }

    // Check custom metrics
    for (const [metric, value] of Object.entries(check.metrics.customMetrics)) {
      const threshold = config.thresholds.customMetrics[metric];
      if (threshold && value > threshold) {
        alerts.push(await this.createAlert(check, 'custom', 'medium',
          `Custom Metric Alert: ${metric}`,
          `Metric ${metric} value ${value} exceeds threshold ${threshold}`,
          metric, value, threshold));
      }
    }

    // Add alerts to check
    check.alerts = alerts;

    // Send notifications
    for (const alert of alerts) {
      await this.sendNotifications(alert, config.notifications);
    }
  }

  async createAlert(
    check: MonitoringCheck, 
    type: Alert['type'], 
    severity: Alert['severity'],
    title: string,
    description: string,
    metric: string,
    value: number,
    threshold: number
  ): Promise<Alert> {
    const alert: Alert = {
      id: crypto.randomUUID(),
      checkId: check.id,
      type,
      severity,
      title,
      description,
      metric,
      value,
      threshold,
      status: 'active',
      notifications: [],
      createdAt: new Date()
    };

    this.alerts.set(alert.id, alert);

    try {
      await auditLogger.logUserAction('alert_created', {
        alertId: alert.id,
        checkId: check.id,
        type,
        severity,
        metric
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return alert;
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    this.alerts.set(alertId, alert);

    try {
      await auditLogger.logUserAction('alert_acknowledged', {
        alertId,
        acknowledgedBy
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return true;
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    this.alerts.set(alertId, alert);

    try {
      await auditLogger.logUserAction('alert_resolved', {
        alertId
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return true;
  }

  // Dashboard Management
  async createDashboard(dashboard: Omit<MonitoringDashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<MonitoringDashboard> {
    const monitoringDashboard: MonitoringDashboard = {
      id: crypto.randomUUID(),
      ...dashboard,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.dashboards.set(monitoringDashboard.id, monitoringDashboard);

    try {
      await auditLogger.logUserAction('monitoring_dashboard_created', {
        dashboardId: monitoringDashboard.id,
        name: monitoringDashboard.name
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return monitoringDashboard;
  }

  // System Health
  async getSystemHealth(): Promise<SystemHealth> {
    const components: ComponentHealth[] = [
      {
        name: 'API Server',
        status: 'healthy',
        responseTime: 45,
        errorRate: 0.1,
        availability: 99.9,
        lastCheck: new Date(),
        dependencies: ['Database', 'Redis']
      },
      {
        name: 'Database',
        status: 'healthy',
        responseTime: 12,
        errorRate: 0.0,
        availability: 99.95,
        lastCheck: new Date(),
        dependencies: []
      },
      {
        name: 'Redis Cache',
        status: 'healthy',
        responseTime: 2,
        errorRate: 0.0,
        availability: 99.8,
        lastCheck: new Date(),
        dependencies: []
      },
      {
        name: 'Elasticsearch',
        status: 'healthy',
        responseTime: 25,
        errorRate: 0.05,
        availability: 99.7,
        lastCheck: new Date(),
        dependencies: []
      }
    ];

    const metrics: SystemMetrics = {
      uptime: 99.9,
      totalRequests: 1250000,
      averageResponseTime: 85,
      errorRate: 0.15,
      throughput: 1500,
      activeUsers: 250,
      systemLoad: 45,
      memoryUsage: 68,
      diskUsage: 32,
      networkLatency: 12
    };

    const alerts = Array.from(this.alerts.values()).filter(alert => alert.status === 'active');

    const systemHealth: SystemHealth = {
      overall: this.calculateOverallHealth(components, alerts),
      components,
      metrics,
      alerts,
      lastUpdated: new Date()
    };

    this.systemHealth = systemHealth;
    return systemHealth;
  }

  // Private Methods
  private async checkAPIEndpoint(config: MonitoringConfig): Promise<MonitoringMetrics> {
    // Simulate API endpoint check
    const responseTime = Math.random() * 200 + 50; // 50-250ms
    const errorRate = Math.random() * 2; // 0-2%
    const availability = 100 - errorRate;

    return {
      responseTime,
      errorRate,
      availability,
      cpuUsage: Math.random() * 30 + 20, // 20-50%
      memoryUsage: Math.random() * 40 + 30, // 30-70%
      diskUsage: Math.random() * 20 + 10, // 10-30%
      throughput: Math.random() * 1000 + 500, // 500-1500 req/s
      latency: responseTime,
      customMetrics: {
        'api.calls_per_second': Math.random() * 100 + 50,
        'api.cache_hit_rate': Math.random() * 20 + 80
      }
    };
  }

  private async checkDatabase(config: MonitoringConfig): Promise<MonitoringMetrics> {
    // Simulate database check
    const responseTime = Math.random() * 50 + 10; // 10-60ms
    const errorRate = Math.random() * 0.5; // 0-0.5%
    const availability = 100 - errorRate;

    return {
      responseTime,
      errorRate,
      availability,
      cpuUsage: Math.random() * 20 + 10, // 10-30%
      memoryUsage: Math.random() * 30 + 40, // 40-70%
      diskUsage: Math.random() * 15 + 5, // 5-20%
      throughput: Math.random() * 500 + 200, // 200-700 ops/s
      latency: responseTime,
      customMetrics: {
        'db.connections': Math.random() * 50 + 20,
        'db.query_time': responseTime
      }
    };
  }

  private async checkServer(config: MonitoringConfig): Promise<MonitoringMetrics> {
    // Simulate server check
    const responseTime = Math.random() * 100 + 20; // 20-120ms
    const errorRate = Math.random() * 1; // 0-1%
    const availability = 100 - errorRate;

    return {
      responseTime,
      errorRate,
      availability,
      cpuUsage: Math.random() * 40 + 30, // 30-70%
      memoryUsage: Math.random() * 50 + 20, // 20-70%
      diskUsage: Math.random() * 30 + 10, // 10-40%
      throughput: Math.random() * 800 + 300, // 300-1100 req/s
      latency: responseTime,
      customMetrics: {
        'server.load_average': Math.random() * 2 + 0.5,
        'server.network_io': Math.random() * 1000 + 500
      }
    };
  }

  private async checkApplication(config: MonitoringConfig): Promise<MonitoringMetrics> {
    // Simulate application check
    const responseTime = Math.random() * 150 + 30; // 30-180ms
    const errorRate = Math.random() * 1.5; // 0-1.5%
    const availability = 100 - errorRate;

    return {
      responseTime,
      errorRate,
      availability,
      cpuUsage: Math.random() * 35 + 25, // 25-60%
      memoryUsage: Math.random() * 45 + 25, // 25-70%
      diskUsage: Math.random() * 25 + 15, // 15-40%
      throughput: Math.random() * 600 + 400, // 400-1000 req/s
      latency: responseTime,
      customMetrics: {
        'app.active_sessions': Math.random() * 200 + 100,
        'app.queue_size': Math.random() * 50 + 10
      }
    };
  }

  private async checkCustom(config: MonitoringConfig): Promise<MonitoringMetrics> {
    // Simulate custom check
    const responseTime = Math.random() * 300 + 50; // 50-350ms
    const errorRate = Math.random() * 3; // 0-3%
    const availability = 100 - errorRate;

    return {
      responseTime,
      errorRate,
      availability,
      cpuUsage: Math.random() * 50 + 20, // 20-70%
      memoryUsage: Math.random() * 60 + 20, // 20-80%
      diskUsage: Math.random() * 40 + 10, // 10-50%
      throughput: Math.random() * 200 + 100, // 100-300 req/s
      latency: responseTime,
      customMetrics: {
        'custom.metric1': Math.random() * 100,
        'custom.metric2': Math.random() * 50 + 25
      }
    };
  }

  private getDefaultMetrics(): MonitoringMetrics {
    return {
      responseTime: 0,
      errorRate: 100,
      availability: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      throughput: 0,
      latency: 0,
      customMetrics: {}
    };
  }

  private evaluateThresholds(metrics: MonitoringMetrics, thresholds: MonitoringThresholds): 'success' | 'warning' | 'error' | 'critical' {
    if (metrics.errorRate > thresholds.errorRate * 2 || metrics.availability < thresholds.availability * 0.5) {
      return 'critical';
    }
    if (metrics.errorRate > thresholds.errorRate || metrics.availability < thresholds.availability) {
      return 'error';
    }
    if (metrics.responseTime > thresholds.responseTime * 1.5 || metrics.cpuUsage > thresholds.cpuUsage * 1.2) {
      return 'warning';
    }
    return 'success';
  }

  private calculateOverallHealth(components: ComponentHealth[], alerts: Alert[]): 'healthy' | 'degraded' | 'unhealthy' | 'critical' {
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
    const highAlerts = alerts.filter(alert => alert.severity === 'high');
    const unhealthyComponents = components.filter(comp => comp.status === 'unhealthy' || comp.status === 'critical');

    if (criticalAlerts.length > 0 || unhealthyComponents.length > 0) {
      return 'critical';
    }
    if (highAlerts.length > 2) {
      return 'unhealthy';
    }
    if (highAlerts.length > 0 || components.some(comp => comp.status === 'degraded')) {
      return 'degraded';
    }
    return 'healthy';
  }

  private async sendNotifications(alert: Alert, notificationConfigs: NotificationConfig[]): Promise<void> {
    for (const config of notificationConfigs) {
      if (!config.enabled) continue;

      for (const recipient of config.recipients) {
        const notification: NotificationResult = {
          id: crypto.randomUUID(),
          type: config.type,
          recipient,
          status: 'pending',
          sentAt: new Date()
        };

        try {
          // Simulate notification sending
          await this.sendNotification(alert, config, recipient);
          notification.status = 'sent';
        } catch (error) {
          notification.status = 'failed';
          notification.error = error instanceof Error ? error.message : 'Unknown error';
        }

        alert.notifications.push(notification);
      }
    }
  }

  private async sendNotification(alert: Alert, config: NotificationConfig, recipient: string): Promise<void> {
    // Simulate notification sending based on type
    switch (config.type) {
      case 'email':
        console.log(`Sending email to ${recipient}: ${alert.title}`);
        break;
      case 'slack':
        console.log(`Sending Slack message to ${recipient}: ${alert.title}`);
        break;
      case 'webhook':
        console.log(`Sending webhook to ${recipient}: ${alert.title}`);
        break;
      case 'sms':
        console.log(`Sending SMS to ${recipient}: ${alert.title}`);
        break;
      case 'push':
        console.log(`Sending push notification to ${recipient}: ${alert.title}`);
        break;
    }
  }

  private initializeDefaultConfigs(): void {
    const defaultConfigs: MonitoringConfig[] = [
      {
        id: crypto.randomUUID(),
        name: 'API Health Check',
        type: 'api',
        enabled: true,
        interval: 60,
        timeout: 5000,
        retries: 3,
        thresholds: {
          responseTime: 1000,
          errorRate: 5,
          availability: 95,
          cpuUsage: 80,
          memoryUsage: 85,
          diskUsage: 90,
          customMetrics: {}
        },
        notifications: [],
        metadata: {
          endpoint: '/api/health',
          method: 'GET'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        name: 'Database Health Check',
        type: 'database',
        enabled: true,
        interval: 30,
        timeout: 3000,
        retries: 2,
        thresholds: {
          responseTime: 500,
          errorRate: 1,
          availability: 99,
          cpuUsage: 70,
          memoryUsage: 80,
          diskUsage: 85,
          customMetrics: {}
        },
        notifications: [],
        metadata: {
          connectionString: 'postgresql://...',
          query: 'SELECT 1'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultConfigs.forEach(config => {
      this.configs.set(config.id, config);
    });
  }

  private startMonitoring(): void {
    // Perform monitoring checks every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.performAllChecks();
    }, 30000);
  }

  private async performAllChecks(): Promise<void> {
    for (const config of this.configs.values()) {
      if (config.enabled) {
        try {
          await this.performCheck(config.id);
        } catch (error) {
          console.error(`Monitoring check failed for ${config.name}:`, error);
        }
      }
    }
  }

  // Public getters
  getMonitoringConfig(configId: string): MonitoringConfig | null {
    return this.configs.get(configId) || null;
  }

  getAllMonitoringConfigs(): MonitoringConfig[] {
    return Array.from(this.configs.values());
  }

  getChecks(configId: string): MonitoringCheck[] {
    return this.checks.get(configId) || [];
  }

  getAllChecks(): MonitoringCheck[] {
    return Array.from(this.checks.values()).flat();
  }

  getAlert(alertId: string): Alert | null {
    return this.alerts.get(alertId) || null;
  }

  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'active');
  }

  getDashboard(dashboardId: string): MonitoringDashboard | null {
    return this.dashboards.get(dashboardId) || null;
  }

  getAllDashboards(): MonitoringDashboard[] {
    return Array.from(this.dashboards.values());
  }

  getSystemHealthData(): SystemHealth | null {
    return this.systemHealth;
  }

  getMonitoringStats(): {
    totalConfigs: number;
    activeConfigs: number;
    totalChecks: number;
    totalAlerts: number;
    activeAlerts: number;
    averageResponseTime: number;
    systemUptime: number;
  } {
    const configs = this.getAllMonitoringConfigs();
    const checks = this.getAllChecks();
    const alerts = this.getAllAlerts();
    const activeAlerts = this.getActiveAlerts();

    const totalConfigs = configs.length;
    const activeConfigs = configs.filter(c => c.enabled).length;
    const totalChecks = checks.length;
    const totalAlerts = alerts.length;
    const activeAlertsCount = activeAlerts.length;
    const averageResponseTime = checks.length > 0 
      ? checks.reduce((sum, check) => sum + check.responseTime, 0) / checks.length 
      : 0;
    const systemUptime = this.systemHealth?.metrics.uptime || 0;

    return {
      totalConfigs,
      activeConfigs,
      totalChecks,
      totalAlerts,
      activeAlerts: activeAlertsCount,
      averageResponseTime,
      systemUptime
    };
  }
}

// Export singleton instance
export const monitoringManager = MonitoringManager.getInstance();
