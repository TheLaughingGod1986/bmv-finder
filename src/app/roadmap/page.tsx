'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Circle, ExternalLink, FileText, BookOpen, Code, Database, Smartphone, TrendingUp, Users, Shield, Zap } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'planned' | 'in-progress' | 'completed';
  filename: string;
  icon: React.ComponentType<any>;
  estimatedTime?: string;
  dependencies?: string[];
}

const documents: Document[] = [
  // Core Planning
  {
    id: 'todo',
    title: 'Project Roadmap',
    description: 'Main prioritized task list and project timeline',
    category: 'Core Planning',
    priority: 'high',
    status: 'completed',
    filename: 'TODO.md',
    icon: FileText,
    estimatedTime: 'Ongoing'
  },
  {
    id: 'production-summary',
    title: 'Production Ready Summary',
    description: 'High-level overview of production readiness status',
    category: 'Core Planning',
    priority: 'high',
    status: 'completed',
    filename: 'PRODUCTION_READY_SUMMARY.md',
    icon: CheckCircle,
    estimatedTime: 'Reference'
  },
  {
    id: 'deployment-checklist',
    title: 'Production Deployment Checklist',
    description: 'Step-by-step deployment verification checklist',
    category: 'Core Planning',
    priority: 'high',
    status: 'completed',
    filename: 'PRODUCTION_DEPLOYMENT_CHECKLIST.md',
    icon: CheckCircle,
    estimatedTime: 'Reference'
  },

  // Architecture & Backend
  {
    id: 'architecture',
    title: 'Production Architecture',
    description: 'Backend architecture and data pipeline design',
    category: 'Architecture & Backend',
    priority: 'high',
    status: 'completed',
    filename: 'PRODUCTION_ARCHITECTURE.md',
    icon: Database,
    estimatedTime: 'Reference'
  },
  {
    id: 'api-migration',
    title: 'API Migration Guide',
    description: 'How to migrate from Next.js API routes to decoupled backend',
    category: 'Architecture & Backend',
    priority: 'medium',
    status: 'planned',
    filename: 'API_MIGRATION_GUIDE.md',
    icon: Code,
    estimatedTime: '2-3 weeks',
    dependencies: ['architecture']
  },
  {
    id: 'deployment-guide',
    title: 'Production Deployment Guide',
    description: 'Complete deployment guide with AWS/Vercel setup',
    category: 'Architecture & Backend',
    priority: 'high',
    status: 'completed',
    filename: 'PRODUCTION_DEPLOYMENT_GUIDE.md',
    icon: Zap,
    estimatedTime: 'Reference'
  },
  {
    id: 'quick-deployment',
    title: 'Quick Deployment Guide',
    description: 'Fast deployment instructions for rapid setup',
    category: 'Architecture & Backend',
    priority: 'medium',
    status: 'completed',
    filename: 'QUICK_DEPLOYMENT_GUIDE.md',
    icon: Zap,
    estimatedTime: 'Reference'
  },

  // Frontend & Mobile
  {
    id: 'frontend-optimization',
    title: 'Frontend Optimization Guide',
    description: 'CRO, SEO, UX optimization strategies',
    category: 'Frontend & Mobile',
    priority: 'high',
    status: 'completed',
    filename: 'FRONTEND_OPTIMIZATION_GUIDE.md',
    icon: TrendingUp,
    estimatedTime: '3-4 weeks'
  },
  {
    id: 'react-native',
    title: 'React Native Mobile Guide',
    description: 'Complete mobile app development plan with iOS widgets',
    category: 'Frontend & Mobile',
    priority: 'medium',
    status: 'completed',
    filename: 'REACT_NATIVE_MOBILE_GUIDE.md',
    icon: Smartphone,
    estimatedTime: '8-12 weeks',
    dependencies: ['frontend-optimization']
  },

  // Business Features
  {
    id: 'business-features',
    title: 'Business Features Guide',
    description: 'Market intelligence, portfolio tracking, cost analysis tools',
    category: 'Business Features',
    priority: 'high',
    status: 'completed',
    filename: 'BUSINESS_FEATURES_GUIDE.md',
    icon: TrendingUp,
    estimatedTime: '6-8 weeks'
  },
  {
    id: 'ecosystem-integration',
    title: 'Ecosystem Integration Guide',
    description: 'Third-party integrations and data partnerships',
    category: 'Business Features',
    priority: 'medium',
    status: 'completed',
    filename: 'ECOSYSTEM_INTEGRATION_GUIDE.md',
    icon: Users,
    estimatedTime: '4-6 weeks',
    dependencies: ['business-features']
  },

  // Data Pipeline & Testing
  {
    id: 'hpi-pipeline',
    title: 'HPI Pipeline Documentation',
    description: 'House Price Index data processing and automation',
    category: 'Data Pipeline & Testing',
    priority: 'high',
    status: 'completed',
    filename: 'HPI_PIPELINE_README.md',
    icon: Database,
    estimatedTime: 'Reference'
  },
  {
    id: 'hpi-testing',
    title: 'HPI Testing Guide',
    description: 'HPI system testing procedures and validation',
    category: 'Data Pipeline & Testing',
    priority: 'medium',
    status: 'completed',
    filename: 'HPI_TESTING_GUIDE.md',
    icon: CheckCircle,
    estimatedTime: 'Reference'
  },
  {
    id: 'recent-sales-automation',
    title: 'Recent Sales Automation',
    description: 'Recent sales data automation and indexing',
    category: 'Data Pipeline & Testing',
    priority: 'high',
    status: 'completed',
    filename: 'RECENT_SALES_AUTOMATION.md',
    icon: Database,
    estimatedTime: 'Reference'
  },
  {
    id: 'gateway-testing',
    title: 'Gateway Testing Guide',
    description: 'API gateway testing and validation procedures',
    category: 'Data Pipeline & Testing',
    priority: 'medium',
    status: 'completed',
    filename: 'GATEWAY_TESTING_GUIDE.md',
    icon: CheckCircle,
    estimatedTime: 'Reference'
  },
  {
    id: 'pagination',
    title: 'Pagination Implementation',
    description: 'Search pagination implementation guide',
    category: 'Data Pipeline & Testing',
    priority: 'low',
    status: 'completed',
    filename: 'PAGINATION_IMPLEMENTATION.md',
    icon: Code,
    estimatedTime: 'Reference'
  },

  // Trust & Marketing
  {
    id: 'trust-social-proof',
    title: 'Trust & Social Proof Guide',
    description: 'Building trust and social proof strategies',
    category: 'Trust & Marketing',
    priority: 'medium',
    status: 'completed',
    filename: 'TRUST_SOCIAL_PROOF_GUIDE.md',
    icon: Shield,
    estimatedTime: '2-3 weeks'
  },

  // Production Setup
  {
    id: 'production-guide',
    title: 'Production Setup Guide',
    description: 'General production setup and configuration',
    category: 'Production Setup',
    priority: 'high',
    status: 'completed',
    filename: 'PRODUCTION_GUIDE.md',
    icon: Zap,
    estimatedTime: 'Reference'
  }
];

