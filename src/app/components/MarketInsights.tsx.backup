
import { TrendingUp, TrendingDown, BarChart3, Clock, Target, AlertTriangle } from 'lucide-react';

type Props = {
  marketInsights: {
    priceVariability: number;
    recentSalesCount: number;
    averageSimilarity: number;
    highQualityMatches: number;
    marketGrowth?: number | null;
    marketGrowthPeriod?: string;
  };
  priceRange: {
    min: number;
    max: number;
    median: number;
  };
  latestYoY: number | null;
};

export default function MarketInsights({ marketInsights, priceRange, latestYoY }: Props) {
  const getVariabilityColor = (variability: number) => {
    if (variability < 10) return 'text-green-600';
    if (variability < 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVariabilityIcon = (variability: number) => {
    if (variability < 10) return <TrendingUp className="w-4 h-4" />;
    if (variability < 20) return <BarChart3 className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="rounded-lg border p-6 bg-white shadow">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">Market Insights</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Price Variability */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {getVariabilityIcon(marketInsights.priceVariability)}
            <span className="font-semibold text-blue-900">Price Stability</span>
          </div>
          <div className={`text-2xl font-bold ${getVariabilityColor(marketInsights.priceVariability)}`}>
            {marketInsights.priceVariability.toFixed(1)}%
          </div>
          <div className="text-sm text-blue-700">
            {marketInsights.priceVariability < 10 ? 'Very Stable' :
             marketInsights.priceVariability < 20 ? 'Moderate Variation' : 'High Variation'}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-900">Recent Sales</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{marketInsights.recentSalesCount}</div>
          <div className="text-sm text-green-700">Last 24 months</div>
        </div>

        {/* Data Quality */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-900">Data Quality</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{marketInsights.highQualityMatches}</div>
          <div className="text-sm text-purple-700">High-quality matches</div>
        </div>

        {/* Market Growth */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-orange-900">Market Growth</span>
          </div>
          <div className={`text-2xl font-bold ${marketInsights.marketGrowth && marketInsights.marketGrowth > 0 ? 'text-green-600' : marketInsights.marketGrowth && marketInsights.marketGrowth < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {marketInsights.marketGrowth !== null ? `${marketInsights.marketGrowth.toFixed(1)}%` : 'N/A'}
          </div>
          <div className="text-sm text-orange-700">
            {marketInsights.marketGrowthPeriod || 'Year-over-year'}
          </div>
        </div>
      </div>

      {/* Price Range Analysis */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Price Range Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Lowest</div>
            <div className="text-lg font-bold text-red-600">£{priceRange.min.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Median</div>
            <div className="text-lg font-bold text-blue-600">£{priceRange.median.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Highest</div>
            <div className="text-lg font-bold text-green-600">£{priceRange.max.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Data Quality Warnings */}
      {marketInsights.recentSalesCount < 2 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold text-yellow-800">Limited Recent Data</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Few recent sales found. Consider expanding your search area or time period for more accurate valuations.
          </p>
        </div>
      )}

      {marketInsights.priceVariability > 25 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-800">High Price Variation</span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            Significant price variation detected. This may indicate market volatility or diverse property characteristics.
          </p>
        </div>
      )}
    </div>
  );
} 