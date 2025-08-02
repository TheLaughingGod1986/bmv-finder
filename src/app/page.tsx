'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, BarChart3, Calculator, Search, Home as HomeIcon, 
  Target, Award, Shield, Zap, Clock, Users, CheckCircle, 
  ArrowRight, Star, MapPin, PoundSterling, ChartBar, 
  FileText, Building, Eye, ArrowUpRight, Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@supabase/auth-helpers-react';
import { useToast } from './components/ToastProvider';
import AddressSearchInput from './components/AddressSearchInput';
import MobileSearchBar from './components/MobileSearchBar';
import MobileFeatures from './components/MobileFeatures';
import GroupedSoldPricesTable from './components/GroupedSoldPricesTable';
import { LineChart, BarChart } from './components/ChartClientOnly';
import HpiDataCard from './components/HpiDataCard';
import FullScreenChart from './components/FullScreenChart';
import PostcodeTrendIndicator from './components/PostcodeTrendIndicator';
import SearchLimitManager from './components/SearchLimitManager';
import { useSearchLimit } from './components/SearchLimitContext';


// Add fetch utility for enhanced property search with pagination
async function fetchEnhancedProperties(query: string, page = 1, after?: any) {
  const res = await fetch('/api/search/enhanced', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      query, 
      size: 10, // Show 10 results per page
      page,
      after 
    })
  });
  if (!res.ok) throw new Error('Failed to fetch property results');
  return res.json();
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, size: 10, has_more: false, after_key: null });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({
    key: 'date',
    direction: 'descending'
  });
  const { showToast } = useToast();
  const router = useRouter();
  
  // User authentication and search limits
  const user = useUser();
  
  // Use search limit context with fallback
  const searchLimitData = useSearchLimit();
  
  const canSearch = searchLimitData?.canSearch || (() => {
    // If context not available, check localStorage directly
    if (typeof window !== 'undefined' && !user) {
      const storedCount = localStorage.getItem('anonymous_search_count');
      const count = storedCount ? parseInt(storedCount, 10) : 0;
      return count < 5; // SEARCH_LIMIT
    }
    return true; // Allow search for logged-in users or if context not available
  });
  
  const incrementSearchCount = searchLimitData?.incrementSearchCount || (() => {
    // If context not available, increment localStorage directly
    if (typeof window !== 'undefined' && !user) {
      const storedCount = localStorage.getItem('anonymous_search_count');
      const count = storedCount ? parseInt(storedCount, 10) : 0;
      const newCount = count + 1;
      localStorage.setItem('anonymous_search_count', newCount.toString());
    }
  });
  const [hpiData, setHpiData] = useState<any[]>([]);
  const [localPriceData, setLocalPriceData] = useState<any[]>([]);
  const [hpiLoading, setHpiLoading] = useState(false);
  const [hpiError, setHpiError] = useState<string | null>(null);
  const [hpiTooltip, setHpiTooltip] = useState<{ x: number; y: number; value: number; date: string } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const marketPredictionRef = useRef<HTMLDivElement>(null);
  
  const scrollToChart = () => {
    if (chartRef.current) {
      const y = chartRef.current.getBoundingClientRect().top + window.scrollY - 24; // smaller offset for less gap
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };
  
  const scrollToMarketPrediction = () => {
    if (marketPredictionRef.current) {
      const y = marketPredictionRef.current.getBoundingClientRect().top + window.scrollY - 80; // offset to show title
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };
  const [totalProperties, setTotalProperties] = useState<number | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [lastToastTime, setLastToastTime] = useState<number>(0);



  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  // Handle row click
  const handleRowClick = (property: any) => {
    setSelectedRowId(property.id || property.propertyNumber || null);
  };

  // Sort results based on sortConfig
  const sortedResults = results ? [...results].sort((a, b) => {
    const { key, direction } = sortConfig;
    let aValue = a[key];
    let bValue = b[key];

    // Handle date sorting
    if (key === 'date') {
      aValue = new Date(aValue || 0).getTime();
      bValue = new Date(bValue || 0).getTime();
    }
    // Handle price sorting
    else if (key === 'price') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }
    // Handle string sorting
    else {
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
    }

    if (aValue < bValue) return direction === 'ascending' ? -1 : 1;
    if (aValue > bValue) return direction === 'ascending' ? 1 : -1;
    return 0;
  }) : null;

  // Scroll to chart/table after results are set and not loading (only on initial search, not pagination)
  useEffect(() => {
    if (results && !isLoading && !error && pagination.page === 1) {
      setTimeout(() => {
        scrollToChart();
      }, 100);
    }
  }, [results, isLoading, error, pagination.page]);

  const handleSearch = useCallback(async (searchInput: string) => {
    // Prevent multiple simultaneous searches
    if (isLoading) {
      return;
    }

    // Prevent duplicate toasts by checking if we recently showed one
    const now = Date.now();
    const timeSinceLastToast = now - lastToastTime;
    
    if (!searchInput.trim()) {
      if (timeSinceLastToast > 2000) { // Only show toast if 2+ seconds have passed
        setLastToastTime(now);
        showToast({
          type: 'warning',
          title: 'Search Required',
          message: 'Please enter a postcode, address, area, or street name to search.',
        });
      }
      return;
    }

    // Check if user can search (logged in or under limit)
    if (!canSearch()) {
      if (timeSinceLastToast > 2000) { // Only show toast if 2+ seconds have passed
        setLastToastTime(now);
        showToast({
          type: 'error',
          title: 'Search Limit Reached',
          message: 'You have reached the limit of 5 searches. Please sign up to continue searching.',
        });
      }
      return;
    }

    setIsLoading(true);
    setError('');
    setResults(null);
    setPagination({ page: 1, size: 10, has_more: false, after_key: null });
    setTotalProperties(null);
    setSelectedRowId(null); // Clear selected row on new search
    try {
      const data = await fetchEnhancedProperties(searchInput.trim(), 1);
      if (data && data.results && data.results.length > 0) {
        setResults(data.results);
        setPagination(data.pagination || { page: 1, size: 10, has_more: false, after_key: null });
        setTotalProperties(typeof data.total === 'number' ? data.total : null);
      } else {
        setResults([]);
        setError('No properties found.');
        setTotalProperties(0);
      }

      // Fetch HPI data only if the search term looks like a postcode
      const postcodePattern = /^[A-Za-z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i;
      if (postcodePattern.test(searchInput.trim())) {
        try {
          const hpiResponse = await fetch(`/api/hpi/postcode?postcode=${encodeURIComponent(searchInput)}`);
          if (hpiResponse.ok) {
            const hpiResult = await hpiResponse.json();
            if (hpiResult.results && hpiResult.results.length > 0) {
              setHpiData(hpiResult.results);
            }
          }
        } catch (error) {
          console.error('Error fetching HPI data:', error);
        }
      } else {
        // Clear HPI data for non-postcode searches
        setHpiData([]);
      }

      // Fetch local price data for comparison - use all results since they're already filtered by search term
      if (data && data.results && data.results.length > 0) {
        const yearlyPrices = getAvgPricePerYear(data.results);
        setLocalPriceData(yearlyPrices);
      }

      // Scroll to Market Prediction section after data is loaded
      setTimeout(() => {
        scrollToMarketPrediction();
      }, 500); // Small delay to ensure DOM is updated

      // Increment search count for non-logged-in users after successful search
      incrementSearchCount();

    } catch (err: any) {
      setError(err.message || 'Failed to fetch results.');
      setTotalProperties(null);
    } finally {
      setIsLoading(false);
    }
  }, [showToast, user, canSearch, incrementSearchCount, lastToastTime, isLoading]);

  const handlePageChange = useCallback(async (page: number, after?: any) => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const data = await fetchEnhancedProperties(searchTerm.trim(), page, after);
      if (data && data.results) {
        setResults(data.results);
        setPagination(data.pagination || { page, size: 10, has_more: false, after_key: null });
        setTotalProperties(typeof data.total === 'number' ? data.total : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch results.');
      setTotalProperties(null);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  // Fetch HPI data only if the search term looks like a postcode
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) return;
    
    const postcodePattern = /^[A-Za-z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i;
    if (!postcodePattern.test(searchTerm.trim())) {
      // Clear HPI data for non-postcode searches
      setHpiData([]);
      setHpiError(null);
      setHpiLoading(false);
      return;
    }
    
    setHpiLoading(true);
    setHpiError(null);
    fetch(`/api/hpi/postcode?postcode=${encodeURIComponent(searchTerm)}`)
      .then(res => res.json())
      .then(data => {
        if (data.results && Array.isArray(data.results)) {
          setHpiData(data.results.filter((d: any) => d.date && d.index));
        } else {
          setHpiData([]);
          setHpiError('No HPI data found');
        }
      })
      .catch(() => {
        setHpiData([]);
        setHpiError('Failed to fetch HPI data');
      })
      .finally(() => setHpiLoading(false));
  }, [searchTerm]);

  // Scroll to Market Prediction when data is ready (only on initial search, not pagination)
  useEffect(() => {
    if (results && (localPriceData.length > 1 || hpiData.length > 1) && pagination.page === 1) {
      setTimeout(() => {
        scrollToMarketPrediction();
      }, 1000); // Delay to ensure Market Prediction section is rendered
    }
  }, [results, localPriceData, hpiData, pagination.page]);

  // Helper: aggregate average sale price per year for the current postcode
  function getAvgPricePerYear(soldPrices: any[]) {
    if (!soldPrices || soldPrices.length === 0) return [];
    const byYear: { [key: number]: number[] } = {};
    soldPrices.forEach((sp) => {
      if (!sp.date || !sp.price) return;
      const year = new Date(sp.date).getFullYear();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(Number(sp.price));
    });
    return Object.entries(byYear)
      .map(([year, prices]) => ({
        year: Number(year),
        avg: (prices as number[]).reduce((a, b) => a + b, 0) / prices.length
      }))
      .sort((a, b) => a.year - b.year);
  }

  const features = [
    {
      icon: <Search className="w-6 h-6" />,
      title: "25M+ Property Sales",
      description: "Instant access to every UK property sale since 1995",
      highlight: "Largest database"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "BMV Score Analysis",
      description: "AI-powered below market value detection for investors",
      highlight: "Exclusive feature"
    },
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "Deal Calculator",
      description: "Calculate ROI, yields, and investment potential instantly",
      highlight: "Free tool"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Market Trends",
      description: "Track price movements and market performance over time",
      highlight: "Real-time data"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Investment Insights",
      description: "Identify high-growth areas and investment opportunities",
      highlight: "Pro feature"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Professional Reports",
      description: "Generate detailed PDF reports for negotiations",
      highlight: "Elite feature"
    }
  ];

  const benefits = [
    "Save hours of research time",
    "Make data-driven investment decisions", 
    "Negotiate better deals with evidence",
    "Track your portfolio performance",
    "Identify emerging market trends",
    "Access professional-grade tools"
  ];

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Property Investor",
      content: "Found my best investment property using the BMV score. Made £45k profit in 6 months!",
      rating: 5
    },
    {
      name: "David Chen", 
      role: "Property Developer",
      content: "The market analysis tools saved me weeks of research. Highly recommend for serious investors.",
      rating: 5
    },
    {
      name: "Emma Thompson",
      role: "Estate Agent",
      content: "Professional reports help me close deals faster. My clients love the detailed insights.",
      rating: 5
    }
  ];

  // Calculate HPI growth summary values
  let hpiPct: number | null = null;
  let hpiStartYear: string | null = null;
  let hpiEndYear: string | null = null;
  if (hpiData.length > 1) {
    const sortedData = hpiData.slice().sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sortedData[0];
    const last = sortedData[sortedData.length - 1];
    hpiPct = ((last.index - first.index) / first.index) * 100;
    hpiStartYear = first.date?.slice(0, 4) || null;
    hpiEndYear = last.date?.slice(0, 4) || null;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Analytics />
        <SpeedInsights />

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-10"></div>
          <div className="relative max-w-screen-2xl w-[90vw] mx-auto pt-20 pb-16">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-6"
              >
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                  <Star className="w-4 h-4 mr-2" />
                  Trusted by 50,000+ property professionals
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight"
              >
                The UK&apos;s Most Powerful
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Property Research Platform
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
              >
                Access 25 million property sales, AI-powered BMV analysis, and professional tools to make smarter property decisions.
              </motion.p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="max-w-2xl mx-auto mb-8"
              >
                {/* Desktop Search */}
                <div className="hidden md:block">
                  <AddressSearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSearch={handleSearch}
                    isLoading={isLoading}
                    placeholder="Enter a postcode, address, area, or street name..."
                    showHistory={true}
                    showSuggestions={false}
                    className="w-full"
                  />
                </div>
                
                {/* Mobile Search */}
                <div className="md:hidden">
                  <MobileSearchBar
                    onSearch={handleSearch}
                    isLoading={isLoading}
                    placeholder="Enter a postcode, address, area, or street name..."
                  />
                </div>

                {/* Search Limit Warning for Non-Logged-In Users */}
                <SearchLimitManager />
                {/* Instant Results Table Below Search Bar */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 flex justify-center"
                    >
                      <div className="text-blue-600 text-sm font-medium">Searching...</div>
                    </motion.div>
                  )}
                  {error && !isLoading && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 text-center text-red-500 text-sm font-medium"
                    >
                      {error}
                    </motion.div>
                  )}
                  {results && !isLoading && !error && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-4 w-full px-0"
                    >
                      {/* Full-width Postcode Price Growth Section */}
                      {/* This section is now moved outside the main content container */}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <button
                  onClick={() => router.push('/advanced-deal-analysis')}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Try Deal Analysis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
                <button
                  onClick={() => router.push('/pricing')}
                  className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:shadow-xl border border-gray-200 transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  View Pricing
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Bank-level security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Real-time data</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>50,000+ users</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Market Prediction Section - Moved to prominent position */}
        {results && results.length > 0 && !error && (localPriceData.length > 1 || hpiData.length > 1) && (
          <motion.div
            ref={marketPredictionRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="my-8 w-full px-4 md:px-8"
          >
            {(() => {
              // Calculate market prediction values
              const localGrowth = localPriceData.length > 1 ? 
                ((localPriceData[localPriceData.length - 1]?.avg || 0) - (localPriceData[0]?.avg || 0)) / (localPriceData[0]?.avg || 1) * 100 : 0;
              const hpiGrowth = hpiPct || 0;
              const recentLocalGrowth = localPriceData.length > 1 ? 
                ((localPriceData[localPriceData.length - 1]?.avg || 0) - (localPriceData[localPriceData.length - 2]?.avg || 0)) / (localPriceData[localPriceData.length - 2]?.avg || 1) * 100 : 0;
              
              // Market state calculation - Will be updated after recommendation logic
              let marketState = 'neutral';
              let stateColor = 'text-gray-600';
              let stateBg = 'bg-gray-100';
              
              // Confidence calculation
              const localDataPoints = localPriceData.length;
              const hpiDataPoints = hpiData.length;
              const confidence = Math.min(95, Math.max(30, 
                (localDataPoints / 10) * 30 + 
                (hpiDataPoints / 24) * 40 + 
                25
              ));
              
              // Recommendation calculation - More intelligent logic that considers long-term vs short-term
              let recommendation = 'Monitor';
              let recColor = 'text-gray-600';
              let recommendationReason = 'Market is balanced - consider timing';
              let recommendationType = 'timing'; // 'timing', 'investment', 'holding'
              
              // Check if we're in a loss situation (negative overall growth)
              const isInLoss = localGrowth < -10; // Significant loss threshold
              const isRecentGrowth = recentLocalGrowth > 2;
              const isRegionalGrowth = hpiGrowth > 1;
              const isStrongGrowth = localGrowth > 15; // Very strong growth
              const isModerateGrowth = localGrowth > 5 && localGrowth <= 15; // Moderate growth
              
              if (isInLoss) {
                // If we're in a significant loss, don't recommend selling
                if (isRecentGrowth && isRegionalGrowth) {
                  recommendation = 'Hold & Monitor Recovery';
                  recColor = 'text-blue-600';
                  recommendationReason = 'Market showing recovery signs - consider holding for better prices';
                  recommendationType = 'holding';
                } else {
                  recommendation = 'Hold Position';
                  recColor = 'text-orange-600';
                  recommendationReason = 'Current market conditions suggest holding to avoid selling at a loss';
                  recommendationType = 'holding';
                }
              } else if (isStrongGrowth && isRecentGrowth && isRegionalGrowth) {
                // Very strong growth - consider short-term selling opportunity
                recommendation = 'Consider Short-Term Sale';
                recColor = 'text-red-600';
                recommendationReason = 'Peak market conditions - maximize current value';
                recommendationType = 'timing';
              } else if (isModerateGrowth && isRecentGrowth && isRegionalGrowth) {
                // Moderate growth - good for long-term holding
                recommendation = 'Hold for Long-Term Growth';
                recColor = 'text-blue-600';
                recommendationReason = 'Strong growth potential - consider long-term investment';
                recommendationType = 'investment';
              } else if (recentLocalGrowth < -3 || hpiGrowth < -5) {
                recommendation = 'Good Buying Opportunity';
                recColor = 'text-green-600';
                recommendationReason = 'Market conditions favor buyers';
                recommendationType = 'timing';
              } else if (localGrowth > 0 && localGrowth <= 5) {
                // Stable positive growth
                recommendation = 'Hold for Steady Growth';
                recColor = 'text-blue-600';
                recommendationReason = 'Stable market with positive growth potential';
                recommendationType = 'investment';
              }
              
              // Update market state based on recommendation logic
              if (isInLoss) {
                // If in loss, show neutral or buyer's market
                if (isRecentGrowth && isRegionalGrowth) {
                  marketState = 'neutral';
                  stateColor = 'text-blue-600';
                  stateBg = 'bg-blue-100';
                } else {
                  marketState = 'buyer';
                  stateColor = 'text-green-600';
                  stateBg = 'bg-green-100';
                }
              } else if (isRecentGrowth && isRegionalGrowth && localGrowth > 5) {
                // Only show seller's market if we have strong positive growth
                marketState = 'seller';
                stateColor = 'text-red-600';
                stateBg = 'bg-red-100';
              } else if (recentLocalGrowth < -2 || hpiGrowth < -5) {
                marketState = 'buyer';
                stateColor = 'text-green-600';
                stateBg = 'bg-green-100';
              } else {
                marketState = 'neutral';
                stateColor = 'text-gray-600';
                stateBg = 'bg-gray-100';
              }
              
              // Volatility calculation
              const volatility = Math.abs((hpiPct || 0) / 12);
              const volatilityLevel = volatility < 1 ? 'Low' : volatility < 3 ? 'Medium' : 'High';
              
              return (
                <div className="w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl shadow-xl border-2 border-blue-200 p-6 mb-8 relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400 rounded-full translate-y-12 -translate-x-12"></div>
                  </div>
                  
                  {/* Header with Badge */}
                  <div className="relative z-10 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Market Prediction</h3>
                        <p className="text-sm text-gray-600">AI-powered market analysis for {searchTerm}</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      LIVE ANALYSIS
                    </div>
                  </div>
                  
                  {/* Main Recommendation - Prominent Card */}
                  <div className="relative z-10 mb-6">
                    <div className={`bg-gradient-to-r ${
                      recColor.includes('green') ? 'from-emerald-700 to-green-800' : 
                      recColor.includes('red') ? 'from-red-600 to-pink-700' : 
                      recColor.includes('blue') ? 'from-blue-600 to-indigo-700' :
                      recColor.includes('orange') ? 'from-orange-600 to-red-600' :
                      'from-blue-600 to-purple-700'
                    } rounded-xl p-6 shadow-lg`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-bold text-white bg-white bg-opacity-20 px-3 py-1 rounded-full">RECOMMENDATION</span>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                          <h4 className="text-3xl font-bold mb-3 text-white drop-shadow-sm">{recommendation}</h4>
                          <p className="text-base text-white mb-4 font-medium">
                            {recommendationReason}
                          </p>
                          
                          {/* Explanation for Good Buying Opportunity */}
                          {recColor.includes('green') && (
                            <div className="bg-white bg-opacity-95 rounded-xl p-5 mt-4 shadow-inner border border-white border-opacity-50">
                              <div className="text-sm">
                                <div className="font-bold mb-4 text-emerald-800 text-base">Why this is a good buying opportunity:</div>
                                <ul className="space-y-3">
                                  <li className="flex items-start gap-3">
                                    <span className="text-emerald-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-emerald-800">Local prices declining:</span>
                                      <span className="text-gray-700 ml-2">Recent sales show {Math.abs(recentLocalGrowth).toFixed(1)}% decrease in local prices</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="text-emerald-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-emerald-800">Regional trend:</span>
                                      <span className="text-gray-700 ml-2">HPI shows {hpiPct > 0 ? '+' : ''}{hpiPct?.toFixed(1)}% regional movement</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="text-emerald-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-emerald-800">Market timing:</span>
                                      <span className="text-gray-700 ml-2">Current conditions suggest potential for better purchase prices</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="text-emerald-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-emerald-800">Data confidence:</span>
                                      <span className="text-gray-700 ml-2">Analysis based on {localPriceData.length} local sales and {hpiData.length} regional data points</span>
                                    </div>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Explanation for Short-Term Sale */}
                          {recColor.includes('red') && recommendationType === 'timing' && (
                            <div className="bg-white bg-opacity-95 rounded-xl p-5 mt-4 shadow-inner border border-white border-opacity-50">
                              <div className="text-sm">
                                <div className="font-bold mb-4 text-red-800 text-base">Why consider a short-term sale:</div>
                                <ul className="space-y-3">
                                  <li className="flex items-start gap-3">
                                    <span className="text-red-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-red-800">Peak market value:</span>
                                      <span className="text-gray-700 ml-2">Recent sales show {recentLocalGrowth.toFixed(1)}% increase in local prices</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="text-red-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-red-800">Regional momentum:</span>
                                      <span className="text-gray-700 ml-2">HPI shows {hpiPct > 0 ? '+' : ''}{hpiPct?.toFixed(1)}% regional growth</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="text-red-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-red-800">Market timing:</span>
                                      <span className="text-gray-700 ml-2">Current conditions may represent peak value - consider maximizing returns</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="text-red-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-red-800">Long-term outlook:</span>
                                      <span className="text-gray-700 ml-2">While short-term sale may be optimal, long-term growth potential remains strong</span>
                                    </div>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Explanation for Long-Term Investment */}
                          {recColor.includes('blue') && recommendationType === 'investment' && (
                            <div className="bg-white bg-opacity-95 rounded-xl p-5 mt-4 shadow-inner border border-white border-opacity-50">
                              <div className="text-sm">
                                <div className="font-bold mb-4 text-blue-800 text-base">Why hold for long-term growth:</div>
                                <ul className="space-y-3">
                                  <li className="flex items-start gap-3">
                                    <span className="text-blue-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-blue-800">Strong growth potential:</span>
                                      <span className="text-gray-700 ml-2">Overall growth shows {localGrowth.toFixed(1)}% with positive momentum</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="text-blue-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-blue-800">Recent trends:</span>
                                      <span className="text-gray-700 ml-2">Recent sales show {recentLocalGrowth > 0 ? '+' : ''}{recentLocalGrowth.toFixed(1)}% {recentLocalGrowth > 0 ? 'increase' : 'decrease'} in local prices</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="text-blue-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-blue-800">Regional outlook:</span>
                                      <span className="text-gray-700 ml-2">HPI shows {hpiPct > 0 ? '+' : ''}{hpiPct?.toFixed(1)}% regional movement</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="text-blue-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-blue-800">Long-term strategy:</span>
                                      <span className="text-gray-700 ml-2">Market conditions support continued growth - ideal for long-term investment</span>
                                    </div>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Explanation for Hold Position */}
                          {(recColor.includes('orange') || (recColor.includes('blue') && recommendationType === 'holding')) && (
                            <div className="bg-white bg-opacity-95 rounded-xl p-5 mt-4 shadow-inner border border-white border-opacity-50">
                              <div className="text-sm">
                                <div className={`font-bold mb-4 ${recColor.includes('blue') ? 'text-blue-800' : 'text-orange-800'} text-base`}>
                                  {recColor.includes('blue') ? 'Why you should hold and monitor:' : 'Why you should hold your position:'}
                                </div>
                                <ul className="space-y-3">
                                  <li className="flex items-start gap-3">
                                    <span className={`${recColor.includes('blue') ? 'text-blue-600' : 'text-orange-600'} font-bold text-lg mt-0.5`}>•</span>
                                    <div>
                                      <span className={`font-bold ${recColor.includes('blue') ? 'text-blue-800' : 'text-orange-800'}`}>Current market position:</span>
                                      <span className="text-gray-700 ml-2">Overall growth shows {localGrowth.toFixed(1)}% change, indicating {localGrowth > 0 ? 'gains' : 'potential losses'}</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className={`${recColor.includes('blue') ? 'text-blue-600' : 'text-orange-600'} font-bold text-lg mt-0.5`}>•</span>
                                    <div>
                                      <span className={`font-bold ${recColor.includes('blue') ? 'text-blue-800' : 'text-orange-800'}`}>Recent trends:</span>
                                      <span className="text-gray-700 ml-2">Recent sales show {recentLocalGrowth > 0 ? '+' : ''}{recentLocalGrowth.toFixed(1)}% {recentLocalGrowth > 0 ? 'increase' : 'decrease'} in local prices</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className={`${recColor.includes('blue') ? 'text-blue-600' : 'text-orange-600'} font-bold text-lg mt-0.5`}>•</span>
                                    <div>
                                      <span className={`font-bold ${recColor.includes('blue') ? 'text-blue-800' : 'text-orange-800'}`}>Regional outlook:</span>
                                      <span className="text-gray-700 ml-2">HPI shows {hpiPct > 0 ? '+' : ''}{hpiPct?.toFixed(1)}% regional movement</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className={`${recColor.includes('blue') ? 'text-blue-600' : 'text-orange-600'} font-bold text-lg mt-0.5`}>•</span>
                                    <div>
                                      <span className={`font-bold ${recColor.includes('blue') ? 'text-blue-800' : 'text-orange-800'}`}>Strategy:</span>
                                      <span className="text-gray-700 ml-2">{recColor.includes('blue') ? 'Market showing recovery signs - consider holding for better prices' : 'Current conditions suggest holding to avoid selling at a loss'}</span>
                                    </div>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Explanation for Monitor/Neutral */}
                          {!recColor.includes('green') && !recColor.includes('red') && (
                            <div className="bg-white bg-opacity-95 rounded-xl p-5 mt-4 shadow-inner border border-white border-opacity-50">
                              <div className="text-sm">
                                <div className="font-bold mb-4 text-gray-800 text-base">Market analysis summary:</div>
                                <ul className="space-y-3">
                                  <li className="flex items-start gap-3">
                                    <span className="text-gray-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-gray-800">Local trend:</span>
                                      <span className="text-gray-700 ml-2">Recent sales show {recentLocalGrowth > 0 ? '+' : ''}{recentLocalGrowth.toFixed(1)}% change in local prices</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="text-gray-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-gray-800">Regional trend:</span>
                                      <span className="text-gray-700 ml-2">HPI shows {hpiPct > 0 ? '+' : ''}{hpiPct?.toFixed(1)}% regional movement</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="text-gray-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-gray-800">Market balance:</span>
                                      <span className="text-gray-700 ml-2">Conditions are relatively stable - consider timing for optimal results</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="text-gray-600 font-bold text-lg mt-0.5">•</span>
                                    <div>
                                      <span className="font-bold text-gray-800">Data confidence:</span>
                                      <span className="text-gray-700 ml-2">Analysis based on {localPriceData.length} local sales and {hpiData.length} regional data points</span>
                                    </div>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Postcode Trend Indicator */}
                  <div className="relative z-10 mb-6">
                    <PostcodeTrendIndicator
                      postcode={searchTerm}
                      marketTrend={marketState === 'buyer' ? 'falling' : marketState === 'seller' ? 'rising' : 'stable'}
                      hpiData={hpiData}
                      recentSales={localPriceData}
                    />
                  </div>
                  
                  {/* Supporting Cards - Smaller Grid */}
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Market State Card */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-semibold text-gray-700">Market State</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${stateColor} ${stateBg}`}>
                          {marketState === 'seller' ? 'Seller\'s Market' : marketState === 'buyer' ? 'Buyer\'s Market' : 'Neutral Market'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Local Trend:</span>
                          <span className={`font-medium ${recentLocalGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {recentLocalGrowth > 0 ? '+' : ''}{recentLocalGrowth.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">HPI Trend:</span>
                          <span className={`font-medium ${hpiPct > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {hpiPct > 0 ? '+' : ''}{hpiPct?.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Data Quality Card */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="text-sm font-semibold text-gray-700">Data Quality</span>
                        </div>
                        <span className="text-xs font-bold text-purple-600">
                          {Math.round(confidence)}% Reliable
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Local Data:</span>
                          <span className="font-medium text-gray-900">{localPriceData.length} points</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">HPI Data:</span>
                          <span className="font-medium text-gray-900">{hpiData.length} points</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Volatility:</span>
                          <span className="font-medium text-gray-900">{volatilityLevel}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Market Analysis Details - Collapsible */}
                  <div className="relative z-10 mt-4">
                    <details className="group">
                      <summary className="cursor-pointer flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-sm font-semibold text-gray-700">📊 Detailed Market Analysis</span>
                        <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Local Price Trend:</span>
                              <span className={`font-semibold ${localGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {localGrowth > 0 ? '+' : ''}{localGrowth.toFixed(1)}% over {localPriceData.length > 1 ? `${localPriceData[0]?.year}-${localPriceData[localPriceData.length - 1]?.year}` : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">HPI Trend:</span>
                              <span className={`font-semibold ${hpiPct > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {hpiPct > 0 ? '+' : ''}{hpiPct?.toFixed(1)}% over {hpiStartYear}-{hpiEndYear}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Recent Momentum:</span>
                              <span className={`font-semibold ${recentLocalGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {recentLocalGrowth > 0 ? '+' : ''}{recentLocalGrowth.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Analysis Period:</span>
                              <span className="font-semibold text-gray-900">Last 24 months</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Market Volatility:</span>
                              <span className="font-semibold text-gray-900">{volatilityLevel}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Data Freshness:</span>
                              <span className="font-semibold text-green-600">Live</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Trend Discrepancy Explanation */}
                        {Math.abs(recentLocalGrowth - (hpiPct || 0)) > 2 && (
                          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <div className="w-5 h-5 bg-amber-500 rounded-full flex-shrink-0 mt-0.5"></div>
                              <div className="text-sm">
                                <div className="font-semibold text-amber-800 mb-1">Why Local vs HPI Trends Differ</div>
                                <div className="text-amber-700 space-y-1">
                                  <div>• <strong>Local Trend ({recentLocalGrowth > 0 ? '+' : ''}{recentLocalGrowth.toFixed(1)}%)</strong>: Based on actual sales in your specific postcode area</div>
                                  <div>• <strong>HPI Trend ({hpiPct > 0 ? '+' : ''}{hpiPct?.toFixed(1)}%)</strong>: Regional average across the broader area</div>
                                  <div>• This difference is normal and indicates <strong>market segmentation</strong> - your area may be experiencing different conditions than the broader region</div>
                                  <div>• Consider both trends when making decisions, but prioritize local data for your specific area</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Full-width Postcode Price Growth Section */}
        {results && results.length > 0 && !isLoading && !error && (
          <motion.div
            ref={chartRef}
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="my-12 w-full"
          >
            <section className="w-full px-0 md:px-8">
              {searchTerm && (hpiData.length > 1 || localPriceData.length > 1) && (
                <div className="mb-6 w-full" ref={chartRef}>
                  <div className="flex flex-col md:flex-row gap-6 w-full">
                    {/* Local Price Growth Chart + Summary */}
                    <FullScreenChart 
                      title="Local Price Growth Chart"
                      subtitle={`${searchTerm} - Average property prices over time`}
                      className="flex-1 min-w-0"
                    >
                      <div className="bg-gray-50 rounded-xl shadow-inner p-4 flex flex-col items-center justify-center h-full">
                      {localPriceData.length > 1 ? (
                        <>
                          {(() => {
                            const first = localPriceData[0];
                            const last = localPriceData[localPriceData.length - 1];
                            const pct = ((last.avg - first.avg) / first.avg) * 100;
                            const startYear = first.year;
                            const endYear = last.year;
                            return (
                              <div className="mb-2 flex flex-col items-center justify-center gap-1">
                                <span className={`text-2xl font-bold ${pct > 0 ? 'text-green-700' : pct < 0 ? 'text-red-700' : 'text-gray-700'}`}>{pct > 0 ? '+' : ''}{pct.toFixed(1)}% <span className="text-base text-gray-600 font-medium">Local Growth</span></span>
                                <span className="text-xs text-gray-500">{startYear} to {endYear}</span>
                              </div>
                            );
                          })()}
                          <div className="w-full" style={{height: 220}}>
                            <LineChart
                              data={{
                                labels: localPriceData.map((d: any) => d.year),
                                datasets: [
                                  {
                                    label: 'Local Average Price (£)',
                                    data: localPriceData.map((d: any) => d.avg),
                                    borderColor: 'rgb(34, 197, 94)',
                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                    fill: true,
                                    tension: 0.6
                                  }
                                ]
                              }}
                              options={{
                                responsive: true,
                                plugins: { legend: { display: false } },
                                scales: { y: { beginAtZero: false } },
                                maintainAspectRatio: false
                              }}
                              height={130}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full w-full min-h-[220px] text-gray-400 text-center">
                          <span className="text-lg font-medium">No data available for this chart.</span>
                        </div>
                      )}
                      </div>
                    </FullScreenChart>
                    {/* HPI Growth Chart + Summary */}
                    <FullScreenChart 
                      title="HPI Growth Chart"
                      subtitle={`${searchTerm} - House Price Index over time`}
                      className="flex-1 min-w-0"
                    >
                      <div className="bg-gray-50 rounded-xl shadow-inner p-4 flex flex-col items-center justify-center h-full">
                      {hpiData.length > 1 && hpiPct !== null && hpiStartYear && hpiEndYear ? (
                        <>
                          <div className="mb-2 flex flex-col items-center justify-center gap-1">
                            <span className={`text-2xl font-bold ${hpiPct > 0 ? 'text-green-700' : hpiPct < 0 ? 'text-red-700' : 'text-gray-700'}`}>{hpiPct > 0 ? '+' : ''}{hpiPct.toFixed(1)}% <span className="text-base text-gray-600 font-medium">HPI Growth</span></span>
                            <span className="text-xs text-gray-500">{hpiStartYear} to {hpiEndYear}</span>
                          </div>
                          <div className="w-full" style={{height: 220}}>
                            <LineChart
                              data={{
                                labels: hpiData.slice().reverse().map((d: any) => d.date),
                                datasets: [
                                  {
                                    label: 'HPI Index',
                                    data: hpiData.slice().reverse().map((d: any) => d.index),
                                    borderColor: 'rgb(59, 130, 246)',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    fill: true,
                                    tension: 0.6
                                  }
                                ]
                              }}
                              options={{
                                responsive: true,
                                plugins: { legend: { display: false } },
                                scales: { y: { beginAtZero: false } },
                                maintainAspectRatio: false
                              }}
                              height={130}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full w-full min-h-[220px] text-gray-400 text-center">
                          <span className="text-lg font-medium">No data available for this chart.</span>
                        </div>
                      )}
                      </div>
                    </FullScreenChart>
                  </div>
                </div>
              )}
              
            </section>
          </motion.div>
        )}



        {/* Main Content Container (centered) - Only show after search */}
        {results !== null && (
          <div className="relative max-w-screen-2xl w-[90vw] mx-auto">
            
            {/* Search Counter is now handled by SearchLimitManager */}
            
            <GroupedSoldPricesTable
              soldPrices={sortedResults || []}
              totalProperties={totalProperties}
              onRowClick={handleRowClick}
              sortConfig={sortConfig}
              onSort={handleSort}
              isLoading={false}
              selectedRowId={selectedRowId}
              postcode={searchTerm}
              pagination={pagination}
              onPageChange={handlePageChange}
              className="w-full"
            />
          </div>
        )}

        {/* Features Grid */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Succeed in Property
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From basic searches to advanced investment analysis, we've got all the tools you need.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white group-hover:scale-110 transition-transform duration-200">
                      {feature.icon}
                    </div>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {feature.highlight}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
                  Why Property Professionals Choose Us
                </h2>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-lg text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <button
                    onClick={() => {
                      // Trigger the register popup by clicking the account button in navigation
                      const accountButton = document.querySelector('[data-testid="account-button"]') as HTMLElement;
                      const mobileAccountButton = document.querySelector('[data-testid="account-button-mobile"]') as HTMLElement;
                      
                      if (accountButton) {
                        accountButton.click();
                      } else if (mobileAccountButton) {
                        mobileAccountButton.click();
                      } else {
                        // Fallback to navigation
                        router.push('/account/upgrade');
                      }
                    }}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    Start Your Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Market Data</h3>
                    <p className="text-gray-600">Access the latest property market insights and trends</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mobile Features Section */}
        <MobileFeatures />

        {/* Testimonials */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                What Our Users Say
              </h2>
              <p className="text-xl text-gray-600">
                Join thousands of satisfied property professionals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">&quot;{testimonial.content}&quot;</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold text-white mb-8"
            >
              Ready to Transform Your Property Business?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-blue-100 mb-8"
            >
              Join 50,000+ property professionals who trust us with their research
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => {
                  // Trigger the register popup by clicking the account button in navigation
                  const accountButton = document.querySelector('[data-testid="account-button"]') as HTMLElement;
                  const mobileAccountButton = document.querySelector('[data-testid="account-button-mobile"]') as HTMLElement;
                  
                  if (accountButton) {
                    accountButton.click();
                  } else if (mobileAccountButton) {
                    mobileAccountButton.click();
                  } else {
                    // Fallback to navigation
                    router.push('/account/upgrade');
                  }
                }}
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                onClick={() => router.push('/pricing')}
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors duration-200"
              >
                View All Plans
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </button>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}




