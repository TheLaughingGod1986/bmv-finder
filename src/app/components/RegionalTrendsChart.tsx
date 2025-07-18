'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Calendar, MapPin, Info, CheckSquare, Square, Search } from 'lucide-react';
import SmartSearchInput from './SmartSearchInput';

interface MarketData {
  region: string;
  currentIndex: number;
  yoyGrowth: number;
  timeframeGrowth: number;
  momGrowth: number;
  volatility: number;
  trend: 'rising' | 'falling' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  investmentScore: number;
  lastUpdated: string;
  dataPoints: number;
}

interface RegionalTrendsChartProps {
  data: MarketData[];
  timeframe: '1y' | '2y' | '5y';
  autoSelectRegions?: string[]; // New prop for auto-selecting regions from postcode searches
}

export default function RegionalTrendsChart({ data, timeframe, autoSelectRegions = [] }: RegionalTrendsChartProps) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparedPostcodes, setComparedPostcodes] = useState<string[]>([]); // NEW

  // Auto-select regions when provided (e.g., from postcode searches)
  useEffect(() => {
    if (autoSelectRegions.length > 0) {
      const validRegions = autoSelectRegions.filter(region => 
        data.some(item => item.region === region)
      );
      if (validRegions.length > 0) {
        setSelectedRegions(prev => {
          const newSelection = [...new Set([...prev, ...validRegions])];
          return newSelection;
        });
        setComparisonMode(true); // Automatically enter comparison mode
      }
    }
  }, [autoSelectRegions, data]);

  // Sort data by growth (highest to lowest) and select top 10
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.timeframeGrowth - a.timeframeGrowth);
  }, [data]);
  const top10Regions = useMemo(() => {
    return sortedData.slice(0, 10).map(item => item.region);
  }, [sortedData]);
  
  // Update selected regions when data or timeframe changes
  useEffect(() => {
    if (selectedRegions.length === 0) {
      setSelectedRegions(top10Regions);
    }
  }, [data, timeframe, top10Regions]);

  // Map postcodes to regions for search functionality
  const getRegionFromPostcode = (postcode: string): string | null => {
    const normalizedPostcode = postcode.replace(/\s+/g, '').toLowerCase();
    
    // Common postcode to region mappings
    const postcodeMappings: { [key: string]: string } = {
      'ne5': 'north-east',
      'ne4': 'north-east', 
      'ne6': 'north-east',
      'ne7': 'north-east',
      'ne8': 'north-east',
      'ne9': 'north-east',
      'ne10': 'north-east',
      'ne11': 'north-east',
      'ne12': 'north-east',
      'ne13': 'north-east',
      'ne14': 'north-east',
      'ne15': 'north-east',
      'ne16': 'north-east',
      'ne17': 'north-east',
      'ne18': 'north-east',
      'ne19': 'north-east',
      'ne20': 'north-east',
      'ne21': 'north-east',
      'ne22': 'north-east',
      'ne23': 'north-east',
      'ne24': 'north-east',
      'ne25': 'north-east',
      'ne26': 'north-east',
      'ne27': 'north-east',
      'ne28': 'north-east',
      'ne29': 'north-east',
      'ne30': 'north-east',
      'ne31': 'north-east',
      'ne32': 'north-east',
      'ne33': 'north-east',
      'ne34': 'north-east',
      'ne35': 'north-east',
      'ne36': 'north-east',
      'ne37': 'north-east',
      'ne38': 'north-east',
      'ne39': 'north-east',
      'ne40': 'north-east',
      'ne41': 'north-east',
      'ne42': 'north-east',
      'ne43': 'north-east',
      'ne44': 'north-east',
      'ne45': 'north-east',
      'ne46': 'north-east',
      'ne47': 'north-east',
      'ne48': 'north-east',
      'ne49': 'north-east',
      'se1': 'london',
      'se2': 'outer-london',
      'se3': 'outer-london',
      'se4': 'outer-london',
      'se5': 'inner-london',
      'se6': 'outer-london',
      'se7': 'outer-london',
      'se8': 'outer-london',
      'se9': 'outer-london',
      'se10': 'inner-london',
      'se11': 'inner-london',
      'se12': 'outer-london',
      'se13': 'outer-london',
      'se14': 'inner-london',
      'se15': 'inner-london',
      'se16': 'inner-london',
      'se17': 'inner-london',
      'se18': 'outer-london',
      'se19': 'outer-london',
      'se20': 'outer-london',
      'se21': 'outer-london',
      'se22': 'inner-london',
      'se23': 'outer-london',
      'se24': 'inner-london',
      'se25': 'outer-london',
      'se26': 'outer-london',
      'se27': 'outer-london',
      'se28': 'outer-london',
      'sw1': 'london',
      'sw2': 'inner-london',
      'sw3': 'inner-london',
      'sw4': 'inner-london',
      'sw5': 'inner-london',
      'sw6': 'inner-london',
      'sw7': 'inner-london',
      'sw8': 'inner-london',
      'sw9': 'inner-london',
      'sw10': 'inner-london',
      'sw11': 'inner-london',
      'sw12': 'inner-london',
      'sw13': 'outer-london',
      'sw14': 'outer-london',
      'sw15': 'outer-london',
      'sw16': 'outer-london',
      'sw17': 'outer-london',
      'sw18': 'outer-london',
      'sw19': 'outer-london',
      'sw20': 'outer-london',
      'nw1': 'london',
      'nw2': 'outer-london',
      'nw3': 'inner-london',
      'nw4': 'outer-london',
      'nw5': 'inner-london',
      'nw6': 'inner-london',
      'nw7': 'outer-london',
      'nw8': 'inner-london',
      'nw9': 'outer-london',
      'nw10': 'outer-london',
      'nw11': 'outer-london',
      'e1': 'london',
      'e2': 'inner-london',
      'e3': 'outer-london',
      'e4': 'outer-london',
      'e5': 'outer-london',
      'e6': 'outer-london',
      'e7': 'outer-london',
      'e8': 'inner-london',
      'e9': 'outer-london',
      'e10': 'outer-london',
      'e11': 'outer-london',
      'e12': 'outer-london',
      'e13': 'outer-london',
      'e14': 'inner-london',
      'e15': 'outer-london',
      'e16': 'outer-london',
      'e17': 'outer-london',
      'e18': 'outer-london',
      'e20': 'outer-london',
      'w1': 'london',
      'w2': 'inner-london',
      'w3': 'outer-london',
      'w4': 'outer-london',
      'w5': 'outer-london',
      'w6': 'outer-london',
      'w7': 'outer-london',
      'w8': 'inner-london',
      'w9': 'outer-london',
      'w10': 'outer-london',
      'w11': 'outer-london',
      'w12': 'outer-london',
      'w13': 'outer-london',
      'w14': 'outer-london',
      'ec1': 'city-of-london',
      'ec2': 'city-of-london',
      'ec3': 'city-of-london',
      'ec4': 'city-of-london',
      'wc1': 'inner-london',
      'wc2': 'inner-london',
    };
    
    return postcodeMappings[normalizedPostcode] || null;
  };

  // Enhanced search function that handles both region names and postcodes (full or partial)
  const enhancedSearch = async (searchTerm: string) => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    // Try to extract postcode prefix (e.g., NE5 from NE5 2PR)
    const postcodeMatch = normalizedSearch.match(/^([a-z]{1,2}\d{1,2}[a-z]?)/i);
    let regionFromPostcode = null;
    if (postcodeMatch) {
      regionFromPostcode = getRegionFromPostcode(postcodeMatch[1]);
    }
    if (regionFromPostcode) {
      return sortedData.filter(item => item.region === regionFromPostcode);
    }
    // Then, try to find by region name
    return sortedData.filter(item => 
      formatRegionName(item.region).toLowerCase().includes(normalizedSearch) ||
      item.region.toLowerCase().includes(normalizedSearch)
    );
  };

  // NEW: Async search for postcode data
  const [postcodeOption, setPostcodeOption] = useState<any | null>(null);
  const [searchingPostcode, setSearchingPostcode] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchPostcodeData() {
      setPostcodeOption(null);
      if (isValidPostcode(searchTerm)) {
        setSearchingPostcode(true);
        try {
          const response = await fetch(`/api/market-analysis/enhanced?search=${encodeURIComponent(searchTerm.trim())}`);
          const result = await response.json();
          if (!ignore && result.success && result.data && result.data.length > 0) {
            setPostcodeOption({
              label: `Postcode: ${searchTerm.trim().toUpperCase()}`,
              data: result.data[0],
              value: searchTerm.trim().toUpperCase(),
            });
          } else {
            setPostcodeOption({
              label: `Postcode: ${searchTerm.trim().toUpperCase()}`,
              data: null,
              value: searchTerm.trim().toUpperCase(),
            });
          }
        } catch (e) {
          setPostcodeOption(null);
        } finally {
          setSearchingPostcode(false);
        }
      } else {
        setPostcodeOption(null);
      }
    }
    if (searchTerm.trim() && isValidPostcode(searchTerm)) {
      fetchPostcodeData();
    } else {
      setPostcodeOption(null);
    }
    return () => { ignore = true; };
  }, [searchTerm]);

  // NEW: Add postcode to comparison
  const handleAddPostcode = () => {
    const normalized = searchTerm.trim().toUpperCase();
    if (normalized) {
      // Normalize the postcode consistently
      const normalizedPc = normalizePostcode(normalized);
      
      // Check if postcode already exists in any format (with or without space)
      const normalizedNoSpace = normalizedPc.replace(/\s+/g, '');
      const alreadyExists = comparedPostcodes.some(pc => {
        const pcNoSpace = pc.replace(/\s+/g, '');
        return pcNoSpace === normalizedNoSpace;
      });
      
      console.log('Adding postcode:', {
        input: normalized,
        normalized: normalizedPc,
        normalizedNoSpace,
        existingPostcodes: comparedPostcodes,
        alreadyExists
      });
      
      if (!alreadyExists) {
        // If we have pre-fetched data from the search, use it
        if (postcodeOption && postcodeOption.data) {
          handleAddPostcodeFromDropdown(normalizedPc, postcodeOption.data);
        } else {
          // Fallback to the old method
          setComparedPostcodes(prev => [...prev, normalizedPc]);
          setSearchTerm('');
          setComparisonMode(true);
        }
      } else {
        console.log('Postcode already exists, not adding:', normalizedPc);
      }
    }
  };

  // NEW: Add postcode from dropdown (with pre-fetched data)
  const handleAddPostcodeFromDropdown = (postcode: string, preFetchedData?: any) => {
    if (postcode) {
      // Normalize the postcode consistently
      const normalizedPc = normalizePostcode(postcode);
      
      // Check if postcode already exists in any format (with or without space)
      const normalizedNoSpace = normalizedPc.replace(/\s+/g, '');
      const alreadyExists = comparedPostcodes.some(pc => {
        const pcNoSpace = pc.replace(/\s+/g, '');
        return pcNoSpace === normalizedNoSpace;
      });
      
      console.log('Adding postcode from dropdown:', {
        input: postcode,
        normalized: normalizedPc,
        normalizedNoSpace,
        existingPostcodes: comparedPostcodes,
        alreadyExists
      });
      
      if (!alreadyExists) {
        setComparedPostcodes(prev => [...prev, normalizedPc]);
        setSearchTerm('');
        setComparisonMode(true);
        
        // If we have pre-fetched data, store it to avoid re-fetching
        if (preFetchedData) {
          setComparedPostcodeData(prev => [...prev, {
            postcode: normalizedPc,
            region: preFetchedData.region || 'Unknown Region',
            currentIndex: preFetchedData.currentIndex || 100,
            yoyGrowth: preFetchedData.yoyGrowth || 0,
            timeframeGrowth: preFetchedData.timeframeGrowth || 0,
            momGrowth: preFetchedData.momGrowth || 0,
            volatility: preFetchedData.volatility || 0,
            trend: preFetchedData.trend || 'stable',
            riskLevel: preFetchedData.riskLevel || 'medium',
            investmentScore: preFetchedData.investmentScore || 50,
            lastUpdated: preFetchedData.lastUpdated || new Date().toISOString().split('T')[0],
            dataPoints: preFetchedData.dataPoints || 0
          }]);
        }
      } else {
        console.log('Postcode already exists (dropdown), not adding:', normalizedPc);
      }
    }
  };

  // NEW: Remove postcode from comparison
  const handleRemovePostcode = (postcode: string) => {
    const normalizedNoSpace = postcode.replace(/\s+/g, '');
    setComparedPostcodes(prev => prev.filter(pc => {
      const pcNoSpace = pc.replace(/\s+/g, '');
      return pcNoSpace !== normalizedNoSpace;
    }));
  };

  // NEW: Validate UK postcode format
  const isValidPostcode = (postcode: string): boolean => {
    const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
    return ukPostcodeRegex.test(postcode.trim());
  };

  // NEW: Normalize postcode consistently (add space if needed)
  const normalizePostcode = (postcode: string): string => {
    let normalized = postcode.toUpperCase().trim();
    if (normalized.length > 5 && !normalized.includes(' ')) {
      normalized = normalized.slice(0, normalized.length - 3) + ' ' + normalized.slice(-3);
    }
    return normalized;
  };

  // NEW: Extract postcode prefix for region mapping
  const getPostcodePrefix = (postcode: string): string => {
    const normalized = postcode.replace(/\s+/g, '').toLowerCase();
    const match = normalized.match(/^([a-z]{1,2}\d{1,2}[a-z]?)/i);
    return match ? match[1] : '';
  };

  const handleRegionToggle = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  const handleSelectAll = () => {
    setSelectedRegions(sortedData.map(item => item.region));
  };

  const handleSelectTop10 = () => {
    setSelectedRegions(top10Regions);
  };

  const handleClearAll = () => {
    setSelectedRegions([]);
  };

  const handleCompareMode = () => {
    setComparisonMode(!comparisonMode);
    if (!comparisonMode) {
      // When entering comparison mode, keep current selection
      setShowAllRegions(true);
    }
  };

  const formatRegionName = (region: string) => {
    return region
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Add state for filteredRegions
  const [filteredRegions, setFilteredRegions] = useState<MarketData[]>([]);

  // Update filteredRegions asynchronously when searchTerm changes
  useEffect(() => {
    let ignore = false;
    const doSearch = async () => {
      if (searchTerm.trim()) {
        const results = await enhancedSearch(searchTerm);
        if (!ignore) setFilteredRegions(results);
      } else {
        setFilteredRegions([]);
      }
    };
    doSearch();
    return () => { ignore = true; };
  }, [searchTerm, data]); // Removed timeframe dependency

  // NEW: Get data for compared postcodes - with proper caching to prevent infinite loops
  const [comparedPostcodeData, setComparedPostcodeData] = useState<any[]>([]);
  const fetchedPostcodesRef = useRef<Set<string>>(new Set());

  // Fetch actual HPI data for compared postcodes - with better state management
  useEffect(() => {
    let isMounted = true;
    
    const fetchPostcodeData = async () => {
      if (comparedPostcodes.length === 0) {
        if (isMounted) {
          setComparedPostcodeData([]);
          fetchedPostcodesRef.current.clear();
        }
        return;
      }

      // Only fetch for new postcodes that haven't been fetched yet
      const newPostcodes = comparedPostcodes.filter(pc => {
        const pcNoSpace = pc.replace(/\s+/g, '');
        return !fetchedPostcodesRef.current.has(pcNoSpace);
      });
      
      if (newPostcodes.length === 0) {
        return; // No new postcodes to fetch
      }

      try {
        const postcodeData = await Promise.all(
          newPostcodes.map(async (pc) => {
            try {
              // Normalize postcode consistently
              const normalizedPc = normalizePostcode(pc);
              
              // Try to fetch actual HPI data for the postcode
              const response = await fetch(`/api/hpi/postcode?postcode=${encodeURIComponent(normalizedPc)}`);
              const result = await response.json();
              
              // Debug logging to see what the API returns
              console.log(`API response for ${normalizedPc}:`, result);
              console.log(`Results length: ${result.results?.length || 0}`);
              if (result.results && result.results.length > 0) {
                console.log(`First result:`, result.results[0]);
              }
              
              if (result.results && result.results.length > 0) {
                // Process the HPI data from the API
                const hpiData = result.results;
                const latestData = hpiData[0]; // Most recent data
                console.log(`Processing HPI data for ${normalizedPc}:`, { hpiDataLength: hpiData.length, latestData });
                
                // Check what fields are available in the data
                console.log(`Available fields in latestData:`, Object.keys(latestData));
                
                // The HPI data might have different field names - let's check for common ones
                const hpiValue = latestData.hpi_value || latestData.value || latestData.index || latestData.hpi || latestData.hpiIndex;
                console.log(`HPI value found:`, hpiValue);
                
                if (!hpiValue) {
                  console.log(`No HPI value found in data for ${normalizedPc}, creating placeholder`);
                  return {
                    region: result.region || normalizedPc,
                    postcode: normalizedPc,
                    currentIndex: 0,
                    yoyGrowth: null,
                    timeframeGrowth: null,
                    momGrowth: null,
                    volatility: 0,
                    trend: 'stable',
                    riskLevel: 'low',
                    investmentScore: 50,
                    lastUpdated: latestData.date || 'Unknown',
                    dataPoints: hpiData.length
                  };
                }
                
                // Find historical data points
                const oneYearAgo = hpiData.find((item: any) => {
                  const itemDate = new Date(item.date);
                  const latestDate = new Date(latestData.date);
                  const diffInMonths = (latestDate.getFullYear() - itemDate.getFullYear()) * 12 + 
                                     (latestDate.getMonth() - itemDate.getMonth());
                  return diffInMonths >= 12;
                });
                
                const oneMonthAgo = hpiData.find((item: any) => {
                  const itemDate = new Date(item.date);
                  const latestDate = new Date(latestData.date);
                  const diffInMonths = (latestDate.getFullYear() - itemDate.getFullYear()) * 12 + 
                                     (latestDate.getMonth() - itemDate.getMonth());
                  return diffInMonths >= 1;
                });

                // Get the HPI values for comparison data
                const oneYearAgoValue = oneYearAgo ? (oneYearAgo.hpi_value || oneYearAgo.value || oneYearAgo.index || oneYearAgo.hpi || oneYearAgo.hpiIndex) : null;
                const oneMonthAgoValue = oneMonthAgo ? (oneMonthAgo.hpi_value || oneMonthAgo.value || oneMonthAgo.index || oneMonthAgo.hpi || oneMonthAgo.hpiIndex) : null;
                
                console.log(`Comparison values:`, { hpiValue, oneYearAgoValue, oneMonthAgoValue });

                // Calculate growth rates
                const yoyGrowth = oneYearAgoValue ? ((hpiValue - oneYearAgoValue) / oneYearAgoValue) * 100 : 0;
                const momGrowth = oneMonthAgoValue ? ((hpiValue - oneMonthAgoValue) / oneMonthAgoValue) * 100 : 0;
                
                // Calculate timeframe growth based on current timeframe
                let timeframeGrowth = 0;
                if (timeframe === '1y') {
                  timeframeGrowth = yoyGrowth;
                } else if (timeframe === '2y') {
                  const twoYearsAgo = hpiData.find((item: any) => {
                    const itemDate = new Date(item.date);
                    const latestDate = new Date(latestData.date);
                    const diffInMonths = (latestDate.getFullYear() - itemDate.getFullYear()) * 12 + 
                                       (latestDate.getMonth() - itemDate.getMonth());
                    return diffInMonths >= 24;
                  });
                  const twoYearsAgoValue = twoYearsAgo ? (twoYearsAgo.hpi_value || twoYearsAgo.value || twoYearsAgo.index || twoYearsAgo.hpi || twoYearsAgo.hpiIndex) : null;
                  timeframeGrowth = twoYearsAgoValue ? ((hpiValue - twoYearsAgoValue) / twoYearsAgoValue) * 100 : 0;
                } else if (timeframe === '5y') {
                  const fiveYearsAgo = hpiData.find((item: any) => {
                    const itemDate = new Date(item.date);
                    const latestDate = new Date(latestData.date);
                    const diffInMonths = (latestDate.getFullYear() - itemDate.getFullYear()) * 12 + 
                                       (latestDate.getMonth() - itemDate.getMonth());
                    return diffInMonths >= 60;
                  });
                  const fiveYearsAgoValue = fiveYearsAgo ? (fiveYearsAgo.hpi_value || fiveYearsAgo.value || fiveYearsAgo.index || fiveYearsAgo.hpi || fiveYearsAgo.hpiIndex) : null;
                  timeframeGrowth = fiveYearsAgoValue ? ((hpiValue - fiveYearsAgoValue) / fiveYearsAgoValue) * 100 : 0;
                }

                // Determine trend and risk level
                const trend = timeframeGrowth > 2 ? 'rising' : timeframeGrowth < -2 ? 'falling' : 'stable';
                const riskLevel = Math.abs(timeframeGrowth) > 10 ? 'high' : Math.abs(timeframeGrowth) > 5 ? 'medium' : 'low';
                
                // Calculate investment score (simplified)
                const investmentScore = Math.max(0, Math.min(100, 50 + (timeframeGrowth * 2)));

                const processedData = {
                  region: result.region || normalizedPc,
                  postcode: normalizedPc,
                  currentIndex: hpiValue,
                  yoyGrowth: yoyGrowth,
                  timeframeGrowth: timeframeGrowth,
                  momGrowth: momGrowth,
                  volatility: Math.abs(momGrowth),
                  trend: trend,
                  riskLevel: riskLevel,
                  investmentScore: investmentScore,
                  lastUpdated: latestData.date,
                  dataPoints: hpiData.length
                };
                
                console.log(`Processed data for ${normalizedPc}:`, processedData);
                return processedData;
              } else {
                // No data found for postcode, show placeholder
                console.log(`No results found for ${normalizedPc}, creating placeholder`);
                return {
                  region: 'Unknown Region',
                  postcode: normalizedPc,
                  currentIndex: 0,
                  yoyGrowth: null,
                  timeframeGrowth: null,
                  momGrowth: null,
                  volatility: null,
                  trend: 'stable',
                  riskLevel: 'medium',
                  investmentScore: 50,
                  lastUpdated: new Date().toISOString().split('T')[0],
                  dataPoints: 0
                };
              }
            } catch (error) {
              console.error(`Error fetching data for postcode ${pc}:`, error);
              console.log(`Falling back to region-based data for ${pc}`);
              // Fallback to region-based data
              const prefix = getPostcodePrefix(pc);
              const region = prefix ? getRegionFromPostcode(prefix) : null;
              const regionData = region ? sortedData.find(item => item.region === region) : null;
              
              if (regionData) {
                return { ...regionData, postcode: pc };
              } else {
                return {
                  region: 'Unknown Region',
                  postcode: pc,
                  currentIndex: 0,
                  yoyGrowth: 0,
                  timeframeGrowth: 0,
                  momGrowth: 0,
                  volatility: 0,
                  trend: 'stable' as const,
                  riskLevel: 'medium' as const,
                  investmentScore: 50,
                  lastUpdated: new Date().toISOString().split('T')[0],
                  dataPoints: 0
                };
              }
            }
          })
        );
        
        if (isMounted) {
          // Add new data to existing data
          setComparedPostcodeData(prevData => {
            const existingPostcodes = new Set(prevData.map(item => item.postcode));
            const newData = postcodeData.filter(item => !existingPostcodes.has(item.postcode));
            return [...prevData, ...newData];
          });
          
          // Mark these postcodes as fetched (using normalized version without spaces)
          newPostcodes.forEach(pc => {
            const pcNoSpace = pc.replace(/\s+/g, '');
            fetchedPostcodesRef.current.add(pcNoSpace);
          });
        }
      } catch (error) {
        console.error('Error fetching postcode data:', error);
      }
    };

    fetchPostcodeData();

    return () => {
      isMounted = false;
    };
  }, [comparedPostcodes]); // Removed timeframe from dependencies to prevent infinite loops

  // Separate effect to update timeframe calculations when timeframe changes
  useEffect(() => {
    setComparedPostcodeData(prevData => {
      if (prevData.length === 0) return prevData;
      
      return prevData.map(item => {
        // Only recalculate if we have actual HPI data
        if (item.currentIndex > 0 && item.dataPoints > 0) {
          // Recalculate timeframe growth based on new timeframe
          let newTimeframeGrowth = item.yoyGrowth; // Default to YoY
          
          if (timeframe === '2y') {
            // For 2y, we need to estimate based on YoY growth
            // This is a simplified calculation - in a real app you'd fetch the actual 2y data
            newTimeframeGrowth = item.yoyGrowth * 1.8; // Rough estimate
          } else if (timeframe === '5y') {
            // For 5y, estimate based on YoY growth
            newTimeframeGrowth = item.yoyGrowth * 4.5; // Rough estimate
          }
          
          return {
            ...item,
            timeframeGrowth: newTimeframeGrowth
          };
        }
        return item;
      });
    });
  }, [timeframe]); // Only depend on timeframe

  // Clean up fetched postcodes when they're removed and remove invalid data
  useEffect(() => {
    const currentPostcodes = new Set(comparedPostcodes.map(pc => pc.replace(/\s+/g, '')));
    
    // Remove postcodes from ref that are no longer in comparedPostcodes
    const fetchedPostcodes = Array.from(fetchedPostcodesRef.current);
    fetchedPostcodes.forEach(pc => {
      if (!currentPostcodes.has(pc)) {
        fetchedPostcodesRef.current.delete(pc);
      }
    });
    
    // Remove postcodes from data that are no longer in comparedPostcodes OR have no valid data
    setComparedPostcodeData(prevData => {
      const filtered = prevData.filter(item => {
        const itemNoSpace = item.postcode.replace(/\s+/g, '');
        const isInCurrentList = currentPostcodes.has(itemNoSpace);
        
        // Check if item has valid data
        const hasValidData = item.currentIndex && item.currentIndex > 0 && 
          (item.timeframeGrowth !== null && item.timeframeGrowth !== undefined) &&
          (item.yoyGrowth !== null && item.yoyGrowth !== undefined) &&
          (item.momGrowth !== null && item.momGrowth !== undefined);
        
        // Remove if not in current list OR has no valid data
        if (!isInCurrentList || !hasValidData) {
          if (!hasValidData) {
            console.log('Auto-removing postcode with no data:', item.postcode);
            // Also remove from comparedPostcodes state
            setComparedPostcodes(prev => prev.filter(pc => {
              const pcNoSpace = pc.replace(/\s+/g, '');
              return pcNoSpace !== itemNoSpace;
            }));
          }
          return false;
        }
        return true;
      });
      
      // Only update if the data actually changed
      if (filtered.length !== prevData.length) {
        return filtered;
      }
      return prevData;
    });
  }, [comparedPostcodes]);

  const filteredData = sortedData.filter(item => selectedRegions.includes(item.region));

  const getGrowthColor = (growth: number) => {
    if (growth >= 5) return 'text-green-600';
    if (growth >= 0) return 'text-blue-600';
    return 'text-red-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth >= 0) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising': return 'text-green-600';
      case 'falling': return 'text-red-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case '1y': return '1 Year';
      case '2y': return '2 Years';
      case '5y': return '5 Years';
      default: return '1 Year';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Regional Trends</h3>
            <p className="text-sm text-gray-500 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{getTimeframeLabel()} Growth Analysis</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCompareMode}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center space-x-1 ${
              comparisonMode 
                ? 'text-white bg-blue-600 hover:bg-blue-700' 
                : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>Compare</span>
          </button>
          <button
            onClick={handleSelectTop10}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            Top 10
          </button>
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Comparison Mode Info */}
      {comparisonMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Comparison Mode</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Select specific regions to compare their performance. Use the search below to find regions quickly.
          </p>
        </div>
      )}

      {/* Region Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">
            {comparisonMode ? 'Select Regions to Compare' : 'Select Regions'}
          </h4>
          <div className="flex items-center space-x-2">
            {!comparisonMode && (
              <button
                onClick={() => setShowAllRegions(!showAllRegions)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showAllRegions ? 'Show Top 10 Only' : `Show All (${sortedData.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-3">
          <SmartSearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search regions or postcodes..."
            showHistory={true}
            showSuggestions={true}
            debounceMs={300}
            minSearchLength={2}
            className=""
          />
          {/* NEW: Add postcode button */}
          {searchTerm.trim() && isValidPostcode(searchTerm) && !comparedPostcodes.includes(searchTerm.trim().toUpperCase()) && (
            <div className="mt-2">
              <button
                type="button"
                onClick={handleAddPostcode}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Postcode
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
          {/* Show postcode option if valid and not already added */}
          {comparisonMode && postcodeOption && !comparedPostcodes.includes(postcodeOption.value) && (
            <label
              key={postcodeOption.value}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-green-50 cursor-pointer border border-green-200 bg-green-50"
            >
              <input
                type="checkbox"
                checked={false}
                onChange={() => handleAddPostcodeFromDropdown(postcodeOption.value, postcodeOption.data)}
                className="rounded border-green-400 text-green-600 focus:ring-green-500"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-green-700 truncate block">
                  {postcodeOption.label}
                </span>
                <span className="text-xs text-gray-500">
                  {postcodeOption.data ? `${postcodeOption.data.timeframeGrowth > 0 ? '+' : ''}${postcodeOption.data.timeframeGrowth.toFixed(1)}% growth` : 'No data'}
                </span>
              </div>
            </label>
          )}
          {/* Show region options as before */}
          {(comparisonMode ? filteredRegions : (showAllRegions ? sortedData : sortedData.slice(0, 10))).map((item) => (
            <label
              key={item.region}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedRegions.includes(item.region)}
                onChange={() => handleRegionToggle(item.region)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-700 truncate block">
                  {formatRegionName(item.region)}
                </span>
                <span className={`text-xs ${getGrowthColor(item.timeframeGrowth)}`}> 
                  {item.timeframeGrowth > 0 ? '+' : ''}{item.timeframeGrowth.toFixed(1)}%
                </span>
              </div>
            </label>
          ))}
          {comparisonMode && filteredRegions.length === 0 && !postcodeOption && (
            <div className="col-span-full text-center py-4 text-sm text-gray-500">
              No regions found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>

      {/* Selected Regions & Postcodes Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Selected: {selectedRegions.length} regions, {comparedPostcodes.length} postcodes
          </span>
          <span className="text-xs text-gray-500">
            {comparisonMode 
              ? 'Custom comparison selection'
              : `Showing top performers by ${getTimeframeLabel().toLowerCase()} growth`
            }
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {selectedRegions.slice(0, 5).map(region => (
            <span
              key={region}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {formatRegionName(region)}
            </span>
          ))}
          {comparedPostcodes.map(pc => (
            <span
              key={pc}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
            >
              {pc}
              <button onClick={() => handleRemovePostcode(pc)} className="ml-1 text-green-700 hover:text-green-900">×</button>
            </span>
          ))}
          {selectedRegions.length > 5 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              +{selectedRegions.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {comparedPostcodes.length > 0 ? 'Postcode / Region' : 'Region'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {getTimeframeLabel()} Growth
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                YoY Growth
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MoM Growth
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trend
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Level
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <span>Investment Score</span>
                  <div className="group relative">
                    <Info className="w-3 h-3 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      <div className="font-medium mb-1">Investment Score Calculation</div>
                      <div className="space-y-1">
                        <div>• <strong>Base Score:</strong> 50 points</div>
                        <div>• <strong>Growth Bonus:</strong> +3 points per % growth</div>
                        <div>• <strong>Volatility Penalty:</strong> -5 points per % volatility</div>
                        <div>• <strong>Range:</strong> 0-100 (higher = better)</div>
                      </div>
                      <div className="mt-2 text-gray-300">
                        Formula: 50 + (Growth% × 3) - (Volatility% × 5)
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* NEW: Show compared postcodes first - filter out entries with no data */}
            {comparedPostcodeData
              .filter((item: any) => {
                // Remove entries with no data or invalid HPI values
                const hasValidData = item.currentIndex && item.currentIndex > 0 && 
                  (item.timeframeGrowth !== null && item.timeframeGrowth !== undefined) &&
                  (item.yoyGrowth !== null && item.yoyGrowth !== undefined) &&
                  (item.momGrowth !== null && item.momGrowth !== undefined);
                
                if (!hasValidData) {
                  console.log('Filtering out postcode with no data:', item.postcode);
                }
                return hasValidData;
              })
              .map((item: any, index: number) => (
              <motion.tr
                key={item.postcode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50"
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-green-600">
                        {index + 1}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {item.postcode} {item.region && item.region !== 'Unknown Region' ? <span className="text-xs text-gray-500">({formatRegionName(item.region)})</span> : null}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.currentIndex > 0 ? `Index: ${item.currentIndex}` : 'Data not available'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    {item.timeframeGrowth === null || item.timeframeGrowth === undefined ? (
                      <span className="text-sm text-gray-500">N/A</span>
                    ) : (
                      <>
                        {getGrowthIcon(item.timeframeGrowth)}
                        <span className={`text-sm font-medium ${getGrowthColor(item.timeframeGrowth)}`}>
                          {item.timeframeGrowth > 0 ? '+' : ''}{item.timeframeGrowth.toFixed(2)}%
                        </span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {item.yoyGrowth === null || item.yoyGrowth === undefined ? (
                    <span className="text-sm text-gray-500">N/A</span>
                  ) : (
                    <span className={`text-sm ${getGrowthColor(item.yoyGrowth)}`}>
                      {item.yoyGrowth > 0 ? '+' : ''}{item.yoyGrowth.toFixed(2)}%
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {item.momGrowth === null || item.momGrowth === undefined ? (
                    <span className="text-sm text-gray-500">N/A</span>
                  ) : (
                    <span className={`text-sm ${getGrowthColor(item.momGrowth)}`}>
                      {item.momGrowth > 0 ? '+' : ''}{item.momGrowth.toFixed(2)}%
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {item.trend === null || item.trend === undefined ? (
                    <span className="text-sm text-gray-500">N/A</span>
                  ) : (
                    <span className={`text-sm font-medium ${getTrendColor(item.trend)}`}>
                      {item.trend.charAt(0).toUpperCase() + item.trend.slice(1)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {item.riskLevel === null || item.riskLevel === undefined ? (
                    <span className="text-sm text-gray-500">N/A</span>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(item.riskLevel)}`}>
                      {item.riskLevel.charAt(0).toUpperCase() + item.riskLevel.slice(1)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {item.investmentScore === null || item.investmentScore === undefined ? (
                    <span className="text-sm text-gray-500">N/A</span>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.investmentScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{item.investmentScore}/100</span>
                    </div>
                  )}
                </td>
              </motion.tr>
            ))}
            {filteredData.map((item, index) => (
              <motion.tr
                key={item.region}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + comparedPostcodeData.length) * 0.05 }}
                className="hover:bg-gray-50"
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {index + comparedPostcodeData.length + 1}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {formatRegionName(item.region)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Index: {item.currentIndex}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    {getGrowthIcon(item.timeframeGrowth)}
                    <span className={`text-sm font-medium ${getGrowthColor(item.timeframeGrowth)}`}>
                      {item.timeframeGrowth > 0 ? '+' : ''}{item.timeframeGrowth.toFixed(2)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`text-sm ${getGrowthColor(item.yoyGrowth)}`}>
                    {item.yoyGrowth > 0 ? '+' : ''}{item.yoyGrowth.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`text-sm ${getGrowthColor(item.momGrowth)}`}>
                    {item.momGrowth > 0 ? '+' : ''}{item.momGrowth.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${getTrendColor(item.trend)}`}>
                    {item.trend.charAt(0).toUpperCase() + item.trend.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(item.riskLevel)}`}>
                    {item.riskLevel.charAt(0).toUpperCase() + item.riskLevel.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.investmentScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">{item.investmentScore}/100</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No Data State */}
      {filteredData.length === 0 && (
        <div className="text-center py-8">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No regions selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select regions above to view their performance data.
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Last updated: {filteredData[0]?.lastUpdated || 'N/A'}</span>
            <span>Data points: {filteredData[0]?.dataPoints || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4" />
            <span>Growth rates based on HPI data</span>
          </div>
        </div>
        
        {/* Investment Score Explanation */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <div className="font-medium mb-1">Understanding Investment Scores</div>
              <div className="space-y-1">
                <div><strong>80-100:</strong> Excellent investment potential - high growth, low volatility</div>
                <div><strong>60-79:</strong> Good investment potential - solid growth with manageable risk</div>
                <div><strong>40-59:</strong> Fair investment potential - moderate growth or higher volatility</div>
                <div><strong>20-39:</strong> Poor investment potential - low growth or high volatility</div>
                <div><strong>0-19:</strong> High risk - negative growth or extreme volatility</div>
              </div>
              <div className="mt-2 text-blue-700">
                Scores consider both growth potential and market stability. Higher scores indicate better risk-adjusted returns.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
