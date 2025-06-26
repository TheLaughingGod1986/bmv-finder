'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import dynamic from 'next/dynamic';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Enhanced Components
import EnhancedSearch from './components/EnhancedSearch';
import EnhancedFilters from './components/EnhancedFilters';
import EnhancedResultsSummary from './components/EnhancedResultsSummary';
import EnhancedSoldPricesTable from './components/EnhancedSoldPricesTable';
import PropertyHistoryModal from './components/PropertyHistoryModal';
import { ToastProvider, useToast } from './components/ToastProvider';
import { SoldPrice } from '../../types/sold-price';

// Original Components (keeping for compatibility)
import ChartsPanel from './components/ChartsPanel';
import InstallPrompt from './components/InstallPrompt';
import EnhancedEmptyState from './components/EnhancedEmptyState';

import { formatPrice } from '../lib/utils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AreaPriceTrendChart = dynamic(() => import('./components/AreaPriceTrendChart'), { 
  ssr: false, 
  loading: () => <div className="mb-8 bg-white rounded-xl shadow p-4 text-center text-gray-400">Loading chart…</div> 
});

function HomeContent() {
  const [postcode, setPostcode] = useState('');
  const [soldPrices, setSoldPrices] = useState<SoldPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showPostcodeHint, setShowPostcodeHint] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [historyModal, setHistoryModal] = useState<{ open: boolean; property: SoldPrice | null; history: SoldPrice[] }>({ 
    open: false, 
    property: null, 
    history: [] 
  });
  
  // Enhanced filter states
  const [filterDuration, setFilterDuration] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000000 });
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [filterYear, setFilterYear] = useState<string[]>([]);
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof SoldPrice; direction: 'ascending' | 'descending' }>({
    key: 'price',
    direction: 'descending',
  });

  const { showToast } = useToast();

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

  const handleSearch = useCallback(async (searchPostcode: string) => {
    if (!searchPostcode.trim()) {
      showToast({
        type: 'warning',
        title: 'Search Required',
        message: 'Please enter a postcode, street name, or town to search.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setShowPostcodeHint(false);

    try {
      const response = await fetch('/api/property-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postcode: searchPostcode.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response:', data);
      
      if (data.data && data.data.length > 0) {
        setSoldPrices(data.data);
        showToast({
          type: 'success',
          title: 'Search Complete',
          message: `Found ${data.data.length} properties in ${searchPostcode}`,
        });
      } else {
        setSoldPrices([]);
        setShowPostcodeHint(true);
        showToast({
          type: 'info',
          title: 'No Results',
          message: 'No properties found. Try a broader search area.',
        });
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to fetch property data. Please try again.');
      setSoldPrices([]);
      showToast({
        type: 'error',
        title: 'Search Failed',
        message: 'Unable to fetch property data. Please check your connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const fetchLastUpdated = async () => {
      try {
        console.log('Fetching last updated timestamp...');
        const response = await fetch('/api/last-updated');
        const data = await response.json();
        console.log('Last updated response:', data);
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
          console.log('Setting last updated to:', formattedDate);
          setLastUpdated(formattedDate);
        } else {
          console.log('No lastUpdated timestamp found in response');
        }
      } catch (err) {
        console.error('Failed to fetch last updated timestamp', err);
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
        handleSearch(postcode);
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && document.activeElement?.id === 'postcode') {
        setPostcode('');
        setError(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [postcode, handleSearch]);

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
    console.log('DEBUG: filterType:', filterType);
    console.log('DEBUG: propertyTypes in soldPrices:', soldPrices.map(sp => sp.propertyType));
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
      filtered = filtered.filter(sp => filterYear.includes(sp.dateOfTransfer.slice(0, 4)));
    }
    
    // Sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [soldPrices, filterDuration, filterType, priceRange, dateRange, filterYear, sortConfig]);

  // Deduplicate by address, keep only the latest sale
  const dedupedSoldPrices = useMemo(() => {
    const map = new Map();
    for (const sp of filteredSoldPrices) {
      const addressKey = [
        typeof sp.postcode === 'string' ? sp.postcode.trim().toUpperCase() : '',
        typeof sp.street === 'string' ? sp.street.trim().toUpperCase() : '',
        typeof sp.paon === 'string' ? sp.paon.trim().toUpperCase() : '',
        typeof sp.saon === 'string' ? sp.saon.trim().toUpperCase() : ''
      ].filter(Boolean).join('|');
      if (!map.has(addressKey) || new Date(sp.dateOfTransfer) > new Date(map.get(addressKey).dateOfTransfer)) {
        map.set(addressKey, sp);
      }
    }
    return Array.from(map.values());
  }, [filteredSoldPrices]);

  // Results summary statistics
  const resultsSummary = useMemo(() => {
    if (filteredSoldPrices.length === 0) return null;
    
    const prices = filteredSoldPrices.map(sp => sp.price);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    const propertyTypes = filteredSoldPrices.reduce((acc, sp) => {
      acc[sp.propertyType] = (acc[sp.propertyType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonType = Object.entries(propertyTypes)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    const dates = filteredSoldPrices.map(sp => sp.dateOfTransfer).sort();
    
    return {
      totalProperties: filteredSoldPrices.length,
      avgPrice,
      minPrice,
      maxPrice,
      priceRange,
      mostCommonType: mostCommonType ? `${mostCommonType[0]} (${mostCommonType[1]})` : 'Unknown',
      dateRange: {
        earliest: dates[0],
        latest: dates[dates.length - 1],
      },
    };
  }, [filteredSoldPrices]);

  // Trend data for charts
  const trendData = useMemo(() => {
    if (dedupedSoldPrices.length === 0) return { years: [], avgPrices: [] };
    
    const yearData = dedupedSoldPrices.reduce((acc, sp) => {
      const year = sp.dateOfTransfer.slice(0, 4);
      if (!acc[year]) {
        acc[year] = { total: 0, count: 0 };
      }
      acc[year].total += sp.price;
      acc[year].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);
    
    const years = Object.keys(yearData).sort();
    const avgPrices = years.map(year => Math.round(yearData[year].total / yearData[year].count));
    
    return { years, avgPrices };
  }, [dedupedSoldPrices]);

  const handleSearchSuggestion = (suggestion: string) => {
    setPostcode(suggestion);
    handleSearch(suggestion);
  };

  const handleExport = () => {
    if (dedupedSoldPrices.length === 0) {
      showToast({
        type: 'warning',
        title: 'No Data to Export',
        message: 'Please search for properties first.',
      });
      return;
    }

    const csvContent = [
      ['Address', 'Price', 'Date', 'Property Type', 'Tenure', 'Postcode', 'Town/City', 'County'],
      ...dedupedSoldPrices.map(sp => [
        formatAddress(sp),
        formatPrice(sp.price),
        sp.dateOfTransfer,
        formatPropertyType(sp.propertyType),
        formatDuration(sp.duration),
        sp.postcode,
        sp.town_city,
        sp.county
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-prices-${postcode}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Export Complete',
      message: `Exported ${dedupedSoldPrices.length} properties to CSV`,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Property Prices in ${postcode}`,
        text: `Check out property prices in ${postcode} - ${dedupedSoldPrices.length} properties found!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast({
        type: 'success',
        title: 'Link Copied',
        message: 'Share link copied to clipboard',
      });
    }
  };

  // Formatting functions
  const formatAddress = (sp: SoldPrice) => {
    const parts = [sp.paon, sp.saon, sp.street].filter(Boolean);
    return parts.join(' ');
  };

  const formatPropertyType = (type: string) => {
    const types: { [key: string]: string } = {
      'D': 'Detached',
      'S': 'Semi-detached',
      'T': 'Terraced',
      'F': 'Flat/Maisonette',
      'O': 'Other',
    };
    return types[type] || type;
  };

  const formatDuration = (duration: string) => {
    return duration === 'F' ? 'Freehold' : 'Leasehold';
  };

  useEffect(() => {
    console.log('soldPrices state:', soldPrices);
  }, [soldPrices]);

  useEffect(() => {
    console.log('filteredSoldPrices:', filteredSoldPrices);
  }, [filteredSoldPrices]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Sold Property Prices
                </h1>
                <p className="text-sm text-gray-600">UK Land Registry Data</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">Land Registry Data Last Updated</p>
                <p className="text-xs text-gray-500">
                  {lastUpdated ? lastUpdated : 'Not available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SEO-friendly introduction */}
        <section className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold mb-2 text-gray-800 tracking-tight">
            The Ultimate Tool for UK Property Price Research
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Instantly search and analyze millions of sold house prices from the official HM Land Registry. Whether you&apos;re buying, selling, or just curious, our tool provides detailed property data, market trends, and regional analysis to help you make informed decisions.
          </p>
        </section>

        {/* Enhanced Search Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <EnhancedSearch
            value={postcode}
            onChange={setPostcode}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
          
          {showPostcodeHint && (
            <div className="text-blue-800 bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="font-semibold">No results for the full postcode?</p>
              <p>Try searching for just the first part of the postcode (e.g., &quot;SW1A&quot;) to see a wider area.</p>
            </div>
          )}
          
          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              {error}
            </div>
          )}
        </div>

        {/* Enhanced Filters */}
        {hasSearched && (
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
          />
        )}

        {/* Results block */}
        <div className="mt-8 min-h-[40vh]">
          {isLoading ? (
            <div className="text-center py-8 text-blue-700 font-semibold animate-pulse">
              Loading property data, this may take a few seconds...
            </div>
          ) : dedupedSoldPrices.length > 0 ? (
            <div>
              {resultsSummary && (
                <div className="mb-8">
                  <EnhancedResultsSummary 
                    summary={resultsSummary} 
                    postcode={postcode}
                    onExport={handleExport}
                    onShare={handleShare}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left side: charts */}
                <div className="lg:col-span-1 space-y-8">
                  <ChartsPanel 
                    soldPrices={dedupedSoldPrices} 
                    onPropertyTypeFilter={setFilterType}
                    selectedPropertyTypes={filterType}
                  />
                </div>
                
                {/* Right side: table and trend chart */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Area Price Trend Chart */}
                  {trendData.years.length > 1 && (
                    <section aria-labelledby="trend-chart-heading">
                      <AreaPriceTrendChart
                        labels={trendData.years}
                        data={trendData.avgPrices}
                        areaName={postcode}
                      />
                    </section>
                  )}

                  {/* Enhanced Sold Prices Table */}
                  <section aria-labelledby="sold-prices-heading">
                    <h2 id="sold-prices-heading" className="sr-only">
                      Sold Property Prices in {postcode}
                    </h2>
                    <EnhancedSoldPricesTable
                      soldPrices={dedupedSoldPrices.filter(sp => filterType.length === 0 || filterType.includes(sp.propertyType))}
                      formatAddress={formatAddress}
                      formatDuration={formatDuration}
                      formatPropertyType={formatPropertyType}
                      requestSort={requestSort}
                      sortConfig={sortConfig}
                      getHasHistory={getHasHistory}
                      isDateSortDisabled={isDateSortDisabled}
                      priceRange={priceRange}
                    />
                  </section>
                </div>
              </div>
              
              <PropertyHistoryModal
                open={historyModal.open}
                property={historyModal.property}
                history={historyModal.history}
                formatAddress={formatAddress}
                onClose={() => setHistoryModal({ open: false, property: null, history: [] })}
              />
            </div>
          ) : (
            <EnhancedEmptyState
              postcode={postcode}
              hasSearched={hasSearched}
              onTryDifferentSearch={() => {
                const searchInput = document.getElementById('postcode') as HTMLInputElement;
                if (searchInput) searchInput.focus();
                setSoldPrices([]);
                setHasSearched(false);
                setPostcode('');
                setError(null);
              }}
              onSearchSuggestion={handleSearchSuggestion}
            />
          )}
        </div>
        
        <Analytics />
        <SpeedInsights />
        <InstallPrompt />
      </main>
    </div>
  );
}

export default function EnhancedHome() {
  return (
    <ToastProvider>
      <HomeContent />
    </ToastProvider>
  );
} 