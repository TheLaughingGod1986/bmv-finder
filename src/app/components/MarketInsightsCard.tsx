'use client';


import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Award, Target, BarChart3, Info, Lightbulb, Shield, Zap } from 'lucide-react';

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

interface MarketSummary {
  totalRegions: number;
  averageGrowth: number;
  bestPerformingRegion: string;
  worstPerformingRegion: string;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  overallRisk: 'low' | 'medium' | 'high';
}

interface MarketInsightsCardProps {
  data: MarketData[];
  summary: MarketSummary | null;
}

export default function MarketInsightsCard({ data, summary }: MarketInsightsCardProps) {
  if (!summary) return null;

  const getMarketInsights = () => {
    const insights = [];
    
    // Growth insights
    if (summary.averageGrowth > 5) {
      insights.push({
        type: 'positive',
        icon: TrendingUp,
        title: 'Strong Market Growth',
        description: `Average growth of ${summary.averageGrowth}% indicates a robust property market across regions.`
      });
    } else if (summary.averageGrowth < 0) {
      insights.push({
        type: 'negative',
        icon: TrendingDown,
        title: 'Market Decline',
        description: `Average decline of ${Math.abs(summary.averageGrowth)}% suggests challenging market conditions.`
      });
    }

    // Sentiment insights
    if (summary.marketSentiment === 'bullish') {
      insights.push({
        type: 'positive',
        icon: Award,
        title: 'Bullish Market Sentiment',
        description: 'Majority of regions showing positive trends, indicating strong investor confidence.'
      });
    } else if (summary.marketSentiment === 'bearish') {
      insights.push({
        type: 'negative',
        icon: AlertTriangle,
        title: 'Bearish Market Sentiment',
        description: 'Most regions experiencing declines, suggesting cautious investment approach.'
      });
    }

    // Risk insights
    if (summary.overallRisk === 'low') {
      insights.push({
        type: 'positive',
        icon: Shield,
        title: 'Low Market Risk',
        description: 'Stable market conditions with predictable price movements across regions.'
      });
    } else if (summary.overallRisk === 'high') {
      insights.push({
        type: 'negative',
        icon: AlertTriangle,
        title: 'High Market Volatility',
        description: 'Unpredictable market conditions requiring careful risk management.'
      });
    }

    // Regional performance insights
    if (summary.totalRegions === 1) {
      // Single region analysis
      const region = data[0];
      const growthText = region.timeframeGrowth > 0 ? 
        `shows strong growth of ${region.timeframeGrowth.toFixed(1)}%` : 
        `shows a decline of ${Math.abs(region.timeframeGrowth).toFixed(1)}%`;
      
      insights.push({
        type: 'info',
        icon: Target,
        title: 'Regional Performance',
        description: `${region.region} ${growthText} over the selected timeframe.`
      });
    } else {
      // Multiple regions comparison
      insights.push({
        type: 'info',
        icon: Target,
        title: 'Regional Performance',
        description: `${summary.bestPerformingRegion} leads with strongest growth, while ${summary.worstPerformingRegion} shows weakest performance.`
      });
    }

    return insights;
  };

  const getInvestmentRecommendations = () => {
    const recommendations = [];
    
    if (summary.marketSentiment === 'bullish' && summary.overallRisk === 'low') {
      recommendations.push({
        type: 'buy',
        title: 'Consider Investment',
        description: 'Favorable market conditions suggest good timing for property investments.'
      });
    } else if (summary.marketSentiment === 'bearish') {
      recommendations.push({
        type: 'hold',
        title: 'Exercise Caution',
        description: 'Market decline suggests waiting for better conditions or focusing on defensive strategies.'
      });
    }

    if (summary.overallRisk === 'high') {
      recommendations.push({
        type: 'diversify',
        title: 'Diversify Portfolio',
        description: 'High volatility suggests spreading investments across different regions and property types.'
      });
    }

    const topRegions = data
      .sort((a, b) => b.investmentScore - a.investmentScore)
      .slice(0, 3);
    
    if (topRegions.length > 0) {
      recommendations.push({
        type: 'focus',
        title: 'Focus on Top Regions',
        description: `Consider ${topRegions.map(r => r.region).join(', ')} for highest investment potential.`
      });
    }

    return recommendations;
  };

  const insights = getMarketInsights();
  const recommendations = getInvestmentRecommendations();

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600 bg-green-100';
      case 'bearish': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-500" />
        <h3 className="text-xl font-semibold text-gray-900">Market Insights</h3>
      </div>

      {/* Market Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Sentiment</p>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(summary.marketSentiment)}`}>
            {summary.marketSentiment.toUpperCase()}
          </span>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Risk Level</p>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(summary.overallRisk)}`}>
            {summary.overallRisk.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Key Insights */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h4>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border-l-4 ${
                insight.type === 'positive' ? 'border-green-500 bg-green-50' :
                insight.type === 'negative' ? 'border-red-500 bg-red-50' :
                'border-blue-500 bg-blue-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <insight.icon className={`w-5 h-5 mt-0.5 ${
                  insight.type === 'positive' ? 'text-green-500' :
                  insight.type === 'negative' ? 'text-red-500' :
                  'text-blue-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">{insight.title}</p>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Investment Recommendations */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Investment Recommendations</h4>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
            >
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{rec.title}</p>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Top Performing Regions */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Investment Opportunities</h4>
        <div className="space-y-2">
          {data
            .sort((a, b) => b.investmentScore - a.investmentScore)
            .slice(0, 5)
            .map((region, index) => (
              <motion.div
                key={region.region}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{region.region}</p>
                    <p className="text-sm text-gray-600">
                      {region.timeframeGrowth > 0 ? '+' : ''}{region.timeframeGrowth.toFixed(1)}% growth
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{region.investmentScore}/100</p>
                  <p className="text-xs text-gray-600">Score</p>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
          <p className="text-xs text-yellow-800">
            These insights are based on historical HPI data and should not be considered as financial advice. 
            Always conduct thorough research before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
} 