'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  MapPin, 
  Calendar, 
  PoundSterling,
  TrendingUp,
  Home,
  Building,
  Layers,
  Eye,
  History,
  ExternalLink,
  Clock,
  TrendingDown,
  Target,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { SoldPrice } from '../../../types/sold-price';
import BMVScoreBadge from './BMVScoreBadge';
import { getEnhancedPriceIndicator, getPriceIndicatorLegend } from '@/utils/priceIndicator';
import PriceIndicatorLegend from './PriceIndicatorLegend';
import EnhancedPriceIndicatorLegend from './EnhancedPriceIndicatorLegend';
import HpiDataCard from './HpiDataCard';

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
  className,
  postcode,
  pagination,
  onPageChange
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean; property: any; sales: any[] }>({
    isOpen: false,
    property: null,
    sales: []
  });
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'growth' | 'map'>('info');
  // Remove PROPERTY_TYPE_OPTIONS, propertyTypeFilter, and filteredSoldPrices

  const formatAddress = (property: any) => {
    return property.address || `${property.paon} ${property.street}, ${property.postcode}`;
  };

  const formatShortAddress = (property: any) => {
    // Try to extract house number, street, and postcode
    const paon = property.paon || '';
    const street = property.street || '';
    const postcode = property.postcode || '';
    // Remove extra commas and spaces
    return `${paon} ${street}`.replace(/\s+,/g, ',').replace(/,+/g, ',').replace(/\s+/g, ' ').trim() + (postcode ? `, ${postcode}` : '');
  };

  const formatPropertyType = (type: string) => {
    const types: { [key: string]: string } = {
      'D': 'Detached',
      'S': 'Semi-Detached',
      'T': 'Terraced',
      'F': 'Flat/Maisonette',
      'O': 'Other'
    };
    return types[type] || type;
  };

  const getPropertyTypeIcon = (type: string) => {
    const icons = {
      'D': <Home className="w-4 h-4" />,
      'S': <Building className="w-4 h-4" />,
      'T': <Layers className="w-4 h-4" />,
      'F': <Building className="w-4 h-4" />,
      'O': <Home className="w-4 h-4" />
    };
    return icons[type as keyof typeof icons] || <Home className="w-4 h-4" />;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const [priceIndicators, setPriceIndicators] = useState<Record<string, any>>({});

  const getPriceIndicator = (price: number | null, property: any) => {
    if (!price) return { 
      label: 'N/A', 
      color: 'gray', 
      bgColor: 'bg-gray-100', 
      textColor: 'text-gray-600', 
      icon: '',
      description: 'Insufficient data for price analysis'
    };
    
    // Use cached indicator if available
    const cacheKey = `${property.postcode}-${property.property_type}-${price}`;
    if (priceIndicators[cacheKey]) {
      return priceIndicators[cacheKey];
    }
    
    // Fallback to basic indicator while loading
    return getEnhancedPriceIndicator(price, [], new Date().getFullYear());
  };

  // Fetch enhanced price indicators for all properties
  useEffect(() => {
    const fetchPriceIndicators = async () => {
      if (!soldPrices || soldPrices.length === 0) return;
      
      const newIndicators: Record<string, any> = {};
      
      for (const property of soldPrices) {
        if (!property.price || !property.postcode || !property.property_type) continue;
        
        try {
          const response = await fetch(
            `/api/enhanced-price-indicator?postcode=${encodeURIComponent(property.postcode)}&price=${property.price}&propertyType=${property.property_type}`
          );
          
          if (response.ok) {
            const data = await response.json();
            const cacheKey = `${property.postcode}-${property.property_type}-${property.price}`;
            newIndicators[cacheKey] = data.indicator;
          }
        } catch (error) {
          console.error('Error fetching enhanced price indicator:', error);
        }
      }
      
      setPriceIndicators(newIndicators);
    };
    
    fetchPriceIndicators();
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
      className="flex items-center gap-2 text-left font-semibold text-text-primary hover:text-primary-600 transition-colors group"
    >
      {icon && <span className="text-text-tertiary group-hover:text-primary-600">{icon}</span>}
      <span>{label}</span>
      <div className="flex flex-col">
        <ArrowUp 
          className={cn(
            "w-3 h-3",
            sortConfig.key === column && sortConfig.direction === 'ascending' 
              ? "text-primary-600" 
              : "text-text-tertiary"
          )} 
        />
        <ArrowDown 
          className={cn(
            "w-3 h-3 -mt-1",
            sortConfig.key === column && sortConfig.direction === 'descending' 
              ? "text-primary-600" 
              : "text-text-tertiary"
          )} 
        />
      </div>
    </button>
  );

  const openHistoryModal = (property: any) => {
    setHistoryModal({
      isOpen: true,
      property,
      sales: property.all_sales || []
    });
  };

  const closeHistoryModal = () => {
    setHistoryModal({ isOpen: false, property: null, sales: [] });
  };

  // --- Summary Card Calculations ---
  const totalPropsValue = typeof totalProperties === 'number' ? totalProperties : (soldPrices ? soldPrices.length : 0);
  const currentYear = new Date().getFullYear();
  const soldThisYear = soldPrices ? soldPrices.filter(p => {
    if (!p.date) return false;
    const d = new Date(p.date);
    return d.getFullYear() === currentYear;
  }).length : 0;
  const typeCounts: Record<string, number> = {};
  if (soldPrices) {
    soldPrices.forEach(p => {
      const t = p.property_type || 'Other';
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
  }
  let mostCommonType = 'N/A';
  let mostCommonTypeCount = 0;
  for (const t in typeCounts) {
    if (typeCounts[t] > mostCommonTypeCount) {
      mostCommonType = t;
      mostCommonTypeCount = typeCounts[t];
    }
  }
  const typeLabels: Record<string, string> = {
    'D': 'Detached',
    'S': 'Semi-Detached',
    'T': 'Terraced',
    'F': 'Flat/Maisonette',
    'O': 'Other',
    'N/A': 'N/A'
  };
  // --- End Summary Card Calculations ---

  // Remove PROPERTY_TYPE_OPTIONS, propertyTypeFilter, and filteredSoldPrices

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (soldPrices && soldPrices.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-12 text-center">
        <div className="text-text-tertiary mb-4">
          <Home className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">No properties found</h3>
        <p className="text-text-secondary">Try adjusting your search criteria or filters</p>
      </div>
    );
  }

  return (
    <>
      {/* HPI Data Card Section - Above Summary Cards */}
      {postcode && (
        <div className="w-full mb-6">
          <HpiDataCard postcode={postcode} />
        </div>
      )}

      {/* Summary Cards Section */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow p-4 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-500 mb-1">Total Properties</span>
          <span className="text-2xl font-bold text-primary-700">{totalPropsValue}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow p-4 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-500 mb-1">Sold This Year</span>
          <span className="text-2xl font-bold text-green-700">{soldThisYear}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow p-4 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-500 mb-1">Most Common Type</span>
          <span className="text-2xl font-bold text-blue-700">{typeLabels[mostCommonType] || mostCommonType}</span>
        </div>
      </div>

      <div className={cn("bg-white rounded-2xl shadow-lg overflow-x-auto border border-gray-100", className)}>
        {/* Enhanced Price Indicator Legend - Accordion Style */}
        <div className="mb-6 w-full">
          <EnhancedPriceIndicatorLegend />
        </div>

        {/* Property Type Filter Dropdown */}
        {/* Remove the dropdown and use soldPrices directly everywhere */}

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 min-w-[1100px]">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-base font-semibold text-text-primary bg-gray-50">{/* Larger font */}
                  <SortableHeader 
                    column="address" 
                    label="Address" 
                    icon={<MapPin className="w-4 h-4" />} 
                  />
                </th>
                <th className="px-6 py-4 text-left text-base font-semibold text-text-primary bg-gray-50">
                  <SortableHeader 
                    column="property_type" 
                    label="Type" 
                    icon={<Home className="w-4 h-4" />} 
                  />
                </th>
                <th className="px-6 py-4 text-left text-base font-semibold text-text-primary bg-gray-50">
                  <SortableHeader 
                    column="date" 
                    label="Latest Sale" 
                    icon={<Calendar className="w-4 h-4" />} 
                  />
                </th>
                <th className="px-6 py-4 text-left text-base font-semibold text-text-primary bg-gray-50">{/* Left align price */}
                  <SortableHeader 
                    column="price" 
                    label="Latest Price" 
                    icon={<PoundSterling className="w-4 h-4" />} 
                  />
                </th>
                <th className="px-6 py-4 text-left text-base font-semibold text-text-primary bg-gray-50">
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {soldPrices && soldPrices.map((property, index) => {
                const isSelected = selectedRowId === property.guid;
                const isHovered = hoveredRow === property.guid;
                const hasMultipleSales = property.sales_count > 1;
                return (
                  <motion.tr
                    key={`${property.guid}-${index}`}
                    className={cn(
                      "border-b border-gray-100 hover:bg-blue-50/40 transition-colors cursor-pointer group",
                      isSelected && "bg-primary-50 border-primary-200"
                    )}
                    onClick={() => onRowClick(property)}
                    onMouseEnter={() => setHoveredRow(property.guid)}
                    onMouseLeave={() => setHoveredRow(null)}
                    whileHover={{ backgroundColor: "#f0f6fa" }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <td className="px-6 py-5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getPropertyTypeIcon(property.property_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-base font-medium text-text-primary truncate" title={formatAddress(property)}>
                            {formatShortAddress(property)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {property.postcode}
                          </div>
                          {hasMultipleSales && (
                            <div className="text-xs text-primary-600 font-medium mt-1 flex items-center gap-1">
                              <History className="w-3 h-3" />
                              {property.sales_count} sales at this address
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {formatPropertyType(property.property_type)}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-middle text-sm text-text-primary">
                      {formatDate(property.date)}
                    </td>
                    <td className="px-4 py-5 align-middle text-left">
                      <div className="flex flex-col items-start gap-1 text-left">
                        <span className="text-base font-semibold text-text-primary leading-tight text-left">
                        {formatPrice(property.price)}
                        </span>
                      {/* Price Indicator Badge with Enhanced Context */}
                      {(() => {
                        const indicator = getPriceIndicator(Number(property.price), property);
                        const saleDate = new Date(property.date);
                        const yearsAgo = new Date().getFullYear() - saleDate.getFullYear();
                        const isHistorical = yearsAgo > 2;
                        
                        const tooltipText = isHistorical 
                          ? `${indicator.description}\n\n📅 Sold ${yearsAgo} years ago - this shows if it would be a good deal TODAY at that price.\n\n💡 Historical context: This might have been a great deal at the time!`
                          : indicator.description;
                        
                        return (
                          <div className="flex items-center gap-1">
                            <span 
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${indicator.bgColor} ${indicator.textColor} cursor-help`}
                              style={indicator.bgColor.startsWith('bg-[#') ? { background: '#5DA271', color: '#fff' } : {}} 
                              title={tooltipText}
                            >
                              <span className="text-xs">{indicator.icon}</span>
                              {indicator.label}
                            </span>
                            {isHistorical && (
                              <span className="text-xs text-gray-500" title="Historical sale - see tooltip for context">
                                📅
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <div className="flex items-center gap-2">
                          <button
                          onClick={e => { e.stopPropagation(); setActiveTab('info'); openHistoryModal(property); }}
                          className="px-3 py-1 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg border border-primary-100 transition-colors"
                          aria-label="View Info & Map"
                        >
                          View Info & Map
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          <div className="space-y-4">
                          {soldPrices && soldPrices.map((property, index) => {
              const isSelected = selectedRowId === property.guid;
              const hasMultipleSales = property.sales_count > 1;
              return (
                <motion.div
                  key={`${property.guid}-${index}`}
                  className={cn(
                    "bg-white border border-gray-100 rounded-xl p-4 shadow-md hover:shadow-lg transition-all cursor-pointer",
                    isSelected && "border-primary-300 bg-primary-50"
                  )}
                  onClick={() => onRowClick(property)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  {/* Header with Property Type Icon */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {getPropertyTypeIcon(property.property_type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-text-primary truncate">
                          {formatAddress(property)}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {property.postcode}
                        </p>
                        {hasMultipleSales && (
                          <div className="text-xs text-primary-600 font-medium mt-1 flex items-center gap-1">
                            <History className="w-3 h-3" />
                            {property.sales_count} sales at this address
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasMultipleSales && (
                        <button
                          onClick={e => { e.stopPropagation(); openHistoryModal(property); }}
                          className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-target"
                          aria-label="View property history"
                          title="View property history"
                        >
                          <History className="w-5 h-5" />
                        </button>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(formatAddress(property))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-target"
                        aria-label="View on Google Maps"
                        title="View on Google Maps"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <p className="text-xs text-text-tertiary uppercase tracking-wide mb-0.5">Latest Price</p>
                      <p className="text-lg font-bold text-text-primary">
                        {formatPrice(property.price)}
                      </p>
                      {/* Price Indicator Badge (Mobile) with Enhanced Context */}
                      {(() => {
                        const indicator = getPriceIndicator(Number(property.price), property);
                        const saleDate = new Date(property.date);
                        const yearsAgo = new Date().getFullYear() - saleDate.getFullYear();
                        const isHistorical = yearsAgo > 2;
                        
                        const tooltipText = isHistorical 
                          ? `${indicator.description}\n\n📅 Sold ${yearsAgo} years ago - this shows if it would be a good deal TODAY at that price.\n\n💡 Historical context: This might have been a great deal at the time!`
                          : indicator.description;
                        
                        return (
                          <div className="flex justify-start mt-1">
                            <div className="flex items-center gap-1">
                              <span 
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${indicator.bgColor} ${indicator.textColor} cursor-help`}
                                style={indicator.bgColor.startsWith('bg-[#') ? { background: '#5DA271', color: '#fff' } : {}} 
                                title={tooltipText}
                              >
                                <span className="text-xs">{indicator.icon}</span>
                                {indicator.label}
                              </span>
                              {isHistorical && (
                                <span className="text-xs text-gray-500" title="Historical sale - see tooltip for context">
                                  📅
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Latest Sale</p>
                      <p className="text-sm font-medium text-text-primary">
                        {formatDate(property.date)}
                      </p>
                    </div>
                  </div>

                  {/* Property Type */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {formatPropertyType(property.property_type)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-text-secondary">
                            Page {pagination.page} • {soldPrices ? soldPrices.length : 0} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className={cn(
                "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                pagination.page <= 1
                  ? "text-text-tertiary bg-gray-100 cursor-not-allowed"
                  : "text-text-primary bg-white border border-gray-300 hover:bg-gray-50"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1, pagination.after_key)}
              disabled={!pagination.has_more}
              className={cn(
                "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                !pagination.has_more
                  ? "text-text-tertiary bg-gray-100 cursor-not-allowed"
                  : "text-text-primary bg-white border border-gray-300 hover:bg-gray-50"
              )}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {historyModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={closeHistoryModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-gray-100"
            >
              {/* Modal Header */}
              <div className="px-8 pt-8 pb-4 flex flex-col gap-2 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-primary-700 mb-1">Property Details</h3>
                    <div className="text-lg font-medium text-gray-800 break-words leading-snug">
                      {historyModal.property?.address?.split(',').slice(0, -1).join(',') || formatAddress(historyModal.property)}
                    </div>
                    <div className="text-base text-gray-500 font-mono mt-1">{historyModal.property?.postcode || ''}</div>
                </div>
                <button
                  onClick={closeHistoryModal}
                    className="p-2 text-text-tertiary hover:text-primary-700 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close modal"
                >
                    <X className="w-6 h-6" />
                </button>
                </div>
              </div>

              {/* Modal Tabs */}
              <div>
                <div className="flex border-b border-gray-100 bg-gray-50 px-8 gap-4">
                  {['info', 'history', 'growth', 'map'].map(tab => (
                    <button
                      key={tab}
                      className={`py-2 px-6 rounded-full font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400
                        ${activeTab === tab
                          ? 'bg-primary-50 text-primary-700 shadow-sm'
                          : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-primary-700'}`}
                      style={{ marginBottom: activeTab === tab ? '-1px' : undefined, borderBottom: activeTab === tab ? '3px solid #3A7CA5' : '3px solid transparent' }}
                      onClick={() => setActiveTab(tab as typeof activeTab)}
                      aria-current={activeTab === tab ? 'page' : undefined}
                    >
                      {tab === 'info' ? 'Property Information' : tab === 'history' ? 'Sale History' : tab === 'growth' ? 'Growth' : 'Map'}
                    </button>
                  ))}
                </div>
                <div className="p-8 overflow-y-auto max-h-[60vh] bg-white">
                  {activeTab === 'history' && (
                    <div className="flex flex-col gap-6 relative w-full max-w-2xl mx-auto px-2">
                      {/* Consistent spacing and grid for Sale History */}
                      {/* Calculate total gain */}
                      {(() => {
                        const sorted = [...historyModal.sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                        if (sorted.length > 1) {
                          const first = Number(sorted[0].price);
                          const last = Number(sorted[sorted.length - 1].price);
                          const totalGain = ((last - first) / first) * 100;
                          return (
                            <div className="flex items-center gap-2 pb-2 pt-2">
                              <span className="text-sm font-semibold text-gray-600">Total Gain:</span>
                              <span className={
                                totalGain > 0 ? 'text-green-600 font-bold' : totalGain < 0 ? 'text-red-600 font-bold' : 'text-gray-600 font-bold'
                              }>
                                {totalGain > 0 ? '+' : ''}{totalGain.toFixed(1)}%
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {(() => {
                        const sorted = [...historyModal.sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                        return sorted.map((sale, index) => {
                          const prev = index > 0 ? Number(sorted[index - 1].price) : null;
                          const pct = prev ? ((Number(sale.price) - prev) / prev) * 100 : null;
                          return (
                            <div key={`${sale.guid}-${index}`} className="relative flex items-center gap-4">
                              {/* Timeline dot/line */}
                              <div className="flex flex-col items-center">
                                <span className="w-3 h-3 rounded-full bg-primary-500 border-2 border-white shadow" />
                                {index < sorted.length - 1 && (
                                  <span className="w-0.5 flex-1 bg-gray-200" style={{ minHeight: 32 }} />
                                )}
                              </div>
                      <div className="flex-1">
                                <div className="bg-gray-50 rounded-xl shadow-sm px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 items-center">
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold text-primary-700">{formatPrice(sale.price)}</span>
                                    {pct !== null && (
                                      <span className={
                                        'ml-2 text-sm font-semibold ' +
                                        (pct > 0 ? 'text-green-600' : pct < 0 ? 'text-red-600' : 'text-gray-500')
                                      }>
                                        {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                                      </span>
                                    )}
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
                                      {formatPropertyType(sale.property_type)}
                                    </span>
                                  </div>
                                  <div className="flex flex-col md:items-end gap-1">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-primary-500" />
                                      <span className="text-base text-gray-700 font-medium">{formatDate(sale.date)}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">{sale.transaction_category_label}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                  {activeTab === 'growth' && (
                    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-2">
                      <span className="mb-4 font-semibold text-lg text-primary-700">Sale Price Growth</span>
                      {/* Chart area with grid */}
                      <div className="relative w-full max-w-2xl bg-gray-50 rounded-xl shadow-inner p-4">
                        {historyModal.sales && historyModal.sales.length > 1 ? (
                          <svg width="100%" height="220" viewBox="0 0 340 220" className="w-full h-56">
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                              <line key={i} x1="50" x2="320" y1={40 + t * 140} y2={40 + t * 140} stroke="#F0F0F0" strokeDasharray="4 2" />
                            ))}
                            {/* Y axis */}
                            <line x1="50" x2="50" y1={40} y2={180} stroke="#E5E5E5" />
                            {/* Y axis min/max labels */}
                            {(() => {
                              const sorted = [...historyModal.sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                              const prices = sorted.map(s => Number(s.price));
                              const min = Math.min(...prices);
                              const max = Math.max(...prices);
                              return [
                                <text key="min" x={40} y={180} fontSize="12" fill="#888" textAnchor="end">{formatPrice(min)}</text>,
                                <text key="max" x={40} y={50} fontSize="12" fill="#888" textAnchor="end">{formatPrice(max)}</text>
                              ];
                            })()}
                            {/* Y axis label */}
                            <text x="20" y="30" fontSize="13" fill="#888" textAnchor="start" fontWeight="bold">Price</text>
                            {/* X axis label */}
                            <text x="320" y="210" fontSize="13" fill="#888" textAnchor="end" fontWeight="bold">Date</text>
                            {(() => {
                              // Prepare data
                              const sorted = [...historyModal.sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                              const prices = sorted.map(s => Number(s.price));
                              const min = Math.min(...prices);
                              const max = Math.max(...prices);
                              // Padding for chart
                              const chartW = 270, chartH = 140, x0 = 50, y0 = 40;
                              // X positions
                              const xs = prices.map((_, i) => x0 + (i / (prices.length - 1 || 1)) * chartW);
                              // Y positions
                              const ys = prices.map(p => y0 + chartH - ((p - min) / (max - min || 1)) * chartH);
                              // Bezier curve path
                              function getSmoothPath(xs: number[], ys: number[]) {
                                if (xs.length < 2) return '';
                                let d = `M${xs[0]},${ys[0]}`;
                                for (let i = 1; i < xs.length; i++) {
                                  const xMid = (xs[i - 1] + xs[i]) / 2;
                                  d += ` Q${xMid},${ys[i - 1]} ${xs[i]},${ys[i]}`;
                                }
                                return d;
                              }
                              // X axis labels: only show first, last, and (if >3) one or two middle
                              let labelIdxs = [0];
                              if (prices.length > 3) {
                                labelIdxs.push(Math.floor((prices.length - 1) / 2));
                                if (prices.length > 4) labelIdxs.push(Math.ceil((prices.length - 1) / 2));
                              }
                              labelIdxs.push(prices.length - 1);
                              labelIdxs = Array.from(new Set(labelIdxs)).sort((a, b) => a - b);
                              return (
                                <>
                                  {/* Smooth line */}
                                  <path
                                    d={getSmoothPath(xs, ys)}
                                    fill="none"
                                    stroke="#3A7CA5"
                                    strokeWidth="3"
                                  />
                                  {/* Dots */}
                                  {xs.map((x, i) => (
                                    <circle
                                      key={i}
                                      cx={x}
                                      cy={ys[i]}
                                      r={i === xs.length - 1 ? 7 : 5}
                                      fill={i === xs.length - 1 ? '#2563eb' : '#3A7CA5'}
                                      stroke="#fff"
                                      strokeWidth="2"
                                      style={{ filter: i === xs.length - 1 ? 'drop-shadow(0 2px 6px #2563eb33)' : undefined }}
                                    />
                                  ))}
                                  {/* Price labels above/right of dots with white outline */}
                                  {xs.map((x, i) => (
                                    <g key={i}>
                                      <text x={x + 8} y={ys[i] - 12} fontSize="13" fontWeight="bold" textAnchor="start" stroke="#fff" strokeWidth="4" paintOrder="stroke" style={{ pointerEvents: 'none' }}>{formatPrice(prices[i])}</text>
                                      <text x={x + 8} y={ys[i] - 12} fontSize="13" fontWeight="bold" textAnchor="start" fill={i === xs.length - 1 ? '#2563eb' : '#2C6E91'} style={{ pointerEvents: 'none' }}>{formatPrice(prices[i])}</text>
                                    </g>
                                  ))}
                                  {/* X axis labels */}
                                  {labelIdxs.map(i => (
                                    <text key={i} x={xs[i]} y={200} fontSize="12" textAnchor="middle" fill="#888">{formatDate(sorted[i].date)}</text>
                                  ))}
                                </>
                              );
                            })()}
                          </svg>
                        ) : (
                          <span className="text-gray-500">Not enough data for growth chart</span>
                        )}
                      </div>
                    </div>
                  )}
                  {activeTab === 'info' && (
                    <div className="w-full max-w-2xl mx-auto px-2">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-4 text-blue-900 text-sm">
                        <strong>About this data:</strong> This section shows <b>past sale data</b> for this property, including price, date, and property details. Use this information to understand historical market trends, compare with current values, and make informed decisions. All data is sourced from official Land Registry records and reflects completed transactions only.
                      </div>
                      {/* Address block */}
                      <div className="flex flex-col items-start mb-6">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-5 h-5 text-primary-500" />
                          <span className="text-xs text-gray-500 font-medium">Address</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 leading-snug break-words">{formatAddress(historyModal.property)}</div>
                        <div className="text-sm text-gray-500 font-mono mt-1">{historyModal.property?.postcode || ''}</div>
                      </div>
                      <div className="border-t border-gray-200 my-4" />
                      {/* Two-column grid for details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {/* Property Type */}
                        <div className="flex items-center gap-3">
                          <Home className="w-5 h-5 text-primary-500" />
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Property Type</div>
                            <div className="text-base font-semibold text-gray-900">{formatPropertyType(historyModal.property?.property_type)}</div>
                          </div>
                        </div>
                        {/* Tenure */}
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-5 h-5 text-primary-500" />
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Tenure</div>
                            <div className="text-base font-semibold text-gray-900">{historyModal.property?.duration || 'N/A'}</div>
                          </div>
                        </div>
                        {/* Last Sold */}
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-primary-500" />
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Last Sold</div>
                            <div className="text-base font-semibold text-gray-900">{historyModal.property?.date ? formatDate(historyModal.property.date) : 'N/A'}</div>
                          </div>
                        </div>
                        {/* Last Sold Price */}
                        <div className="flex items-center gap-3">
                          <PoundSterling className="w-5 h-5 text-primary-500" />
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Last Sold Price</div>
                            <div className="text-base font-semibold text-gray-900">{historyModal.property?.price ? formatPrice(historyModal.property.price) : 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'map' && (
                    <div className="w-full max-w-2xl mx-auto px-2">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-4 text-blue-900 text-sm">
                        <strong>Location Map:</strong> This map shows the approximate location of the property based on the address. Use it to explore the area, check proximity to amenities, and get a sense of the neighbourhood.
                      </div>
                      <div className="w-full h-72 rounded-lg overflow-hidden border border-gray-200 shadow">
                        <iframe
                          title="Google Map"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://www.google.com/maps?q=${encodeURIComponent(formatAddress(historyModal.property))}&output=embed`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GroupedSoldPricesTable; 