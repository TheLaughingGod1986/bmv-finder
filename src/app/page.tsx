'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, TrendingUp, BarChart3, Filter, X, MapPin, Download, Share2, ArrowUp } from 'lucide-react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// Enhanced Components
import EnhancedSearch from './components/EnhancedSearch';
import EnhancedFilters from './components/EnhancedFilters';
import EnhancedResultsSummary from './components/EnhancedResultsSummary';
import EnhancedSoldPricesTable from './components/EnhancedSoldPricesTable';
import { useToast } from './components/ToastProvider';
import { SoldPrice } from '../../types/sold-price';

// Components
import PaginationLoadingOverlay from './components/PaginationLoadingOverlay';
import BMVLegend from './components/BMVLegend';
import PropertyHistoryModal from './components/PropertyHistoryModal';

// Replace the dynamic import for AreaPriceTrendChart and SalesPerYearBarChart with a static import:
import AreaPriceTrendChart, { SalesPerYearBarChart, PropertyTypePieChart, AreaGrowthTable, PriceDistributionHistogram, RecentSalesTable, TenurePieChart, SalesAndPropertyTypeCharts, PriceAndTenureCharts } from './components/AreaPriceTrendChart';

// Unified Analytics Accordion component that allows cross-column dragging
function UnifiedAnalyticsAccordion({ 
  leftItems, 
  rightItems 
}: { 
  leftItems: { title: string, content: React.ReactNode }[], 
  rightItems: { title: string, content: React.ReactNode }[] 
}) {
  const storageKey = 'unified-analytics-accordion-order';
  const allItems = [...leftItems, ...rightItems];
  const defaultOrder = allItems.map((_, i) => i);
  
  const [openIdxs, setOpenIdxs] = useState(defaultOrder); // all open by default
  const [order, setOrder] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === allItems.length) return parsed;
        } catch {}
      }
    }
    return defaultOrder;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(order));
    }
  }, [order, storageKey]);

  const toggle = (idx: number) => {
    setOpenIdxs(openIdxs =>
      openIdxs.includes(idx)
        ? openIdxs.filter(i => i !== idx)
        : [...openIdxs, idx]
    );
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newOrder = Array.from(order);
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);
    setOrder(newOrder);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(newOrder));
    }
  };

  // Split items into left and right columns based on current order
  const leftColumnItems: { item: typeof allItems[0], originalIdx: number }[] = [];
  const rightColumnItems: { item: typeof allItems[0], originalIdx: number }[] = [];
  
  order.forEach((itemIdx, displayIdx) => {
    const item = allItems[itemIdx];
    const itemData = { item, originalIdx: itemIdx };
    
    if (displayIdx < Math.ceil(allItems.length / 2)) {
      leftColumnItems.push(itemData);
    } else {
      rightColumnItems.push(itemData);
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Left Column */}
        <Droppable droppableId="left-column">
          {(provided, snapshot) => (
            <div 
              className={`space-y-4 min-h-[200px] p-2 rounded-lg transition-colors ${
                (snapshot as any).isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
              }`}
              ref={provided.innerRef} 
              {...provided.droppableProps}
            >
              {leftColumnItems.map(({ item, originalIdx }, idx) => (
                <Draggable key={item.title} draggableId={item.title} index={idx}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={
                        'border rounded-xl bg-white shadow-soft transition-shadow cursor-grab ' +
                        (snapshot.isDragging ? 'ring-2 ring-primary-400 shadow-lg' : 'hover:shadow-md')
                      }
                    >
                      <div className="flex items-center">
                        <button
                          className={
                            'flex-1 flex justify-between items-center px-4 py-4 text-left font-semibold text-blue-900 text-base focus:outline-none ' +
                            (openIdxs.includes(originalIdx) ? 'bg-blue-50' : '')
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(originalIdx);
                          }}
                          aria-expanded={openIdxs.includes(originalIdx)}
                          type="button"
                        >
                          <span>{item.title}</span>
                          <span className={
                            'transition-transform duration-200 ' +
                            (openIdxs.includes(originalIdx) ? 'rotate-90 text-blue-700' : 'text-gray-400')
                          }>▶</span>
                        </button>
                      </div>
                      <div
                        className={
                          'overflow-hidden transition-all duration-300 ' +
                          (openIdxs.includes(originalIdx) ? 'max-h-[1000px] py-4 px-6' : 'max-h-0 p-0')
                        }
                        style={{ background: openIdxs.includes(originalIdx) ? '#f0f6ff' : undefined }}
                      >
                        {openIdxs.includes(originalIdx) && item.content}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Right Column */}
        <Droppable droppableId="right-column">
          {(provided, snapshot) => (
            <div 
              className={`space-y-4 min-h-[200px] p-2 rounded-lg transition-colors ${
                (snapshot as any).isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
              }`}
              ref={provided.innerRef} 
              {...provided.droppableProps}
            >
              {rightColumnItems.map(({ item, originalIdx }, idx) => (
                <Draggable key={item.title} draggableId={item.title} index={leftColumnItems.length + idx}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={
                        'border rounded-xl bg-white shadow-soft transition-shadow cursor-grab ' +
                        (snapshot.isDragging ? 'ring-2 ring-primary-400 shadow-lg' : 'hover:shadow-md')
                      }
                    >
                      <div className="flex items-center">
                        <button
                          className={
                            'flex-1 flex justify-between items-center px-4 py-4 text-left font-semibold text-blue-900 text-base focus:outline-none ' +
                            (openIdxs.includes(originalIdx) ? 'bg-blue-50' : '')
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(originalIdx);
                          }}
                          aria-expanded={openIdxs.includes(originalIdx)}
                          type="button"
                        >
                          <span>{item.title}</span>
                          <span className={
                            'transition-transform duration-200 ' +
                            (openIdxs.includes(originalIdx) ? 'rotate-90 text-blue-700' : 'text-gray-400')
                          }>▶</span>
                        </button>
                      </div>
                      <div
                        className={
                          'overflow-hidden transition-all duration-300 ' +
                          (openIdxs.includes(originalIdx) ? 'max-h-[1000px] py-4 px-6' : 'max-h-0 p-0')
                        }
                        style={{ background: openIdxs.includes(originalIdx) ? '#f0f6ff' : undefined }}
                      >
                        {openIdxs.includes(originalIdx) && item.content}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export default function Home() {
  // Search and data state
  const [searchTerm, setSearchTerm] = useState('');
  const [soldPrices, setSoldPrices] = useState<SoldPrice[]>([]);
  const [displayedSoldPrices, setDisplayedSoldPrices] = useState<SoldPrice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Pagination state - updated for search_after
  const [page, setPage] = useState(1);
  const [paginationDirection, setPaginationDirection] = useState<'next' | 'previous'>('next');
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);
  const [searchAfter, setSearchAfter] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const [searchAfterHistory, setSearchAfterHistory] = useState<any[]>([]);
  
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
  
  // New filter state structure
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 10000000 },
    dateRange: { start: '', end: '' },
    propertyType: [] as string[],
    duration: [] as string[],
    year: [] as string[]
  });
  
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

  // Group properties by normalized address (paon + street + postcode)
  const groupPropertiesByAddress = useCallback((properties: SoldPrice[]) => {
    const grouped: { [key: string]: SoldPrice[] } = {};
    properties.forEach((sp) => {
      const addressKey = [
        sp.paon?.trim().toLowerCase() || '',
        sp.street?.trim().toLowerCase() || '',
        sp.postcode?.trim().toLowerCase() || ''
      ].join('|');
      if (!grouped[addressKey]) grouped[addressKey] = [];
      grouped[addressKey].push(sp);
    });
    // For the table, show only the most recent sale for each address
    const mostRecentSales = Object.values(grouped).map(salesArr =>
      salesArr.reduce((latest, curr) =>
        new Date(curr.dateOfTransfer) > new Date(latest.dateOfTransfer) ? curr : latest
      )
    );
    return { grouped, mostRecentSales };
  }, []);

  // Get all sales history for a specific address
  const getSalesHistoryForAddress = useCallback((property: SoldPrice) => {
    const addressKey = [
      property.paon?.trim().toLowerCase() || '',
      property.street?.trim().toLowerCase() || '',
      property.postcode?.trim().toLowerCase() || ''
    ].join('|');
    return soldPrices.filter(sale => {
      const saleAddressKey = [
        sale.paon?.trim().toLowerCase() || '',
        sale.street?.trim().toLowerCase() || '',
        sale.postcode?.trim().toLowerCase() || ''
      ].join('|');
      return saleAddressKey === addressKey;
    }).sort((a, b) => new Date(b.dateOfTransfer).getTime() - new Date(a.dateOfTransfer).getTime());
  }, [soldPrices]);

  // Create sales count map for display
  const [salesCountMap, setSalesCountMap] = useState<{ [key: string]: number }>({});

  // Main search function - updated for search_after pagination
  const handleSearch = useCallback(async (searchPostcode: string, pageNum = 1, direction: 'next' | 'previous' = 'next') => {
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
      setPaginationDirection(direction);
    } else {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);
      // Reset pagination state for new search
      setSearchAfter(null);
      setSearchAfterHistory([]);
      setHasMore(false);
    }

    setPage(pageNum);

    try {
      // Determine search_after value based on direction
      let currentSearchAfter = null;
      if (direction === 'next' && searchAfter) {
        currentSearchAfter = searchAfter;
      } else if (direction === 'previous' && searchAfterHistory.length > 0) {
        // Go back to previous cursor
        const newHistory = [...searchAfterHistory];
        newHistory.pop(); // Remove current
        currentSearchAfter = newHistory[newHistory.length - 1] || null;
        setSearchAfterHistory(newHistory);
      }

      const response = await fetch('/api/property-es', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          searchTerm: searchPostcode.trim(), 
          page: pageNum, 
          pageSize,
          searchAfter: currentSearchAfter
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTotalCount(data.totalCount || 0);
      setHasMore(data.hasMore || false);
      
      if (data.data && data.data.length > 0) {
        const enhancedData = await enhancePropertiesWithBMVScores(data.data);
        setSoldPrices(enhancedData);
        const { grouped, mostRecentSales } = groupPropertiesByAddress(enhancedData);
        // Build salesCountMap with deduplication: only unique sales per address (same date, price, and address fields)
        setSalesCountMap(Object.fromEntries(Object.entries(grouped).map(([k, v]) => {
          // Deduplicate sales for this address
          const uniqueSales = v.filter((sale, idx, arr) =>
            idx === arr.findIndex(other =>
              other.dateOfTransfer === sale.dateOfTransfer &&
              other.price === sale.price &&
              (other.paon || '') === (sale.paon || '') &&
              (other.saon || '') === (sale.saon || '') &&
              (other.street || '') === (sale.street || '') &&
              (other.postcode || '') === (sale.postcode || '')
            )
          );
          return [k, uniqueSales.length];
        })));
        
        // Update search_after state for next page
        if (data.nextSearchAfter) {
          setSearchAfter(data.nextSearchAfter);
          if (direction === 'next') {
            setSearchAfterHistory(prev => [...prev, currentSearchAfter].filter(Boolean));
          }
        }
        
        if (!isPaginationRequest) {
          setDisplayedSoldPrices(mostRecentSales);
          setTimeout(() => {
            showToast({
              type: 'success',
              title: 'Search Complete',
              message: `Found ${data.totalCount} sales records in ${searchPostcode.trim()}`,
            });
          }, 0);
        } else {
          setTimeout(() => setDisplayedSoldPrices(mostRecentSales), 100);
        }
      } else {
        setSoldPrices([]);
        setSalesCountMap({});
        if (!isPaginationRequest) {
          setDisplayedSoldPrices([]);
          showToast({
            type: 'info',
            title: 'No Results',
            message: `No properties found for "${searchPostcode.trim()}". Try a different search term.`,
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search properties. Please try again.');
        showToast({
          type: 'error',
        title: 'Search Error',
        message: 'Failed to search properties. Please try again.',
        });
    } finally {
      setIsLoading(false);
      setIsPaginationLoading(false);
    }
  }, [soldPrices.length, pageSize, searchAfter, searchAfterHistory, enhancePropertiesWithBMVScores, groupPropertiesByAddress, showToast]);

  // Filter and sort functions
  const handleSort = useCallback((key: keyof SoldPrice) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  }, []);

  const handleFiltersChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    // Apply filters to displayed data
    // This is a simplified implementation - you might want to re-fetch from API
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      priceRange: { min: 0, max: 10000000 },
      dateRange: { start: '', end: '' },
      propertyType: [],
      duration: [],
      year: []
    });
  }, []);

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch last updated data
  useEffect(() => {
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

    fetchLastUpdated();
  }, []);

  const handleRowClick = useCallback((property: SoldPrice) => {
    setSelectedProperty(property);
    setSelectedRowId(`${property.paon}-${property.street}-${property.dateOfTransfer}`);
    setPropertyHistory(getSalesHistoryForAddress(property));
    setShowHistoryModal(true);
  }, [getSalesHistoryForAddress]);

  const handleShowHistory = useCallback((property: SoldPrice, history: SoldPrice[]) => {
    setSelectedProperty(property);
    setPropertyHistory(history);
    setShowHistoryModal(true);
  }, []);

  const handleExport = useCallback(() => {
    if (soldPrices.length === 0) {
      showToast({
        type: 'warning',
        title: 'No Data to Export',
        message: 'Please search for properties first.',
      });
      return;
    }

    // Create CSV content
    const headers = ['Address', 'Property Type', 'Price', 'Sale Date', 'BMV Score', 'Postcode'];
    const csvContent = [
      headers.join(','),
      ...soldPrices.map(sp => [
        `"${[sp.paon, sp.saon, sp.street, sp.locality, sp.town_city, sp.county].filter(Boolean).join(', ')}"`,
        sp.propertyType,
        sp.price,
        sp.dateOfTransfer,
        sp.bmvScore || 0,
        sp.postcode
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-data-${searchTerm}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Export Complete',
      message: `Exported ${soldPrices.length} properties to CSV.`,
    });
  }, [soldPrices, searchTerm, showToast]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'UK Property Insights - Property Search Results',
        text: `Found ${soldPrices.length} properties in ${searchTerm}`,
        url: window.location.href,
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      showToast({
        type: 'success',
        title: 'Link Copied',
        message: 'Search results link copied to clipboard.',
      });
    }
  }, [soldPrices.length, searchTerm, showToast]);

  // Prepare chart data for area trends
  const chartData = useMemo(() => {
    if (soldPrices.length === 0) return { labels: [], data: [] };

    const yearData: { [key: string]: number[] } = {};
    
    soldPrices.forEach(sale => {
      const year = new Date(sale.dateOfTransfer).getFullYear().toString();
      if (!yearData[year]) {
        yearData[year] = [];
      }
      yearData[year].push(sale.price);
    });

    const labels = Object.keys(yearData).sort();
    const data = labels.map(year => {
      const prices = yearData[year];
      return Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
    });

    return { labels, data };
  }, [soldPrices]);

  // Calculate total growth for summary bar
  const totalGrowth = React.useMemo(() => {
    if (!soldPrices || soldPrices.length < 2) return null;
    // Group by year and get average per year
    const yearMap: Record<string, number[]> = {};
    soldPrices.forEach(sp => {
      const year = new Date(sp.dateOfTransfer).getFullYear();
      if (!yearMap[year]) yearMap[year] = [];
      yearMap[year].push(sp.price);
    });
    const years = Object.keys(yearMap).sort();
    if (years.length < 2) return null;
    const avgByYear = years.map(year => {
      const prices = yearMap[year];
      return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    });
    const first = avgByYear[0];
    const last = avgByYear[avgByYear.length - 1];
    const growth = last - first;
    const growthPct = first ? (growth / first) * 100 : 0;
    return { amount: growth, percent: growthPct };
  }, [soldPrices]);

  // Add state for trend data
  const [trendData, setTrendData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });

  // Fetch trend data when searchTerm changes and hasSearched is true
  useEffect(() => {
    if (!hasSearched || !searchTerm) return;
    console.log('Trend useEffect triggered', { hasSearched, searchTerm }); // Debug: effect triggered
    (async () => {
      try {
        const response = await fetch('/api/property-trend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchTerm }),
        });
        console.log('Trend fetch response status:', response.status); // Debug: fetch status
        if (response.ok) {
          const trend = await response.json();
          console.log('Trend data from /api/property-trend:', trend); // Debug: trend data
          setTrendData({
            labels: trend.map((row: any) => row.year.toString()),
            data: trend.map((row: any) => row.averagePrice),
          });
        } else {
          setTrendData({ labels: [], data: [] });
          console.warn('Trend fetch failed with status:', response.status); // Debug: fetch failed
        }
      } catch (err) {
        setTrendData({ labels: [], data: [] });
        console.error('Trend fetch error:', err); // Debug: fetch error
      }
    })();
  }, [searchTerm, hasSearched]);

  return (
    <>
      <Head>
        <title>UK Property Insights - Find Below Market Value Properties</title>
        <meta name="description" content="Search UK property data to identify investment opportunities with our advanced BMV scoring system" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section with Search */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
              Discover the <span className="text-primary-700 font-bold">true value</span> of UK homes with trusted <span className="text-primary-700 font-bold">Land Registry data</span>.
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Instantly see <span className="text-primary-700 font-bold">recent sales</span>, <span className="text-primary-700 font-bold">market trends</span>, and get smart tools to help you decide what&apos;s a <span className="text-primary-700 font-bold">fair price</span>—whether you&apos;re buying, selling, or investing.
            </p>
            <div className="mt-8">
              <EnhancedSearch
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={handleSearch}
                isLoading={isLoading}
              />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters and Actions */}
          {hasSearched && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsFiltersOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-text-primary hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </button>
                <BMVLegend />
              </div>
              
              <div className="flex items-center gap-2">
                      <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-text-primary hover:bg-gray-50 transition-colors"
                      >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                      </button>
                      <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-text-primary hover:bg-gray-50 transition-colors"
                      >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                      </button>
                    </div>
                </div>
            )}

          {/* Results Summary */}
                {hasSearched && (
                          <EnhancedResultsSummary
              totalCount={totalCount}
              displayedCount={displayedSoldPrices.length}
              searchTerm={searchTerm}
              lastUpdatedData={lastUpdatedData}
              totalGrowth={totalGrowth}
            />
          )}

          {/* Charts Section */}
          {hasSearched && !error && soldPrices.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-semibold text-text-primary">Area Analytics</h2>
                        </div>
              {/* Info box for analytics section */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 text-blue-900 text-sm shadow-sm">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="inline-block align-middle text-blue-500"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  What does this dashboard show?
                </div>
                <ul className="list-disc pl-6 mb-2">
                  <li><b>Average Sold Price Growth</b>: How property prices have changed over time in this area.</li>
                  <li><b>Growth of Area Per Year</b>: Year-by-year average price and growth rates.</li>
                  <li><b>Sales Per Year</b>: Number of properties sold each year.</li>
                  <li><b>Property Type Distribution</b>: Proportion of flats, houses, etc. sold.</li>
                  <li><b>Price Distribution</b>: Histogram of sale prices for the area.</li>
                  <li><b>Recent Notable Sales</b>: Table of the most recent/highlighted sales.</li>
                  <li><b>Tenure Distribution</b>: Leasehold vs. freehold breakdown.</li>
                </ul>
                <div className="mt-2 text-blue-800">
                  <b>Tip:</b> You can <b>drag and drop</b> any card to rearrange or move it between columns. Your custom layout will be saved for next time!
                </div>
              </div>
              <UnifiedAnalyticsAccordion
                leftItems={[
                  { title: 'Average Sold Price Growth', content: <AreaPriceTrendChart labels={trendData.labels} data={trendData.data} areaName={searchTerm} /> },
                  { title: 'Growth of Area Per Year', content: <AreaGrowthTable soldPrices={soldPrices} /> },
                ]}
                rightItems={[
                  { title: 'Market Activity', content: <SalesAndPropertyTypeCharts soldPrices={soldPrices} /> },
                  { title: 'Property Details', content: <PriceAndTenureCharts soldPrices={soldPrices} /> },
                  { title: 'Recent Notable Sales', content: <RecentSalesTable soldPrices={soldPrices} /> },
                ]}
              />
              {/* Show a warning if trendData is empty after a search */}
              {trendData.labels.length === 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-center">
                  <b>Warning:</b> No trend data available for this area. This may indicate no sales in recent years or a data issue.
                              </div>
              )}
            </section>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <X className="w-5 h-5 text-red-600" />
                            </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Search Error</h3>
                  <p className="text-red-700">{error}</p>
                                    </div>
                                  </div>
            </div>
          )}

          {/* Results Table */}
          {hasSearched && !error && (
            <div className="relative">
                                        <EnhancedSoldPricesTable
                soldPrices={displayedSoldPrices}
                onRowClick={handleRowClick}
                                          onShowHistory={handleShowHistory}
                sortConfig={sortConfig}
                onSort={handleSort}
                isLoading={isLoading}
                                          selectedRowId={selectedRowId}
                salesCountMap={salesCountMap}
                                        />
              
              {/* Pagination Loading Overlay */}
              {isPaginationLoading && (
                <PaginationLoadingOverlay isLoading={isPaginationLoading} direction={paginationDirection} />
                                      )}
                                    </div>
          )}

                                  {/* Pagination */}
          {hasSearched && !error && totalCount > pageSize && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-text-secondary">
                Showing {displayedSoldPrices.length} of {totalCount.toLocaleString()} results
                {page > 1 && (
                  <span className="ml-2 text-text-tertiary">
                    (Page {page})
                  </span>
                )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                  onClick={() => handleSearch(searchTerm, page - 1, 'previous')}
                  disabled={page === 1 || isPaginationLoading || searchAfterHistory.length === 0}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-text-primary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                          >
                                            Previous
                                          </button>
                <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-text-primary">
                  Page {page}
                                          </span>
                                          <button
                  onClick={() => handleSearch(searchTerm, page + 1, 'next')}
                  disabled={!hasMore || isPaginationLoading}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-text-primary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                          >
                                            Next
                                          </button>
                                      </div>
                                    </div>
                                  )}
        </main>

        {/* Back to Top Button */}
        <AnimatePresence>
                            {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-8 right-8 p-3 bg-primary-500 text-white rounded-full shadow-large hover:bg-primary-600 transition-colors z-50"
                                aria-label="Back to top"
                              >
              <ArrowUp className="w-5 h-5" />
            </motion.button>
                )}
              </AnimatePresence>

        {/* Filters Modal */}
        <EnhancedFilters
          isOpen={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
        />

        {/* Property History Modal */}
            {showHistoryModal && selectedProperty && (
              <PropertyHistoryModal
                property={selectedProperty}
                history={propertyHistory}
                onClose={() => setShowHistoryModal(false)}
            allSales={soldPrices}
              />
            )}
      </div>

          <Analytics />
          <SpeedInsights />
    </>
  );
}

