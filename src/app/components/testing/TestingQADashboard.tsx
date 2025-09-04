'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TestTube, 
  Bug, 
  Shield, 
  Zap, 
  Eye, 
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
  FileText,
  Settings,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye as ViewIcon,
  Download,
  Upload
} from 'lucide-react';

interface TestSuite {
  id: string;
  name: string;
  description: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    pending: number;
  };
  duration?: number;
}

interface QualityIssue {
  id: string;
  type: 'BUG' | 'SECURITY' | 'PERFORMANCE' | 'ACCESSIBILITY' | 'CODE_QUALITY' | 'COMPLIANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  component?: string;
  createdAt: string;
  tags: string[];
}

interface QualityMetrics {
  testCoverage: number;
  codeQuality: number;
  performanceScore: number;
  securityScore: number;
  accessibilityScore: number;
  overallScore: number;
}

interface TestingQADashboardProps {
  className?: string;
}

export default function TestingQADashboard({ className = '' }: TestingQADashboardProps) {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [qualityIssues, setQualityIssues] = useState<QualityIssue[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'testing' | 'quality' | 'dashboard' | 'reports'>('dashboard');
  const [selectedTestSuite, setSelectedTestSuite] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    issueType: 'all',
    severity: 'all',
    status: 'all',
  });

  useEffect(() => {
    fetchTestingQAData();
  }, []);

  const fetchTestingQAData = async () => {
    try {
      setLoading(true);
      
      // Fetch test suites
      const testResponse = await fetch('/api/testing/run');
      const testData = await testResponse.json();
      if (testData.success) {
        setTestSuites(testData.data);
      }

      // Fetch quality issues
      const qualityResponse = await fetch('/api/qa/quality');
      const qualityData = await qualityResponse.json();
      if (qualityData.success) {
        setQualityIssues(qualityData.data);
      }

      // Fetch dashboard data
      const dashboardResponse = await fetch('/api/qa/dashboard');
      const dashboardData = await dashboardResponse.json();
      if (dashboardData.success) {
        setQualityMetrics(dashboardData.data.testing.qualityMetrics);
      }

    } catch (error) {
      setError('Failed to fetch testing and QA data');
    } finally {
      setLoading(false);
    }
  };

  const runTestSuite = async (suiteId: string) => {
    try {
      const response = await fetch('/api/testing/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suiteId }),
      });

      const data = await response.json();
      if (data.success) {
        fetchTestingQAData();
      }
    } catch (error) {
      console.error('Error running test suite:', error);
    }
  };

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      case 'RUNNING':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'BUG':
        return <Bug className="w-4 h-4" />;
      case 'SECURITY':
        return <Shield className="w-4 h-4" />;
      case 'PERFORMANCE':
        return <Zap className="w-4 h-4" />;
      case 'ACCESSIBILITY':
        return <Eye className="w-4 h-4" />;
      case 'CODE_QUALITY':
        return <FileText className="w-4 h-4" />;
      case 'COMPLIANCE':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getIssueTypeColor = (type: string) => {
    switch (type) {
      case 'BUG':
        return 'text-red-600 bg-red-100';
      case 'SECURITY':
        return 'text-purple-600 bg-purple-100';
      case 'PERFORMANCE':
        return 'text-orange-600 bg-orange-100';
      case 'ACCESSIBILITY':
        return 'text-blue-600 bg-blue-100';
      case 'CODE_QUALITY':
        return 'text-green-600 bg-green-100';
      case 'COMPLIANCE':
        return 'text-indigo-600 bg-indigo-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'text-red-600 bg-red-100';
      case 'IN_PROGRESS':
        return 'text-blue-600 bg-blue-100';
      case 'RESOLVED':
        return 'text-green-600 bg-green-100';
      case 'CLOSED':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading testing and QA data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Testing & Quality Assurance</h1>
          <p className="text-gray-600">Comprehensive testing framework and quality management</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchTestingQAData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Add Issue
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TestTube className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Test Suites</p>
              <p className="text-2xl font-bold text-gray-900">{testSuites.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Bug className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quality Issues</p>
              <p className="text-2xl font-bold text-gray-900">{qualityIssues.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Test Coverage</p>
              <p className="text-2xl font-bold text-gray-900">
                {qualityMetrics?.testCoverage.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quality Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {qualityMetrics?.overallScore.toFixed(1) || 0}%
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
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'testing', label: 'Testing', icon: TestTube },
              { id: 'quality', label: 'Quality Issues', icon: Bug },
              { id: 'reports', label: 'Reports', icon: FileText },
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
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quality Metrics */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Metrics</h3>
                  <div className="space-y-4">
                    {qualityMetrics && Object.entries(qualityMetrics).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${value}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
                            {value.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Suite Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Test Suite Status</h3>
                  <div className="space-y-3">
                    {testSuites.map((suite) => (
                      <div key={suite.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTestStatusColor(suite.status)}`}>
                            {suite.status}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{suite.name}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {suite.summary.passed}/{suite.summary.total} passed
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Issues */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Quality Issues</h3>
                <div className="space-y-3">
                  {qualityIssues.slice(0, 5).map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-1 rounded ${getIssueTypeColor(issue.type)}`}>
                          {getIssueTypeIcon(issue.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{issue.title}</p>
                          <p className="text-xs text-gray-500">{issue.component}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Testing Tab */}
          {activeTab === 'testing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Test Suites</h3>
                <span className="text-sm text-gray-500">{testSuites.length} suites</span>
              </div>

              <div className="grid gap-4">
                {testSuites.map((suite) => (
                  <motion.div
                    key={suite.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <TestTube className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{suite.name}</h4>
                          <p className="text-sm text-gray-500">{suite.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTestStatusColor(suite.status)}`}>
                          {suite.status}
                        </span>
                        <button
                          onClick={() => runTestSuite(suite.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Run Test Suite"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{suite.summary.total}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{suite.summary.passed}</div>
                        <div className="text-xs text-gray-500">Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{suite.summary.failed}</div>
                        <div className="text-xs text-gray-500">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{suite.summary.skipped}</div>
                        <div className="text-xs text-gray-500">Skipped</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{suite.summary.pending}</div>
                        <div className="text-xs text-gray-500">Pending</div>
                      </div>
                    </div>

                    {suite.duration && (
                      <div className="text-sm text-gray-500">
                        Duration: {suite.duration}ms
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Quality Issues Tab */}
          {activeTab === 'quality' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Quality Issues</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.issueType}
                    onChange={(e) => setFilters({ ...filters, issueType: e.target.value })}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="BUG">Bug</option>
                    <option value="SECURITY">Security</option>
                    <option value="PERFORMANCE">Performance</option>
                    <option value="ACCESSIBILITY">Accessibility</option>
                    <option value="CODE_QUALITY">Code Quality</option>
                    <option value="COMPLIANCE">Compliance</option>
                  </select>
                  <select
                    value={filters.severity}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4">
                {qualityIssues.map((issue) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getIssueTypeColor(issue.type)}`}>
                          {getIssueTypeIcon(issue.type)}
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{issue.title}</h4>
                          <p className="text-sm text-gray-500">{issue.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {issue.component && (
                          <div className="text-sm text-gray-500">
                            Component: {issue.component}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          Created: {new Date(issue.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {issue.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Quality Reports</h3>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Test Coverage Report</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Unit Tests</span>
                      <span className="text-sm font-medium text-gray-900">95.2%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Integration Tests</span>
                      <span className="text-sm font-medium text-gray-900">87.8%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">E2E Tests</span>
                      <span className="text-sm font-medium text-gray-900">76.5%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Overall Coverage</span>
                      <span className="text-sm font-medium text-gray-900">
                        {qualityMetrics?.testCoverage.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Quality Metrics Report</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Code Quality</span>
                      <span className="text-sm font-medium text-gray-900">
                        {qualityMetrics?.codeQuality.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Security Score</span>
                      <span className="text-sm font-medium text-gray-900">
                        {qualityMetrics?.securityScore.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Performance Score</span>
                      <span className="text-sm font-medium text-gray-900">
                        {qualityMetrics?.performanceScore.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Accessibility Score</span>
                      <span className="text-sm font-medium text-gray-900">
                        {qualityMetrics?.accessibilityScore.toFixed(1) || 0}%
                      </span>
                    </div>
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
