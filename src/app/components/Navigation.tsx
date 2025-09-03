'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, TrendingUp, Search, BarChart3, Star, Menu, X, User, LogOut, BookOpen } from 'lucide-react';
import AuthModal from './AuthModal';
import EnhancedAuthModal from './EnhancedAuthModal';
import { useMockAuth } from './MockAuthProvider';
import { useHybridAuth } from '@/lib/auth/hybridAuth';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  const pathname = usePathname();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useMockAuth();
  const hybridAuth = useHybridAuth();
  
  // Use hybrid auth user if available, otherwise fall back to mock auth
  const currentUser = hybridAuth.user || user;
  const isRealAuth = hybridAuth.isRealAuth;

  const navigation = [
    { name: 'Home', href: '/', icon: Home, tourId: 'home-link' },
    { name: 'Search', href: '/search/properties', icon: Search, tourId: 'search-link' },
    { name: 'Watchlist', href: '/watchlist', icon: Star, tourId: 'watchlist' },
    { name: 'Portfolio', href: '/tools/portfolio', icon: Building2, tourId: 'portfolio-link' },
    { name: 'Analysis', href: '/analysis/deal-analysis', icon: BarChart3, tourId: 'deal-analysis' },
    { name: 'Trends', href: '/market/analysis', icon: TrendingUp, tourId: 'market-analysis' },
    { name: 'Learn', href: '/onboarding', icon: BookOpen, tourId: 'onboarding-link' },
  ];

  return (
    <>
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-2xl font-bold text-gradient hover:scale-105 transition-transform duration-200">
                  BMV Finder
                </Link>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      data-tour={item.tourId}
                      className={`inline-flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="whitespace-nowrap">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-3">
                  <ThemeToggle />
                  {currentUser ? (
                    <>
                      <div className="flex items-center px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center mr-2">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {currentUser.name}
                          {isRealAuth && <span className="ml-1 text-xs text-green-600 dark:text-green-400">●</span>}
                        </span>
                      </div>
                      <Link
                        href="/account"
                        className="flex items-center px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Account
                      </Link>
                      <button 
                        onClick={() => isRealAuth ? hybridAuth.signOut() : logout()}
                        className="flex items-center px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-2">
                          <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Guest</span>
                      </div>
                      <button 
                        onClick={() => setIsAuthModalOpen(true)}
                        className="btn-primary"
                      >
                        Sign In
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 hover:scale-105"
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

                    {/* Enhanced Mobile menu */}
            {isMobileMenuOpen && (
              <div className="sm:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <div className="pt-4 pb-6 space-y-2 px-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    data-tour={item.tourId}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </div>
                               <div className="pt-4 pb-6 border-t border-gray-200/50 dark:border-gray-700/50 px-4">
                     {currentUser ? (
                       <>
                         <div className="flex items-center px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 mb-4">
                           <div className="flex-shrink-0">
                             <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
                               <span className="text-lg font-bold text-white">{currentUser.name.charAt(0).toUpperCase()}</span>
                             </div>
                           </div>
                           <div className="ml-4">
                             <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                               {currentUser.name}
                               {isRealAuth && <span className="ml-2 text-sm text-green-600 dark:text-green-400">●</span>}
                             </div>
                             <div className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</div>
                           </div>
                         </div>
                         <div className="space-y-2">
                           <Link
                             href="/account"
                             onClick={() => setIsMobileMenuOpen(false)}
                             className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                           >
                             <User className="h-5 w-5 mr-3" />
                             Account
                           </Link>
                           <button
                             onClick={() => {
                               setIsMobileMenuOpen(false);
                               isRealAuth ? hybridAuth.signOut() : logout();
                             }}
                             className="flex items-center w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                           >
                             <LogOut className="h-5 w-5 mr-3" />
                             Sign Out
                           </button>
                         </div>
                       </>
                     ) : (
                       <>
                         <div className="flex items-center px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 mb-4">
                           <div className="flex-shrink-0">
                             <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                               <span className="text-lg font-bold text-gray-700 dark:text-gray-300">G</span>
                             </div>
                           </div>
                           <div className="ml-4">
                             <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Welcome, Guest</div>
                           </div>
                         </div>
                         <button
                           onClick={() => {
                             setIsMobileMenuOpen(false);
                             setIsAuthModalOpen(true);
                           }}
                           className="w-full btn-primary"
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
      <EnhancedAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode="login"
      />
    </>
  );
}