'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Lock, 
  Globe, 
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Plus,
  Trash2,
  Edit,
  RefreshCw
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface ThreatDetection {
  id: string;
  type: string;
  confidence: number;
  riskScore: number;
  description: string;
  indicators: string[];
  mitigation: string[];
  detectedAt: string;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
}

interface IPRule {
  id: string;
  ipAddress: string;
  type: 'whitelist' | 'blacklist' | 'rate_limit';
  reason: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  activeThreats: number;
  blockedIPs: number;
  whitelistedIPs: number;
  averageRiskScore: number;
  topThreatTypes: Array<{
    type: string;
    count: number;
    riskScore: number;
  }>;
  recentEvents: SecurityEvent[];
  securityScore: number;
}

interface SecurityDashboardProps {
  className?: string;
}

export default function SecurityDashboard({ className = '' }: SecurityDashboardProps) {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [threats, setThreats] = useState<ThreatDetection[]>([]);
  const [ipRules, setIpRules] = useState<IPRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'threats' | 'ip-rules'>('overview');
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    status: '',
    resolved: ''
  });
  const [showAddIPRule, setShowAddIPRule] = useState(false);
  const [newIPRule, setNewIPRule] = useState({
    ipAddress: '',
    type: 'blacklist' as 'whitelist' | 'blacklist' | 'rate_limit',
    reason: '',
    expiresAt: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMetrics(),
        fetchEvents(),
        fetchThreats(),
        fetchIPRules()
      ]);
    } catch (error) {
      setError('Failed to fetch security data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/security/metrics');
      const result = await response.json();
      if (result.success) {
        setMetrics(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/security/events');
      const result = await response.json();
      if (result.success) {
        setEvents(result.data.events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchThreats = async () => {
    try {
      const response = await fetch('/api/security/threats');
      const result = await response.json();
      if (result.success) {
        setThreats(result.data.threats);
      }
    } catch (error) {
      console.error('Failed to fetch threats:', error);
    }
  };

  const fetchIPRules = async () => {
    try {
      const response = await fetch('/api/security/ip-rules');
      const result = await response.json();
      if (result.success) {
        setIpRules(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch IP rules:', error);
    }
  };

  const handleAddIPRule = async () => {
    try {
      const response = await fetch('/api/security/ip-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIPRule),
      });

      const result = await response.json();
      if (result.success) {
        setShowAddIPRule(false);
        setNewIPRule({ ipAddress: '', type: 'blacklist', reason: '', expiresAt: '' });
        fetchIPRules();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to add IP rule');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'false_positive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'whitelist':
        return 'bg-green-100 text-green-800';
      case 'blacklist':
        return 'bg-red-100 text-red-800';
      case 'rate_limit':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600">Monitor security events, threats, and system protection</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Security Score */}
      {metrics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Security Score</h2>
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-4xl font-bold text-blue-600">{metrics.securityScore}</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.securityScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {metrics.securityScore >= 90 ? 'Excellent' : 
                 metrics.securityScore >= 70 ? 'Good' : 
                 metrics.securityScore >= 50 ? 'Fair' : 'Poor'} security status
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
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'events', label: 'Security Events', icon: Eye },
              { id: 'threats', label: 'Threat Detection', icon: AlertTriangle },
              { id: 'ip-rules', label: 'IP Management', icon: Globe },
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
          {activeTab === 'overview' && metrics && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-center">
                    <Eye className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Events</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.totalEvents}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-center">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Threats</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.activeThreats}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-center">
                    <Lock className="w-8 h-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Blocked IPs</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.blockedIPs}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg Risk Score</p>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(metrics.averageRiskScore)}</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Recent Events */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Security Events</h3>
                </div>
                <div className="p-6">
                  {metrics.recentEvents.length > 0 ? (
                    <div className="space-y-4">
                      {metrics.recentEvents.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(event.severity)}`}>
                              {event.severity.toUpperCase()}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{event.type.replace('_', ' ')}</p>
                              <p className="text-sm text-gray-500">{event.ipAddress}</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No recent security events</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Security Events</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.severity}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Severities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Severity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {events.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {event.type.replace('_', ' ')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(event.severity)}`}>
                              {event.severity.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {event.ipAddress}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {event.resolved ? (
                              <span className="flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Resolved
                              </span>
                            ) : (
                              <span className="flex items-center text-red-600">
                                <XCircle className="w-4 h-4 mr-1" />
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Threats Tab */}
          {activeTab === 'threats' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Threat Detections</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="false_positive">False Positive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {threats.map((threat) => (
                  <div key={threat.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{threat.description}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(threat.status)}`}>
                            {threat.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{threat.type.replace('_', ' ')}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Confidence</p>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${threat.confidence}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{threat.confidence}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Risk Score</p>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    threat.riskScore > 80 ? 'bg-red-600' :
                                    threat.riskScore > 60 ? 'bg-orange-600' :
                                    threat.riskScore > 40 ? 'bg-yellow-600' : 'bg-green-600'
                                  }`}
                                  style={{ width: `${threat.riskScore}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{threat.riskScore}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Indicators</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {threat.indicators.map((indicator, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                                  {indicator}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Mitigation</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {threat.mitigation.map((mitigation, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                                  {mitigation}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        Detected: {new Date(threat.detectedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IP Rules Tab */}
          {activeTab === 'ip-rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">IP Rules</h3>
                <button
                  onClick={() => setShowAddIPRule(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add IP Rule
                </button>
              </div>

              {/* Add IP Rule Modal */}
              {showAddIPRule && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Add IP Rule</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IP Address</label>
                        <input
                          type="text"
                          value={newIPRule.ipAddress}
                          onChange={(e) => setNewIPRule({ ...newIPRule, ipAddress: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="192.168.1.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select
                          value={newIPRule.type}
                          onChange={(e) => setNewIPRule({ ...newIPRule, type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="blacklist">Blacklist</option>
                          <option value="whitelist">Whitelist</option>
                          <option value="rate_limit">Rate Limit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                        <input
                          type="text"
                          value={newIPRule.reason}
                          onChange={(e) => setNewIPRule({ ...newIPRule, reason: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Reason for this rule"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expires At (Optional)</label>
                        <input
                          type="datetime-local"
                          value={newIPRule.expiresAt}
                          onChange={(e) => setNewIPRule({ ...newIPRule, expiresAt: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => setShowAddIPRule(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddIPRule}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Rule
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
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
                      {ipRules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {rule.ipAddress}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(rule.type)}`}>
                              {rule.type.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {rule.reason}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {rule.isActive ? (
                              <span className="flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center text-gray-600">
                                <XCircle className="w-4 h-4 mr-1" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(rule.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 className="w-4 h-4" />
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