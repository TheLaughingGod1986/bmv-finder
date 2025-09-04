'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Zap, 
  Globe, 
  Database, 
  FileText, 
  Play, 
  Pause, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Activity,
  Webhook,
  Link,
  Download,
  Upload
} from 'lucide-react';

interface IntegrationConfig {
  id: string;
  name: string;
  type: 'API' | 'WEBHOOK' | 'FILE_SYNC';
  provider: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  configuration: {
    baseUrl?: string;
    apiKey?: string;
    rateLimit?: number;
    timeout?: number;
  };
  authentication: {
    type: 'API_KEY' | 'OAUTH2' | 'BASIC';
    credentials: Record<string, any>;
  };
  endpoints: IntegrationEndpoint[];
  createdAt: string;
}

interface IntegrationEndpoint {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  parameters: {
    required: string[];
    optional: string[];
  };
}

interface IntegrationExecution {
  id: string;
  integrationId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  events: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  createdAt: string;
}

interface IntegrationDashboardProps {
  className?: string;
}

export default function IntegrationDashboard({ className = '' }: IntegrationDashboardProps) {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [executions, setExecutions] = useState<IntegrationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'integrations' | 'webhooks' | 'executions' | 'monitoring'>('integrations');
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrationData();
  }, []);

  const fetchIntegrationData = async () => {
    try {
      setLoading(true);
      
      // Fetch integrations
      const integrationsResponse = await fetch('/api/integrations');
      const integrationsData = await integrationsResponse.json();
      if (integrationsData.success) {
        setIntegrations(integrationsData.data);
      }

      // Fetch webhooks
      const webhooksResponse = await fetch('/api/webhooks');
      const webhooksData = await webhooksResponse.json();
      if (webhooksData.success) {
        setWebhooks(webhooksData.data);
      }

      // Fetch executions for selected integration
      if (selectedIntegration) {
        const executionsResponse = await fetch(`/api/integrations/${selectedIntegration}/executions`);
        const executionsData = await executionsResponse.json();
        if (executionsData.success) {
          setExecutions(executionsData.data);
        }
      }

    } catch (error) {
      setError('Failed to fetch integration data');
    } finally {
      setLoading(false);
    }
  };

  const executeIntegration = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh executions
        if (selectedIntegration === integrationId) {
          fetchIntegrationData();
        }
      }
    } catch (error) {
      console.error('Error executing integration:', error);
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'API':
        return <Globe className="w-5 h-5" />;
      case 'WEBHOOK':
        return <Webhook className="w-5 h-5" />;
      case 'FILE_SYNC':
        return <FileText className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100';
      case 'INACTIVE':
        return 'text-gray-600 bg-gray-100';
      case 'ERROR':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'text-green-600 bg-green-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      case 'RUNNING':
        return 'text-blue-600 bg-blue-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integration Management</h1>
          <p className="text-gray-600">Manage third-party integrations and webhooks</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchIntegrationData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Add Integration
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Link className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Integrations</p>
              <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Integrations</p>
              <p className="text-2xl font-bold text-gray-900">
                {integrations.filter(i => i.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Webhook className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Webhooks</p>
              <p className="text-2xl font-bold text-gray-900">{webhooks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Executions</p>
              <p className="text-2xl font-bold text-gray-900">{executions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'integrations', label: 'Integrations', icon: Link },
              { id: 'webhooks', label: 'Webhooks', icon: Webhook },
              { id: 'executions', label: 'Executions', icon: Activity },
              { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
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
          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">API Integrations</h3>
                <span className="text-sm text-gray-500">{integrations.length} integrations</span>
              </div>

              <div className="grid gap-4">
                {integrations.map((integration) => (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getIntegrationIcon(integration.type)}
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{integration.name}</h4>
                          <p className="text-sm text-gray-500">{integration.provider} • {integration.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(integration.status)}`}>
                          {integration.status}
                        </span>
                        <button
                          onClick={() => executeIntegration(integration.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Execute Integration"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Base URL</p>
                        <p className="text-sm text-gray-600">{integration.configuration.baseUrl || 'Not configured'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Authentication</p>
                        <p className="text-sm text-gray-600">{integration.authentication.type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Endpoints</p>
                        <p className="text-sm text-gray-600">{integration.endpoints.length} endpoints</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Created {new Date(integration.createdAt).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedIntegration(integration.id);
                          setActiveTab('executions');
                        }}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Executions
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Webhooks Tab */}
          {activeTab === 'webhooks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Webhook Configurations</h3>
                <span className="text-sm text-gray-500">{webhooks.length} webhooks</span>
              </div>

              <div className="grid gap-4">
                {webhooks.map((webhook) => (
                  <motion.div
                    key={webhook.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Webhook className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{webhook.name}</h4>
                          <p className="text-sm text-gray-500">{webhook.method} • {webhook.events.length} events</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(webhook.status)}`}>
                          {webhook.status}
                        </span>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">URL</p>
                        <p className="text-sm text-gray-600 break-all">{webhook.url}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Events</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {webhook.events.map((event, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      Created {new Date(webhook.createdAt).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Executions Tab */}
          {activeTab === 'executions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Integration Executions</h3>
                {selectedIntegration && (
                  <span className="text-sm text-gray-500">
                    {integrations.find(i => i.id === selectedIntegration)?.name}
                  </span>
                )}
              </div>

              <div className="grid gap-4">
                {executions.map((execution) => (
                  <motion.div
                    key={execution.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getExecutionStatusColor(execution.status)}`}>
                          {execution.status}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Execution {execution.id}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(execution.startTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {execution.recordsProcessed} records
                        </p>
                        <p className="text-sm text-gray-500">
                          {execution.recordsSuccessful} successful, {execution.recordsFailed} failed
                        </p>
                      </div>
                    </div>

                    {execution.endTime && (
                      <div className="text-sm text-gray-500">
                        Duration: {new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()}ms
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Monitoring Tab */}
          {activeTab === 'monitoring' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Integration Monitoring</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-500">All systems operational</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Integration Health</h4>
                  <div className="space-y-3">
                    {integrations.map((integration) => (
                      <div key={integration.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            integration.status === 'ACTIVE' ? 'bg-green-500' : 
                            integration.status === 'ERROR' ? 'bg-red-500' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-900">{integration.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(integration.status)}`}>
                          {integration.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h4>
                  <div className="space-y-3">
                    {executions.slice(0, 5).map((execution) => (
                      <div key={execution.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            execution.status === 'SUCCESS' ? 'bg-green-500' : 
                            execution.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></div>
                          <span className="text-sm text-gray-900">
                            {integrations.find(i => i.id === execution.integrationId)?.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(execution.startTime).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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