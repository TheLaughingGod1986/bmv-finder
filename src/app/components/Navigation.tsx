'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BarChart3,
  PoundSterling,
  Calculator,
  Building2,
  X,
  Map
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUser } from '@supabase/auth-helpers-react';
import { useUserTier } from '@/hooks/useUserTier';

interface UpdateStats {
  lastUpdate: string;
  propertiesCount: number;
  recentSalesCount: number;
  hpiCount: number;
}

const minimalistNavItems = [
  { name: 'Past Sales Search', href: '/', icon: Search },
  { name: 'HPI Search', href: '/hpi-search', icon: BarChart3 },
  { name: 'HPI Dashboard', href: '/hpi-dashboard', icon: BarChart3 },
  { name: 'What Should I Pay?', href: '/what-should-i-pay', icon: PoundSterling },
  { name: 'Deal Calculator', href: '/deal-calculator', icon: Calculator },
  { name: 'Portfolio Tracker', href: '/portfolio-tracker', icon: BarChart3 },
  { name: 'Project Roadmap', href: '/roadmap', icon: Map }
];

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<UpdateStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formattedDate, setFormattedDate] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const user = useUser();
  const { tier } = useUserTier(user?.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log('Fetching update stats...');
    fetch('/api/last-update')
      .then(res => {
        console.log('Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Update stats received:', data);
        if (data.error) {
          console.error('API error:', data.error);
          setError(data.error);
        } else {
          setStats(data);
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(err.message);
      });
  }, []);

  useEffect(() => {
    if (stats?.lastUpdate) {
      setFormattedDate(new Date(stats.lastUpdate).toLocaleString());
    }
  }, [stats?.lastUpdate]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted || isMobile === null) {
    return null;
  }

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav className="bg-white sticky top-0 z-sticky shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-12">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group touch-target" aria-label="UK Property Insights Home">
              <div className="w-8 h-8 sm:w-8 sm:h-8 bg-gradient-primary rounded flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary tracking-tight">
                UK Property{mounted && isMobile ? '' : ' Insights'}
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              {minimalistNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex flex-col items-center justify-center px-3 py-2 rounded-md hover:bg-gray-50 transition-colors touch-target',
                      isActive(item.href) && 'bg-primary-500 text-white'
                    )}
                    aria-label={item.name}
                  >
                    <Icon className="w-5 h-5 mb-0.5" />
                    <span className="sr-only">{item.name}</span>
                  </Link>
                );
              })}
              <Link
                href="/pricing"
                className="ml-4 bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-full px-5 py-2 shadow transition text-sm touch-target"
              >
                See Packages
              </Link>
              {user ? (
                <>
                  <Link
                    href="/account"
                    className="ml-2 bg-gray-100 hover:bg-gray-200 text-primary-700 font-semibold rounded-full px-5 py-2 shadow transition text-sm flex items-center gap-2 touch-target"
                  >
                    Account
                    {tier && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">
                        {tier}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                <Link
                  href="/account"
                  className="ml-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-full px-5 py-2 shadow transition text-sm touch-target"
                >
                  Login / Register
                </Link>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-3 text-text-primary hover:text-primary-600 rounded-lg transition-colors touch-target"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
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
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="lg:hidden overflow-hidden border-t border-gray-100 bg-white shadow-lg"
            >
              <div className="px-4 py-6 flex flex-col gap-3">
                {minimalistNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-4 px-4 py-4 rounded-lg hover:bg-gray-50 transition-colors touch-target',
                        isActive(item.href) && 'bg-primary-500 text-white'
                      )}
                      aria-label={item.name}
                    >
                      <Icon className="w-6 h-6 flex-shrink-0" />
                      <span className="text-base font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <Link
                    href="/pricing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-lg px-6 py-4 shadow transition text-base text-center touch-target"
                  >
                    See Packages
                  </Link>
                  {user ? (
                    <Link
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full bg-gray-100 hover:bg-gray-200 text-primary-700 font-semibold rounded-lg px-6 py-4 shadow transition text-base text-center flex items-center justify-center gap-3 touch-target"
                    >
                      <span>Account</span>
                      {tier && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">
                          {tier}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <Link
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg px-6 py-4 shadow transition text-base text-center touch-target"
                    >
                      Login / Register
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      
      {/* Data Update Status Bar */}
      <div className="w-full bg-[#E5E5E5] text-[#2C6E91] text-sm py-2 px-4 flex flex-col md:flex-row md:items-center md:justify-center gap-2 border-b border-[#D2B48C]">
        {error && <span>Data update status unavailable: {error}</span>}
        {!stats && !error && <span>Loading data update status...</span>}
        {stats && (
          <>
            <span>Last data update: <b>{formattedDate}</b></span>
            <span className="mx-2">|</span>
            <span>Properties: <b>{stats.propertiesCount.toLocaleString()}</b></span>
            <span className="mx-2">|</span>
            <span>Recent Sales: <b>{stats.recentSalesCount.toLocaleString()}</b></span>
            <span className="mx-2">|</span>
            <span>HPI Records: <b>{stats.hpiCount.toLocaleString()}</b></span>
          </>
        )}
      </div>
    </>
  );
} 