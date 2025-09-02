'use client';

import { useState, useEffect } from 'react';

interface HealthSummary {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  services: Array<{
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    lastChecked: string;
    error?: string;
  }>;
  uptime: number;
  lastUpdated: string;
  recommendations: string[];
}

interface Metrics {
  system: any;
  cache: any;
  api: any;
  apiEndpoints: Record<string, any>;
}

interface Alerts {
  active: any[];
  stats: {
    total: number;
    active: number;
    resolved: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  };
}

interface Trends {
  averageScore: number;
  uptimePercentage: number;
  criticalIssues: number;
  trend: 'improving' | 'stable' | 'declining';
}

export default function ProductionDashboard() {
  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [alerts, setAlerts] = useState<Alerts | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/health/production?detailed=true&history=true&limit=5');
      const data = await response.json();

      if (data.success) {
        setHealth(data.health);
        setMetrics(data.metrics);
        setAlerts(data.alerts);
        setTrends(data.trends);
        setError(null);
      } else {
        setError(data.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError('Network error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'unhealthy': return '❌';
      default: return '❓';
    }
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Real-time system health and performance monitoring
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Overall Health Status */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Overall Status</p>
                  <p className={`text-2xl font-bold ${getStatusColor(health.overall).split(' ')[0]}`}>
                    {health.overall.toUpperCase()}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${getStatusColor(health.overall)}`}>
                  {getStatusIcon(health.overall)}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Health Score</p>
                  <p className="text-2xl font-bold text-gray-900">{health.score}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Uptime</p>
                  <p className="text-2xl font-bold text-gray-900">{formatUptime(health.uptime)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-xl">⏱️</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{alerts?.stats.active || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-yellow-600 text-xl">🔔</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Health */}
        {health && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Services Health</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {health.services.map((service) => (
                  <div key={service.service} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 capitalize">{service.service}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Response: {service.responseTime}ms</p>
                      <p>Last checked: {new Date(service.lastChecked).toLocaleTimeString()}</p>
                      {service.error && (
                        <p className="text-red-600 mt-1">{service.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* System Resources */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">System Resources</h2>
              </div>
              <div className="p-6">
                {metrics.system && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Usage</span>
                        <span>{metrics.system.memory?.percentage || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${metrics.system.memory?.percentage || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatBytes(metrics.system.memory?.used || 0)} / {formatBytes(metrics.system.memory?.total || 0)}
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU Usage</span>
                        <span>{metrics.system.cpu?.usage || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${metrics.system.cpu?.usage || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* API Performance */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">API Performance</h2>
              </div>
              <div className="p-6">
                {metrics.api && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Requests</span>
                      <span className="font-medium">{metrics.api.requests?.total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="font-medium">
                        {metrics.api.requests?.total > 0 
                          ? Math.round((metrics.api.requests.successful / metrics.api.requests.total) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Response Time</span>
                      <span className="font-medium">{metrics.api.responseTime?.average || 0}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Error Rate</span>
                      <span className="font-medium">{metrics.api.errors?.rate || 0}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trends */}
        {trends && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Health Trends</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{trends.averageScore}%</div>
                  <div className="text-sm text-gray-600">Average Health Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{trends.uptimePercentage}%</div>
                  <div className="text-sm text-gray-600">Uptime Percentage</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{trends.criticalIssues}</div>
                  <div className="text-sm text-gray-600">Critical Issues</div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  trends.trend === 'improving' ? 'bg-green-100 text-green-800' :
                  trends.trend === 'declining' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Trend: {trends.trend}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {health && health.recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recommendations</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {health.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
