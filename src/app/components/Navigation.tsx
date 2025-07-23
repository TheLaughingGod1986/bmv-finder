'use client';

import { useState, useEffect } from 'react';
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
  Map,
  TrendingUp,
  Target,
  Home,
  PieChart,
  FileText,
  DollarSign,
  Star,
  ArrowRight,
  Users
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

const navItems = [
  { name: 'Search', href: '/', icon: Search, description: 'Find property sales' },
  { name: 'Deal Analysis', href: '/advanced-deal-analysis', icon: Target, description: 'BMV & investment' },
  { name: 'Market Trends', href: '/market-analysis', icon: BarChart3, description: 'Regional insights' },
  { name: 'HPI Dashboard', href: '/hpi-dashboard', icon: TrendingUp, description: 'Price trends' },
  { name: 'Valuation', href: '/what-should-i-pay', icon: PoundSterling, description: 'What to pay' },
  { name: 'Calculator', href: '/deal-calculator', icon: Calculator, description: 'ROI & yields' },
  { name: 'Portfolio', href: '/portfolio-tracker', icon: PieChart, description: 'Track investments' }
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
    fetch('/api/last-update')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setStats({
            ...data,
            propertiesCount: 22867734,
            recentSalesCount: 50005,
            hpiCount: 216854
          });
        }
      })
      .catch(err => {
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
      <nav className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group touch-target" aria-label="UK Property Insights Home">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 tracking-tight">
                  UK Property Insights
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  Trusted by 50,000+ professionals
                </span>
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
                      'flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-sm font-medium',
                      isActive(item.href) 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                        : 'text-gray-700 hover:text-gray-900'
                    )}
                    aria-label={item.name}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* CTA Buttons */}
              <div className="flex items-center gap-3 ml-6">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm"
                >
                  View Pricing
                  <ArrowRight className="w-4 h-4" />
                </Link>
                
                {user ? (
                  <Link
                    href="/account"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-all duration-200 text-sm"
                  >
                    <Users className="w-4 h-4" />
                    Account
                    {tier && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">
                        {tier}
                      </span>
                    )}
                  </Link>
                ) : (
                  <Link
                    href="/account"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200 text-sm"
                  >
                    Login / Register
                  </Link>
                )}
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-gray-900 rounded-lg transition-colors touch-target"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
                  <line x1="4" y1="12" x2="20" y2="12"/>
                  <line x1="4" y1="6" x2="20" y2="6"/>
                  <line x1="4" y1="18" x2="20" y2="18"/>
                </svg>
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
              className="lg:hidden overflow-hidden border-t border-gray-200 bg-white shadow-lg"
            >
              <div className="px-4 py-6 flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors touch-target',
                        isActive(item.href) 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                          : 'text-gray-700'
                      )}
                      aria-label={item.name}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-base font-medium">{item.name}</span>
                        <span className={cn(
                          "text-sm",
                          isActive(item.href) ? "text-blue-100" : "text-gray-500"
                        )}>{item.description}</span>
                      </div>
                    </Link>
                  );
                })}
                
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Link
                    href="/pricing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg px-6 py-4 shadow-lg transition-all duration-200 text-center touch-target"
                  >
                    View Pricing
                  </Link>
                  
                  {user ? (
                    <Link
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg px-6 py-4 transition-all duration-200 text-center flex items-center justify-center gap-3 touch-target"
                    >
                      <Users className="w-4 h-4" />
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
                      className="block w-full bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200 text-center touch-target"
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
      <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 text-gray-700 text-sm py-3 px-4 flex flex-col md:flex-row md:items-center md:justify-center gap-2 border-b border-gray-200">
        {error && <span className="text-red-600">Data update status unavailable: {error}</span>}
        {!stats && !error && <span>Loading data update status...</span>}
        {stats && (
          <>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Last update: <b>{formattedDate}</b>
            </span>
            <span className="hidden md:inline mx-2">|</span>
            <span>Properties: <b>{stats.propertiesCount.toLocaleString()}</b></span>
            <span className="hidden md:inline mx-2">|</span>
            <span>Recent Sales: <b>{stats.recentSalesCount.toLocaleString()}</b></span>
            <span className="hidden md:inline mx-2">|</span>
            <span>HPI Records: <b>{stats.hpiCount.toLocaleString()}</b></span>
          </>
        )}
      </div>
    </>
  );
} 