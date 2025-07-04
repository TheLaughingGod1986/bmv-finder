'use client';

import React from 'react';
import { 
  TrendingUp, 
  Home, 
  Calendar
} from 'lucide-react';
import { cn, formatPrice, getPropertyTypeIcon, getPropertyTypeLabel } from '../../lib/utils';
import { PropertyTypePieChart } from './AreaPriceTrendChart';
import SalesPerYearChart from './SalesPerYearChart';
import GrowthOverYearsChart from './GrowthOverYearsChart';
import BMVLegend from './BMVLegend';

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
    searchTerm?: string;
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
  // Calculate total growth percent (from first year avg to last year avg)
  let totalGrowthPercent = 0;
  if (soldPrices && soldPrices.length > 1) {
    // Group prices by year
    const yearMap: Record<string, { total: number; count: number }> = {};
    soldPrices.forEach(sp => {
      const year = new Date(sp.dateOfTransfer).getFullYear();
      if (!yearMap[year]) yearMap[year] = { total: 0, count: 0 };
      yearMap[year].total += sp.price;
      yearMap[year].count += 1;
    });
    const years = Object.keys(yearMap).sort();
    if (years.length > 1) {
      const firstYear = years[0];
      const lastYear = years[years.length - 1];
      const firstAvg = yearMap[firstYear].total / yearMap[firstYear].count;
      const lastAvg = yearMap[lastYear].total / yearMap[lastYear].count;
      if (firstAvg > 0) {
        totalGrowthPercent = Math.round(((lastAvg - firstAvg) / firstAvg) * 1000) / 10;
      }
    }
  }

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
        {/* Title and Explanation */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-1">Market Summary</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base mb-2">
            Use this tool to analyse market growth and past performance in your chosen area. Compare your price to historical (legacy) sales data, see how property values have changed over time, and understand the context of your purchase. This is not a live deals platform, but a way to benchmark against past sales and market trends.
          </p>
        </div>
        {/* Info Bar: Search Term & Date Range */}
        {(summary.searchTerm || (summary.dateRange && summary.dateRange.earliest && summary.dateRange.latest)) && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 mb-4 text-sm text-blue-700/90">
            {summary.searchTerm && (
              <span className="bg-blue-50 border border-blue-100 rounded-full px-3 py-1 font-medium">
                {summary.searchTerm}
              </span>
            )}
            {summary.dateRange && summary.dateRange.earliest && summary.dateRange.latest && (
              <span className="text-slate-600">
                Showing sales from <b>{summary.dateRange.earliest}</b> to <b>{summary.dateRange.latest}</b>
              </span>
            )}
          </div>
        )}
        {/* Stats Section */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-2 py-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-700">{formatPrice(summary.avgPrice)}</div>
            <div className="text-xs text-slate-600 mt-1">Average Price</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-700">{formatPrice(summary.medianPrice)}</div>
            <div className="text-xs text-slate-600 mt-1">Median Price</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-700">{summary.totalProperties}</div>
            <div className="text-xs text-slate-600 mt-1">Total Sales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-orange-700">{formatPrice(summary.priceRange)}</div>
            <div className="text-xs text-slate-600 mt-1">Price Range</div>
          </div>
        </div>
        {/* Market Trends Section */}
        <div className="mb-2 mt-2">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 text-center">Market Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-base font-semibold mb-2">Sales Per Year</h4>
              <SalesPerYearChart soldPrices={soldPrices || []} />
            </div>
            <div>
              <h4 className="text-base font-semibold mb-2">Growth in Value Over Years</h4>
              <GrowthOverYearsChart soldPrices={soldPrices || []} />
            </div>
          </div>
        </div>
        {/* After the summary card, add a subtle divider before the legend */}
        <div className="w-full mb-4">
          <hr className="border-slate-100" />
        </div>
        {/* Wrap the legend in a card-like background for visual separation */}
        <div className="w-full mb-6 bg-slate-50/80 rounded-xl shadow border border-slate-200 p-4">
          <BMVLegend variant="full" className="w-full" />
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
        {/* Title and Explanation */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-1">Market Summary</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base mb-2">
            Use this tool to analyse market growth and past performance in your chosen area. Compare your price to historical (legacy) sales data, see how property values have changed over time, and understand the context of your purchase. This is not a live deals platform, but a way to benchmark against past sales and market trends.
          </p>
        </div>
        {/* Info Bar: Search Term & Date Range */}
        {(summary.searchTerm || (summary.dateRange && summary.dateRange.earliest && summary.dateRange.latest)) && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 mb-4 text-sm text-blue-700/90">
            {summary.searchTerm && (
              <span className="bg-blue-50 border border-blue-100 rounded-full px-3 py-1 font-medium">
                {summary.searchTerm}
              </span>
            )}
            {summary.dateRange && summary.dateRange.earliest && summary.dateRange.latest && (
              <span className="text-slate-600">
                Showing sales from <b>{summary.dateRange.earliest}</b> to <b>{summary.dateRange.latest}</b>
              </span>
            )}
          </div>
        )}
        {/* Stats Section */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-2 py-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-700">{formatPrice(summary.avgPrice)}</div>
            <div className="text-xs text-slate-600 mt-1">Average Price</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-700">{formatPrice(summary.medianPrice)}</div>
            <div className="text-xs text-slate-600 mt-1">Median Price</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-700">{summary.totalProperties}</div>
            <div className="text-xs text-slate-600 mt-1">Total Sales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-orange-700">{formatPrice(summary.priceRange)}</div>
            <div className="text-xs text-slate-600 mt-1">Price Range</div>
          </div>
        </div>
        {/* Market Trends Section */}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Market Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales Per Year Chart */}
            <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
              <SalesPerYearChart soldPrices={soldPrices || []} />
              {/* Total Sales Stat */}
              <div className="mt-4 flex flex-col items-center">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Sales</span>
                <span className="text-2xl font-bold text-blue-700">{summary.totalProperties}</span>
              </div>
            </div>
            {/* Growth Over Years Chart */}
            <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
              <GrowthOverYearsChart soldPrices={soldPrices || []} />
              {/* Total Growth Stat */}
              <div className="mt-4 flex flex-col items-center">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Growth</span>
                <span className="text-2xl font-bold text-green-600">{totalGrowthPercent}%</span>
              </div>
            </div>
          </div>
        </div>
        {/* After the summary card, add a subtle divider before the legend */}
        <div className="w-full mb-4">
          <hr className="border-slate-100" />
        </div>
        {/* Wrap the legend in a card-like background for visual separation */}
        <div className="w-full mb-6 bg-slate-50/80 rounded-xl shadow border border-slate-200 p-4">
          <BMVLegend variant="full" className="w-full" />
        </div>
      </div>
    </div>
  );
};

export default EnhancedResultsSummary;