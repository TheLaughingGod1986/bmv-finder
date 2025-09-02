'use client';

import { useRef, useEffect } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'timing' | 'counter' | 'gauge';
  tags?: Record<string, string>;
}

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
  navigationType: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private isEnabled: boolean = true;
  private maxMetrics: number = 1000;

  constructor() {
    this.initializeWebVitals();
    this.initializeResourceTiming();
    this.initializeNavigationTiming();
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Record custom metric
  recordMetric(name: string, value: number, type: 'timing' | 'counter' | 'gauge' = 'gauge', tags?: Record<string, string>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type,
      tags,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (type === 'timing' && value > 1000) {
      console.warn(`Slow operation detected: ${name} took ${value}ms`);
    }
  }

  // Time a function execution
  async timeFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'timing');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration, 'timing');
      throw error;
    }
  }

  // Time a synchronous function execution
  timeSyncFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'timing');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration, 'timing');
      throw error;
    }
  }

  // Initialize Web Vitals monitoring
  private initializeWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    this.observeLCP();
    
    // First Input Delay
    this.observeFID();
    
    // Cumulative Layout Shift
    this.observeCLS();
    
    // First Contentful Paint
    this.observeFCP();
    
    // Time to First Byte
    this.observeTTFB();
  }

  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.recordMetric('lcp', lastEntry.startTime, 'timing');
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    } catch (error) {
      console.warn('LCP observation not supported:', error);
    }
  }

  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('fid', entry.processingStart - entry.startTime, 'timing');
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', observer);
    } catch (error) {
      console.warn('FID observation not supported:', error);
    }
  }

  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('cls', clsValue, 'gauge');
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    } catch (error) {
      console.warn('CLS observation not supported:', error);
    }
  }

  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric('fcp', entry.startTime, 'timing');
        });
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('fcp', observer);
    } catch (error) {
      console.warn('FCP observation not supported:', error);
    }
  }

  private observeTTFB(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('ttfb', entry.responseStart - entry.requestStart, 'timing');
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.set('ttfb', observer);
    } catch (error) {
      console.warn('TTFB observation not supported:', error);
    }
  }

  // Initialize resource timing monitoring
  private initializeResourceTiming(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource');
        resources.forEach((resource: any) => {
          this.recordMetric('resource_load_time', resource.duration, 'timing', {
            type: resource.initiatorType,
            name: resource.name.split('/').pop() || 'unknown',
          });
        });
      }, 0);
    });
  }

  // Initialize navigation timing
  private initializeNavigationTiming(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        if (navigation) {
          this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'timing');
          this.recordMetric('load_complete', navigation.loadEventEnd - navigation.loadEventStart, 'timing');
          this.recordMetric('dom_processing', navigation.domComplete - navigation.domLoading, 'timing');
        }
      }, 0);
    });
  }

  // Get performance metrics
  getMetrics(filter?: { name?: string; type?: string; since?: number }): PerformanceMetric[] {
    let filtered = this.metrics;

    if (filter) {
      if (filter.name) {
        filtered = filtered.filter(m => m.name.includes(filter.name!));
      }
      if (filter.type) {
        filtered = filtered.filter(m => m.type === filter.type);
      }
      if (filter.since) {
        filtered = filtered.filter(m => m.timestamp >= filter.since!);
      }
    }

    return filtered;
  }

  // Get performance summary
  getSummary(): {
    totalMetrics: number;
    averageTiming: number;
    slowestOperations: PerformanceMetric[];
    webVitals: Record<string, number>;
  } {
    const timingMetrics = this.metrics.filter(m => m.type === 'timing');
    const averageTiming = timingMetrics.length > 0 
      ? timingMetrics.reduce((sum, m) => sum + m.value, 0) / timingMetrics.length 
      : 0;

    const slowestOperations = timingMetrics
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const webVitals = {
      lcp: this.getLatestMetric('lcp')?.value || 0,
      fid: this.getLatestMetric('fid')?.value || 0,
      cls: this.getLatestMetric('cls')?.value || 0,
      fcp: this.getLatestMetric('fcp')?.value || 0,
      ttfb: this.getLatestMetric('ttfb')?.value || 0,
    };

    return {
      totalMetrics: this.metrics.length,
      averageTiming,
      slowestOperations,
      webVitals,
    };
  }

  // Get latest metric by name
  private getLatestMetric(name: string): PerformanceMetric | undefined {
    return this.metrics
      .filter(m => m.name === name)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = [];
  }

  // Disconnect observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  // Export metrics for analysis
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: this.metrics,
      summary: this.getSummary(),
    }, null, 2);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderStart = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStart.current = performance.now();
    renderCount.current++;

    return () => {
      if (renderStart.current) {
        const renderTime = performance.now() - renderStart.current;
        performanceMonitor.recordMetric(`render_${componentName}`, renderTime, 'timing');
        
        if (renderTime > 16) { // More than one frame
          console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      }
    };
  });

  return {
    renderCount: renderCount.current,
    recordMetric: (name: string, value: number, type?: 'timing' | 'counter' | 'gauge') => {
      performanceMonitor.recordMetric(`${componentName}_${name}`, value, type);
    },
  };
}

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Memoize function results
  memoize: <T extends (...args: any[]) => any>(fn: T): T => {
    const cache = new Map();
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Batch DOM updates
  batchDOMUpdates: (updates: (() => void)[]): void => {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  },

  // Check if element is in viewport
  isInViewport: (element: Element): boolean => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },
};
