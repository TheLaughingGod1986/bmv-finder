'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronRight, 
  MapPin, 
  Calendar,
  PoundSterling,
  Home,
  TrendingUp,
  Building,
  Layers,
  Target
} from 'lucide-react';
import { SoldPrice } from '../../../types/sold-price';
import { cn } from '../../lib/utils';
import BMVScoreBadge from './BMVScoreBadge';

interface EnhancedSoldPricesTableProps {
  soldPrices: SoldPrice[];
  allSoldPrices: SoldPrice[];
  formatAddress: (sp: SoldPrice) => string;
  formatDuration: (duration: string) => string;
  formatPropertyType: (type: string) => string;
  requestSort: (key: keyof SoldPrice) => void;
  sortConfig: { key: keyof SoldPrice; direction: string };
  getHasHistory: (property: SoldPrice) => boolean;
  isDateSortDisabled: boolean;
  onShowHistory: (property: SoldPrice, history: SoldPrice[]) => void;
  selectedRowId?: string | null;
  onRowClick?: (property: SoldPrice) => void;
  isLoading: boolean;
}

const EnhancedSoldPricesTable: React.FC<EnhancedSoldPricesTableProps> = React.memo(({
  soldPrices,
  allSoldPrices,
  formatAddress,
  formatDuration,
  formatPropertyType,
  requestSort,
  sortConfig,
  getHasHistory,
  isDateSortDisabled,
  onShowHistory,
  selectedRowId,
  onRowClick,
  isLoading
}) => {
  // Cards/table view mode removed; always show table view

  // Use soldPrices directly (already paginated by API)
  const paginatedSoldPrices = soldPrices;

  const normalize = (str: string | undefined | null) => (str ?? '').trim().toUpperCase();
  const normalizeSaon = (saon: string | undefined | null) => {
    const val = (saon ?? '').trim().toUpperCase();
    return val === '' ? '-' : val;
  };

  const handleShowHistory = (property: SoldPrice) => {
    // Improved: match on postcode, street, paon, and treat empty/missing saon as equivalent
    const history = allSoldPrices.filter(sp =>
      normalize(sp.postcode) === normalize(property.postcode) &&
      normalize(sp.street) === normalize(property.street) &&
      normalize(sp.paon) === normalize(property.paon) &&
      normalizeSaon(sp.saon) === normalizeSaon(property.saon)
    );
    onShowHistory(property, history);
  };

  const formatPrice = (price: number) => price ? `£${price.toLocaleString()}` : 'N/A';

  const SortableHeader: React.FC<{
    title: string;
    sortKey: keyof SoldPrice;
    requestSort: (key: keyof SoldPrice) => void;
    sortConfig: { key: keyof SoldPrice; direction: string };
    disabled?: boolean;
    disabledTooltip?: string;
    icon?: React.ReactNode;
  }> = ({ title, sortKey, requestSort, sortConfig, disabled = false, disabledTooltip, icon }) => {
    const isSorted = sortConfig.key === sortKey;
    const sortIcon = isSorted ? (sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : <ChevronRight className="h-4 w-4 text-gray-300" />;

    return (
      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
        <button
          type="button"
          onClick={() => requestSort(sortKey)}
          className="flex items-center space-x-1 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-800 transition-colors"
          disabled={disabled}
          title={disabled ? disabledTooltip : `Sort by ${title}`}
        >
          {icon && <span className="mr-1">{icon}</span>}
          <span>{title}</span>
          <span className={cn("transition-colors", isSorted ? "text-blue-600" : "text-gray-400")}>
            {sortIcon}
          </span>
        </button>
      </th>
    );
  };

  // Table View
  const TableView = () => (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-lg relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-2xl animate-fade-in">
          <span className="text-blue-600 text-lg font-semibold">Loading...</span>
        </div>
      )}
      <motion.table
        className="min-w-full divide-y divide-slate-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <thead className="bg-slate-50">
          <tr>
            <SortableHeader 
              title="Address" 
              sortKey="street" 
              requestSort={requestSort} 
              sortConfig={sortConfig}
              icon={<MapPin className="h-4 w-4" />}
            />
            <SortableHeader 
              title="Date" 
              sortKey="dateOfTransfer" 
              requestSort={requestSort} 
              sortConfig={sortConfig}
              disabled={isDateSortDisabled}
              disabledTooltip="Sorting disabled: all results are from the same year"
              icon={<Calendar className="h-4 w-4" />}
            />
            <SortableHeader 
              title="Price" 
              sortKey="price" 
              requestSort={requestSort} 
              sortConfig={sortConfig}
              icon={<PoundSterling className="h-4 w-4" />}
            />
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>Type</span>
              </div>
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tenure</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>BMV Score</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedSoldPrices.map((property, index) => (
            <tr
              key={`${property.id}-${index}`}
              className={cn(
                'group cursor-pointer transition-colors',
                selectedRowId === property.id ? 'bg-blue-50/60' : '',
                index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              )}
              onClick={() => onRowClick?.(property)}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') onRowClick?.(property);
              }}
              aria-selected={selectedRowId === property.id}
            >
              <td className="px-6 py-5">
                <div className="max-w-xs">
                  <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {formatAddress(property)}
                  </div>
                  <div className="text-sm text-slate-500 font-mono">
                    {property.postcode}
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 text-slate-700 whitespace-nowrap">
                {new Date(property.dateOfTransfer).toLocaleDateString('en-GB')}
              </td>
              <td className="px-6 py-5">
                <div className="text-right">
                  <div className="text-xl font-bold text-green-700">
                    {formatPrice(property.price)}
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="text-slate-600">
                    {getPropertyTypeIcon(property.propertyType)}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                    {formatPropertyType(property.propertyType)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  property.duration === 'F' ? "bg-green-50 text-green-800" : "bg-blue-50 text-blue-800"
                )}>
                  {formatDuration(property.duration)}
                </span>
              </td>
              <td className="px-6 py-5">
                <BMVScoreBadge property={property} allProperties={allSoldPrices} showTooltip={false} />
              </td>
            </tr>
          ))}
        </tbody>
      </motion.table>
    </div>
  );

  const getPropertyTypeIcon = (type: string) => {
    const icons = {
      'D': <Home className="h-4 w-4" />,
      'S': <Building className="h-4 w-4" />,
      'T': <Layers className="h-4 w-4" />,
      'F': <Building className="h-4 w-4" />,
      'O': <Home className="h-4 w-4" />,
    };
    return icons[type as keyof typeof icons] || <Home className="h-4 w-4" />;
  };

  if (!soldPrices.length) {
    return (
      <div className="text-center py-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center"
        >
          <Home className="w-12 h-12 text-gray-400" />
        </motion.div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800">No Sold Prices Found</h3>
        <p className="text-gray-600">Try adjusting your filters or search for a different postcode or area.</p>
      </div>
    );
  }

  return <TableView />;
});

EnhancedSoldPricesTable.displayName = 'EnhancedSoldPricesTable';

export default EnhancedSoldPricesTable; 