'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Calculator, Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      description: 'Search property prices and BMV scores'
    },
    {
      name: 'Deal Calculator',
      href: '/deal-calculator',
      icon: Calculator,
      description: 'Calculate investment returns and cash flow'
    },
    {
      name: 'My Property',
      href: '/my-property',
      icon: Home,
      description: 'View and manage your saved properties'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              BMV Finder
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "text-slate-600 hover:text-blue-600 hover:bg-slate-100 border border-transparent"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={{ height: isMobileMenuOpen ? 'auto' : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 space-y-2 border-t border-slate-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "text-slate-600 hover:text-blue-600 hover:bg-slate-100 border border-transparent"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </nav>
  );
} 