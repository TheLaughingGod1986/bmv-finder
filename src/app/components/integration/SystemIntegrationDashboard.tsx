'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Zap,
  Database,
  Globe,
  Settings,
  FileText,
  Download,
  Eye,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Target,
  Users,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Lock,
  Unlock,
  AlertCircle,
  Info,
  ExternalLink
} from 'lucide-react';

interface IntegrationTest {
  id: string;
  name: string;
  description: string;
  category: 'AUTHENTICATION' | 'PROPERTY_SEARCH' | 'USER_MANAGEMENT' | 'ANALYTICS' | 'INTEGRATIONS' | 'PERFORMANCE' | 'SECURITY' | 'END_TO_END';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dependencies: string[];
  steps: IntegrationTestStep[];
  expectedResult: any;
  timeout: number;
  retries: number;
  enabled: boolean;
}

interface IntegrationTestStep {
  id: string;
  name: string;
  type: 'API_CALL' | 'DATABASE_QUERY' | 'EXTERNAL_SERVICE' | 'UI_INTERACTION' | 'VALIDATION';
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  headers?: { [key: string]: string };
  expectedStatus?: number;
  expectedResponse?: any;
  validation?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
    value: any;
  }[];
  waitTime?: number;
}

interface IntegrationTestResult {
  testId: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'TIMEOUT';
  startTime: string;
  endTime: string;
  duration: number;
  steps: IntegrationTestStepResult[];
  error?: string;
  metrics?: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    networkRequests: number;
  };
}

interface IntegrationTestStepResult {
  stepId: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'TIMEOUT';
  startTime: string;
  endTime: string;
  duration: number;
  response?: any;
  error?: string;
  validationResults?: ValidationResult[];
}

interface ValidationResult {
  field: string;
  expected: any;
  actual: any;
  passed: boolean;
  error?: string;
}

interface ReadinessCriteria {
  id: string;
  category: 'FUNCTIONALITY' | 'PERFORMANCE' | 'SECURITY' | 'SCALABILITY' | 'RELIABILITY' | 'MAINTAINABILITY' | 'COMPLIANCE';
  name: string;
  description: string;
  weight: number;
  threshold: number;
  currentScore: number;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  recommendations: string[];
  lastChecked: string;
}

interface ReadinessAssessment {
  id: string;
  name: string;
  version: string;
  overallScore: number;
  overallStatus: 'READY' | 'NOT_READY' | 'CONDITIONAL';
  categories: {
    [category: string]: {
      score: number;
      status: 'PASS' | 'FAIL' | 'WARNING';
      criteria: ReadinessCriteria[];
    };
  };
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  nextSteps: string[];
  assessedAt: string;
  assessedBy: string;
}

interface SystemHealthReport {
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  componentHealth: {
    [component: string]: {
      status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
      responseTime: number;
      errorRate: number;
      lastChecked: string;
      issues: string[];
    };
  };
  recommendations: string[];
  generatedAt: string;
}

