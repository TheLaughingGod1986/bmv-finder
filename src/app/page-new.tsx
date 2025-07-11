'use client';

import React, { useState, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, TrendingUp, BarChart3, Filter, X, MapPin, Download, Share2, ArrowUp, Search, Home, Calculator, BarChart, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

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

// Replace the dynamic import for AreaPriceTrendChart and SalesPerYearBarChart with a static import:
import AreaPriceTrendChart, { SalesPerYearBarChart, PropertyTypePieChart, AreaGrowthTable, PriceDistributionHistogram, RecentSalesTable, TenurePieChart, SalesAndPropertyTypeCharts, PriceAndTenureCharts } from './components/AreaPriceTrendChart';

export default function HomeNew() {
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
  const [hpiQuery, setHpiQuery] = useState<{ type: 'postcode' | 'region' | 'region_fallback'; value: string }>({ type: 'postcode', value: '' });

  // Recent Sales state
  const [showRecentSales, setShowRecentSales] = useState(false);
  const [recentSalesPostcode, setRecentSalesPostcode] = useState('');

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

  // Group properties by normalized address
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
    const mostRecentSales = Object.values(grouped).map(salesArr =>
      salesArr.reduce((latest, curr) =>
        new Date(curr.dateOfTransfer) > new Date(latest.dateOfTransfer) ? curr : latest
      )
    );
    return { grouped, mostRecentSales };
  }, []);

  // Get sales history for address
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

  const [salesCountMap, setSalesCountMap] = useState<{ [key: string]: number }>({});

  // Main search function
  const handleSearch = useCallback(async (searchInput: string, pageNum = 1, direction: 'next' | 'previous' = 'next') => {
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

      const response = await fetch('/api/property-es', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          searchTerm: searchInput.trim(), 
          page: pageNum, 
          pageSize,
          searchAfter: currentSearchAfter
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const enhancedProperties = await enhancePropertiesWithBMVScores(data.properties);
        const { mostRecentSales } = groupPropertiesByAddress(enhancedProperties);
        
        if (isPaginationRequest) {
          if (direction === 'next') {
            setSoldPrices(prev => [...prev, ...enhancedProperties]);
            setDisplayedSoldPrices(prev => [...prev, ...mostRecentSales]);
            if (currentSearchAfter) {
              setSearchAfterHistory(prev => [...prev, currentSearchAfter]);
            }
          } else {
            setSoldPrices(enhancedProperties);
            setDisplayedSoldPrices(mostRecentSales);
          }
        } else {
          setSoldPrices(enhancedProperties);
          setDisplayedSoldPrices(mostRecentSales);
        }
        
        setTotalCount(data.totalCount);
        setSearchAfter(data.searchAfter);
        setHasMore(data.hasMore);
        setError(null);
        
        // Create sales count map
        const countMap: { [key: string]: number } = {};
        enhancedProperties.forEach((property: SoldPrice) => {
          const addressKey = [
            property.paon?.trim().toLowerCase() || '',
            property.street?.trim().toLowerCase() || '',
            property.postcode?.trim().toLowerCase() || ''
          ].join('|');
          countMap[addressKey] = (countMap[addressKey] || 0) + 1;
        });
        setSalesCountMap(countMap);
        
      } else {
        setError(data.error || 'Failed to fetch property data');
        setSoldPrices([]);
        setDisplayedSoldPrices([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search properties. Please try again.');
      setSoldPrices([]);
      setDisplayedSoldPrices([]);
    } finally {
      setIsLoading(false);
      setIsPaginationLoading(false);
    }
  }, [searchAfter, searchAfterHistory, soldPrices.length, enhancePropertiesWithBMVScores, groupPropertiesByAddress, showToast]);

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
      const response = await fetch('/api/last-updated');
      if (response.ok) {
        const data = await response.json();
        setLastUpdatedData(data);
      }
    } catch (error) {
      console.error('Failed to fetch last updated data:', error);
    }
  };

  React.useEffect(() => {
    fetchLastUpdated();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      <Analytics />
      <SpeedInsights />
      
      {/* Hero Section with Search */}
      <HeroSection onSearch={handleHeroSearch} />
      
      {/* Features Section */}
      <Section id="features" background="white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-[#2C6E91] mb-4">
            Powerful Property Insights
          </h2>
          <p className="text-lg text-[#3B755D] max-w-2xl mx-auto">
            Everything you need to make informed property decisions, from market analysis to investment opportunities.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-10">
          <FeatureCard
            icon="📈"
            title="Comprehensive Analytics"
            description="Analyse local markets, trends, and yields with up-to-date Land Registry data."
          />
          <FeatureCard
            icon="🔍"
            title="Smart Search Tools"
            description="Find properties by postcode, street, or town. Filter by price, type, and more."
          />
          <FeatureCard
            icon="💡"
            title="Investor Insights"
            description="Get BMV scores, investment ratings, and actionable insights for every property."
          />
        </div>
      </Section>

      {/* Search Results Section */}
      {hasSearched && (
        <Section background="light">
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-start">
              <div className="flex-1">
                <EnhancedSearch
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSearch={handleSearch}
                  isLoading={isLoading}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {isFiltersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Summary */}
            {!isLoading && displayedSoldPrices.length > 0 && (
              <EnhancedResultsSummary
                totalCount={totalCount}
                displayedCount={displayedSoldPrices.length}
                searchTerm={searchTerm}
                lastUpdatedData={lastUpdatedData}
              />
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#3A7CA5]" />
                <span className="ml-2 text-[#2C6E91]">Searching properties...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <p className="font-medium">Search Error</p>
                <p>{error}</p>
              </div>
            )}

            {/* Results Table */}
            {!isLoading && displayedSoldPrices.length > 0 && (
              <div className="space-y-6">
                <EnhancedSoldPricesTable
                  soldPrices={displayedSoldPrices}
                  allSales={soldPrices}
                  onRowClick={handleRowSelect}
                  onShowHistory={(property, history) => {
                    setSelectedProperty(property);
                    setPropertyHistory(history);
                    setShowHistoryModal(true);
                  }}
                  selectedRowId={selectedRowId}
                  sortConfig={sortConfig}
                  onSort={(key) => setSortConfig(prev => ({
                    key,
                    direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
                  }))}
                  isLoading={isLoading}
                />
                
                {/* Analytics Section */}
                {showHpiData && (
                  <div className="space-y-6">
                    <HpiDataDisplay 
                      query={hpiQuery} 
                      isVisible={showHpiData}
                      onClose={() => setShowHpiData(false)}
                    />
                    {showRecentSales && (
                      <RecentSalesDisplay 
                        postcode={recentSalesPostcode} 
                        isVisible={showRecentSales}
                        onClose={() => setShowRecentSales(false)}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && hasSearched && displayedSoldPrices.length === 0 && !error && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-xl font-semibold text-[#2C6E91] mb-2">
                  No properties found
                </h3>
                <p className="text-[#3B755D] mb-4">
                  Try adjusting your search terms or filters to find more properties.
                </p>
                <Button onClick={() => setHasSearched(false)}>
                  Start New Search
                </Button>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Quick Actions Section */}
      {!hasSearched && (
        <Section background="light">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[#2C6E91] mb-4">
              Explore Our Tools
            </h2>
            <p className="text-lg text-[#3B755D] max-w-2xl mx-auto">
              Discover additional tools to help with your property research and investment decisions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Button
              href="/what-should-i-pay"
              variant="outline"
              className="flex flex-col items-center p-6 h-auto space-y-3 hover-lift"
            >
              <Home className="w-8 h-8 text-[#3A7CA5]" />
              <span className="font-semibold">What Should I Pay?</span>
              <span className="text-sm text-[#3B755D]">Get property valuations</span>
            </Button>
            
            <Button
              href="/deal-calculator"
              variant="outline"
              className="flex flex-col items-center p-6 h-auto space-y-3 hover-lift"
            >
              <Calculator className="w-8 h-8 text-[#3A7CA5]" />
              <span className="font-semibold">Deal Calculator</span>
              <span className="text-sm text-[#3B755D]">Calculate investment returns</span>
            </Button>
            
            <Button
              href="/hpi-dashboard"
              variant="outline"
              className="flex flex-col items-center p-6 h-auto space-y-3 hover-lift"
            >
                              <BarChart className="w-8 h-8 text-[#3A7CA5]" />
              <span className="font-semibold">HPI Dashboard</span>
              <span className="text-sm text-[#3B755D]">View market trends</span>
            </Button>
            
            <Button
              href="/portfolio-tracker"
              variant="outline"
              className="flex flex-col items-center p-6 h-auto space-y-3 hover-lift"
            >
              <BookOpen className="w-8 h-8 text-[#3A7CA5]" />
              <span className="font-semibold">Portfolio Tracker</span>
              <span className="text-sm text-[#3B755D]">Track your investments</span>
            </Button>
          </div>
        </Section>
      )}

      {/* Pricing Section */}
      <Section id="plans" background="light">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-[#2C6E91] mb-4">
            Simple, Transparent Plans
          </h2>
          <p className="text-lg text-[#3B755D] max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include our core search and analytics features.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingCard
            title="Starter"
            price="Free"
            period=""
            features={[
              "✔️ Basic search & analytics",
              "✔️ Access to public data",
              "✔️ Limited saved searches"
            ]}
            ctaText="Get Started"
            ctaHref="/account"
          />
          
          <PricingCard
            title="Pro"
            price="£14"
            period="/mo"
            features={[
              "✔️ All Starter features",
              "✔️ Unlimited searches",
              "✔️ Download CSV",
              "✔️ Priority support"
            ]}
            ctaText="Upgrade to Pro"
            ctaHref="/account"
            isPopular={true}
          />
          
          <PricingCard
            title="Elite"
            price="£29"
            period="/mo"
            features={[
              "✔️ All Pro features",
              "✔️ API access",
              "✔️ Advanced analytics",
              "✔️ Early feature access"
            ]}
            ctaText="Go Elite"
            ctaHref="/account"
          />
        </div>
      </Section>

      {/* Testimonials Section */}
      <Section id="testimonials" background="white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-[#2C6E91] mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-[#3B755D] max-w-2xl mx-auto">
            Join thousands of property professionals who trust our platform for their research needs.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <TestimonialCard
            rating={5}
            text="The analytics and search tools are a game changer for my investment strategy."
            author="Tom H."
          />
          <TestimonialCard
            rating={5}
            text="I love the clean interface and the depth of data available."
            author="Michelle T."
          />
          <TestimonialCard
            rating={5}
            text="A must-have tool for any serious property investor."
            author="Richard D."
          />
        </div>
      </Section>

      {/* Property History Modal */}
      {selectedProperty && showHistoryModal && (
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
            className="fixed bottom-6 right-6 bg-[#3A7CA5] text-white p-3 rounded-full shadow-lg hover:bg-[#2C6E91] transition-colors z-50"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Pagination Loading Overlay */}
      <PaginationLoadingOverlay isLoading={isPaginationLoading} />
    </div>
  );
} 