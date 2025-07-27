'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, TrendingUp, TrendingDown, Minus, Lightbulb, AlertTriangle, CheckCircle, BarChart3, Target, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getEnhancedPriceIndicatorLegend } from '../../utils/enhancedPriceIndicator';

interface EnhancedPriceIndicatorLegendProps {
  className?: string;
  variant?: 'compact' | 'full';
  marketTrend?: 'rising' | 'falling' | 'stable';
  hpiAdjusted?: boolean;
  comparablesCount?: number;
}

const EnhancedPriceIndicatorLegend: React.FC<EnhancedPriceIndicatorLegendProps> = ({ 
  className, 
  variant = 'full',
  marketTrend = 'stable',
  hpiAdjusted = false,
  comparablesCount = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const legendData = getEnhancedPriceIndicatorLegend();

  const getMarketTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMarketTrendText = (trend: string) => {
    switch (trend) {
      case 'rising': return 'Market Rising';
      case 'falling': return 'Market Falling';
      default: return 'Market Stable';
    }
  };

  const getMarketTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising': return 'text-green-600 bg-green-50';
      case 'falling': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Info className="w-4 h-4 text-blue-600" />
        <span className="text-sm text-text-secondary">Enhanced Price Indicators:</span>
        
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

        {hpiAdjusted && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <BarChart3 className="w-3 h-3" />
            HPI Adjusted
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-text-tertiary hover:text-text-secondary transition-colors"
          title="Learn more about enhanced price indicators"
        >
          <Info className="w-3 h-3" />
        </button>

        {isExpanded && (
          <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50">
            <div className="text-sm text-text-primary mb-3">
              <strong>Enhanced Price Indicators</strong> show whether a property would be a good deal if purchased <strong>today</strong> at that historical price.
            </div>
            
            {/* Important clarification about time perspective */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <div className="font-semibold mb-1">📅 Time Perspective Clarification:</div>
                  <div className="space-y-1">
                    <div>• <strong>"Fair Price"</strong> = Would be a good deal if bought today at that price</div>
                    <div>• <strong>"Overpriced"</strong> = Would be expensive if bought today at that price</div>
                    <div>• <strong>Historical context:</strong> A property that was "overpriced" in 2007 might have been a great deal at the time!</div>
                  </div>
                </div>
              </div>
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
            {hpiAdjusted && (
              <div className="mt-2 text-xs text-blue-600">
                ✓ HPI-adjusted for market inflation
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full variant with accordion
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-soft overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Enhanced Price Indicators</h3>
              <p className="text-sm text-blue-700">
                HPI-adjusted analysis using recent comparable properties and market trends
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

      {/* Market Status Bar */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getMarketTrendIcon(marketTrend)}
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getMarketTrendColor(marketTrend))}>
              {getMarketTrendText(marketTrend)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            {hpiAdjusted && (
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                HPI Adjusted
              </div>
            )}
            {comparablesCount > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {comparablesCount} comparables
              </div>
            )}
          </div>
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
              <h4 className="text-base font-semibold text-gray-900 mb-3">Enhanced Analysis Methodology</h4>
              <div className="bg-white rounded-lg p-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <strong>Recent Comparables:</strong> Focus on the last 10 most recent sales of similar properties (same type, bedrooms) from the past 12 months.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">2</span>
                  </div>
                  <div>
                    <strong>HPI Adjustment:</strong> Adjust historical sale prices for House Price Index changes to reflect current market values.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">3</span>
                  </div>
                  <div>
                    <strong>Weighted Average:</strong> Calculate weighted average giving more importance to recent sales (up to 90% weight for very recent sales).
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">4</span>
                  </div>
                  <div>
                    <strong>Market Trend Adjustment:</strong> Adjust thresholds based on whether the market is rising, falling, or stable.
                  </div>
                </div>
              </div>
            </div>

            {/* Time Perspective Clarification */}
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-3">📅 Understanding the Time Perspective</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-3 text-sm text-blue-800">
                    <div>
                      <strong className="text-blue-900">What the indicators mean:</strong>
                      <div className="mt-2 space-y-1">
                        <div>• <strong>"Fair Price"</strong> = Would be a good deal if purchased <strong>today</strong> at that historical price</div>
                        <div>• <strong>"Overpriced"</strong> = Would be expensive if purchased <strong>today</strong> at that historical price</div>
                        <div>• <strong>"Excellent Deal"</strong> = Would be an outstanding deal if purchased <strong>today</strong> at that price</div>
                      </div>
                    </div>
                    <div>
                      <strong className="text-blue-900">Historical context:</strong>
                      <div className="mt-1">
                        A property that shows as "Overpriced" today might have been an excellent deal when it was originally sold! 
                        For example, a property sold for £97,500 in 2007 might be "Overpriced" compared to today's market, 
                        but it was likely a great investment at the time.
                      </div>
                    </div>
                    <div>
                      <strong className="text-blue-900">Investment insight:</strong>
                      <div className="mt-1">
                        This analysis helps you understand which historical prices would be good deals in today's market, 
                        helping you identify undervalued properties and avoid overpaying.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Trend Impact */}
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-3">Market Trend Impact</h4>
              <div className="grid gap-3">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-700">Rising Market</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Easier to find "Excellent" deals (8% below average vs 10%)</p>
                    <p>• Higher tolerance for "Expensive" properties (8% above vs 5%)</p>
                    <p>• Good timing for purchases with growth potential</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-700">Falling Market</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Harder to find "Excellent" deals (12% below average vs 10%)</p>
                    <p>• Lower tolerance for "Expensive" properties (3% above vs 5%)</p>
                    <p>• Consider waiting for better prices or negotiating harder</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Minus className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-700">Stable Market</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Standard thresholds apply (10% below/above for excellent/overpriced)</p>
                    <p>• Predictable pricing patterns</p>
                    <p>• Good for long-term investment planning</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Categories */}
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-3">Enhanced Price Categories</h4>
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
                      {indicator.marketContext}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Levels */}
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-3">Confidence Levels</h4>
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-white font-bold">H</span>
                  </div>
                  <div>
                    <strong className="text-green-700">High Confidence:</strong> 5+ comparable properties found. Analysis is highly reliable.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-white font-bold">M</span>
                  </div>
                  <div>
                    <strong className="text-yellow-700">Medium Confidence:</strong> 3-4 comparable properties found. Analysis is reasonably reliable.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-white font-bold">L</span>
                  </div>
                  <div>
                    <strong className="text-red-700">Low Confidence:</strong> Fewer than 3 comparable properties. Consider expanding search area.
                  </div>
                </div>
              </div>
            </div>

            {/* Data Source */}
            <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
              Data source: UK Land Registry sales, HPI data from ONS • Analysis based on weighted recent comparables with HPI adjustment
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPriceIndicatorLegend; 