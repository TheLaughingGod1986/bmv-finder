'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  MapPin,
  Calendar,
  PoundSterling,
  Home,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  BarChart3,
  Info,
  Map,
  Download,
  Eye
} from 'lucide-react';
import ValueIndicatorExplanation from './BMVExplanationAccordion';
import FullScreenChart from './FullScreenChart';

interface GroupedSoldPricesTableProps {
  soldPrices: any[];
  totalProperties?: number | null;
  onRowClick: (property: any) => void;
  sortConfig: { key: string; direction: 'ascending' | 'descending' };
  onSort: (key: string) => void;
  isLoading: boolean;
  selectedRowId: string | null;
  className?: string;
  postcode?: string;
  pagination: {
    page: number;
    size: number;
    has_more: boolean;
    after_key?: any;
  };
  onPageChange: (page: number, after?: any) => void;
}

const GroupedSoldPricesTable: React.FC<GroupedSoldPricesTableProps> = ({
  soldPrices,
  totalProperties,
  onRowClick,
  sortConfig,
  onSort,
  isLoading,
  selectedRowId,
  className = '',
  postcode,
  pagination,
  onPageChange
}) => {
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean; property: any }>({
    isOpen: false,
    property: null
  });
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'growth' | 'map'>('info');
  const [priceIndicators, setPriceIndicators] = useState<{ [key: string]: any }>({});
  const [salesCounts, setSalesCounts] = useState<{ [key: string]: number }>({});

  const formatAddress = (property: any) => {
    if (!property) return '';
    const parts = [property.paon, property.street, property.locality, property.town_city, property.county].filter(Boolean);
    return parts.join(', ');
  };

  const formatShortAddress = (property: any) => {
    if (!property) return '';
    const parts = [property.paon, property.street].filter(Boolean);
    return parts.join(' ');
  };

  const formatPropertyType = (type: string) => {
    if (!type) return 'Unknown';
    
    // Handle property type codes
    const propertyTypeMap: { [key: string]: string } = {
      'D': 'Detached',
      'S': 'Semi-detached',
      'T': 'Terraced',
      'F': 'Flat',
      'O': 'Other',
      'detached': 'Detached',
      'semi-detached': 'Semi-detached',
      'terraced': 'Terraced',
      'flat': 'Flat',
      'other': 'Other'
    };
    
    // Check if it's a code first
    const upperType = type.toUpperCase();
    if (propertyTypeMap[upperType]) {
      return propertyTypeMap[upperType];
    }
    
    // Check if it's a full name
    const lowerType = type.toLowerCase();
    if (propertyTypeMap[lowerType]) {
      return propertyTypeMap[lowerType];
    }
    
    // Fallback to basic formatting
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace(/_/g, ' ');
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'detached':
        return <Home className="w-4 h-4" />;
      case 'semi-detached':
        return <Home className="w-4 h-4" />;
      case 'terraced':
        return <Home className="w-4 h-4" />;
      case 'flat':
        return <Home className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getSalesCount = (property: any) => {
    if (!property) return null;
    
    const propertyKey = property.guid || property.paon || `${property.paon}-${property.postcode}`;
    const count = salesCounts[propertyKey];
    
    if (count === undefined) {
      return (
        <div className="text-xs text-gray-400">
          Loading...
        </div>
      );
    }
    
    return (
      <div className="text-sm font-medium text-[#2C6E91]">
        {count} sale{count !== 1 ? 's' : ''}
      </div>
    );
  };

  const getMarketTrend = (property: any) => {
    if (!property) return null;
    
    const propertyKey = property.guid || property.paon || `${property.paon}-${property.postcode}`;
    const indicator = priceIndicators[propertyKey];
    
    if (!indicator || !indicator.marketTrend) {
      return (
        <div className="text-xs text-gray-400">
          Loading...
        </div>
      );
    }
    
    const trend = indicator.marketTrend;
    let trendText = '';
    let trendColor = '';
    let trendIcon = '';
    
    switch (trend) {
      case 'rising':
        trendText = 'Rising';
        trendColor = 'text-green-600';
        trendIcon = '↗';
        break;
      case 'falling':
        trendText = 'Falling';
        trendColor = 'text-red-600';
        trendIcon = '↘';
        break;
      case 'stable':
        trendText = 'Stable';
        trendColor = 'text-gray-600';
        trendIcon = '→';
        break;
      default:
        trendText = 'Unknown';
        trendColor = 'text-gray-400';
        trendIcon = '?';
    }
    
    return (
      <div className={`text-sm font-medium ${trendColor} flex items-center gap-1`}>
        <span>{trendIcon}</span>
        <span>{trendText}</span>
      </div>
    );
  };

  const getValueIndicator = (price: number | null, property: any) => {
    if (!price || !property) return null;
    
    // Use guid, paon, or a combination as the key
    const propertyKey = property.guid || property.paon || `${property.paon}-${property.postcode}`;
    console.log('🔍 Looking for indicator with key:', propertyKey);
    console.log('🔍 Available indicators:', Object.keys(priceIndicators));
    
    const indicator = priceIndicators[propertyKey];
    console.log('🔍 Found indicator:', indicator);
    
    if (!indicator) return null;

    // BMV badge only
    const bmvCategory = indicator.bmvCategory;
    const bmvScore = indicator.bmvScore;
    
    if (!bmvCategory || bmvScore === undefined) {
      console.log('🔍 No BMV data available');
      return null;
    }
    
    let badgeColor = 'bg-gray-100 text-gray-800';
    let badgeIcon = '→';
    let badgeLabel = 'Market Value';
    
    if (bmvCategory === 'below') {
      badgeColor = 'bg-green-100 text-green-800';
      badgeIcon = '↓';
      badgeLabel = 'Below Market';
    } else if (bmvCategory === 'above') {
      badgeColor = 'bg-red-100 text-red-800';
      badgeIcon = '↑';
      badgeLabel = 'Above Market';
    }
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
        <span>{badgeIcon}</span>
        <span>{bmvScore.toFixed(1)}</span>
      </div>
    );
  };

  useEffect(() => {
    const fetchPriceIndicators = async () => {
      try {
        // Prepare properties with correct field mapping
        const propertiesForApi = soldPrices.map(property => ({
          id: property.guid || property.paon || `${property.paon}-${property.postcode}`,
          postcode: property.postcode,
          propertyType: property.property_type || property.propertyType,
          price: property.price,
          bedrooms: property.epc_bedrooms || property.bedrooms
        }));

        const response = await fetch('/api/enhanced-price-indicator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ properties: propertiesForApi })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Price indicators API response:', data);
          const indicatorsMap: { [key: string]: any } = {};
          data.forEach((indicator: any) => {
            // Map the indicator to the correct property key
            const propertyKey = indicator.propertyId;
            console.log('🔍 Mapping indicator:', { propertyKey, indicator });
            
            // Only add to map if it has valid data (not an error)
            if (indicator.percentage !== undefined && !indicator.error) {
              indicatorsMap[propertyKey] = indicator;
              console.log('🔍 Added to map:', propertyKey, indicator);
            } else {
              console.log('🔍 Skipped indicator due to error or missing percentage:', indicator);
            }
          });
          console.log('🔍 Final indicators map:', indicatorsMap);
          setPriceIndicators(indicatorsMap);
        }
      } catch (error) {
        console.error('Error fetching price indicators:', error);
      }
    };

    if (soldPrices.length > 0) {
      fetchPriceIndicators();
    }
  }, [soldPrices]);

  // Fetch sales counts for all properties
  useEffect(() => {
    const fetchSalesCounts = async () => {
      const countsMap: { [key: string]: number } = {};
      
      for (const property of soldPrices) {
        const propertyNumber = property.paon || property.propertyNumber;
        const propertyPostcode = property.postcode;
        const propertyKey = property.guid || property.paon || `${property.paon}-${property.postcode}`;
        
        try {
          const response = await fetch(`/api/property-sales-history?postcode=${encodeURIComponent(propertyPostcode)}&number=${encodeURIComponent(propertyNumber)}`);
          const data = await response.json();
          
          if (data.success && data.salesHistory) {
            countsMap[propertyKey] = data.salesHistory.length;
          } else {
            countsMap[propertyKey] = 1; // At least the current sale
          }
        } catch (error) {
          console.error('Error fetching sales count for property:', propertyKey, error);
          countsMap[propertyKey] = 1; // Default to 1 if error
        }
      }
      
      setSalesCounts(countsMap);
    };

    if (soldPrices.length > 0) {
      fetchSalesCounts();
    }
  }, [soldPrices]);

  const SortableHeader = ({ 
    column, 
    label, 
    icon 
  }: { 
    column: string; 
    label: string; 
    icon?: React.ReactNode;
  }) => (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1 text-xs font-medium text-[#2C6E91] hover:text-[#3A7CA5] transition-colors"
    >
      {icon}
      {label}
      {sortConfig.key === column ? (
        sortConfig.direction === 'ascending' ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )
      ) : (
        <div className="w-3 h-3" />
      )}
    </button>
  );

  const openHistoryModal = async (property: any) => {
    // Find all sales for this property using property number and postcode
    const propertyNumber = property.paon || property.propertyNumber;
    const propertyPostcode = property.postcode;
    
    try {
      // Fetch complete sales history from API
      const response = await fetch(`/api/property-sales-history?postcode=${encodeURIComponent(propertyPostcode)}&number=${encodeURIComponent(propertyNumber)}`);
      const data = await response.json();
      
      let salesHistory = [];
      
      if (data.success && data.salesHistory.length > 0) {
        // Use API data
        salesHistory = data.salesHistory.map((sale: any) => ({
          date: sale.date,
          price: sale.price,
          description: `${formatPropertyType(sale.propertyType)} - ${sale.postcode}`
        }));
      } else {
        // Fallback to local data
        salesHistory = soldPrices.filter(sale => {
          const saleNumber = sale.paon || sale.propertyNumber;
          const salePostcode = sale.postcode;
          return saleNumber === propertyNumber && salePostcode === propertyPostcode;
        }).map(sale => ({
          date: sale.date,
          price: sale.price,
          description: `${formatPropertyType(sale.propertyType)} - ${sale.postcode}`
        }));
      }

      // If no sales history found, create a single entry from the current property
      if (salesHistory.length === 0) {
        salesHistory.push({
          date: property.date,
          price: property.price,
          description: `${formatPropertyType(property.propertyType)} - ${property.postcode}`
        });
      }

      // Sort by date (newest first)
      salesHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Debug logging
      console.log('Property History Debug:', {
        propertyNumber,
        propertyPostcode,
        totalSalesInData: soldPrices.length,
        foundSales: salesHistory.length,
        salesHistory: salesHistory,
        apiData: data.success ? 'Used API data' : 'Used local data'
      });

      setHistoryModal({ 
        isOpen: true, 
        property: {
          ...property,
          salesHistory: salesHistory
        }
      });
      setActiveTab('info');
    } catch (error) {
      console.error('Error fetching property sales history:', error);
      
      // Fallback to local data on error
      const salesHistory = soldPrices.filter(sale => {
        const saleNumber = sale.paon || sale.propertyNumber;
        const salePostcode = sale.postcode;
        return saleNumber === propertyNumber && salePostcode === propertyPostcode;
      }).map(sale => ({
        date: sale.date,
        price: sale.price,
        description: `${formatPropertyType(sale.propertyType)} - ${sale.postcode}`
      }));

      if (salesHistory.length === 0) {
        salesHistory.push({
          date: property.date,
          price: property.price,
          description: `${formatPropertyType(property.propertyType)} - ${property.postcode}`
        });
      }

      salesHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setHistoryModal({ 
        isOpen: true, 
        property: {
          ...property,
          salesHistory: salesHistory
        }
      });
      setActiveTab('info');
    }
  };

  const closeHistoryModal = () => {
    setHistoryModal({ isOpen: false, property: null });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#D2B48C] shadow-soft p-6">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-[#E5E5E5] rounded w-1/4"></div>
              <div className="h-4 bg-[#E5E5E5] rounded w-1/6"></div>
              <div className="h-4 bg-[#E5E5E5] rounded w-1/6"></div>
              <div className="h-4 bg-[#E5E5E5] rounded w-1/6"></div>
              <div className="h-4 bg-[#E5E5E5] rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (soldPrices && soldPrices.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#D2B48C] shadow-soft p-12 text-center">
        <div className="text-[#2C6E91] text-lg font-medium mb-2">No properties found</div>
        <div className="text-[#3B755D] text-sm">Try adjusting your search criteria</div>
      </div>
    );
  }

  return (
    <>
      {/* Value Indicator Explanation */}
      <ValueIndicatorExplanation className="mb-4" />
      
      <div className={`bg-white rounded-xl border border-[#D2B48C] shadow-soft overflow-hidden ${className}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F5DC] border-b border-[#D2B48C]">
              <tr>
                <th className="px-4 py-3 text-left">
                  <SortableHeader column="address" label="Address" icon={<MapPin className="w-3 h-3" />} />
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-medium text-[#2C6E91]">Sales Count</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortableHeader column="propertyType" label="Type" icon={<Home className="w-3 h-3" />} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortableHeader column="date" label="Date" icon={<Calendar className="w-3 h-3" />} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortableHeader column="price" label="Price" icon={<PoundSterling className="w-3 h-3" />} />
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-medium text-[#2C6E91]">Value Indicator</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-medium text-[#2C6E91]">Market Trend</span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="text-xs font-medium text-[#2C6E91]">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {soldPrices.map((property, index) => (
                <motion.tr
                  key={property.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-b border-[#E5E5E5] hover:bg-[#F5F5DC]/50 transition-colors cursor-pointer ${
                    selectedRowId === property.id ? 'bg-[#3A7CA5]/10' : ''
                  }`}
                  onClick={() => onRowClick(property)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getPropertyTypeIcon(property.propertyType)}
                      <div>
                        <div className="font-medium text-[#2C6E91] text-sm">
                          {formatShortAddress(property)}
                        </div>
                        <div className="text-xs text-[#3B755D]">
                          {property.postcode}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getSalesCount(property)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#2C6E91]">
                      {formatPropertyType(property.property_type || property.propertyType)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#2C6E91]">
                      {formatDate(property.date)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-[#2C6E91]">
                      {formatPrice(property.price)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getValueIndicator(property.price, property)}
                  </td>
                  <td className="px-4 py-3">
                    {getMarketTrend(property)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openHistoryModal(property);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-[#2C6E91] bg-[#F5F5DC] hover:bg-[#D2B48C] rounded-lg transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="px-4 py-3 bg-[#F5F5DC] border-t border-[#D2B48C] flex items-center justify-between">
            <div className="text-sm text-[#2C6E91]">
              Page {pagination.page} of {Math.ceil((totalProperties || 0) / pagination.size)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm font-medium text-[#2C6E91] bg-white border border-[#D2B48C] rounded-lg hover:bg-[#F5F5DC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(pagination.page + 1, pagination.after_key)}
                disabled={!pagination.has_more}
                className="px-3 py-1 text-sm font-medium text-[#2C6E91] bg-white border border-[#D2B48C] rounded-lg hover:bg-[#F5F5DC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {historyModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#3A7CA5] via-[#2C6E91] to-[#5DA271] text-white p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm shadow-lg">
                      <Home className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-2 drop-shadow-sm">Property History</h2>
                      <p className="text-blue-100 text-lg font-medium">{formatAddress(historyModal.property)}</p>
                    </div>
                  </div>
                  <button
                    onClick={closeHistoryModal}
                    className="text-white hover:text-blue-200 transition-colors p-3 rounded-full hover:bg-white/10 backdrop-blur-sm"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#E5E5E5] bg-gray-50">
                {[
                  { id: 'info', label: 'Info', icon: <Info className="w-4 h-4" /> },
                  { id: 'history', label: 'History', icon: <BarChart3 className="w-4 h-4" /> },
                  { id: 'growth', label: 'Growth', icon: <TrendingUp className="w-4 h-4" /> },
                  { id: 'map', label: 'Map', icon: <Map className="w-4 h-4" /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-[#3A7CA5] text-[#3A7CA5] bg-white shadow-sm'
                        : 'border-transparent text-[#3B755D] hover:text-[#2C6E91] hover:bg-white/50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <div className="bg-[#F5F5DC] border border-[#D2B48C] rounded-lg px-4 py-3 text-[#2C6E91] text-sm">
                      <strong>Sale History:</strong> This shows all recorded sales for this property. Use this data to understand price trends and market performance over time.
                    </div>
                    
                    {/* Total Growth Summary */}
                    {historyModal.property?.salesHistory && historyModal.property.salesHistory.length > 1 && (
                      <div className="bg-gradient-to-r from-blue-50 via-green-50 to-emerald-50 border border-blue-200 rounded-xl p-6 shadow-soft">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-blue-500 to-green-500 p-3 rounded-full shadow-md">
                              <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-[#2C6E91] text-lg mb-1">Total Growth Summary</h4>
                              <p className="text-sm text-[#3B755D] font-medium">
                                From {formatDate(historyModal.property.salesHistory[historyModal.property.salesHistory.length - 1].date)} to {formatDate(historyModal.property.salesHistory[0].date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {(() => {
                              const firstSale = historyModal.property.salesHistory[historyModal.property.salesHistory.length - 1];
                              const lastSale = historyModal.property.salesHistory[0];
                              const totalGrowth = lastSale.price - firstSale.price;
                              const totalGrowthPercentage = firstSale.price > 0 ? (totalGrowth / firstSale.price) * 100 : 0;
                              
                              return (
                                <div className={`text-2xl font-bold ${
                                  totalGrowthPercentage > 0 ? 'text-green-600' : totalGrowthPercentage < 0 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {totalGrowthPercentage > 0 ? '+' : ''}{totalGrowthPercentage.toFixed(1)}%
                                  <div className="text-sm font-semibold text-[#3B755D] mt-1">
                                    {totalGrowth > 0 ? '+' : ''}{formatPrice(totalGrowth)}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                    {historyModal.property?.salesHistory?.map((sale: any, index: number) => {
                      // Calculate growth percentage compared to previous sale
                      let growthPercentage = null;
                      let growthAmount = null;
                      
                      if (index < historyModal.property.salesHistory.length - 1) {
                        const previousSale = historyModal.property.salesHistory[index + 1]; // Next in array is previous chronologically
                        growthAmount = sale.price - previousSale.price;
                        growthPercentage = previousSale.price > 0 ? (growthAmount / previousSale.price) * 100 : 0;
                      }
                      
                      return (
                        <motion.div 
                          key={index} 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-r from-white to-gray-50 border border-[#E5E5E5] rounded-xl p-6 shadow-soft hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="bg-gradient-to-r from-[#3A7CA5] to-[#2C6E91] p-3 rounded-full shadow-md">
                                <Home className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-[#2C6E91] mb-1">
                                  {formatPrice(sale.price)}
                                </div>
                                <div className="text-sm text-[#3B755D] font-medium">
                                  {sale.description || 'No additional details available'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-[#3B755D] mb-2">
                                {formatDate(sale.date)}
                              </div>
                              {growthPercentage !== null && (
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold shadow-sm ${
                                  growthPercentage > 0 
                                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                                    : growthPercentage < 0 
                                    ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200' 
                                    : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
                                }`}>
                                  {growthPercentage > 0 ? (
                                    <TrendingUp className="w-4 h-4" />
                                  ) : growthPercentage < 0 ? (
                                    <TrendingDown className="w-4 h-4" />
                                  ) : (
                                    <Minus className="w-4 h-4" />
                                  )}
                                  <span>{growthPercentage > 0 ? '+' : ''}{growthPercentage.toFixed(1)}%</span>
                                  <span className="text-xs opacity-75">
                                    ({growthAmount > 0 ? '+' : ''}{formatPrice(growthAmount)})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Timeline indicator */}
                          {index < historyModal.property.salesHistory.length - 1 && (
                            <div className="flex justify-center mt-4">
                              <div className="w-0.5 h-6 bg-gradient-to-b from-[#3A7CA5] to-[#5DA271]"></div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'growth' && (
                  <div className="space-y-4">
                    <div className="bg-[#F5F5DC] border border-[#D2B48C] rounded-lg px-4 py-3 text-[#2C6E91] text-sm">
                      <strong>Price Growth:</strong> This chart shows how property values have changed over time in this area.
                    </div>
                    <FullScreenChart>
                      <div className="w-full h-64 bg-white border border-[#E5E5E5] rounded-lg p-4">
                        {historyModal.property?.salesHistory && historyModal.property.salesHistory.length > 1 ? (
                          <svg width="100%" height="100%" viewBox="0 0 400 200">
                            {(() => {
                              const sorted = [...historyModal.property.salesHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                              const prices = sorted.map(s => s.price);
                              const dates = sorted.map(s => new Date(s.date));
                              
                              const width = 360;
                              const height = 160;
                              const padding = 20;
                              
                              const xScale = (date: Date) => {
                                const minDate = Math.min(...dates.map(d => d.getTime()));
                                const maxDate = Math.max(...dates.map(d => d.getTime()));
                                return padding + (date.getTime() - minDate) / (maxDate - minDate) * (width - 2 * padding);
                              };
                              
                              const yScale = (price: number) => {
                                const minPrice = Math.min(...prices);
                                const maxPrice = Math.max(...prices);
                                return height - padding - (price - minPrice) / (maxPrice - minPrice) * (height - 2 * padding);
                              };
                              
                              const points = sorted.map((sale, i) => {
                                const x = xScale(new Date(sale.date));
                                const y = yScale(sale.price);
                                return `${x},${y}`;
                              }).join(' ');
                              
                              return (
                                <>
                                  <polyline
                                    points={points}
                                    fill="none"
                                    stroke="#3A7CA5"
                                    strokeWidth="2"
                                  />
                                  {sorted.map((sale, i) => {
                                    const x = xScale(new Date(sale.date));
                                    const y = yScale(sale.price);
                                    return (
                                      <g key={i}>
                                        <circle cx={x} cy={y} r="4" fill="#3A7CA5" />
                                        <text x={x + 8} y={y - 12} fontSize="12" fill="#2C6E91">{formatPrice(sale.price)}</text>
                                      </g>
                                    );
                                  })}
                                </>
                              );
                            })()}
                          </svg>
                        ) : (
                          <span className="text-[#3B755D]">Not enough data for growth chart</span>
                        )}
                      </div>
                    </FullScreenChart>
                  </div>
                )}

                {activeTab === 'info' && (
                  <div className="w-full max-w-2xl mx-auto px-2">
                    <div className="bg-[#F5F5DC] border border-[#D2B48C] rounded-lg px-4 py-3 mb-4 text-[#2C6E91] text-sm">
                      <strong>About this data:</strong> This section shows <b>past sale data</b> for this property, including price, date, and property details. Use this information to understand historical market trends, compare with current values, and make informed decisions. All data is sourced from official Land Registry records and reflects completed transactions only.
                    </div>
                    
                    {/* Address block */}
                    <div className="flex flex-col items-start mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-5 h-5 text-[#3A7CA5]" />
                        <span className="text-xs text-[#3B755D] font-medium">Address</span>
                      </div>
                      <div className="text-lg font-bold text-[#2C6E91] leading-snug break-words">
                        {formatAddress(historyModal.property)}
                      </div>
                      <div className="text-sm text-[#3B755D] font-mono mt-1">
                        {historyModal.property?.postcode || ''}
                      </div>
                    </div>
                    
                    <div className="border-t border-[#E5E5E5] my-4" />
                    
                    {/* Two-column grid for details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {/* Property Type */}
                      <div className="flex items-center gap-3">
                        <Home className="w-5 h-5 text-[#3A7CA5]" />
                        <div>
                          <div className="text-xs text-[#3B755D] font-medium">Property Type</div>
                          <div className="text-base font-semibold text-[#2C6E91]">
                            {formatPropertyType(historyModal.property?.propertyType)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Tenure */}
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-[#3A7CA5]" />
                        <div>
                          <div className="text-xs text-[#3B755D] font-medium">Tenure</div>
                          <div className="text-base font-semibold text-[#2C6E91]">
                            {historyModal.property?.duration || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Last Sold */}
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-[#3A7CA5]" />
                        <div>
                          <div className="text-xs text-[#3B755D] font-medium">Last Sold</div>
                          <div className="text-base font-semibold text-[#2C6E91]">
                            {historyModal.property?.date ? formatDate(historyModal.property.date) : 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Last Sold Price */}
                      <div className="flex items-center gap-3">
                        <PoundSterling className="w-5 h-5 text-[#3A7CA5]" />
                        <div>
                          <div className="text-xs text-[#3B755D] font-medium">Last Sold Price</div>
                          <div className="text-base font-semibold text-[#2C6E91]">
                            {historyModal.property?.price ? formatPrice(historyModal.property.price) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'map' && (
                  <div className="w-full max-w-2xl mx-auto px-2">
                    <div className="bg-gradient-to-r from-[#F5F5DC] to-[#D2B48C] border border-[#D2B48C] rounded-xl px-6 py-4 mb-6 text-[#2C6E91] text-sm shadow-soft">
                      <div className="flex items-center gap-2">
                        <Map className="w-5 h-5" />
                        <strong>Location Map:</strong> This map shows the approximate location of the property based on the address. Use it to explore the area, check proximity to amenities, and get a sense of the neighbourhood.
                      </div>
                    </div>
                    <div className="relative w-full h-80 rounded-xl overflow-hidden border border-[#E5E5E5] shadow-soft">
                      <iframe
                        title="Google Map"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps?q=${encodeURIComponent(historyModal.property?.postcode || '')}&output=embed&zoom=15`}
                      />
                      {/* Postcode Area Overlay */}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-[#3A7CA5]/20">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-[#5DA271] rounded-full animate-pulse"></div>
                          <span className="text-sm font-semibold text-[#2C6E91]">
                            {historyModal.property?.postcode}
                          </span>
                        </div>
                      </div>
                      {/* Area Boundary Indicator */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-[#5DA271] border-dashed rounded-full opacity-60 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-[#3A7CA5]" />
                        <span className="font-semibold text-[#2C6E91]">Postcode Area: {historyModal.property?.postcode}</span>
                      </div>
                      <p className="text-sm text-[#3B755D]">
                        The map shows the approximate postcode boundary area. The property is located within this zone, and all sales data is filtered to this specific postcode area for accurate market analysis.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GroupedSoldPricesTable; 