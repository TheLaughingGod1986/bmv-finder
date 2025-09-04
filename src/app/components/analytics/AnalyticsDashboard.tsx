'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Brain, 
  FileText, 
  Download, 
  Play, 
  Settings, 
  Eye,
  RefreshCw,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
  PieChart,
  LineChart,
  Table,
  Gauge
} from 'lucide-react';

interface AnalyticsQuery {
  id: string;
  name: string;
  description: string;
  type: 'property' | 'market' | 'portfolio' | 'user' | 'financial' | 'custom';
  filters: any[];
  aggregations: any[];
  timeRange: any;
  groupBy: string[];
  orderBy: any[];
  createdAt: Date;
  updatedAt: Date;
}

interface AnalyticsResult {
  id: string;
  queryId: string;
  data: any[];
  summary: any;
  metadata: any;
  executionTime: number;
  createdAt: Date;
}

interface PredictiveModel {
  id: string;
  name: string;
  description: string;
  type: 'regression' | 'classification' | 'clustering' | 'time_series' | 'anomaly_detection';
  algorithm: string;
  version: string;
  status: 'training' | 'ready' | 'deployed' | 'retired' | 'error';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'operational' | 'financial' | 'market' | 'custom';
  type: 'dashboard' | 'summary' | 'detailed' | 'comparative' | 'trend';
  sections: any[];
  createdAt: Date;
  updatedAt: Date;
}

export default function AnalyticsDashboard() {
  const [queries, setQueries] = useState<AnalyticsQuery[]>([]);
  const [results, setResults] = useState<AnalyticsResult[]>([]);
  const [models, setModels] = useState<PredictiveModel[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'models' | 'reports'>('overview');
  const [selectedQuery, setSelectedQuery] = useState<AnalyticsQuery | null>(null);
  const [selectedModel, setSelectedModel] = useState<PredictiveModel | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Load analytics queries
      const queriesResponse = await fetch('/api/analytics/queries');
      const queriesData = await queriesResponse.json();
      if (queriesData.success) {
        setQueries(queriesData.queries);
      }

      // Load predictive models
      const modelsResponse = await fetch('/api/analytics/models');
      const modelsData = await modelsResponse.json();
      if (modelsData.success) {
        setModels(modelsData.models);
      }

      // Load report templates
      const templatesResponse = await fetch('/api/reports/templates');
      const templatesData = await templatesResponse.json();
      if (templatesData.success) {
        setTemplates(templatesData.templates);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuery = async (queryId: string) => {
    try {
      const response = await fetch('/api/analytics/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResults(prev => [data.result, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error executing query:', error);
    }
  };

  const makePrediction = async (modelId: string, inputData: any) => {
    try {
      const response = await fetch('/api/analytics/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          inputData,
          options: {
            confidenceThreshold: 0.8,
            returnProbabilities: true,
            explainPrediction: true
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Prediction result:', data.prediction);
        }
      }
    } catch (error) {
      console.error('Error making prediction:', error);
    }
  };

  const generateReport = async (templateId: string) => {
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          filters: [],
          parameters: {}
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Report generated:', data.report);
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'training':
      case 'generating':
        return 'text-blue-600 bg-blue-100';
      case 'error':
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'deployed':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'property':
        return <BarChart3 className="w-4 h-4" />;
      case 'market':
        return <TrendingUp className="w-4 h-4" />;
      case 'portfolio':
        return <Activity className="w-4 h-4" />;
      case 'regression':
        return <LineChart className="w-4 h-4" />;
      case 'classification':
        return <PieChart className="w-4 h-4" />;
      case 'time_series':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading analytics data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics & Reporting</h1>
            <p className="text-gray-600">Data analytics, predictive models, and business intelligence</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAnalyticsData}
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
              { id: 'queries', label: 'Analytics Queries', icon: Search },
              { id: 'models', label: 'Predictive Models', icon: Brain },
              { id: 'reports', label: 'Reports', icon: FileText }
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
                <Search className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Analytics Queries</p>
                  <p className="text-2xl font-bold text-gray-900">{queries.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Brain className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Predictive Models</p>
                  <p className="text-2xl font-bold text-gray-900">{models.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Report Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Query Results</p>
                  <p className="text-2xl font-bold text-gray-900">{results.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {results.slice(0, 5).map((result) => (
                <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Query executed</span>
                    <span className="text-sm text-gray-600">{formatDuration(result.executionTime)}</span>
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(result.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'queries' && (
        <div className="space-y-6">
          {/* Analytics Queries */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Analytics Queries</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  New Query
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {queries.map((query) => (
                  <div key={query.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(query.type)}
                        <span className="text-sm font-medium text-gray-900">{query.name}</span>
                        <span className="text-xs text-gray-500">{query.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => executeQuery(query.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Play className="w-4 h-4" />
                          Execute
                        </button>
                        <button
                          onClick={() => setSelectedQuery(query)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{query.description}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {formatDate(query.createdAt)}</span>
                      <span>Updated: {formatDate(query.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'models' && (
        <div className="space-y-6">
          {/* Predictive Models */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Predictive Models</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  New Model
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {models.map((model) => (
                  <div key={model.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(model.type)}
                        <span className="text-sm font-medium text-gray-900">{model.name}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}>
                          {model.status}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedModel(model)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{model.description}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>Algorithm: {model.algorithm}</div>
                      <div>Version: {model.version}</div>
                      <div>Accuracy: {(model.accuracy * 100).toFixed(1)}%</div>
                      <div>F1 Score: {model.f1Score.toFixed(3)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Report Templates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Report Templates</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  New Template
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium text-gray-900">{template.name}</span>
                        <span className="text-xs text-gray-500">{template.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateReport(template.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Download className="w-4 h-4" />
                          Generate
                        </button>
                        <button className="text-blue-600 hover:text-blue-700">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{template.description}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Type: {template.type}</span>
                      <span>Sections: {template.sections.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Query Detail Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Query Details</h3>
                <button
                  onClick={() => setSelectedQuery(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">{selectedQuery.name}</h4>
                  <p className="text-gray-600">{selectedQuery.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Type</div>
                    <div className="font-medium">{selectedQuery.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Group By</div>
                    <div className="font-medium">{selectedQuery.groupBy.join(', ')}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2">Aggregations</div>
                  <div className="space-y-1">
                    {selectedQuery.aggregations.map((agg, index) => (
                      <div key={index} className="text-sm">
                        {agg.function}({agg.field}) {agg.alias && `as ${agg.alias}`}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Detail Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Model Details</h3>
                <button
                  onClick={() => setSelectedModel(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">{selectedModel.name}</h4>
                  <p className="text-gray-600">{selectedModel.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Type</div>
                    <div className="font-medium">{selectedModel.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Algorithm</div>
                    <div className="font-medium">{selectedModel.algorithm}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                    <div className="font-medium">{(selectedModel.accuracy * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">F1 Score</div>
                    <div className="font-medium">{selectedModel.f1Score.toFixed(3)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <button
                    onClick={() => {
                      makePrediction(selectedModel.id, { sample: 'data' });
                      setSelectedModel(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Make Prediction
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}