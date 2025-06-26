'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
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
import Filters from './components/Filters';
import SoldPricesTable from './components/SoldPricesTable';
import dynamic from 'next/dynamic';
import ChartsPanel from './components/ChartsPanel';
import InstallPrompt from './components/InstallPrompt';
import ResultsSummary from './components/ResultsSummary';
import EmptyState from './components/EmptyState';
import { SoldPrice } from '../../types/sold-price';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import PropertyHistoryModal from './components/PropertyHistoryModal';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AreaPriceTrendChart = dynamic(() => import('./components/AreaPriceTrendChart'), { ssr: false, loading: () => <div className="mb-8 bg-white rounded-xl shadow p-4 text-center text-gray-400">Loading chart…</div> });

export default function Home() {
  const [postcode, setPostcode] = useState('');
  const [soldPrices, setSoldPrices] = useState<SoldPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showPostcodeHint, setShowPostcodeHint] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [historyModal, setHistoryModal] = useState<{ open: boolean; property: SoldPrice | null; history: SoldPrice[] }>({ open: false, property: null, history: [] });
  const [filterDuration, setFilterDuration] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterYear, setFilterYear] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof SoldPrice; direction: 'ascending' | 'descending' }>({
    key: 'price',
    direction: 'descending',
  });

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
        sp.postcode,
        typeof sp.street === 'string' ? sp.street.trim().toLowerCase() : '',
        typeof sp.paon === 'string' ? sp.paon.trim().toLowerCase() : '',
        typeof sp.saon === 'string' ? sp.saon.trim().toLowerCase() : ''
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
      property.postcode,
      typeof property.street === 'string' ? property.street.trim().toLowerCase() : '',
      typeof property.paon === 'string' ? property.paon.trim().toLowerCase() : '',
      typeof property.saon === 'string' ? property.saon.trim().toLowerCase() : ''
    ].filter(Boolean).join('|');
    return !!addressKey && (propertySaleCounts.get(addressKey) || 0) > 1;
  }, [propertySaleCounts]);

  // Extract available years from soldPrices
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(soldPrices.map(sp => sp.dateOfTransfer.slice(0, 4))));
    return years.sort((a, b) => b.localeCompare(a)); // Descending order
  }, [soldPrices]);

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
  }, [postcode]);

  const requestSort = (key: keyof SoldPrice) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Compute filtered and sorted soldPrices
  const filteredSoldPrices = useMemo(() => {
    let filtered = [...soldPrices];
    if (filterDuration.length > 0) {
      filtered = filtered.filter(sp => filterDuration.includes(sp.duration));
    }
    if (filterType.length > 0) {
      filtered = filtered.filter(sp => filterType.includes(sp.propertyType));
    }
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
  }, [soldPrices, filterDuration, filterType, filterYear, sortConfig]);

  // Deduplicate by address, keep only the latest sale
  const dedupedSoldPrices = useMemo(() => {
    const map = new Map();
    for (const sp of filteredSoldPrices) {
      const addressKey = [
        sp.postcode,
        typeof sp.street === 'string' ? sp.street.trim().toLowerCase() : '',
        typeof sp.paon === 'string' ? sp.paon.trim().toLowerCase() : '',
        typeof sp.saon === 'string' ? sp.saon.trim().toLowerCase() : ''
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
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      totalProperties: filteredSoldPrices.length,
      avgPrice,
      minPrice,
      maxPrice,
      priceRange,
      mostCommonType: mostCommonType ? `${mostCommonType[0]} (${mostCommonType[1]})` : 'N/A',
      dateRange: {
        earliest: filteredSoldPrices[filteredSoldPrices.length - 1]?.dateOfTransfer,
        latest: filteredSoldPrices[0]?.dateOfTransfer
      }
    };
  }, [filteredSoldPrices]);

  // Calculate average price per year for the area
  const trendData = useMemo(() => {
    const yearMap: Record<string, number[]> = {};
    filteredSoldPrices.forEach(sp => {
      const year = sp.dateOfTransfer.slice(0, 4);
      if (!yearMap[year]) yearMap[year] = [];
      yearMap[year].push(sp.price);
    });
    const years = Object.keys(yearMap).sort();
    const avgPrices = years.map(year =>
      Math.round(yearMap[year].reduce((a, b) => a + b, 0) / yearMap[year].length)
    );
    return { years, avgPrices };
  }, [filteredSoldPrices]);

  const handleSearch = async (searchPostcode: string) => {
    if (!searchPostcode.trim()) {
      setError('Please enter a postcode.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSoldPrices([]);
    setShowPostcodeHint(false);
    setHasSearched(true);
    try {
      const response = await fetch('/api/property-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postcode: searchPostcode }),
      });

      let data: unknown = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          throw new Error('Received invalid JSON from server.');
        }
      } else {
        throw new Error('Server returned a non-JSON response.');
      }

      if (!response.ok) {
        throw new Error((data as { message?: string })?.message || 'Failed to fetch sold prices');
      }

      const results = (data as { data?: SoldPrice[] })?.data || [];
      setSoldPrices(results as SoldPrice[]);
      if (results.length === 0 && searchPostcode.trim().length > 4) {
        setShowPostcodeHint(true);
      }
      // The trend data calculation is now done on the client-side,
      // so we don't need to set it from the API response.
      // setTrendData(data.data.trendData || []); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = useCallback((duration: string) => {
    return duration === 'F' ? 'Freehold' : duration === 'L' ? 'Leasehold' : duration;
  }, []);

  const formatPropertyType = useCallback((type: string) => {
    const types: { [key: string]: string } = {
      'D': 'Detached',
      'S': 'Semi-detached', 
      'T': 'Terraced',
      'F': 'Flat/Maisonette',
      'O': 'Other'
    };
    return types[type] || type;
  }, []);

  const formatAddress = useCallback((property: SoldPrice) => {
    const parts = [property.paon, property.saon, property.street].filter(Boolean);
    return parts.join(' ');
  }, []);

  const formatPrice = useCallback((price: number) => {
    return price ? `£${price.toLocaleString()}` : 'N/A';
  }, []);

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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <Filters
            isLoading={isLoading}
            filterDuration={filterDuration}
            setFilterDuration={setFilterDuration}
            filterType={filterType}
            setFilterType={setFilterType}
            filterYear={filterYear}
            setFilterYear={setFilterYear}
            availableYears={availableYears}
          />
          <div className="mb-4 pt-6 border-t">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="postcode" className="block text-sm font-semibold text-gray-700">
                Search by postcode, address, street, or town
              </label>
              <span className="hidden sm:block ml-2 text-xs text-gray-500 font-normal shrink-0">
                (⌘K to focus, Enter to search, Esc to clear)
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  id="postcode"
                  type="text"
                  value={postcode}
                  onChange={e => setPostcode(e.target.value)}
                  placeholder="e.g., SW1A 1AA, Downing Street, Manchester"
                  className="w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 border-gray-300 text-gray-900 bg-white shadow-sm transition-all duration-200 placeholder-gray-400"
                  disabled={isLoading}
                />
                {postcode && (
                  <button
                    onClick={() => setPostcode('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    type="button"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                onClick={() => handleSearch(postcode)}
                disabled={!postcode || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 sm:w-auto w-full disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    🔍 Get Sold Prices
                  </>
                )}
              </button>
            </div>
          </div>
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

        {/* Results block - always render the parent div, conditionally render content inside */}
        <div className="mt-8 min-h-[40vh]">
          {isLoading ? (
            <div className="text-center py-8 text-blue-700 font-semibold animate-pulse">
              Loading property data, this may take a few seconds...
            </div>
          ) : filteredSoldPrices.length > 0 ? (
            <div>
              {resultsSummary && (
                <div className="mb-8">
                  <ResultsSummary summary={resultsSummary} postcode={postcode} />
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left side: charts */}
                <div className="lg:col-span-1 space-y-8">
                  <ChartsPanel soldPrices={filteredSoldPrices} />
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

                  {/* Sold Prices Table */}
                  <section aria-labelledby="sold-prices-heading">
                    <h2 id="sold-prices-heading" className="sr-only">
                      Sold Property Prices in {postcode}
                    </h2>
                    <SoldPricesTable
                      soldPrices={dedupedSoldPrices}
                      formatAddress={formatAddress}
                      formatPrice={formatPrice}
                      formatDuration={formatDuration}
                      formatPropertyType={formatPropertyType}
                      requestSort={requestSort}
                      sortConfig={sortConfig}
                      getHasHistory={getHasHistory}
                      isDateSortDisabled={isDateSortDisabled}
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
            <EmptyState
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
