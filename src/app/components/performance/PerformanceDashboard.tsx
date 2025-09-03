'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  Zap, 
  Clock, 
  Database, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { performanceMonitor } from '@/lib/performance/performanceMonitor';
import { apiClient } from '@/lib/performance/optimizedApiClient';
import { searchCache, propertyCache, analyticsCache } from '@/lib/performance/cacheManager';

interface PerformanceStats {
  webVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
  apiStats: {
    totalRequests: number;
    cacheHitRate: number;
    averageResponseTime: number;
    errorRate: number;
  };
  cacheStats: {
    search: any;
    property: any;
    analytics: any;
  };
  slowOperations: Array<{
    name: string;
    value: number;
    timestamp: number;
  }>;
}

export default function PerformanceDashboard() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'web-vitals' | 'api' | 'cache'>('overview');

  useEffect(() => {
    updateStats();
    
    if (autoRefresh) {
      const interval = setInterval(updateStats, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const updateStats = () => {
    const summary = performanceMonitor.getSummary();
    const apiStats = apiClient.getCacheStats();
    
    const newStats: PerformanceStats = {
      webVitals: {
        lcp: summary.webVitals.lcp || 0,
        fid: summary.webVitals.fid || 0,
        cls: summary.webVitals.cls || 0,
        fcp: summary.webVitals.fcp || 0,
        ttfb: summary.webVitals.ttfb || 0,
      },
      apiStats: {
        totalRequests: summary.totalMetrics,
        cacheHitRate: calculateCacheHitRate(apiStats),
        averageResponseTime: summary.averageTiming,
        errorRate: calculateErrorRate(),
      },
      cacheStats: apiStats,
      slowOperations: summary.slowestOperations,
    };

    setStats(newStats);
  };

  const calculateCacheHitRate = (cacheStats: any): number => {
    const totalHits = cacheStats.search.hits + cacheStats.property.hits + cacheStats.analytics.hits;
    const totalRequests = cacheStats.search.hits + cacheStats.search.misses + 
                         cacheStats.property.hits + cacheStats.property.misses +
                         cacheStats.analytics.hits + cacheStats.analytics.misses;
    
    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  };

  const calculateErrorRate = (): number => {
    const errorMetrics = performanceMonitor.getMetrics({ name: 'error' });
    const totalMetrics = performanceMonitor.getMetrics();
    return totalMetrics.length > 0 ? (errorMetrics.length / totalMetrics.length) * 100 : 0;
  };

  const clearAllCaches = () => {
    searchCache.clear();
    propertyCache.clear();
    analyticsCache.clear();
    updateStats();
  };

  const clearMetrics = () => {
    performanceMonitor.clearMetrics();
    updateStats();
  };

  const exportMetrics = () => {
    const data = performanceMonitor.exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getWebVitalScore = (value: number, thresholds: { good: number; needsImprovement: number }): 'good' | 'needs-improvement' | 'poor' => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  const getScoreColor = (score: 'good' | 'needs-improvement' | 'poor'): string => {
    switch (score) {
      case 'good': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'poor': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Performance Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time performance monitoring and optimization
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isMonitoring 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {isMonitoring ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span>{isMonitoring ? 'Monitoring' : 'Paused'}</span>
            </button>
            
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                autoRefresh 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>Auto Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.apiStats.cacheHitRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${Math.min(stats.apiStats.cacheHitRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.apiStats.averageResponseTime.toFixed(0)}ms
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-sm font-medium ${
              stats.apiStats.averageResponseTime < 200 ? 'text-green-600 dark:text-green-400' :
              stats.apiStats.averageResponseTime < 500 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {stats.apiStats.averageResponseTime < 200 ? 'Excellent' :
               stats.apiStats.averageResponseTime < 500 ? 'Good' : 'Needs Improvement'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.apiStats.totalRequests}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Since page load
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Error Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.apiStats.errorRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-sm font-medium ${
              stats.apiStats.errorRate < 1 ? 'text-green-600 dark:text-green-400' :
              stats.apiStats.errorRate < 5 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {stats.apiStats.errorRate < 1 ? 'Excellent' :
               stats.apiStats.errorRate < 5 ? 'Good' : 'Needs Attention'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'web-vitals', label: 'Web Vitals', icon: Zap },
              { id: 'api', label: 'API Performance', icon: Database },
              { id: 'cache', label: 'Cache Stats', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Web Vitals Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Web Vitals Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { key: 'lcp', label: 'LCP', threshold: { good: 2500, needsImprovement: 4000 } },
                    { key: 'fid', label: 'FID', threshold: { good: 100, needsImprovement: 300 } },
                    { key: 'cls', label: 'CLS', threshold: { good: 0.1, needsImprovement: 0.25 } },
                    { key: 'fcp', label: 'FCP', threshold: { good: 1800, needsImprovement: 3000 } },
                    { key: 'ttfb', label: 'TTFB', threshold: { good: 800, needsImprovement: 1800 } },
                  ].map(({ key, label, threshold }) => {
                    const value = stats.webVitals[key as keyof typeof stats.webVitals];
                    const score = getWebVitalScore(value, threshold);
                    return (
                      <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {label}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(score)}`}>
                            {score.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {value.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {key === 'cls' ? 'score' : 'ms'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Slow Operations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Slowest Operations
                </h3>
                <div className="space-y-3">
                  {stats.slowOperations.map((operation, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {operation.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(operation.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          {operation.value.toFixed(0)}ms
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Web Vitals Tab */}
          {activeTab === 'web-vitals' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(stats.webVitals).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {key.toUpperCase()}
                    </h4>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {value.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {key === 'cls' ? 'Cumulative Layout Shift Score' : 'Milliseconds'}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full" 
                        style={{ width: `${Math.min((value / 5000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Performance Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Response Times
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Average</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stats.apiStats.averageResponseTime.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Requests</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stats.apiStats.totalRequests}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Error Rate
                  </h4>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {stats.apiStats.errorRate.toFixed(1)}%
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        stats.apiStats.errorRate < 1 ? 'bg-green-500' :
                        stats.apiStats.errorRate < 5 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(stats.apiStats.errorRate * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cache Stats Tab */}
          {activeTab === 'cache' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Object.entries(stats.cacheStats).map(([cacheName, cacheStats]) => (
                  <div key={cacheName} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                      {cacheName} Cache
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Hit Rate</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {cacheStats.hitRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Hits</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {cacheStats.hits}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Misses</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {cacheStats.misses}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Size</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {cacheStats.size}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cache Actions */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={clearAllCaches}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear All Caches</span>
                </button>
                
                <button
                  onClick={clearMetrics}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear Metrics</span>
                </button>
                
                <button
                  onClick={exportMetrics}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Metrics</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
