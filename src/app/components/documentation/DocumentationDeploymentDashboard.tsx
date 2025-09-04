'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Code, 
  Download, 
  Upload, 
  Play, 
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  FileText,
  Globe,
  Server,
  Database,
  Shield,
  Zap,
  Monitor,
  GitBranch,
  GitCommit,
  History,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';

interface APIDocumentation {
  id: string;
  name: string;
  version: string;
  description: string;
  baseUrl: string;
  endpoints: APIEndpoint[];
  schemas: APISchema[];
  examples: APIExample[];
  authentication: APIAuthentication;
  rateLimiting: APIRateLimiting;
  errorCodes: APIErrorCode[];
  changelog: APIChangelogEntry[];
  createdAt: string;
  updatedAt: string;
}

interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  description: string;
  tags: string[];
  parameters: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  examples: APIExample[];
  rateLimit?: number;
  authentication: boolean;
  permissions?: string[];
  deprecated: boolean;
  version: string;
}

interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required: boolean;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  format?: string;
  example?: any;
  enum?: any[];
  default?: any;
  min?: number;
  max?: number;
  pattern?: string;
}

interface APIRequestBody {
  description: string;
  required: boolean;
  content: {
    [mediaType: string]: {
      schema: any;
      examples?: { [key: string]: any };
    };
  };
}

interface APIResponse {
  statusCode: number;
  description: string;
  content?: {
    [mediaType: string]: {
      schema: any;
      examples?: { [key: string]: any };
    };
  };
  headers?: { [key: string]: any };
}

interface APISchema {
  name: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  description: string;
  properties?: { [key: string]: any };
  required?: string[];
  example?: any;
  enum?: any[];
  format?: string;
}

interface APIExample {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
  request?: {
    headers?: { [key: string]: string };
    body?: any;
    query?: { [key: string]: any };
  };
  response?: {
    statusCode: number;
    headers?: { [key: string]: string };
    body?: any;
  };
  tags: string[];
}

interface APIAuthentication {
  type: 'bearer' | 'api-key' | 'oauth2' | 'basic';
  description: string;
  scheme?: string;
  bearerFormat?: string;
  flows?: {
    authorizationCode?: {
      authorizationUrl: string;
      tokenUrl: string;
      scopes: { [key: string]: string };
    };
    clientCredentials?: {
      tokenUrl: string;
      scopes: { [key: string]: string };
    };
  };
  apiKey?: {
    name: string;
    in: 'header' | 'query' | 'cookie';
  };
}

interface APIRateLimiting {
  enabled: boolean;
  limits: {
    [tier: string]: {
      requests: number;
      window: string;
      burst?: number;
    };
  };
  headers: {
    limit: string;
    remaining: string;
    reset: string;
  };
}

interface APIErrorCode {
  code: number;
  message: string;
  description: string;
  category: 'client' | 'server' | 'authentication' | 'authorization' | 'rate-limit';
  examples: {
    request?: any;
    response: any;
  }[];
}

interface APIChangelogEntry {
  version: string;
  date: string;
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  description: string;
  endpoints?: string[];
  breaking?: boolean;
}

interface DeploymentConfig {
  id: string;
  name: string;
  environment: 'development' | 'staging' | 'production';
  platform: 'vercel' | 'aws' | 'azure' | 'gcp' | 'docker' | 'kubernetes';
  region: string;
  domain: string;
  ssl: boolean;
  cdn: boolean;
  monitoring: boolean;
  backup: boolean;
  scaling: {
    minInstances: number;
    maxInstances: number;
    autoScale: boolean;
  };
  resources: {
    cpu: string;
    memory: string;
    storage: string;
  };
  environmentVariables: { [key: string]: string };
  secrets: string[];
  healthChecks: HealthCheck[];
  rollbackStrategy: RollbackStrategy;
  createdAt: string;
  updatedAt: string;
}

interface HealthCheck {
  id: string;
  name: string;
  type: 'http' | 'tcp' | 'grpc' | 'custom';
  endpoint: string;
  interval: number;
  timeout: number;
  retries: number;
  expectedStatus?: number;
  expectedResponse?: string;
  enabled: boolean;
}

interface RollbackStrategy {
  type: 'automatic' | 'manual' | 'blue-green' | 'canary';
  threshold: number;
  duration: number;
  healthCheckFailures: number;
  enabled: boolean;
}

