'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Calculator, 
  Menu, 
  X, 
  Search, 
  BarChart3, 
  MapPin, 
  Download,
  HelpCircle,
  Building2,
  PoundSterling
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    // {
    //   name: 'Home',
    //   href: '/',
    //   icon: Home,
    //   description: 'Search property prices and BMV scores'
    // },
    {
      name: 'Past Sales Search',
      href: '/',
      icon: Search,
      description: 'Find and research past sold house data and prices from the Land Registry'
    },
    {
      name: 'What Should I Pay?',
      href: '/what-should-i-pay',
      icon: PoundSterling,
      description: 'Get smart offer suggestions'
    },
    {
      name: 'Tools',
      href: '/deal-calculator',
      icon: Calculator,
      description: 'Investment calculators and analysis'
    },
    {
      name: 'Portfolio',
      href: '/portfolio-tracker',
      icon: BarChart3,
      description: 'Track your property investments'
    },
    {
      name: 'Export',
      href: '/saved-searches',
      icon: Download,
      description: 'Export data and reports'
    },
    {
      name: 'FAQ',
      href: '/test',
      icon: HelpCircle,
      description: 'Help and documentation'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-soft sticky top-0 z-sticky">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-soft group-hover:shadow-medium transition-shadow">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-text-primary tracking-tight">BMV Finder</span>
              <span className="text-xs text-text-secondary">Property Investment Tool</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-text-primary hover:bg-gray-100 hover:text-primary-600 transition-colors",
                    isActive(item.href) && "bg-primary-500 text-white hover:bg-primary-600"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-text-primary hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="lg:hidden overflow-hidden border-t border-gray-200 bg-white"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-text-primary hover:bg-gray-100 hover:text-primary-600 transition-colors",
                      isActive(item.href) && "bg-primary-500 text-white hover:bg-primary-600"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-text-tertiary">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
} 