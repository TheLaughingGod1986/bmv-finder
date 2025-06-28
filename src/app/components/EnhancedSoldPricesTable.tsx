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
  Layers
} from 'lucide-react';
import { SoldPrice } from '../../../types/sold-price';
import { cn } from '../../lib/utils';

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
  onShowHistory
}) => {
  // Add missing state variables
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Remove internal pagination state and logic
  // const [page, setPage] = useState(1);
  // const [pageSize, setPageSize] = useState(10);
  // const totalPages = Math.ceil(soldPrices.length / pageSize);
  // const paginatedSoldPrices = useMemo(() => {
  //   const start = (page - 1) * pageSize;
  //   return soldPrices.slice(start, start + pageSize);
  // }, [soldPrices, page, pageSize]);

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
    <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mt-2">
      <div className="overflow-x-auto w-full">
        <table className="min-w-full w-full">
          <thead className="sticky top-0 z-10 bg-white border-b border-slate-100">
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  <span>Type</span>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tenure</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence>
              {paginatedSoldPrices.map((property, index) => (
                <motion.tr
                  key={property.id || [property.paon, property.saon, property.street, property.postcode, property.dateOfTransfer].join('-')}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "hover:bg-blue-50/60 transition-colors duration-150",
                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                  )}
                  tabIndex={0}
                  aria-label={`Property at ${formatAddress(property)}, sold for ${formatPrice(property.price)}`}
                >
                  <td className="px-4 py-4 text-base font-medium text-slate-900 max-w-xs truncate">
                    {formatAddress(property)}
                  </td>
                  <td className="px-4 py-4 text-base text-slate-700 whitespace-nowrap">
                    {new Date(property.dateOfTransfer).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-4 text-lg font-bold whitespace-nowrap text-right text-green-700">
                    {formatPrice(property.price)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPropertyTypeIcon(property.propertyType)}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                        {formatPropertyType(property.propertyType)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      property.duration === 'F' ? "bg-green-50 text-green-800" : "bg-blue-50 text-blue-800"
                    )}>
                      {formatDuration(property.duration)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {getHasHistory(property) && (
                      <button
                        onClick={() => handleShowHistory(property)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs shadow focus:ring-2 focus:ring-blue-400 transition-all duration-200 active:scale-95"
                        title="View price history"
                        aria-label="View price history"
                      >
                        <TrendingUp className="h-4 w-4" /> History
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );

  // Cards View for mobile
  const MobileCardsView = () => (
    <div className="grid grid-cols-1 gap-4 sm:hidden">
      <AnimatePresence>
        {paginatedSoldPrices.map((property, index) => (
          <motion.div
            key={property.id || [property.paon, property.saon, property.street, property.postcode, property.dateOfTransfer].join('-')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl shadow-lg border border-blue-100 p-4 flex flex-col gap-2"
            tabIndex={0}
            aria-label={`Property at ${formatAddress(property)}, sold for ${formatPrice(property.price)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2">
                  {formatAddress(property)}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span>{property.postcode}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg">{getPropertyTypeIcon(property.propertyType)}</span>
                <span className="text-xs text-gray-500">
                  {formatPropertyType(property.propertyType)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-blue-800">{formatPrice(property.price)}</div>
              <div className="text-xs text-gray-500">{new Date(property.dateOfTransfer).toLocaleDateString('en-GB')}</div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                property.duration === 'F' ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
              )}>
                {formatDuration(property.duration)}
              </span>
              {getHasHistory(property) && (
                <button
                  onClick={() => handleShowHistory(property)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs shadow focus:ring-2 focus:ring-blue-400 transition-all duration-200 active:scale-95"
                  title="View price history"
                  aria-label="View price history"
                >
                  <TrendingUp className="h-4 w-4" /> History
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  // Cards View for desktop
  const CardsViewDesktop = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {paginatedSoldPrices.map((property, index) => (
        <motion.div
          key={property.id || [property.paon, property.saon, property.street, property.postcode, property.dateOfTransfer].join('-')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 p-5 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-2">
                {formatAddress(property)}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="h-3 w-3" />
                <span>{property.postcode}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getPropertyTypeIcon(property.propertyType)}
              <span className="text-xs text-slate-500">
                {formatPropertyType(property.propertyType)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-2xl font-extrabold text-green-700 text-right flex-1">
              {formatPrice(property.price)}
            </div>
            <div className="text-sm font-medium text-slate-700 whitespace-nowrap">
              {new Date(property.dateOfTransfer).toLocaleDateString('en-GB')}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
              property.duration === 'F' ? "bg-green-50 text-green-800" : "bg-blue-50 text-blue-800"
            )}>
              {formatDuration(property.duration)}
            </span>
            {getHasHistory(property) && (
              <button
                onClick={() => handleShowHistory(property)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs shadow focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                title="View price history"
                aria-label="View price history"
              >
                <TrendingUp className="h-4 w-4" /> History
              </button>
            )}
          </div>
        </motion.div>
      ))}
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

  return (
    <div className="space-y-6">
      {/* Mobile Cards View (always shown on mobile) */}
      <MobileCardsView />

      {/* Desktop View Controls and Content */}
      <div className="hidden sm:block">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
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
          </div>

          {/* Add Legend above the table/cards */}
          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex flex-wrap gap-4 items-center text-xs">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                <span>Average price / Info</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-600 inline-block"></span>
                <span>Lowest price / Positive trend</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-purple-600 inline-block"></span>
                <span>Highest price</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
                <span>Price range</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🏠</span><span>Detached</span>
                <span>🏡</span><span>Semi-detached</span>
                <span>🏘️</span><span>Terraced</span>
                <span>🏢</span><span>Flat/Maisonette</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-600">▲</span><span>Price up</span>
                <span className="text-red-600">▼</span><span>Price down</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-blue-600">i</span><span>Info</span>
              </div>
            </div>
          </div>

          {/* Cards View */}
          {viewMode === 'cards' && (
            <CardsViewDesktop />
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <TableView />
          )}
        </div>
      </div>
    </div>
  );
});

EnhancedSoldPricesTable.displayName = 'EnhancedSoldPricesTable';

export default EnhancedSoldPricesTable; 