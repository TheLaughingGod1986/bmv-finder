'use client';

import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { SoldPrice } from '../../../types/sold-price';
import { formatPrice } from '../../lib/utils';
import AreaPriceTrendChart from './AreaPriceTrendChart';
import BMVScoreExplanation from './BMVScoreExplanation';
import { X, Home, TrendingUp, MapPin, Calendar, PoundSterling, RefreshCw, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adjustForInflation, getRecentAdjustedPrices, isWithinLast5Years } from '@/utils/inflationAdjustment';

interface PropertyHistoryModalProps {
  property: SoldPrice;
  history: SoldPrice[];
  onClose: () => void;
  allSales?: SoldPrice[];
}

interface RecentSale {
  id: string;
  postcode: string;
  dateOfTransfer: string;
  propertyType: string;
  newBuild: boolean;
  estateType: string;
  paon: string;
  saon: string;
  street: string;
  price: number;
}

const TABS = [
  { key: 'details', label: 'Property Details' },
  { key: 'trend', label: 'Area Price Trends' },
  { key: 'growth', label: 'Property Price Growth' },
  { key: 'similar', label: 'Recent Sales Nearby' },
];

export default function PropertyHistoryModal({ 
  property, 
  history, 
  onClose,
  allSales
}: PropertyHistoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fullHistory, setFullHistory] = useState<SoldPrice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'trend' | 'growth' | 'similar'>('details');
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [recentSalesLoading, setRecentSalesLoading] = useState(false);
  const [recentSalesError, setRecentSalesError] = useState<string | null>(null);
  const [searchScope, setSearchScope] = useState<'area' | 'broader'>('area');

  useEffect(() => {
    if (property && history.length > 0) {
      setIsLoading(false);
      setError(null);
      setFullHistory(history);
      setActiveTab('details');
    }
  }, [property, history]);

  // Fetch recent sales with searchScope
  const fetchRecentSales = useCallback(async (scope = searchScope) => {
    if (!property?.postcode) return;
    setRecentSalesLoading(true);
    setRecentSalesError(null);
    try {
      const response = await fetch(`/api/recent-sales?postcode=${encodeURIComponent(property.postcode)}&limit=15&months=12&searchScope=${scope}`);
      const data = await response.json();
      if (data.success) {
        setRecentSales(data.data);
        // If fallback was used, update dropdown
        if (data.usedBroaderArea && scope !== 'broader') {
          setSearchScope('broader');
        }
        console.log(`[PropertyHistoryModal] Fetched ${data.data.length} recent sales for ${property.postcode} (scope: ${scope}, usedBroaderArea: ${data.usedBroaderArea})`);
      } else {
        setRecentSalesError(data.error || 'Failed to fetch recent sales');
      }
    } catch (error) {
      console.error('[PropertyHistoryModal] Error fetching recent sales:', error);
      setRecentSalesError('Failed to fetch recent sales');
    } finally {
      setRecentSalesLoading(false);
    }
  }, [property?.postcode, searchScope]);

  useEffect(() => {
    if (activeTab === 'similar') {
      fetchRecentSales(searchScope);
    }
  }, [activeTab, fetchRecentSales, searchScope]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPropertyType = (type: string) => {
    const typeMap: Record<string, string> = {
      'D': 'Detached',
      'S': 'Semi-detached',
      'T': 'Terraced',
      'F': 'Flat/Maisonette',
      'O': 'Other'
    };
    return typeMap[type] || type;
  };

  const formatDuration = (duration: string) => {
    return duration === 'F' ? 'Freehold' : 'Leasehold';
  };

  const formatAddress = (sp: SoldPrice | null | undefined) => {
    if (!sp) return '';
    const addressParts = [];
    if (sp.saon && sp.saon.trim()) addressParts.push(sp.saon.trim());
    if (sp.paon && sp.paon.trim()) addressParts.push(sp.paon.trim());
    if (sp.street && sp.street.trim()) addressParts.push(sp.street.trim());
    if (sp.town_city && sp.town_city.trim()) addressParts.push(sp.town_city.trim());
    return addressParts.join(', ');
  };

  const formatRecentSaleAddress = (sale: RecentSale) => {
    const addressParts = [];
    if (sale.saon && sale.saon.trim()) addressParts.push(sale.saon.trim());
    if (sale.paon && sale.paon.trim()) addressParts.push(sale.paon.trim());
    if (sale.street && sale.street.trim()) addressParts.push(sale.street.trim());
    return addressParts.join(', ');
  };

  // Calculate price changes for the passed-in history
  const historyWithChanges = history.map((sale, index) => {
    if (index === 0) return { ...sale, priceChange: 0, priceChangePercent: 0 };
    const previousPrice = history[index - 1].price;
    const currentPrice = sale.price;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercent = (priceChange / previousPrice) * 100;
    return { ...sale, priceChange, priceChangePercent };
  });

  // Guard clause for null property
  if (!property) {
    return null;
  }

  // Prepare chart data for area trends
  const prepareChartData = () => {
    const yearData: { [key: string]: number[] } = {};
    
    fullHistory.forEach(sale => {
      const year = new Date(sale.dateOfTransfer).getFullYear().toString();
      if (!yearData[year]) {
        yearData[year] = [];
      }
      yearData[year].push(sale.price);
    });

    const labels = Object.keys(yearData).sort();
    const data = labels.map(year => {
      const prices = yearData[year];
      return Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
    });

    return { labels, data };
  };

  const chartData = prepareChartData();

  // Overlay click handler
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Guarded price calculations for summary stats
  const validPrices = recentSales.map(sale => Number(sale.price)).filter(p => !isNaN(p) && p > 0);
  const avgPrice = validPrices.length ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) : null;
  const maxPrice = validPrices.length ? Math.max(...validPrices) : null;

  // Calculate median price for price indicators
  const calculateMedian = (prices: number[]) => {
    if (prices.length === 0) return null;
    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  };

  // Get recent sales (last 5 years) with inflation adjustment
  const recentAdjustedPrices = getRecentAdjustedPrices(history);
  
  // Use inflation-adjusted recent prices for median calculation
  const medianPrice = calculateMedian(recentAdjustedPrices.length > 0 ? recentAdjustedPrices : validPrices);

  // Enhanced price indicator with inflation adjustment
  const getPriceIndicator = (price: number | null, median: number | null) => {
    if (!price || !median) return { 
      label: 'N/A', 
      color: 'gray', 
      bgColor: 'bg-gray-100', 
      textColor: 'text-gray-600',
      description: 'Insufficient data for price analysis'
    };
    
    // Adjust the current price for inflation if it's not from the current year
    
    // Find the sale year for this price
    const saleData = history.find(sale => sale.price === price);
    const saleYear = saleData ? new Date(saleData.dateOfTransfer).getFullYear() : new Date().getFullYear();
    
    // Adjust price for inflation if it's not from current year
    const adjustedPrice = saleYear < new Date().getFullYear() ? adjustForInflation(price, saleYear) : price;
    
    const diff = (adjustedPrice - median) / median;
    
    if (diff <= -0.10) {
      return { 
        label: 'Excellent Deal', 
        color: 'green', 
        bgColor: 'bg-[#5DA271]', 
        textColor: 'text-white',
        icon: '↓',
        description: '10%+ below inflation-adjusted median'
      };
    } else if (diff <= -0.05) {
      return { 
        label: 'Good Deal', 
        color: 'green', 
        bgColor: 'bg-green-100', 
        textColor: 'text-green-800',
        icon: '↓',
        description: '5-10% below inflation-adjusted median'
      };
    } else if (diff >= 0.10) {
      return { 
        label: 'Overpriced', 
        color: 'red', 
        bgColor: 'bg-red-100', 
        textColor: 'text-red-800',
        icon: '↑',
        description: '10%+ above inflation-adjusted median'
      };
    } else if (diff >= 0.05) {
      return { 
        label: 'Expensive', 
        color: 'orange', 
        bgColor: 'bg-orange-100', 
        textColor: 'text-orange-800',
        icon: '↑',
        description: '5-10% above inflation-adjusted median'
      };
    } else {
      return { 
        label: 'Fair Price', 
        color: 'yellow', 
        bgColor: 'bg-yellow-100', 
        textColor: 'text-yellow-800',
        icon: '→',
        description: 'Within 5% of inflation-adjusted median'
      };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-modal-backdrop flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleOverlayClick}
        aria-modal="true"
        role="dialog"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Home className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-primary">
                  {history.length > 1 ? `Property Sales History (${history.length} sales)` : 'Property Details'}
                </h2>
                <p className="text-sm text-text-secondary">{formatAddress(property)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-2 bg-gray-50 rounded-xl mb-4">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'details' | 'trend' | 'growth' | 'similar')}
                className={`
                  px-4 py-2 rounded-full font-semibold transition-colors
                  ${activeTab === tab.key
                    ? 'bg-primary-500 text-white shadow'
                    : 'text-primary-600 hover:bg-gray-100'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh] p-6">
            {activeTab === 'details' && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-6">
                {/* Property Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Property Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-text-tertiary" />
                        <div>
                          <div className="text-sm text-text-secondary">Address</div>
                          <div className="font-medium text-text-primary">{formatAddress(property)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Home className="w-4 h-4 text-text-tertiary" />
                        <div>
                          <div className="text-sm text-text-secondary">Property Type</div>
                          <div className="font-medium text-text-primary">{property?.propertyType ? formatPropertyType(property.propertyType) : 'N/A'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-text-tertiary" />
                        <div>
                          <div className="text-sm text-text-secondary">Tenure</div>
                          <div className="font-medium text-text-primary">{property?.duration ? formatDuration(property.duration) : 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Sale Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <PoundSterling className="w-4 h-4 text-text-tertiary" />
                        <div>
                          <div className="text-sm text-text-secondary">Sale Price</div>
                          <div className="text-2xl font-bold text-text-primary">{property?.price ? formatPrice(property.price) : 'N/A'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-text-tertiary" />
                        <div>
                          <div className="text-sm text-text-secondary">Sale Date</div>
                          <div className="font-medium text-text-primary">{property?.dateOfTransfer ? formatDate(property.dateOfTransfer) : 'N/A'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-text-tertiary" />
                        <div>
                          <div className="text-sm text-text-secondary">BMV Score</div>
                          <div className="font-medium text-text-primary">{property?.bmvScore || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* BMV Score Explanation */}
                <BMVScoreExplanation />
              </div>
            )}

            {activeTab === 'trend' && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-6">
                <AreaPriceTrendChart
                  labels={chartData.labels}
                  data={chartData.data}
                  areaName={property?.town_city || property?.postcode || 'Unknown Area'}
                />
              </div>
            )}

            {activeTab === 'growth' && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Price History</h3>
                {historyWithChanges.length > 1 ? (
                  <div className="space-y-4">
                    <table className="min-w-full text-sm border rounded-xl overflow-hidden">
                      <thead>
                        <tr className="bg-blue-50 text-blue-900">
                          <th className="px-4 py-2 text-left font-semibold">Latest Sale Date</th>
                          <th className="px-4 py-2 text-left font-semibold">Sale Price</th>
                          <th className="px-4 py-2 text-left font-semibold">Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyWithChanges.map((sale, i) => (
                          <tr key={i} className={i === historyWithChanges.length - 1 ? 'bg-yellow-50' : ''}>
                            <td className="px-4 py-2">{formatDate(sale.dateOfTransfer)}</td>
                            <td className="px-4 py-2 font-semibold">{formatPrice(sale.price)}</td>
                            <td className="px-4 py-2">
                              {i === 0 ? (
                                <span className="text-gray-400">—</span>
                              ) : (
                                <span className={sale.priceChange >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                  {sale.priceChange >= 0 ? '+' : ''}{formatPrice(sale.priceChange)} {sale.priceChangePercent !== null && (
                                    <span className="text-xs font-normal">({sale.priceChangePercent >= 0 ? '+' : ''}{sale.priceChangePercent.toFixed(1)}%)</span>
                                  )}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Growth Summary */}
                    {(() => {
                      const first = historyWithChanges[0];
                      const last = historyWithChanges[historyWithChanges.length - 1];
                      const growth = last.price - first.price;
                      const growthPct = first.price ? (growth / first.price) * 100 : 0;
                      return (
                        <div className="flex justify-center">
                          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center w-full max-w-md mx-auto">
                            <div className="text-2xl md:text-3xl font-bold text-green-700 mb-2">
                              {growth >= 0 ? '+' : ''}{formatPrice(growth)} ({growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}%)
                            </div>
                            <div className="text-sm text-green-800 font-medium">
                              Growth from {formatDate(first.dateOfTransfer)} to {formatDate(last.dateOfTransfer)}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="text-xs text-slate-500 text-center mt-6">
                      Percentage growth is calculated from the first recorded sale to the most recent sale of this property.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-secondary">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No price history available for this property</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'similar' && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
                {/* Recent Sales Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-text-primary">Recent Sales in This Area</h4>
                    <p className="text-sm text-text-secondary">
                      Properties sold in {property.postcode} and nearby areas in the last 12 months
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="searchScope" className="text-sm text-text-secondary mr-2">Compare with:</label>
                    <select
                      id="searchScope"
                      value={searchScope}
                      onChange={e => setSearchScope(e.target.value as 'area' | 'broader')}
                      className="border rounded px-2 py-1 text-sm"
                      disabled={recentSalesLoading}
                    >
                      <option value="area">Postcode Area</option>
                      <option value="broader">Broader Area</option>
                    </select>
                    <button
                      onClick={() => fetchRecentSales(searchScope)}
                      disabled={recentSalesLoading}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${recentSalesLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                </div>
                {/* Fallback message */}
                {searchScope === 'broader' && (
                  <div className="mb-2 text-xs text-yellow-700 bg-yellow-50 rounded p-2">
                    No recent sales found in the postcode area. Showing results for the broader district instead.
                  </div>
                )}

                {/* Price Indicator Legend */}
                {recentSales.length > 0 && medianPrice !== null && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-2">Price Indicators:</div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: '#5DA271', color: '#fff' }}>
                        <span>↓</span> Good Deal (5%+ below median)
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        <span>→</span> Fair Price (within 5% of median)
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800">
                        <span>↑</span> Expensive (5%+ above median)
                      </span>
                    </div>
                  </div>
                )}

                {recentSalesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-text-secondary">Loading recent sales...</p>
                  </div>
                ) : recentSalesError ? (
                  <div className="text-center py-8">
                    <div className="text-red-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <p className="text-text-secondary mb-2">Failed to load recent sales</p>
                    <p className="text-sm text-text-tertiary">{recentSalesError}</p>
                    <button
                      onClick={() => fetchRecentSales()}
                      className="mt-4 px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : recentSales.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <p className="text-text-secondary">
                      No recent sales found in this area.
                    </p>
                    <p className="text-sm text-text-tertiary mt-1">
                      This could mean no properties have sold recently, or the data is still being updated.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border rounded-xl overflow-hidden">
                      <thead>
                        <tr className="bg-blue-50 text-blue-900">
                          <th className="text-left py-3 px-4 font-semibold">Address</th>
                          <th className="text-left py-3 px-4 font-semibold">Price</th>
                          <th className="text-left py-3 px-4 font-semibold">Date</th>
                          <th className="text-left py-3 px-4 font-semibold">Type</th>
                          <th className="text-left py-3 px-4 font-semibold">New Build</th>
                          <th className="text-left py-3 px-4 font-semibold">Indicator</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSales.map((sale, index) => (
                          <tr key={sale.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="py-3 px-4 font-medium text-text-primary">
                              {formatRecentSaleAddress(sale)}
                              <div className="text-xs text-text-tertiary">{sale.postcode}</div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-text-primary">
                              {!isNaN(Number(sale.price)) && Number(sale.price) > 0 ? formatPrice(Number(sale.price)) : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-text-secondary">
                              {formatDate(sale.dateOfTransfer)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {formatPropertyType(sale.propertyType)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                sale.newBuild 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {sale.newBuild ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {(() => {
                                const indicator = getPriceIndicator(Number(sale.price), medianPrice);
                                return (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${indicator.bgColor} ${indicator.textColor}`}>
                                    <span className="text-xs">{indicator.icon}</span>
                                    {indicator.label}
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* Summary Stats */}
                    {recentSales.length > 0 && (
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{recentSales.length}</div>
                          <div className="text-sm text-blue-800">Total Sales</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {avgPrice !== null ? formatPrice(avgPrice) : 'N/A'}
                          </div>
                          <div className="text-sm text-green-800">Average Price</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {maxPrice !== null ? formatPrice(maxPrice) : 'N/A'}
                          </div>
                          <div className="text-sm text-purple-800">Highest Price</div>
                        </div>
                        {medianPrice !== null && (
                          <div className="bg-yellow-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                              {formatPrice(medianPrice)}
                            </div>
                            <div className="text-sm text-yellow-800">Median Price</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 