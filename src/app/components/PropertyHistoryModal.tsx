'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { SoldPrice } from '../../../types/sold-price';
import { formatPrice } from '../../lib/utils';
import AreaPriceTrendChart from './AreaPriceTrendChart';
import BMVScoreExplanation from './BMVScoreExplanation';

interface PropertyHistoryModalProps {
  open: boolean;
  property: SoldPrice | null;
  history: SoldPrice[];
  onClose: () => void;
}

const TABS = [
  { key: 'trend', label: 'Area Trend' },
  { key: 'growth', label: 'Price Growth' },
  { key: 'details', label: 'Details' },
  { key: 'similar', label: 'Similar Sales' },
];

export default function PropertyHistoryModal({ 
  open, 
  property, 
  history, 
  onClose 
}: PropertyHistoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fullHistory, setFullHistory] = useState<SoldPrice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('trend');

  useEffect(() => {
    if (open && property && history.length > 0) {
      setIsLoading(false);
      setError(null);
      setFullHistory(history);
      setActiveTab('trend');
    }
  }, [open, property, history]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!open || !property) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPropertyType = (type: string) => {
    const typeMap: Record<string, string> = {
      'D': 'Detached',
      'S': 'Semi-detached',
      'T': 'Terraced',
      'F': 'Flat/Maisonette',
      'O': 'Other'
    };
    return typeMap[type] || type;
  };

  const formatDuration = (duration: string) => {
    return duration === 'F' ? 'Freehold' : 'Leasehold';
  };

  const formatAddress = (sp: SoldPrice) => {
    const addressParts = [];
    if (sp.saon && sp.saon.trim()) addressParts.push(sp.saon.trim());
    if (sp.paon && sp.paon.trim()) addressParts.push(sp.paon.trim());
    if (sp.street && sp.street.trim()) addressParts.push(sp.street.trim());
    if (sp.town_city && sp.town_city.trim()) addressParts.push(sp.town_city.trim());
    return addressParts.join(', ');
  };

  // Sort history by date (oldest first)
  const sortedHistory = [...fullHistory].sort((a, b) => 
    new Date(a.dateOfTransfer).getTime() - new Date(b.dateOfTransfer).getTime()
  );

  // Remove duplicate sales (same date and price)
  const uniqueHistory = sortedHistory.filter((sale, idx, arr) => {
    return idx === arr.findIndex(s => s.dateOfTransfer === sale.dateOfTransfer && s.price === sale.price);
  });

  // Calculate price changes
  const historyWithChanges = uniqueHistory.map((sale, index) => {
    if (index === 0) return { ...sale, priceChange: 0, priceChangePercent: 0 };
    const previousPrice = uniqueHistory[index - 1].price;
    const currentPrice = sale.price;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercent = (priceChange / previousPrice) * 100;
    return { ...sale, priceChange, priceChangePercent };
  });

  // Find similar properties in the same postcode (excluding the current property)
  const similarProperties = fullHistory
    .filter(sp => sp.postcode === property.postcode && sp.id !== property.id)
    .sort((a, b) => new Date(b.dateOfTransfer).getTime() - new Date(a.dateOfTransfer).getTime());

  // Overlay click handler
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" onClick={handleOverlayClick}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl mx-auto relative min-h-[700px] min-w-[420px] md:min-w-[700px] md:min-h-[800px]">
        {/* Modal header and close button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {/* Modal body with scroll and sticky tabs */}
        <div className="relative">
          <div className="sticky top-0 z-10 bg-white rounded-t-3xl">
            <div className="flex border-b mb-8 bg-slate-50 rounded-t-3xl overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  className={`px-6 py-3 font-semibold text-base transition-colors whitespace-nowrap border-b-2 focus:outline-none
                    ${activeTab === tab.key
                      ? 'border-blue-600 text-blue-700 bg-white shadow-sm'
                      : 'border-transparent text-slate-500 hover:text-blue-600 hover:bg-slate-100'}
                  `}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-y-auto max-h-[80vh] px-2 pb-8 rounded-b-3xl">
            {/* Tab Content */}
            {activeTab === 'details' && (
              <div className="bg-white rounded-xl shadow p-8 mb-8 border border-slate-100 max-w-2xl mx-auto">
                <div className="mb-8">
                  <div className="text-4xl font-extrabold text-gray-900 mb-2">{formatPrice(property.price)}</div>
                  <div className="flex items-center text-base text-gray-500 mb-4">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 4h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" />
                    </svg>
                    Sold {formatDate(property.dateOfTransfer)}
                  </div>
                  <div className="mb-2">
                    <div className="font-bold text-lg text-gray-800 uppercase tracking-wide">{[property.paon, property.street].filter(Boolean).join(' ')}</div>
                    <div className="text-gray-600 text-base font-medium">{property.town_city}</div>
                    <div className="text-gray-400 text-sm font-mono tracking-widest">{property.postcode}</div>
                  </div>
                </div>
                {/* Property Details Grid */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="font-semibold text-gray-900">{formatPropertyType(property.propertyType)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tenure</p>
                    <p className="font-semibold text-gray-900">{formatDuration(property.duration)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Year</p>
                    <p className="font-semibold text-gray-900">{new Date(property.dateOfTransfer).getFullYear()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Month</p>
                    <p className="font-semibold text-gray-900">{new Date(property.dateOfTransfer).toLocaleString('en-GB', { month: 'long' })}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'similar' && (
              <div className="max-w-2xl mx-auto">
                {similarProperties.length > 0 ? (
                  <div className="mt-2">
                    <div className="mb-2 text-base font-semibold text-blue-700">Similar Properties in {property.postcode}</div>
                    {similarProperties.map((sp) => (
                      <div
                        key={sp.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <div className="font-semibold text-gray-900 uppercase">
                            <span className="font-bold">{[sp.saon, sp.paon].filter(Boolean).join(', ')}</span>{sp.street ? ` ${sp.street}` : ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(sp.dateOfTransfer)}
                            {sp.propertyType ? ` • ${formatPropertyType(sp.propertyType)}` : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-gray-900">{formatPrice(sp.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No similar properties found in this postcode.</div>
                )}
              </div>
            )}

            {activeTab === 'growth' && (
              <div className="max-w-2xl mx-auto">
                {/* --- Price History Section --- */}
                <h3 className="text-2xl font-bold text-blue-900 mb-1">Price History</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-semibold text-gray-800 uppercase tracking-wide">{formatAddress(property)}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">{property.postcode}</span>
                </div>
                {/* Sale History Table */}
                {!isLoading && !error && fullHistory.length > 0 && (
                  <div className="overflow-x-auto mb-4">
                    <div className="text-lg font-semibold text-blue-800 mb-2">Sale History by Year</div>
                    <table className="min-w-[420px] w-full text-base border-separate border-spacing-y-1">
                      <thead>
                        <tr className="text-xs text-blue-900 uppercase bg-blue-50">
                          <th className="px-4 py-2 text-left whitespace-nowrap">Latest Sale Date</th>
                          <th className="px-4 py-2 text-right whitespace-nowrap">Sale Price</th>
                          <th className="px-4 py-2 text-right whitespace-nowrap">Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyWithChanges.map((sale, index, arr) => {
                          const isLatest = index === arr.length - 1;
                          return (
                            <tr key={sale.id + '-' + sale.dateOfTransfer} className={isLatest ? 'bg-yellow-50/80' : 'bg-white'}>
                              <td className="px-4 py-2 whitespace-nowrap font-medium">{formatDate(sale.dateOfTransfer)}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-right font-semibold text-gray-900">{formatPrice(sale.price)}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-right">
                                {index === 0 ? (
                                  <span className="text-gray-400">—</span>
                                ) : (
                                  <span className={`font-medium ${sale.priceChange > 0 ? 'text-green-600' : sale.priceChange < 0 ? 'text-red-600' : 'text-gray-500'}`}> 
                                    {sale.priceChange > 0 ? '+' : ''}{formatPrice(sale.priceChange)}
                                    <span className="ml-1 text-xs">
                                      ({sale.priceChangePercent > 0 ? '+' : ''}{sale.priceChangePercent.toFixed(1)}%)
                                    </span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Summary Growth Box */}
                {!isLoading && !error && fullHistory.length > 1 && (
                  <div className="my-4 flex justify-center">
                    {(() => {
                      const first = sortedHistory[0];
                      const last = sortedHistory[sortedHistory.length - 1];
                      const growth = last.price - first.price;
                      const growthPct = (growth / first.price) * 100;
                      return (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 text-center w-full max-w-md mx-auto">
                          <div className="text-2xl font-bold text-green-700">{growth > 0 ? '+' : ''}{formatPrice(growth)} ({growthPct > 0 ? '+' : ''}{growthPct.toFixed(1)}%)</div>
                          <div className="text-sm text-green-900 mt-1">Growth from {new Date(first.dateOfTransfer).getFullYear()} to {new Date(last.dateOfTransfer).getFullYear()}</div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                {/* Explanatory Text */}
                <div className="text-sm text-gray-500 mb-4 text-center">
                  Percentage growth is calculated from the first recorded sale to the most recent sale of this property.
                </div>
                {/* Error State */}
                {error && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  </div>
                )}
                {/* Loading State */}
                {isLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading property history...</p>
                  </div>
                )}
              </div>
            )}

            {/* New Area Trend Tab */}
            {activeTab === 'trend' && (
              <div className="max-w-3xl mx-auto">
                <AreaPriceTrendChart
                  labels={sortedHistory.map(sale => formatDate(sale.dateOfTransfer))}
                  data={sortedHistory.map(sale => sale.price)}
                  areaName={formatAddress(property).length > 40 ? formatAddress(property).slice(0, 40) + '…' : formatAddress(property)}
                  className="h-full w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 