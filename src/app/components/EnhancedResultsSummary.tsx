'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
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
}

const EnhancedResultsSummary: React.FC<EnhancedResultsSummaryProps> = ({ 
  summary
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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