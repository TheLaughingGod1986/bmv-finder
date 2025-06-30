'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Enhanced Components
import EnhancedSearch from './components/EnhancedSearch';
import EnhancedFilters from './components/EnhancedFilters';
import EnhancedResultsSummary from './components/EnhancedResultsSummary';
import EnhancedSoldPricesTable from './components/EnhancedSoldPricesTable';
import PropertyHistoryModal from './components/PropertyHistoryModal';
import PropertyModal from './components/PropertyModal';
import { ToastProvider, useToast } from './components/ToastProvider';
import { SoldPrice } from '../../types/sold-price';

// Components
import EnhancedEmptyState from './components/EnhancedEmptyState';
import PaginationLoadingOverlay from './components/PaginationLoadingOverlay';
import HeatmapView from './components/HeatmapView';

import { formatPrice } from '../lib/utils';
import { SalesPerYearBarChart, PropertyTypePieChart } from './components/AreaPriceTrendChart';

import type { PropertyData } from './components/PropertyModal';

const AreaPriceTrendChart = dynamic(() => import('./components/AreaPriceTrendChart'), { 
  ssr: false, 
  loading: () => <div className="mb-8 bg-white rounded-xl shadow p-4 text-center text-gray-400">Loading chart…</div> 
});

function HomeContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [soldPrices, setSoldPrices] = useState<SoldPrice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [paginationDirection, setPaginationDirection] = useState<'next' | 'previous'>('next');
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [lastUpdatedData, setLastUpdatedData] = useState<{
    lastUpdated: string;
    totalRecords?: number;
    indexSize?: string;
    source: string;
    note?: string;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof SoldPrice; direction: 'ascending' | 'descending' }>({
    key: 'dateOfTransfer',
    direction: 'descending'
  });
  const [filterDuration, setFilterDuration] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterYear, setFilterYear] = useState<string[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProperty] = useState<SoldPrice | null>(null);
  const [propertyHistory] = useState<SoldPrice[]>([]);
  const [useElastic, setUseElastic] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState<'table' | 'charts' | 'heatmap' | 'cards'>('table');
  
  // New modal state
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<PropertyData | null>(null);

  // Add state for selected row
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const { showToast } = useToast();

  // Function to enhance properties with BMV scores
  const enhancePropertiesWithBMVScores = useCallback(async (properties: SoldPrice[]) => {
    if (properties.length === 0) return properties;
    
    try {
      const response = await fetch('/api/enhance-properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.enhancedProperties;
      }
    } catch (error) {
      console.error('Failed to enhance properties with BMV scores:', error);
    }
    
    return properties;
  }, []);

  const isDateSortDisabled = useMemo(() => {
    if (soldPrices.length < 2) return true;
    const firstYear = soldPrices[0].dateOfTransfer.slice(0, 4);
    return soldPrices.every(p => p.dateOfTransfer.slice(0, 4) === firstYear);
  }, [soldPrices]);

  // Create a map of how many times each unique address appears
  const propertySaleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (!soldPrices || soldPrices.length === 0) {
      return counts;
    }
    for (const sp of soldPrices) {
      // Create a consistent key for each unique address
      const addressKey = [
        typeof sp.postcode === 'string' ? sp.postcode.trim().toUpperCase() : '',
        typeof sp.street === 'string' ? sp.street.trim().toUpperCase() : '',
        typeof sp.paon === 'string' ? sp.paon.trim().toUpperCase() : '',
        typeof sp.saon === 'string' ? sp.saon.trim().toUpperCase() : ''
      ].filter(Boolean).join('|');
      if(addressKey) {
        counts.set(addressKey, (counts.get(addressKey) || 0) + 1);
      }
    }
    return counts;
  }, [soldPrices]);

  // Check if a property has more than one sale record
  const getHasHistory = useCallback((property: SoldPrice) => {
    const addressKey = [
      typeof property.postcode === 'string' ? property.postcode.trim().toUpperCase() : '',
      typeof property.street === 'string' ? property.street.trim().toUpperCase() : '',
      typeof property.paon === 'string' ? property.paon.trim().toUpperCase() : '',
      typeof property.saon === 'string' ? property.saon.trim().toUpperCase() : ''
    ].filter(Boolean).join('|');
    return !!addressKey && (propertySaleCounts.get(addressKey) || 0) > 1;
  }, [propertySaleCounts]);

  const handleSearch = useCallback(async (searchPostcode: string, pageNum = 1) => {
    if (!searchPostcode.trim()) {
      showToast({
        type: 'warning',
        title: 'Search Required',
        message: 'Please enter a postcode, street name, or town to search.',
      });
      return;
    }

    // Determine if this is a pagination request or new search
    const isPaginationRequest = pageNum !== 1 && soldPrices.length > 0;
    let progressInterval: NodeJS.Timeout | undefined;
    if (isPaginationRequest) {
      setIsPaginationLoading(true);
      setPaginationDirection(pageNum > page ? 'next' : 'previous');
    } else {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);
      setProgress(0);
      setProgressMessage('Initializing search...');
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);
    }

    setPage(pageNum);

    try {
      if (!isPaginationRequest) {
        setProgressMessage('Connecting to data source...');
        setProgress(10);
      }

      const apiEndpoint = useElastic ? '/api/property-es' : '/api/property-csv';
      const requestBody = useElastic 
        ? { searchTerm: searchPostcode.trim(), page: pageNum, pageSize }
        : { postcode: searchPostcode.trim(), page: pageNum, pageSize };
        
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!isPaginationRequest) {
        setProgress(50);
        setProgressMessage('Processing results...');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!isPaginationRequest) {
        setProgress(90);
        setProgressMessage('Finalizing results...');
      }

      setTotalCount(data.totalCount || 0);
      if (data.data && data.data.length > 0) {
        // Enhance properties with BMV scores
        const enhancedData = await enhancePropertiesWithBMVScores(data.data);
        setSoldPrices(enhancedData);
        
        if (!isPaginationRequest) {
          setProgress(100);
          setProgressMessage('Search complete!');
          showToast({
            type: 'success',
            title: 'Search Complete',
            message: `Found ${data.totalCount} properties in ${searchPostcode}`,
          });
        }
      } else {
        setSoldPrices([]);
        if (!isPaginationRequest) {
          showToast({
            type: 'info',
            title: 'No Results',
            message: `No properties found for "${searchPostcode}"`,
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during search');
      setSoldPrices([]);
      
      if (!isPaginationRequest) {
        showToast({
          type: 'error',
          title: 'Search Failed',
          message: 'Unable to complete search. Please try again.',
        });
      }
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setIsLoading(false);
      setIsPaginationLoading(false);
      setProgress(0);
      setProgressMessage('');
    }
  }, [page, soldPrices.length, pageSize, useElastic, enhancePropertiesWithBMVScores, showToast]);

  useEffect(() => {
    const fetchLastUpdated = async () => {
      try {
        const response = await fetch('/api/last-updated');
        const data = await response.json();
        if (data.lastUpdated) {
          const formattedDate = new Date(data.lastUpdated).toLocaleString(
            'en-GB',
            {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }
          );
          setLastUpdated(formattedDate);
          setLastUpdatedData(data);
        }
      } catch {
        // Silent fail for last updated timestamp
      }
    };
    fetchLastUpdated();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('postcode') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      
      // Enter key in search input
      if (e.key === 'Enter' && document.activeElement?.id === 'postcode') {
        e.preventDefault();
        handleSearch(searchTerm);
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && document.activeElement?.id === 'postcode') {
        setSearchTerm('');
        setError(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, handleSearch]);

  // When searchTerm changes, reset to page 1
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const requestSort = (key: keyof SoldPrice) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Extract available years from soldPrices
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(soldPrices.map(sp => sp.dateOfTransfer.slice(0, 4))));
    return years.sort((a, b) => b.localeCompare(a)); // Descending order
  }, [soldPrices]);

  // Enhanced filtering with price and date ranges
  const filteredSoldPrices = useMemo(() => {
    let filtered = [...soldPrices];
    
    // Duration filter
    if (filterDuration.length > 0) {
      filtered = filtered.filter(sp => sp.duration && filterDuration.includes(sp.duration));
    }
    
    // Property type filter
    if (filterType.length > 0) {
      filtered = filtered.filter(sp => sp.propertyType && filterType.includes(sp.propertyType));
    }
    
    // Price range filter
    if (priceRange.min > 0 || priceRange.max < 10000000) {
      filtered = filtered.filter(sp => 
        typeof sp.price === 'number' &&
        sp.price >= priceRange.min && sp.price <= priceRange.max
      );
    }
    
    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(sp => {
        if (!sp.dateOfTransfer) return true;
        const saleDate = new Date(sp.dateOfTransfer);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        
        if (startDate && endDate) {
          return saleDate >= startDate && saleDate <= endDate;
        } else if (startDate) {
          return saleDate >= startDate;
        } else if (endDate) {
          return saleDate <= endDate;
        }
        return true;
      });
    }
    
    // Year filter
    if (filterYear.length > 0) {
      filtered = filtered.filter(sp => {
        const year = sp.dateOfTransfer.slice(0, 4);
        return filterYear.includes(year);
      });
    }
    
    return filtered;
  }, [soldPrices, filterDuration, filterType, priceRange, dateRange, filterYear]);

  // Deduplicate by address, keep only the latest sale
  const dedupedSoldPrices = useMemo(() => {
    const map = new Map<string, SoldPrice>();
    for (const sp of filteredSoldPrices) {
      const addressKey = [
        (sp.postcode || '').trim().toUpperCase(),
        (sp.street || '').trim().toUpperCase(),
        (sp.paon || '').trim().toUpperCase(),
        (sp.saon || '').trim().toUpperCase()
      ].join('|');
      if (!map.has(addressKey) || new Date(sp.dateOfTransfer) > new Date(map.get(addressKey)!.dateOfTransfer)) {
        map.set(addressKey, sp);
      }
    }
    return Array.from(map.values());
  }, [filteredSoldPrices]);

  // Sort the deduped results
  const sortedSoldPrices = useMemo(() => {
    return [...dedupedSoldPrices].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [dedupedSoldPrices, sortConfig]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (sortedSoldPrices.length === 0) {
      return {
        totalProperties: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        priceRange: 0,
        mostCommonType: '',
        dateRange: { earliest: '', latest: '' }
      };
    }

    const prices = sortedSoldPrices.map(sp => sp.price).filter(p => typeof p === 'number' && p > 0);
    const propertyTypes = sortedSoldPrices.map(sp => sp.propertyType).filter(Boolean);
    const dates = sortedSoldPrices.map(sp => sp.dateOfTransfer).filter(Boolean);

    const typeCounts = propertyTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonType = Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    return {
      totalProperties: sortedSoldPrices.length,
      avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      priceRange: prices.length > 0 ? Math.max(...prices) - Math.min(...prices) : 0,
      mostCommonType,
      dateRange: {
        earliest: dates.length > 0 ? new Date(Math.min(...dates.map(d => new Date(d).getTime()))).toISOString() : '',
        latest: dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))).toISOString() : ''
      }
    };
  }, [sortedSoldPrices]);

  const handleTryDifferentSearch = () => {
    setSearchTerm('');
    setSoldPrices([]);
    setError(null);
    setHasSearched(false);
  };

  const handleSearchSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion);
    handleSearch(suggestion);
  };

  const handleExport = () => {
    if (sortedSoldPrices.length === 0) {
      showToast({
        type: 'warning',
        title: 'No Data',
        message: 'No data to export. Please search for properties first.',
      });
      return;
    }

    const csvContent = [
      ['Address', 'Date', 'Price', 'Property Type', 'Duration'],
      ...sortedSoldPrices.map(sp => {
        const housePart = sp.paon && sp.saon ? `${sp.saon} ${sp.paon}` : sp.paon || sp.saon;
        const streetAddress = [housePart, sp.street].filter(Boolean).join(' ');
        const addressParts = [
          streetAddress,
          sp.locality,
          sp.town_city,
          sp.county
        ].filter(Boolean);
        const address = addressParts.join(', ');
        return [
          address,
          sp.dateOfTransfer,
          formatPrice(sp.price),
          sp.propertyType,
          sp.duration === 'F' ? 'Freehold' : 'Leasehold'
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-prices-${searchTerm}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Export Complete',
      message: 'Property data has been exported to CSV.',
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Property Prices Search',
        text: `Check out property prices in ${searchTerm}`,
        url: window.location.href,
      }).catch(() => {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
        showToast({
          type: 'success',
          title: 'Link Copied',
          message: 'Search link copied to clipboard.',
        });
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast({
        type: 'success',
        title: 'Link Copied',
        message: 'Search link copied to clipboard.',
      });
    }
  };

  const formatAddress = (sp: SoldPrice) => {
    const houseAndStreet = [sp.paon, sp.street].filter(Boolean).join(' ');
    const addressParts = [
      houseAndStreet,
      sp.town_city
    ].filter(Boolean);
    return addressParts.join(', ');
  };

  const formatPropertyType = (type: string) => {
    const typeMap: Record<string, string> = {
      'D': 'Detached',
      'S': 'Semi-detached', 
      'T': 'Terraced',
      'F': 'Flat/Maisonette',
      'O': 'Other'
    };
    return typeMap[type] || type;
  };

  const formatDuration = (duration: string) => {
    return duration === 'F' ? 'Freehold' : 'Leasehold';
  };

  // Type guards for optional fields
  function hasStringProp<T>(obj: T, prop: string): obj is T & Record<string, string> {
    return typeof (obj as Record<string, unknown>)[prop] === 'string';
  }
  function hasNumberProp<T>(obj: T, prop: string): obj is T & Record<string, number> {
    return typeof (obj as Record<string, unknown>)[prop] === 'number';
  }

  const handlePropertyClick = (property: SoldPrice) => {
    setSelectedPropertyForModal({
      id: property.id,
      price: property.price,
      dateOfTransfer: property.dateOfTransfer,
      postcode: property.postcode,
      propertyType: property.propertyType,
      propertyTypeLabel: hasStringProp(property, 'propertyTypeLabel') ? property.propertyTypeLabel : '',
      street: property.street,
      town_city: property.town_city,
      county: property.county,
      paon: property.paon,
      saon: property.saon,
      duration: property.duration,
      durationLabel: hasStringProp(property, 'durationLabel') ? property.durationLabel : '',
      locality: property.locality,
      fullAddress: hasStringProp(property, 'fullAddress') ? property.fullAddress : '',
      year: hasNumberProp(property, 'year') ? property.year : 0,
      month: hasNumberProp(property, 'month') ? property.month : 0,
      priceRange: hasStringProp(property, 'priceRange') ? property.priceRange : '',
    });
    setShowPropertyModal(true);
    setSelectedRowId(property.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="container flex flex-col sm:flex-row justify-between items-center py-3 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold gradient-text leading-tight text-gray-900">Sold Property Prices</span>
            </div>
          </div>
          {lastUpdated && (
            <div className="text-xs text-slate-500 mt-2 sm:mt-0">
              <div className="flex items-center gap-1">
                <span>Last updated: {lastUpdated}</span>
                {lastUpdatedData && lastUpdatedData.source === 'Elasticsearch' && (
                  <div className="relative group">
                    <svg className="w-3 h-3 text-slate-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                      <div className="font-semibold mb-1">Elasticsearch Database</div>
                      <div>• {lastUpdatedData.totalRecords?.toLocaleString()} property records</div>
                      <div>• {lastUpdatedData.indexSize} of data</div>
                      <div>• Latest transaction: {lastUpdatedData.lastUpdated}</div>
                      <div className="mt-1 text-slate-300">Data imported from UK Land Registry CSV</div>
                    </div>
                  </div>
                )}
              </div>
              {lastUpdatedData && lastUpdatedData.source === 'Elasticsearch' && (
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    {lastUpdatedData.totalRecords?.toLocaleString()} records
                  </span>
                  <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs">
                    {lastUpdatedData.indexSize}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center mb-6">
          <button
            className={`px-4 py-2 rounded-lg font-semibold shadow transition-colors duration-200 ${
              useElastic ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setUseElastic((prev) => !prev)}
          >
            {useElastic ? 'Using Elasticsearch' : 'Using Land Registry API'}
          </button>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold gradient-text leading-tight mb-3 text-center">UK Sold Property Price Search & Analysis</h1>
        <p className="mb-10 text-lg text-slate-600 max-w-2xl mx-auto text-center font-medium">
          Instantly search and analyze millions of sold house prices from the official HM Land Registry. Whether you&apos;re buying, selling, or just curious, our tool provides detailed property data, market trends, and regional analysis to help you make informed decisions.
        </p>
        <div className="mb-10 max-w-xl mx-auto">
          <EnhancedSearch
            value={searchTerm}
            onChange={setSearchTerm}
            onSearch={handleSearch}
            isLoading={isLoading}
            className="shadow-lg rounded-xl"
          />
        </div>

        {/* Progress Bar */}
        {isLoading && (
          <div className="mb-10 bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{progressMessage}</span>
              <span className="text-sm font-medium text-blue-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {progress < 50 && "Connecting to Land Registry database..."}
              {progress >= 50 && progress < 90 && "Processing property data..."}
              {progress >= 90 && "Finalizing results..."}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-10 p-6 bg-red-50 border border-red-200 rounded-2xl flex flex-col items-center shadow-md">
            <svg className="w-10 h-10 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
            <p className="text-red-800 text-lg font-semibold mb-1">Something went wrong</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {hasSearched && soldPrices.length === 0 && !isLoading && (
          <EnhancedEmptyState
            postcode={searchTerm}
            hasSearched={hasSearched}
            onTryDifferentSearch={handleTryDifferentSearch}
            onSearchSuggestion={handleSearchSuggestion}
          />
        )}

        {soldPrices.length > 0 && (
          <>
            <div className="mb-8">
              <motion.div
                animate={{ 
                  opacity: isPaginationLoading ? 0.6 : 1,
                  scale: isPaginationLoading ? 0.98 : 1
                }}
                transition={{ duration: 0.3 }}
              >
                <EnhancedResultsSummary
                  summary={summary}
                  postcode={searchTerm}
                  onExport={handleExport}
                  onShare={handleShare}
                  className="rounded-2xl shadow-xl bg-white p-6"
                />
              </motion.div>
            </div>

            {hasSearched && (
              <div className="mb-8">
                <motion.div
                  animate={{ 
                    opacity: isPaginationLoading ? 0.6 : 1,
                    scale: isPaginationLoading ? 0.98 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <EnhancedFilters
                    isLoading={isLoading}
                    filterDuration={filterDuration}
                    setFilterDuration={setFilterDuration}
                    filterType={filterType}
                    setFilterType={setFilterType}
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    filterYear={filterYear}
                    setFilterYear={setFilterYear}
                    availableYears={availableYears}
                    className="mb-0"
                  />
                </motion.div>
              </div>
            )}

            {/* View Mode Selector */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setCurrentViewMode('table')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  currentViewMode === 'table' 
                    ? "bg-blue-100 text-blue-800" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                Table
              </button>
              <button
                onClick={() => setCurrentViewMode('cards')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  currentViewMode === 'cards' 
                    ? "bg-blue-100 text-blue-800" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                Cards
              </button>
            </div>

            {/* Charts View */}
            {currentViewMode === 'charts' && (
              <>
                <motion.div 
                  className="mb-10"
                  animate={{ 
                    opacity: isPaginationLoading ? 0.6 : 1,
                    scale: isPaginationLoading ? 0.98 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <AreaPriceTrendChart
                    labels={sortedSoldPrices.map((sp) => sp.dateOfTransfer.slice(0, 4))}
                    data={sortedSoldPrices.map((sp) => sp.price)}
                    areaName={searchTerm}
                    className="rounded-2xl shadow-xl bg-white p-6"
                  />
                </motion.div>

                <motion.div 
                  className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-8"
                  animate={{ 
                    opacity: isPaginationLoading ? 0.6 : 1,
                    scale: isPaginationLoading ? 0.98 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="rounded-2xl shadow-xl bg-white p-6">
                    <SalesPerYearBarChart soldPrices={sortedSoldPrices} />
                  </div>
                  <div className="rounded-2xl shadow-xl bg-white p-6">
                    <PropertyTypePieChart soldPrices={sortedSoldPrices} />
                  </div>
                </motion.div>
              </>
            )}

            {/* Heatmap View */}
            {currentViewMode === 'heatmap' && (
              <motion.div 
                className="mb-10"
                animate={{ 
                  opacity: isPaginationLoading ? 0.6 : 1,
                  scale: isPaginationLoading ? 0.98 : 1
                }}
                transition={{ duration: 0.3 }}
              >
                <HeatmapView 
                  properties={soldPrices}
                  onPostcodeClick={(postcode) => {
                    setSearchTerm(postcode);
                    handleSearch(postcode, 1);
                  }}
                />
              </motion.div>
            )}

            {/* Table View */}
            {currentViewMode === 'table' && (
              <>
                {/* Table/cards full width */}
                <motion.div 
                  className="mb-10 w-full"
                  animate={{ 
                    opacity: isPaginationLoading ? 0.6 : 1,
                    scale: isPaginationLoading ? 0.98 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <EnhancedSoldPricesTable
                    soldPrices={sortedSoldPrices}
                    allSoldPrices={soldPrices}
                    formatAddress={formatAddress}
                    formatDuration={formatDuration}
                    formatPropertyType={formatPropertyType}
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                    getHasHistory={getHasHistory}
                    isDateSortDisabled={isDateSortDisabled}
                    onShowHistory={(property) => {
                      handlePropertyClick(property);
                    }}
                    selectedRowId={selectedRowId}
                  />
                </motion.div>
              </>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-6 my-12 p-4 bg-white rounded-2xl shadow-md border border-blue-100">
              <button
                className={cn(
                  "px-5 py-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400",
                  "flex items-center gap-2",
                  isPaginationLoading || page <= 1 || isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105 active:scale-95"
                )}
                onClick={() => handleSearch(searchTerm, page - 1)}
                disabled={page <= 1 || isLoading || isPaginationLoading}
              >
                {isPaginationLoading && paginationDirection === 'previous' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-4 w-4" />
                  </motion.div>
                )}
                Previous
              </button>
              
              <div className="text-center">
                <div className="text-base font-medium">
                  Page {page}
                  {isPaginationLoading && (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="ml-2 text-blue-600"
                    >
                      Loading...
                    </motion.span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {totalCount > 0 ? `Showing ${((page - 1) * pageSize) + 1}-${Math.min(page * pageSize, totalCount)} of ${totalCount} results` : ''}
                </div>
              </div>
              
              <button
                className={cn(
                  "px-5 py-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400",
                  "flex items-center gap-2",
                  isPaginationLoading || page * pageSize >= totalCount || isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105 active:scale-95"
                )}
                onClick={() => handleSearch(searchTerm, page + 1)}
                disabled={page * pageSize >= totalCount || isLoading || isPaginationLoading}
              >
                Next
                {isPaginationLoading && paginationDirection === 'next' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-4 w-4" />
                  </motion.div>
                )}
              </button>
            </div>

            {/* Pagination Loading Overlay */}
            <PaginationLoadingOverlay 
              isLoading={isPaginationLoading}
              direction={paginationDirection}
            />
          </>
        )}
      </main>

      <PropertyHistoryModal
        open={showHistoryModal}
        property={selectedProperty}
        history={propertyHistory}
        onClose={() => { setShowHistoryModal(false); setSelectedRowId(null); }}
      />

      <PropertyModal
        isOpen={showPropertyModal}
        property={selectedPropertyForModal}
        onClose={() => { setShowPropertyModal(false); setSelectedRowId(null); }}
      />

      <Analytics />
      <SpeedInsights />
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <HomeContent />
    </ToastProvider>
  );
}
