'use client';

import React from 'react';
import { 
  TrendingUp, 
  Home, 
  Calendar
} from 'lucide-react';
import { cn, formatPrice, getPropertyTypeIcon, getPropertyTypeLabel } from '../../lib/utils';

interface EnhancedResultsSummaryProps {
  summary: {
    totalProperties: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    priceRange: number;
    mostCommonType: string;
    dateRange: {
      earliest: string;
      latest: string;
    };
  };
  postcode: string;
  onExport?: () => void;
  onShare?: () => void;
  className?: string;
}

const EnhancedResultsSummary: React.FC<EnhancedResultsSummaryProps> = ({ 
  summary,
  className
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const cardBase = "flex flex-col justify-center items-center min-h-[220px] bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition-shadow p-6 relative overflow-hidden";
  const cardTitle = "flex items-center gap-3 mb-3 text-xl font-bold text-gray-900 tracking-tight";
  const cardSubtitle = "text-sm text-gray-500 mb-2";
  const cardMetric = "text-3xl font-extrabold mb-1";
  const cardLabel = "text-base font-medium text-gray-700";
  const cardBadge = "inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mt-2";

  return (
    <div className={cn("relative w-full max-w-6xl mx-auto animate-fade-in", className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Property Types Card */}
        <div className={cardBase + " group"}>
          <div className={cardTitle}>
            <Home className="h-8 w-8 text-blue-600 drop-shadow-md" />
            Property Types
          </div>
          <div className="flex flex-col items-center flex-1 justify-center w-full">
            {(() => {
              const match = summary.mostCommonType.match(/^([A-Z]) ?\((\d+)\)$/);
              if (match) {
                const abbr = match[1];
                const count = match[2];
                return (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">{getPropertyTypeIcon(abbr)}</span>
                      <span className="text-2xl font-bold text-blue-700">{getPropertyTypeLabel(abbr)}</span>
                    </div>
                    <div className="text-lg text-gray-600 mb-1">{count} sales</div>
                    <div className={cardBadge}>Most common in this area</div>
                  </>
                );
              }
              // Fallback if no match
              return (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <span className="text-4xl text-gray-300 mb-2">{getPropertyTypeIcon('O')}</span>
                  <span className="text-lg text-gray-400">No data</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Time Period Card */}
        <div className={cardBase + " group"}>
          <div className={cardTitle}>
            <Calendar className="h-8 w-8 text-green-600 drop-shadow-md" />
            Time Period
          </div>
          <div className="flex flex-col items-center flex-1 justify-center w-full gap-2">
            <div className="flex flex-col md:flex-row gap-2 w-full mb-2">
              <div className="flex-1 bg-green-50 rounded-lg p-4 text-center">
                <div className="text-xs text-green-800 mb-1">Earliest Sale</div>
                <div className="text-lg font-semibold text-green-900">{summary.dateRange.earliest ? formatDate(summary.dateRange.earliest) : '--'}</div>
              </div>
              <div className="flex-1 bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-xs text-blue-800 mb-1">Latest Sale</div>
                <div className="text-lg font-semibold text-blue-900">{summary.dateRange.latest ? formatDate(summary.dateRange.latest) : '--'}</div>
              </div>
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 w-full text-center">
              <strong>Coverage:</strong> {(() => {
                if (!summary.dateRange.earliest || !summary.dateRange.latest) return '--';
                const start = new Date(summary.dateRange.earliest);
                const end = new Date(summary.dateRange.latest);
                const years = end.getFullYear() - start.getFullYear();
                return `${years} year${years !== 1 ? 's' : ''} period`;
              })()} of property sales
            </div>
          </div>
        </div>

        {/* Market Overview Card */}
        <div className={cardBase + " group"}>
          <div className={cardTitle}>
            <TrendingUp className="h-8 w-8 text-purple-600 drop-shadow-md" />
            Market Overview
          </div>
          <div className="flex flex-col items-center flex-1 justify-center w-full gap-2">
            <div className="grid grid-cols-1 gap-2 w-full mb-2">
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{formatPrice(summary.avgPrice)}</div>
                <div className="text-xs text-purple-700">Average Price</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{summary.totalProperties}</div>
                <div className="text-xs text-orange-700">Total Sales</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{formatPrice(summary.priceRange)}</div>
                <div className="text-xs text-green-700">Price Range</div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 w-full text-xs text-gray-700 text-center">
              <strong>Market Type:</strong> {summary.avgPrice > 500000 ? 'Premium market' : summary.avgPrice > 300000 ? 'Mid-range market' : 'Affordable market'} with prices from {formatPrice(summary.minPrice)} to {formatPrice(summary.maxPrice)}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedResultsSummary; 