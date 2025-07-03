'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Home, Building, Layers } from 'lucide-react';
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
  filterYear: string[];
  setFilterYear: React.Dispatch<React.SetStateAction<string[]>>;
  availableYears: string[];
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
  filterYear,
  setFilterYear,
  availableYears,
  className
}) => {
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
        "w-32",
        "inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200",
        "border-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
        "hover:scale-105 active:scale-95",
        isActive
          ? "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 shadow-md"
          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      {icon}
      <span className="w-full text-center">{label}</span>
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
        "hover:scale-105 active:scale-95",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      <Filter className="h-5 w-5" />
      <span className="font-medium">Filters</span>
      {activeFilters > 0 && (
        <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full min-w-[20px] shadow-sm">
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
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 md:hidden max-h-[85vh] overflow-y-auto shadow-2xl border-t border-gray-200"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
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
                      isActive={filterType.includes('Detached')}
                      onClick={() => handleTypeToggle('Detached')}
                      icon={getPropertyTypeIcon('Detached')}
                    />
                    <FilterChip
                      label="Semi-detached"
                      isActive={filterType.includes('Semi-detached')}
                      onClick={() => handleTypeToggle('Semi-detached')}
                      icon={getPropertyTypeIcon('Semi-detached')}
                    />
                    <FilterChip
                      label="Terraced"
                      isActive={filterType.includes('Terraced')}
                      onClick={() => handleTypeToggle('Terraced')}
                      icon={getPropertyTypeIcon('Terraced')}
                    />
                    <FilterChip
                      label="Flat/Maisonette"
                      isActive={filterType.includes('Flat/Maisonette')}
                      onClick={() => handleTypeToggle('Flat/Maisonette')}
                      icon={getPropertyTypeIcon('Flat/Maisonette')}
                    />
                    <FilterChip
                      label="Other"
                      isActive={filterType.includes('Other')}
                      onClick={() => handleTypeToggle('Other')}
                      icon={getPropertyTypeIcon('Other')}
                    />
                  </div>
                </div>

                {/* Year Filter */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Year</h4>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      label="All"
                      isActive={filterYear.length === 0}
                      onClick={() => setFilterYear([])}
                    />
                    {availableYears.map(year => (
                      <FilterChip
                        key={year}
                        label={year}
                        isActive={filterYear.includes(year)}
                        onClick={() => setFilterYear((fy: string[]) => fy.includes(year) ? fy.filter(x => x !== year) : [...fy, year])}
                      />
                    ))}
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

  // Desktop filter bar
  const DesktopFilters = () => (
    <div className="bg-white/95 rounded-2xl shadow-lg border border-slate-200 p-4 mt-8 flex flex-col gap-4 md:flex-row md:items-end md:gap-4 transition-all">
      {/* Tenure Type Dropdown */}
      <div className="flex flex-col w-full md:w-auto">
        <label className="font-semibold text-sm mb-1">Tenure</label>
        <select
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          value={filterDuration[0] || ''}
          onChange={e => setFilterDuration(e.target.value ? [e.target.value] : [])}
          disabled={isLoading}
        >
          <option value="">All</option>
          <option value="F">Freehold</option>
          <option value="L">Leasehold</option>
        </select>
      </div>
      {/* Property Type Dropdown */}
      <div className="flex flex-col w-full md:w-auto">
        <label className="font-semibold text-sm mb-1">Property Type</label>
        <select
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          value={filterType[0] || ''}
          onChange={e => setFilterType(e.target.value ? [e.target.value] : [])}
          disabled={isLoading}
        >
          <option value="">All</option>
          <option value="D">Detached</option>
          <option value="S">Semi-detached</option>
          <option value="T">Terraced</option>
          <option value="F">Flat/Maisonette</option>
          <option value="O">Other</option>
        </select>
      </div>
      {/* Price Range */}
      <div className="flex flex-col w-full md:w-auto">
        <label className="font-semibold text-sm mb-1">Price Range (£)</label>
        <select
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          value={(() => {
            if (priceRange.min === 0 && priceRange.max === 10000000) return '';
            if (priceRange.max <= 100000) return 'under-100k';
            if (priceRange.min === 100000 && priceRange.max === 250000) return '100k-250k';
            if (priceRange.min === 250000 && priceRange.max === 500000) return '250k-500k';
            if (priceRange.min === 500000 && priceRange.max === 1000000) return '500k-1m';
            if (priceRange.min === 1000000) return 'over-1m';
            return '';
          })()}
          onChange={e => {
            const val = e.target.value;
            if (val === '') setPriceRange({ min: 0, max: 10000000 });
            else if (val === 'under-100k') setPriceRange({ min: 0, max: 100000 });
            else if (val === '100k-250k') setPriceRange({ min: 100000, max: 250000 });
            else if (val === '250k-500k') setPriceRange({ min: 250000, max: 500000 });
            else if (val === '500k-1m') setPriceRange({ min: 500000, max: 1000000 });
            else if (val === 'over-1m') setPriceRange({ min: 1000000, max: 10000000 });
          }}
          disabled={isLoading}
        >
          <option value="">Any</option>
          <option value="under-100k">Under £100k</option>
          <option value="100k-250k">£100k–£250k</option>
          <option value="250k-500k">£250k–£500k</option>
          <option value="500k-1m">£500k–£1M</option>
          <option value="over-1m">Over £1M</option>
        </select>
      </div>
      {/* Sale Date */}
      <div className="flex flex-col w-full md:w-auto">
        <label className="font-semibold text-sm mb-1">Sale Date</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange(dr => ({ ...dr, start: e.target.value }))}
            className="w-36 px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            aria-label="Start date"
            disabled={isLoading}
          />
          <span className="text-slate-400">–</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange(dr => ({ ...dr, end: e.target.value }))}
            className="w-36 px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            aria-label="End date"
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      <DesktopFilters />
      <MobileFilterButton />
      <MobileFilterModal />
    </div>
  );
};

export default EnhancedFilters; 