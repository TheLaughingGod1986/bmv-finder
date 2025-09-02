'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  BookOpen, 
  Lightbulb, 
  Play, 
  CheckCircle, 
  Clock, 
  Star, 
  Users,
  TrendingUp,
  Target,
  Award,
  Zap,
  Home,
  Briefcase,
  Calculator,
  Search,
  ExternalLink,
  Eye,
  BarChart3,
  Settings,
  RotateCcw
} from 'lucide-react';
import OnboardingDashboard from '@/app/components/onboarding/OnboardingDashboard';
import FeatureDiscovery from '@/app/components/onboarding/FeatureDiscovery';
import { useOnboarding } from '@/lib/onboarding/onboardingManager';

export default function OnboardingPage() {
  const router = useRouter();
  const { progress, tours, isTourCompleted } = useOnboarding();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'discovery'>('dashboard');
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // Check if user is new (no completed tours)
    const isNewUser = progress.completedTours.length === 0;
    if (isNewUser) {
      setShowWelcome(true);
    } else {
      setShowWelcome(false);
    }
  }, [progress.completedTours.length]);

  const handleStartFirstTour = () => {
    setShowWelcome(false);
    setActiveTab('dashboard');
  };

  const getCompletionStats = () => {
    const totalTours = tours.length;
    const completedTours = progress.completedTours.length;
    const completionRate = totalTours > 0 ? (completedTours / totalTours) * 100 : 0;
    
    return {
      totalTours,
      completedTours,
      completionRate: Math.round(completionRate),
      remainingTours: totalTours - completedTours
    };
  };

  const stats = getCompletionStats();

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-blue-600 rounded-full">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to BMV Finder! 🎉
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Your comprehensive property investment platform is ready to help you find the best below market value opportunities.
            </p>
          </div>

          {/* Features Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Search className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Property Search
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Find properties with powerful search filters and get instant BMV scores for investment opportunities.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Market Analysis
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Access comprehensive market data, HPI trends, and local market intelligence for informed decisions.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Portfolio Management
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Track your investments, analyze performance, and optimize your property portfolio for maximum returns.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Calculator className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Deal Analysis
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Calculate ROI, cash flow, and investment metrics with our comprehensive deal analysis tools.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <ExternalLink className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Chrome Extension
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Capture properties directly from Rightmove, Zoopla, and other sites with our powerful browser extension.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <Eye className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Accessibility
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Fully accessible platform with keyboard navigation, screen reader support, and customizable settings.
              </p>
            </div>
          </div>

          {/* Getting Started Options */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
              Let's Get You Started!
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={handleStartFirstTour}
                className="flex items-center space-x-4 p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <div className="p-3 bg-white/20 rounded-lg">
                  <Play className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold">Take a Guided Tour</h3>
                  <p className="text-blue-100 text-sm">
                    Learn the basics with our interactive tutorial
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowWelcome(false);
                  setActiveTab('discovery');
                }}
                className="flex items-center space-x-4 p-6 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <div className="p-3 bg-white/20 rounded-lg">
                  <Lightbulb className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold">Explore Features</h3>
                  <p className="text-green-100 text-sm">
                    Discover all available tools and capabilities
                  </p>
                </div>
              </button>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Skip for now and explore on my own
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Onboarding Center
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Learn how to use BMV Finder effectively
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completedTours}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Tours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalTours}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Time Spent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(progress.totalTimeSpent)}m
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completionRate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Guided Tours', icon: BookOpen },
              { id: 'discovery', label: 'Feature Discovery', icon: Lightbulb },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  aria-label={`Switch to ${tab.label} tab`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && <OnboardingDashboard />}
        {activeTab === 'discovery' && <FeatureDiscovery />}
      </div>
    </div>
  );
}
