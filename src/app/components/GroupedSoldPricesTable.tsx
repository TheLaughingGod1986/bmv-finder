'use client';

import { useState } from 'react';
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
import { adjustForInflation, getRecentAdjustedPrices } from '@/utils/inflationAdjustment';

interface GroupedSoldPricesTableProps {
  soldPrices: any[];
  onRowClick: (property: any) => void;
  sortConfig: { key: string; direction: 'ascending' | 'descending' };
  onSort: (key: string) => void;
  isLoading: boolean;
  selectedRowId: string | null;
  className?: string;
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
  onRowClick,
  sortConfig,
  onSort,
  isLoading,
  selectedRowId,
  className,
  pagination,
  onPageChange
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean; property: any; sales: any[] }>({
    isOpen: false,
    property: null,
    sales: []
  });

  const formatAddress = (property: any) => {
    return property.address || `${property.paon} ${property.street}, ${property.postcode}`;
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

  const getPriceIndicator = (price: number | null, allSales: any[]) => {
    if (!price) return { 
      label: 'N/A', 
      color: 'gray', 
      bgColor: 'bg-gray-100', 
      textColor: 'text-gray-600', 
      icon: '',
      description: 'Insufficient data for price analysis'
    };
    
    return getEnhancedPriceIndicator(price, allSales, new Date().getFullYear());
  };

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

  if (soldPrices.length === 0) {
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
      <div className={cn("bg-white rounded-xl border border-gray-200 shadow-soft overflow-hidden", className)}>
        {/* Price Indicator Legend */}
        <div className="mb-2 p-2 bg-gray-50 rounded-lg">
          <div className="text-xs font-medium text-gray-700 mb-1">Price Indicators (Based on Last 5 Years + Inflation):</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: '#5DA271', color: '#fff' }}>
              <span>↓</span> Excellent Deal (10%+ below inflation-adjusted median)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800">
              <span>↓</span> Good Deal (5-10% below inflation-adjusted median)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
              <span>→</span> Fair Price (within 5% of inflation-adjusted median)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
              <span>↑</span> Expensive (5-10% above inflation-adjusted median)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800">
              <span>↑</span> Overpriced (10%+ above inflation-adjusted median)
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Based on sales from the last 5 years, adjusted for inflation to current values
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                  <SortableHeader 
                    column="address" 
                    label="Address" 
                    icon={<MapPin className="w-4 h-4" />}
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                  <SortableHeader 
                    column="property_type" 
                    label="Type" 
                    icon={<Home className="w-4 h-4" />}
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                  <SortableHeader 
                    column="date" 
                    label="Latest Sale" 
                    icon={<Calendar className="w-4 h-4" />}
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                  <SortableHeader 
                    column="price" 
                    label="Latest Price" 
                    icon={<PoundSterling className="w-4 h-4" />}
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {soldPrices.map((property, index) => {
                const isSelected = selectedRowId === property.guid;
                const isHovered = hoveredRow === property.guid;
                const hasMultipleSales = property.sales_count > 1;
                
                return (
                  <motion.tr
                    key={`${property.guid}-${index}`}
                    className={cn(
                      "border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
                      isSelected && "bg-primary-50 border-primary-200"
                    )}
                    onClick={() => onRowClick(property)}
                    onMouseEnter={() => setHoveredRow(property.guid)}
                    onMouseLeave={() => setHoveredRow(null)}
                    whileHover={{ backgroundColor: "#f8fafc" }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getPropertyTypeIcon(property.property_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-text-primary truncate">
                            {formatAddress(property)}
                          </div>
                          <div className="text-xs text-text-secondary">
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
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {formatPropertyType(property.property_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">
                      {formatDate(property.date)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm font-semibold text-text-primary">
                        {formatPrice(property.price)}
                      </div>
                      {/* Price Indicator Badge */}
                      {(() => {
                        const indicator = getPriceIndicator(Number(property.price), property.all_sales || []);
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${indicator.bgColor} ${indicator.textColor}`}
                            style={indicator.bgColor.startsWith('bg-[#') ? { background: '#5DA271', color: '#fff' } : {}}>
                            <span className="text-xs">{indicator.icon}</span>
                            {indicator.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {hasMultipleSales && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openHistoryModal(property);
                            }}
                            className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-target"
                            aria-label="View property history"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/${encodeURIComponent(formatAddress(property))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-target"
                          aria-label="View on Google Maps"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
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
          <div className="p-4 space-y-4">
            {soldPrices.map((property, index) => {
              const isSelected = selectedRowId === property.guid;
              const hasMultipleSales = property.sales_count > 1;
              
              return (
                <motion.div
                  key={`${property.guid}-${index}`}
                  className={cn(
                    "bg-white border border-gray-200 rounded-lg p-4 shadow-soft hover:shadow-medium transition-all cursor-pointer",
                    isSelected && "border-primary-300 bg-primary-50"
                  )}
                  onClick={() => onRowClick(property)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  {/* Header with Property Type Icon */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {getPropertyTypeIcon(property.property_type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-text-primary truncate">
                          {formatAddress(property)}
                        </h3>
                        <p className="text-sm text-text-secondary">
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
                          onClick={(e) => {
                            e.stopPropagation();
                            openHistoryModal(property);
                          }}
                          className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-target"
                          aria-label="View property history"
                        >
                          <History className="w-5 h-5" />
                        </button>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(formatAddress(property))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-target"
                        aria-label="View on Google Maps"
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
                      {/* Price Indicator Badge (Mobile) */}
                      {(() => {
                        const indicator = getPriceIndicator(Number(property.price), property.all_sales || []);
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${indicator.bgColor} ${indicator.textColor}`}
                            style={indicator.bgColor.startsWith('bg-[#') ? { background: '#5DA271', color: '#fff' } : {}}>
                            <span className="text-xs">{indicator.icon}</span>
                            {indicator.label}
                          </span>
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
                  <div className="flex items-center gap-3 mb-3">
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
            Page {pagination.page} • {soldPrices.length} results
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
              className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    Sales History
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {formatAddress(historyModal.property)}
                  </p>
                </div>
                <button
                  onClick={closeHistoryModal}
                  className="p-2 text-text-tertiary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  {historyModal.sales.map((sale: any, index: number) => (
                    <div
                      key={`${sale.guid}-${index}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-lg font-bold text-text-primary">
                            {formatPrice(sale.price)}
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {formatPropertyType(sale.property_type)}
                          </span>
                        </div>
                        <div className="text-sm text-text-secondary">
                          {formatDate(sale.date)}
                        </div>
                        <div className="text-xs text-text-tertiary">
                          {sale.transaction_category_label}
                        </div>
                      </div>
                    </div>
                  ))}
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