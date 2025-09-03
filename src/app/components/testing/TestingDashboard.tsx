'use client';

import React, { useState, useEffect } from 'react';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Play, 
  RefreshCw,
  BarChart3,
  Shield,
  Eye,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Bug,
  Code,
  Lock,
  Users
} from 'lucide-react';

interface TestResult {
  id: string;
  testName: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration: number;
  error?: string;
}

interface QualityMetric {
  id: string;
  name: string;
  category: 'code' | 'performance' | 'security' | 'accessibility' | 'usability';
  value: number;
  threshold: number;
  status: 'PASS' | 'FAIL' | 'WARNING';
  description: string;
  recommendations: string[];
  timestamp: Date;
}

interface QualityIssue {
  id: string;
  type: 'bug' | 'vulnerability' | 'code_smell' | 'duplication' | 'complexity';
  severity: 'critical' | 'major' | 'minor' | 'info';
  file: string;
  line: number;
  message: string;
  rule: string;
  effort: string;
  status: 'open' | 'confirmed' | 'resolved' | 'false_positive';
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'PASS' | 'FAIL' | 'WARNING';
  description: string;
  timestamp: Date;
}

interface SecurityVulnerability {
  id: string;
  type: 'sql_injection' | 'xss' | 'csrf' | 'authentication' | 'authorization' | 'data_exposure';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  description: string;
  cwe: string;
  owasp: string;
  remediation: string;
  status: 'open' | 'fixed' | 'false_positive';
}

interface AccessibilityViolation {
  id: string;
  rule: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: string[];
  status: 'open' | 'fixed' | 'false_positive';
}

interface QualityStats {
  totalReports: number;
  averageScore: number;
  totalIssues: number;
  openIssues: number;
  criticalIssues: number;
  securityScore: number;
  accessibilityScore: number;
}

