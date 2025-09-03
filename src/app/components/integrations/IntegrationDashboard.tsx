'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plug, 
  Webhook, 
  Activity, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  ExternalLink
} from 'lucide-react';

interface IntegrationConfig {
  id: string;
  name: string;
  type: 'API' | 'WEBHOOK' | 'OAUTH' | 'WEBHOOK_INCOMING' | 'DATA_SYNC';
  provider: string;
  description: string;
  baseUrl?: string;
  isActive: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

interface WebhookHandler {
  id: string;
  name: string;
  eventTypes: string[];
  isActive: boolean;
  successCount: number;
  failureCount: number;
  lastUsed?: Date;
  successRate: number;
}

interface IntegrationMetrics {
  totalIntegrations: number;
  activeIntegrations: number;
  totalWebhooks: number;
  activeWebhooks: number;
  totalDataSyncs: number;
  activeDataSyncs: number;
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  pendingWebhookEvents: number;
}

export default function IntegrationDashboard() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [webhookHandlers, setWebhookHandlers] = useState<WebhookHandler[]>([]);
  const [metrics, setMetrics] = useState<IntegrationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'integrations' | 'webhooks' | 'settings'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadIntegrationData();
  }, []);

  const loadIntegrationData = async () => {
    setIsLoading(true);
    try {
      // Load integrations
      const integrationsResponse = await fetch('/api/integrations');
      const integrationsData = await integrationsResponse.json();
      if (integrationsData.success) {
        setIntegrations(integrationsData.integrations);
      }

      // Load webhook handlers
      const webhooksResponse = await fetch('/api/webhooks?type=handlers');
      const webhooksData = await webhooksResponse.json();
      if (webhooksData.success) {
        setWebhookHandlers(webhooksData.handlers);
      }

      // Load metrics
      const metricsResponse = await fetch('/api/webhooks?type=metrics');
      const metricsData = await metricsResponse.json();
      if (metricsData.success) {
        setMetrics(metricsData.metrics);
      }
    } catch (error) {
      console.error('Error loading integration data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIntegration = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        loadIntegrationData();
      }
    } catch (error) {
      console.error('Error toggling integration:', error);
    }
  };

  const deleteIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadIntegrationData();
      }
    } catch (error) {
      console.error('Error deleting integration:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'API': return <ExternalLink className="w-4 h-4" />;
      case 'WEBHOOK': return <Webhook className="w-4 h-4" />;
      case 'OAUTH': return <Settings className="w-4 h-4" />;
      case 'DATA_SYNC': return <Database className="w-4 h-4" />;
      default: return <Plug className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'API': return 'text-blue-600 bg-blue-100';
      case 'WEBHOOK': return 'text-green-600 bg-green-100';
      case 'OAUTH': return 'text-purple-600 bg-purple-100';
      case 'DATA_SYNC': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading integration data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Integration Dashboard</h1>
            <p className="text-gray-600">Manage third-party integrations and webhooks</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadIntegrationData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Integration
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'integrations', label: 'Integrations', icon: Plug },
              { id: 'webhooks', label: 'Webhooks', icon: Webhook },
              { id: 'settings', label: 'Settings', icon: Settings }
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
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Plug className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Integrations</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalIntegrations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Webhook className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active Webhooks</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.activeWebhooks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Successful Events</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.successfulEvents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <XCircle className="w-8 h-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Failed Events</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.failedEvents}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.activeIntegrations}</div>
                <div className="text-sm text-gray-600">Active Integrations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalDataSyncs}</div>
                <div className="text-sm text-gray-600">Data Syncs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics.pendingWebhookEvents}</div>
                <div className="text-sm text-gray-600">Pending Webhooks</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Integrations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                {integrations.map((integration) => (
                  <tr key={integration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{integration.name}</div>
                        <div className="text-sm text-gray-500">{integration.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(integration.type)}`}>
                        {getTypeIcon(integration.type)}
                        {integration.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {integration.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        integration.isActive 
                          ? 'text-green-800 bg-green-100' 
                          : 'text-red-800 bg-red-100'
                      }`}>
                        {integration.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(integration.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleIntegration(integration.id, integration.isActive)}
                          className={`p-1 rounded ${
                            integration.isActive 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {integration.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteIntegration(integration.id)}
                          className="p-1 text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Webhook Handlers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Types
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {webhookHandlers.map((handler) => (
                  <tr key={handler.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {handler.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {handler.eventTypes.slice(0, 3).map((eventType) => (
                          <span key={eventType} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {eventType}
                          </span>
                        ))}
                        {handler.eventTypes.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{handler.eventTypes.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        handler.isActive 
                          ? 'text-green-800 bg-green-100' 
                          : 'text-red-800 bg-red-100'
                      }`}>
                        {handler.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              handler.successRate >= 90 ? 'bg-green-600' :
                              handler.successRate >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${handler.successRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{handler.successRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {handler.lastUsed ? formatDate(handler.lastUsed) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Settings</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Webhook Security</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700">Enable webhook signature verification</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700">Require HTTPS for webhooks</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700">Log all webhook requests</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">API Settings</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700">Enable rate limiting</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700">Retry failed requests</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700">Log API requests</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Integration Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Integration</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Integration name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="API">API</option>
                    <option value="WEBHOOK">Webhook</option>
                    <option value="OAUTH">OAuth</option>
                    <option value="DATA_SYNC">Data Sync</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Provider</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provider name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Integration description"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
