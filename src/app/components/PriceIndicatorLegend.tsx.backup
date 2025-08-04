'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, TrendingUp, TrendingDown, Minus, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getPriceIndicatorLegend } from '../../utils/priceIndicator';

interface PriceIndicatorLegendProps {
  className?: string;
  variant?: 'compact' | 'full';
}

const PriceIndicatorLegend: React.FC<PriceIndicatorLegendProps> = ({ 
  className, 
  variant = 'full' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const legendData = getPriceIndicatorLegend();

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Info className="w-4 h-4 text-blue-600" />
        <span className="text-sm text-text-secondary">Price Indicators:</span>
        
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#5DA271] rounded-full"></div>
            <span className="text-xs text-text-secondary">Excellent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded-full"></div>
            <span className="text-xs text-text-secondary">Good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded-full"></div>
            <span className="text-xs text-text-secondary">Fair</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded-full"></div>
            <span className="text-xs text-text-secondary">Expensive</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded-full"></div>
            <span className="text-xs text-text-secondary">Overpriced</span>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-text-tertiary hover:text-text-secondary transition-colors"
          title="Learn more about price indicators"
        >
          <Info className="w-3 h-3" />
        </button>

        {isExpanded && (
          <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50">
            <div className="text-sm text-text-primary mb-3">
              <strong>Price Indicators</strong> compare each property to the local 24-month average sale price for similar properties.
            </div>
            <div className="space-y-2 text-xs">
              {legendData.map((indicator, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className={`font-medium ${indicator.textColor}`}>
                    {indicator.label}:
                  </span>
                  <span className="text-text-secondary">{indicator.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full variant with accordion
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-soft overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">How to Read Price Indicators</h3>
              <p className="text-sm text-blue-700">
                Each property is compared to the local median sale price for similar properties, adjusted for inflation
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
            aria-label={isExpanded ? "Collapse explanation" : "Expand explanation"}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Collapsed View - Always visible */}
      <div className="px-6 py-4">
        <div className="flex flex-wrap gap-3 items-center justify-center">
          {legendData.map((indicator, index) => (
            <span 
              key={index}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                indicator.bgColor === 'bg-[#5DA271]' 
                  ? 'bg-[#5DA271] text-white border-[#5DA271]' 
                  : `${indicator.bgColor} ${indicator.textColor} border-gray-200`
              }`}
            >
              {indicator.label === 'Excellent Deal' && <Lightbulb className="w-4 h-4" />}
              {indicator.label === 'Good Deal' && <TrendingDown className="w-4 h-4" />}
              {indicator.label === 'Fair Price' && <CheckCircle className="w-4 h-4" />}
              {indicator.label === 'Expensive' && <AlertTriangle className="w-4 h-4" />}
              {indicator.label === 'Overpriced' && <TrendingUp className="w-4 h-4" />}
              {indicator.label}
            </span>
          ))}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="px-6 py-6 space-y-6">
            
            {/* How It Works Section */}
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-3">How Price Indicators Work</h4>
              <div className="bg-white rounded-lg p-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <strong>Data Collection:</strong> We gather all property sales in the local area from the last 24 months using UK Land Registry data.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">2</span>
                  </div>
                  <div>
                    <strong>Market Analysis:</strong> We calculate the average sale price for similar properties (same type, similar size) in the area.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">3</span>
                  </div>
                  <div>
                    <strong>Comparison:</strong> Each property's price is compared to this local average to determine if it's underpriced or overpriced.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">4</span>
                  </div>
                  <div>
                    <strong>Classification:</strong> Properties are categorized based on their percentage difference from the market average.
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Categories */}
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-3">Price Indicator Categories</h4>
              <div className="grid gap-3">
                {legendData.map((indicator, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <span 
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          indicator.bgColor === 'bg-[#5DA271]' 
                            ? 'bg-[#5DA271] text-white' 
                            : `${indicator.bgColor} ${indicator.textColor}`
                        }`}
                      >
                        {indicator.label === 'Excellent Deal' && <Lightbulb className="w-4 h-4" />}
                        {indicator.label === 'Good Deal' && <TrendingDown className="w-4 h-4" />}
                        {indicator.label === 'Fair Price' && <CheckCircle className="w-4 h-4" />}
                        {indicator.label === 'Expensive' && <AlertTriangle className="w-4 h-4" />}
                        {indicator.label === 'Overpriced' && <TrendingUp className="w-4 h-4" />}
                        {indicator.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{indicator.description}</p>
                    <div className="text-xs text-gray-500">
                      {indicator.label === 'Excellent Deal' && 
                        "These properties represent exceptional value and are often the best investment opportunities. They may need renovation or have been on the market for an extended period."
                      }
                      {indicator.label === 'Good Deal' && 
                        "These properties offer good value compared to the market. They may have minor issues or be in less desirable locations but still represent solid investments."
                      }
                      {indicator.label === 'Fair Price' && 
                        "These properties are priced appropriately for the current market conditions. They represent standard market value with no significant premium or discount."
                      }
                      {indicator.label === 'Expensive' && 
                        "These properties are priced above market value. They may have premium features, be in highly desirable locations, or be overpriced due to market conditions."
                      }
                      {indicator.label === 'Overpriced' && 
                        "These properties are significantly overpriced compared to similar properties in the area. They may be difficult to sell or represent poor investment value."
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Investment Insights */}
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-3">Investment Insights</h4>
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <TrendingDown className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-green-700">Look for "Excellent" and "Good" deals:</strong> These properties often represent the best investment opportunities with potential for capital appreciation.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-blue-700">"Fair Price" properties:</strong> These can still be good investments if the area has strong growth potential or rental demand.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-orange-700">Be cautious with "Expensive" properties:</strong> Consider whether premium features justify the higher price or if you're overpaying.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-red-700">Avoid "Overpriced" properties:</strong> These typically represent poor investment value and may be difficult to sell or rent profitably.
                  </div>
                </div>
              </div>
            </div>

            {/* Data Source */}
            <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
              Data source: UK Land Registry sales, 1995–present • Analysis based on 24-month rolling average
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceIndicatorLegend; 