'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Home, TrendingUp, PoundSterling, Calendar, Plus, Filter, BarChart3, Target, MapPin, Trash2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import UserProfile from '../components/UserProfile';
import PortfolioAnalytics from '../components/PortfolioAnalytics';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../components/ToastProvider';

interface PortfolioProperty {
  id: string;
  address: string;
  postcode: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  propertyType: string;
  bmvScore: number;
  notes?: string;
  status: 'active' | 'sold' | 'watching';
}

export default function PortfolioTrackerPage() {
  const { showToast } = useToast();
  
  // Restore session after OAuth redirect (handle hash tokens) with debug logging
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token })
          .then(({ data, error }) => {
            // Session set
          });
        window.location.hash = '';
      }
    }
    supabase.auth.getSession().then(({ data }) => {
      // Session retrieved
    });
  }, []);

  // All hooks at the top
  const [user, setUser] = useState<any>(null);
  const [portfolioProperties, setPortfolioProperties] = useState<PortfolioProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'sold' | 'watching'>('all');
  const [dataError, setDataError] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initializeAuth = async () => {
      // Check for tokens in URL (OAuth callback)
      const urlParams = new URLSearchParams(window.location.search);
      const access_token = urlParams.get('access_token');
      const refresh_token = urlParams.get('refresh_token');
      
      if (access_token && refresh_token) {
        if (access_token && refresh_token) {
          supabase.auth.setSession({ access_token, refresh_token })
            .then(({ data, error }) => {
              if (error) {
                // Handle error silently
              }
            })
            .catch(err => {
              // Handle error silently
            });
        }
      }
      
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setUser(data.session.user);
        }
      });
    };

    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    initializeAuth();
    getUser();
  }, [supabase]);

  // Load portfolio data from Supabase
  const loadPortfolioData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsDataLoading(true);
    setDataError(null);

    try {
      // Loading portfolio data for user
      
      // Fetch portfolio properties from Supabase
      const { data: properties, error } = await supabase
        .from('portfolio_properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading portfolio data:', error);
        setDataError('Failed to load portfolio data. Please try again.');
        setPortfolioProperties([]);
      } else {
        // Loaded portfolio properties
        setPortfolioProperties(properties || []);
        setDataError(null);
      }
    } catch (error) {
      console.error('Error in loadPortfolioData:', error);
      setDataError('An unexpected error occurred while loading your portfolio.');
      setPortfolioProperties([]);
    } finally {
      setIsDataLoading(false);
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadPortfolioData();
  }, [loadPortfolioData]);

  // Memoized calculations
  const filteredProperties = useMemo(() => {
    if (filterStatus === 'all') return portfolioProperties;
    return portfolioProperties.filter(property => property.status === filterStatus);
  }, [portfolioProperties, filterStatus]);

  const portfolioStats = useMemo(() => {
    const totalProperties = portfolioProperties.length;
    const totalValue = portfolioProperties.reduce((sum, p) => sum + p.currentValue, 0);
    const totalGrowth = portfolioProperties.reduce((sum, p) => sum + (p.currentValue - p.purchasePrice), 0);
    return { totalProperties, totalValue, totalGrowth };
  }, [portfolioProperties]);

  // Memoized event handlers
  const handleAddProperty = useCallback(() => {
    // Add new property
  }, []);

  const handleExport = useCallback(() => {
    // Export portfolio
  }, []);

  const handleFilterChange = useCallback((status: 'all' | 'active' | 'sold' | 'watching') => {
    setFilterStatus(status);
  }, []);

  const handleRemoveProperty = useCallback((id: string, address: string) => {
    if (window.confirm(`Are you sure you want to remove "${address}" from your portfolio? This action cannot be undone.`)) {
      setPortfolioProperties(prev => prev.filter(property => property.id !== id));
              // Removed property from portfolio
    }
  }, []);

  const handleSoldProperty = useCallback((id: string, address: string) => {
    const salePrice = prompt(`Enter the sale price for "${address}":`);
    if (salePrice && !isNaN(Number(salePrice))) {
      setPortfolioProperties(prev => prev.map(property => 
        property.id === id 
          ? { ...property, status: 'sold', currentValue: Number(salePrice) }
          : property
      ));
      // Property marked as sold
    } else if (salePrice !== null) {
      showToast({ type: 'error', title: 'Please enter a valid sale price.' });
    }
  }, []);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {[1, 2, 3].map((index) => (
        <div key={index} className="bg-white/90 rounded-2xl p-6 shadow-lg border border-slate-200 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-slate-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-slate-100 rounded-lg p-3">
                    <div className="h-3 bg-slate-200 rounded mb-2 w-1/2"></div>
                    <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-6">
              <div className="h-10 bg-slate-200 rounded-lg w-28"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateGrowth = (current: number, purchase: number) => {
    if (purchase === 0) return 0;
    return ((current - purchase) / purchase) * 100;
  };

  const getTotalValue = () => {
    return portfolioProperties
      .filter(p => p.status === 'active')
      .reduce((sum, p) => sum + p.currentValue, 0);
  };

  const getTotalGrowth = () => {
    const activeProperties = portfolioProperties.filter(p => p.status === 'active' && p.purchasePrice > 0);
    if (activeProperties.length === 0) return 0;
    
    const totalPurchase = activeProperties.reduce((sum, p) => sum + p.purchasePrice, 0);
    const totalCurrent = activeProperties.reduce((sum, p) => sum + p.currentValue, 0);
    
    return ((totalCurrent - totalPurchase) / totalPurchase) * 100;
  };

  const getBMVScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 65) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    if (score >= 35) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'sold': return 'text-blue-600 bg-blue-100';
      case 'watching': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Don't render the component if we're on the server side
  if (!mounted) return null;
  if (!supabase) {
    return null;
  }

  // Show loading skeleton while data is being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 font-sans">
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Standardized Header */}
          <div className="text-center mb-10 max-w-3xl mx-auto pt-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-blue-600" />
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-0" id="page-title">Portfolio Tracker</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4" id="page-description">
              Track your property investments, monitor growth, and manage your BMV portfolio in one place.
            </p>
          </div>

          <UserProfile />

          <div className="mt-6">
            {/* Loading skeleton for portfolio content */}
            <LoadingSkeleton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Portfolio Tracker | BMV Finder - Monitor Your Property Investments</title>
        <meta name="description" content="Track your property investment portfolio, monitor growth, and analyze returns. Get insights into your property investments with BMV Finder's comprehensive portfolio tracking tools." />
        <meta name="keywords" content="property portfolio tracker, investment tracking, property growth, BMV finder, UK property investments, portfolio management" />
        <meta property="og:title" content="Portfolio Tracker | BMV Finder" />
        <meta property="og:description" content="Track your property investment portfolio and monitor growth with BMV Finder." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bmvfinder.com/portfolio-tracker" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Portfolio Tracker | BMV Finder" />
        <meta name="twitter:description" content="Track your property investment portfolio and monitor growth." />
        <link rel="canonical" href="https://bmvfinder.com/portfolio-tracker" />
      </Head>
      <div className="min-h-screen bg-neutral-100 font-sans">
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Standardized Header */}
          <div className="text-center mb-10 max-w-3xl mx-auto pt-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-blue-600" />
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-0" id="page-title">Portfolio Tracker</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4" id="page-description">
              Track your property investments, monitor growth, and manage your BMV portfolio in one place.
            </p>
          </div>

          <UserProfile />

          {/* Data Loading Indicator */}
          {user && isDataLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">Loading your portfolio data...</span>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {user && dataError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div className="flex-1">
                  <span className="text-red-800 font-medium">{dataError}</span>
                  <button
                    onClick={() => {
                      setDataError(null);
                      setIsDataLoading(true);
                      // Reload data
                      loadPortfolioData();
                    }}
                    className="ml-3 text-red-600 hover:text-red-800 underline text-sm"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {user && (
            <div className="mt-6">
              {/* Portfolio Analytics */}
              <div className="mb-8">
                <PortfolioAnalytics />
              </div>

              {/* Portfolio Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Home className="w-7 h-7 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Total Properties</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{portfolioStats.totalProperties}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <PoundSterling className="w-7 h-7 text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Portfolio Value</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(portfolioStats.totalValue)}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-7 h-7 text-orange-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Total Growth</h3>
                  </div>
                  <p className={`text-2xl font-bold ${getTotalGrowth() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {typeof getTotalGrowth() === 'number' && !isNaN(getTotalGrowth()) ? getTotalGrowth().toFixed(1) : 'N/A'}%
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-7 h-7 text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Avg BMV Score</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {portfolioProperties.length > 0 
                      ? Math.round(portfolioProperties.reduce((sum, p) => sum + p.bmvScore, 0) / portfolioProperties.length)
                      : 0
                    }
                  </p>
                </motion.div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-700">Filter by status:</span>
                    <div className="flex gap-2">
                      {(['all', 'active', 'sold', 'watching'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => handleFilterChange(status)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                            filterStatus === status
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                          role="tab"
                          aria-selected={filterStatus === status}
                          aria-controls="properties-list"
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12" role="toolbar" aria-label="Portfolio actions">
                    <div className="flex gap-2">
                      <button 
                        onClick={handleAddProperty}
                        className="rounded-full font-semibold shadow bg-primary-500 text-white px-5 py-2.5 hover:bg-primary-600 focus:ring-2 focus:ring-primary-400 transition inline-flex items-center gap-2"
                        aria-label="Add a new property to portfolio"
                      >
                        <Plus className="w-5 h-5" />
                        Add Property
                      </button>
                      <button 
                        onClick={handleExport}
                        className="rounded-full font-semibold shadow bg-slate-100 text-slate-700 px-5 py-2.5 hover:bg-slate-200 focus:ring-2 focus:ring-primary-400 transition inline-flex items-center gap-2"
                        aria-label="Export portfolio data"
                      >
                        <BarChart3 className="w-5 h-5" />
                        Export
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Properties List */}
              <div className="space-y-4" role="region" aria-labelledby="properties-heading" id="properties-list">
                <h2 className="sr-only" id="properties-heading">Portfolio Properties List</h2>
                {isDataLoading ? (
                  <LoadingSkeleton />
                ) : dataError ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center py-16"
                  >
                    <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-red-50 to-rose-100 rounded-full flex items-center justify-center shadow-lg">
                      <BarChart3 className="w-16 h-16 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Portfolio</h3>
                    <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                      {dataError}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={() => {
                          // Retry loading portfolio
                          setIsDataLoading(true);
                          setDataError(null);
                          loadPortfolioData();
                        }}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-400 focus:outline-none transition shadow-lg"
                      >
                        <BarChart3 className="w-5 h-5" />
                        Retry Loading
                      </button>
                    </div>
                  </motion.div>
                ) : filteredProperties.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center py-16"
                  >
                    <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-green-50 to-emerald-100 rounded-full flex items-center justify-center shadow-lg">
                      <Home className="w-16 h-16 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {filterStatus === 'all' ? 'No Properties in Portfolio' : `No ${filterStatus} Properties`}
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                      {filterStatus === 'all' 
                        ? 'Start tracking your property investments and monitor their growth, returns, and market performance over time.'
                        : `You don't have any ${filterStatus} properties in your portfolio. Try adding some properties or check other status filters.`
                      }
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={handleAddProperty}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-400 focus:outline-none transition shadow-lg"
                      >
                        <Plus className="w-5 h-5" />
                        {filterStatus === 'all' ? 'Add Your First Property' : 'Add New Property'}
                      </button>
                      {filterStatus !== 'all' && (
                        <button
                          onClick={() => handleFilterChange('all')}
                          className="inline-flex items-center gap-3 px-8 py-4 bg-slate-100 text-slate-700 rounded-full font-semibold hover:bg-slate-200 active:bg-slate-300 focus:ring-2 focus:ring-slate-300 focus:outline-none transition"
                        >
                          <BarChart3 className="w-5 h-5" />
                          View All Properties
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  filteredProperties.map((property, index) => {
                    const growth = calculateGrowth(property.currentValue, property.purchasePrice);
                    return (
                      <motion.div
                        key={property.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 group"
                        role="article"
                        aria-labelledby={`property-${property.id}-title`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                <Home className="w-6 h-6 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1" id={`property-${property.id}-title`}>{property.address}</h3>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {property.postcode}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Purchase Price</p>
                                <p className="font-semibold text-gray-900">£{property.purchasePrice.toLocaleString()}</p>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Current Value</p>
                                <p className="font-semibold text-gray-900">£{property.currentValue.toLocaleString()}</p>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Growth</p>
                                <p className="font-semibold text-green-600">+{typeof growth === 'number' && !isNaN(growth) ? growth.toFixed(1) : 'N/A'}%</p>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">BMV Score</p>
                                <p className="font-semibold text-blue-600">{property.bmvScore}/100</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-6">
                            <button
                              onClick={() => handleRemoveProperty(property.id, property.address)}
                              className="rounded-full font-semibold shadow bg-red-100 text-red-700 px-5 py-2.5 hover:bg-red-200 focus:ring-2 focus:ring-red-400 transition inline-flex items-center gap-2 text-sm"
                              aria-label={`Remove ${property.address} from portfolio`}
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                            <button
                              onClick={() => handleSoldProperty(property.id, property.address)}
                              className="rounded-full font-semibold shadow bg-green-100 text-green-700 px-5 py-2.5 hover:bg-green-200 focus:ring-2 focus:ring-green-400 transition inline-flex items-center gap-2 text-sm"
                              aria-label={`Mark ${property.address} as sold`}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Sold
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Quick Actions */}
              {portfolioProperties.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 bg-white rounded-2xl shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleExport}
                      className="rounded-full font-semibold shadow bg-green-100 text-green-700 px-5 py-2.5 hover:bg-green-200 transition inline-flex items-center gap-2"
                    >
                      <BarChart3 className="w-5 h-5" />
                      Export Portfolio
                    </button>
                    <button
                      onClick={() => {
                        // Generate report functionality
                        // Generate report
                      }}
                      className="rounded-full font-semibold shadow bg-purple-100 text-purple-700 px-5 py-2.5 hover:bg-purple-200 transition inline-flex items-center gap-2"
                    >
                      <TrendingUp className="w-5 h-5" />
                      Generate Report
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Not authenticated state */}
          {!user && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center py-16"
            >
              <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center shadow-lg">
                <BarChart3 className="w-16 h-16 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Sign In to View Your Portfolio</h3>
              <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                To track your property investments and monitor portfolio performance, please sign in to your account.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    // Trigger sign in
                    // Sign in clicked
                  }}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-400 focus:outline-none transition shadow-lg"
                >
                  <BarChart3 className="w-5 h-5" />
                  Sign In to Portfolio
                </button>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </>
  );
} 