'use client';

import React from 'react';
import { 
  TrendingUp, 
  Home, 
  Calendar
} from 'lucide-react';
import { cn, formatPrice, getPropertyTypeIcon, getPropertyTypeLabel } from '../../lib/utils';
import { PropertyTypePieChart } from './AreaPriceTrendChart';

interface EnhancedResultsSummaryProps {
  summary: {
    totalProperties: number;
    avgPrice: number;
    medianPrice: number;
    minPrice: number;
    maxPrice: number;
    priceRange: number;
    mostCommonType: string;
    dateRange: {
      earliest: string;
      latest: string;
    };
    bmvDistribution?: {
      excellent: number;
      good: number;
      fair: number;
      overpriced: number;
      poor: number;
    };
  };
  postcode: string;
  onExport?: () => void;
  onShare?: () => void;
  className?: string;
  fullWidth?: boolean;
  onlyPropertyType?: boolean;
  fullBanner?: boolean;
  soldPrices?: any[];
}

const EnhancedResultsSummary: React.FC<EnhancedResultsSummaryProps> = ({ 
  summary,
  className,
  fullWidth = false,
  onlyPropertyType,
  fullBanner,
  soldPrices
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

  if (fullBanner) {
    return (
      <div className="w-full bg-white/95 rounded-2xl shadow-lg border border-slate-200 p-8 flex flex-col animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-12 text-center w-full">
          {/* Average Price */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-blue-700 mb-1">{formatPrice(summary.avgPrice)}</div>
            <div className="text-slate-700 text-sm font-medium">Average Price</div>
          </div>
          {/* Median Price */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-indigo-700 mb-1">{formatPrice(summary.medianPrice)}</div>
            <div className="text-slate-700 text-sm font-medium">Median Price</div>
          </div>
          {/* Total Sales */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-green-700 mb-1">{summary.totalProperties.toLocaleString()}</div>
            <div className="text-slate-700 text-sm font-medium">Total Sales</div>
          </div>
          {/* Price Range */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-orange-700 mb-1">{formatPrice(summary.priceRange)}</div>
            <div className="text-slate-700 text-sm font-medium">Price Range</div>
          </div>
        </div>
        {/* Market type summary below, if needed */}
        <div className="mt-8 text-center text-slate-600 text-sm">
          {summary.dateRange && summary.dateRange.earliest && summary.dateRange.latest && (
            <span>
              Showing sales from <b>{summary.dateRange.earliest}</b> to <b>{summary.dateRange.latest}</b>
            </span>
          )}
        </div>
      </div>
    );
  }

  if (onlyPropertyType) {
    return (
      <div className="w-full bg-white/95 rounded-2xl shadow-lg border border-slate-200 p-8 flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 mb-3">
          <Home className="w-7 h-7 text-blue-500" />
          <span className="font-semibold text-xl">Property Types</span>
        </div>
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
                <div className={cardBadge}>Most common</div>
              </>
            );
          }
          // Fallback if no match
          return (
            <div className="flex flex-col items-center justify-center h-28">
              <span className="text-5xl mb-2">🏭</span>
              <span className="text-slate-400 text-base">No data</span>
            </div>
          );
        })()}
      </div>
    );
  }
  return (
    <div className={cn(
      "relative w-full animate-fade-in overflow-x-hidden",
      !fullWidth && "max-w-6xl mx-auto",
      className
    )}>
      <div className="mb-10">
        {/* Property Types - full width above columns */}
        <div className="w-full flex flex-col items-center justify-center mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Home className="w-7 h-7 text-blue-500" />
            <span className="font-semibold text-xl">Property Types</span>
          </div>
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
                  <div className={cardBadge}>Most common</div>
                </>
              );
            }
            // Fallback if no match
            return (
              <div className="flex flex-col items-center justify-center h-28">
                <span className="text-5xl mb-2">🏭</span>
                <span className="text-slate-400 text-base">No data</span>
              </div>
            );
          })()}
        </div>
        {/* Two-column layout below */}
        <div className={cn(
          "w-full transition-all",
          fullWidth
            ? "flex flex-col xl:flex-row items-stretch gap-6 overflow-x-hidden !min-h-0 !max-h-none !overflow-y-visible"
            : "flex flex-col md:flex-row items-stretch gap-8 md:gap-0"
        )}>
          {/* Center: Key Stats */}
          <div className={cn(
            fullWidth
              ? "flex flex-col w-full items-center justify-center gap-4 px-0 border-b mb-8 !h-auto !min-h-0 !max-h-none overflow-x-hidden overflow-y-visible"
              : "flex-1 flex flex-col items-center justify-center gap-4 px-0 md:px-8 border-b md:border-b-0 md:border-r border-slate-100 mb-8 md:mb-0 h-full"
          )}>
            <div className={cn(
              fullWidth
                ? "flex flex-col gap-4 w-full"
                : "grid grid-cols-2 gap-4 w-full"
            )}>
              <div className={cn(
                "bg-purple-50 rounded-lg p-4 text-center w-full min-w-[140px] h-[90px] flex flex-col justify-center overflow-x-hidden",
                fullWidth && "max-w-none"
              )}>
                <div className="text-2xl font-bold text-purple-600">{formatPrice(summary.avgPrice)}</div>
                <div className="text-xs text-purple-700">Average Price</div>
              </div>
              <div className={cn(
                "bg-blue-50 rounded-lg p-4 text-center w-full min-w-[140px] h-[90px] flex flex-col justify-center overflow-x-hidden",
                fullWidth && "max-w-none"
              )}>
                <div className="text-2xl font-bold text-blue-600">{formatPrice(summary.medianPrice || summary.avgPrice)}</div>
                <div className="text-xs text-blue-700">Median Price</div>
              </div>
              <div className={cn(
                "bg-orange-50 rounded-lg p-4 text-center w-full min-w-[140px] h-[90px] flex flex-col justify-center overflow-x-hidden",
                fullWidth && "max-w-none"
              )}>
                <div className="text-2xl font-bold text-orange-600">{summary.totalProperties}</div>
                <div className="text-xs text-orange-700">Total Sales</div>
              </div>
              <div className={cn(
                "bg-green-50 rounded-lg p-4 text-center w-full min-w-[140px] h-[90px] flex flex-col justify-center overflow-x-hidden",
                fullWidth && "max-w-none"
              )}>
                <div className="text-2xl font-bold text-green-600">{formatPrice(summary.priceRange)}</div>
                <div className="text-xs text-green-700">Price Range</div>
              </div>
            </div>
            <div className={cn(
              "bg-gray-50 rounded-lg p-2 w-full text-xs text-gray-700 text-center mt-2 overflow-x-hidden",
              fullWidth && "max-w-none"
            )}>
              <strong>Market Type:</strong> {summary.avgPrice > 500000 ? 'Premium market' : summary.avgPrice > 300000 ? 'Mid-range market' : 'Affordable market'} with prices from {formatPrice(summary.minPrice)} to {formatPrice(summary.maxPrice)}.
            </div>
          </div>

          {/* Right: BMV Score Distribution */}
          <div className={cn(
            fullWidth
              ? "flex flex-col items-center justify-center w-full min-w-0 max-w-none pl-0 !h-auto !min-h-0 !max-h-none overflow-x-hidden overflow-y-visible"
              : "flex flex-col items-center justify-center flex-1 min-w-[220px] max-w-[260px] pl-0 md:pl-8 h-full"
          )}>
            <div className="text-xs font-semibold text-gray-700 mb-2">BMV Score Distribution</div>
            {summary.bmvDistribution && summary.totalProperties > 0 ? (
              <>
                <div className={cn(
                  "flex items-center gap-1 h-3 w-full overflow-x-hidden",
                  fullWidth && "max-w-none w-full !overflow-x-hidden !max-w-none"
                )}>
                  <div 
                    className="bg-green-500 rounded-l-full h-full" 
                    style={{ width: `${(summary.bmvDistribution.excellent / summary.totalProperties) * 100}%` }}
                    title={`Excellent (${summary.bmvDistribution.excellent})`}
                  ></div>
                  <div 
                    className="bg-blue-500 h-full" 
                    style={{ width: `${(summary.bmvDistribution.good / summary.totalProperties) * 100}%` }}
                    title={`Good (${summary.bmvDistribution.good})`}
                  ></div>
                  <div 
                    className="bg-yellow-500 h-full" 
                    style={{ width: `${(summary.bmvDistribution.fair / summary.totalProperties) * 100}%` }}
                    title={`Fair (${summary.bmvDistribution.fair})`}
                  ></div>
                  <div 
                    className="bg-orange-500 h-full" 
                    style={{ width: `${(summary.bmvDistribution.overpriced / summary.totalProperties) * 100}%` }}
                    title={`Overpriced (${summary.bmvDistribution.overpriced})`}
                  ></div>
                  <div 
                    className="bg-red-500 rounded-r-full h-full" 
                    style={{ width: `${(summary.bmvDistribution.poor / summary.totalProperties) * 100}%` }}
                    title={`Poor (${summary.bmvDistribution.poor})`}
                  ></div>
                </div>
                <div className={cn(
                  "flex justify-between w-full mt-2 text-xs text-gray-500 overflow-x-hidden",
                  fullWidth && "max-w-none w-full !overflow-x-hidden !max-w-none"
                )}>
                  <span>Excellent</span>
                  <span>Poor</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-28">
                <span className="text-5xl mb-2">📊</span>
                <span className="text-slate-400 text-base">No data</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedResultsSummary; 