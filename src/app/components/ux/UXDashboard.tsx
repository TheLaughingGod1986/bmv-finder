'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Settings, 
  Play, 
  Pause, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Activity,
  Eye,
  MousePointer,
  Navigation,
  Search,
  Filter,
  Star,
  ThumbsUp,
  ThumbsDown,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface UserJourney {
  id: string;
  userId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  steps: JourneyStep[];
  goal?: string;
  completed: boolean;
  success: boolean;
  metrics: JourneyMetrics;
  insights: JourneyInsight[];
}

interface JourneyStep {
  id: string;
  stepType: 'page_view' | 'action' | 'interaction' | 'navigation' | 'search' | 'form_submit';
  page: string;
  action?: string;
  timestamp: Date;
  duration?: number;
  metadata: Record<string, any>;
  success: boolean;
  errors?: string[];
}

interface JourneyMetrics {
  totalSteps: number;
  totalDuration: number;
  averageStepDuration: number;
  bounceRate: number;
  conversionRate: number;
  dropOffPoints: string[];
  completionRate: number;
  userSatisfaction: number;
  taskSuccess: number;
}

interface JourneyInsight {
  id: string;
  type: 'optimization' | 'bottleneck' | 'success' | 'failure' | 'pattern';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: number;
  recommendation: string;
  confidence: number;
  metadata: Record<string, any>;
}

interface UserFlow {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  expectedDuration: number;
  successCriteria: string[];
  commonIssues: string[];
  optimizationSuggestions: string[];
  metrics: FlowMetrics;
}

interface FlowStep {
  id: string;
  name: string;
  type: 'page' | 'action' | 'decision' | 'validation';
  required: boolean;
  expectedDuration: number;
  successCriteria: string[];
  commonIssues: string[];
  alternatives: string[];
}

interface FlowMetrics {
  totalUsers: number;
  completionRate: number;
  averageDuration: number;
  dropOffRate: number;
  successRate: number;
  userSatisfaction: number;
  commonIssues: Record<string, number>;
}

interface UXOptimization {
  id: string;
  type: 'ui' | 'ux' | 'performance' | 'accessibility' | 'content';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  implementation: string;
  expectedImprovement: number;
  metrics: string[];
  createdAt: Date;
  completedAt?: Date;
}

interface UXStats {
  totalJourneys: number;
  completedJourneys: number;
  averageCompletionRate: number;
  totalOptimizations: number;
  activeOptimizations: number;
  averageUserSatisfaction: number;
}

