'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  BarChart3, 
  Building2, 
  TrendingUp, 
  Shield, 
  Zap,
  Target,
  Globe,
  Smartphone,
  Download,
  Users,
  Star
} from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Advanced Property Search',
    description: 'Find properties with our powerful search engine that filters by location, price, property type, and investment potential.',
    category: 'Search & Discovery'
  },
  {
    icon: BarChart3,
    title: 'Market Analysis',
    description: 'Get comprehensive market insights with HPI data, price trends, and growth projections for any area.',
    category: 'Analytics'
  },
  {
    icon: Building2,
    title: 'Portfolio Management',
    description: 'Track and manage your property portfolio with detailed analytics, performance metrics, and growth tracking.',
    category: 'Portfolio'
  },
  {
    icon: TrendingUp,
    title: 'Investment Recommendations',
    description: 'Receive AI-powered investment recommendations based on market data, growth potential, and risk analysis.',
    category: 'Investment'
  },
  {
    icon: Target,
    title: 'BMV Scoring',
    description: 'Our proprietary Below Market Value scoring system helps identify the best investment opportunities.',
    category: 'Investment'
  },
  {
    icon: Shield,
    title: 'Data Security',
    description: 'Enterprise-grade security with encrypted data storage and secure API access for all your property data.',
    category: 'Security'
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    description: 'Get instant notifications about market changes, price updates, and new opportunities in your areas of interest.',
    category: 'Notifications'
  },
  {
    icon: Globe,
    title: 'Chrome Extension',
    description: 'Capture property data directly from any website with our powerful browser extension for seamless workflow.',
    category: 'Tools'
  },
  {
    icon: Smartphone,
    title: 'Mobile Optimized',
    description: 'Access all features on any device with our responsive design and mobile-first approach.',
    category: 'Accessibility'
  },
  {
    icon: Download,
    title: 'Data Export',
    description: 'Export your property data, reports, and analytics in multiple formats for external analysis.',
    category: 'Tools'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share properties, collaborate on deals, and manage team access with our collaboration features.',
    category: 'Collaboration'
  },
  {
    icon: Star,
    title: 'Watchlist',
    description: 'Save and track properties of interest with our intelligent watchlist that monitors price changes.',
    category: 'Tracking'
  }
];

const categories = ['All', 'Search & Discovery', 'Analytics', 'Portfolio', 'Investment', 'Security', 'Notifications', 'Tools', 'Accessibility', 'Collaboration', 'Tracking'];

export default function FeaturesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredFeatures = selectedCategory === 'All' 
    ? features 
    : features.filter(feature => feature.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features for
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Property Investors
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to find, analyze, and manage property investments with confidence. 
              Our comprehensive platform combines market data, AI insights, and professional tools.
            </p>
          </motion.div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 group hover:-translate-y-2"
            >
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {feature.category}
                  </span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="bg-white rounded-2xl shadow-xl p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of property investors who trust BMV Finder for their investment decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200">
                Start Free Trial
              </button>
              <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                View Pricing
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
