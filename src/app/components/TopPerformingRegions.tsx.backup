'use client';


import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Award, Trophy, AlertTriangle, BarChart3, MapPin, Calendar } from 'lucide-react';

interface MarketData {
  region: string;
  currentIndex: number;
  yoyGrowth: number;
  timeframeGrowth: number;
  momGrowth: number;
  volatility: number;
  trend: 'rising' | 'falling' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  investmentScore: number;
  lastUpdated: string;
  dataPoints: number;
}

interface TopPerformingRegionsProps {
  data: MarketData[];
}

export default function TopPerformingRegions({ data }: TopPerformingRegionsProps) {
  const topPerformers = [...data]
    .sort((a, b) => b.timeframeGrowth - a.timeframeGrowth)
    .slice(0, 5);

  const worstPerformers = [...data]
    .sort((a, b) => a.timeframeGrowth - b.timeframeGrowth)
    .slice(0, 5);

  const isSingleRegion = data.length === 1;

  const getGrowthColor = (growth: number) => {
    if (growth > 5) return 'text-green-600';
    if (growth > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[risk]}`}>
        {risk.toUpperCase()}
      </span>
    );
  };

  // If single region, show focused analysis
  if (isSingleRegion) {
    const region = data[0];
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-semibold text-gray-900">Regional Performance Analysis</h3>
        </div>

        {/* Single Region Focus */}
        <div className="p-6 border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg font-bold">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-900">{region.region}</h4>
              <div className="flex items-center gap-2">
                {getTrendIcon(region.trend)}
                <span className="text-sm text-gray-600 capitalize">{region.trend} trend</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Growth Rate</p>
              <p className={`text-2xl font-bold ${getGrowthColor(region.timeframeGrowth)}`}>
                {(region.timeframeGrowth || 0) > 0 ? '+' : ''}{(region.timeframeGrowth || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">Selected timeframe</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 mb-1">HPI Index</p>
              <p className="text-2xl font-bold text-gray-900">{(region.currentIndex || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Current value</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Volatility</p>
              <p className="text-2xl font-bold text-gray-900">{(region.volatility || 0).toFixed(2)}%</p>
              <p className="text-xs text-gray-500">Market stability</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Investment Score</p>
              <p className="text-2xl font-bold text-blue-600">{region.investmentScore}/100</p>
              <p className="text-xs text-gray-500">Overall rating</p>
            </div>
          </div>

          {/* Risk and Trend Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-2">Risk Assessment</h5>
              <div className="flex items-center gap-3">
                {getRiskBadge(region.riskLevel)}
                <span className="text-sm text-gray-600">
                  {region.dataPoints} data points analyzed
                </span>
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-2">Performance Summary</h5>
              <p className="text-sm text-gray-600">
                {region.timeframeGrowth > 0 ? 
                  `Strong performance with ${region.timeframeGrowth.toFixed(1)}% growth over the selected timeframe.` :
                  `Challenging period with ${Math.abs(region.timeframeGrowth).toFixed(1)}% decline over the selected timeframe.`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multi-region view (original logic)
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h3 className="text-xl font-semibold text-gray-900">Top Performing Regions</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-green-500" />
            <h4 className="text-lg font-semibold text-gray-900">Best Performers</h4>
          </div>
          
          <div className="space-y-3">
            {topPerformers.map((region, index) => (
              <motion.div
                key={region.region}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{region.region}</p>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(region.trend)}
                        <span className="text-sm text-gray-600">{region.trend}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getGrowthColor(region.timeframeGrowth)}`}>
                      {(region.timeframeGrowth || 0) > 0 ? '+' : ''}{(region.timeframeGrowth || 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-600">Growth</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">HPI Index</p>
                    <p className="font-semibold text-gray-900">{(region.currentIndex || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">MoM Change</p>
                    <p className={`font-semibold ${getGrowthColor(region.momGrowth)}`}>
                      {(region.momGrowth || 0) > 0 ? '+' : ''}{(region.momGrowth || 0).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Risk</p>
                    {getRiskBadge(region.riskLevel)}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Investment Score</span>
                    <span className="text-sm font-semibold text-gray-900">{region.investmentScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${region.investmentScore}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Worst Performers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h4 className="text-lg font-semibold text-gray-900">Challenged Regions</h4>
          </div>
          
          <div className="space-y-3">
            {worstPerformers.map((region, index) => (
              <motion.div
                key={region.region}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{region.region}</p>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(region.trend)}
                        <span className="text-sm text-gray-600">{region.trend}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getGrowthColor(region.timeframeGrowth)}`}>
                      {(region.timeframeGrowth || 0) > 0 ? '+' : ''}{(region.timeframeGrowth || 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-600">Growth</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">HPI Index</p>
                    <p className="font-semibold text-gray-900">{(region.currentIndex || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">MoM Change</p>
                    <p className={`font-semibold ${getGrowthColor(region.momGrowth)}`}>
                      {(region.momGrowth || 0) > 0 ? '+' : ''}{(region.momGrowth || 0).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Risk</p>
                    {getRiskBadge(region.riskLevel)}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-red-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Investment Score</span>
                    <span className="text-sm font-semibold text-gray-900">{region.investmentScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${region.investmentScore}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 