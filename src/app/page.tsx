'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, TrendingUp, BarChart3, Filter, X, MapPin, Download, Share2, ArrowUp, Search, Home as HomeIcon, Calculator, BarChart, BookOpen, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/apiClient';

// New UI Components
import { 
  Header, 
  HeroSection, 
  FeatureCard, 
  PricingCard, 
  TestimonialCard, 
  Footer, 
  Section, 
  Button 
} from './components/ui';

// Enhanced Components
import EnhancedSearch from './components/EnhancedSearch';
import AddressSearchInput from './components/AddressSearchInput';
import EnhancedFilters from './components/EnhancedFilters';
import EnhancedResultsSummary from './components/EnhancedResultsSummary';
import EnhancedSoldPricesTable from './components/EnhancedSoldPricesTable';
import { useToast } from './components/ToastProvider';
import { SoldPrice } from '../../types/sold-price';
import HpiDataDisplay from './components/HpiDataDisplay';
import RecentSalesDisplay from './components/RecentSalesDisplay';

// Components
import PaginationLoadingOverlay from './components/PaginationLoadingOverlay';
import BMVLegend from './components/BMVLegend';
import PropertyHistoryModal from './components/PropertyHistoryModal';
import TrustBadges from './components/TrustBadges';
import PartnerLogos from './components/PartnerLogos';
import Testimonials from './components/Testimonials';

