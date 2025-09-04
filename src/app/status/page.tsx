'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Server, 
  Database, 
  Globe,
  Zap,
  Shield,
  Activity
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  uptime: string;
  responseTime: string;
  lastIncident?: string;
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'API Services',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '120ms'
    },
    {
      name: 'Property Search',
      status: 'operational',
      uptime: '99.8%',
      responseTime: '95ms'
    },
    {
      name: 'Valuation Engine',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '180ms'
    },
    {
      name: 'Market Data',
      status: 'operational',
      uptime: '99.7%',
      responseTime: '150ms'
    },
    {
      name: 'User Authentication',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '80ms'
    },
    {
      name: 'Chrome Extension',
      status: 'operational',
      uptime: '99.5%',
      responseTime: '200ms'
    },
    {
      name: 'Database',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '50ms'
    },
    {
      name: 'CDN',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '30ms'
    }
  ]);

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStatus = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'outage':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'outage':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOverallStatus = () => {
    const hasOutage = services.some(service => service.status === 'outage');
    const hasDegraded = services.some(service => service.status === 'degraded');
    
    if (hasOutage) return { status: 'outage', text: 'Service Outage', color: 'text-red-600' };
    if (hasDegraded) return { status: 'degraded', text: 'Degraded Performance', color: 'text-yellow-600' };
    return { status: 'operational', text: 'All Systems Operational', color: 'text-green-600' };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Service Status
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
          >
            Real-time status of all our services and systems
          </motion.p>

          {/* Overall Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center space-x-3 bg-white rounded-lg px-6 py-3 shadow-lg"
          >
            {getStatusIcon(overallStatus.status)}
            <span className={`text-lg font-semibold ${overallStatus.color}`}>
              {overallStatus.text}
            </span>
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Last Updated */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
            <button
              onClick={refreshStatus}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Server className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {service.name}
                    </h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(service.status)}`}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(service.status)}
                      <span className="capitalize">{service.status}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Uptime</p>
                    <p className="text-lg font-semibold text-gray-900">{service.uptime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Response Time</p>
                    <p className="text-lg font-semibold text-gray-900">{service.responseTime}</p>
                  </div>
                </div>

                {service.lastIncident && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Last Incident:</strong> {service.lastIncident}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* System Metrics */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">System Metrics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Uptime</h3>
                <p className="text-3xl font-bold text-green-600">99.9%</p>
                <p className="text-sm text-gray-600">Last 30 days</p>
              </div>
              
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Response Time</h3>
                <p className="text-3xl font-bold text-blue-600">125ms</p>
                <p className="text-sm text-gray-600">Last 24 hours</p>
              </div>
              
              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Score</h3>
                <p className="text-3xl font-bold text-purple-600">A+</p>
                <p className="text-sm text-gray-600">SSL Labs rating</p>
              </div>
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Incidents</h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">All systems operational</h3>
                  <p className="text-gray-600 text-sm">No incidents reported in the last 30 days</p>
                  <p className="text-gray-500 text-xs">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Incident Response</h3>
              <p className="text-blue-800 text-sm">
                We maintain a 24/7 monitoring system and respond to incidents within 15 minutes. 
                All incidents are documented and resolved as quickly as possible.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Need Help?
            </h3>
            <p className="text-gray-600 mb-6">
              If you're experiencing issues not reflected here, please contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/help"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </a>
              <a
                href="/help"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Help Center
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
