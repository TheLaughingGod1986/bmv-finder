'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, TrendingUp, BarChart3 } from 'lucide-react';
import Head from 'next/head';

// Enhanced Components
import EnhancedSearch from './components/EnhancedSearch';
import EnhancedFilters from './components/EnhancedFilters';
import EnhancedResultsSummary from './components/EnhancedResultsSummary';
import EnhancedSoldPricesTable from './components/EnhancedSoldPricesTable';
import PropertyHistoryModal from './components/PropertyHistoryModal';
import PropertyModal from './components/PropertyModal';
import { useToast } from './components/ToastProvider';
import { SoldPrice } from '../../types/sold-price';

// Components
import EnhancedEmptyState from './components/EnhancedEmptyState';
import PaginationLoadingOverlay from './components/PaginationLoadingOverlay';
import BMVLegend from './components/BMVLegend';
import AreaPriceTrendChart, { SalesPerYearBarChart, PropertyTypePieChart } from './components/AreaPriceTrendChart';

import type { PropertyData } from './components/PropertyModal';

export default function Home() {
  // Search and data state
  const [searchTerm, setSearchTerm] = useState('');
  const [soldPrices, setSoldPrices] = useState<SoldPrice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [paginationDirection, setPaginationDirection] = useState<'next' | 'previous'>('next');
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);
  
  // Data freshness state
  const [lastUpdatedData, setLastUpdatedData] = useState<{
    lastUpdated: string;
    totalRecords?: number;
    indexSize?: string;
    source: string;
    note?: string;
  } | null>(null);

  // Sorting and filtering state
  const [sortConfig, setSortConfig] = useState<{ key: keyof SoldPrice; direction: 'ascending' | 'descending' }>({
    key: 'dateOfTransfer',
    direction: 'descending'
  });
  const [filterDuration, setFilterDuration] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterYear, setFilterYear] = useState<string[]>([]);
  
  // Modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<SoldPrice | null>(null);
  const [propertyHistory, setPropertyHistory] = useState<SoldPrice[]>([]);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<PropertyData | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const { showToast } = useToast();

  // Enhanced properties with BMV scores
  const enhancePropertiesWithBMVScores = useCallback(async (properties: SoldPrice[]) => {
    if (properties.length === 0) return properties;
    
    try {
      const response = await fetch('/api/enhance-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Check if date sorting should be disabled
  const isDateSortDisabled = useMemo(() => {
    if (soldPrices.length < 2) return true;
    const firstYear = soldPrices[0].dateOfTransfer.slice(0, 4);
    return soldPrices.every(p => p.dateOfTransfer.slice(0, 4) === firstYear);
  }, [soldPrices]);

  // Create property sale counts map
  const propertySaleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (!soldPrices || soldPrices.length === 0) return counts;
    
    for (const sp of soldPrices) {
      const addressKey = [
        typeof sp.postcode === 'string' ? sp.postcode.trim().toUpperCase() : '',
        typeof sp.street === 'string' ? sp.street.trim().toUpperCase() : '',
        typeof sp.paon === 'string' ? sp.paon.trim().toUpperCase() : '',
        typeof sp.saon === 'string' ? sp.saon.trim().toUpperCase() : ''
      ].filter(Boolean).join('|');
      
      if (addressKey) {
        counts.set(addressKey, (counts.get(addressKey) || 0) + 1);
      }
    }
    return counts;
  }, [soldPrices]);

  // Check if property has history
  const getHasHistory = useCallback((property: SoldPrice) => {
    const addressKey = [
      typeof property.postcode === 'string' ? property.postcode.trim().toUpperCase() : '',
      typeof property.street === 'string' ? property.street.trim().toUpperCase() : '',
      typeof property.paon === 'string' ? property.paon.trim().toUpperCase() : '',
      typeof property.saon === 'string' ? property.saon.trim().toUpperCase() : ''
    ].filter(Boolean).join('|');
    
    return !!addressKey && (propertySaleCounts.get(addressKey) || 0) > 1;
  }, [propertySaleCounts]);

  // Main search function
  const handleSearch = useCallback(async (searchPostcode: string, pageNum = 1) => {
    if (!searchPostcode.trim()) {
      showToast({
        type: 'warning',
        title: 'Search Required',
        message: 'Please enter a postcode, street name, or town to search.',
      });
      return;
    }

    const isPaginationRequest = pageNum !== 1 && soldPrices.length > 0;
    
    if (isPaginationRequest) {
      setIsPaginationLoading(true);
      setPaginationDirection(pageNum > page ? 'next' : 'previous');
    } else {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);
    }

    setPage(pageNum);

    try {
      const response = await fetch('/api/property-es', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          searchTerm: searchPostcode.trim(), 
          page: pageNum, 
          pageSize 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTotalCount(data.totalCount || 0);
      
      if (data.data && data.data.length > 0) {
        const enhancedData = await enhancePropertiesWithBMVScores(data.data);
        setSoldPrices(enhancedData);
        
        if (!isPaginationRequest) {
          setTimeout(() => {
            showToast({
              type: 'success',
              title: 'Search Complete',
              message: `Found ${data.totalCount} sales records in ${searchPostcode.trim()} (${summary.totalProperties} after filters)`,
            });
          }, 0);
        }
      } else {
        setSoldPrices([]);
        if (!isPaginationRequest) {
          showToast({
            type: 'info',
            title: 'No Results',
            message: `No properties found for "${searchPostcode.trim()}". Try a different search term.`,
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
          message: 'Unable to search properties. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
      setIsPaginationLoading(false);
    }
  }, [soldPrices.length, page, pageSize, enhancePropertiesWithBMVScores, showToast]);

  // Fetch last updated data
  const fetchLastUpdated = async () => {
    try {
      const response = await fetch('/api/last-updated');
      if (response.ok) {
        const data = await response.json();
        setLastUpdatedData(data);
      }
    } catch (error) {
      console.error('Failed to fetch last updated data:', error);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSearch(searchTerm);
    }
  }, [searchTerm, handleSearch]);

  // Sorting function
  const requestSort = (key: keyof SoldPrice) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  // Filtered and sorted data
  const filteredSoldPrices = useMemo(() => {
    let filtered = [...soldPrices];

    // Apply filters
    if (filterDuration.length > 0) {
      filtered = filtered.filter(sp => filterDuration.includes(sp.duration));
    }
    if (filterType.length > 0) {
      filtered = filtered.filter(sp => filterType.includes(sp.propertyType));
    }
    if (filterYear.length > 0) {
      filtered = filtered.filter(sp => filterYear.includes(sp.dateOfTransfer.slice(0, 4)));
    }
    if (priceRange.min > 0 || priceRange.max < 10000000) {
      filtered = filtered.filter(sp => 
        sp.price >= priceRange.min && sp.price <= priceRange.max
      );
    }
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(sp => {
        const transferDate = sp.dateOfTransfer;
        if (dateRange.start && transferDate < dateRange.start) return false;
        if (dateRange.end && transferDate > dateRange.end) return false;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'ascending' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [soldPrices, sortConfig, filterDuration, filterType, filterYear, priceRange, dateRange]);

  // Available years for filtering
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    soldPrices.forEach(sp => years.add(sp.dateOfTransfer.slice(0, 4)));
    return Array.from(years).sort().reverse();
  }, [soldPrices]);

  // Chart data
  const chartLabels = useMemo(() => {
    const labels = new Set<string>();
    soldPrices.forEach(sp => labels.add(sp.dateOfTransfer.slice(0, 4)));
    return Array.from(labels).sort();
  }, [soldPrices]);

  // Chart data for price trends
  const priceTrendData = useMemo(() => {
    if (!chartLabels.length) return [];
    
    return chartLabels.map(year => {
      const yearPrices = soldPrices
        .filter(sp => sp.dateOfTransfer.slice(0, 4) === year)
        .map(sp => sp.price);
      return yearPrices.length > 0 
        ? yearPrices.reduce((sum, price) => sum + price, 0) / yearPrices.length
        : 0;
    });
  }, [soldPrices, chartLabels]);

  // Sales count data per year
  const salesCountData = useMemo(() => {
    if (!chartLabels.length) return [];
    
    return chartLabels.map(year => {
      return soldPrices.filter(sp => sp.dateOfTransfer.slice(0, 4) === year).length;
    });
  }, [soldPrices, chartLabels]);

  // Property type data for pie chart
  const propertyTypeData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    soldPrices.forEach(sp => {
      const type = sp.propertyType || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    return {
      labels: Object.keys(typeCounts),
      data: Object.values(typeCounts)
    };
  }, [soldPrices]);

  // Compute summary for EnhancedResultsSummary
  const summary = useMemo(() => {
    if (!filteredSoldPrices || filteredSoldPrices.length === 0) {
      return {
        totalProperties: 0,
        avgPrice: 0,
        medianPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        priceRange: 0,
        mostCommonType: '',
        dateRange: { earliest: '', latest: '' },
        bmvDistribution: {
          excellent: 0,
          good: 0,
          fair: 0,
          overpriced: 0,
          poor: 0,
        },
      };
    }
    
    const prices = filteredSoldPrices.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    // Calculate median price
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices.length % 2 === 0
      ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
      : sortedPrices[Math.floor(sortedPrices.length / 2)];
    
    const priceRange = maxPrice - minPrice;
    const types = filteredSoldPrices.map(p => p.propertyType).filter(Boolean);
    const typeCounts = types.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {} as Record<string, number>);
    const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const dates = filteredSoldPrices.map(p => p.dateOfTransfer).sort();
    
    // Calculate BMV score distribution
    const bmvDistribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      overpriced: 0,
      poor: 0,
    };
    
    filteredSoldPrices.forEach(property => {
      if (property.bmvScore !== undefined) {
        if (property.bmvScore >= 80) bmvDistribution.excellent++;
        else if (property.bmvScore >= 65) bmvDistribution.good++;
        else if (property.bmvScore >= 50) bmvDistribution.fair++;
        else if (property.bmvScore >= 35) bmvDistribution.overpriced++;
        else bmvDistribution.poor++;
      }
    });
    
    return {
      totalProperties: filteredSoldPrices.length,
      avgPrice,
      medianPrice,
      minPrice,
      maxPrice,
      priceRange,
      mostCommonType,
      dateRange: { earliest: dates[0], latest: dates[dates.length - 1] },
      bmvDistribution,
    };
  }, [filteredSoldPrices]);

  // Effects
  useEffect(() => {
    fetchLastUpdated();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Event handlers
  const handleTryDifferentSearch = () => {
    setSearchTerm('');
    setSoldPrices([]);
    setHasSearched(false);
    setError(null);
  };

  const handleSearchSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion);
    handleSearch(suggestion);
  };

  const handleExport = () => {
    if (filteredSoldPrices.length === 0) {
      showToast({
        type: 'warning',
        title: 'No Data to Export',
        message: 'Please search for properties first.',
      });
      return;
    }

    const csvContent = [
      ['Address', 'Postcode', 'Property Type', 'Price', 'Date of Transfer', 'Duration'],
      ...filteredSoldPrices.map(sp => [
        `${sp.paon || ''} ${sp.saon || ''} ${sp.street || ''}`.trim(),
        sp.postcode || '',
        sp.propertyType || '',
        sp.price?.toString() || '',
        sp.dateOfTransfer || '',
        sp.duration || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-sales-${searchTerm}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Export Complete',
      message: `Exported ${filteredSoldPrices.length} properties to CSV.`,
    });
  };

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('search', searchTerm);
    
    if (navigator.share) {
      navigator.share({
        title: 'BMV Finder - Property Search Results',
        text: `Check out these property sales in ${searchTerm}`,
        url: url.toString(),
      });
    } else {
      navigator.clipboard.writeText(url.toString());
      showToast({
        type: 'success',
        title: 'Link Copied',
        message: 'Search results link copied to clipboard.',
      });
    }
  };

  // Utility functions
  const formatAddress = (sp: SoldPrice) => {
    // If there's a flat/saon, include it first
    const parts = [];
    if (sp.saon) parts.push(sp.saon); // Flat number
    if (sp.paon) parts.push(sp.paon); // House number/name
    if (sp.street) parts.push(sp.street);
    return parts.length > 0 ? parts.join(' ') : 'Address not available';
  };

  const formatPropertyType = (type: string) => {
    if (!type) return 'Unknown';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  const formatDuration = (duration: string) => {
    return duration === 'F' ? 'Freehold' : duration === 'L' ? 'Leasehold' : duration;
  };

  const handleShowHistory = (property: SoldPrice, history: SoldPrice[]) => {
    setSelectedProperty(property);
    setPropertyHistory(history);
    setShowHistoryModal(true);
  };

  return (
    <>
      <Head>
        <title>BMV Finder | UK Property Price Search & Investment Insights</title>
        <meta name="description" content="Search UK property prices, discover below market value (BMV) deals, and get investment insights. Instantly compare sold prices, growth, and BMV scores for any postcode, city, or street." />
        <meta property="og:title" content="BMV Finder | UK Property Price Search & Investment Insights" />
        <meta property="og:description" content="Search UK property prices, discover below market value (BMV) deals, and get investment insights. Instantly compare sold prices, growth, and BMV scores for any postcode, city, or street." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bmvfinder.co.uk/" />
        <meta property="og:image" content="/icon-512.png" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <section className="mb-12">
            <div className="bg-white/80 shadow-lg rounded-2xl p-8 md:p-12 max-w-3xl mx-auto text-center border border-slate-200">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-blue-800 leading-tight">BMV Finder: UK Property Price Search & Investment Insights</h1>
              <p className="text-lg md:text-xl text-slate-700 mb-6 font-medium">Find below market value (BMV) property deals, compare sold prices, and get instant investment insights for any postcode, city, or street in the UK.</p>
              <ul className="list-disc list-inside text-left max-w-2xl mx-auto text-base md:text-lg text-slate-700 space-y-2">
                <li>Search by postcode, city, or street for recent property sales</li>
                <li>See BMV scores to spot below market value opportunities</li>
                <li>View price growth charts and market trends</li>
                <li>Compare similar sales and property types</li>
                <li>Get investment calculator and personalized insights</li>
                <li>Fast, accurate, and always up-to-date with UK Land Registry data</li>
              </ul>
            </div>
          </section>
          <section className="mt-8 md:mt-16">
            {/* Search Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <EnhancedSearch
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={query => handleSearch(query)}
                isLoading={isLoading}
              />
            </motion.div>

            {/* Results Section - Fixed height container to prevent layout shifts */}
            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                {hasSearched && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {/* Loading State */}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-12"
                      >
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                          <p className="text-slate-600">Searching properties...</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Results Summary */}
                    {!isLoading && soldPrices.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-6"
                      >
                        <EnhancedResultsSummary
                          summary={summary}
                          postcode={searchTerm}
                          onExport={handleExport}
                          onShare={handleShare}
                          className="w-full"
                        />
                      </motion.div>
                    )}

                    {/* Filters */}
                    {!isLoading && soldPrices.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6"
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
                          className="w-full"
                        />
                      </motion.div>
                    )}

                    {/* BMV Legend */}
                    {!isLoading && soldPrices.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-6"
                      >
                        <BMVLegend variant="compact" className="w-full" />
                      </motion.div>
                    )}

                    {/* Results Table */}
                    {!isLoading && soldPrices.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
                      >
                        <div className="p-6 border-b border-slate-100">
                          <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">
                              Property Sales ({filteredSoldPrices.length} of {totalCount})
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span>Page {page}</span>
                              <span>•</span>
                              <span>{pageSize} per page</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="overflow-hidden relative">
                          <EnhancedSoldPricesTable
                            soldPrices={filteredSoldPrices}
                            allSoldPrices={soldPrices}
                            formatAddress={formatAddress}
                            formatDuration={formatDuration}
                            formatPropertyType={formatPropertyType}
                            requestSort={requestSort}
                            sortConfig={sortConfig}
                            getHasHistory={getHasHistory}
                            isDateSortDisabled={isDateSortDisabled}
                            onShowHistory={handleShowHistory}
                            selectedRowId={selectedRowId}
                          />
                          
                          {/* Pagination Loading Overlay */}
                          <PaginationLoadingOverlay 
                            isLoading={isPaginationLoading} 
                            direction={paginationDirection} 
                          />
                        </div>

                        {/* Pagination */}
                        {totalCount > pageSize && (
                          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-slate-600">
                                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} results
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSearch(searchTerm, page - 1)}
                                  disabled={page === 1 || isPaginationLoading}
                                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Previous
                                </button>
                                
                                <span className="px-4 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg">
                                  {page}
                                </span>
                                
                                <button
                                  onClick={() => handleSearch(searchTerm, page + 1)}
                                  disabled={page * pageSize >= totalCount || isPaginationLoading}
                                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Empty State */}
                    {!isLoading && hasSearched && soldPrices.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8"
                      >
                        <EnhancedEmptyState
                          postcode={searchTerm}
                          hasSearched={hasSearched}
                          onTryDifferentSearch={handleTryDifferentSearch}
                          onSearchSuggestion={handleSearchSuggestion}
                        />
                      </motion.div>
                    )}

                    {/* Charts Section */}
                    {!isLoading && soldPrices.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-8"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-blue-600" />
                              Price Trends
                            </h3>
                            <AreaPriceTrendChart
                              labels={chartLabels}
                              data={priceTrendData}
                              areaName={searchTerm}
                              className="w-full"
                            />
                          </div>
                          
                          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                              <BarChart3 className="w-5 h-5 text-green-600" />
                              Market Analysis
                            </h3>
                            <div className="grid grid-cols-1 gap-6">
                              <SalesPerYearBarChart soldPrices={soldPrices} />
                              <PropertyTypePieChart soldPrices={soldPrices} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Modals */}
          <AnimatePresence>
            {showHistoryModal && selectedProperty && (
              <PropertyHistoryModal
                open={showHistoryModal}
                property={selectedProperty}
                history={propertyHistory}
                onClose={() => setShowHistoryModal(false)}
              />
            )}
            
            {showPropertyModal && selectedPropertyForModal && (
              <PropertyModal
                isOpen={showPropertyModal}
                property={selectedPropertyForModal}
                onClose={() => setShowPropertyModal(false)}
              />
            )}
          </AnimatePresence>

          {/* Analytics */}
          <Analytics />
          <SpeedInsights />
        </main>
      </div>
    </>
  );
}

