'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Calendar,
  PoundSterling,
  Home,
  TrendingUp
} from 'lucide-react';
import { SoldPrice } from '../../../types/sold-price';
import { cn, getPropertyTypeIcon, getPropertyTypeLabel, getPriceRangeColor } from '../../lib/utils';

interface EnhancedSoldPricesTableProps {
  soldPrices: SoldPrice[];
  formatAddress: (sp: SoldPrice) => string;
  formatDuration: (duration: string) => string;
  formatPropertyType: (type: string) => string;
  handleShowHistory: (id: string) => void;
  requestSort: (key: keyof SoldPrice) => void;
  sortConfig: { key: keyof SoldPrice; direction: string };
  getHasHistory: (property: SoldPrice) => boolean;
  isDateSortDisabled: boolean;
  priceRange: { min: number; max: number };
}

const EnhancedSoldPricesTable: React.FC<EnhancedSoldPricesTableProps> = React.memo(({
  soldPrices,
  formatAddress,
  formatDuration,
  formatPropertyType,
  handleShowHistory,
  requestSort,
  sortConfig,
  getHasHistory,
  isDateSortDisabled,
  priceRange
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const totalPages = Math.ceil(soldPrices.length / pageSize);
  
  const paginatedSoldPrices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return soldPrices.slice(start, start + pageSize);
  }, [soldPrices, page, pageSize]);

  React.useEffect(() => { 
    setPage(1); 
  }, [soldPrices]);

  const handlePrev = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages, p + 1));

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

  const PropertyCard = ({ property, index }: { property: SoldPrice; index: number }) => {
    const hasHistory = getHasHistory(property);
    const priceColor = getPriceRangeColor(property.price, priceRange.min, priceRange.max);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-all duration-200"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
              {formatAddress(property)}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>{property.postcode}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {getPropertyTypeIcon(property.property_type)}
            <span className="text-xs text-gray-500">
              {getPropertyTypeLabel(property.property_type)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center">
            <div className={cn("text-lg font-bold", priceColor)}>
              {property.price}
            </div>
            <div className="text-xs text-gray-500">Price</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-700">
              {property.date_of_transfer.slice(0, 4)}
            </div>
            <div className="text-xs text-gray-500">Year</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
              property.duration === 'F' 
                ? "bg-green-100 text-green-800" 
                : "bg-blue-100 text-blue-800"
            )}>
              {formatDuration(property.duration)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {hasHistory && (
              <button
                onClick={() => handleShowHistory(property.id)}
                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                title="View price history"
              >
                <TrendingUp className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setExpandedRowId(expandedRowId === property.id ? null : property.id)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="View details"
            >
              {expandedRowId === property.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expandedRowId === property.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 pt-3 border-t border-gray-100 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div><span className="font-medium">Town:</span> {property.town_city}</div>
                <div><span className="font-medium">County:</span> {property.county}</div>
                <div><span className="font-medium">Date:</span> {property.date_of_transfer}</div>
                <div><span className="font-medium">Type:</span> {formatPropertyType(property.property_type)}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
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

  return (
    <div className="space-y-6">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                viewMode === 'table' 
                  ? "bg-blue-100 text-blue-800" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                viewMode === 'cards' 
                  ? "bg-blue-100 text-blue-800" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Cards
            </button>
          </div>
          
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, soldPrices.length)} of {soldPrices.length} results
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedSoldPrices.map((property, index) => (
            <PropertyCard key={property.id} property={property} index={index} />
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                  <SortableHeader 
                    title="Address" 
                    sortKey="street" 
                    requestSort={requestSort} 
                    sortConfig={sortConfig}
                    icon={<MapPin className="h-4 w-4" />}
                  />
                  <SortableHeader 
                    title="Date" 
                    sortKey="date_of_transfer" 
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span>Type</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {paginatedSoldPrices.map((property, index) => (
                    <motion.tr
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "hover:bg-blue-50 transition-colors duration-150",
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      )}
                    >
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-400 rounded disabled:opacity-50 disabled:cursor-not-allowed group"
                          onClick={() => handleShowHistory(property.id)}
                          disabled={!getHasHistory(property)}
                          tabIndex={0}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleShowHistory(property.id); }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {formatAddress(property)}
                            </span>
                            {getHasHistory(property) && (
                              <span className="relative group flex items-center">
                                <TrendingUp className="w-4 h-4 text-blue-500 cursor-pointer" />
                                <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg whitespace-normal text-center" role="tooltip">
                                  Click to view full price history for this property
                                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 w-3 h-3 bg-gray-900 rotate-45 z-10"></span>
                                </span>
                              </span>
                            )}
                          </div>
                          {!getHasHistory(property) && (
                            <div className="text-xs text-gray-400 mt-1">No other sales found</div>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {property.date_of_transfer.slice(0, 4)}
                      </td>
                      <td className="px-4 py-4">
                        <div className={cn("text-lg font-bold", getPriceRangeColor(property.price, priceRange.min, priceRange.max))}>
                          {property.price}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getPropertyTypeIcon(property.property_type)}</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {formatPropertyType(property.property_type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          className="text-blue-500 hover:text-blue-700 text-xs font-medium transition-colors"
                          onClick={() => setExpandedRowId(expandedRowId === property.id ? null : property.id)}
                          aria-expanded={expandedRowId === property.id}
                          aria-controls={`row-details-${property.id}`}
                        >
                          {expandedRowId === property.id ? 'Hide details' : 'Show details'}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                page === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            
            <button
              onClick={handleNext}
              disabled={page === totalPages}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                page === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    page === pageNum
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

EnhancedSoldPricesTable.displayName = 'EnhancedSoldPricesTable';

export default EnhancedSoldPricesTable; 