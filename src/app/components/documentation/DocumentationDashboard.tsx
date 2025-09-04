'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Code, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Download,
  ExternalLink,
  FileText,
  Settings,
  Activity,
  BarChart3,
  Shield,
  Zap,
  Users,
  Globe,
  Server,
  Database,
  Monitor,
  AlertTriangle,
  Info,
  Eye,
  Copy,
  Share
} from 'lucide-react';

interface APIDocumentation {
  id: string;
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  endpoints: APIEndpoint[];
  schemas: APISchema[];
  examples: APIExample[];
  authentication: AuthenticationInfo;
  rateLimiting: RateLimitInfo;
  errorCodes: ErrorCode[];
  changelog: ChangelogEntry[];
  createdAt: Date;
  updatedAt: Date;
}

interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  description: string;
  tags: string[];
  parameters: APIParameter[];
  requestBody?: RequestBody;
  responses: APIResponse[];
  examples: EndpointExample[];
  authentication: boolean;
  rateLimit?: RateLimitInfo;
  deprecated: boolean;
  since: string;
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
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

interface RequestBody {
  description: string;
  required: boolean;
  content: ContentType[];
}

interface ContentType {
  mediaType: string;
  schema: APISchema;
  example?: any;
}

interface APIResponse {
  statusCode: number;
  description: string;
  content?: ContentType[];
  headers?: Record<string, string>;
}

interface APISchema {
  id: string;
  name: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  description: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  example?: any;
  enum?: any[];
  format?: string;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: APISchema;
}

interface SchemaProperty {
  type: string;
  description: string;
  example?: any;
  format?: string;
  enum?: any[];
  default?: any;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: APISchema;
}

interface APIExample {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  method: string;
  request: ExampleRequest;
  response: ExampleResponse;
  tags: string[];
}

interface ExampleRequest {
  headers?: Record<string, string>;
  query?: Record<string, any>;
  path?: Record<string, any>;
  body?: any;
}

interface ExampleResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: any;
}

interface EndpointExample {
  title: string;
  description: string;
  request: ExampleRequest;
  response: ExampleResponse;
}

interface AuthenticationInfo {
  type: 'bearer' | 'api_key' | 'oauth2' | 'basic';
  description: string;
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuth2Flow[];
  apiKeyLocation?: 'header' | 'query' | 'cookie';
  apiKeyName?: string;
}

