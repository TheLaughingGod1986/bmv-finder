'use client';

import { useState, useEffect } from 'react';
import { mobilePerformanceOptimizer } from '@/lib/mobilePerformance';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkRequests: number;
  cacheHitRate: number;
}

interface MobilePerformanceMonitorProps {
  showMetrics?: boolean;
  className?: string;
}

export default function MobilePerformanceMonitor({ 
  showMetrics = false, 
  className = "" 
}: MobilePerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    cacheHitRate: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initialize performance monitoring
    const updateMetrics = () => {
      const currentMetrics = mobilePerformanceOptimizer.getMetrics();
      setMetrics(currentMetrics);
    };

    // Update metrics periodically
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics();

    // Show metrics in development
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
    }

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut to toggle metrics (Ctrl/Cmd + Shift + P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Performance</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 text-xs">
        {/* Load Time */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Load Time:</span>
          <span className={getPerformanceColor(metrics.loadTime, { good: 1000, warning: 3000 })}>
            {formatTime(metrics.loadTime)}
          </span>
        </div>

        {/* Memory Usage */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Memory:</span>
          <span className={getPerformanceColor(metrics.memoryUsage * 100, { good: 50, warning: 80 })}>
            {(metrics.memoryUsage * 100).toFixed(1)}%
          </span>
        </div>

        {/* Network Requests */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Requests:</span>
          <span className="text-gray-900">{metrics.networkRequests}</span>
        </div>

        {/* Cache Hit Rate */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Cache Hit:</span>
          <span className={getPerformanceColor(100 - metrics.cacheHitRate, { good: 20, warning: 50 })}>
            {metrics.cacheHitRate.toFixed(1)}%
          </span>
        </div>

        {/* Device Info */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Device:</span>
            <span className="text-gray-900">
              {window.innerWidth <= 768 ? 'Mobile' : 'Desktop'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Connection:</span>
            <span className="text-gray-900">
              {navigator.onLine ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Performance Score */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Score:</span>
            <span className="font-semibold text-gray-900">
              {calculatePerformanceScore(metrics)}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {getPerformanceTip(metrics)}
        </div>
      </div>
    </div>
  );
}

// Calculate overall performance score
function calculatePerformanceScore(metrics: PerformanceMetrics): string {
  let score = 100;

  // Deduct points for slow load time
  if (metrics.loadTime > 3000) score -= 30;
  else if (metrics.loadTime > 1000) score -= 15;

  // Deduct points for high memory usage
  if (metrics.memoryUsage > 0.8) score -= 25;
  else if (metrics.memoryUsage > 0.5) score -= 10;

  // Deduct points for low cache hit rate
  if (metrics.cacheHitRate < 50) score -= 20;
  else if (metrics.cacheHitRate < 80) score -= 10;

  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  return 'Poor';
}

// Get performance tip based on metrics
function getPerformanceTip(metrics: PerformanceMetrics): string {
  if (metrics.loadTime > 3000) {
    return '💡 Consider optimizing images and reducing bundle size';
  }
  if (metrics.memoryUsage > 0.8) {
    return '💡 High memory usage detected. Check for memory leaks';
  }
  if (metrics.cacheHitRate < 50) {
    return '💡 Low cache hit rate. Consider implementing better caching';
  }
  if (metrics.networkRequests > 50) {
    return '💡 High number of network requests. Consider batching';
  }
  return '✅ Performance looks good!';
}
