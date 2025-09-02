'use client';

import { useState, useEffect, useCallback } from 'react';
import { SearchFilters, FilterGroup, FilterOption } from '@/types/search';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Home, 
  PoundSterling, 
  Calendar,
  TrendingUp,
  Star,
  Settings,
  Save,
  Loader2
} from 'lucide-react';

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  isLoading?: boolean;
  totalResults?: number;
  onSaveSearch?: (name: string) => void;
  onLoadSavedSearch?: (searchId: string) => void;
  savedSearches?: any[];
}

export default function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  onSearch,
  isLoading = false,
  totalResults = 0,
  onSaveSearch,
  onLoadSavedSearch,
  savedSearches = []
}: AdvancedSearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['location', 'price']));
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Count active filters
  const activeFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.location?.postcode) count++;
    if (filters.location?.area) count++;
    if (filters.location?.radius) count++;
    if (filters.propertyType?.length) count++;
    if (filters.price?.min || filters.price?.max) count++;
    if (filters.size?.bedrooms?.min || filters.size?.bedrooms?.max) count++;
    if (filters.size?.bathrooms?.min || filters.size?.bathrooms?.max) count++;
    if (filters.dateRange?.soldAfter || filters.dateRange?.soldBefore) count++;
    if (filters.investment?.bmvScore?.min || filters.investment?.bmvScore?.max) count++;
    if (filters.features) {
      Object.values(filters.features).forEach(value => {
        if (typeof value === 'boolean' && value) count++;
        if (Array.isArray(value) && value.length > 0) count++;
      });
    }
    return count;
  }, [filters]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const updateFilter = (path: string, value: any) => {
    const newFilters = { ...filters };
    const keys = path.split('.');
    let current = newFilters as any;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    onFiltersChange(newFilters);
  };

  const clearFilter = (path: string) => {
    const newFilters = { ...filters };
    const keys = path.split('.');
    let current = newFilters as any;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        return;
      }
      current = current[keys[i]];
    }

    delete current[keys[keys.length - 1]];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim() && onSaveSearch) {
      onSaveSearch(saveSearchName.trim());
      setSaveSearchName('');
      setShowSaveDialog(false);
    }
  };

  const filterSections = [
    {
      id: 'location',
      title: 'Location',
      icon: MapPin,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Postcode
            </label>
            <input
              type="text"
              value={filters.location?.postcode || ''}
              onChange={(e) => updateFilter('location.postcode', e.target.value)}
              placeholder="e.g., SW1A 1AA"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Area
            </label>
            <input
              type="text"
              value={filters.location?.area || ''}
              onChange={(e) => updateFilter('location.area', e.target.value)}
              placeholder="e.g., Westminster, London"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Radius: {filters.location?.radius || 5} miles
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={filters.location?.radius || 5}
              onChange={(e) => updateFilter('location.radius', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )
    },
    {
      id: 'property',
      title: 'Property Type',
      icon: Home,
      content: (
        <div className="space-y-3">
          {['Flat', 'Terraced', 'Semi-Detached', 'Detached', 'House'].map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.propertyType?.includes(type) || false}
                onChange={(e) => {
                  const currentTypes = filters.propertyType || [];
                  const newTypes = e.target.checked
                    ? [...currentTypes, type]
                    : currentTypes.filter(t => t !== type);
                  updateFilter('propertyType', newTypes.length > 0 ? newTypes : undefined);
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{type}</span>
            </label>
          ))}
        </div>
      )
    },
    {
      id: 'price',
      title: 'Price Range',
      icon: PoundSterling,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum Price
            </label>
            <input
              type="number"
              value={filters.price?.min || ''}
              onChange={(e) => updateFilter('price.min', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="£0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Price
            </label>
            <input
              type="number"
              value={filters.price?.max || ''}
              onChange={(e) => updateFilter('price.max', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="No limit"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      )
    },
    {
      id: 'size',
      title: 'Size & Rooms',
      icon: Home,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Bedrooms
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={filters.size?.bedrooms?.min || ''}
                onChange={(e) => updateFilter('size.bedrooms.min', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Bedrooms
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={filters.size?.bedrooms?.max || ''}
                onChange={(e) => updateFilter('size.bedrooms.max', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Bathrooms
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={filters.size?.bathrooms?.min || ''}
                onChange={(e) => updateFilter('size.bathrooms.min', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Bathrooms
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={filters.size?.bathrooms?.max || ''}
                onChange={(e) => updateFilter('size.bathrooms.max', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'date',
      title: 'Date Range',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sold After
            </label>
            <input
              type="date"
              value={filters.dateRange?.soldAfter || ''}
              onChange={(e) => updateFilter('dateRange.soldAfter', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sold Before
            </label>
            <input
              type="date"
              value={filters.dateRange?.soldBefore || ''}
              onChange={(e) => updateFilter('dateRange.soldBefore', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      )
    },
    {
      id: 'investment',
      title: 'Investment Criteria',
      icon: TrendingUp,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              BMV Score: {filters.investment?.bmvScore?.min || 0} - {filters.investment?.bmvScore?.max || 100}
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.investment?.bmvScore?.min || 0}
                onChange={(e) => updateFilter('investment.bmvScore.min', parseInt(e.target.value))}
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={filters.investment?.bmvScore?.max || 100}
                onChange={(e) => updateFilter('investment.bmvScore.max', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Market Trend
            </label>
            <select
              value={filters.investment?.marketTrend || 'any'}
              onChange={(e) => updateFilter('investment.marketTrend', e.target.value === 'any' ? undefined : e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="any">Any Trend</option>
              <option value="rising">Rising</option>
              <option value="falling">Falling</option>
              <option value="stable">Stable</option>
            </select>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: 'Property Features',
      icon: Star,
      content: (
        <div className="space-y-3">
          {[
            { key: 'parking', label: 'Parking' },
            { key: 'garden', label: 'Garden' },
            { key: 'garage', label: 'Garage' },
            { key: 'conservatory', label: 'Conservatory' },
            { key: 'loft', label: 'Loft' },
            { key: 'basement', label: 'Basement' }
          ].map((feature) => (
            <label key={feature.key} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.features?.[feature.key as keyof typeof filters.features] as boolean || false}
                onChange={(e) => updateFilter(`features.${feature.key}`, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{feature.label}</span>
            </label>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Advanced Filters
            </h3>
            {activeFiltersCount() > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {activeFiltersCount()} active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeFiltersCount() > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Results Summary */}
        <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{totalResults.toLocaleString()} properties found</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
            >
              <Save className="h-4 w-4" />
              <span>Save Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Sections */}
      {isOpen && (
        <div className="p-4 space-y-4">
          {filterSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.has(section.id);
            
            return (
              <div key={section.id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{section.title}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {isExpanded && (
                  <div className="px-4 pb-4">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}

          {/* Search Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onSearch}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4" />
                  <span>Apply Filters</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Search
            </h3>
            <input
              type="text"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              placeholder="Enter search name..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!saveSearchName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