export default function TestingDashboard() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([]);
  const [qualityIssues, setQualityIssues] = useState<QualityIssue[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [securityVulnerabilities, setSecurityVulnerabilities] = useState<SecurityVulnerability[]>([]);
  const [accessibilityViolations, setAccessibilityViolations] = useState<AccessibilityViolation[]>([]);
  const [qualityStats, setQualityStats] = useState<QualityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tests' | 'quality' | 'performance' | 'security' | 'accessibility'>('overview');
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    loadTestingData();
  }, []);

  const loadTestingData = async () => {
    setIsLoading(true);
    try {
      // Load test results
      const testResponse = await fetch('/api/testing/run');
      const testData = await testResponse.json();
      if (testData.success) {
        setTestResults(testData.results);
      }

      // Load quality data
      const qualityResponse = await fetch('/api/qa/quality');
      const qualityData = await qualityResponse.json();
      if (qualityData.success) {
        setQualityStats(qualityData.stats);
        if (qualityData.reports.length > 0) {
          const latestReport = qualityData.reports[qualityData.reports.length - 1];
          setQualityMetrics(latestReport.metrics);
          setQualityIssues(latestReport.issues);
        }
      }

      // Load performance data
      const performanceResponse = await fetch('/api/qa/performance');
      const performanceData = await performanceResponse.json();
      if (performanceData.success) {
        setPerformanceMetrics(performanceData.metrics);
      }

      // Load security data
      const securityResponse = await fetch('/api/qa/security');
      const securityData = await securityResponse.json();
      if (securityData.success && securityData.scans.length > 0) {
        const latestScan = securityData.scans[securityData.scans.length - 1];
        setSecurityVulnerabilities(latestScan.vulnerabilities);
      }

      // Load accessibility data
      const accessibilityResponse = await fetch('/api/qa/accessibility');
      const accessibilityData = await accessibilityResponse.json();
      if (accessibilityData.success && accessibilityData.audits.length > 0) {
        const latestAudit = accessibilityData.audits[accessibilityData.audits.length - 1];
        setAccessibilityViolations(latestAudit.violations);
      }
    } catch (error) {
      console.error('Error loading testing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runTests = async () => {
    setIsRunningTests(true);
    try {
      const response = await fetch('/api/testing/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: {} })
      });

      if (response.ok) {
        loadTestingData();
      }
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const runQualityAnalysis = async () => {
    try {
      await fetch('/api/qa/quality', { method: 'POST' });
      await fetch('/api/qa/performance', { method: 'POST' });
      await fetch('/api/qa/security', { method: 'POST' });
      await fetch('/api/qa/accessibility', { method: 'POST' });
      loadTestingData();
    } catch (error) {
      console.error('Error running quality analysis:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED':
      case 'PASS':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'FAILED':
      case 'FAIL':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'SKIPPED':
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
      case 'PASS':
        return 'text-green-600 bg-green-100';
      case 'FAILED':
      case 'FAIL':
        return 'text-red-600 bg-red-100';
      case 'SKIPPED':
      case 'WARNING':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'major':
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'minor':
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'info':
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'code':
        return <Code className="w-4 h-4" />;
      case 'performance':
        return <Zap className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'accessibility':
        return <Eye className="w-4 h-4" />;
      case 'usability':
        return <Users className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading testing data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Testing & QA Dashboard</h1>
            <p className="text-gray-600">Comprehensive testing and quality assurance monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadTestingData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={runQualityAnalysis}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <BarChart3 className="w-4 h-4" />
              Run QA Analysis
            </button>
            <button
              onClick={runTests}
              disabled={isRunningTests}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunningTests ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunningTests ? 'Running Tests...' : 'Run Tests'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'tests', label: 'Tests', icon: TestTube },
              { id: 'quality', label: 'Code Quality', icon: Code },
              { id: 'performance', label: 'Performance', icon: Zap },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'accessibility', label: 'Accessibility', icon: Eye }
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
      {activeTab === 'overview' && qualityStats && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <TestTube className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Test Results</p>
                  <p className="text-2xl font-bold text-gray-900">{testResults.length}</p>
                  <p className="text-xs text-gray-500">
                    {testResults.filter(r => r.status === 'PASSED').length} passed
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Quality Score</p>
                  <p className="text-2xl font-bold text-gray-900">{qualityStats.averageScore.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">Average score</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Security Score</p>
                  <p className="text-2xl font-bold text-gray-900">{qualityStats.securityScore}</p>
                  <p className="text-xs text-gray-500">Security rating</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Eye className="w-8 h-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Accessibility</p>
                  <p className="text-2xl font-bold text-gray-900">{qualityStats.accessibilityScore}</p>
                  <p className="text-xs text-gray-500">Accessibility score</p>
                </div>
              </div>
            </div>
          </div>

          {/* Issues Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{qualityStats.criticalIssues}</div>
                <div className="text-sm text-gray-600">Critical Issues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{qualityStats.openIssues}</div>
                <div className="text-sm text-gray-600">Open Issues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{qualityStats.totalIssues}</div>
                <div className="text-sm text-gray-600">Total Issues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{qualityStats.totalReports}</div>
                <div className="text-sm text-gray-600">Quality Reports</div>
              </div>
            </div>
          </div>

          {/* Recent Test Results */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Test Results</h3>
            <div className="space-y-2">
              {testResults.slice(0, 5).map((result) => (
                <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <span className="text-sm font-medium text-gray-900">{result.testName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{formatDuration(result.duration)}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tests' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(result.status)}
                        <span className="ml-2 text-sm font-medium text-gray-900">{result.testName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(result.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.error || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'quality' && (
        <div className="space-y-6">
          {/* Quality Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {qualityMetrics.map((metric) => (
                <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(metric.category)}
                      <span className="text-sm font-medium text-gray-900">{metric.name}</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                      {metric.status}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                  <div className="text-sm text-gray-600 mb-2">{metric.description}</div>
                  <div className="space-y-1">
                    {metric.recommendations.map((rec, index) => (
                      <div key={index} className="text-xs text-gray-500">• {rec}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Issues */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Issues</h3>
            <div className="space-y-3">
              {qualityIssues.map((issue) => (
                <div key={issue.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bug className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">{issue.message}</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {issue.file}:{issue.line} • {issue.rule} • Effort: {issue.effort}
                  </div>
                  <div className="text-xs text-gray-500">
                    Status: {issue.status} • Updated: {new Date(issue.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {performanceMetrics.map((metric) => (
              <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{metric.name}</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                    {metric.status}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metric.value} {metric.unit}
                </div>
                <div className="text-sm text-gray-600 mb-2">{metric.description}</div>
                <div className="text-xs text-gray-500">
                  Threshold: {metric.threshold} {metric.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Vulnerabilities</h3>
          <div className="space-y-3">
            {securityVulnerabilities.map((vuln) => (
              <div key={vuln.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{vuln.description}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                    {vuln.severity}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {vuln.file}:{vuln.line} • {vuln.type} • CWE: {vuln.cwe} • OWASP: {vuln.owasp}
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  <strong>Remediation:</strong> {vuln.remediation}
                </div>
                <div className="text-xs text-gray-500">
                  Status: {vuln.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'accessibility' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Accessibility Violations</h3>
          <div className="space-y-3">
            {accessibilityViolations.map((violation) => (
              <div key={violation.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{violation.description}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(violation.impact)}`}>
                    {violation.impact}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Rule: {violation.rule} • Nodes: {violation.nodes.join(', ')}
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  <strong>Help:</strong> {violation.help}
                </div>
                <div className="text-xs text-gray-500">
                  Status: {violation.status} • 
                  <a href={violation.helpUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                    Learn more
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
