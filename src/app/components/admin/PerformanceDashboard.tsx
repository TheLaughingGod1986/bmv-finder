'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Database, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  RefreshCw,
  Filter,
  Search,
  Eye,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  type: 'api' | 'database' | 'elasticsearch' | 'cache' | 'system';
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface PerformanceRecommendation {
  id: string;
  type: 'database' | 'cache' | 'api' | 'elasticsearch' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedImprovement: number;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  createdAt: string;
  completedAt?: string;
}

interface PerformanceSummary {
  overallScore: number;
  metrics: {
    api: number;
    database: number;
    elasticsearch: number;
    cache: number;
    system: number;
  };
  recommendations: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recentOptimizations: number;
}

interface PerformanceDashboardProps {
  className?: string;
}

export default function PerformanceDashboard({ className = '' }: PerformanceDashboardProps) {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [recommendations, setRecommendations] = useState<PerformanceRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'recommendations'>('overview');
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    status: '',
    timeRange: '24h'
  });
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSummary(),
        fetchMetrics(),
        fetchRecommendations()
      ]);
    } catch (error) {
      setError('Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/performance/summary');
      const result = await response.json();
      if (result.success) {
        setSummary(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/performance/optimizer');
      const result = await response.json();
      if (result.success) {
        setMetrics(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/performance/recommendations');
      const result = await response.json();
      if (result.success) {
        setRecommendations(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  const updateRecommendationStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/performance/recommendations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      });

      const result = await response.json();
      if (result.success) {
        fetchRecommendations();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to update recommendation status');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    if (score >= 50) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api':
        return <Zap className="w-4 h-4" />;
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'elasticsearch':
        return <Search className="w-4 h-4" />;
      case 'cache':
        return <Activity className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading performance dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600">Monitor and optimize system performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </button>
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Performance Score */}
      {summary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Overall Performance Score</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreBgColor(summary.overallScore)} ${getScoreColor(summary.overallScore)}`}>
              {summary.overallScore >= 90 ? 'Excellent' : 
               summary.overallScore >= 70 ? 'Good' : 
               summary.overallScore >= 50 ? 'Fair' : 'Poor'}
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-4xl font-bold text-blue-600">{summary.overallScore}</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${summary.overallScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Based on API, Database, Elasticsearch, Cache, and System metrics
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'metrics', label: 'Metrics', icon: Activity },
              { id: 'recommendations', label: 'Recommendations', icon: AlertTriangle },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && summary && (
            <div className="space-y-6">
              {/* Component Scores */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {Object.entries(summary.metrics).map(([component, score]) => (
                  <motion.div
                    key={component}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {getTypeIcon(component)}
                        <span className="ml-2 text-sm font-medium text-gray-700 capitalize">{component}</span>
                      </div>
                      <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          score >= 90 ? 'bg-green-500' :
                          score >= 70 ? 'bg-yellow-500' :
                          score >= 50 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Recommendations Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{summary.recommendations.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{summary.recommendations.critical}</div>
                    <div className="text-sm text-gray-600">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{summary.recommendations.high}</div>
                    <div className="text-sm text-gray-600">High</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{summary.recommendations.medium}</div>
                    <div className="text-sm text-gray-600">Medium</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{summary.recommendations.low}</div>
                    <div className="text-sm text-gray-600">Low</div>
                  </div>
                </div>
              </div>

              {/* Recent Optimizations */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Optimizations</h3>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-blue-600">{summary.recentOptimizations}</div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Optimizations applied in the last 7 days</p>
                    <p className="text-xs text-gray-500">Includes query optimizations, index recommendations, and cache improvements</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metrics Tab */}
          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="api">API</option>
                    <option value="database">Database</option>
                    <option value="elasticsearch">Elasticsearch</option>
                    <option value="cache">Cache</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Metric
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {metrics.map((metric) => (
                        <tr key={metric.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getTypeIcon(metric.type)}
                              <span className="ml-2 text-sm font-medium text-gray-900 capitalize">{metric.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {metric.name.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {metric.value.toFixed(2)} {metric.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(metric.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Performance Recommendations</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {recommendations.map((recommendation) => (
                  <div key={recommendation.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{recommendation.title}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(recommendation.priority)}`}>
                            {recommendation.priority.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(recommendation.status)}`}>
                            {recommendation.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{recommendation.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Impact</p>
                            <p className="text-sm text-gray-600">{recommendation.impact}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Effort</p>
                            <p className="text-sm text-gray-600 capitalize">{recommendation.effort}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Estimated Improvement</p>
                            <p className="text-sm text-gray-600">{recommendation.estimatedImprovement}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(recommendation.type)}
                        <span className="text-sm text-gray-500 capitalize">{recommendation.type}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">
                          {new Date(recommendation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {recommendation.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateRecommendationStatus(recommendation.id, 'in_progress')}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => updateRecommendationStatus(recommendation.id, 'dismissed')}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                      
                      {recommendation.status === 'in_progress' && (
                        <button
                          onClick={() => updateRecommendationStatus(recommendation.id, 'completed')}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}
    </div>
  );
}