// Replace the dynamic import for AreaPriceTrendChart and SalesPerYearBarChart with a static import:
import AreaPriceTrendChart, { SalesPerYearBarChart, PropertyTypePieChart, AreaGrowthTable, PriceDistributionHistogram, RecentSalesTable, TenurePieChart, SalesAndPropertyTypeCharts, PriceAndTenureCharts } from './components/AreaPriceTrendChart';

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
  
  // Filter state
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

  // HPI Data state
  const [showHpiData, setShowHpiData] = useState(false);
  const [hpiQuery, setHpiQuery] = useState<any>(null);
  const [showRecentSales, setShowRecentSales] = useState(false);
  const [recentSalesPostcode, setRecentSalesPostcode] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [salesCountMap, setSalesCountMap] = useState<Record<string, number>>({});

  // Gamification state
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [showAchievementToast, setShowAchievementToast] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<string | null>(null);

  // Mock usage data - replace with real data from your backend
  const usageData = {
    lookupsUsed: 3,
    lookupsLimit: 5,
    searchesThisMonth: 12,
    propertiesSaved: 8,
    daysActive: 15
  };
  
  const usagePercentage = Math.round((usageData.lookupsUsed / usageData.lookupsLimit) * 100);

  const { showToast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Helper: get sales history for address (use addressKey for grouping)
  const getSalesHistoryForAddress = useCallback((property: SoldPrice) => {
    if (!property) return [];
    const key = [
      property.paon?.trim().toLowerCase() || '',
      property.saon?.trim().toLowerCase() || '',  // Include saon (flat number)
      property.street?.trim().toLowerCase() || '',
      property.postcode?.trim().toLowerCase() || ''
    ].join('|');
    return soldPrices
      .filter((p) => [
        p.paon?.trim().toLowerCase() || '',
        p.saon?.trim().toLowerCase() || '',  // Include saon (flat number)
        p.street?.trim().toLowerCase() || '',
        p.postcode?.trim().toLowerCase() || ''
      ].join('|') === key)
      .sort((a, b) => new Date(a.dateOfTransfer).getTime() - new Date(b.dateOfTransfer).getTime());
  }, [soldPrices]);

  // Check for achievements on search
  const checkAchievements = (searchCount: number) => {
    if (searchCount === 1 && !showAchievementToast) {
      setCurrentAchievement('First Search');
      setShowAchievementToast(true);
      setTimeout(() => setShowAchievementToast(false), 5000);
    }
  };

  // Search handler
  const handleSearch = useCallback(
    async (searchInput: string, pageNum = 1, direction: 'next' | 'previous' = 'next') => {
      const POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][0-9A-Z]? ?[0-9][A-Z]{2}$/i;
      if (!searchInput.trim()) {
        showToast({
          type: 'warning',
          title: 'Search Required',
          message: 'Please enter a postcode, street name, or town to search.',
        });
        return;
      }

      const isPostcode = POSTCODE_REGEX.test(searchInput.toUpperCase());
      
      if (isPostcode) {
        setHpiQuery({ type: 'postcode', value: searchInput });
        setShowHpiData(true);
        setRecentSalesPostcode(searchInput);
        setShowRecentSales(true);
      } else {
        setHpiQuery({ type: 'region', value: searchInput });
        setShowHpiData(true);
        setShowRecentSales(false);
      }

      const isPaginationRequest = pageNum !== 1 && soldPrices.length > 0;
      
      if (isPaginationRequest) {
        setIsPaginationLoading(true);
        setPaginationDirection(direction);
      } else {
        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        setSearchAfter(null);
        setSearchAfterHistory([]);
        setHasMore(false);
      }

      setPage(pageNum);

      try {
        let currentSearchAfter = null;
        if (direction === 'next' && searchAfter) {
          currentSearchAfter = searchAfter;
        } else if (direction === 'previous' && searchAfterHistory.length > 0) {
          const newHistory = [...searchAfterHistory];
          newHistory.pop();
          currentSearchAfter = newHistory[newHistory.length - 1] || null;
          setSearchAfterHistory(newHistory);
        }

        const response = await apiClient.searchProperties(searchInput.trim(), {
          page: pageNum,
          pageSize,
          searchAfter: currentSearchAfter
        });

        if (response.error) {
          throw new Error(response.error);
        }

        const data = response.data;
        
        if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
          // --- ENHANCE PROPERTIES WITH BMV SCORE ---
          const enhanceRes = await apiClient.enhanceProperties((data as any).data);
          let enhancedProperties = (data as any).data;
          if (!enhanceRes.error && enhanceRes.data && typeof enhanceRes.data === 'object' && 'enhancedProperties' in enhanceRes.data) {
            enhancedProperties = (enhanceRes.data as any).enhancedProperties || (data as any).data;
          }

          // --- GROUP BY ADDRESS FOR SALES COUNT & DEDUPLICATION ---
          const grouped: Record<string, SoldPrice[]> = {};
          enhancedProperties.forEach((sp: SoldPrice) => {
            const addressKey = [
              sp.paon?.trim().toLowerCase() || '',
              sp.saon?.trim().toLowerCase() || '',  // Include saon (flat number)
              sp.street?.trim().toLowerCase() || '',
              sp.postcode?.trim().toLowerCase() || ''
            ].join('|');
            if (!grouped[addressKey]) grouped[addressKey] = [];
            grouped[addressKey].push(sp);
          });
          // For each group, keep only the most recent sale
          const mostRecentSales = Object.values(grouped).map(salesArr =>
            salesArr.reduce((latest, curr) =>
              new Date(curr.dateOfTransfer) > new Date(latest.dateOfTransfer) ? curr : latest
            )
          );
          // Build sales count map
          const countMap: Record<string, number> = {};
          Object.entries(grouped).forEach(([key, arr]) => {
            countMap[key] = arr.length;
          });

          setSoldPrices(enhancedProperties);
          setDisplayedSoldPrices(mostRecentSales);
          setTotalCount((data as any).totalCount || 0);
          setSearchAfter((data as any).searchAfter || null);
          setHasMore((data as any).hasMore || false);
          setSalesCountMap(countMap);
          setError(null);

          // Show toast and scroll to results
          showToast({
            type: 'success',
            title: 'Search Complete',
            message: `Found ${mostRecentSales.length} unique properties.`,
          });
          setTimeout(() => {
            if (resultsRef.current) {
              resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        } else {
          setError((data as any).error || 'Failed to fetch property data');
          setSoldPrices([]);
          setDisplayedSoldPrices([]);
          setSalesCountMap({});
        }
      } catch (error) {
        console.error('Search error:', error);
        setError('Failed to search properties. Please try again.');
        setSoldPrices([]);
        setDisplayedSoldPrices([]);
        setSalesCountMap({});
      } finally {
        setIsLoading(false);
        setIsPaginationLoading(false);
      }
    },
    [soldPrices, showToast, searchAfter, searchAfterHistory, pageSize]
  );

  // Handle search from hero section
  const handleHeroSearch = (query: string) => {
    setSearchTerm(query);
    handleSearch(query);
  };

  // Handle property history modal
  const handlePropertyClick = useCallback((property: SoldPrice) => {
    const history = getSalesHistoryForAddress(property);
    setPropertyHistory(history);
    setSelectedProperty(property);
    setShowHistoryModal(true);
  }, [getSalesHistoryForAddress]);

  // Handle row selection
  const handleRowSelect = useCallback((property: SoldPrice) => {
    // Generate a unique row ID from the property data
    const rowId = `${property.paon}-${property.street}-${property.postcode}-${property.dateOfTransfer}`;
    setSelectedRowId(rowId);
    handlePropertyClick(property);
  }, [handlePropertyClick]);

  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle scroll for back to top button
  React.useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch last updated data
  const fetchLastUpdated = async () => {
    try {
      const response = await apiClient.getLastUpdated();
      if (!response.error) {
        setLastUpdatedData(response.data as { lastUpdated: string; totalRecords?: number; indexSize?: string; source: string; note?: string; });
      }
    } catch (error) {
      console.error('Failed to fetch last updated data:', error);
    }
  };

  React.useEffect(() => {
    fetchLastUpdated();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Analytics />
      <SpeedInsights />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-primary-100 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-4 sm:mb-6"
            >
              UK Property Price Search
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto mb-6 sm:mb-8"
            >
              Search millions of UK property sales with instant access to Land Registry data, market trends, and investment insights.
            </motion.p>
          </div>

          {/* Search Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-6xl mx-auto"
          >
            <Section className="mb-12">
              <AddressSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={handleSearch}
                isLoading={isLoading}
                placeholder="Start typing a postcode or address..."
                showHistory={true}
                showSuggestions={true}
                debounceMs={300}
                minSearchLength={2}
              />
              <div className="mt-6 text-center">
                <a href="/advanced-deal-analysis" className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold shadow hover:bg-primary-700 transition">
                  Try Advanced Deal Analysis
                </a>
              </div>
            </Section>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12"
          >
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-soft text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary-600 mb-2">25M+</div>
              <div className="text-sm sm:text-base text-text-secondary">Property Sales</div>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-soft text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary-600 mb-2">1995-2024</div>
              <div className="text-sm sm:text-base text-text-secondary">Data Range</div>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-soft text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary-600 mb-2">Free</div>
              <div className="text-sm sm:text-base text-text-secondary">Basic Search</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Results Section */}
        {hasSearched && (
          <div ref={resultsRef} className="space-y-6 sm:space-y-8">
            {/* Results Summary */}
            {soldPrices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                                 <EnhancedResultsSummary
                   totalCount={totalCount}
                   displayedCount={displayedSoldPrices.length}
                   searchTerm={searchTerm}
                   lastUpdatedData={lastUpdatedData}
                   className="mb-6"
                 />
              </motion.div>
            )}

            

            {/* Results Table */}
            {soldPrices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <EnhancedSoldPricesTable
                  soldPrices={displayedSoldPrices}
                  allSales={soldPrices}
                  onRowClick={handleRowSelect}
                  onShowHistory={handlePropertyClick}
                  sortConfig={sortConfig}
                  onSort={key => setSortConfig(cfg => ({ ...cfg, key, direction: cfg.direction === 'ascending' ? 'descending' : 'ascending' }))}
                  isLoading={isLoading}
                  selectedRowId={selectedRowId}
                  className="mb-6 sm:mb-8"
                />
              </motion.div>
            )}

            {/* Pagination */}
            {soldPrices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="text-sm text-text-secondary">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSearch(searchTerm, page - 1, 'previous')}
                    disabled={page === 1 || isPaginationLoading}
                    className="px-4 py-2 text-sm font-medium text-text-primary bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-text-primary bg-gray-100 rounded-lg">
                    Page {page}
                  </span>
                  <button
                    onClick={() => handleSearch(searchTerm, page + 1, 'next')}
                    disabled={!hasMore || isPaginationLoading}
                    className="px-4 py-2 text-sm font-medium text-text-primary bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
              >
                <div className="text-red-600 mb-2">
                  <AlertTriangle className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Search Error</h3>
                <p className="text-red-700">{error}</p>
              </motion.div>
            )}

                         {/* Empty State */}
             {hasSearched && soldPrices.length === 0 && !isLoading && !error && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.4 }}
                 className="text-center py-12"
               >
                 <div className="text-6xl mb-4">🏠</div>
                 <h3 className="text-xl font-semibold text-text-primary mb-2">
                   No properties found
                 </h3>
                 <p className="text-text-secondary mb-4">
                   Try adjusting your search terms or filters to find more properties.
                 </p>
                 <button
                   onClick={() => setHasSearched(false)}
                   className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors touch-target"
                 >
                   Start New Search
                 </button>
               </motion.div>
             )}
          </div>
        )}

        {/* Features Section */}
        {!hasSearched && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="py-8 sm:py-12"
          >
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-4">
                Powerful Property Insights
              </h2>
              <p className="text-lg text-text-secondary max-w-3xl mx-auto">
                Get comprehensive property data and market analysis to make informed decisions.
              </p>
            </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
               <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft text-center">
                 <Search className="w-8 h-8 mx-auto mb-4 text-primary-600" />
                 <h3 className="text-lg font-semibold text-text-primary mb-2">Instant Search</h3>
                 <p className="text-text-secondary">Search millions of property sales instantly with our powerful database.</p>
               </div>
               <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft text-center">
                 <BarChart className="w-8 h-8 mx-auto mb-4 text-primary-600" />
                 <h3 className="text-lg font-semibold text-text-primary mb-2">Market Trends</h3>
                 <p className="text-text-secondary">Analyze price trends and market performance over time.</p>
               </div>
               <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft text-center">
                 <Calculator className="w-8 h-8 mx-auto mb-4 text-primary-600" />
                 <h3 className="text-lg font-semibold text-text-primary mb-2">Investment Tools</h3>
                 <p className="text-text-secondary">Calculate potential returns and analyze investment opportunities.</p>
               </div>
               <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft text-center">
                 <BookOpen className="w-8 h-8 mx-auto mb-4 text-primary-600" />
                 <h3 className="text-lg font-semibold text-text-primary mb-2">Detailed Reports</h3>
                 <p className="text-text-secondary">Get comprehensive property reports and market analysis.</p>
               </div>
               <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft text-center">
                 <MapPin className="w-8 h-8 mx-auto mb-4 text-primary-600" />
                 <h3 className="text-lg font-semibold text-text-primary mb-2">Location Insights</h3>
                 <p className="text-text-secondary">Understand local market conditions and property values.</p>
               </div>
               <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft text-center">
                 <TrendingUp className="w-8 h-8 mx-auto mb-4 text-primary-600" />
                 <h3 className="text-lg font-semibold text-text-primary mb-2">Growth Analysis</h3>
                 <p className="text-text-secondary">Track property value growth and investment performance.</p>
               </div>
             </div>
          </motion.section>
        )}

        {/* Trust and Social Proof */}
        {!hasSearched && (
          <>
            <TrustBadges />
            <PartnerLogos />
            <Testimonials />
          </>
        )}
      </main>

      {/* Filters Modal */}
      <EnhancedFilters
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onReset={() => {
          setFilters({
            priceRange: { min: 0, max: 10000000 },
            dateRange: { start: '', end: '' },
            propertyType: [],
            duration: [],
            year: []
          });
        }}
      />

             {/* Property History Modal */}
       {showHistoryModal && selectedProperty && (
         <PropertyHistoryModal
           onClose={() => setShowHistoryModal(false)}
           property={selectedProperty}
           history={propertyHistory}
         />
       )}

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 p-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors touch-target"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

             {/* Pagination Loading Overlay */}
       <PaginationLoadingOverlay isLoading={isPaginationLoading} direction={paginationDirection} />

      {/* Usage Progress for Free Users */}
      {usageData && (
        <section className="mb-8 bg-[#F5F5DC] rounded-xl p-6 border border-[#D2B48C]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#2C6E91] flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Your Free Lookups
            </h2>
            <span className="text-sm font-semibold text-[#3B755D]">
              {usageData.lookupsUsed}/{usageData.lookupsLimit} remaining
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-[#E5E5E5] rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  usagePercentage >= 80 ? 'bg-red-500' : 
                  usagePercentage >= 60 ? 'bg-yellow-500' : 'bg-[#5DA271]'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-[#3B755D] mt-2">
              <span>{usagePercentage}% used</span>
              {usagePercentage >= 80 && (
                <span className="text-red-600 font-semibold">Almost at limit!</span>
              )}
            </div>
          </div>
          
          {/* Upgrade CTA for high usage */}
          {usagePercentage >= 60 && (
            <div className="p-4 bg-gradient-to-r from-[#3A7CA5] to-[#2C6E91] rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold mb-1">Ready for unlimited access?</h3>
                  <p className="text-sm opacity-90">Upgrade to Pro for unlimited lookups and advanced features</p>
                </div>
                <a
                  href="/account/upgrade"
                  className="px-4 py-2 bg-white text-[#2C6E91] rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Upgrade Now
                </a>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Achievement Toast */}
      {showAchievementToast && currentAchievement && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-[#D4AF37] to-[#C0C0C0] text-white p-4 rounded-lg shadow-lg border border-white">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🏆</div>
            <div>
              <h3 className="font-bold">Achievement Unlocked!</h3>
              <p className="text-sm opacity-90">{currentAchievement}</p>
            </div>
            <button
              onClick={() => setShowAchievementToast(false)}
              className="text-white text-opacity-70 hover:text-opacity-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



