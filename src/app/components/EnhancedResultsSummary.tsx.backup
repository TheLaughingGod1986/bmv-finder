'use client';


import { 
  TrendingUp, 
  Home, 
  Calendar,
  MapPin,
  Clock,
  BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface EnhancedResultsSummaryProps {
  totalCount: number;
  displayedCount: number;
  searchTerm: string;
  lastUpdatedData?: {
    lastUpdated: string;
    totalRecords?: number;
    indexSize?: string;
    source: string;
    note?: string;
  } | null;
  className?: string;
  totalGrowth?: { amount: number; percent: number } | null;
}

const EnhancedResultsSummary: React.FC<EnhancedResultsSummaryProps> = ({ 
  totalCount,
  displayedCount,
  searchTerm,
  lastUpdatedData,
  className,
  totalGrowth
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-soft p-6 mb-8", className)}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Search Results Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-text-primary">
              Search Results for &quot;{searchTerm}&quot;
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>
                Showing {displayedCount} of {totalCount.toLocaleString()} properties
              </span>
            </div>
            
            {lastUpdatedData?.lastUpdated && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Last updated: {formatDate(lastUpdatedData.lastUpdated)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {totalCount.toLocaleString()}
            </div>
            <div className="text-xs text-text-secondary">Total Properties</div>
          </div>
          
          <div className="text-center relative group">
            <div className="text-2xl font-bold text-secondary-600">
              {displayedCount}
            </div>
            <div className="text-xs text-text-secondary inline-flex items-center gap-1">
              Displayed
              <span className="ml-1 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" /></svg>
                <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 whitespace-normal shadow-lg pointer-events-none">
                  Only properties with complete price and address details are shown. Duplicates are also removed.
                </span>
              </span>
            </div>
          </div>
          {totalGrowth && (
            <div className="text-center flex flex-col items-center">
              <div className={
                'text-2xl font-bold ' +
                (totalGrowth.amount > 0 ? 'text-green-600' : totalGrowth.amount < 0 ? 'text-red-600' : 'text-gray-700')
              }>
                <span className="inline-flex items-center gap-1">
                  {totalGrowth.amount > 0 ? <TrendingUp className="w-5 h-5 inline-block" /> : null}
                  {totalGrowth.amount > 0 ? '+' : ''}£{totalGrowth.amount.toLocaleString()} <span className="text-base font-normal">({totalGrowth.percent > 0 ? '+' : ''}{totalGrowth.percent.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="text-xs text-text-secondary">Total Growth</div>
            </div>
          )}
        </div>
        {/* Inline explanation note */}
        {displayedCount < totalCount && (
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" /></svg>
            Some results are hidden due to missing price or address details, or because they are duplicates.
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedResultsSummary;