'use client';

import { useState } from 'react';
import { TrendingUp, Target, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BMVLegendProps {
  className?: string;
  variant?: 'compact' | 'full';
}

const BMVLegend: React.FC<BMVLegendProps> = ({ className, variant = 'compact' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Target className="w-4 h-4 text-primary-600" />
        <span className="text-sm text-text-secondary">BMV Score:</span>
        
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-text-secondary">80-100</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-text-secondary">65-79</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-text-secondary">50-64</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-xs text-text-secondary">35-49</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-text-secondary">0-34</span>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-text-tertiary hover:text-text-secondary transition-colors"
          title="Learn more about BMV scores"
        >
          <Info className="w-3 h-3" />
        </button>

        {isExpanded && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-tooltip">
            <div className="text-sm text-text-primary mb-3">
              <strong>BMV Score</strong> indicates investment potential based on market analysis, growth trends, and rental yields.
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-green-600 font-medium">80-100:</span>
                <span className="text-text-secondary">Excellent</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600 font-medium">65-79:</span>
                <span className="text-text-secondary">Good</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600 font-medium">50-64:</span>
                <span className="text-text-secondary">Fair</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-600 font-medium">35-49:</span>
                <span className="text-text-secondary">Overpriced</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600 font-medium">0-34:</span>
                <span className="text-text-secondary">Poor</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-soft p-6", className)}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-text-primary">BMV Score Guide</h3>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-text-tertiary hover:text-text-secondary transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          <p className="text-sm text-text-secondary mb-4">
            Our Below Market Value (BMV) score identifies properties that may be undervalued compared to similar homes in the area.
          </p>

          {isExpanded && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Score Categories</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-text-secondary">80-100: Excellent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-text-secondary">65-79: Good</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-text-secondary">50-64: Fair</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-text-secondary">35-49: Overpriced</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-text-secondary">0-34: Poor</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-text-primary mb-2">What We Analyze</h4>
                  <ul className="space-y-1 text-sm text-text-secondary">
                    <li>• Local market price trends</li>
                    <li>• Rental yield potential</li>
                    <li>• Property type demand</li>
                    <li>• Area growth patterns</li>
                    <li>• Comparable sales data</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BMVLegend; 