const categories = [
  'Core Planning',
  'Architecture & Backend',
  'Frontend & Mobile',
  'Business Features',
  'Data Pipeline & Testing',
  'Trust & Marketing',
  'Production Setup'
];

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
};

const statusColors = {
  'planned': 'bg-gray-100 text-gray-800 border-gray-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  'completed': 'bg-green-100 text-green-800 border-green-200'
};

const statusIcons = {
  'planned': Circle,
  'in-progress': Circle,
  'completed': CheckCircle
};

export default function RoadmapPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredDocuments = documents.filter(doc => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && doc.priority !== selectedPriority) return false;
    if (selectedStatus !== 'all' && doc.status !== selectedStatus) return false;
    return true;
  });

  const getProgressStats = () => {
    const total = documents.length;
    const completed = documents.filter(d => d.status === 'completed').length;
    const inProgress = documents.filter(d => d.status === 'in-progress').length;
    const planned = documents.filter(d => d.status === 'planned').length;
    
    return { total, completed, inProgress, planned };
  };

  const getProjectCompletion = () => {
    // Calculate overall project completion based on major milestones
    const milestones = [
      { name: 'Core Platform', weight: 20, completed: true },
      { name: 'Performance & Scalability', weight: 15, completed: true },
      { name: 'AI & Intelligence', weight: 15, completed: true },
      { name: 'Data & Monitoring', weight: 10, completed: true },
      { name: 'Business Intelligence', weight: 10, completed: true },
      { name: 'Mobile Expansion', weight: 10, completed: true },
      { name: 'Enhanced Data Integration', weight: 10, completed: true },
      { name: 'Market Analysis Features', weight: 5, completed: true },
      { name: 'Property Project Management', weight: 3, completed: false },
      { name: 'Production Deployment', weight: 2, completed: false }
    ];

    const totalWeight = milestones.reduce((sum, m) => sum + m.weight, 0);
    const completedWeight = milestones.reduce((sum, m) => sum + (m.completed ? m.weight : 0), 0);
    
    return Math.round((completedWeight / totalWeight) * 100);
  };

  const stats = getProgressStats();
  const projectCompletion = getProjectCompletion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            BMV Finder Project Roadmap
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Visual tracking and understanding of your property investment platform development journey
          </p>
          
          {/* Project Completion Banner */}
          <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-200 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Overall Project Progress</h2>
              <div className="text-3xl font-bold text-green-600">{projectCompletion}%</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${projectCompletion}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {projectCompletion >= 95 ? '🎉 Production Ready! Only minor enhancements remaining.' : 
               projectCompletion >= 80 ? '🚀 Nearly Complete! Final features in progress.' :
               '🔄 In Progress - Core features implemented, advanced features pending.'}
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Circle className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Planned</p>
                <p className="text-2xl font-bold text-gray-600">{stats.planned}</p>
              </div>
              <Circle className="h-8 w-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* What's Next Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">What's Next (5% Remaining)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-gray-900">1. Property Project Management Tool</h4>
              <p className="text-sm text-gray-600 mt-1">Implement workflow management system for property investors</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-gray-900">2. Production Deployment</h4>
              <p className="text-sm text-gray-600 mt-1">Final deployment steps and monitoring setup</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-gray-900">3. Advanced Analytics Dashboard</h4>
              <p className="text-sm text-gray-600 mt-1">Enhanced business intelligence features</p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-semibold text-gray-900">4. Real-time Market Monitoring</h4>
              <p className="text-sm text-gray-600 mt-1">Live market data feeds and alerts</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="planned">Planned</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => {
            const StatusIcon = statusIcons[doc.status];
            const DocIcon = doc.icon;
            
            return (
              <div
                key={doc.id}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <DocIcon className="h-6 w-6 text-blue-500 mt-1" />
                  <StatusIcon className={`h-5 w-5 ${
                    doc.status === 'completed' ? 'text-green-500' : 
                    doc.status === 'in-progress' ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {doc.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {doc.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${priorityColors[doc.priority]}`}>
                    {doc.priority} priority
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[doc.status]}`}>
                    {doc.status}
                  </span>
                </div>
                
                {doc.estimatedTime && (
                  <p className="text-xs text-gray-500 mb-3">
                    ⏱️ Estimated: {doc.estimatedTime}
                  </p>
                )}
                
                {doc.dependencies && doc.dependencies.length > 0 && (
                  <p className="text-xs text-orange-600 mb-3">
                    🔗 Depends on: {doc.dependencies.join(', ')}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">
                    {doc.filename}
                  </span>
                  <Link
                    href={`/roadmap/view/${doc.filename}`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Document
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString()} | 
            Total documents: {documents.length}
          </p>
        </div>
      </div>
    </div>
  );
} 