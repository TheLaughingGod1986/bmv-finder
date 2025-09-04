'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Download, 
  Eye, 
  FileText, 
  Globe, 
  HardDrive, 
  Monitor, 
  Play, 
  RefreshCw, 
  Server, 
  Settings, 
  Shield, 
  TrendingUp, 
  Users, 
  Zap,
  XCircle,
  Info,
  BarChart3,
  PieChart,
  LineChart,
  Gauge,
  Table,
  Map,
  Filter,
  Search,
  Download as DownloadIcon,
  Upload,
  Trash2,
  Edit,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Share
} from 'lucide-react';

interface MonitoringConfig {
  id: string;
  name: string;
  type: 'api' | 'database' | 'server' | 'application' | 'custom';
  enabled: boolean;
  interval: number;
  timeout: number;
  retries: number;
  thresholds: MonitoringThresholds;
  notifications: NotificationConfig[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface MonitoringThresholds {
  responseTime: number;
  errorRate: number;
  availability: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  customMetrics: Record<string, number>;
}

interface NotificationConfig {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
  enabled: boolean;
  recipients: string[];
  channels: string[];
  conditions: NotificationCondition[];
  template: string;
  cooldown: number;
  escalation: EscalationConfig;
}

interface NotificationCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  value: number;
  duration: number;
}

interface EscalationConfig {
  enabled: boolean;
  levels: EscalationLevel[];
  maxLevel: number;
}

interface EscalationLevel {
  level: number;
  delay: number;
  recipients: string[];
  channels: string[];
}

interface MonitoringCheck {
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

interface MonitoringMetrics {
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

interface Alert {
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

interface NotificationResult {
  id: string;
  type: string;
  recipient: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt?: Date;
  error?: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  components: ComponentHealth[];
  metrics: SystemMetrics;
  alerts: Alert[];
  lastUpdated: Date;
}

interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  responseTime: number;
  errorRate: number;
  availability: number;
  lastCheck: Date;
  dependencies: string[];
}

interface SystemMetrics {
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

interface MonitoringStats {
  totalConfigs: number;
  activeConfigs: number;
  totalChecks: number;
  totalAlerts: number;
  activeAlerts: number;
  averageResponseTime: number;
  systemUptime: number;
}

export default function MonitoringDashboard() {
  const [monitoringConfigs, setMonitoringConfigs] = useState<MonitoringConfig[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [monitoringStats, setMonitoringStats] = useState<MonitoringStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'alerts' | 'configs'>('overview');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<MonitoringConfig | null>(null);

  useEffect(() => {
    loadMonitoringData();
  }, []);

  const loadMonitoringData = async () => {
    setIsLoading(true);
    try {
      // Load monitoring configurations
      const configResponse = await fetch('/api/monitoring/configs');
      const configData = await configResponse.json();
      if (configData.success) {
        setMonitoringConfigs(configData.configs);
      }

      // Load system health
      const healthResponse = await fetch('/api/monitoring/health');
      const healthData = await healthResponse.json();
      if (healthData.success) {
        setSystemHealth(healthData.health);
      }

      // Load alerts
      const alertsResponse = await fetch('/api/monitoring/alerts');
      const alertsData = await alertsResponse.json();
      if (alertsData.success) {
        setAlerts(alertsData.alerts);
      }

      // Calculate monitoring stats
      const stats: MonitoringStats = {
        totalConfigs: configData.configs?.length || 0,
        activeConfigs: configData.configs?.filter((c: MonitoringConfig) => c.enabled).length || 0,
        totalChecks: 0, // Would be calculated from actual data
        totalAlerts: alertsData.alerts?.length || 0,
        activeAlerts: alertsData.alerts?.filter((a: Alert) => a.status === 'active').length || 0,
        averageResponseTime: healthData.health?.metrics?.averageResponseTime || 0,
        systemUptime: healthData.health?.metrics?.uptime || 0
      };
      setMonitoringStats(stats);

    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          action: 'acknowledge',
          acknowledgedBy: 'current-user'
        })
      });

      if (response.ok) {
        loadMonitoringData();
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          action: 'resolve'
        })
      });

