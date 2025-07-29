'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Home, TrendingUp, PoundSterling, Calendar, Plus, Filter, BarChart3, Target, MapPin, Trash2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';

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
  // All hooks at the top
  const [user, setUser] = useState<any>(null);
  const [portfolioProperties, setPortfolioProperties] = useState<PortfolioProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'sold' | 'watching'>('all');
  const [dataError, setDataError] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !supabase) {
      setIsLoading(false);
      return;
    }
    
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setUser(data.session.user);
        }
      } catch (error) {
        console.error('Auth error:', error);
      }
    };

    initializeAuth();
  }, [supabase]);

  // Load portfolio data from Supabase
  const loadPortfolioData = useCallback(async () => {
    if (!user || !supabase) {
      setIsLoading(false);
      return;
    }

    setIsDataLoading(true);
    setDataError(null);

    try {
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

  // Event handlers
  const handleAddProperty = useCallback(() => {
    // Add new property functionality
    console.log('Add property clicked');
  }, []);

  const handleExport = useCallback(() => {
    // Export portfolio functionality
    console.log('Export clicked');
  }, []);

  const handleFilterChange = useCallback((status: 'all' | 'active' | 'sold' | 'watching') => {
    setFilterStatus(status);
  }, []);

  const handleRemoveProperty = useCallback((id: string, address: string) => {
    if (window.confirm(`Are you sure you want to remove "${address}" from your portfolio?`)) {
      setPortfolioProperties(prev => prev.filter(property => property.id !== id));
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
    }
  }, []);

  // Utility functions
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 font-sans">
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center mb-10 max-w-3xl mx-auto pt-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-blue-600" />
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-0">Portfolio Tracker</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
              Track your property investments, monitor growth, and manage your BMV portfolio in one place.
            </p>
          </div>
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading portfolio...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-10"></div>
        <div className="relative max-w-screen-2xl w-[90vw] mx-auto pt-20 pb-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                <BarChart3 className="w-4 h-4 mr-2" />
                Portfolio Management
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight"
            >
              Track Your Property
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Investment Portfolio
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
            >
              Monitor your property investments, track growth, and manage your BMV portfolio in one place.
            </motion.p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Data Loading Indicator */}
        {user && isDataLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-soft p-6 mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-gray-700 font-medium">Loading your portfolio data...</span>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {user && dataError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 shadow-soft"
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
            {/* Portfolio Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Home className="w-7 h-7 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Total Properties</h3>
                </div>
                <p className="text-3xl font-bold text-blue-600">{portfolioStats.totalProperties}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <PoundSterling className="w-7 h-7 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Portfolio Value</h3>
                </div>
                <p className="text-2xl font-bold text-green-600">{formatPrice(portfolioStats.totalValue)}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-7 h-7 text-purple-600" />
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
                className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-7 h-7 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Avg BMV Score</h3>
                </div>
                <p className="text-2xl font-bold text-indigo-600">
                  {portfolioProperties.length > 0 
                    ? Math.round(portfolioProperties.reduce((sum, p) => sum + p.bmvScore, 0) / portfolioProperties.length)
                    : 0
                  }
                </p>
              </motion.div>
            </div>

            {/* Filters */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-soft p-6 mb-8 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Filter className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Filter by status:</span>
                  <div className="flex gap-2">
                    {(['all', 'active', 'sold', 'watching'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => handleFilterChange(status)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                          filterStatus === status
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleAddProperty}
                    className="rounded-full font-semibold shadow-soft bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 hover:from-purple-600 hover:to-blue-600 focus:ring-2 focus:ring-blue-600 transition inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Property
                  </button>
                  <button 
                    onClick={handleExport}
                    className="rounded-full font-semibold shadow-soft bg-white text-gray-700 px-5 py-2.5 hover:bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-blue-600 transition inline-flex items-center gap-2"
                  >
                    <BarChart3 className="w-5 h-5" />
                    Export
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Properties List */}
            <div className="space-y-4">
              {isDataLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-700">Loading properties...</p>
                </div>
              ) : dataError ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-red-50 to-rose-100 rounded-full flex items-center justify-center shadow-soft">
                    <BarChart3 className="w-16 h-16 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Portfolio</h3>
                  <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                    {dataError}
                  </p>
                  <button
                    onClick={() => {
                      setIsDataLoading(true);
                      setDataError(null);
                      loadPortfolioData();
                    }}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-purple-600 hover:to-blue-600 focus:ring-2 focus:ring-blue-600 transition shadow-soft"
                  >
                    <BarChart3 className="w-5 h-5" />
                    Retry Loading
                  </button>
                </motion.div>
              ) : filteredProperties.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center shadow-soft">
                    <Home className="w-16 h-16 text-blue-600" />
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
                  <button
                    onClick={handleAddProperty}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-purple-600 hover:to-blue-600 focus:ring-2 focus:ring-blue-600 transition shadow-soft"
                  >
                    <Plus className="w-5 h-5" />
                    {filterStatus === 'all' ? 'Add Your First Property' : 'Add New Property'}
                  </button>
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
                      className="bg-white rounded-xl shadow-soft p-6 hover:shadow-lg transition-all duration-200 border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center shadow-soft">
                              <Home className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.address}</h3>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {property.postcode}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Purchase Price</p>
                              <p className="font-semibold text-gray-900">{formatPrice(property.purchasePrice)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Current Value</p>
                              <p className="font-semibold text-gray-900">{formatPrice(property.currentValue)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Growth</p>
                              <p className="font-semibold text-green-600">+{typeof growth === 'number' && !isNaN(growth) ? growth.toFixed(1) : 'N/A'}%</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">BMV Score</p>
                              <p className="font-semibold text-blue-600">{property.bmvScore}/100</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-6">
                          <button
                            onClick={() => handleRemoveProperty(property.id, property.address)}
                            className="rounded-full font-semibold shadow-soft bg-red-100 text-red-700 px-5 py-2.5 hover:bg-red-200 focus:ring-2 focus:ring-red-400 transition inline-flex items-center gap-2 text-sm border border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                          <button
                            onClick={() => handleSoldProperty(property.id, property.address)}
                            className="rounded-full font-semibold shadow-soft bg-green-100 text-green-700 px-5 py-2.5 hover:bg-green-200 focus:ring-2 focus:ring-green-400 transition inline-flex items-center gap-2 text-sm border border-green-200"
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
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center shadow-soft">
              <BarChart3 className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Sign In to View Your Portfolio</h3>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
              To track your property investments and monitor portfolio performance, please sign in to your account.
            </p>
            <button
              onClick={() => {
                // Trigger sign in
                console.log('Sign in clicked');
              }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-purple-600 hover:to-blue-600 focus:ring-2 focus:ring-blue-600 transition shadow-soft"
            >
              <BarChart3 className="w-5 h-5" />
              Sign In to Portfolio
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
} 