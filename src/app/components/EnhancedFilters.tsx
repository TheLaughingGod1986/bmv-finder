'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, ChevronUp, Home, Building, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EnhancedFiltersProps {
  isLoading: boolean;
  filterDuration: string[];
  setFilterDuration: React.Dispatch<React.SetStateAction<string[]>>;
  filterType: string[];
  setFilterType: React.Dispatch<React.SetStateAction<string[]>>;
  priceRange: { min: number; max: number };
  setPriceRange: React.Dispatch<React.SetStateAction<{ min: number; max: number }>>;
  dateRange: { start: string; end: string };
  setDateRange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
  className?: string;
}

const EnhancedFilters: React.FC<EnhancedFiltersProps> = ({
  isLoading,
  filterDuration,
  setFilterDuration,
  filterType,
  setFilterType,
  priceRange,
  setPriceRange,
  dateRange,
  setDateRange,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (filterDuration.length > 0) count += filterDuration.length;
    if (filterType.length > 0) count += filterType.length;
    if (priceRange.min > 0 || priceRange.max < 10000000) count += 1;
    if (dateRange.start || dateRange.end) count += 1;
    setActiveFilters(count);
  }, [filterDuration, filterType, priceRange, dateRange]);

  const handleDurationToggle = (duration: string) => {
    setFilterDuration(prev => 
      prev.includes(duration) 
        ? prev.filter(d => d !== duration)
        : [...prev, duration]
    );
  };

  const handleTypeToggle = (type: string) => {
    setFilterType(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearAllFilters = () => {
    setFilterDuration([]);
    setFilterType([]);
    setPriceRange({ min: 0, max: 10000000 });
    setDateRange({ start: '', end: '' });
  };

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

  const FilterChip = ({ label, isActive, onClick, icon }: {
    label: string;
    isActive: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
        "border-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
        isActive
          ? "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200"
          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      {icon}
      {label}
    </button>
  );

  const MobileFilterButton = () => (
    <button
      onClick={() => setShowMobileFilters(true)}
      disabled={isLoading}
      className={cn(
        "md:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3",
        "bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      <Filter className="h-5 w-5" />
      <span className="font-medium">Filters</span>
      {activeFilters > 0 && (
        <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full min-w-[20px]">
          {activeFilters}
        </span>
      )}
    </button>
  );

  const MobileFilterModal = () => (
    <AnimatePresence>
      {showMobileFilters && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            onClick={() => setShowMobileFilters(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Duration Filter */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Tenure Type</h4>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      label="All"
                      isActive={filterDuration.length === 0}
                      onClick={() => setFilterDuration([])}
                    />
                    <FilterChip
                      label="Freehold"
                      isActive={filterDuration.includes('F')}
                      onClick={() => handleDurationToggle('F')}
                    />
                    <FilterChip
                      label="Leasehold"
                      isActive={filterDuration.includes('L')}
                      onClick={() => handleDurationToggle('L')}
                    />
                  </div>
                </div>

                {/* Property Type Filter */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Property Type</h4>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      label="All"
                      isActive={filterType.length === 0}
                      onClick={() => setFilterType([])}
                    />
                    <FilterChip
                      label="Detached"
                      isActive={filterType.includes('D')}
                      onClick={() => handleTypeToggle('D')}
                      icon={getPropertyTypeIcon('D')}
                    />
                    <FilterChip
                      label="Semi-detached"
                      isActive={filterType.includes('S')}
                      onClick={() => handleTypeToggle('S')}
                      icon={getPropertyTypeIcon('S')}
                    />
                    <FilterChip
                      label="Terraced"
                      isActive={filterType.includes('T')}
                      onClick={() => handleTypeToggle('T')}
                      icon={getPropertyTypeIcon('T')}
                    />
                    <FilterChip
                      label="Flat/Maisonette"
                      isActive={filterType.includes('F')}
                      onClick={() => handleTypeToggle('F')}
                      icon={getPropertyTypeIcon('F')}
                    />
                    <FilterChip
                      label="Other"
                      isActive={filterType.includes('O')}
                      onClick={() => handleTypeToggle('O')}
                      icon={getPropertyTypeIcon('O')}
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Price Range</h4>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min || ''}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) || 0 }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max === 10000000 ? '' : priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) || 10000000 }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Date Range</h4>
                  <div className="space-y-3">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className={cn("hidden md:block", className)}>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
              {activeFilters > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                  {activeFilters}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {activeFilters > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                  {/* Price Range */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Price Range</h4>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min || ''}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) || 0 }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max === 10000000 ? '' : priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) || 10000000 }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  {/* Date Range */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Date Range</h4>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {/* Duration Filter */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Tenure Type</h4>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="All"
                  isActive={filterDuration.length === 0}
                  onClick={() => setFilterDuration([])}
                />
                <FilterChip
                  label="Freehold"
                  isActive={filterDuration.includes('F')}
                  onClick={() => handleDurationToggle('F')}
                />
                <FilterChip
                  label="Leasehold"
                  isActive={filterDuration.includes('L')}
                  onClick={() => handleDurationToggle('L')}
                />
              </div>
            </div>

            {/* Property Type Filter */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Property Type</h4>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="All"
                  isActive={filterType.length === 0}
                  onClick={() => setFilterType([])}
                />
                <FilterChip
                  label="Detached"
                  isActive={filterType.includes('D')}
                  onClick={() => handleTypeToggle('D')}
                  icon={getPropertyTypeIcon('D')}
                />
                <FilterChip
                  label="Semi-detached"
                  isActive={filterType.includes('S')}
                  onClick={() => handleTypeToggle('S')}
                  icon={getPropertyTypeIcon('S')}
                />
                <FilterChip
                  label="Terraced"
                  isActive={filterType.includes('T')}
                  onClick={() => handleTypeToggle('T')}
                  icon={getPropertyTypeIcon('T')}
                />
                <FilterChip
                  label="Flat/Maisonette"
                  isActive={filterType.includes('F')}
                  onClick={() => handleTypeToggle('F')}
                  icon={getPropertyTypeIcon('F')}
                />
                <FilterChip
                  label="Other"
                  isActive={filterType.includes('O')}
                  onClick={() => handleTypeToggle('O')}
                  icon={getPropertyTypeIcon('O')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Button */}
      <MobileFilterButton />

      {/* Mobile Filter Modal */}
      <MobileFilterModal />
    </>
  );
};

export default EnhancedFilters; 