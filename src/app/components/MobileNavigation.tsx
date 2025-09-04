'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  Search, 
  Heart, 
  BarChart3, 
  User, 
  Settings,
  Bell,
  Plus,
  TrendingUp,
  Calculator,
  FileText,
  HelpCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { mobileOptimizer } from '@/lib/mobile/mobileOptimizer';

interface MobileNavigationProps {
  className?: string;
}

export default function MobileNavigation({ className = '' }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBottomNav, setIsBottomNav] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Get device information
    const info = mobileOptimizer.getDeviceInfo();
    setDeviceInfo(info);
    
    // Use bottom navigation for mobile devices
    setIsBottomNav(info?.type === 'mobile');
  }, []);

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'search', label: 'Search', icon: Search, path: '/search/properties' },
    { id: 'watchlist', label: 'Watchlist', icon: Heart, path: '/watchlist' },
    { id: 'portfolio', label: 'Portfolio', icon: BarChart3, path: '/tools/portfolio' },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp, path: '/market/analysis' },
    { id: 'calculator', label: 'Calculator', icon: Calculator, path: '/tools/calculator' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    { id: 'help', label: 'Help', icon: HelpCircle, path: '/help' },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right' && !isOpen) {
      setIsOpen(true);
    } else if (direction === 'left' && isOpen) {
      setIsOpen(false);
    }
  };

  // Bottom Navigation Component
  const BottomNavigation = () => (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
    >
      <div className="flex items-center justify-around py-2">
        {navigationItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors hover:bg-gray-100 active:bg-gray-200"
          >
            <item.icon className="w-6 h-6 text-gray-600" />
            <span className="text-xs text-gray-600 mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );

  // Side Navigation Component
  const SideNavigation = () => (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Side Menu */}
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">BMV Finder</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="p-4 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <item.icon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Device Info */}
            {deviceInfo && (
              <div className="p-4 border-t border-gray-200 mt-auto">
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Device: {deviceInfo.type}</div>
                  <div>OS: {deviceInfo.os}</div>
                  <div>Browser: {deviceInfo.browser}</div>
                  <div>Touch: {deviceInfo.capabilities.touch ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Top Navigation Component
  const TopNavigation = () => (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>
      
      <h1 className="text-lg font-semibold text-gray-900">BMV Finder</h1>
      
      <div className="flex items-center space-x-2">
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={className}>
      {/* Top Navigation */}
      <TopNavigation />
      
      {/* Side Navigation */}
      <SideNavigation />
      
      {/* Bottom Navigation */}
      {isBottomNav && <BottomNavigation />}
      
      {/* Add bottom padding for bottom navigation */}
      {isBottomNav && <div className="h-20" />}
    </div>
  );
}