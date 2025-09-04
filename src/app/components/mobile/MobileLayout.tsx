'use client';

import React, { useState, useEffect } from 'react';
import { mobileOptimizer } from '@/lib/mobile/mobileOptimizer';
import MobileNavigation from '../MobileNavigation';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Get device information
    const info = mobileOptimizer.getDeviceInfo();
    setDeviceInfo(info);
    setIsMobile(info?.type === 'mobile');

    // Record device detection
    if (info) {
      mobileOptimizer.recordMetric({
        type: 'interaction',
        name: 'device_detected',
        value: 1,
        unit: 'count',
        metadata: {
          deviceType: info.type,
          os: info.os,
          browser: info.browser,
          touch: info.capabilities.touch,
        },
      });
    }
  }, []);

  // Apply mobile-specific styles
  useEffect(() => {
    if (isMobile) {
      // Add mobile-specific classes
      document.body.classList.add('mobile-device');
      
      // Prevent zoom on input focus (iOS)
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      }
    } else {
      document.body.classList.remove('mobile-device');
    }

    return () => {
      document.body.classList.remove('mobile-device');
    };
  }, [isMobile]);

  return (
    <div className={`mobile-layout ${isMobile ? 'mobile-device' : ''}`}>
      {isMobile ? (
        <div className="mobile-container">
          <MobileNavigation />
          <div className="mobile-content">
            {children}
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}