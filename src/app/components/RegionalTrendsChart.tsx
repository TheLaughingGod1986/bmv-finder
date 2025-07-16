'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Calendar, MapPin, Info } from 'lucide-react';

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

interface RegionalTrendsChartProps {
  data: MarketData[];
  timeframe: '1y' | '2y' | '5y';
}

export default function RegionalTrendsChart({ data, timeframe }: RegionalTrendsChartProps) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [chartType, setChartType] = useState<'growth' | 'index' | 'volatility'>('growth');

  useEffect(() => {
    // Auto-select top 3 performing regions
    const topRegions = [...data]
      .sort((a, b) => b.yoyGrowth - a.yoyGrowth)
      .slice(0, 3)
      .map(region => region.region);
    setSelectedRegions(topRegions);
  }, [data]);

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  const getChartData = () => {
    const filteredData = data.filter(region => selectedRegions.includes(region.region));
    
    switch (chartType) {
      case 'growth':
        return filteredData.map(region => ({
          region: region.region,
          value: region.yoyGrowth,
          color: region.yoyGrowth > 0 ? '#10B981' : '#EF4444',
          trend: region.trend
        }));
      case 'index':
        return filteredData.map(region => ({
          region: region.region,
          value: region.currentIndex,
          color: '#3B82F6',
          trend: region.trend
        }));
      case 'volatility':
        return filteredData.map(region => ({
          region: region.region,
          value: region.volatility,
          color: region.riskLevel === 'low' ? '#10B981' : region.riskLevel === 'medium' ? '#F59E0B' : '#EF4444',
          trend: region.trend
        }));
      default:
        return [];
    }
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Regional Trends</h3>
          <p className="text-sm text-gray-600">
            {timeframe} performance comparison across regions
          </p>
        </div>
        <div className="flex gap-2">
          {(['growth', 'index', 'volatility'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                chartType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Region Selector */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Select Regions:</p>
        <div className="flex flex-wrap gap-2">
          {data.map(region => (
            <button
              key={region.region}
              onClick={() => toggleRegion(region.region)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedRegions.includes(region.region)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {region.region}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {chartData.map((item, index) => (
          <motion.div
            key={item.region}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{item.region}</span>
                {item.trend === 'rising' && <TrendingUp className="w-4 h-4 text-green-500" />}
                {item.trend === 'falling' && <TrendingDown className="w-4 h-4 text-red-500" />}
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {chartType === 'growth' && `${item.value > 0 ? '+' : ''}${item.value.toFixed(1)}%`}
                {chartType === 'index' && item.value.toLocaleString()}
                {chartType === 'volatility' && `${item.value.toFixed(2)}%`}
              </span>
            </div>
            
            <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${((item.value - minValue) / (maxValue - minValue)) * 100}%` 
                }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="h-full rounded-lg"
                style={{ backgroundColor: item.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Positive Growth</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Negative Growth</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Index Value</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Market Insights</p>
            <p className="text-sm text-blue-700">
              {chartType === 'growth' && 'Year-over-year growth rates show regional performance trends. Higher percentages indicate stronger market growth.'}
              {chartType === 'index' && 'Current HPI index values represent relative price levels. Higher indices indicate more expensive markets.'}
              {chartType === 'volatility' && 'Volatility measures market stability. Lower values indicate more predictable price movements.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 