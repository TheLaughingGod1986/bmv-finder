'use client';

import { useEffect } from 'react';
import { mobileOptimizer } from '@/lib/mobile/mobileOptimizer';

export default function MobilePerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    const monitorWebVitals = () => {
      // LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            if (lastEntry) {
              mobileOptimizer.recordMetric({
                type: 'performance',
                name: 'lcp',
                value: lastEntry.startTime,
                unit: 'ms',
                metadata: {
                  element: lastEntry.element?.tagName,
                  url: lastEntry.url,
                },
              });
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (error) {
          console.warn('LCP monitoring not supported:', error);
        }

        // FID (First Input Delay)
        try {
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              mobileOptimizer.recordMetric({
                type: 'performance',
                name: 'fid',
                value: entry.processingStart - entry.startTime,
                unit: 'ms',
                metadata: {
                  eventType: entry.name,
                  target: entry.target?.tagName,
                },
              });
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (error) {
          console.warn('FID monitoring not supported:', error);
        }

        // CLS (Cumulative Layout Shift)
        try {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
                mobileOptimizer.recordMetric({
                  type: 'performance',
                  name: 'cls',
                  value: entry.value,
                  unit: 'ratio',
                  metadata: {
                    sources: entry.sources?.map((s: any) => s.node?.tagName),
                  },
                });
              }
            });
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (error) {
          console.warn('CLS monitoring not supported:', error);
        }
      }
    };

    // Monitor memory usage
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        mobileOptimizer.recordMetric({
          type: 'memory',
          name: 'used_js_heap_size',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          metadata: {
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
          },
        });
      }
    };

    // Monitor network information
    const monitorNetwork = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          mobileOptimizer.recordMetric({
            type: 'network',
            name: 'downlink',
            value: connection.downlink || 0,
            unit: 'mbps',
            metadata: {
              effectiveType: connection.effectiveType,
              rtt: connection.rtt,
              saveData: connection.saveData,
            },
          });
        }
      }
    };

    // Monitor battery status
    const monitorBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          mobileOptimizer.recordMetric({
            type: 'battery',
            name: 'level',
            value: battery.level,
            unit: 'ratio',
            metadata: {
              charging: battery.charging,
              chargingTime: battery.chargingTime,
              dischargingTime: battery.dischargingTime,
            },
          });
        } catch (error) {
          console.warn('Battery monitoring not supported:', error);
        }
      }
    };

    // Start monitoring
    monitorWebVitals();
    monitorMemory();
    monitorNetwork();
    monitorBattery();

    // Monitor periodically
    const interval = setInterval(() => {
      monitorMemory();
      monitorNetwork();
      monitorBattery();
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  return null;
}