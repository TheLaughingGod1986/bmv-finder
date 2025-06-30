'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, TrendingUp, Home, Calculator, Target } from 'lucide-react';
import { BMVScoreEngine } from '../../lib/bmvScoreEngine';
import { SoldPrice } from '../../../types/sold-price';
import { cn } from '../../lib/utils';

interface BMVScoreBadgeProps {
  property: SoldPrice;
  allProperties: SoldPrice[];
  className?: string;
  showTooltip?: boolean;
}

const BMVScoreBadge: React.FC<BMVScoreBadgeProps> = ({ 
  property, 
  allProperties, 
  className = '',
  showTooltip = true 
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  
  // Calculate BMV score data
  const bmvData = BMVScoreEngine.calculateBMVScore(property, allProperties);
  const category = BMVScoreEngine.getBMVCategory(bmvData.bmvScore);

  const formatPrice = (price: number) => `£${price.toLocaleString()}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const TooltipContent = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50"
    >
      {/* Arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">BMV Analysis</h3>
      </div>

      {/* Score Display */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <div className="text-sm text-gray-600">BMV Score</div>
          <div className="text-2xl font-bold text-gray-900">{bmvData.bmvScore}/100</div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold text-white",
          category.color
        )}>
          {category.category}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Home className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Market Value</span>
          </div>
          <div className="font-semibold text-gray-900">{formatPrice(bmvData.marketValue)}</div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calculator className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Asking Price</span>
          </div>
          <div className="font-semibold text-gray-900">{formatPrice(bmvData.askingPrice)}</div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Rental Yield</span>
          </div>
          <div className="font-semibold text-gray-900">{formatPercentage(bmvData.rentalYield)}</div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Area Growth</span>
          </div>
          <div className={cn(
            "font-semibold",
            bmvData.areaGrowth > 0 ? "text-green-600" : "text-red-600"
          )}>
            {formatPercentage(bmvData.areaGrowth)}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="text-sm text-gray-600 leading-relaxed">
        {category.description}
      </div>

      {/* Postcode Metrics */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 mb-2">Postcode Averages:</div>
        <div className="flex justify-between text-xs">
          <span>Yield: {formatPercentage(bmvData.postcodeYield)}</span>
          <span>Growth: {formatPercentage(bmvData.postcodeGrowth)}</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        onClick={() => setIsTooltipVisible(!isTooltipVisible)}
        onMouseEnter={() => showTooltip && setIsTooltipVisible(true)}
        onMouseLeave={() => showTooltip && setIsTooltipVisible(false)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2",
          category.color,
          "focus:ring-blue-400"
        )}
        title="Click for detailed BMV analysis"
      >
        <Target className="h-4 w-4" />
        <span>BMV {bmvData.bmvScore}</span>
        {showTooltip && <Info className="h-3 w-3 opacity-75" />}
      </button>

      <AnimatePresence>
        {isTooltipVisible && showTooltip && <TooltipContent />}
      </AnimatePresence>
    </div>
  );
};

export default BMVScoreBadge; 