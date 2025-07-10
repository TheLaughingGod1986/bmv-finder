'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Home, TrendingUp, PoundSterling, Calendar, Plus, Filter, BarChart3, Target, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import UserProfile from '../components/UserProfile';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are not set');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

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
  // Restore session after OAuth redirect (handle hash tokens) with debug logging
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      console.log('Parsed tokens:', { access_token, refresh_token });
      if (access_token && refresh_token) {
        const supabase = getSupabase();
        supabase.auth.setSession({ access_token, refresh_token })
          .then(({ data, error }) => {
            console.log('setSession result:', { data, error });
          });
        window.location.hash = '';
      }
    }
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      console.log('getSession after setSession:', data);
    });
  }, []);

  // All hooks at the top
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portfolioProperties, setPortfolioProperties] = useState<PortfolioProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'sold' | 'watching'>('all');

  useEffect(() => {
    const supabase = getSupabase();
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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
    console.log('Add new property');
  }, []);

  const handleExport = useCallback(() => {
    console.log('Export portfolio');
  }, []);

  const handleFilterChange = useCallback((status: 'all' | 'active' | 'sold' | 'watching') => {
    setFilterStatus(status);
  }, []);

  const handleViewDetails = useCallback((id: string) => {
    console.log('View property details:', id);
  }, []);

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPortfolioProperties([
        {
          id: '1',
          address: '15 High Street',
          postcode: 'NE5 2PR',
          purchasePrice: 185000,
          currentValue: 210000,
          purchaseDate: '2022-03-15',
          propertyType: 'Semi-detached',
          bmvScore: 78,
          notes: 'Great investment property with strong rental yield',
          status: 'active'
        },
        {
          id: '2',
          address: '42 Park Avenue',
          postcode: 'SE3 9FE',
          purchasePrice: 320000,
          currentValue: 345000,
          purchaseDate: '2021-08-22',
          propertyType: 'Terraced',
          bmvScore: 82,
          notes: 'Excellent location near transport links',
          status: 'active'
        },
        {
          id: '3',
          address: '7 Church Lane',
          postcode: 'SS9 5EL',
          purchasePrice: 195000,
          currentValue: 225000,
          purchaseDate: '2023-01-10',
          propertyType: 'Detached',
          bmvScore: 75,
          status: 'watching'
        }
      ]);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
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

  // Only return JSX after all hooks
  if (loading) return <div>Loading...</div>;

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
      <div className="min-h-screen bg-[#FAF9F6] font-sans">
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

          {user && (
            <div className="mt-6">
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
                    {getTotalGrowth().toFixed(1)}%
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
                {isLoading ? (
                  <LoadingSkeleton />
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
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">No Properties in Portfolio</h3>
                    <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                      Start tracking your property investments and monitor their growth, returns, and market performance over time.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={() => {
                          // Add new property functionality
                          console.log('Add new property');
                        }}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-400 focus:outline-none transition shadow-lg"
                      >
                        <Plus className="w-5 h-5" />
                        Add Your First Property
                      </button>
                      <button
                        onClick={() => {
                          // Demo functionality
                          console.log('View demo portfolio');
                        }}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-slate-100 text-slate-700 rounded-full font-semibold hover:bg-slate-200 active:bg-slate-300 focus:ring-2 focus:ring-slate-300 focus:outline-none transition"
                      >
                        <BarChart3 className="w-5 h-5" />
                        View Demo Portfolio
                      </button>
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
                                <p className="font-semibold text-green-600">+{((property.currentValue - property.purchasePrice) / property.purchasePrice * 100).toFixed(1)}%</p>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">BMV Score</p>
                                <p className="font-semibold text-blue-600">{property.bmvScore}/100</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-6">
                            <button
                              onClick={() => {
                                console.log('View property details:', property.id);
                              }}
                              className="rounded-full font-semibold shadow bg-primary-500 text-white px-5 py-2.5 hover:bg-primary-600 focus:ring-2 focus:ring-primary-400 transition inline-flex items-center gap-2 text-sm"
                              aria-label={`View details for ${property.address}`}
                            >
                              <Target className="w-4 h-4" />
                              View Details
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
                      onClick={() => {
                        // Export portfolio functionality
                        console.log('Export portfolio');
                      }}
                      className="rounded-full font-semibold shadow bg-green-100 text-green-700 px-5 py-2.5 hover:bg-green-200 transition inline-flex items-center gap-2"
                    >
                      <BarChart3 className="w-5 h-5" />
                      Export Portfolio
                    </button>
                    <button
                      onClick={() => {
                        // Generate report functionality
                        console.log('Generate report');
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
        </main>
      </div>
    </>
  );
} 