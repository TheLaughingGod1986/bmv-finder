'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface DataQualityMetrics {
  freshness: {
    lastUpdate: string;
    ageInHours: number;
    isFresh: boolean;
  };
  completeness: {
    totalRecords: number;
    missingFields: number;
    completenessScore: number;
  };
  accuracy: {
    validationErrors: number;
    accuracyScore: number;
  };
  consistency: {
    duplicateRecords: number;
    consistencyScore: number;
  };
}

interface DashboardData {
  timestamp: string;
  index: string;
  status: 'healthy' | 'issues_detected';
  metrics: DataQualityMetrics;
  alerts: string[];
  severity: 'low' | 'medium' | 'high';
}

export default function DataQualityDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/monitoring/quality?detailed=true');
      if (!response.ok) {
        throw new Error('Failed to fetch data quality metrics');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'issues_detected':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
      default:
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-GB').format(num);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatAge = (hours: number) => {
    if (hours < 1) return 'Less than 1 hour';
    if (hours < 24) return `${Math.round(hours)} hours`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <XCircleIcon className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Data Quality Dashboard</h2>
            {getStatusIcon(data.status)}
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span>Auto-refresh</span>
            </label>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Freshness */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <ClockIcon className="w-6 h-6 text-blue-600" />
              <span className={`text-xs px-2 py-1 rounded ${
                data.metrics.freshness.isFresh ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {data.metrics.freshness.isFresh ? 'Fresh' : 'Stale'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Data Freshness</h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatAge(data.metrics.freshness.ageInHours)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Last update: {new Date(data.metrics.freshness.lastUpdate).toLocaleDateString()}
            </p>
          </div>

          {/* Completeness */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <DocumentTextIcon className="w-6 h-6 text-green-600" />
              <span className={`text-xs px-2 py-1 rounded ${
                data.metrics.completeness.completenessScore >= 0.95 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {formatPercentage(data.metrics.completeness.completenessScore)}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Completeness</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatNumber(data.metrics.completeness.totalRecords)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {data.metrics.completeness.missingFields} missing fields
            </p>
          </div>

          {/* Accuracy */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircleIcon className="w-6 h-6 text-purple-600" />
              <span className={`text-xs px-2 py-1 rounded ${
                data.metrics.accuracy.accuracyScore >= 0.98 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {formatPercentage(data.metrics.accuracy.accuracyScore)}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Accuracy</h3>
            <p className="text-2xl font-bold text-purple-600">
              {formatNumber(data.metrics.accuracy.validationErrors)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              validation errors
            </p>
          </div>

          {/* Consistency */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <ShieldCheckIcon className="w-6 h-6 text-orange-600" />
              <span className={`text-xs px-2 py-1 rounded ${
                data.metrics.consistency.consistencyScore >= 0.99 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {formatPercentage(data.metrics.consistency.consistencyScore)}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Consistency</h3>
            <p className="text-2xl font-bold text-orange-600">
              {formatNumber(data.metrics.consistency.duplicateRecords)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              potential duplicates
            </p>
          </div>
        </div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
            <div className="space-y-3">
              {data.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getSeverityColor(data.severity)}`}
                >
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{alert}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Status */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Health Status</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon(data.status)}
              <span className="font-medium capitalize">{data.status.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-block w-3 h-3 rounded-full ${
                data.severity === 'high' ? 'bg-red-500' :
                data.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`}></span>
              <span className="text-sm text-gray-600 capitalize">{data.severity} priority</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 