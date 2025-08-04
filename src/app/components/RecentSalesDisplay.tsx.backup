'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, MapPin, Calendar, PoundSterling, X, Home, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { apiClient } from '@/lib/apiClient';

interface SaleRecord {
  transactionId: string;
  price: number;
  dateOfTransfer: string;
  postcode: string;
  propertyType: string;
  street: string;
  town_city: string;
  district: string;
  county: string;
  paon?: string;
  saon?: string;
  newBuild?: string;
  estateType?: string;
  transactionCategory?: string;
}

interface HpiData {
  region: string;
  date: string;
  year: number;
  month: number;
  index: number;
  regionType: string;
  source: string;
  lastUpdated: string;
}

interface RecentSalesData {
  recentSales: SaleRecord[];
  hpiData: HpiData | null;
  marketSignal: string;
}

interface RecentSalesDisplayProps {
  postcode: string;
  isVisible: boolean;
  onClose: () => void;
}

const RecentSalesDisplay: React.FC<RecentSalesDisplayProps> = ({ postcode, isVisible, onClose }) => {
  const [data, setData] = useState<RecentSalesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible || !postcode) return;

    const fetchRecentSales = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.getRecentSales(postcode);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        setData(response.data as RecentSalesData);
      } catch (err) {
        // Error fetching recent sales
        setError(err instanceof Error ? err.message : 'Failed to fetch recent sales data');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSales();
  }, [postcode, isVisible]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getMarketSignalIcon = (signal: string) => {
    switch (signal) {
      case 'above trend':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'below trend':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'in line with trend':
        return <Minus className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMarketSignalColor = (signal: string) => {
    switch (signal) {
      case 'above trend':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'below trend':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'in line with trend':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const calculateMedianPrice = (sales: SaleRecord[]) => {
    if (sales.length === 0) return 0;
    const prices = sales.map(s => s.price).sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    return prices.length % 2 === 0 
      ? (prices[mid - 1] + prices[mid]) / 2 
      : prices[mid];
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-lg border border-gray-200 mb-6 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-semibold">Recent Sales for {postcode}</h3>
                <p className="text-primary-100 text-sm">
                  Latest property transactions and market insights
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-primary-100 focus:outline-none focus:ring-2 focus:ring-white rounded-full p-1 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading recent sales...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <Info className="w-5 h-5" />
                <span className="font-medium">Error loading data</span>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-6">
              {/* Market Signal */}
              {data.marketSignal && data.marketSignal !== 'insufficient data' && (
                <div className={`border rounded-lg p-4 ${getMarketSignalColor(data.marketSignal)}`}>
                  <div className="flex items-center gap-2">
                    {getMarketSignalIcon(data.marketSignal)}
                    <span className="font-semibold capitalize">
                      Market Signal: {data.marketSignal.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm mt-1 opacity-80">
                    Based on recent sale prices compared to regional HPI trends
                  </p>
                </div>
              )}

              {/* HPI Data */}
              {data.hpiData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-semibold">Regional HPI Data</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">Region:</span>
                      <p>{data.hpiData.region}</p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">HPI Index:</span>
                      <p>{data.hpiData.index.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Date:</span>
                      <p>{formatDate(data.hpiData.date)}</p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Source:</span>
                      <p>{data.hpiData.source}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Sales */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Recent Sales</h4>
                  {data.recentSales.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Median: {formatPrice(calculateMedianPrice(data.recentSales))}
                    </div>
                  )}
                </div>

                {data.recentSales.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No recent sales found for this postcode</p>
                    <p className="text-sm mt-1">Try searching for a different postcode or check back later</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.recentSales.map((sale, index) => (
                      <motion.div
                        key={sale.transactionId || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {sale.paon && sale.saon ? `${sale.saon}, ${sale.paon}` : sale.paon || 'Address not available'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                <span>{sale.propertyType}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(sale.dateOfTransfer)}</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {sale.street}, {sale.town_city}
                              {sale.district && `, ${sale.district}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {formatPrice(sale.price)}
                            </div>
                            {sale.newBuild && (
                              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                {sale.newBuild}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span>Data from Land Registry Price Paid Data</span>
                  </div>
                  <button
                    onClick={() => window.open(`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@bmvfinder.com'}?subject=Recent Sales Feedback - ${postcode}`, '_blank')}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Report Issue
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RecentSalesDisplay; 