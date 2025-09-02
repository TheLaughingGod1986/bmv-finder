'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Building2, 
  TrendingUp, 
  Search, 
  BarChart3, 
  Star,
  Menu,
  X,
  User,
  LogOut,
  Bell,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useMockAuth } from '../MockAuthProvider';
import { useHybridAuth } from '@/lib/auth/hybridAuth';
import { useMobileOptimization } from '@/lib/pwa/mobileOptimizer';
import ThemeToggle from '../ThemeToggle';

interface MobileNavigationProps {
  className?: string;
}

export default function MobileNavigation({ className = '' }: MobileNavigationProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useMockAuth();
  const hybridAuth = useHybridAuth();
  const { isMobile, triggerHapticFeedback } = useMobileOptimization();

  const currentUser = hybridAuth.user || user;
  const isRealAuth = hybridAuth.isRealAuth;

  // Navigation items
  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Search', href: '/search/properties', icon: Search },
    { name: 'Portfolio', href: '/tools/portfolio', icon: Building2 },
    { name: 'Analytics', href: '/tools/portfolio/analytics', icon: BarChart3 },
    { name: 'Watchlist', href: '/watchlist', icon: Star },
    { name: 'Market', href: '/market/analysis', icon: TrendingUp },
  ];

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle menu toggle with haptic feedback
  const toggleMenu = () => {
    triggerHapticFeedback('light');
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    triggerHapticFeedback('light');
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Close menus when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.mobile-nav')) {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    if (isMenuOpen || isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMenuOpen, isUserMenuOpen]);

  if (!isMobile) {
    return null; // Only render on mobile devices
  }

  return (
    <div className={`mobile-nav fixed top-0 left-0 right-0 z-50 ${className}`}>
      {/* Main Navigation Bar */}
      <div className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 ${
        isScrolled ? 'shadow-lg' : 'shadow-sm'
      }`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                BMV Finder
              </span>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Notifications */}
              <button
                onClick={() => triggerHapticFeedback('light')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* User Menu */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center space-x-2 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {isUserMenuOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* User Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {currentUser.name}
                          {isRealAuth && (
                            <span className="ml-1 text-xs text-green-600 dark:text-green-400">●</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {currentUser.email}
                        </p>
                      </div>
                      <a
                        href="/account"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Account
                      </a>
                      <a
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </a>
                      <button
                        onClick={() => {
                          triggerHapticFeedback('medium');
                          isRealAuth ? hybridAuth.signOut() : logout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => triggerHapticFeedback('light')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Sign In
                </button>
              )}

              {/* Menu Toggle */}
              <button
                onClick={toggleMenu}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMenuOpen(false)}>
          <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Menu
                </h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto">
                <nav className="p-4">
                  <div className="space-y-2">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      
                      return (
                        <a
                          key={item.name}
                          href={item.href}
                          onClick={() => {
                            triggerHapticFeedback('light');
                            setIsMenuOpen(false);
                          }}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </a>
                      );
                    })}
                  </div>
                </nav>

                {/* Additional Mobile Features */}
                <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        triggerHapticFeedback('light');
                        // Add to home screen
                        if ('serviceWorker' in navigator) {
                          // Trigger PWA install prompt
                          console.log('PWA install requested');
                        }
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <div className="w-5 h-5 bg-green-100 dark:bg-green-900/20 rounded flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 text-xs">📱</span>
                      </div>
                      <span className="font-medium">Add to Home Screen</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        triggerHapticFeedback('light');
                        // Share app
                        if (navigator.share) {
                          navigator.share({
                            title: 'BMV Finder',
                            text: 'Check out this property investment platform',
                            url: window.location.origin,
                          });
                        }
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/20 rounded flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 text-xs">📤</span>
                      </div>
                      <span className="font-medium">Share App</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Menu Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    BMV Finder v1.0.0
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Professional Property Investment Platform
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}