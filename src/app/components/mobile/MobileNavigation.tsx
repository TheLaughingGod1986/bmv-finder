'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Star, 
  Building2, 
  BarChart3, 
  TrendingUp, 
  Menu, 
  X, 
  User, 
  LogOut,
  Bell,
  Settings,
  ChevronDown
} from 'lucide-react';
import { mobileOptimizer } from '@/lib/mobile/mobileOptimizer';
import TouchGestureHandler from './TouchGestureHandler';

interface MobileNavigationProps {
  user?: any;
  onSignOut?: () => void;
}

export default function MobileNavigation({ user, onSignOut }: MobileNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    setDeviceInfo(mobileOptimizer.getDeviceInfo());
  }, []);

  const navigation = [
    { name: 'Home', href: '/', icon: Home, tourId: 'home-link' },
    { name: 'Search', href: '/search/properties', icon: Search, tourId: 'search-link' },
    { name: 'Watchlist', href: '/watchlist', icon: Star, tourId: 'watchlist' },
    { name: 'Portfolio', href: '/tools/portfolio', icon: Building2, tourId: 'portfolio-link' },
    { name: 'Analysis', href: '/analysis/deal-analysis', icon: BarChart3, tourId: 'deal-analysis' },
    { name: 'Trends', href: '/market/analysis', icon: TrendingUp, tourId: 'market-analysis' },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    
    // Trigger haptic feedback
    mobileOptimizer.triggerHapticFeedback('light');
  };

  const handleSignOut = () => {
    onSignOut?.();
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    
    // Trigger haptic feedback
    mobileOptimizer.triggerHapticFeedback('medium');
  };

  const handleSwipeLeft = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  const handleSwipeRight = () => {
    if (!isMenuOpen) {
      setIsMenuOpen(true);
    }
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  if (!deviceInfo?.isMobile && !deviceInfo?.isTablet) {
    return null; // Don't render on desktop
  }

  return (
    <TouchGestureHandler
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      className="mobile-navigation-container"
    >
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-header-content">
          <button
            className="mobile-menu-button"
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              mobileOptimizer.triggerHapticFeedback('light');
            }}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="mobile-logo">
            <h1 className="text-xl font-bold text-gray-900">BMV Finder</h1>
          </div>

          <div className="mobile-header-actions">
            {user ? (
              <div className="relative">
                <button
                  className="mobile-user-button"
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen);
                    mobileOptimizer.triggerHapticFeedback('light');
                  }}
                  aria-label="User menu"
                >
                  <User size={20} />
                  <ChevronDown size={16} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="mobile-user-dropdown">
                    <div className="mobile-user-info">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || user.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.tier || 'Free'} Plan
                      </div>
                    </div>
                    
                    <div className="mobile-user-menu">
                      <button
                        className="mobile-user-menu-item"
                        onClick={() => handleNavigation('/profile')}
                      >
                        <User size={16} />
                        Profile
                      </button>
                      <button
                        className="mobile-user-menu-item"
                        onClick={() => handleNavigation('/account')}
                      >
                        <Settings size={16} />
                        Account
                      </button>
                      <button
                        className="mobile-user-menu-item"
                        onClick={() => handleNavigation('/notifications')}
                      >
                        <Bell size={16} />
                        Notifications
                      </button>
                      <hr className="mobile-user-menu-divider" />
                      <button
                        className="mobile-user-menu-item text-red-600"
                        onClick={handleSignOut}
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="mobile-signin-button"
                onClick={() => {
                  handleNavigation('/login');
                  mobileOptimizer.triggerHapticFeedback('light');
                }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-content">
            <div className="mobile-menu-header">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                className="mobile-menu-close"
                onClick={() => {
                  setIsMenuOpen(false);
                  mobileOptimizer.triggerHapticFeedback('light');
                }}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="mobile-menu-nav">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  className={`mobile-menu-item ${isActive(item.href) ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.href)}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                  {isActive(item.href) && (
                    <div className="mobile-menu-item-indicator" />
                  )}
                </button>
              ))}
            </nav>

            <div className="mobile-menu-footer">
              <div className="mobile-menu-stats">
                <div className="mobile-menu-stat">
                  <span className="text-sm text-gray-500">Properties</span>
                  <span className="text-lg font-semibold text-gray-900">1,234</span>
                </div>
                <div className="mobile-menu-stat">
                  <span className="text-sm text-gray-500">Saved</span>
                  <span className="text-lg font-semibold text-gray-900">12</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation (for mobile) */}
      {deviceInfo?.isMobile && (
        <div className="mobile-bottom-nav">
          {navigation.slice(0, 5).map((item) => (
            <button
              key={item.name}
              className={`mobile-bottom-nav-item ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => handleNavigation(item.href)}
            >
              <item.icon size={20} />
              <span className="text-xs">{item.name}</span>
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .mobile-navigation-container {
          position: relative;
          z-index: 50;
        }

        .mobile-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          z-index: 40;
          padding: 0 16px;
          height: 60px;
        }

        .mobile-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          max-width: 100%;
        }

        .mobile-menu-button,
        .mobile-user-button,
        .mobile-signin-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: #374151;
          transition: all 0.2s ease;
        }

        .mobile-menu-button:hover,
        .mobile-user-button:hover,
        .mobile-signin-button:hover {
          background: #f3f4f6;
        }

        .mobile-user-button {
          gap: 4px;
        }

        .mobile-signin-button {
          background: #3b82f6;
          color: white;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
        }

        .mobile-signin-button:hover {
          background: #2563eb;
        }

        .mobile-logo h1 {
          color: #1f2937;
        }

        .mobile-user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          min-width: 200px;
          z-index: 50;
        }

        .mobile-user-info {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .mobile-user-menu {
          padding: 8px 0;
        }

        .mobile-user-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          border: none;
          text-align: left;
          color: #374151;
          font-size: 14px;
          transition: background-color 0.2s ease;
        }

        .mobile-user-menu-item:hover {
          background: #f3f4f6;
        }

        .mobile-user-menu-divider {
          margin: 8px 0;
          border: none;
          border-top: 1px solid #e5e7eb;
        }

        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 45;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
        }

        .mobile-menu-content {
          background: white;
          width: 280px;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
        }

        .mobile-menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .mobile-menu-close {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: #374151;
        }

        .mobile-menu-nav {
          flex: 1;
          padding: 16px 0;
        }

        .mobile-menu-item {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          padding: 16px 20px;
          background: transparent;
          border: none;
          text-align: left;
          color: #374151;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s ease;
          position: relative;
        }

        .mobile-menu-item:hover {
          background: #f3f4f6;
        }

        .mobile-menu-item.active {
          color: #3b82f6;
          background: #eff6ff;
        }

        .mobile-menu-item-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 24px;
          background: #3b82f6;
          border-radius: 0 2px 2px 0;
        }

        .mobile-menu-footer {
          padding: 20px 16px;
          border-top: 1px solid #e5e7eb;
        }

        .mobile-menu-stats {
          display: flex;
          gap: 24px;
        }

        .mobile-menu-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .mobile-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-around;
          padding: 8px 0;
          z-index: 40;
        }

        .mobile-bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: #6b7280;
          transition: color 0.2s ease;
        }

        .mobile-bottom-nav-item.active {
          color: #3b82f6;
        }

        /* Add top padding to body when mobile header is present */
        body {
          padding-top: 60px;
        }

        /* Add bottom padding when bottom nav is present */
        @media (max-width: 768px) {
          body {
            padding-bottom: 80px;
          }
        }
      `}</style>
    </TouchGestureHandler>
  );
}