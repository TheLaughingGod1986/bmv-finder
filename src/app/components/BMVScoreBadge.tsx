'use client';

import React, { useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, TrendingUp, Target } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BMVScoreBadgeProps {
  score: number;
  className?: string;
  showTooltip?: boolean;
}

const BMVScoreBadge: React.FC<BMVScoreBadgeProps> = ({ 
  score, 
  className = '',
  showTooltip = true 
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [openLeft, setOpenLeft] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isTooltipVisible && badgeRef.current && tooltipRef.current) {
      const badgeRect = badgeRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - badgeRect.left;
      if (badgeRect.left + tooltipRect.width > window.innerWidth) {
        setOpenLeft(true);
      } else {
        setOpenLeft(false);
      }
    }
  }, [isTooltipVisible]);
  
  // Get BMV category based on score
  const getBMVCategory = (score: number) => {
    if (score >= 80) {
      return {
        category: 'Excellent',
        color: 'bg-green-500 text-white',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        description: 'Exceptional investment opportunity with high potential returns.'
      };
    } else if (score >= 65) {
      return {
        category: 'Good',
        color: 'bg-blue-500 text-white',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        description: 'Good investment opportunity with solid potential.'
      };
    } else if (score >= 50) {
      return {
        category: 'Fair',
        color: 'bg-yellow-500 text-white',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        description: 'Fair investment opportunity, consider carefully.'
      };
    } else if (score >= 35) {
      return {
        category: 'Overpriced',
        color: 'bg-orange-500 text-white',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        description: 'Property may be overpriced for investment purposes.'
      };
    } else {
      return {
        category: 'Poor',
        color: 'bg-red-500 text-white',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        description: 'Poor investment opportunity, not recommended.'
      };
    }
  };

  const category = getBMVCategory(score);

  const TooltipContent = () => (
    <motion.div
      ref={tooltipRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className={
        'absolute bottom-full mb-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-[9999] ' +
        (openLeft
          ? 'right-0 left-auto transform-none'
          : 'left-1/2 transform -translate-x-1/2')
      }
      style={{ maxWidth: '90vw' }}
    >
      {/* Arrow */}
      <div className={
        'absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white ' +
        (openLeft
          ? 'right-4 left-auto -translate-x-0'
          : 'left-1/2 transform -translate-x-1/2')
      }></div>
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-5 w-5 text-primary-600" />
        <h3 className="font-semibold text-text-primary">BMV Analysis</h3>
      </div>

      {/* Score Display */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <div className="text-sm text-text-secondary">BMV Score</div>
          <div className="text-2xl font-bold text-text-primary">{score}/100</div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold",
          category.color
        )}>
          {category.category}
        </div>
      </div>

      {/* Description */}
      <div className="text-sm text-text-secondary leading-relaxed">
        {category.description}
      </div>

      {/* Score Breakdown */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-text-tertiary mb-2">Score Breakdown:</div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">80-100:</span>
            <span className="text-green-600 font-medium">Excellent</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">65-79:</span>
            <span className="text-blue-600 font-medium">Good</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">50-64:</span>
            <span className="text-yellow-600 font-medium">Fair</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">35-49:</span>
            <span className="text-orange-600 font-medium">Overpriced</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">0-34:</span>
            <span className="text-red-600 font-medium">Poor</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div ref={badgeRef} className={cn("relative inline-block", className)}>
      <div
        onMouseEnter={() => showTooltip && setIsTooltipVisible(true)}
        onMouseLeave={() => showTooltip && setIsTooltipVisible(false)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200",
          category.bgColor,
          category.textColor
        )}
      >
        <TrendingUp className="h-3 w-3" />
        <span>{score}</span>
        {showTooltip && <Info className="h-3 w-3 opacity-60" />}
      </div>

      <AnimatePresence>
        {isTooltipVisible && showTooltip && <TooltipContent />}
      </AnimatePresence>
    </div>
  );
};

export default BMVScoreBadge; 