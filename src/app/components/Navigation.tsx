'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, TrendingUp, Search, BarChart3, Star, Menu, X, User, LogOut, BookOpen, Settings, Sparkles } from 'lucide-react';
import AuthModal from './AuthModal';
import EnhancedAuthModal from './EnhancedAuthModal';
import ProductionAuthModal from './ProductionAuthModal';
import { useMockAuth } from './MockAuthProvider';
import { useHybridAuth } from '@/lib/auth/hybridAuth';
import { useProductionAuth } from '@/lib/auth/productionAuthProvider';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  const pathname = usePathname();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useMockAuth();
  const hybridAuth = useHybridAuth();
  const productionAuth = useProductionAuth();
  
  // Use production auth if available, otherwise fall back to hybrid/mock auth
  const currentUser = productionAuth.user || hybridAuth.user || user;
  const isRealAuth = productionAuth.isAuthenticated || hybridAuth.isRealAuth;

  const navigation = [
    { name: 'Home', href: '/', icon: Home, tourId: 'home-link', description: 'Dashboard' },
    { name: 'Property Discovery', href: '/search/properties', icon: Search, tourId: 'search-link', description: 'Find Properties' },
    { name: 'Watchlist', href: '/watchlist', icon: Star, tourId: 'watchlist', description: 'Saved Properties' },
    { name: 'Portfolio', href: '/tools/portfolio', icon: Building2, tourId: 'portfolio-link', description: 'My Portfolio' },
    { name: 'Deal Analysis', href: '/analysis/deal-analysis', icon: BarChart3, tourId: 'deal-analysis', description: 'Investment Analysis' },
    { name: 'Market Trends', href: '/market/analysis', icon: TrendingUp, tourId: 'market-analysis', description: 'Market Intelligence' },
    { name: 'Learn', href: '/onboarding', icon: BookOpen, tourId: 'onboarding-link', description: 'Resources' },
  ];

  return (
    <>
      <nav className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl shadow-sm border-b border-gray-100/80 dark:border-gray-800/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="group flex items-center space-x-3 hover:scale-105 transition-all duration-300">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                      BMV Finder
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">
                      Property Intelligence
                    </span>
                  </div>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:ml-12 lg:flex lg:space-x-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      data-tour={item.tourId}
                      className={`group relative flex flex-col items-center px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 hover:scale-105 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <item.icon className={`h-4 w-4 flex-shrink-0 transition-colors duration-200 ${
                          isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                        }`} />
                        <span className="whitespace-nowrap font-semibold">{item.name}</span>
                      </div>
                      {!isActive && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {item.description}
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* User Section */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <ThemeToggle />
                  {currentUser ? (
                    <>
                      {/* User Profile Card */}
                      <div className="flex items-center px-4 py-2.5 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700/50 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          {isRealAuth && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                          )}
                        </div>
                        <div className="ml-3 flex flex-col">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                            {currentUser.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
                            {isRealAuth ? 'Verified User' : 'Demo User'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <Link
                          href="/profile"
                          className="flex items-center px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 hover:scale-105"
                        >
                          <User className="h-4 w-4 mr-1.5" />
                          Profile
                        </Link>
                        <Link
                          href="/account"
                          className="flex items-center px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 hover:scale-105"
                        >
                          <Settings className="h-4 w-4 mr-1.5" />
                          Account
                        </Link>
                        <button 
                          onClick={() => isRealAuth ? hybridAuth.signOut() : logout()}
                          className="flex items-center px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-105"
                        >
                          <LogOut className="h-4 w-4 mr-1.5" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Guest User Card */}
                      <div className="flex items-center px-4 py-2.5 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700/50 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center shadow-md">
                          <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="ml-3 flex flex-col">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                            Welcome, Guest
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
                            Sign in to save progress
                          </span>
                        </div>
                      </div>
                      
                      {/* Sign In Button */}
                      <button 
                        onClick={() => setIsAuthModalOpen(true)}
                        className="group relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
                      >
                        <span className="relative z-10">Sign In</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-3 rounded-2xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-300/50 transition-all duration-200 hover:scale-105"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl border-t border-gray-100/80 dark:border-gray-800/80 shadow-lg">
            <div className="pt-6 pb-8 space-y-3 px-6">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    data-tour={item.tourId}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group block px-5 py-4 rounded-2xl text-base font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <item.icon className={`h-5 w-5 mr-4 transition-colors duration-200 ${
                          isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                        }`} />
                        <div className="flex flex-col">
                          <span className="font-semibold">{item.name}</span>
                          {!isActive && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            {/* Mobile User Section */}
            <div className="pt-6 pb-8 border-t border-gray-100/80 dark:border-gray-800/80 px-6">
              {currentUser ? (
                <>
                  {/* User Profile Card */}
                  <div className="flex items-center px-5 py-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700/50 border border-gray-200/50 dark:border-gray-700/50 mb-6">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                        <span className="text-xl font-bold text-white">{currentUser.name.charAt(0).toUpperCase()}</span>
                      </div>
                      {isRealAuth && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                        {currentUser.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {isRealAuth ? 'Verified User' : 'Demo User'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center px-5 py-4 rounded-2xl text-base font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                    >
                      <User className="h-5 w-5 mr-4" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Profile</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Manage your profile</span>
                      </div>
                    </Link>
                    <Link
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center px-5 py-4 rounded-2xl text-base font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                    >
                      <Settings className="h-5 w-5 mr-4" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Account</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Account settings</span>
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        isRealAuth ? hybridAuth.signOut() : logout();
                      }}
                      className="flex items-center w-full text-left px-5 py-4 rounded-2xl text-base font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                    >
                      <LogOut className="h-5 w-5 mr-4" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Sign Out</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">End your session</span>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Guest User Card */}
                  <div className="flex items-center px-5 py-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700/50 border border-gray-200/50 dark:border-gray-700/50 mb-6">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center shadow-md">
                      <span className="text-xl font-bold text-gray-700 dark:text-gray-300">G</span>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                        Welcome, Guest
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Sign in to save progress
                      </div>
                    </div>
                  </div>
                  
                  {/* Sign In Button */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      
      {/* Auth Modal */}
      <ProductionAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode="login"
      />
    </>
  );
}