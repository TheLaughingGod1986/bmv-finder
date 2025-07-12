'use client';

import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { SoldPrice } from '../../../types/sold-price';
import BMVScoreBadge from './BMVScoreBadge';

interface EnhancedSoldPricesTableProps {
  soldPrices: SoldPrice[];
  allSales: SoldPrice[];
  onRowClick: (property: SoldPrice) => void;
  onShowHistory: (property: SoldPrice, history: SoldPrice[]) => void;
  sortConfig: { key: keyof SoldPrice; direction: 'ascending' | 'descending' };
  onSort: (key: keyof SoldPrice) => void;
  isLoading: boolean;
  selectedRowId: string | null;
  className?: string;
}

const EnhancedSoldPricesTable: React.FC<EnhancedSoldPricesTableProps> = ({
  soldPrices,
  onRowClick,
  onShowHistory,
  sortConfig,
  onSort,
  isLoading,
  selectedRowId,
  className,
  allSales
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const formatAddress = (sp: SoldPrice) => {
    const parts = [
      sp.paon,
      sp.saon,
      sp.street,
      sp.locality,
      sp.town_city,
      sp.county
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Helper to normalize address for grouping
  const addressKey = (sp: SoldPrice) =>
    [sp.paon, sp.street, sp.postcode].map(x => (x || '').trim().toLowerCase()).join('|');

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

  const SortableHeader = ({ 
    column, 
    label, 
    icon 
  }: { 
    column: keyof SoldPrice; 
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
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-soft overflow-hidden", className)}>
      {/* Debug: Log addressKey and count for each displayed property */}
      {soldPrices.map((property, index) => {
        const key = addressKey(property);
        const count = allSales.filter(sale => addressKey(sale) === key).length;
        console.log(`[DEBUG] Row ${index}: addressKey=${key}, count=${count}`);
        return null;
      })}
      
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                <SortableHeader 
                  column="paon" 
                  label="Address" 
                  icon={<MapPin className="w-4 h-4" />}
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                <SortableHeader 
                  column="propertyType" 
                  label="Type" 
                  icon={<Home className="w-4 h-4" />}
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                <SortableHeader 
                  column="dateOfTransfer" 
                  label="Date" 
                  icon={<Calendar className="w-4 h-4" />}
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                <SortableHeader 
                  column="price" 
                  label="Price" 
                  icon={<PoundSterling className="w-4 h-4" />}
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                <SortableHeader 
                  column="duration" 
                  label="Duration" 
                  icon={<TrendingUp className="w-4 h-4" />}
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
              const key = addressKey(property);
              const count = allSales.filter(sale => addressKey(sale) === key).length;
              const isSelected = selectedRowId === property.id;
              const isHovered = hoveredRow === property.id;
              
              return (
                <motion.tr
                  key={`${property.id}-${index}`}
                  className={cn(
                    "border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
                    isSelected && "bg-primary-50 border-primary-200"
                  )}
                  onClick={() => onRowClick(property)}
                  onMouseEnter={() => setHoveredRow(property.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  whileHover={{ backgroundColor: "#f8fafc" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {getPropertyTypeIcon(property.propertyType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-text-primary truncate">
                          {formatAddress(property)}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {property.postcode}
                        </div>
                        {count > 1 && (
                          <div className="text-xs text-primary-600 font-medium mt-1">
                            {count} sales at this address
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {formatPropertyType(property.propertyType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-primary">
                    {formatDate(property.dateOfTransfer)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-text-primary">
                      {formatPrice(property.price)}
                    </div>
                                         <BMVScoreBadge score={property.bmvScore || 0} className="mt-1" />
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      property.duration === 'F' ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    )}>
                      {property.duration === 'F' ? 'Freehold' : 'Leasehold'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const history = allSales.filter(sale => addressKey(sale) === key);
                          onShowHistory(property, history);
                        }}
                        className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-target"
                        aria-label="View property history"
                      >
                        <History className="w-4 h-4" />
                      </button>
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
            const key = addressKey(property);
            const count = allSales.filter(sale => addressKey(sale) === key).length;
            const isSelected = selectedRowId === property.id;
            
            return (
              <motion.div
                key={`${property.id}-${index}`}
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
                      {getPropertyTypeIcon(property.propertyType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-text-primary truncate">
                        {formatAddress(property)}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {property.postcode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const history = allSales.filter(sale => addressKey(sale) === key);
                        onShowHistory(property, history);
                      }}
                      className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-target"
                      aria-label="View property history"
                    >
                      <History className="w-5 h-5" />
                    </button>
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
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Price</p>
                    <p className="text-lg font-bold text-text-primary">
                      {formatPrice(property.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Date</p>
                    <p className="text-sm font-medium text-text-primary">
                      {formatDate(property.dateOfTransfer)}
                    </p>
                  </div>
                </div>

                {/* Property Type and Duration */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {formatPropertyType(property.propertyType)}
                  </span>
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                    property.duration === 'F' ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                  )}>
                    {property.duration === 'F' ? 'Freehold' : 'Leasehold'}
                  </span>
                </div>

                                 {/* BMV Score */}
                 <div className="mb-3">
                   <BMVScoreBadge score={property.bmvScore || 0} />
                 </div>

                {/* Multiple Sales Indicator */}
                {count > 1 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {count} sales at this address
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSoldPricesTable; 