interface PerformanceMetrics {
  responseTime: {
    average: number;
    p95: number;
    p99: number;
    threshold: number;
  };
  throughput: {
    requestsPerSecond: number;
    threshold: number;
  };
  errorRate: {
    percentage: number;
    threshold: number;
  };
  availability: {
    uptime: number;
    threshold: number;
  };
  resourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

interface SystemIntegrationDashboardProps {
  className?: string;
}

export default function SystemIntegrationDashboard({ className = '' }: SystemIntegrationDashboardProps) {
  const [tests, setTests] = useState<IntegrationTest[]>([]);
  const [testResults, setTestResults] = useState<IntegrationTestResult[]>([]);
  const [readinessAssessment, setReadinessAssessment] = useState<ReadinessAssessment | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthReport | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tests' | 'readiness' | 'health' | 'performance'>('tests');
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    status: 'all',
  });

  useEffect(() => {
    fetchSystemIntegrationData();
  }, []);

  const fetchSystemIntegrationData = async () => {
    try {
      setLoading(true);
      
      // Fetch integration tests
      const testsResponse = await fetch('/api/integration/tests');
      const testsData = await testsResponse.json();
      if (testsData.success) {
        setTests(testsData.data);
      }

      // Fetch readiness assessment
      const readinessResponse = await fetch('/api/integration/readiness');
      const readinessData = await readinessResponse.json();
      if (readinessData.success && readinessData.data.latest) {
        setReadinessAssessment(readinessData.data.latest);
      }

      // Fetch system health
      const healthResponse = await fetch('/api/integration/health');
      const healthData = await healthResponse.json();
      if (healthData.success) {
        setSystemHealth(healthData.data.healthReport);
        setPerformanceMetrics(healthData.data.performanceMetrics);
      }

    } catch (error) {
      setError('Failed to fetch system integration data');
    } finally {
      setLoading(false);
    }
  };

  const runTest = async (testId: string) => {
    try {
      const response = await fetch('/api/integration/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testId }),
      });

      const data = await response.json();
      if (data.success) {
        fetchSystemIntegrationData();
      }
    } catch (error) {
      console.error('Error running test:', error);
    }
  };

  const runAllTests = async () => {
    try {
      const response = await fetch('/api/integration/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ runAll: true }),
      });

      const data = await response.json();
      if (data.success) {
        fetchSystemIntegrationData();
      }
    } catch (error) {
      console.error('Error running all tests:', error);
    }
  };

  const runReadinessAssessment = async () => {
    try {
      const response = await fetch('/api/integration/readiness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'run-assessment' }),
      });

      const data = await response.json();
      if (data.success) {
        setReadinessAssessment(data.data);
      }
    } catch (error) {
      console.error('Error running readiness assessment:', error);
    }
  };

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'text-green-600 bg-green-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      case 'SKIPPED':
        return 'text-yellow-600 bg-yellow-100';
      case 'TIMEOUT':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-100';
      case 'HIGH':
        return 'text-orange-600 bg-orange-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'LOW':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AUTHENTICATION':
        return <Shield className="w-4 h-4" />;
      case 'PROPERTY_SEARCH':
        return <Search className="w-4 h-4" />;
      case 'USER_MANAGEMENT':
        return <Users className="w-4 h-4" />;
      case 'ANALYTICS':
        return <BarChart3 className="w-4 h-4" />;
      case 'INTEGRATIONS':
        return <Globe className="w-4 h-4" />;
      case 'PERFORMANCE':
        return <Zap className="w-4 h-4" />;
      case 'SECURITY':
        return <Lock className="w-4 h-4" />;
      case 'END_TO_END':
        return <Target className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'text-green-600 bg-green-100';
      case 'DEGRADED':
        return 'text-yellow-600 bg-yellow-100';
      case 'CRITICAL':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getReadinessStatusColor = (status: string) => {
    switch (status) {
      case 'READY':
        return 'text-green-600 bg-green-100';
      case 'CONDITIONAL':
        return 'text-yellow-600 bg-yellow-100';
      case 'NOT_READY':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const toggleTestExpansion = (testId: string) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedTests(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system integration data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Integration & Production Readiness</h1>
          <p className="text-gray-600">Comprehensive system testing and production readiness assessment</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSystemIntegrationData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={runAllTests}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4 mr-2" />
            Run All Tests
          </button>
          <button
            onClick={runReadinessAssessment}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Target className="w-4 h-4 mr-2" />
            Assess Readiness
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Integration Tests</p>
              <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tests Passed</p>
              <p className="text-2xl font-bold text-gray-900">
                {tests.filter(t => t.enabled).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Readiness Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {readinessAssessment?.overallScore.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-gray-900">
                {systemHealth?.overallHealth || 'UNKNOWN'}
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
              { id: 'tests', label: 'Integration Tests', icon: Activity },
              { id: 'readiness', label: 'Production Readiness', icon: Target },
              { id: 'health', label: 'System Health', icon: BarChart3 },
              { id: 'performance', label: 'Performance', icon: Zap },
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
          {/* Integration Tests Tab */}
          {activeTab === 'tests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Integration Tests</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    <option value="AUTHENTICATION">Authentication</option>
                    <option value="PROPERTY_SEARCH">Property Search</option>
                    <option value="USER_MANAGEMENT">User Management</option>
                    <option value="ANALYTICS">Analytics</option>
                    <option value="INTEGRATIONS">Integrations</option>
                    <option value="PERFORMANCE">Performance</option>
                    <option value="SECURITY">Security</option>
                    <option value="END_TO_END">End-to-End</option>
                  </select>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Priorities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4">
                {tests.map((test) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getCategoryIcon(test.category)}
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{test.name}</h4>
                          <p className="text-sm text-gray-500">{test.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(test.priority)}`}>
                              {test.priority}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {test.category}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {test.steps.length} steps
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => runTest(test.id)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Run Test"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleTestExpansion(test.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {expandedTests.has(test.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {expandedTests.has(test.id) && (
                      <div className="mt-4 space-y-3">
                        <h5 className="text-sm font-medium text-gray-700">Test Steps</h5>
                        {test.steps.map((step, index) => (
                          <div key={step.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                              <span className="text-sm text-gray-900">{step.name}</span>
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                {step.type}
                              </span>
                            </div>
                            {step.endpoint && (
                              <span className="text-xs text-gray-500 font-mono">
                                {step.method} {step.endpoint}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Production Readiness Tab */}
          {activeTab === 'readiness' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Production Readiness Assessment</h3>
                <div className="flex items-center space-x-2">
                  {readinessAssessment && (
                    <span className={`px-3 py-1 text-sm font-semibold rounded ${getReadinessStatusColor(readinessAssessment.overallStatus)}`}>
                      {readinessAssessment.overallStatus}
                    </span>
                  )}
                </div>
              </div>

              {readinessAssessment ? (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Overall Readiness Score</h4>
                      <span className="text-3xl font-bold text-gray-900">
                        {readinessAssessment.overallScore.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-blue-600 h-4 rounded-full" 
                        style={{ width: `${readinessAssessment.overallScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(readinessAssessment.categories).map(([category, data]) => (
                      <div key={category} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-lg font-medium text-gray-900">{category}</h5>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getHealthStatusColor(data.status)}`}>
                            {data.status}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {data.score.toFixed(1)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${data.score}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {data.criteria.length} criteria
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Issues and Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {readinessAssessment.criticalIssues.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h5 className="text-lg font-medium text-red-900 mb-4">Critical Issues</h5>
                        <ul className="space-y-2">
                          {readinessAssessment.criticalIssues.map((issue, index) => (
                            <li key={index} className="text-sm text-red-700 flex items-start">
                              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {readinessAssessment.warnings.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h5 className="text-lg font-medium text-yellow-900 mb-4">Warnings</h5>
                        <ul className="space-y-2">
                          {readinessAssessment.warnings.map((warning, index) => (
                            <li key={index} className="text-sm text-yellow-700 flex items-start">
                              <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Next Steps */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h5 className="text-lg font-medium text-gray-900 mb-4">Next Steps</h5>
                    <ul className="space-y-2">
                      {readinessAssessment.nextSteps.map((step, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-green-600" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No readiness assessment available</p>
                  <button
                    onClick={runReadinessAssessment}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Run Assessment
                  </button>
                </div>
              )}
            </div>
          )}

          {/* System Health Tab */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">System Health</h3>
                {systemHealth && (
                  <span className={`px-3 py-1 text-sm font-semibold rounded ${getHealthStatusColor(systemHealth.overallHealth)}`}>
                    {systemHealth.overallHealth}
                  </span>
                )}
              </div>

              {systemHealth ? (
                <div className="space-y-6">
                  {/* Component Health */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(systemHealth.componentHealth).map(([component, health]) => (
                      <div key={component} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-lg font-medium text-gray-900 capitalize">{component}</h5>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getHealthStatusColor(health.status)}`}>
                            {health.status}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Response Time:</span>
                            <span className="font-medium">{health.responseTime.toFixed(0)}ms</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Error Rate:</span>
                            <span className="font-medium">{health.errorRate.toFixed(1)}%</span>
                          </div>
                          {health.issues.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">Issues:</p>
                              <ul className="space-y-1">
                                {health.issues.map((issue, index) => (
                                  <li key={index} className="text-xs text-red-600">• {issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  {systemHealth.recommendations.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h5 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h5>
                      <ul className="space-y-2">
                        {systemHealth.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-600" />
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No system health data available</p>
                </div>
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
              </div>

              {performanceMetrics ? (
                <div className="space-y-6">
                  {/* Response Time */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h5 className="text-lg font-medium text-gray-900 mb-4">Response Time</h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{performanceMetrics.responseTime.average}ms</div>
                        <div className="text-sm text-gray-500">Average</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{performanceMetrics.responseTime.p95}ms</div>
                        <div className="text-sm text-gray-500">P95</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{performanceMetrics.responseTime.p99}ms</div>
                        <div className="text-sm text-gray-500">P99</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{performanceMetrics.responseTime.threshold}ms</div>
                        <div className="text-sm text-gray-500">Threshold</div>
                      </div>
                    </div>
                  </div>

                  {/* Throughput and Error Rate */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h5 className="text-lg font-medium text-gray-900 mb-4">Throughput</h5>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {performanceMetrics.throughput.requestsPerSecond}
                      </div>
                      <div className="text-sm text-gray-500">requests/second</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Threshold: {performanceMetrics.throughput.threshold} req/s
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h5 className="text-lg font-medium text-gray-900 mb-4">Error Rate</h5>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {performanceMetrics.errorRate.percentage}%
                      </div>
                      <div className="text-sm text-gray-500">error rate</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Threshold: {performanceMetrics.errorRate.threshold}%
                      </div>
                    </div>
                  </div>

                  {/* Resource Usage */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h5 className="text-lg font-medium text-gray-900 mb-4">Resource Usage</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <Cpu className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-xl font-bold text-gray-900">{performanceMetrics.resourceUsage.cpu}%</div>
                        <div className="text-sm text-gray-500">CPU</div>
                      </div>
                      <div className="text-center">
                        <HardDrive className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-xl font-bold text-gray-900">{performanceMetrics.resourceUsage.memory}%</div>
                        <div className="text-sm text-gray-500">Memory</div>
                      </div>
                      <div className="text-center">
                        <Database className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-xl font-bold text-gray-900">{performanceMetrics.resourceUsage.disk}%</div>
                        <div className="text-sm text-gray-500">Disk</div>
                      </div>
                      <div className="text-center">
                        <Wifi className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                        <div className="text-xl font-bold text-gray-900">{performanceMetrics.resourceUsage.network}%</div>
                        <div className="text-sm text-gray-500">Network</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No performance metrics available</p>
                </div>
              )}
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
