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
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<'1y' | '2y' | '5y'>('1y');
  const [viewMode, setViewMode] = useState<'overview' | 'trends' | 'opportunities' | 'comparison'>('overview');

  useEffect(() => {
    loadMarketData();
  }, [timeframe]);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      
      // Fetch latest HPI data for all regions
      const response = await fetch('/api/hpi');
      const data = await response.json();
      
      if (data.success && data.data) {
        const processedData = data.data.map((region: any) => ({
          region: region.regionLabel || region.region,
          currentIndex: region.index,
          yoyGrowth: region.yoyGrowth || 0,
          momGrowth: region.percentageChangeMonthly || 0,
          volatility: calculateVolatility(region),
          trend: determineTrend(region.yoyGrowth, region.percentageChangeMonthly),
          riskLevel: determineRiskLevel(region.yoyGrowth, region.percentageChangeMonthly),
          investmentScore: calculateInvestmentScore(region),
          lastUpdated: region.date
        }));

        setMarketData(processedData);
        setSummary(calculateSummary(processedData));
      }
    } catch (error) {
      console.error('Error loading market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateVolatility = (region: any) => {
    // Simplified volatility calculation
    const growth = region.yoyGrowth || 0;
    const monthlyChange = region.percentageChangeMonthly || 0;
    return Math.abs(growth - monthlyChange * 12) / 12;
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
    const monthlyChange = region.percentageChangeMonthly || 0;
    const volatility = calculateVolatility(region);
    
    // Score based on growth, stability, and momentum
    let score = 50; // Base score
    
    // Growth factor (40% weight)
    score += (yoyGrowth * 2);
    
    // Momentum factor (30% weight)
    score += (monthlyChange * 10);
    
    // Stability factor (30% weight)
    score -= (volatility * 5);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const calculateSummary = (data: MarketData[]): MarketSummary => {
    const totalRegions = data.length;
    const averageGrowth = data.reduce((sum, region) => sum + region.yoyGrowth, 0) / totalRegions;
    
    const sortedByGrowth = [...data].sort((a, b) => b.yoyGrowth - a.yoyGrowth);
    const bestPerformingRegion = sortedByGrowth[0]?.region || 'N/A';
    const worstPerformingRegion = sortedByGrowth[sortedByGrowth.length - 1]?.region || 'N/A';
    
    const bullishRegions = data.filter(r => r.trend === 'rising').length;
    const bearishRegions = data.filter(r => r.trend === 'falling').length;
    
    let marketSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (bullishRegions > bearishRegions * 1.5) marketSentiment = 'bullish';
    else if (bearishRegions > bullishRegions * 1.5) marketSentiment = 'bearish';
    
    const highRiskRegions = data.filter(r => r.riskLevel === 'high').length;
    const overallRisk = highRiskRegions > totalRegions * 0.3 ? 'high' : 
                       highRiskRegions > totalRegions * 0.1 ? 'medium' : 'low';
    
    return {
      totalRegions,
      averageGrowth: Math.round(averageGrowth * 100) / 100,
      bestPerformingRegion,
      worstPerformingRegion,
      marketSentiment,
      overallRisk
    };
  };

  const filteredData = selectedRegion === 'all' 
    ? marketData 
    : marketData.filter(region => region.region === selectedRegion);

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

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Growth</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.averageGrowth > 0 ? '+' : ''}{summary.averageGrowth}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
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
            <div className="flex gap-4">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Regions</option>
                {marketData.map(region => (
                  <option key={region.region} value={region.region}>
                    {region.region}
                  </option>
                ))}
              </select>

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
              <RegionalTrendsChart data={filteredData} timeframe={timeframe} />
              <MarketInsightsCard data={filteredData} summary={summary} />
            </div>
          )}

          {viewMode === 'trends' && (
            <div className="space-y-8">
              <RegionalTrendsChart data={filteredData} timeframe={timeframe} />
              <MarketVolatilityMap data={marketData} />
            </div>
          )}

          {viewMode === 'opportunities' && (
            <div className="space-y-8">
              <TopPerformingRegions data={marketData} />
              <InvestmentOpportunities data={marketData} />
            </div>
          )}

          {viewMode === 'comparison' && (
            <MarketComparisonTable data={marketData} />
          )}
        </motion.div>
      </div>
    </div>
  );
} 