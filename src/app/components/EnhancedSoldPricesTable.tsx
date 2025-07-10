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
        // eslint-disable-next-line no-console
        console.log(`[DEBUG] Row ${index}: addressKey=${key}, count=${count}`);
        return null;
      })}
      {/* Table Header */}
      <div className="overflow-x-auto">
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
                  column="price" 
                  label="Price" 
                  icon={<PoundSterling className="w-4 h-4" />}
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                <SortableHeader 
                  column="dateOfTransfer" 
                  label="Sale Date" 
                  icon={<Calendar className="w-4 h-4" />}
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                <div className="flex items-center gap-2 text-left font-semibold text-text-primary">
                  <TrendingUp className="w-4 h-4" />
                  <span>BMV Score</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {soldPrices.map((property, index) => (
              <motion.tr
                key={`${property.paon}-${property.street}-${property.dateOfTransfer}-${index}`}
                className={cn(
                  "border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
                  selectedRowId === `${property.paon}-${property.street}-${property.dateOfTransfer}-${index}` && "bg-primary-50 border-primary-200"
                )}
                onMouseEnter={() => setHoveredRow(`${property.paon}-${property.street}-${property.dateOfTransfer}-${index}`)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onRowClick(property)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <MapPin className="w-4 h-4 text-text-tertiary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-primary line-clamp-2">
                        {formatAddress(property)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
                        <span>{property.postcode}</span>
                        {/* Sales count badge */}
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          {allSales.filter(sale => addressKey(sale) === addressKey(property)).length} sales
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-gray-100 rounded">
                      {getPropertyTypeIcon(property.propertyType)}
                    </div>
                    <span className="text-sm text-text-primary">
                      {formatPropertyType(property.propertyType)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-text-primary">
                    {formatPrice(property.price)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-primary">
                    {formatDate(property.dateOfTransfer)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <BMVScoreBadge score={property.bmvScore || 0} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(property);
                      }}
                      className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Mock history data - in real app, fetch from API
                        const mockHistory = [property];
                        onShowHistory(property, mockHistory);
                      }}
                      className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="View History"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnhancedSoldPricesTable; 