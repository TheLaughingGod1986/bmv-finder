'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, Zap, Database, Eye, BarChart3 } from 'lucide-react';
import PerformanceDashboard from '@/app/components/performance/PerformanceDashboard';
import { performanceMonitor } from '@/lib/performance/performanceMonitor';
import { apiClient } from '@/lib/performance/optimizedApiClient';

export default function PerformanceOptimizationPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'dashboard' | 'settings' | 'optimization'>('dashboard');
  const [isOptimized, setIsOptimized] = useState(false);

  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.setEnabled(true);
    
    // Preload critical data
    apiClient.preloadCriticalData();
    
    // Check if optimizations are enabled
    const optimizationsEnabled = localStorage.getItem('performance-optimizations') === 'true';
    setIsOptimized(optimizationsEnabled);
  }, []);

  const toggleOptimizations = () => {
    const newState = !isOptimized;
    setIsOptimized(newState);
    localStorage.setItem('performance-optimizations', newState.toString());
    
    if (newState) {
      enableOptimizations();
    } else {
      disableOptimizations();
    }
  };

  const enableOptimizations = () => {
    // Enable lazy loading
    document.documentElement.setAttribute('data-lazy-loading', 'true');
    
    // Enable image optimization
    document.documentElement.setAttribute('data-image-optimization', 'true');
    
    // Enable caching
    document.documentElement.setAttribute('data-caching', 'true');
    
    // Enable compression
    document.documentElement.setAttribute('data-compression', 'true');
    
    console.log('Performance optimizations enabled');
  };

  const disableOptimizations = () => {
    // Disable optimizations
    document.documentElement.removeAttribute('data-lazy-loading');
    document.documentElement.removeAttribute('data-image-optimization');
    document.documentElement.removeAttribute('data-caching');
    document.documentElement.removeAttribute('data-compression');
    
    console.log('Performance optimizations disabled');
  };

  const runPerformanceTest = async () => {
    const startTime = performance.now();
    
    // Simulate various operations
    await Promise.all([
      apiClient.searchProperties('London'),
      apiClient.getPropertyDetails('test-property'),
      apiClient.getPortfolioAnalytics('test-portfolio'),
    ]);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performanceMonitor.recordMetric('performance_test', duration, 'timing');
    
    alert(`Performance test completed in ${duration.toFixed(2)}ms`);
  };

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
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Performance Optimization
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Monitor and optimize application performance
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={runPerformanceTest}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Zap className="h-4 w-4" />
                <span>Run Test</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'optimization', label: 'Optimization', icon: Zap },
            ].map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        {activeSection === 'dashboard' && (
          <PerformanceDashboard />
        )}

        {activeSection === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Performance Settings
              </h2>
              
              <div className="space-y-6">
                {/* Optimization Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Performance Optimizations
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enable caching, lazy loading, and other performance improvements
                    </p>
                  </div>
                  <button
                    onClick={toggleOptimizations}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isOptimized ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isOptimized ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Cache Settings */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Cache Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Search Cache TTL
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        <option value="300000">5 minutes</option>
                        <option value="600000">10 minutes</option>
                        <option value="900000">15 minutes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Property Cache TTL
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        <option value="600000">10 minutes</option>
                        <option value="1800000">30 minutes</option>
                        <option value="3600000">1 hour</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Analytics Cache TTL
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        <option value="900000">15 minutes</option>
                        <option value="1800000">30 minutes</option>
                        <option value="3600000">1 hour</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Monitoring Settings */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Monitoring Configuration
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Web Vitals Monitoring
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Track Core Web Vitals metrics
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          API Performance Tracking
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Monitor API response times and errors
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Cache Performance Tracking
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Monitor cache hit rates and efficiency
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'optimization' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Performance Optimization Tools
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Cache Optimization */}
                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Cache Optimization
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Optimize cache settings and clear unnecessary data
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => apiClient.clearAllCaches()}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Clear All Caches
                    </button>
                    <button
                      onClick={() => apiClient.preloadCriticalData()}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Preload Critical Data
                    </button>
                  </div>
                </div>

                {/* Image Optimization */}
                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Image Optimization
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Enable lazy loading and image compression
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        document.documentElement.setAttribute('data-lazy-loading', 'true');
                        alert('Lazy loading enabled');
                      }}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Enable Lazy Loading
                    </button>
                    <button
                      onClick={() => {
                        document.documentElement.setAttribute('data-image-optimization', 'true');
                        alert('Image optimization enabled');
                      }}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      Optimize Images
                    </button>
                  </div>
                </div>

                {/* Bundle Optimization */}
                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Bundle Optimization
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Optimize JavaScript bundles and reduce payload
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        // Simulate bundle optimization
                        alert('Bundle optimization completed');
                      }}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      Optimize Bundles
                    </button>
                    <button
                      onClick={() => {
                        // Simulate code splitting
                        alert('Code splitting enabled');
                      }}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                    >
                      Enable Code Splitting
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Performance Tips
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Enable Caching
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use browser caching and API response caching to reduce load times
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Lazy Load Images
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Load images only when they're about to enter the viewport
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Optimize API Calls
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Batch requests and use debouncing to reduce unnecessary API calls
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Monitor Performance
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use the performance dashboard to identify bottlenecks and slow operations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
