'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, MapPin, Calendar, Target, Award, AlertTriangle, Info, Building, PoundSterling, Users, Home, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import RegionalTrendsChart from '../components/RegionalTrendsChart';
import MarketInsightsCard from '../components/MarketInsightsCard';
import TopPerformingRegions from '../components/TopPerformingRegions';
import MarketVolatilityMap from '../components/MarketVolatilityMap';
import InvestmentOpportunities from '../components/InvestmentOpportunities';
import MarketComparisonTable from '../components/MarketComparisonTable';
import MarketSearchBar from '../components/MarketSearchBar';

interface MarketData {
  region: string;
  currentIndex: number;
  yoyGrowth: number;
  momGrowth: number;
  volatility: number;
  trend: 'rising' | 'falling' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  investmentScore: number;
  lastUpdated: string;
  dataPoints: number; // Added for historical data points
  timeframeGrowth: number; // Added for timeframe-specific growth
  propertyCount: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
    median: number;
  };
}

interface MarketSummary {
  totalRegions: number;
  averageGrowth: number;
  bestPerformingRegion: string;
  worstPerformingRegion: string;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  overallRisk: 'low' | 'medium' | 'high';
}

export default function MarketAnalysisPage() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [filteredData, setFilteredData] = useState<MarketData[]>([]);
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'1y' | '2y' | '5y'>('1y');
  const [viewMode, setViewMode] = useState<'overview' | 'trends' | 'opportunities' | 'comparison'>('overview');
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>('');
  const [autoSelectedRegions, setAutoSelectedRegions] = useState<string[]>([]);

  useEffect(() => {
    // Load market data with current search term when timeframe changes
    loadMarketData(currentSearchTerm);
  }, [timeframe, currentSearchTerm]);

  useEffect(() => {
    // Initialize filtered data with all market data
    setFilteredData(marketData);
  }, [marketData]);

  const loadMarketData = async (searchTerm?: string) => {
    try {
      setLoading(true);
      
      // Use the new enhanced market analysis API
      const url = searchTerm 
        ? `/api/market-analysis/enhanced?timeframe=${timeframe}&search=${encodeURIComponent(searchTerm)}`
        : `/api/market-analysis/enhanced?timeframe=${timeframe}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Market Analysis API Response:', data); // Debug logging
      
      if (data.success && data.data) {
        setMarketData(data.data);
        setFilteredData(data.data);
        setSummary(calculateSummary(data.data));
      }
    } catch (error) {
      console.error('Error loading market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (searchTerm: string, newFilteredData: MarketData[]) => {
    setCurrentSearchTerm(searchTerm);
    setFilteredData(newFilteredData);
    
    // Clear auto-selected regions if search is empty
    if (!searchTerm.trim()) {
      setAutoSelectedRegions([]);
    }
    // Auto-select regions if search term looks like a postcode and returns results
    else if (newFilteredData.length > 0) {
      const isPostcode = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(searchTerm.trim());
      if (isPostcode) {
        const regionsToSelect = newFilteredData.map(item => item.region);
        setAutoSelectedRegions(regionsToSelect);
      }
    }
    
    if (newFilteredData.length > 0) {
      setSummary(calculateSummary(newFilteredData));
    }
  };

  const calculateVolatility = (region: any) => {
    // Simplified volatility calculation based on YoY growth
    const growth = region.yoyGrowth || 0;
    // Use a simplified volatility calculation since we don't have monthly data
    return Math.abs(growth) * 0.1; // 10% of the growth rate as volatility
  };

  const determineTrend = (yoyGrowth: number, momGrowth: number): 'rising' | 'falling' | 'stable' => {
    if (yoyGrowth > 5 && momGrowth > 0.5) return 'rising';
    if (yoyGrowth < -2 || momGrowth < -0.5) return 'falling';
    return 'stable';
  };

  const determineRiskLevel = (yoyGrowth: number, momGrowth: number): 'low' | 'medium' | 'high' => {
    const volatility = Math.abs(yoyGrowth - (momGrowth * 12)) / 12;
    if (volatility < 2) return 'low';
    if (volatility < 5) return 'medium';
    return 'high';
  };

  const calculateInvestmentScore = (region: any) => {
    const yoyGrowth = region.yoyGrowth || 0;
    const volatility = calculateVolatility(region);
    
    // Score based on growth and stability
    let score = 50; // Base score
    
    // Growth factor (60% weight)
    score += (yoyGrowth * 3);
    
    // Stability factor (40% weight)
    score -= (volatility * 5);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const calculateSummary = (data: MarketData[]): MarketSummary => {
    const totalRegions = data.length;
    const averageGrowth = data.reduce((sum, region) => sum + region.timeframeGrowth, 0) / totalRegions;
    
    const sortedByGrowth = [...data].sort((a, b) => b.timeframeGrowth - a.timeframeGrowth);
    const bestPerformingRegion = sortedByGrowth[0]?.region || 'N/A';
    const worstPerformingRegion = sortedByGrowth[sortedByGrowth.length - 1]?.region || 'N/A';
    
    // Improved market sentiment logic based on average growth
    let marketSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (averageGrowth > 2) marketSentiment = 'bullish';
    else if (averageGrowth < -1) marketSentiment = 'bearish';
    
    // Improved risk calculation that considers negative growth as higher risk
    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    const absGrowth = Math.abs(averageGrowth);
    
    if (averageGrowth < 0) {
      // Negative growth indicates higher risk
      if (absGrowth > 5) overallRisk = 'high';
      else if (absGrowth > 2) overallRisk = 'medium';
      else overallRisk = 'low';
    } else {
      // Positive growth - risk based on volatility
      if (absGrowth > 10) overallRisk = 'high';
      else if (absGrowth > 5) overallRisk = 'medium';
      else overallRisk = 'low';
    }
    
    return {
      totalRegions,
      averageGrowth: Math.round(averageGrowth * 100) / 100,
      bestPerformingRegion,
      worstPerformingRegion,
      marketSentiment,
      overallRisk
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Market Analysis Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive regional property market insights powered by HPI data
          </p>
        </motion.div>

        {/* Market Summary Cards */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Regions</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalRegions}</p>
                </div>
                <Building className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
              summary.averageGrowth > 0 ? 'border-green-500' : 
              summary.averageGrowth < 0 ? 'border-red-500' : 'border-yellow-500'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Growth</p>
                  <p className={`text-2xl font-bold ${
                    summary.averageGrowth > 0 ? 'text-green-600' : 
                    summary.averageGrowth < 0 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {summary.averageGrowth > 0 ? '+' : ''}{summary.averageGrowth}%
                  </p>
                </div>
                {summary.averageGrowth > 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-500" />
                ) : summary.averageGrowth < 0 ? (
                  <TrendingDown className="w-8 h-8 text-red-500" />
                ) : (
                  <Target className="w-8 h-8 text-yellow-500" />
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Market Sentiment</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{summary.marketSentiment}</p>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Risk</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{summary.overallRisk}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <div className="flex-1 max-w-md">
                <MarketSearchBar 
                  onSearchChange={handleSearchChange}
                  placeholder="Search regions, cities, or postcodes..."
                  initialValue={currentSearchTerm}
                  timeframe={timeframe}
                />
              </div>

              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as '1y' | '2y' | '5y')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1y">1 Year</option>
                <option value="2y">2 Years</option>
                <option value="5y">5 Years</option>
              </select>
            </div>

            <div className="flex gap-2">
              {(['overview', 'trends', 'opportunities', 'comparison'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content based on view mode */}
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <RegionalTrendsChart 
                data={filteredData} 
                timeframe={timeframe}
                autoSelectRegions={autoSelectedRegions}
              />
              <MarketInsightsCard data={filteredData} summary={summary} />
            </div>
          )}

          {viewMode === 'trends' && (
            <div className="space-y-8">
              <RegionalTrendsChart data={filteredData} timeframe={timeframe} />
              <MarketVolatilityMap data={filteredData} />
            </div>
          )}

          {viewMode === 'opportunities' && (
            <div className="space-y-8">
              <TopPerformingRegions data={filteredData} />
              <InvestmentOpportunities data={filteredData} />
            </div>
          )}

          {viewMode === 'comparison' && (
            <MarketComparisonTable data={filteredData} />
          )}
        </motion.div>
      </div>
    </div>
  );
} 