interface OAuth2Flow {
  type: 'authorizationCode' | 'implicit' | 'password' | 'clientCredentials';
  authorizationUrl: string;
  tokenUrl: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

interface RateLimitInfo {
  requests: number;
  window: string;
  description: string;
}

interface ErrorCode {
  code: number;
  message: string;
  description: string;
  possibleCauses: string[];
  solutions: string[];
}

interface ChangelogEntry {
  version: string;
  date: Date;
  changes: ChangeEntry[];
}

interface ChangeEntry {
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  description: string;
  endpoint?: string;
  breaking?: boolean;
}

interface DeploymentConfig {
  id: string;
  name: string;
  environment: 'development' | 'staging' | 'production';
  platform: 'vercel' | 'aws' | 'azure' | 'gcp' | 'docker';
  region: string;
  domain: string;
  ssl: boolean;
  cdn: boolean;
  monitoring: boolean;
  backup: boolean;
  autoScaling: boolean;
  healthChecks: boolean;
  environmentVariables: Record<string, string>;
  secrets: Record<string, string>;
  dependencies: string[];
  buildCommand: string;
  startCommand: string;
  port: number;
  memory: string;
  cpu: string;
  replicas: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Deployment {
  id: string;
  configId: string;
  version: string;
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed' | 'rolled_back';
  environment: string;
  platform: string;
  region: string;
  domain: string;
  buildLogs: string[];
  deploymentLogs: string[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
  commitHash: string;
  branch: string;
  triggeredBy: string;
  rollbackVersion?: string;
  healthCheckUrl: string;
  metrics: DeploymentMetrics;
  createdAt: Date;
}

interface DeploymentMetrics {
  buildTime: number;
  deploymentTime: number;
  totalTime: number;
  successRate: number;
  errorCount: number;
  warningCount: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
}

interface DeploymentStats {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  averageDeploymentTime: number;
  successRate: number;
  activeDeployments: number;
}

export default function DocumentationDashboard() {
  const [documentation, setDocumentation] = useState<APIDocumentation | null>(null);
  const [deploymentConfigs, setDeploymentConfigs] = useState<DeploymentConfig[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [deploymentStats, setDeploymentStats] = useState<DeploymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'deployment' | 'monitoring'>('overview');
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);

  useEffect(() => {
    loadDocumentationData();
  }, []);

  const loadDocumentationData = async () => {
    setIsLoading(true);
    try {
      // Load API documentation
      const docResponse = await fetch('/api/documentation');
      const docData = await docResponse.json();
      if (docData.success) {
        setDocumentation(docData.documentation);
      }

      // Load deployment configurations
      const configResponse = await fetch('/api/deployment/configs');
      const configData = await configResponse.json();
      if (configData.success) {
        setDeploymentConfigs(configData.configs);
      }

      // Load deployment status
      const statusResponse = await fetch('/api/deployment/status');
      const statusData = await statusResponse.json();
      if (statusData.success) {
        setDeployments(statusData.deployments);
        setDeploymentStats(statusData.stats);
      }
    } catch (error) {
      console.error('Error loading documentation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDocumentation = async () => {
    try {
      const response = await fetch('/api/documentation', {
        method: 'POST'
      });

      if (response.ok) {
        loadDocumentationData();
      }
    } catch (error) {
      console.error('Error generating documentation:', error);
    }
  };

  const deployApplication = async (configId: string) => {
    try {
      const response = await fetch('/api/deployment/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId,
          version: `v${Date.now()}`,
          commitHash: 'latest',
          branch: 'main'
        })
      });

      if (response.ok) {
        loadDocumentationData();
      }
    } catch (error) {
      console.error('Error deploying application:', error);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-600 bg-green-100';
      case 'POST': return 'text-blue-600 bg-blue-100';
      case 'PUT': return 'text-yellow-600 bg-yellow-100';
      case 'DELETE': return 'text-red-600 bg-red-100';
      case 'PATCH': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'building': return 'text-blue-600 bg-blue-100';
      case 'deploying': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'rolled_back': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'production': return 'text-red-600 bg-red-100';
      case 'staging': return 'text-yellow-600 bg-yellow-100';
      case 'development': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading documentation...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documentation & Deployment</h1>
            <p className="text-gray-600">API documentation and deployment management</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDocumentationData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={generateDocumentation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FileText className="w-4 h-4" />
              Generate Docs
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'api', label: 'API Documentation', icon: BookOpen },
              { id: 'deployment', label: 'Deployment', icon: Server },
              { id: 'monitoring', label: 'Monitoring', icon: Monitor }
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
                <BookOpen className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">API Endpoints</p>
                  <p className="text-2xl font-bold text-gray-900">{documentation?.endpoints.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Server className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Deployments</p>
                  <p className="text-2xl font-bold text-gray-900">{deploymentStats?.totalDeployments || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{deploymentStats?.successRate.toFixed(1) || 0}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active Deployments</p>
                  <p className="text-2xl font-bold text-gray-900">{deploymentStats?.activeDeployments || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Deployments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Deployments</h3>
            <div className="space-y-3">
              {deployments.slice(0, 5).map((deployment) => (
                <div key={deployment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deployment.status)}`}>
                      {deployment.status}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{deployment.version}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEnvironmentColor(deployment.environment)}`}>
                      {deployment.environment}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{formatDate(deployment.startTime)}</span>
                    {deployment.duration && (
                      <span className="text-sm text-gray-600">{formatDuration(deployment.duration)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Overview */}
          {documentation && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{documentation.endpoints.length}</div>
                  <div className="text-sm text-gray-600">Total Endpoints</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{documentation.schemas.length}</div>
                  <div className="text-sm text-gray-600">Data Schemas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{documentation.examples.length}</div>
                  <div className="text-sm text-gray-600">Code Examples</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'api' && documentation && (
        <div className="space-y-6">
          {/* API Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{documentation.title}</h3>
                <p className="text-gray-600">{documentation.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Version {documentation.version}</span>
                <button
                  onClick={() => copyToClipboard(documentation.baseUrl)}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Copy className="w-4 h-4" />
                  Copy Base URL
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Authentication</h4>
                <p className="text-sm text-gray-600">{documentation.authentication.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Rate Limiting</h4>
                <p className="text-sm text-gray-600">
                  {documentation.rateLimiting.requests} requests per {documentation.rateLimiting.window}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Base URL</h4>
                <p className="text-sm text-gray-600 font-mono">{documentation.baseUrl}</p>
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">API Endpoints</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {documentation.endpoints.map((endpoint) => (
                  <div key={endpoint.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                          {endpoint.method}
                        </span>
                        <span className="text-sm font-medium text-gray-900 font-mono">{endpoint.path}</span>
                        {endpoint.authentication && (
                          <Shield className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedEndpoint(endpoint)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{endpoint.summary}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Tags: {endpoint.tags.join(', ')}</span>
                      <span>Since: {endpoint.since}</span>
                      {endpoint.deprecated && (
                        <span className="text-orange-600">Deprecated</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deployment' && (
        <div className="space-y-6">
          {/* Deployment Configurations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Deployment Configurations</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deploymentConfigs.map((config) => (
                  <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEnvironmentColor(config.environment)}`}>
                          {config.environment}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{config.name}</span>
                      </div>
                      <button
                        onClick={() => deployApplication(config.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4" />
                        Deploy
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{config.domain}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>Platform: {config.platform}</div>
                      <div>Region: {config.region}</div>
                      <div>Memory: {config.memory}</div>
                      <div>CPU: {config.cpu}</div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {config.ssl && <Shield className="w-4 h-4 text-green-600" />}
                      {config.cdn && <Zap className="w-4 h-4 text-blue-600" />}
                      {config.monitoring && <Monitor className="w-4 h-4 text-purple-600" />}
                      {config.backup && <Database className="w-4 h-4 text-orange-600" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deployment History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Deployment History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Environment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deployments.map((deployment) => (
                    <tr key={deployment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {deployment.version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEnvironmentColor(deployment.environment)}`}>
                          {deployment.environment}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deployment.status)}`}>
                          {deployment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {deployment.duration ? formatDuration(deployment.duration) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(deployment.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => setSelectedDeployment(deployment)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Deployment Stats */}
          {deploymentStats && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{deploymentStats.successfulDeployments}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{deploymentStats.failedDeployments}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatDuration(deploymentStats.averageDeploymentTime)}</div>
                  <div className="text-sm text-gray-600">Avg Duration</div>
                </div>
              </div>
            </div>
          )}

          {/* System Health */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">API Status</span>
                </div>
                <span className="text-sm text-green-600">Healthy</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Database</span>
                </div>
                <span className="text-sm text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Elasticsearch</span>
                </div>
                <span className="text-sm text-green-600">Running</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Redis</span>
                </div>
                <span className="text-sm text-green-600">Connected</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Endpoint Detail Modal */}
      {selectedEndpoint && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Endpoint Details</h3>
                <button
                  onClick={() => setSelectedEndpoint(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Endpoint Header */}
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMethodColor(selectedEndpoint.method)}`}>
                    {selectedEndpoint.method}
                  </span>
                  <span className="text-lg font-medium text-gray-900 font-mono">{selectedEndpoint.path}</span>
                  {selectedEndpoint.authentication && (
                    <Shield className="w-5 h-5 text-yellow-600" />
                  )}
                </div>

                <div className="text-gray-600">{selectedEndpoint.description}</div>

                {/* Parameters */}
                {selectedEndpoint.parameters.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Parameters</h4>
                    <div className="space-y-2">
                      {selectedEndpoint.parameters.map((param, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{param.name}</span>
                            <span className="text-xs text-gray-500">({param.in})</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              param.required ? 'text-red-600 bg-red-100' : 'text-gray-600 bg-gray-100'
                            }`}>
                              {param.required ? 'Required' : 'Optional'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">{param.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Type: {param.type} {param.example && `• Example: ${param.example}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examples */}
                {selectedEndpoint.examples.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Examples</h4>
                    <div className="space-y-3">
                      {selectedEndpoint.examples.map((example, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">{example.title}</h5>
                          <div className="text-sm text-gray-600 mb-3">{example.description}</div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h6 className="text-xs font-medium text-gray-700 mb-2">Request</h6>
                              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                                {JSON.stringify(example.request, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <h6 className="text-xs font-medium text-gray-700 mb-2">Response</h6>
                              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                                {JSON.stringify(example.response, null, 2)}
                              </pre>
                            </div>
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

      {/* Deployment Detail Modal */}
      {selectedDeployment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Deployment Details</h3>
                <button
                  onClick={() => setSelectedDeployment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Deployment Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedDeployment.status)}`}>
                      {selectedDeployment.status}
                    </span>
                    <span className="text-lg font-medium text-gray-900">{selectedDeployment.version}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEnvironmentColor(selectedDeployment.environment)}`}>
                      {selectedDeployment.environment}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-medium">{selectedDeployment.duration ? formatDuration(selectedDeployment.duration) : '-'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Platform</div>
                    <div className="font-medium">{selectedDeployment.platform}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Region</div>
                    <div className="font-medium">{selectedDeployment.region}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Domain</div>
                    <div className="font-medium">{selectedDeployment.domain}</div>
                  </div>
                </div>

                {/* Build Logs */}
                {selectedDeployment.buildLogs.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Build Logs</h4>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-40 overflow-y-auto">
                      {selectedDeployment.buildLogs.map((log, index) => (
                        <div key={index} className="text-sm font-mono">{log}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deployment Logs */}
                {selectedDeployment.deploymentLogs.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Deployment Logs</h4>
                    <div className="bg-gray-900 text-blue-400 p-4 rounded-lg max-h-40 overflow-y-auto">
                      {selectedDeployment.deploymentLogs.map((log, index) => (
                        <div key={index} className="text-sm font-mono">{log}</div>
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
