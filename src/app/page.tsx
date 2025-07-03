'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, TrendingUp, BarChart3 } from 'lucide-react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// Enhanced Components
import EnhancedSearch from './components/EnhancedSearch';
import EnhancedFilters from './components/EnhancedFilters';
import EnhancedResultsSummary from './components/EnhancedResultsSummary';
import EnhancedSoldPricesTable from './components/EnhancedSoldPricesTable';
import { useToast } from './components/ToastProvider';
import { SoldPrice } from '../../types/sold-price';

// Components
import EnhancedEmptyState from './components/EnhancedEmptyState';
import PaginationLoadingOverlay from './components/PaginationLoadingOverlay';
import BMVLegend from './components/BMVLegend';
import AreaPriceTrendChart, { SalesPerYearBarChart, PropertyTypePieChart } from './components/AreaPriceTrendChart';

import type { PropertyData } from './components/PropertyModal';

// Dynamically import heavy components
const PropertyHistoryModal = dynamic(() => import('./components/PropertyHistoryModal'));
const AreaPriceTrendChart = dynamic(() => import('./components/AreaPriceTrendChart'));

export default function Home() {
  // Search and data state
  const [searchTerm, setSearchTerm] = useState('');
  const [soldPrices, setSoldPrices] = useState<SoldPrice[]>([]);
  const [displayedSoldPrices, setDisplayedSoldPrices] = useState<SoldPrice[]>([]);
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
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const { showToast } = useToast();

  const router = useRouter();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

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
          setDisplayedSoldPrices(enhancedData);
          setTimeout(() => {
            showToast({
              type: 'success',
              title: 'Search Complete',
              message: `Found ${data.totalCount} sales records in ${searchPostcode.trim()} (${summary.totalProperties} after filters)`,
            });
          }, 0);
        } else {
          setTimeout(() => setDisplayedSoldPrices(enhancedData), 100);
        }
      } else {
        setSoldPrices([]);
        if (!isPaginationRequest) {
          setDisplayedSoldPrices([]);
        } else {
          showToast({
            type: 'info',
            title: 'No More Results',
            message: `No more properties found for this page.`,
          });
        }
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
        setDisplayedSoldPrices([]);
      }
      if (!isPaginationRequest) {
        showToast({
          type: 'error',
          title: 'Search Failed',
          message: 'Unable to search properties. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsPaginationLoading(false), 100);
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
    let filtered = [...displayedSoldPrices];

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
  }, [displayedSoldPrices, sortConfig, filterDuration, filterType, filterYear, priceRange, dateRange]);

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

  // Show Back to Top button on scroll (mobile only)
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400 && window.innerWidth < 768);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Handler for row click to open unified modal (PropertyHistoryModal)
  const handleRowClick = (property: SoldPrice) => {
    // Find history for this property (same logic as handleShowHistory)
    const normalize = (str: string | undefined | null) => (str ?? '').trim().toUpperCase();
    const normalizeSaon = (saon: string | undefined | null) => {
      const val = (saon ?? '').trim().toUpperCase();
      return val === '' ? '-' : val;
    };
    const history = soldPrices.filter(sp =>
      normalize(sp.postcode) === normalize(property.postcode) &&
      normalize(sp.street) === normalize(property.street) &&
      normalize(sp.paon) === normalize(property.paon) &&
      normalizeSaon(sp.saon) === normalizeSaon(property.saon)
    );
    setSelectedProperty(property);
    setPropertyHistory(history);
    setShowHistoryModal(true);
  };

  const handleShowHistory = (property: SoldPrice, history: SoldPrice[]) => {
    setSelectedProperty(property);
    setPropertyHistory(history);
    setShowHistoryModal(true);
  };

  // SEO helpers
  const pageTitle = searchTerm
    ? `BMV Finder | Sold Prices in ${searchTerm}`
    : 'BMV Finder | UK Property Price Search & Investment Insights';
  const pageDescription = searchTerm
    ? `See sold property prices, BMV deals, and investment insights for ${searchTerm}. Instantly compare sales, growth, and BMV scores for any postcode, city, or street.`
    : 'Search UK property prices, discover below market value (BMV) deals, and get investment insights. Instantly compare sold prices, growth, and BMV scores for any postcode, city, or street.';
  const canonicalUrl = `https://bmvfinder.co.uk${searchTerm ? `/?search=${encodeURIComponent(searchTerm)}` : ''}`;

  // Pagination controls
  const [customPageSize, setCustomPageSize] = useState(pageSize);
  const [gotoPage, setGotoPage] = useState(page);

  // Skeleton loader components
  function SkeletonTableRows({ rows = 10 }) {
    return (
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="animate-pulse bg-slate-100">
            <td colSpan={8} className="h-12" />
          </tr>
        ))}
      </tbody>
    );
  }
  function SkeletonCards({ count = 6 }) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl bg-slate-100 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content="/icon-512.png" />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="UK property, BMV, below market value, house prices, sold prices, investment, real estate, property search, UK Land Registry" />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="/icon-512.png" />
        {/* Placeholder for JSON-LD structured data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          'name': 'BMV Finder',
          'url': canonicalUrl,
          'potentialAction': {
            '@type': 'SearchAction',
            'target': 'https://bmvfinder.co.uk/?search={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        }) }} />
      </Head>
      <header role="banner" className="sr-only">
        <h1>BMV Finder: UK Property Price Search & Investment Insights</h1>
      </header>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
        {/* Sticky search bar on mobile */}
        <div className="md:hidden sticky top-0 z-30 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 pt-4 pb-2 shadow-sm">
          <EnhancedSearch
            value={searchTerm}
            onChange={setSearchTerm}
            onSearch={query => handleSearch(query)}
            isLoading={isLoading}
          />
        </div>
        <main className="container mx-auto px-4 py-8 max-w-7xl" role="main">
          <section className="mb-12">
            <div className="bg-white/80 shadow-lg rounded-2xl p-8 md:p-12 w-full text-center border border-slate-200">
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
              <div className="flex items-center justify-center mt-8 mb-2 w-full">
                <div className="relative w-full">
                  <EnhancedSearch
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSearch={query => handleSearch(query)}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </motion.div>

            {/* Filters button for mobile */}
            <div className="flex md:hidden justify-end mb-4">
              <button
                onClick={() => setIsFiltersOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                aria-label="Open filters"
              >
                <span>Filters</span>
              </button>
            </div>
            {/* Filters modal for mobile */}
            <Dialog open={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center md:hidden">
              <Dialog.Overlay className="fixed inset-0 bg-black/30" />
              <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-6 z-10">
                <button
                  onClick={() => setIsFiltersOpen(false)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-slate-700"
                  aria-label="Close filters"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold mb-4">Filters</h2>
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
                <button
                  onClick={() => setIsFiltersOpen(false)}
                  className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  Apply Filters
                </button>
              </div>
            </Dialog>
            {/* Results Section - Two-column layout for desktop */}
            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                {hasSearched && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="w-full"
                    aria-live="polite"
                  >
                    {/* Loading State */}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-12"
                        role="status"
                        aria-busy="true"
                      >
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" aria-hidden="true" />
                          <p className="text-slate-600">Searching properties...</p>
                        </div>
                      </motion.div>
                    )}
                    {/* Main Results Layout */}
                    {!isLoading && (
                      <>
                        {/* Unified Market Overview Banner - full width above grid */}
                        <div className="w-full mb-8">
                          <EnhancedResultsSummary
                            summary={summary}
                            postcode={searchTerm}
                            onExport={handleExport}
                            onShare={handleShare}
                            fullBanner
                            soldPrices={filteredSoldPrices}
                          />
                        </div>
                        {/* BMV Score Legend - full width below market overview */}
                        {soldPrices.length > 0 && (
                          <div className="w-full mb-8">
                            <BMVLegend variant="full" className="w-full" />
                          </div>
                        )}
                        <div className="grid grid-cols-1 xl:grid-cols-4 xl:gap-12 gap-8 items-start">
                          {/* Sidebar: Filters (desktop only) */}
                          <aside className="hidden xl:block col-span-1 min-h-0" aria-label="Filters">
                            <div className="sticky top-8 min-h-0 max-h-[calc(100vh-4rem)] overflow-y-auto flex flex-col gap-8 bg-white/80 border border-slate-200 rounded-3xl shadow-xl p-6">
                              {/* Filters */}
                              {soldPrices.length > 0 && (
                                <div>
                                  <h3 className="text-lg font-bold text-slate-900 mb-3 tracking-tight">Filters</h3>
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
                                </div>
                              )}
                            </div>
                          </aside>
                          {/* Main Content Area (Table, Charts) - 75% width, always after sidebar */}
                          <section className="col-span-1 xl:col-span-3 w-full min-w-0" aria-label="Results">
                            {/* Results as cards on mobile, table on desktop */}
                            {soldPrices.length > 0 ? (
                              <>
                                <div className="md:block hidden bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                      Property Sales ({filteredSoldPrices.length} of {totalCount})
                                    </h2>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                      <span>Page {page}</span>
                                      <span>•</span>
                                      <span>
                                        <label htmlFor="pageSize" className="sr-only">Results per page</label>
                                        <select
                                          id="pageSize"
                                          value={customPageSize}
                                          onChange={e => {
                                            setCustomPageSize(Number(e.target.value));
                                            handleSearch(searchTerm, 1);
                                          }}
                                          className="border border-slate-300 rounded px-2 py-1 text-sm"
                                          aria-label="Results per page"
                                        >
                                          {[20, 50, 100].map(size => (
                                            <option key={size} value={size}>{size} per page</option>
                                          ))}
                                        </select>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="overflow-x-auto relative">
                                    <div className="divide-y divide-slate-100 min-w-[700px]">
                                      {isLoading ? (
                                        <SkeletonTableRows rows={10} />
                                      ) : (
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
                                          rowClassName="hover:bg-blue-50/60 transition-colors cursor-pointer"
                                          onRowClick={handleRowClick}
                                          isLoading={isPaginationLoading}
                                        />
                                      )}
                                    </div>
                                    {/* Pagination Loading Overlay */}
                                    <PaginationLoadingOverlay 
                                      isLoading={isPaginationLoading} 
                                      direction={paginationDirection} 
                                    />
                                  </div>
                                  {/* Pagination */}
                                  {totalCount > customPageSize && (
                                    <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="text-sm text-slate-600">
                                          Showing {((page - 1) * customPageSize) + 1} to {Math.min(page * customPageSize, totalCount)} of {totalCount} results
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleSearch(searchTerm, page - 1)}
                                            disabled={page === 1 || isPaginationLoading}
                                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            aria-label="Previous page"
                                          >
                                            Previous
                                          </button>
                                          <span className="px-4 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg">
                                            {page}
                                          </span>
                                          <label htmlFor="gotoPage" className="sr-only">Go to page</label>
                                          <input
                                            id="gotoPage"
                                            type="number"
                                            min={1}
                                            max={Math.ceil(totalCount / customPageSize)}
                                            value={gotoPage}
                                            onChange={e => setGotoPage(Number(e.target.value))}
                                            onBlur={() => {
                                              if (gotoPage !== page && gotoPage >= 1 && gotoPage <= Math.ceil(totalCount / customPageSize)) {
                                                handleSearch(searchTerm, gotoPage);
                                              }
                                            }}
                                            className="w-16 border border-slate-300 rounded px-2 py-1 text-sm"
                                            aria-label="Go to page"
                                          />
                                          <button
                                            onClick={() => handleSearch(searchTerm, page + 1)}
                                            disabled={page * customPageSize >= totalCount || isPaginationLoading}
                                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            aria-label="Next page"
                                          >
                                            Next
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="md:hidden flex flex-col gap-4">
                                  {isLoading ? (
                                    <SkeletonCards count={6} />
                                  ) : (
                                    filteredSoldPrices.map((property, idx) => (
                                      <div key={property.id + '-' + idx} className="bg-white rounded-2xl shadow border border-slate-200 p-4 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                          <div className="font-semibold text-blue-800 text-lg">{formatAddress(property)}</div>
                                          <div className="text-right text-green-700 font-bold text-lg">£{property.price.toLocaleString()}</div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-slate-600 text-sm">
                                          <span>{new Date(property.dateOfTransfer).toLocaleDateString('en-GB')}</span>
                                          <span>•</span>
                                          <span>{formatPropertyType(property.propertyType)}</span>
                                          <span>•</span>
                                          <span>{formatDuration(property.duration)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                                            BMV: {property.bmvScore ?? 'N/A'}
                                          </span>
                                          <button
                                            onClick={() => handleRowClick(property)}
                                            className="ml-auto px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                            aria-label="View property details"
                                          >
                                            Details
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-24">
                                <BarChart3 className="w-16 h-16 text-slate-300 mb-6" aria-hidden="true" />
                                <h3 className="text-2xl font-semibold mb-2 text-gray-800">No Sold Prices Found</h3>
                                <p className="text-gray-600 mb-4">Try adjusting your filters or search for a different postcode or area.</p>
                                <button
                                  onClick={handleTryDifferentSearch}
                                  className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                                  aria-label="Try a different search"
                                >
                                  Try a Different Search
                                </button>
                              </div>
                            )}
                            {/* Sticky pagination on mobile */}
                            {soldPrices.length > 0 && (
                              <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200 shadow-lg flex items-center justify-between px-4 py-2">
                                <button
                                  onClick={() => handleSearch(searchTerm, page - 1)}
                                  disabled={page === 1 || isPaginationLoading}
                                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  aria-label="Previous page"
                                >
                                  Previous
                                </button>
                                <span className="px-4 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg">
                                  {page}
                                </span>
                                <button
                                  onClick={() => handleSearch(searchTerm, page + 1)}
                                  disabled={page * customPageSize >= totalCount || isPaginationLoading}
                                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  aria-label="Next page"
                                >
                                  Next
                                </button>
                              </div>
                            )}
                            {/* Back to Top button on mobile */}
                            {showBackToTop && (
                              <button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="md:hidden fixed bottom-16 right-4 z-50 bg-blue-600 text-white rounded-full shadow-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                aria-label="Back to top"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                            )}
                          </section>
                        </div>
                      </>
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
          </AnimatePresence>

          {/* Analytics */}
          <Analytics />
          <SpeedInsights />
        </main>
        <footer className="w-full py-8 text-center text-slate-500 text-sm" role="contentinfo">
          &copy; {new Date().getFullYear()} BMV Finder. All rights reserved.
        </footer>
      </div>
    </>
  );
}

