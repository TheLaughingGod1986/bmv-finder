'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  PoundSterling, 
  Calendar, 
  Home, 
  TrendingUp,
  MapPin,
  Sliders,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface EnhancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    priceRange: { min: number; max: number };
    dateRange: { start: string; end: string };
    propertyType: string[];
    duration: string[];
    year: string[];
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
  className?: string;
}

const EnhancedFilters: React.FC<EnhancedFiltersProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onReset,
  className
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const propertyTypes = [
    { value: 'D', label: 'Detached' },
    { value: 'S', label: 'Semi-Detached' },
    { value: 'T', label: 'Terraced' },
    { value: 'F', label: 'Flat/Maisonette' },
    { value: 'O', label: 'Other' }
  ];

  const durations = [
    { value: 'F', label: 'Freehold' },
    { value: 'L', label: 'Leasehold' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      priceRange: { min: 0, max: 10000000 },
      dateRange: { start: '', end: '' },
      propertyType: [],
      duration: [],
      year: []
    };
    setLocalFilters(resetFilters);
    onReset();
  };

  const activeFiltersCount = [
    localFilters.priceRange.min > 0 || localFilters.priceRange.max < 10000000,
    localFilters.dateRange.start || localFilters.dateRange.end,
    localFilters.propertyType.length > 0,
    localFilters.duration.length > 0,
    localFilters.year.length > 0
  ].filter(Boolean).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-modal-backdrop"
            onClick={onClose}
          />

          {/* Filter Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-modal border-l border-gray-200"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Sliders className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Filters</h3>
                    <p className="text-sm text-text-secondary">
                      {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 text-text-tertiary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors touch-target"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
                {/* Price Range */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <PoundSterling className="w-4 h-4" />
                    Price Range
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-text-secondary mb-2">Min Price</label>
                      <input
                        type="number"
                        value={localFilters.priceRange.min || ''}
                        onChange={(e) => handleFilterChange('priceRange', {
                          ...localFilters.priceRange,
                          min: e.target.value ? parseInt(e.target.value) : 0
                        })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 sm:py-2.5 text-sm text-text-primary placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 transition-colors touch-target"
                        placeholder="£0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-2">Max Price</label>
                      <input
                        type="number"
                        value={localFilters.priceRange.max === 10000000 ? '' : localFilters.priceRange.max}
                        onChange={(e) => handleFilterChange('priceRange', {
                          ...localFilters.priceRange,
                          max: e.target.value ? parseInt(e.target.value) : 10000000
                        })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 sm:py-2.5 text-sm text-text-primary placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 transition-colors touch-target"
                        placeholder="No limit"
                      />
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <Calendar className="w-4 h-4" />
                    Date Range
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-text-secondary mb-2">From</label>
                      <input
                        type="date"
                        value={localFilters.dateRange.start}
                        onChange={(e) => handleFilterChange('dateRange', {
                          ...localFilters.dateRange,
                          start: e.target.value
                        })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 sm:py-2.5 text-sm text-text-primary focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 transition-colors touch-target"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-2">To</label>
                      <input
                        type="date"
                        value={localFilters.dateRange.end}
                        onChange={(e) => handleFilterChange('dateRange', {
                          ...localFilters.dateRange,
                          end: e.target.value
                        })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 sm:py-2.5 text-sm text-text-primary focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 transition-colors touch-target"
                      />
                    </div>
                  </div>
                </div>

                {/* Property Type */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <Home className="w-4 h-4" />
                    Property Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {propertyTypes.map((type) => (
                      <label
                        key={type.value}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 cursor-pointer transition-colors touch-target"
                      >
                        <input
                          type="checkbox"
                          checked={localFilters.propertyType.includes(type.value)}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...localFilters.propertyType, type.value]
                              : localFilters.propertyType.filter(t => t !== type.value);
                            handleFilterChange('propertyType', newTypes);
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-text-primary">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <TrendingUp className="w-4 h-4" />
                    Duration
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {durations.map((duration) => (
                      <label
                        key={duration.value}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 cursor-pointer transition-colors touch-target"
                      >
                        <input
                          type="checkbox"
                          checked={localFilters.duration.includes(duration.value)}
                          onChange={(e) => {
                            const newDurations = e.target.checked
                              ? [...localFilters.duration, duration.value]
                              : localFilters.duration.filter(d => d !== duration.value);
                            handleFilterChange('duration', newDurations);
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-text-primary">{duration.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Year */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <Calendar className="w-4 h-4" />
                    Year
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {years.map((year) => (
                      <label
                        key={year.value}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 cursor-pointer transition-colors touch-target"
                      >
                        <input
                          type="checkbox"
                          checked={localFilters.year.includes(year.value)}
                          onChange={(e) => {
                            const newYears = e.target.checked
                              ? [...localFilters.year, year.value]
                              : localFilters.year.filter(y => y !== year.value);
                            handleFilterChange('year', newYears);
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-text-primary">{year.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-gray-200 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-text-secondary bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors touch-target"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={handleApply}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors touch-target"
                  >
                    <Filter className="w-4 h-4" />
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EnhancedFilters; 