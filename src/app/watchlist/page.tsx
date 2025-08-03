'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Home as HomeIcon, 
  Eye as EyeIcon, 
  TrendingUp, 
  Target, 
  Calculator, 
  Briefcase as BriefcaseIcon,
  ExternalLink as ExternalLinkIcon,
  Archive as ArchiveIcon,
  Trash as TrashIcon,
  BedDouble as BedDoubleIcon,
  Bath as BathIcon,
  MapPin,
  PoundSterling,
  Calendar,
  Star,
  Filter,
  Search,
  X,
  Plus,
  Edit,
  CheckCircle,
  Check
} from 'lucide-react';


interface WatchlistItem {
  id: string;
  title: string;
  price: number;
  address: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  tenure: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  original_url: string;
  source: string;
  agent_name: string;
  agent_phone: string;
  images: string[];
  captured_at: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_size?: {
    value: number;
    unit: string;
  } | null;
  floor_plan_links?: Array<{
    url: string;
    text: string;
  }> | null;
  refurbishment_cost?: number;
  total_cost?: number;
  estimated_fair_value?: number;
  fair_bid_amount?: number;
  user_notes?: string;
  property_condition?: string;
  market_trend?: string;
  days_on_market?: number;
}

export default function WatchlistPage() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('captured_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist');
      const result = await response.json();

      if (!response.ok) {
        console.error('Error loading watchlist:', result.error);
        return;
      }

      setWatchlist(result.properties || []);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePropertyStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/properties/capture`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        console.error('Error updating status');
        return;
      }

      setWatchlist(prev => 
        prev.map(item => 
          item.id === id ? { ...item, status } : item
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteProperty = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this property?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/properties/capture?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Error deleting property');
        return;
      }

      setWatchlist(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  const addToPortfolio = async (property: WatchlistItem) => {
    const confirmed = window.confirm(`Add ${property.address} to your portfolio?`);
    if (!confirmed) return;

    try {
      // For now, just show a success message since portfolio API isn't implemented yet
      alert('Property added to portfolio successfully!');
    } catch (error) {
      console.error('Error adding to portfolio:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode);
    if (comparisonMode) {
      setSelectedProperties([]);
    }
  };

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const isPropertySelected = (propertyId: string) => {
    return selectedProperties.includes(propertyId);
  };

  const calculateRentalEstimateSync = (property: WatchlistItem) => {
    const baseRent = property.price * 0.008;
    const variation = 0.9 + Math.random() * 0.2;
    return Math.round(baseRent * variation);
  };

  const calculateYield = (monthlyRent: number, price: number) => {
    return ((monthlyRent * 12) / price * 100).toFixed(1);
  };

  const calculateBmvScore = (property: WatchlistItem) => {
    const bmvPercentage = 15; // Placeholder calculation
    if (bmvPercentage >= 20) return { score: 'A', percentage: bmvPercentage.toFixed(1) };
    if (bmvPercentage >= 10) return { score: 'B', percentage: bmvPercentage.toFixed(1) };
    if (bmvPercentage >= 5) return { score: 'C', percentage: bmvPercentage.toFixed(1) };
    if (bmvPercentage >= 0) return { score: 'D', percentage: bmvPercentage.toFixed(1) };
    return { score: 'E', percentage: bmvPercentage.toFixed(1) };
  };

  const getSourceIcon = (source: string) => {
    const sourceMap: { [key: string]: string } = {
      'rightmove': '🏠',
      'zoopla': '🏡',
      'onthemarket': '🏘️',
      'prime-location': '🏢'
    };
    return sourceMap[source] || '🏠';
  };

  const filteredWatchlist = useMemo(() => {
    return watchlist.filter(item => {
      const matchesSearch = item.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      let matchesPrice = true;
      if (priceFilter !== 'all') {
        const price = item.price;
        switch (priceFilter) {
          case 'under-100k': matchesPrice = price < 100000; break;
          case '100k-200k': matchesPrice = price >= 100000 && price < 200000; break;
          case '200k-300k': matchesPrice = price >= 200000 && price < 300000; break;
          case '300k-400k': matchesPrice = price >= 300000 && price < 400000; break;
          case '400k-500k': matchesPrice = price >= 400000 && price < 500000; break;
          case 'over-500k': matchesPrice = price >= 500000; break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesPrice;
    }).sort((a, b) => {
      const aValue = a[sortBy as keyof WatchlistItem];
      const bValue = b[sortBy as keyof WatchlistItem];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [watchlist, searchTerm, statusFilter, priceFilter, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your watchlist...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
                  <HomeIcon className="w-4 h-4 mr-2" />
                  Property Investment Management
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight"
              >
                Captured Properties
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Investment Watchlist
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
              >
                Properties captured with the BMV Finder Chrome extension. Monitor your investment opportunities and track performance with our comprehensive analysis tools.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <button
                  onClick={() => router.push('/portfolio-tracker')}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <BriefcaseIcon className="w-5 h-5 mr-2" />
                  View Portfolio
                </button>
                <button
                  onClick={() => router.push('/deal-calculator')}
                  className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:shadow-xl border border-gray-200 transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Deal Calculator
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <EyeIcon className="w-4 h-4" />
                  <span>Real-time tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Performance analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>Investment insights</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <HomeIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Total Properties</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {watchlist.length}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-600 font-semibold">{watchlist.filter(p => p.status === 'active').length}</span>
                  <span className="text-gray-500">active</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <PoundSterling className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Total Value</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatPrice(watchlist.reduce((sum, p) => sum + p.price, 0))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-purple-600 font-semibold">{formatPrice(watchlist.reduce((sum, p) => sum + p.price, 0) / watchlist.length)}</span>
                  <span className="text-gray-500">average</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Avg. Yield</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {watchlist.length > 0 ? 
                    (watchlist.reduce((sum, p) => {
                      const rent = calculateRentalEstimateSync(p);
                      return sum + parseFloat(calculateYield(rent, p.price));
                    }, 0) / watchlist.length).toFixed(1) + '%' : 'N/A'
                  }
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-emerald-600 font-semibold">{formatPrice(watchlist.reduce((sum, p) => sum + calculateRentalEstimateSync(p), 0))}</span>
                  <span className="text-gray-500">monthly rent</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">BMV Score</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {watchlist.length > 0 ? 
                    watchlist.reduce((sum, p) => {
                      const score = calculateBmvScore(p);
                      return sum + (score.score === 'A' ? 5 : score.score === 'B' ? 4 : score.score === 'C' ? 3 : score.score === 'D' ? 2 : 1);
                    }, 0) / watchlist.length : 0
                  }/5
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-orange-600 font-semibold">{watchlist.filter(p => calculateBmvScore(p).score === 'A').length}</span>
                  <span className="text-gray-500">A-grade properties</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Recently Added</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {watchlist.filter(p => {
                    const daysSinceAdded = (new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
                    return daysSinceAdded <= 7;
                  }).length}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-cyan-600 font-semibold">Last 7 days</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-900">Your Watchlist</h2>
                  <span className="text-sm text-gray-500">({filteredWatchlist.length} properties)</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                  
                  <button
                    onClick={toggleComparisonMode}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      comparisonMode 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    {comparisonMode ? 'Exit Compare' : 'Compare'}
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search properties..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                    <select
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Prices</option>
                      <option value="under-100k">Under £100k</option>
                      <option value="100k-200k">£100k - £200k</option>
                      <option value="200k-300k">£200k - £300k</option>
                      <option value="300k-400k">£300k - £400k</option>
                      <option value="400k-500k">£400k - £500k</option>
                      <option value="over-500k">Over £500k</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="captured_at">Date Captured</option>
                      <option value="price">Price</option>
                      <option value="address">Address</option>
                      <option value="bedrooms">Bedrooms</option>
                    </select>
                  </div>
                </div>
              )}

              {filteredWatchlist.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-50 rounded-2xl p-12">
                    <HomeIcon className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">No properties found</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {searchTerm || statusFilter !== 'all' || priceFilter !== 'all'
                        ? "Try adjusting your filters to see more properties."
                        : "Start capturing properties with the BMV Finder Chrome extension to build your watchlist."
                      }
                    </p>
                    {searchTerm || statusFilter !== 'all' || priceFilter !== 'all' ? (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setPriceFilter('all');
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Clear Filters
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push('/extension-welcome')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Get Chrome Extension
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredWatchlist.map((item, index) => {
                    const rentalEstimate = calculateRentalEstimateSync(item);
                    const yieldPercentage = calculateYield(rentalEstimate, item.price);
                    const bmvScore = calculateBmvScore(item);
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 overflow-hidden"
                      >
                        {item.images && item.images.length > 0 && (
                          <div className="relative h-48 bg-gray-200">
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full">
                                {getSourceIcon(item.source)} {item.source}
                              </span>
                            </div>
                            <div className="absolute top-3 right-3">
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                item.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              {comparisonMode && (
                                <div className="flex items-center gap-2 mb-2">
                                  <input
                                    type="checkbox"
                                    checked={isPropertySelected(item.id)}
                                    onChange={() => togglePropertySelection(item.id)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                  />
                                  <span className="text-sm text-gray-600">Select for comparison</span>
                                </div>
                              )}
                              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                {item.title}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <MapPin className="w-4 h-4" />
                                <span className="line-clamp-1">{item.address}</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {formatPrice(item.price)}
                              </div>
                              <div className="text-xs text-gray-500">Price</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-lg font-bold text-green-600">
                                £{rentalEstimate.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">Est. Rent</div>
                            </div>
                          </div>

                          <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Gross Yield:</span>
                              <span className={`font-semibold ${
                                parseFloat(yieldPercentage) >= 6 ? 'text-green-600' :
                                parseFloat(yieldPercentage) >= 4 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {yieldPercentage}%
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">BMV Score:</span>
                              <span className={`font-semibold ${
                                bmvScore.score === 'A' ? 'text-green-600' :
                                bmvScore.score === 'B' ? 'text-blue-600' :
                                bmvScore.score === 'C' ? 'text-yellow-600' :
                                bmvScore.score === 'D' ? 'text-orange-600' :
                                'text-red-600'
                              }`}>
                                {bmvScore.score} ({bmvScore.percentage}%)
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Bedrooms:</span>
                              <span className="font-semibold">{item.bedrooms > 0 ? item.bedrooms : 'N/A'}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => window.open(item.original_url, '_blank')}
                                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                title="View Original Listing"
                              >
                                <ExternalLinkIcon className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => updatePropertyStatus(item.id, item.status === 'active' ? 'archived' : 'active')}
                                className="p-2 text-gray-600 hover:text-yellow-600 transition-colors"
                                title={item.status === 'active' ? 'Archive' : 'Activate'}
                              >
                                <ArchiveIcon className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => addToPortfolio(item)}
                                className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                                title="Add to Portfolio"
                              >
                                <BriefcaseIcon className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => deleteProperty(item.id)}
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Comparison View */}
              {comparisonMode && selectedProperties.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mt-8"
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">
                        Property Comparison ({selectedProperties.length} selected)
                      </h3>
                      <button
                        onClick={() => setSelectedProperties([])}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Clear Selection
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {selectedProperties.map(propertyId => {
                        const property = watchlist.find(p => p.id === propertyId);
                        if (!property) return null;

                        const rentalEstimate = calculateRentalEstimateSync(property);
                        const yieldPercentage = calculateYield(rentalEstimate, property.price);
                        const bmvScore = calculateBmvScore(property);

                        return (
                          <div
                            key={property.id}
                            className="bg-gray-50 rounded-xl p-4 border-2 border-blue-200"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900 line-clamp-2">
                                {property.title}
                              </h4>
                              <button
                                onClick={() => togglePropertySelection(property.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Price:</span>
                                <span className="font-semibold text-blue-600">
                                  {formatPrice(property.price)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Est. Rent:</span>
                                <span className="font-semibold text-green-600">
                                  £{rentalEstimate.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Gross Yield:</span>
                                <span className={`font-semibold ${
                                  parseFloat(yieldPercentage) >= 6 ? 'text-green-600' :
                                  parseFloat(yieldPercentage) >= 4 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {yieldPercentage}%
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">BMV Score:</span>
                                <span className={`font-semibold ${
                                  bmvScore.score === 'A' ? 'text-green-600' :
                                  bmvScore.score === 'B' ? 'text-blue-600' :
                                  bmvScore.score === 'C' ? 'text-yellow-600' :
                                  bmvScore.score === 'D' ? 'text-orange-600' :
                                  'text-red-600'
                                }`}>
                                  {bmvScore.score} ({bmvScore.percentage}%)
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Bedrooms:</span>
                                <span className="font-semibold">
                                  {property.bedrooms > 0 ? property.bedrooms : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Address:</span>
                                <span className="font-semibold text-gray-800 line-clamp-1 max-w-[150px]">
                                  {property.address}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <button
                                onClick={() => window.open(property.original_url, '_blank')}
                                className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                View Original
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}