      if (response.ok) {
        loadMonitoringData();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'degraded':
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'critical':
        return 'text-red-800 bg-red-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-blue-600 bg-blue-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api':
        return <Globe className="w-4 h-4" />;
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'server':
        return <Server className="w-4 h-4" />;
      case 'application':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading monitoring data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
            <p className="text-gray-600">Real-time system health and performance monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadMonitoringData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'health', label: 'System Health', icon: Activity },
              { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
              { id: 'configs', label: 'Configurations', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">System Uptime</p>
                  <p className="text-2xl font-bold text-gray-900">{monitoringStats?.systemUptime.toFixed(1) || 0}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{monitoringStats?.activeAlerts || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(monitoringStats?.averageResponseTime || 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Settings className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active Configs</p>
                  <p className="text-2xl font-bold text-gray-900">{monitoringStats?.activeConfigs || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Health Overview */}
          {systemHealth && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(systemHealth.overall)}`}>
                  {systemHealth.overall}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {systemHealth.components.map((component) => (
                  <div key={component.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(component.name.toLowerCase())}
                        <span className="text-sm font-medium text-gray-900">{component.name}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(component.status)}`}>
                        {component.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Response: {formatDuration(component.responseTime)}</div>
                      <div>Error Rate: {component.errorRate.toFixed(2)}%</div>
                      <div>Availability: {component.availability.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{alert.title}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{formatDate(alert.createdAt)}</span>
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'health' && systemHealth && (
        <div className="space-y-6">
          {/* System Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{systemHealth.metrics.totalRequests.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatDuration(systemHealth.metrics.averageResponseTime)}</div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{systemHealth.metrics.throughput}</div>
                <div className="text-sm text-gray-600">Throughput (req/s)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{systemHealth.metrics.activeUsers}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{systemHealth.metrics.memoryUsage}%</div>
                <div className="text-sm text-gray-600">Memory Usage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{systemHealth.metrics.diskUsage}%</div>
                <div className="text-sm text-gray-600">Disk Usage</div>
              </div>
            </div>
          </div>

          {/* Component Health Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Component Health Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Component
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Response Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Availability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Check
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {systemHealth.components.map((component) => (
                    <tr key={component.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getTypeIcon(component.name.toLowerCase())}
                          <span className="ml-2 text-sm font-medium text-gray-900">{component.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(component.status)}`}>
                          {component.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(component.responseTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {component.errorRate.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {component.availability.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(component.lastCheck)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Alert Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm">
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm">
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Alerts Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Alerts</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alert
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{alert.title}</div>
                          <div className="text-sm text-gray-500">{alert.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                          {alert.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {alert.metric}: {alert.value} (threshold: {alert.threshold})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(alert.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          {alert.status === 'active' && (
                            <>
                              <button
                                onClick={() => acknowledgeAlert(alert.id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Acknowledge
                              </button>
                              <button
                                onClick={() => resolveAlert(alert.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                Resolve
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'configs' && (
        <div className="space-y-6">
          {/* Monitoring Configurations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Monitoring Configurations</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Add Configuration
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monitoringConfigs.map((config) => (
                  <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(config.type)}
                        <span className="text-sm font-medium text-gray-900">{config.name}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          config.enabled ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                        }`}>
                          {config.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedConfig(config)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Type: {config.type}</div>
                    <div className="text-sm text-gray-600 mb-2">Interval: {config.interval}s</div>
                    <div className="text-sm text-gray-600 mb-2">Timeout: {config.timeout}ms</div>
                    <div className="text-sm text-gray-600">Retries: {config.retries}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Alert Details</h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(selectedAlert.severity)}`}>
                    {selectedAlert.severity}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAlert.status)}`}>
                    {selectedAlert.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">{selectedAlert.title}</h4>
                  <p className="text-gray-600">{selectedAlert.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Metric</div>
                    <div className="font-medium">{selectedAlert.metric}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Value</div>
                    <div className="font-medium">{selectedAlert.value}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Threshold</div>
                    <div className="font-medium">{selectedAlert.threshold}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Created</div>
                    <div className="font-medium">{formatDate(selectedAlert.createdAt)}</div>
                  </div>
                </div>

                {selectedAlert.acknowledgedBy && (
                  <div>
                    <div className="text-sm text-gray-600">Acknowledged By</div>
                    <div className="font-medium">{selectedAlert.acknowledgedBy}</div>
                    <div className="text-sm text-gray-500">{formatDate(selectedAlert.acknowledgedAt!)}</div>
                  </div>
                )}

                {selectedAlert.resolvedAt && (
                  <div>
                    <div className="text-sm text-gray-600">Resolved At</div>
                    <div className="font-medium">{formatDate(selectedAlert.resolvedAt)}</div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4">
                  {selectedAlert.status === 'active' && (
                    <>
                      <button
                        onClick={() => {
                          acknowledgeAlert(selectedAlert.id);
                          setSelectedAlert(null);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => {
                          resolveAlert(selectedAlert.id);
                          setSelectedAlert(null);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Resolve
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
