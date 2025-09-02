'use client';

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  CpuChipIcon,
  ServerIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface PerformanceMetrics {
  api: {
    responseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    successRate: number;
  };
  database: {
    queryTime: number;
    connectionPool: number;
    slowQueries: number;
    cacheHitRate: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    totalSize: number;
    itemCount: number;
  };
  system: {
    cpuUsage: number;
    loadAverage: number;
    uptime: number;
  };
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/performance/dashboard');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }): string => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return <XCircleIcon className="w-5 h-5 text-red-600" />;
    if (value >= thresholds.warning) return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
    return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load metrics</h3>
        <p className="text-gray-600">Unable to fetch performance data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">Real-time system performance monitoring</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="5m">Last 5 minutes</option>
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={1000}>1 second</option>
            <option value={5000}>5 seconds</option>
            <option value={10000}>10 seconds</option>
            <option value={30000}>30 seconds</option>
          </select>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Alerts</h3>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center space-x-3 p-3 rounded-md ${
                  alert.type === 'error' ? 'bg-red-50 border border-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                {alert.type === 'error' ? (
                  <XCircleIcon className="w-5 h-5 text-red-600" />
                ) : alert.type === 'warning' ? (
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                ) : (
                  <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* API Response Time */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">API Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.api.responseTime}ms</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(metrics.api.responseTime, { warning: 500, critical: 1000 })}
              <ClockIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-600">Target: &lt;200ms</span>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.memory.percentage}%</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(metrics.memory.percentage, { warning: 70, critical: 85 })}
              <CpuChipIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-600">
                {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.cache.hitRate.toFixed(1)}%</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(100 - metrics.cache.hitRate, { warning: 20, critical: 40 })}
              <ChartBarIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-600">
                {metrics.cache.itemCount} items, {formatBytes(metrics.cache.totalSize)}
              </span>
            </div>
          </div>
        </div>

        {/* System Uptime */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{formatUptime(metrics.system.uptime)}</p>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <ServerIcon className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-600">CPU: {metrics.system.cpuUsage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Requests per second</span>
              <span className="font-medium">{metrics.api.requestsPerSecond}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Success rate</span>
              <span className={`font-medium ${getStatusColor(100 - metrics.api.successRate, { warning: 5, critical: 10 })}`}>
                {metrics.api.successRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Error rate</span>
              <span className={`font-medium ${getStatusColor(metrics.api.errorRate, { warning: 2, critical: 5 })}`}>
                {metrics.api.errorRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Database Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average query time</span>
              <span className={`font-medium ${getStatusColor(metrics.database.queryTime, { warning: 100, critical: 500 })}`}>
                {metrics.database.queryTime}ms
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Connection pool</span>
              <span className="font-medium">{metrics.database.connectionPool}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Slow queries</span>
              <span className={`font-medium ${getStatusColor(metrics.database.slowQueries, { warning: 5, critical: 10 })}`}>
                {metrics.database.slowQueries}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cache hit rate</span>
              <span className={`font-medium ${getStatusColor(100 - metrics.database.cacheHitRate, { warning: 20, critical: 40 })}`}>
                {metrics.database.cacheHitRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Response Time</span>
            </div>
            <p className="text-2xl font-bold text-green-600">-12%</p>
            <p className="text-xs text-gray-500">vs last hour</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-600">Memory Usage</span>
            </div>
            <p className="text-2xl font-bold text-red-600">+8%</p>
            <p className="text-xs text-gray-500">vs last hour</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Cache Hit Rate</span>
            </div>
            <p className="text-2xl font-bold text-green-600">+5%</p>
            <p className="text-xs text-gray-500">vs last hour</p>
          </div>
        </div>
      </div>
    </div>
  );
}
