'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertTriangle, Shield, BarChart3, Info } from 'lucide-react';

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

interface MarketVolatilityMapProps {
  data: MarketData[];
}

export default function MarketVolatilityMap({ data }: MarketVolatilityMapProps) {
  const [selectedMetric, setSelectedMetric] = useState<'volatility' | 'risk' | 'growth'>('volatility');

  const getVolatilityColor = (volatility: number) => {
    if (volatility < 2) return 'bg-green-500';
    if (volatility < 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 5) return 'bg-green-500';
    if (growth > 0) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMetricValue = (region: MarketData) => {
    switch (selectedMetric) {
      case 'volatility': return region.volatility || 0;
      case 'risk': return region.riskLevel === 'low' ? 1 : region.riskLevel === 'medium' ? 2 : 3;
      case 'growth': return region.yoyGrowth || 0;
      default: return region.volatility || 0;
    }
  };

  const getMetricLabel = (region: MarketData) => {
    switch (selectedMetric) {
      case 'volatility': return `${(region.volatility || 0).toFixed(2)}%`;
      case 'risk': return region.riskLevel.toUpperCase();
      case 'growth': return `${(region.yoyGrowth || 0) > 0 ? '+' : ''}${(region.yoyGrowth || 0).toFixed(1)}%`;
      default: return `${(region.volatility || 0).toFixed(2)}%`;
    }
  };

  const getMetricColor = (region: MarketData) => {
    switch (selectedMetric) {
      case 'volatility': return getVolatilityColor(region.volatility);
      case 'risk': return getRiskColor(region.riskLevel);
      case 'growth': return getGrowthColor(region.yoyGrowth);
      default: return getVolatilityColor(region.volatility);
    }
  };

  const sortedData = [...data].sort((a, b) => getMetricValue(b) - getMetricValue(a));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-900">Market Volatility Map</h3>
        </div>
        <div className="flex gap-2">
          {(['volatility', 'risk', 'growth'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === metric
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Description */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              {selectedMetric === 'volatility' && 'Market Volatility'}
              {selectedMetric === 'risk' && 'Risk Assessment'}
              {selectedMetric === 'growth' && 'Growth Performance'}
            </p>
            <p className="text-sm text-gray-600">
              {selectedMetric === 'volatility' && 'Shows price stability across regions. Lower values indicate more predictable markets.'}
              {selectedMetric === 'risk' && 'Risk levels based on growth consistency and market stability.'}
              {selectedMetric === 'growth' && 'Year-over-year growth rates showing regional performance.'}
            </p>
          </div>
        </div>
      </div>

      {/* Volatility Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedData.map((region, index) => (
          <motion.div
            key={region.region}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative group"
          >
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${getMetricColor(region)}`}></div>
                  <h4 className="font-semibold text-gray-900">{region.region}</h4>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {getMetricLabel(region)}
                </span>
              </div>

              {/* Visual Indicator */}
              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(getMetricValue(region) / Math.max(...sortedData.map(r => getMetricValue(r)))) * 100}%` 
                  }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`h-full ${getMetricColor(region)}`}
                />
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-600">HPI Index</p>
                  <p className="font-semibold text-gray-900">{(region.currentIndex || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Investment Score</p>
                  <p className="font-semibold text-gray-900">{region.investmentScore}/100</p>
                </div>
              </div>

              {/* Trend Indicator */}
              <div className="mt-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Trend</span>
                  <div className="flex items-center gap-1">
                    {region.trend === 'rising' && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                    {region.trend === 'falling' && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                    {region.trend === 'stable' && <div className="w-2 h-2 bg-gray-500 rounded-full"></div>}
                    <span className="text-xs text-gray-600 capitalize">{region.trend}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h5 className="font-semibold text-gray-900 mb-3">Legend</h5>
        <div className="flex flex-wrap gap-4 text-sm">
          {selectedMetric === 'volatility' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Low Volatility (&lt;2%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Medium Volatility (2-5%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">High Volatility (&gt;5%)</span>
              </div>
            </>
          )}
          {selectedMetric === 'risk' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Low Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Medium Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">High Risk</span>
              </div>
            </>
          )}
          {selectedMetric === 'growth' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Strong Growth (&gt;5%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Moderate Growth (0-5%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Decline (&lt;0%)</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 