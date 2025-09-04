'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  Star, 
  Target, 
  Zap, 
  Users, 
  BarChart3, 
  Shield,
  Globe,
  Smartphone,
  Brain,
  TrendingUp
} from 'lucide-react';

export default function RoadmapPage() {
  const [activeTab, setActiveTab] = useState('current');

  const roadmapItems = {
    current: [
      {
        id: 1,
        title: 'Advanced Property Analytics',
        description: 'Enhanced BMV scoring algorithms with machine learning',
        status: 'completed',
        icon: BarChart3,
        features: ['AI-powered BMV scoring', 'Predictive analytics', 'Market trend analysis']
      },
      {
        id: 2,
        title: 'Chrome Extension',
        description: 'Browser extension for property capture and analysis',
        status: 'completed',
        icon: Zap,
        features: ['One-click property capture', 'Real-time BMV scoring', 'Cross-platform sync']
      },
      {
        id: 3,
        title: 'Portfolio Management',
        description: 'Comprehensive portfolio tracking and analytics',
        status: 'completed',
        icon: Target,
        features: ['Portfolio analytics', 'Performance tracking', 'Risk assessment']
      }
    ],
    next: [
      {
        id: 4,
        title: 'Mobile App',
        description: 'Native iOS and Android applications',
        status: 'in-progress',
        icon: Smartphone,
        features: ['Offline property search', 'Push notifications', 'Mobile-optimized UI']
      },
      {
        id: 5,
        title: 'AI Investment Recommendations',
        description: 'Personalized investment advice using AI',
        status: 'planned',
        icon: Brain,
        features: ['Personalized recommendations', 'Risk profiling', 'Market timing insights']
      },
      {
        id: 6,
        title: 'Social Features',
        description: 'Community features for property investors',
        status: 'planned',
        icon: Users,
        features: ['Investor network', 'Property sharing', 'Collaborative analysis']
      }
    ],
    future: [
      {
        id: 7,
        title: 'Global Expansion',
        description: 'Support for international property markets',
        status: 'planned',
        icon: Globe,
        features: ['US property markets', 'European markets', 'Asian markets']
      },
      {
        id: 8,
        title: 'Advanced Security',
        description: 'Enhanced security and compliance features',
        status: 'planned',
        icon: Shield,
        features: ['Two-factor authentication', 'Data encryption', 'GDPR compliance']
      },
      {
        id: 9,
        title: 'Market Intelligence',
        description: 'Real-time market data and insights',
        status: 'planned',
        icon: TrendingUp,
        features: ['Live market data', 'Economic indicators', 'Investment trends']
      }
    ]
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'planned':
        return <Star className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
            Product Roadmap
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Our vision for the future of property intelligence. See what we're building next.
          </motion.p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            {[
              { id: 'current', label: 'Current', count: roadmapItems.current.length },
              { id: 'next', label: 'Next', count: roadmapItems.next.length },
              { id: 'future', label: 'Future', count: roadmapItems.future.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Roadmap Items */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {roadmapItems[activeTab as keyof typeof roadmapItems].map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <item.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(item.status)}`}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(item.status)}
                      <span className="capitalize">{item.status.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {item.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Have a Feature Request?
            </h3>
            <p className="text-gray-600 mb-6">
              We're always looking for feedback from our users. Let us know what features you'd like to see next!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/feedback"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Submit Feedback
              </a>
              <a
                href="/contact"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