interface DeploymentHistory {
  id: string;
  pipelineId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled' | 'rollback';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  commitHash: string;
  commitMessage: string;
  triggeredBy: string;
  environment: string;
  steps: DeploymentStepResult[];
  logs: string[];
  artifacts: string[];
  rollbackReason?: string;
}

interface DeploymentStepResult {
  stepId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  logs: string[];
  error?: string;
}

interface DocumentationDeploymentDashboardProps {
  className?: string;
}

export default function DocumentationDeploymentDashboard({ className = '' }: DocumentationDeploymentDashboardProps) {
  const [apiDocs, setApiDocs] = useState<APIDocumentation[]>([]);
  const [deploymentConfigs, setDeploymentConfigs] = useState<DeploymentConfig[]>([]);
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'documentation' | 'deployment' | 'history' | 'guides'>('documentation');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    environment: 'all',
    platform: 'all',
    status: 'all',
  });

  useEffect(() => {
    fetchDocumentationDeploymentData();
  }, []);

  const fetchDocumentationDeploymentData = async () => {
    try {
      setLoading(true);
      
      // Fetch API documentation
      const docsResponse = await fetch('/api/documentation');
      const docsData = await docsResponse.json();
      if (docsData.success) {
        setApiDocs(docsData.data);
      }

      // Fetch deployment configurations
      const configsResponse = await fetch('/api/deployment/configs');
      const configsData = await configsResponse.json();
      if (configsData.success) {
        setDeploymentConfigs(configsData.data);
      }

      // Fetch deployment history
      const historyResponse = await fetch('/api/deployment/deploy?pipelineId=production-pipeline');
      const historyData = await historyResponse.json();
      if (historyData.success) {
        setDeploymentHistory(historyData.data);
      }

    } catch (error) {
      setError('Failed to fetch documentation and deployment data');
    } finally {
      setLoading(false);
    }
  };

  const exportDocumentation = async (docId: string, format: 'json' | 'yaml' | 'html') => {
    try {
      const response = await fetch(`/api/documentation?docId=${docId}&format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `documentation-${docId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting documentation:', error);
    }
  };

  const executeDeployment = async (pipelineId: string) => {
    try {
      const response = await fetch('/api/deployment/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pipelineId,
          commitHash: 'latest',
          commitMessage: 'Manual deployment from dashboard',
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchDocumentationDeploymentData();
      }
    } catch (error) {
      console.error('Error executing deployment:', error);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'text-green-600 bg-green-100';
      case 'POST':
        return 'text-blue-600 bg-blue-100';
      case 'PUT':
        return 'text-orange-600 bg-orange-100';
      case 'DELETE':
        return 'text-red-600 bg-red-100';
      case 'PATCH':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rollback':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'production':
        return 'text-red-600 bg-red-100';
      case 'staging':
        return 'text-yellow-600 bg-yellow-100';
      case 'development':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const toggleEndpointExpansion = (endpointId: string) => {
    const newExpanded = new Set(expandedEndpoints);
    if (newExpanded.has(endpointId)) {
      newExpanded.delete(endpointId);
    } else {
      newExpanded.add(endpointId);
    }
    setExpandedEndpoints(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documentation and deployment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documentation & Deployment</h1>
          <p className="text-gray-600">API documentation, deployment management, and guides</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDocumentationDeploymentData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Add Documentation
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">API Documentation</p>
              <p className="text-2xl font-bold text-gray-900">{apiDocs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Server className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Deployment Configs</p>
              <p className="text-2xl font-bold text-gray-900">{deploymentConfigs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <History className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Deployments</p>
              <p className="text-2xl font-bold text-gray-900">{deploymentHistory.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {deploymentHistory.length > 0 
                  ? Math.round((deploymentHistory.filter(d => d.status === 'success').length / deploymentHistory.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'documentation', label: 'API Documentation', icon: BookOpen },
              { id: 'deployment', label: 'Deployment', icon: Server },
              { id: 'history', label: 'Deployment History', icon: History },
              { id: 'guides', label: 'Guides', icon: FileText },
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
          {/* API Documentation Tab */}
          {activeTab === 'documentation' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">API Documentation</h3>
                <span className="text-sm text-gray-500">{apiDocs.length} APIs</span>
              </div>

              <div className="grid gap-6">
                {apiDocs.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{doc.name}</h4>
                          <p className="text-sm text-gray-500">{doc.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              v{doc.version}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {doc.baseUrl}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => exportDocumentation(doc.id, 'html')}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Export HTML"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => exportDocumentation(doc.id, 'json')}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Export JSON"
                        >
                          <Code className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{doc.endpoints.length}</div>
                        <div className="text-xs text-gray-500">Endpoints</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{doc.schemas.length}</div>
                        <div className="text-xs text-gray-500">Schemas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{doc.examples.length}</div>
                        <div className="text-xs text-gray-500">Examples</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{doc.errorCodes.length}</div>
                        <div className="text-xs text-gray-500">Error Codes</div>
                      </div>
                    </div>

                    {/* Endpoints */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">Endpoints</h5>
                      {doc.endpoints.slice(0, 3).map((endpoint) => (
                        <div key={endpoint.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getMethodColor(endpoint.method)}`}>
                              {endpoint.method}
                            </span>
                            <span className="text-sm font-mono">{endpoint.path}</span>
                          </div>
                          <span className="text-xs text-gray-500">{endpoint.summary}</span>
                        </div>
                      ))}
                      {doc.endpoints.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{doc.endpoints.length - 3} more endpoints
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Deployment Tab */}
          {activeTab === 'deployment' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Deployment Configurations</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.environment}
                    onChange={(e) => setFilters({ ...filters, environment: e.target.value })}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Environments</option>
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                  <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Config
                  </button>
                </div>
              </div>

              <div className="grid gap-6">
                {deploymentConfigs.map((config) => (
                  <motion.div
                    key={config.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Server className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{config.name}</h4>
                          <p className="text-sm text-gray-500">{config.domain}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getEnvironmentColor(config.environment)}`}>
                              {config.environment}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {config.platform}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {config.region}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => executeDeployment('production-pipeline')}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Deploy"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{config.healthChecks.length}</div>
                        <div className="text-xs text-gray-500">Health Checks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{config.secrets.length}</div>
                        <div className="text-xs text-gray-500">Secrets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{config.scaling.minInstances}-{config.scaling.maxInstances}</div>
                        <div className="text-xs text-gray-500">Instances</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{config.resources.cpu}</div>
                        <div className="text-xs text-gray-500">CPU</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Shield className={`w-4 h-4 ${config.ssl ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="text-xs text-gray-500">SSL</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Globe className={`w-4 h-4 ${config.cdn ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="text-xs text-gray-500">CDN</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Monitor className={`w-4 h-4 ${config.monitoring ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="text-xs text-gray-500">Monitoring</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Database className={`w-4 h-4 ${config.backup ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="text-xs text-gray-500">Backup</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Updated: {new Date(config.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Deployment History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Deployment History</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="running">Running</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {deploymentHistory.map((deployment) => (
                  <motion.div
                    key={deployment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <GitCommit className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{deployment.commitMessage}</h4>
                          <p className="text-sm text-gray-500">
                            {deployment.commitHash} • {deployment.environment} • {deployment.triggeredBy}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(deployment.status)}`}>
                              {deployment.status}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {deployment.environment}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        {deployment.status === 'failed' && (
                          <button className="p-2 text-gray-400 hover:text-orange-600 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {deployment.steps.filter(s => s.status === 'success').length}
                        </div>
                        <div className="text-xs text-gray-500">Completed Steps</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {deployment.steps.filter(s => s.status === 'failed').length}
                        </div>
                        <div className="text-xs text-gray-500">Failed Steps</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {deployment.duration ? Math.round(deployment.duration / 1000) : 0}s
                        </div>
                        <div className="text-xs text-gray-500">Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {deployment.logs.length}
                        </div>
                        <div className="text-xs text-gray-500">Log Entries</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Started: {new Date(deployment.startedAt).toLocaleString()}
                        {deployment.completedAt && (
                          <span> • Completed: {new Date(deployment.completedAt).toLocaleString()}</span>
                        )}
                      </div>
                      {deployment.rollbackReason && (
                        <div className="text-xs text-orange-600">
                          Rollback: {deployment.rollbackReason}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Guides Tab */}
          {activeTab === 'guides' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Deployment Guides</h3>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4 mr-2" />
                  Download All Guides
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {deploymentConfigs.map((config) => (
                  <div key={config.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{config.name} Guide</h4>
                        <p className="text-sm text-gray-500">Deployment guide for {config.environment} environment</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Platform:</span>
                        <span className="font-medium">{config.platform}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Region:</span>
                        <span className="font-medium">{config.region}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Domain:</span>
                        <span className="font-medium">{config.domain}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Health Checks:</span>
                        <span className="font-medium">{config.healthChecks.length}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </button>
                      <button className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </button>
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
