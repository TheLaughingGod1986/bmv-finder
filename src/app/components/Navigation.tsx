'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  Users,
  Menu
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUser, useSession } from '@supabase/auth-helpers-react';
import { useUserTier } from '@/hooks/useUserTier';
import AuthModal from './AuthModal';

interface UpdateStats {
  lastUpdate: string;
  propertiesCount: number;
  recentSalesCount: number;
  hpiCount: number;
}

const navItems = [
  { name: 'Deal Analysis', href: '/advanced-deal-analysis', icon: Target, description: 'BMV & investment' },
  { name: 'Deal Calculator', href: '/deal-calculator', icon: Calculator, description: 'ROI & yield' },
  { name: 'Market Trends', href: '/market-analysis', icon: BarChart3, description: 'Regional insights' },
  { name: 'HPI Dashboard', href: '/hpi-dashboard', icon: TrendingUp, description: 'Price trends' },
  { name: 'Valuation', href: '/what-should-i-pay', icon: PoundSterling, description: 'What to pay' },
  { name: 'Watchlist', href: '/watchlist', icon: Eye, description: 'Saved properties' },
  { name: 'Portfolio', href: '/portfolio-tracker', icon: PieChart, description: 'Track investments' }
];

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [stats, setStats] = useState<UpdateStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formattedDate, setFormattedDate] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const user = useUser();
  const session = useSession();
  const { tier } = useUserTier(user?.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug user authentication state (commented out for production)
  // useEffect(() => {
  //   if (mounted) {
  //     console.log('Navigation: User auth state:', { 
  //       user: !!user, 
  //       userId: user?.id, 
  //       session: !!session,
  //       sessionUser: session?.user?.id,
  //       tier 
  //     });
  //   }
  // }, [user, session, tier, mounted]);



  useEffect(() => {
    // Check if we already have cached data and it's less than 5 minutes old
    if (typeof window === 'undefined') return; // SSR safety check
    
    const cachedData = sessionStorage.getItem('last-update-data');
    const cachedTime = sessionStorage.getItem('last-update-time');
    
    if (cachedData && cachedTime) {
      const timeDiff = Date.now() - parseInt(cachedTime);
      if (timeDiff < 5 * 60 * 1000) { // 5 minutes
        try {
          setStats(JSON.parse(cachedData));
          return;
        } catch (e) {
          // If parsing fails, continue with fresh fetch
        }
      }
    }

    // Only fetch if we don't have recent cached data
    fetch('/api/last-update')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setStats(data);
          // Cache the data for 5 minutes
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('last-update-data', JSON.stringify(data));
            sessionStorage.setItem('last-update-time', Date.now().toString());
          }
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
      <nav className="bg-white/98 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[auto_1fr_auto] items-center h-20 gap-4">
            {/* Logo - Left */}
            <div className="flex justify-start">
              <Link href="/" className="flex items-center gap-3 group touch-target" aria-label="Home">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </Link>
            </div>
            
            {/* Desktop Navigation - Center */}
            <div className="hidden lg:flex items-center justify-center gap-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-300 text-sm font-medium',
                      isActive(item.href) 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:shadow-sm'
                    )}
                    aria-label={item.name}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
              
            {/* CTA Buttons - Right */}
            <div className="flex items-center justify-end gap-3">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-0.5 transition-all duration-300 text-sm h-10"
              >
                View Pricing
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              {(user || session || pathname === '/account') ? (
                <Link
                  href="/account"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg hover:bg-emerald-700 transform hover:-translate-y-0.5 transition-all duration-300 text-sm h-10"
                >
                  <Users className="w-4 h-4" />
                  Account
                  {tier && (
                    <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 uppercase tracking-wide">
                      {tier}
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  data-testid="account-button"
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-all duration-300 text-sm h-10"
                >
                  Login / Register
                </button>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 touch-target"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
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
              className="lg:hidden overflow-hidden border-t border-gray-100 bg-white/95 backdrop-blur-sm shadow-lg"
            >
              <div className="px-4 py-4 flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 touch-target',
                        isActive(item.href) 
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200' 
                          : 'text-gray-600'
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
                  
                  {(user || session || pathname === '/account') ? (
                    <Link
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg px-6 py-4 transition-all duration-200 text-center flex items-center justify-center gap-3 touch-target"
                    >
                      <Users className="w-5 h-5" />
                      <span>Account</span>
                      {tier && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">
                          {tier}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <button
                      data-testid="account-button-mobile"
                      onClick={() => {
                        setAuthMode('login');
                        setIsAuthModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200 text-center touch-target"
                    >
                      Login / Register
                    </button>
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
} 