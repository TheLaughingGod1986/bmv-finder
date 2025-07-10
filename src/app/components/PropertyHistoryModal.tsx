'use client';

import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { SoldPrice } from '../../../types/sold-price';
import { formatPrice } from '../../lib/utils';
import AreaPriceTrendChart from './AreaPriceTrendChart';
import BMVScoreExplanation from './BMVScoreExplanation';
import { X, Home, TrendingUp, MapPin, Calendar, PoundSterling } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PropertyHistoryModalProps {
  property: SoldPrice;
  history: SoldPrice[];
  onClose: () => void;
  allSales?: SoldPrice[];
}

const TABS = [
  { key: 'details', label: 'Property Details' },
  { key: 'trend', label: 'Area Price Trends' },
  { key: 'growth', label: 'Property Price Growth' },
  { key: 'similar', label: 'Similar Sales Nearby' },
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
  const [similarSalesOption, setSimilarSalesOption] = useState<'default' | 'nearby' | 'postcode' | 'broader'>('default');

  useEffect(() => {
    if (property && history.length > 0) {
      setIsLoading(false);
      setError(null);
      setFullHistory(history);
      setActiveTab('details');
    }
  }, [property, history]);

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

  const formatAddress = (sp: SoldPrice) => {
    const addressParts = [];
    if (sp.saon && sp.saon.trim()) addressParts.push(sp.saon.trim());
    if (sp.paon && sp.paon.trim()) addressParts.push(sp.paon.trim());
    if (sp.street && sp.street.trim()) addressParts.push(sp.street.trim());
    if (sp.town_city && sp.town_city.trim()) addressParts.push(sp.town_city.trim());
    return addressParts.join(', ');
  };

  // Sort history by date (oldest first)
  const sortedHistory = [...fullHistory].sort((a, b) => 
    new Date(a.dateOfTransfer).getTime() - new Date(b.dateOfTransfer).getTime()
  );

  // Filter out exact duplicates (same date, price, and address)
  const uniqueHistory = sortedHistory.filter((sale, idx, arr) => {
    return idx === arr.findIndex(other =>
      other.dateOfTransfer === sale.dateOfTransfer &&
      other.price === sale.price &&
      (other.paon || '') === (sale.paon || '') &&
      (other.saon || '') === (sale.saon || '') &&
      (other.street || '') === (sale.street || '') &&
      (other.postcode || '') === (sale.postcode || '')
    );
  });

  // Calculate price changes for unique sales
  const historyWithChanges = uniqueHistory.map((sale, index) => {
    if (index === 0) return { ...sale, priceChange: 0, priceChangePercent: 0 };
    const previousPrice = uniqueHistory[index - 1].price;
    const currentPrice = sale.price;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercent = (priceChange / previousPrice) * 100;
    return { ...sale, priceChange, priceChangePercent };
  });

  // Helper to normalize address for comparison
  const normalizeAddress = (sp: SoldPrice) =>
    [sp.paon, sp.saon, sp.street, sp.postcode]
      .map(x => (x || '').trim().toLowerCase())
      .join('|');

  // Helper to check if streets are similar (fuzzy matching)
  const areStreetsSimilar = (street1: string, street2: string) => {
    if (!street1 || !street2) return false;
    
    const s1 = street1.toLowerCase().trim();
    const s2 = street2.toLowerCase().trim();
    
    // Exact match
    if (s1 === s2) return true;
    
    // Same street with different suffixes (e.g., "Belgrave Road" vs "Belgrave Avenue")
    const s1Words = s1.split(' ').filter(w => w.length > 2);
    const s2Words = s2.split(' ').filter(w => w.length > 2);
    
    if (s1Words.length >= 2 && s2Words.length >= 2) {
      // Check if first word matches (e.g., "Belgrave")
      if (s1Words[0] === s2Words[0]) return true;
    }
    
    // Check for street name variations
    const commonSuffixes = ['road', 'street', 'avenue', 'lane', 'close', 'drive', 'way', 'crescent', 'grove'];
    const s1Base = s1Words.find(w => !commonSuffixes.includes(w)) || s1Words[0];
    const s2Base = s2Words.find(w => !commonSuffixes.includes(w)) || s2Words[0];
    
    return s1Base === s2Base;
  };

  // Get the normalized address of the current property
  const currentAddressKey = normalizeAddress(property);

  // Use allSales for similar sales, fallback to fullHistory
  const similarSalesSource = allSales && allSales.length > 0 ? allSales : fullHistory;
  
  // Debug logging
  console.log('[SimilarSalesSource] allSales length:', allSales?.length || 0);
  console.log('[SimilarSalesSource] fullHistory length:', fullHistory.length);
  console.log('[SimilarSalesSource] final source length:', similarSalesSource.length);

  // Find similar properties based on selected option
  const similarProperties = React.useMemo(() => {
    console.log('[SimilarProperties] Recalculating with option:', similarSalesOption);
    console.log('[SimilarProperties] Property street:', property.street);
    console.log('[SimilarProperties] Property postcode:', property.postcode);
    console.log('[SimilarProperties] Source data length:', similarSalesSource.length);
    
    let filtered = [] as SoldPrice[];
    switch (similarSalesOption) {
      case 'default':
        filtered = similarSalesSource.filter(sp =>
          sp.street === property.street &&
          normalizeAddress(sp) !== currentAddressKey
        );
        console.log('[SimilarProperties] Default filter - same street matches:', filtered.length);
        break;
      case 'nearby':
        filtered = similarSalesSource.filter(sp =>
          (sp.street === property.street || areStreetsSimilar(sp.street, property.street)) &&
          normalizeAddress(sp) !== currentAddressKey
        );
        console.log('[SimilarProperties] Nearby filter - similar streets matches:', filtered.length);
        break;
      case 'postcode':
        filtered = similarSalesSource.filter(sp =>
          sp.postcode === property.postcode &&
          normalizeAddress(sp) !== currentAddressKey
        );
        console.log('[SimilarProperties] Postcode filter - same postcode matches:', filtered.length);
        break;
      case 'broader':
        filtered = similarSalesSource.filter(sp => {
          const isSamePostcode = sp.postcode === property.postcode;
          const isSimilarStreet = areStreetsSimilar(sp.street, property.street);
          const isNotCurrentProperty = normalizeAddress(sp) !== currentAddressKey;
          return (isSamePostcode || isSimilarStreet) && isNotCurrentProperty;
        });
        console.log('[SimilarProperties] Broader filter - broader area matches:', filtered.length);
        break;
      default:
        filtered = similarSalesSource.filter(sp =>
          sp.street === property.street &&
          normalizeAddress(sp) !== currentAddressKey
        );
        console.log('[SimilarProperties] Default case - same street matches:', filtered.length);
    }
    
    console.log('[SimilarProperties] After filtering, before grouping:', filtered.length);
    
    // Group by normalized address and keep only the most recent sale for each property
    const grouped: { [address: string]: SoldPrice } = {};
    filtered.forEach(sp => {
      const addr = normalizeAddress(sp);
      if (!grouped[addr] || new Date(sp.dateOfTransfer) > new Date(grouped[addr].dateOfTransfer)) {
        grouped[addr] = sp;
      }
    });
    
    console.log('[SimilarProperties] After grouping:', Object.keys(grouped).length);
    
    // Only include sales from the last 3 years
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const finalResult = Object.values(grouped)
      .filter(sp => new Date(sp.dateOfTransfer) >= threeYearsAgo)
      .sort((a, b) => new Date(b.dateOfTransfer).getTime() - new Date(a.dateOfTransfer).getTime());
    
    console.log('[SimilarProperties] Final result length:', finalResult.length);
    console.log('[SimilarProperties] Final result addresses:', finalResult.map(sp => formatAddress(sp)));
    
    return finalResult;
  }, [similarSalesOption, similarSalesSource, property, currentAddressKey]);

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
                  {uniqueHistory.length > 1 ? `Property Sales History (${uniqueHistory.length} sales)` : 'Property Details'}
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
                          <div className="font-medium text-text-primary">{formatPropertyType(property.propertyType)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-text-tertiary" />
                        <div>
                          <div className="text-sm text-text-secondary">Tenure</div>
                          <div className="font-medium text-text-primary">{formatDuration(property.duration)}</div>
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
                          <div className="text-2xl font-bold text-text-primary">{formatPrice(property.price)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-text-tertiary" />
                        <div>
                          <div className="text-sm text-text-secondary">Sale Date</div>
                          <div className="font-medium text-text-primary">{formatDate(property.dateOfTransfer)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-text-tertiary" />
                        <div>
                          <div className="text-sm text-text-secondary">BMV Score</div>
                          <div className="font-medium text-text-primary">{property.bmvScore || 'N/A'}</div>
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
                  areaName={property.town_city || property.postcode}
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
                {/* Similar Sales Options Selector */}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-text-primary">Similar Sales Nearby</h4>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-text-secondary">Compare with:</label>
                    <select
                      value={similarSalesOption}
                      onChange={(e) => setSimilarSalesOption(e.target.value as any)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 transition-colors"
                    >
                      <option value="default">Same Street</option>
                      <option value="nearby">Nearby Streets</option>
                      <option value="postcode">Same Postcode</option>
                      <option value="broader">Broader Area</option>
                    </select>
                  </div>
                </div>
                {similarProperties.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <p className="text-text-secondary">
                      No similar properties found in this area.
                    </p>
                    <p className="text-sm text-text-tertiary mt-1">
                      Try selecting a different comparison option above.
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
                        </tr>
                      </thead>
                      <tbody>
                        {similarProperties.slice(0, 10).map((sp, index) => (
                          <tr key={normalizeAddress(sp) + '-' + sp.dateOfTransfer} className={index === 0 ? 'bg-yellow-50' : ''}>
                            <td className="py-3 px-4 font-medium text-text-primary">
                              {formatAddress(sp)}
                              <div className="text-xs text-text-tertiary">{sp.postcode}</div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-text-primary">
                              £{sp.price.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-text-secondary">
                              {formatDate(sp.dateOfTransfer)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {formatPropertyType(sp.propertyType)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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