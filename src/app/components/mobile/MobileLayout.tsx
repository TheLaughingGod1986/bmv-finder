'use client';

import { useState, useEffect } from 'react';
import { useMobileOptimization } from '@/lib/pwa/mobileOptimizer';
import MobileNavigation from './MobileNavigation';
import PWAInstallPrompt from '../pwa/PWAInstallPrompt';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function MobileLayout({ children, className = '' }: MobileLayoutProps) {
  const { isMobile, isOnline } = useMobileOptimization();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Detect keyboard open/close on mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      const initialHeight = window.innerHeight;
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      // If height decreased significantly, keyboard is likely open
      setIsKeyboardOpen(heightDifference > 150);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Handle safe area insets
  useEffect(() => {
    if (!isMobile) return;

    // Set CSS custom properties for safe area
    const setSafeAreaInsets = () => {
      const root = document.documentElement;
      root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
      root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)');
      root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
      root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)');
    };

    setSafeAreaInsets();
  }, [isMobile]);

  // Add mobile-specific classes
  useEffect(() => {
    if (isMobile) {
      document.documentElement.classList.add('mobile-device');
    } else {
      document.documentElement.classList.remove('mobile-device');
    }

    return () => {
      document.documentElement.classList.remove('mobile-device');
    };
  }, [isMobile]);

  return (
    <div className={`mobile-layout ${className}`}>
      {/* Mobile Navigation */}
      {isMobile && <MobileNavigation />}

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-200 ${
          isMobile ? 'pt-16' : ''
        } ${
          isKeyboardOpen ? 'pb-0' : ''
        }`}
        style={{
          paddingTop: isMobile ? 'calc(4rem + env(safe-area-inset-top))' : undefined,
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : undefined,
        }}
      >
        {children}
      </main>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 text-sm font-medium z-50">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
            <span>You're offline. Some features may be limited.</span>
          </div>
        </div>
      )}

      {/* Mobile-specific styles */}
      <style jsx global>{`
        .mobile-device {
          /* Prevent zoom on input focus */
          -webkit-text-size-adjust: 100%;
          -webkit-tap-highlight-color: transparent;
        }

        .mobile-device input,
        .mobile-device textarea,
        .mobile-device select {
          font-size: 16px; /* Prevent zoom on iOS */
        }

        .mobile-device .touch-target {
          min-height: 44px;
          min-width: 44px;
        }

        /* Smooth scrolling for mobile */
        .mobile-device {
          -webkit-overflow-scrolling: touch;
        }

        /* Hide scrollbars on mobile */
        .mobile-device ::-webkit-scrollbar {
          display: none;
        }

        .mobile-device {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Optimize touch interactions */
        .mobile-device button,
        .mobile-device a,
        .mobile-device [role="button"] {
          touch-action: manipulation;
        }

        /* Safe area handling */
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }

        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }

        .safe-area-left {
          padding-left: env(safe-area-inset-left);
        }

        .safe-area-right {
          padding-right: env(safe-area-inset-right);
        }

        /* Mobile-specific animations */
        @media (prefers-reduced-motion: no-preference) {
          .mobile-device .animate-slide-up {
            animation: slideUp 0.3s ease-out;
          }

          .mobile-device .animate-slide-down {
            animation: slideDown 0.3s ease-out;
          }

          .mobile-device .animate-fade-in {
            animation: fadeIn 0.2s ease-out;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Mobile-specific utilities */
        .mobile-device .no-scroll {
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
        }

        .mobile-device .swipe-indicator {
          position: relative;
        }

        .mobile-device .swipe-indicator::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 4px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}

// Mobile-specific hook for layout utilities
export function useMobileLayout() {
  const { isMobile, isOnline } = useMobileOptimization();
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) return;

    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
      
      // Detect keyboard
      const initialHeight = window.visualViewport?.height || window.innerHeight;
      const currentHeight = window.innerHeight;
      setIsKeyboardOpen(currentHeight < initialHeight * 0.75);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, [isMobile]);

  return {
    isMobile,
    isOnline,
    viewportHeight,
    isKeyboardOpen,
    safeAreaInsets: {
      top: 'env(safe-area-inset-top)',
      right: 'env(safe-area-inset-right)',
      bottom: 'env(safe-area-inset-bottom)',
      left: 'env(safe-area-inset-left)',
    },
  };
}
