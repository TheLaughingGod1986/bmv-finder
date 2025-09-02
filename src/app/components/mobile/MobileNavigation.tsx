'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface MobileNavigationProps {
  user?: {
    name: string;
    role: string;
    profileImage?: string;
  };
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function MobileNavigation({ user, onLogin, onLogout }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/search', label: 'Search', icon: '🔍' },
    { href: '/portfolio', label: 'Portfolio', icon: '💼' },
    { href: '/analytics', label: 'Analytics', icon: '📊' },
    { href: '/watchlist', label: 'Watchlist', icon: '⭐' },
    { href: '/alerts', label: 'Alerts', icon: '🔔' }
  ];

  const userMenuItems = [
    { href: '/profile', label: 'Profile', icon: '👤' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
    { href: '/help', label: 'Help', icon: '❓' }
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
        isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <span className="text-lg font-bold text-gray-900">BMV Finder</span>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                {/* User avatar */}
                <button
                  onClick={toggleMenu}
                  className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
              </>
            ) : (
              <button
                onClick={onLogin}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Login
              </button>
            )}

            {/* Menu toggle */}
            <button
              onClick={toggleMenu}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className={`w-6 h-6 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMenu}
          />

          {/* Menu Panel */}
          <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user ? user.name.charAt(0).toUpperCase() : 'B'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {user ? user.name : 'BMV Finder'}
                    </div>
                    {user && (
                      <div className="text-sm text-gray-500 capitalize">
                        {user.role} Account
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeMenu}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto">
                <nav className="p-4">
                  <div className="space-y-1">
                    {navigationItems.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                          pathname === item.href
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </a>
                    ))}
                  </div>

                  {/* User Menu */}
                  {user && (
                    <>
                      <div className="border-t border-gray-200 my-4" />
                      <div className="space-y-1">
                        {userMenuItems.map((item) => (
                          <a
                            key={item.href}
                            href={item.href}
                            onClick={closeMenu}
                            className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                </nav>
              </div>

              {/* Menu Footer */}
              <div className="border-t border-gray-200 p-4">
                {user ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        onLogout?.();
                        closeMenu();
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span className="text-xl">🚪</span>
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        onLogin?.();
                        closeMenu();
                      }}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        // Handle sign up
                        closeMenu();
                      }}
                      className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation (for mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 md:hidden">
        <div className="flex items-center justify-around h-16">
          {navigationItems.slice(0, 5).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 px-2 py-1 transition-colors ${
                pathname === item.href
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Spacer for fixed header */}
      <div className="h-16" />
      
      {/* Spacer for bottom navigation */}
      <div className="h-16 md:hidden" />
    </>
  );
}
