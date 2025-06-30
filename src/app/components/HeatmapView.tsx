'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, TrendingUp, BarChart3, Target, Filter } from 'lucide-react';
import { BMVScoreEngine } from '../../lib/bmvScoreEngine';
import { SoldPrice } from '../../../types/sold-price';
import { cn } from '../../lib/utils';

interface HeatmapViewProps {
  properties: SoldPrice[];
  onPostcodeClick?: (postcode: string) => void;
  className?: string;
}

type HeatmapMode = 'yield' | 'growth' | 'bmv' | 'transactions';

const HeatmapView: React.FC<HeatmapViewProps> = ({ 
  properties, 
  onPostcodeClick,
  className = '' 
}) => {
  const [mode, setMode] = useState<HeatmapMode>('yield');
  const [selectedPostcode, setSelectedPostcode] = useState<string | null>(null);

  const heatmapData = useMemo(() => {
    return BMVScoreEngine.calculateHeatmapData(properties);
  }, [properties]);

  const getColorForValue = (value: number, mode: HeatmapMode) => {
    switch (mode) {
      case 'yield':
        // Green scale for yield (higher = better)
        if (value >= 8) return 'bg-green-600';
        if (value >= 6) return 'bg-green-500';
        if (value >= 4) return 'bg-green-400';
        if (value >= 2) return 'bg-green-300';
        return 'bg-green-200';
      
      case 'growth':
        // Blue to red scale for growth
        if (value >= 10) return 'bg-blue-600';
        if (value >= 5) return 'bg-blue-400';
        if (value >= 0) return 'bg-blue-200';
        if (value >= -5) return 'bg-yellow-400';
        if (value >= -10) return 'bg-orange-400';
        return 'bg-red-500';
      
      case 'bmv':
        // Purple scale for BMV score
        if (value >= 80) return 'bg-purple-600';
        if (value >= 65) return 'bg-purple-500';
        if (value >= 50) return 'bg-purple-400';
        if (value >= 35) return 'bg-purple-300';
        return 'bg-purple-200';
      
      case 'transactions':
        // Orange scale for transaction volume
        if (value >= 20) return 'bg-orange-600';
        if (value >= 10) return 'bg-orange-500';
        if (value >= 5) return 'bg-orange-400';
        if (value >= 2) return 'bg-orange-300';
        return 'bg-orange-200';
      
      default:
        return 'bg-gray-400';
    }
  };

  const getValueForMode = (data: { rentalYield: number; growth: number; bmvScore: number; transactionCount: number }, mode: HeatmapMode) => {
    switch (mode) {
      case 'yield': return data.rentalYield;
      case 'growth': return data.growth;
      case 'bmv': return data.bmvScore;
      case 'transactions': return data.transactionCount;
      default: return 0;
    }
  };

  const formatValue = (value: number, mode: HeatmapMode) => {
    switch (mode) {
      case 'yield': return `${value.toFixed(1)}%`;
      case 'growth': return `${value.toFixed(1)}%`;
      case 'bmv': return `${value}/100`;
      case 'transactions': return value.toString();
      default: return value.toString();
    }
  };

  const getModeIcon = (mode: HeatmapMode) => {
    switch (mode) {
      case 'yield': return <TrendingUp className="h-4 w-4" />;
      case 'growth': return <BarChart3 className="h-4 w-4" />;
      case 'bmv': return <Target className="h-4 w-4" />;
      case 'transactions': return <MapPin className="h-4 w-4" />;
    }
  };

  const getModeLabel = (mode: HeatmapMode) => {
    switch (mode) {
      case 'yield': return 'Rental Yield';
      case 'growth': return 'Price Growth';
      case 'bmv': return 'BMV Score';
      case 'transactions': return 'Transactions';
    }
  };

  const handlePostcodeClick = (postcode: string) => {
    setSelectedPostcode(selectedPostcode === postcode ? null : postcode);
    onPostcodeClick?.(postcode);
  };

  const sortedData = useMemo(() => {
    return [...heatmapData].sort((a, b) => {
      const aValue = getValueForMode(a, mode);
      const bValue = getValueForMode(b, mode);
      return bValue - aValue; // Sort by value descending
    });
  }, [heatmapData, mode]);

  return (
    <div className={cn("bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Area Heatmap</h2>
            <p className="text-sm text-gray-600">Postcode-based investment metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">View:</span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2">
          {(['yield', 'growth', 'bmv', 'transactions'] as HeatmapMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                mode === m
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"
              )}
            >
              {getModeIcon(m)}
              {getModeLabel(m)}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="wait">
            {sortedData.map((data, index) => {
              const value = getValueForMode(data, mode);
              const color = getColorForValue(value, mode);
              const isSelected = selectedPostcode === data.postcode;

              return (
                <motion.div
                  key={data.postcode}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handlePostcodeClick(data.postcode)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105",
                    color,
                    isSelected 
                      ? "border-blue-500 shadow-lg" 
                      : "border-transparent hover:border-gray-300"
                  )}
                >
                  {/* Postcode */}
                  <div className="text-white font-bold text-lg mb-2">
                    {data.postcode}
                  </div>

                  {/* Value */}
                  <div className="text-white text-2xl font-bold mb-2">
                    {formatValue(value, mode)}
                  </div>

                  {/* Additional Info */}
                  <div className="text-white/90 text-sm space-y-1">
                    <div>Yield: {data.rentalYield.toFixed(1)}%</div>
                    <div>Growth: {data.growth.toFixed(1)}%</div>
                    <div>BMV: {data.bmvScore}/100</div>
                    <div>Sales: {data.transactionCount}</div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend - {getModeLabel(mode)}</h3>
          <div className="flex items-center gap-4 text-xs">
            {mode === 'yield' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span>8%+ (Excellent)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span>4-6% (Good)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 rounded"></div>
                  <span>&lt;2% (Poor)</span>
                </div>
              </>
            )}
            {mode === 'growth' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span>10%+ (Strong)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-200 rounded"></div>
                  <span>0-5% (Stable)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>&lt;-10% (Declining)</span>
                </div>
              </>
            )}
            {mode === 'bmv' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-600 rounded"></div>
                  <span>80+ (Excellent)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-400 rounded"></div>
                  <span>50-65 (Fair)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-200 rounded"></div>
                  <span>&lt;35 (Poor)</span>
                </div>
              </>
            )}
            {mode === 'transactions' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-600 rounded"></div>
                  <span>20+ (High)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-400 rounded"></div>
                  <span>5-10 (Medium)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-200 rounded"></div>
                  <span>&lt;2 (Low)</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {heatmapData.length}
            </div>
            <div className="text-sm text-blue-600">Postcodes</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(heatmapData.reduce((sum, d) => sum + d.rentalYield, 0) / heatmapData.length * 10) / 10}%
            </div>
            <div className="text-sm text-green-600">Avg Yield</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(heatmapData.reduce((sum, d) => sum + d.bmvScore, 0) / heatmapData.length)}
            </div>
            <div className="text-sm text-purple-600">Avg BMV</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {heatmapData.reduce((sum, d) => sum + d.transactionCount, 0)}
            </div>
            <div className="text-sm text-orange-600">Total Sales</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapView; 