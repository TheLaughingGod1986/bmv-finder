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
    { name: 'Property Discovery', href: '/portfolio/discover', icon: Search, tourId: 'search-link' },
    { name: 'Watchlist', href: '/watchlist', icon: Star, tourId: 'watchlist' },
    { name: 'Portfolio', href: '/tools/portfolio', icon: Building2, tourId: 'portfolio-link' },
    { name: 'Deal Analysis', href: '/analysis/deal-analysis', icon: BarChart3, tourId: 'deal-analysis' },
    { name: 'Market Trends', href: '/analysis/market-trends', icon: TrendingUp, tourId: 'market-analysis' },
  ];

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  BMV Finder
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      data-tour={item.tourId}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-blue-500 text-gray-900 dark:text-white'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <Link
                    href="/onboarding"
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    data-tour="onboarding-link"
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    Learn
                  </Link>
                  <ThemeToggle />
                  {currentUser ? (
                    <>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Welcome, {currentUser.name}
                        {isRealAuth && <span className="ml-1 text-xs text-green-600 dark:text-green-400">●</span>}
                      </span>
                      <Link
                        href="/account"
                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <User className="h-4 w-4 mr-1" />
                        Account
                      </Link>
                      <button 
                        onClick={() => isRealAuth ? hybridAuth.signOut() : logout()}
                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Welcome, Guest</span>
                      <button 
                        onClick={() => setIsAuthModalOpen(true)}
                        className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Sign In
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
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

                    {/* Mobile menu */}
            {isMobileMenuOpen && (
              <div className="sm:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    data-tour={item.tourId}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
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
                               <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                     {currentUser ? (
                       <>
                         <div className="flex items-center px-4">
                           <div className="flex-shrink-0">
                             <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                               <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{currentUser.name.charAt(0).toUpperCase()}</span>
                             </div>
                           </div>
                           <div className="ml-3">
                             <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                               Welcome, {currentUser.name}
                               {isRealAuth && <span className="ml-1 text-xs text-green-600 dark:text-green-400">●</span>}
                             </div>
                             <div className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</div>
                           </div>
                         </div>
                         <div className="mt-3 px-2 space-y-1">
                           <Link
                             href="/account"
                             onClick={() => setIsMobileMenuOpen(false)}
                             className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                           >
                             <User className="h-4 w-4 mr-2" />
                             Account
                           </Link>
                           <button
                             onClick={() => {
                               setIsMobileMenuOpen(false);
                               isRealAuth ? hybridAuth.signOut() : logout();
                             }}
                             className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                           >
                             <LogOut className="h-4 w-4 mr-2" />
                             Sign Out
                           </button>
                         </div>
                       </>
                     ) : (
                       <>
                         <div className="flex items-center px-4">
                           <div className="flex-shrink-0">
                             <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                               <span className="text-sm font-medium text-gray-700 dark:text-gray-300">G</span>
                             </div>
                           </div>
                           <div className="ml-3">
                             <div className="text-base font-medium text-gray-800 dark:text-gray-200">Welcome, Guest</div>
                           </div>
                         </div>
                         <div className="mt-3 px-2 space-y-1">
                           <button
                             onClick={() => {
                               setIsMobileMenuOpen(false);
                               setIsAuthModalOpen(true);
                             }}
                             className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                           >
                             Sign In
                           </button>
                         </div>
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