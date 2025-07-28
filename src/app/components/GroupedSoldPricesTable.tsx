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
  X,
  BarChart3,
  Info,
  Map,
  Download,
  Eye
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'history' | 'growth' | 'info' | 'map'>('history');
  const [priceIndicators, setPriceIndicators] = useState<{ [key: string]: any }>({});

  const formatAddress = (property: any) => {
    if (!property) return '';
    const parts = [property.propertyNumber, property.street, property.locality, property.town, property.county].filter(Boolean);
    return parts.join(', ');
  };

  const formatShortAddress = (property: any) => {
    if (!property) return '';
    const parts = [property.propertyNumber, property.street].filter(Boolean);
    return parts.join(' ');
  };

  const formatPropertyType = (type: string) => {
    if (!type) return 'Unknown';
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

  const getPriceIndicator = (price: number | null, property: any) => {
    if (!price || !property) return null;
    
    const indicator = priceIndicators[property.id];
    if (!indicator) return null;

    const percentage = indicator.percentage;
    const isPositive = percentage > 0;
    
    return (
      <div className={`flex items-center gap-1 text-xs font-medium ${
        isPositive ? 'text-[#5DA271]' : 'text-red-500'
      }`}>
        <span>{isPositive ? '+' : ''}{percentage.toFixed(1)}%</span>
        <TrendingUp className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} />
      </div>
    );
  };

  useEffect(() => {
    const fetchPriceIndicators = async () => {
      try {
        const response = await fetch('/api/enhanced-price-indicator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ properties: soldPrices })
        });
        
        if (response.ok) {
          const data = await response.json();
          const indicatorsMap: { [key: string]: any } = {};
          data.forEach((indicator: any) => {
            indicatorsMap[indicator.propertyId] = indicator;
          });
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

  const openHistoryModal = (property: any) => {
    setHistoryModal({ isOpen: true, property });
    setActiveTab('history');
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
      <div className={`bg-white rounded-xl border border-[#D2B48C] shadow-soft overflow-hidden ${className}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F5DC] border-b border-[#D2B48C]">
              <tr>
                <th className="px-4 py-3 text-left">
                  <SortableHeader column="address" label="Address" icon={<MapPin className="w-3 h-3" />} />
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
                    <span className="text-sm text-[#2C6E91]">
                      {formatPropertyType(property.propertyType)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#2C6E91]">
                      {formatDate(property.date)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#2C6E91]">
                        {formatPrice(property.price)}
                      </span>
                      {getPriceIndicator(property.price, property)}
                    </div>
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
              <div className="flex items-center justify-between p-6 border-b border-[#E5E5E5]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#3A7CA5] rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#2C6E91]">Property History</h2>
                    <p className="text-sm text-[#3B755D]">{formatAddress(historyModal.property)}</p>
                  </div>
                </div>
                <button
                  onClick={closeHistoryModal}
                  className="p-2 hover:bg-[#F5F5DC] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#2C6E91]" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#E5E5E5]">
                {[
                  { id: 'history', label: 'History', icon: <BarChart3 className="w-4 h-4" /> },
                  { id: 'growth', label: 'Growth', icon: <TrendingUp className="w-4 h-4" /> },
                  { id: 'info', label: 'Info', icon: <Info className="w-4 h-4" /> },
                  { id: 'map', label: 'Map', icon: <Map className="w-4 h-4" /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-[#3A7CA5] text-[#3A7CA5]'
                        : 'border-transparent text-[#3B755D] hover:text-[#2C6E91]'
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
                    {historyModal.property?.salesHistory?.map((sale: any, index: number) => (
                      <div key={index} className="bg-white border border-[#E5E5E5] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-[#2C6E91]">{formatPrice(sale.price)}</span>
                          <span className="text-sm text-[#3B755D]">{formatDate(sale.date)}</span>
                        </div>
                        <div className="text-sm text-[#3B755D]">
                          {sale.description || 'No additional details available'}
                        </div>
                      </div>
                    ))}
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
                    <div className="bg-[#F5F5DC] border border-[#D2B48C] rounded-lg px-4 py-3 mb-4 text-[#2C6E91] text-sm">
                      <strong>Location Map:</strong> This map shows the approximate location of the property based on the address. Use it to explore the area, check proximity to amenities, and get a sense of the neighbourhood.
                    </div>
                    <div className="w-full h-72 rounded-lg overflow-hidden border border-[#E5E5E5] shadow">
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GroupedSoldPricesTable; 