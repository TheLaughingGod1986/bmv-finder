'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  BarChart3,
  Server,
  Clock,
  HardDrive,
  Cpu
} from 'lucide-react';

interface PerformanceMetrics {
  database: {
    queryCount: number;
    averageQueryTime: number;
    slowQueries: number;
    cacheHitRate: number;
    connectionPoolUtilization: number;
    healthScore: number;
  };
  api: {
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    throughput: number;
  };
  elasticsearch: {
    queryCount: number;
    averageQueryTime: number;
    slowQueries: number;
    errorRate: number;
    cacheHitRate: number;
    clusterHealth: 'green' | 'yellow' | 'red';
  };
  cache: {
    hits: number;
    misses: number;
    evictions: number;
    hitRate: number;
    memoryUsage: number;
    itemCount: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
}

interface PerformanceRecommendations {
  database: Array<{
    issue: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  api: Array<{
    endpoint: string;
    issue: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  elasticsearch: Array<{
    index: string;
    issue: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<PerformanceRecommendations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Load performance metrics
      const [dbResponse, apiResponse, esResponse, cacheResponse, systemResponse] = await Promise.all([
        fetch('/api/performance/database'),
        fetch('/api/performance/api'),
        fetch('/api/performance/elasticsearch'),
        fetch('/api/performance/cache'),
        fetch('/api/performance/system')
      ]);

      const [dbMetrics, apiMetrics, esMetrics, cacheMetrics, systemMetrics] = await Promise.all([
        dbResponse.json(),
        apiResponse.json(),
        esResponse.json(),
        cacheResponse.json(),
        systemResponse.json()
      ]);

      setMetrics({
        database: dbMetrics,
        api: apiMetrics,
        elasticsearch: esMetrics,
        cache: cacheMetrics,
        system: systemMetrics
      });

      // Load recommendations
      const recommendationsResponse = await fetch('/api/performance/recommendations');
      const recommendationsData = await recommendationsResponse.json();
      setRecommendations(recommendationsData);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const getClusterHealthColor = (health: string) => {
    switch (health) {
      case 'green': return 'text-green-600';
      case 'yellow': return 'text-yellow-600';
      case 'red': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading performance metrics...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Metrics</h3>
        <p className="text-gray-600 mb-4">Unable to load performance metrics. Please try again.</p>
        <button
          onClick={loadMetrics}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
          <p className="text-gray-600">
            Real-time system performance metrics and recommendations
            {lastUpdated && (
              <span className="ml-2 text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>
          <button
            onClick={loadMetrics}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Cpu className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CPU Usage</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.system.cpuUsage.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <HardDrive className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.system.memoryUsage.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Server className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disk Usage</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.system.diskUsage.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Network Latency</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.system.networkLatency}ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Database Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Database Performance</h3>
            </div>
            <div className="flex items-center gap-2">
              {getHealthIcon(metrics.database.healthScore)}
              <span className={`text-sm font-medium ${getHealthColor(metrics.database.healthScore)}`}>
                Health: {metrics.database.healthScore}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Query Count</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.database.queryCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Avg Query Time</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.database.averageQueryTime.toFixed(2)}ms</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.database.cacheHitRate.toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Slow Queries</p>
              <p className="text-xl font-semibold text-gray-900">{metrics.database.slowQueries}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Connection Pool</p>
              <p className="text-xl font-semibold text-gray-900">{metrics.database.connectionPoolUtilization.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* API Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">API Performance</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Request Count</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.api.requestCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.api.averageResponseTime.toFixed(2)}ms</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Error Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.api.errorRate.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Throughput</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.api.throughput.toFixed(1)} req/min</p>
            </div>
          </div>
        </div>
      </div>

      {/* Elasticsearch Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Elasticsearch Performance</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                metrics.elasticsearch.clusterHealth === 'green' ? 'bg-green-500' :
                metrics.elasticsearch.clusterHealth === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-sm font-medium ${getClusterHealthColor(metrics.elasticsearch.clusterHealth)}`}>
                {metrics.elasticsearch.clusterHealth.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Query Count</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.elasticsearch.queryCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Avg Query Time</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.elasticsearch.averageQueryTime.toFixed(2)}ms</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Slow Queries</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.elasticsearch.slowQueries}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.elasticsearch.cacheHitRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Cache Performance</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Cache Hits</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.cache.hits.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Cache Misses</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.cache.misses.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Hit Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.cache.hitRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900">{(metrics.cache.memoryUsage / 1024 / 1024).toFixed(1)}MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Performance Recommendations</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {/* Database Recommendations */}
              {recommendations.database.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Database</h4>
                  <div className="space-y-2">
                    {recommendations.database.map((rec, index) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${
                        rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                        rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      }`}>
                        <p className="text-sm font-medium text-gray-900">{rec.issue}</p>
                        <p className="text-sm text-gray-600">{rec.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* API Recommendations */}
              {recommendations.api.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">API</h4>
                  <div className="space-y-2">
                    {recommendations.api.map((rec, index) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${
                        rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                        rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      }`}>
                        <p className="text-sm font-medium text-gray-900">{rec.endpoint}: {rec.issue}</p>
                        <p className="text-sm text-gray-600">{rec.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Elasticsearch Recommendations */}
              {recommendations.elasticsearch.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Elasticsearch</h4>
                  <div className="space-y-2">
                    {recommendations.elasticsearch.map((rec, index) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${
                        rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                        rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      }`}>
                        <p className="text-sm font-medium text-gray-900">{rec.index}: {rec.issue}</p>
                        <p className="text-sm text-gray-600">{rec.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
