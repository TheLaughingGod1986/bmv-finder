'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Home, 
  Calendar,
  PoundSterling,
  Share2,
  Download,
  BarChart3
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
}

const EnhancedResultsSummary: React.FC<EnhancedResultsSummaryProps> = ({ 
  summary, 
  postcode, 
  onExport, 
  onShare 
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    trend
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <div
      className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "p-3 rounded-lg",
            color === 'blue' && "bg-blue-100 text-blue-600",
            color === 'green' && "bg-green-100 text-green-600",
            color === 'purple' && "bg-purple-100 text-purple-600",
            color === 'orange' && "bg-orange-100 text-orange-600"
          )}>
            {icon}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? formatPrice(value) : value}
          </div>
          <div className="text-sm text-gray-600">{title}</div>
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
                {trend.value}% from last year
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ExpandableSection = ({ 
    title, 
    children, 
    icon, 
    isExpanded, 
    onToggle 
  }: {
    title: string;
    children: React.ReactNode;
    icon: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        <span className={cn("transition-transform duration-200", isExpanded ? "rotate-180" : "rotate-0")}
        >
          <TrendingDown className="h-5 w-5 text-gray-400" />
        </span>
      </button>
      {isExpanded && (
        <div className="overflow-hidden px-6 pb-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full max-w-4xl mx-auto animate-fade-in mb-12">
      {/* Sticky Summary Cards Container - Only sticky on desktop */}
      <div className="md:sticky md:top-20 z-20 bg-white/90 backdrop-blur-lg pb-6 rounded-2xl shadow-2xl border border-blue-100 mx-2">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 shadow-xl"
          aria-labelledby="results-summary-title"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl shadow">
                <BarChart3 className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h2 id="results-summary-title" className="text-2xl font-extrabold gradient-text leading-tight mb-1">
                  Results Summary for <span className="text-blue-700">{postcode}</span>
                </h2>
                <p className="text-sm text-slate-600">Market insights and property analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-blue-100 px-3 py-1 rounded-full text-sm font-semibold">
                {summary.totalProperties} properties
              </span>
              {onShare && (
                <button
                  onClick={onShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-100 text-blue-700 font-semibold text-sm shadow focus:ring-2 focus:ring-blue-400 transition-all duration-200 active:scale-95"
                  title="Share results"
                  aria-label="Share results"
                >
                  <Share2 className="h-5 w-5" /> Share
                </button>
              )}
              {onExport && (
                <button
                  onClick={onExport}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-100 text-blue-700 font-semibold text-sm shadow focus:ring-2 focus:ring-blue-400 transition-all duration-200 active:scale-95"
                  title="Export data"
                  aria-label="Export data"
                >
                  <Download className="h-5 w-5" /> Export
                </button>
              )}
            </div>
          </div>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-6">
            <StatCard
              title="Average Price"
              value={summary.avgPrice}
              icon={<PoundSterling className="h-6 w-6" />}
              color="blue"
            />
            <StatCard
              title="Min Price"
              value={summary.minPrice}
              icon={<TrendingDown className="h-6 w-6" />}
              color="green"
            />
            <StatCard
              title="Max Price"
              value={summary.maxPrice}
              icon={<TrendingUp className="h-6 w-6" />}
              color="purple"
            />
            <StatCard
              title="Most Common Type"
              value={getPropertyTypeLabel(summary.mostCommonType)}
              icon={getPropertyTypeIcon(summary.mostCommonType)}
              color="orange"
            />
          </div>
          {/* Date Range */}
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-5 w-5 text-blue-400 mr-1" />
            <span>
              Data from <span className="font-semibold text-blue-700">{summary.dateRange.earliest ? formatDate(summary.dateRange.earliest) : 'N/A'}</span> to <span className="font-semibold text-blue-700">{summary.dateRange.latest ? formatDate(summary.dateRange.latest) : 'N/A'}</span>
            </span>
          </div>
        </motion.section>
      </div>

      {/* Scrollable Accordion Content Section */}
      <div className="pt-4 space-y-4">
        {/* Property Type Analysis */}
        <ExpandableSection
          title="Property Type Analysis"
          icon={<Home className="h-5 w-5 text-blue-600" />}
          isExpanded={expandedSection === 'property-type'}
          onToggle={() => setExpandedSection(expandedSection === 'property-type' ? null : 'property-type')}
        >
          <div className="space-y-4">
            {(() => {
              const match = summary.mostCommonType.match(/^(\w) \((\d+)\)$/);
              if (match) {
                const abbr = match[1];
                const count = match[2];
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getPropertyTypeIcon(abbr)}</span>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {getPropertyTypeLabel(abbr)} - {count} sales
                        </div>
                        <div className="text-sm text-gray-600">
                          Most frequently sold property type in this area
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-2">Property Type Legend:</div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <span>🏠</span>
                          <span className="text-gray-700">D = Detached</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🏡</span>
                          <span className="text-gray-700">S = Semi-detached</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🏘️</span>
                          <span className="text-gray-700">T = Terraced</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🏢</span>
                          <span className="text-gray-700">F = Flat/Maisonette</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🏭</span>
                          <span className="text-gray-700">O = Other</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return <span className="text-gray-600">{summary.mostCommonType}</span>;
            })()}
          </div>
        </ExpandableSection>

        {/* Date Range Analysis */}
        <ExpandableSection
          title="Date Range Analysis"
          icon={<Calendar className="h-5 w-5 text-green-600" />}
          isExpanded={expandedSection === 'date-range'}
          onToggle={() => setExpandedSection(expandedSection === 'date-range' ? null : 'date-range')}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-green-800 mb-1">Earliest Sale</div>
                <div className="text-lg font-semibold text-green-900">
                  {formatDate(summary.dateRange.earliest)}
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-800 mb-1">Latest Sale</div>
                <div className="text-lg font-semibold text-blue-900">
                  {formatDate(summary.dateRange.latest)}
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Data covers a {(() => {
                const start = new Date(summary.dateRange.earliest);
                const end = new Date(summary.dateRange.latest);
                const years = end.getFullYear() - start.getFullYear();
                return `${years} year${years !== 1 ? 's' : ''} period`;
              })()} of property sales in this area.
            </div>
          </div>
        </ExpandableSection>

        {/* Market Insights */}
        <ExpandableSection
          title="Market Insights"
          icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
          isExpanded={expandedSection === 'market-insights'}
          onToggle={() => setExpandedSection(expandedSection === 'market-insights' ? null : 'market-insights')}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatPrice(summary.avgPrice)}
                </div>
                <div className="text-sm text-purple-700">Average Price</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {summary.totalProperties}
                </div>
                <div className="text-sm text-orange-700">Total Sales</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(summary.priceRange)}
                </div>
                <div className="text-sm text-green-700">Price Range</div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-700">
                <strong>Market Summary:</strong> This area shows a diverse property market with prices ranging from {formatPrice(summary.minPrice)} to {formatPrice(summary.maxPrice)}. 
                The average property price of {formatPrice(summary.avgPrice)} indicates {summary.avgPrice > 500000 ? 'a premium market' : summary.avgPrice > 300000 ? 'a mid-range market' : 'an affordable market'}.
              </div>
            </div>
          </div>
        </ExpandableSection>
      </div>
    </div>
  );
};

export default EnhancedResultsSummary; 