export default function UXDashboard() {
  const [journeys, setJourneys] = useState<UserJourney[]>([]);
  const [flows, setFlows] = useState<UserFlow[]>([]);
  const [optimizations, setOptimizations] = useState<UXOptimization[]>([]);
  const [stats, setStats] = useState<UXStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'journeys' | 'flows' | 'optimizations' | 'insights'>('overview');
  const [selectedJourney, setSelectedJourney] = useState<UserJourney | null>(null);

  useEffect(() => {
    loadUXData();
  }, []);

  const loadUXData = async () => {
    setIsLoading(true);
    try {
      // Load UX data
      const response = await fetch('/api/ux/optimizations');
      const data = await response.json();
      if (data.success) {
        setOptimizations(data.optimizations);
        setFlows(data.flows);
        setStats(data.stats);
      }

      // Load user journeys
      const journeysResponse = await fetch('/api/ux/journey');
      const journeysData = await journeysResponse.json();
      if (journeysData.success) {
        setJourneys(journeysData.journeys);
      }
    } catch (error) {
      console.error('Error loading UX data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateOptimizations = async () => {
    try {
      const response = await fetch('/api/ux/optimizations', {
        method: 'POST'
      });

      if (response.ok) {
        loadUXData();
      }
    } catch (error) {
      console.error('Error generating optimizations:', error);
    }
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'page_view': return <Eye className="w-4 h-4" />;
      case 'action': return <MousePointer className="w-4 h-4" />;
      case 'navigation': return <Navigation className="w-4 h-4" />;
      case 'search': return <Search className="w-4 h-4" />;
      case 'form_submit': return <CheckCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStepTypeColor = (type: string) => {
    switch (type) {
      case 'page_view': return 'text-blue-600 bg-blue-100';
      case 'action': return 'text-green-600 bg-green-100';
      case 'navigation': return 'text-purple-600 bg-purple-100';
      case 'search': return 'text-orange-600 bg-orange-100';
      case 'form_submit': return 'text-emerald-600 bg-emerald-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <TrendingUp className="w-4 h-4" />;
      case 'bottleneck': return <AlertTriangle className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'failure': return <XCircle className="w-4 h-4" />;
      case 'pattern': return <BarChart3 className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getInsightSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOptimizationTypeColor = (type: string) => {
    switch (type) {
      case 'ui': return 'text-blue-600 bg-blue-100';
      case 'ux': return 'text-green-600 bg-green-100';
      case 'performance': return 'text-purple-600 bg-purple-100';
      case 'accessibility': return 'text-orange-600 bg-orange-100';
      case 'content': return 'text-emerald-600 bg-emerald-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOptimizationStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'approved': return 'text-purple-600 bg-purple-100';
      case 'proposed': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading UX data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">UX Dashboard</h1>
            <p className="text-gray-600">User experience analytics and optimization insights</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadUXData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={generateOptimizations}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Zap className="w-4 h-4" />
              Generate Optimizations
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'journeys', label: 'User Journeys', icon: Navigation },
              { id: 'flows', label: 'User Flows', icon: Target },
              { id: 'optimizations', label: 'Optimizations', icon: TrendingUp },
              { id: 'insights', label: 'Insights', icon: BarChart3 }
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
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Journeys</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalJourneys}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageCompletionRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active Optimizations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeOptimizations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">User Satisfaction</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageUserSatisfaction.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Flow Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Flow Performance</h3>
            <div className="space-y-4">
              {flows.map((flow) => (
                <div key={flow.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-md font-medium text-gray-900">{flow.name}</h4>
                    <span className="text-sm text-gray-600">{flow.metrics.totalUsers} users</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{flow.metrics.completionRate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-600">Completion Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{formatDuration(flow.metrics.averageDuration)}</div>
                      <div className="text-xs text-gray-600">Avg Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{flow.metrics.dropOffRate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-600">Drop-off Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{flow.metrics.userSatisfaction.toFixed(1)}%</div>
                      <div className="text-xs text-gray-600">Satisfaction</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'journeys' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">User Journeys</h3>
          </div>
          <div className="p-6">
            {journeys.length === 0 ? (
              <div className="text-center py-8">
                <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No journeys available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {journeys.map((journey) => (
                  <div
                    key={journey.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedJourney(journey)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          journey.success ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                        }`}>
                          {journey.success ? 'Success' : 'Failed'}
                        </span>
                        {journey.goal && (
                          <span className="text-sm text-gray-600">{journey.goal}</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(journey.startTime)}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Steps:</span>
                        <div className="font-medium">{journey.metrics.totalSteps}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <div className="font-medium">{formatDuration(journey.metrics.totalDuration)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Completion:</span>
                        <div className="font-medium">{journey.metrics.completionRate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Satisfaction:</span>
                        <div className="font-medium">{journey.metrics.userSatisfaction.toFixed(1)}%</div>
                      </div>
                    </div>

                    {journey.insights.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium text-gray-900">{journey.insights.length} insights</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'flows' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">User Flows</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {flows.map((flow) => (
                <div key={flow.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{flow.name}</h4>
                      <p className="text-sm text-gray-600">{flow.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Expected Duration</div>
                      <div className="font-medium">{formatDuration(flow.expectedDuration)}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Flow Steps</h5>
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {flow.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-2">
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm">
                            <span className="text-gray-600">{index + 1}</span>
                            <span className="font-medium">{step.name}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              step.required ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                            }`}>
                              {step.type}
                            </span>
                          </div>
                          {index < flow.steps.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{flow.metrics.totalUsers}</div>
                      <div className="text-sm text-gray-600">Total Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{flow.metrics.completionRate.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Completion Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{formatDuration(flow.metrics.averageDuration)}</div>
                      <div className="text-sm text-gray-600">Avg Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{flow.metrics.dropOffRate.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Drop-off Rate</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'optimizations' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">UX Optimizations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Optimization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effort
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Improvement
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {optimizations.map((optimization) => (
                  <tr key={optimization.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{optimization.title}</div>
                        <div className="text-sm text-gray-500">{optimization.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getOptimizationTypeColor(optimization.type)}`}>
                        {optimization.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        optimization.impact === 'high' ? 'text-green-600 bg-green-100' :
                        optimization.impact === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                        'text-gray-600 bg-gray-100'
                      }`}>
                        {optimization.impact}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        optimization.effort === 'low' ? 'text-green-600 bg-green-100' :
                        optimization.effort === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                        'text-red-600 bg-red-100'
                      }`}>
                        {optimization.effort}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${optimization.priority * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{optimization.priority}/10</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getOptimizationStatusColor(optimization.status)}`}>
                        {optimization.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      +{optimization.expectedImprovement}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">UX Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Top Issues</h4>
                <div className="space-y-3">
                  {flows.map((flow) => {
                    const topIssue = Object.entries(flow.metrics.commonIssues)
                      .sort(([,a], [,b]) => b - a)[0];
                    return topIssue ? (
                      <div key={flow.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <span className="text-sm text-gray-700">{topIssue[0]}</span>
                        <span className="text-sm font-medium text-red-600">{topIssue[1]} occurrences</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Success Patterns</h4>
                <div className="space-y-3">
                  {flows.map((flow) => (
                    <div key={flow.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-700">{flow.name}</span>
                      <span className="text-sm font-medium text-green-600">{flow.metrics.completionRate.toFixed(1)}% completion</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Journey Detail Modal */}
      {selectedJourney && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Journey Details</h3>
                <button
                  onClick={() => setSelectedJourney(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Journey Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedJourney.success ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                    }`}>
                      {selectedJourney.success ? 'Success' : 'Failed'}
                    </span>
                    {selectedJourney.goal && (
                      <span className="text-sm text-gray-600">Goal: {selectedJourney.goal}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-medium">{formatDuration(selectedJourney.metrics.totalDuration)}</div>
                  </div>
                </div>

                {/* Journey Steps */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Journey Steps</h4>
                  <div className="space-y-2">
                    {selectedJourney.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-600 w-8">{index + 1}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStepTypeColor(step.stepType)}`}>
                          {getStepTypeIcon(step.stepType)}
                          {step.stepType}
                        </span>
                        <span className="text-sm font-medium text-gray-900 flex-1">{step.page}</span>
                        {step.duration && (
                          <span className="text-sm text-gray-600">{formatDuration(step.duration)}</span>
                        )}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          step.success ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                        }`}>
                          {step.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Journey Insights */}
                {selectedJourney.insights.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Insights</h4>
                    <div className="space-y-2">
                      {selectedJourney.insights.map((insight) => (
                        <div key={insight.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getInsightSeverityColor(insight.severity)}`}>
                            {getInsightTypeIcon(insight.type)}
                          </span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{insight.title}</div>
                            <div className="text-sm text-gray-600">{insight.description}</div>
                            <div className="text-xs text-gray-500 mt-1">Recommendation: {insight.recommendation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
