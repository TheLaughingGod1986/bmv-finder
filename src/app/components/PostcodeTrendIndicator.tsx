'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Target, Calendar, PoundSterling } from 'lucide-react';

interface PostcodeTrendIndicatorProps {
  postcode: string;
  marketTrend: 'rising' | 'falling' | 'stable';
  hpiData?: any[];
  recentSales?: any[];
  className?: string;
}

const PostcodeTrendIndicator: React.FC<PostcodeTrendIndicatorProps> = ({
  postcode,
  marketTrend,
  hpiData = [],
  recentSales = [],
  className = ''
}) => {
  // Calculate 5-year prediction based on market trend and data
  const calculateFiveYearPrediction = () => {
    let basePrediction = 0;
    let confidence = 'medium';
    let predictionText = '';
    let predictionColor = '';
    let predictionIcon = <Minus className="w-5 h-5" />;

    // Base prediction from market trend
    switch (marketTrend) {
      case 'rising':
        basePrediction = 15; // 15% growth over 5 years
        predictionText = 'Expected to gain value';
        predictionColor = 'text-green-600';
        predictionIcon = <TrendingUp className="w-5 h-5" />;
        break;
      case 'falling':
        basePrediction = -8; // 8% decline over 5 years
        predictionText = 'Expected to lose value';
        predictionColor = 'text-red-600';
        predictionIcon = <TrendingDown className="w-5 h-5" />;
        break;
      case 'stable':
        basePrediction = 3; // 3% modest growth over 5 years
        predictionText = 'Expected to maintain value';
        predictionColor = 'text-gray-600';
        predictionIcon = <Minus className="w-5 h-5" />;
        break;
    }

    // Adjust based on HPI data if available
    if (hpiData && hpiData.length > 0) {
      const recentHPI = hpiData.slice(0, 6); // Last 6 months
      const avgHPIChange = recentHPI.reduce((sum, h) => sum + (h.change || 0), 0) / recentHPI.length;
      
      if (avgHPIChange > 0.5) {
        basePrediction += 5; // Additional 5% if HPI is strongly positive
        confidence = 'high';
      } else if (avgHPIChange < -0.5) {
        basePrediction -= 5; // Additional 5% decline if HPI is strongly negative
        confidence = 'high';
      }
    }

    // Adjust based on recent sales velocity
    if (recentSales && recentSales.length >= 5) {
      const recentSalesCount = recentSales.filter(sale => {
        const saleDate = new Date(sale.dateOfTransfer);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return saleDate >= sixMonthsAgo;
      }).length;

      if (recentSalesCount >= 5) {
        basePrediction += 2; // High activity suggests demand
        confidence = 'high';
      } else if (recentSalesCount <= 1) {
        basePrediction -= 2; // Low activity suggests weak demand
      }
    }

    return {
      percentage: Math.round(basePrediction * 10) / 10,
      text: predictionText,
      color: predictionColor,
      icon: predictionIcon,
      confidence
    };
  };

  const prediction = calculateFiveYearPrediction();

  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'High confidence prediction';
      case 'medium':
        return 'Moderate confidence prediction';
      case 'low':
        return 'Low confidence prediction';
      default:
        return 'Prediction confidence';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 via-green-50 to-emerald-50 border border-blue-200 rounded-xl p-6 shadow-soft ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-green-500 p-3 rounded-full shadow-md">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-[#2C6E91] text-lg mb-1">5-Year Value Prediction</h4>
            <p className="text-sm text-[#3B755D] font-medium">
              {postcode} - Investment Outlook
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-2 text-2xl font-bold ${prediction.color}`}>
            {prediction.icon}
            <span>{prediction.percentage > 0 ? '+' : ''}{prediction.percentage}%</span>
          </div>
          <p className={`text-sm font-medium ${prediction.color}`}>
            {prediction.text}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Market Trend */}
        <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-[#2C6E91]">Market Trend</span>
          </div>
          <p className="text-sm text-[#3B755D] capitalize">
            {marketTrend} market conditions
          </p>
        </div>

        {/* Data Confidence */}
        <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-[#2C6E91]">Prediction Confidence</span>
          </div>
          <p className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
            {getConfidenceText(prediction.confidence)}
          </p>
        </div>

        {/* Investment Advice */}
        <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <PoundSterling className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-[#2C6E91]">Investment Advice</span>
          </div>
          <p className="text-sm text-[#3B755D]">
            {prediction.percentage > 10 ? 'Strong buy opportunity' :
             prediction.percentage > 0 ? 'Good long-term investment' :
             prediction.percentage > -5 ? 'Consider carefully' : 'High risk investment'}
          </p>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="mt-4 bg-white/40 rounded-lg p-4 border border-blue-100">
        <h5 className="font-semibold text-[#2C6E91] mb-2">Analysis Summary</h5>
        <ul className="text-sm text-[#3B755D] space-y-1">
          <li>• Based on {hpiData.length > 0 ? `${hpiData.length} months of HPI data` : 'market trend analysis'}</li>
          <li>• {recentSales.length > 0 ? `${recentSales.length} recent sales analyzed` : 'Limited sales data available'}</li>
          <li>• {prediction.percentage > 0 ? 
            `Expected to gain approximately £${Math.round(prediction.percentage * 1000 / 100)}k on a £100k property` :
            `Expected to lose approximately £${Math.round(Math.abs(prediction.percentage) * 1000 / 100)}k on a £100k property`
          }</li>
          <li>• {prediction.confidence === 'high' ? 'High confidence in prediction due to strong data' :
                 prediction.confidence === 'medium' ? 'Moderate confidence - consider additional research' :
                 'Low confidence - consult local market experts'}</li>
        </ul>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 text-xs text-gray-500 bg-white/60 rounded-lg p-3 border border-gray-200">
        <strong>Disclaimer:</strong> This prediction is based on historical data and market trends. 
        Property values can be affected by many factors including economic conditions, local developments, 
        and market changes. Always conduct your own research and consider consulting with property professionals.
      </div>
    </div>
  );
};

export default PostcodeTrendIndicator; 