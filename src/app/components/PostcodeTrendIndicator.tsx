'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Target, Calendar, PoundSterling, Info } from 'lucide-react';

interface HpiDataPoint {
  change: number;
  [key: string]: unknown;
}

interface RecentSale {
  price: number;
  date: string;
  [key: string]: unknown;
}

interface PostcodeTrendIndicatorProps {
  postcode: string;
  marketTrend: 'rising' | 'falling' | 'stable';
  hpiData?: HpiDataPoint[];
  recentSales?: RecentSale[];
  className?: string;
}

const PostcodeTrendIndicator: React.FC<PostcodeTrendIndicatorProps> = ({
  postcode,
  marketTrend,
  hpiData = [],
  recentSales = [],
  className = ''
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'5y' | '10y' | '20y'>('5y');

  // Calculate predictions for different time horizons
  const calculatePrediction = (years: number) => {
    const inflationRate = 0.025; // 2.5% annual inflation
    const inflationMultiplier = Math.pow(1 + inflationRate, years);
    
    let basePrediction = 0;
    let confidence = 'medium';
    let predictionText = '';
    let predictionColor = '';
    let predictionIcon = <Minus className="w-5 h-5" />;
    let analysis = [];

    // Different base predictions for different time horizons
    switch (marketTrend) {
      case 'rising':
        if (years === 5) {
          basePrediction = 8; // 8% real growth over 5 years
        } else if (years === 10) {
          basePrediction = 15; // 15% real growth over 10 years
        } else {
          basePrediction = 25; // 25% real growth over 20 years
        }
        predictionText = 'Expected to gain value';
        predictionColor = 'text-green-600';
        predictionIcon = <TrendingUp className="w-5 h-5" />;
        analysis.push('Market showing positive momentum');
        break;
      case 'falling':
        if (years === 5) {
          basePrediction = -2; // 2% real decline over 5 years
        } else if (years === 10) {
          basePrediction = 2; // 2% real growth over 10 years (recovery)
        } else {
          basePrediction = 8; // 8% real growth over 20 years (long-term recovery)
        }
        predictionText = years === 5 ? 'Expected slight value decline' : 'Expected recovery and growth';
        predictionColor = years === 5 ? 'text-orange-600' : 'text-green-600';
        predictionIcon = years === 5 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />;
        analysis.push('Market showing downward pressure');
        if (years > 5) analysis.push('Long-term recovery expected');
        break;
      case 'stable':
        if (years === 5) {
          basePrediction = 3; // 3% real growth over 5 years
        } else if (years === 10) {
          basePrediction = 8; // 8% real growth over 10 years
        } else {
          basePrediction = 15; // 15% real growth over 20 years
        }
        predictionText = 'Expected to maintain value';
        predictionColor = 'text-blue-600';
        predictionIcon = <Minus className="w-5 h-5" />;
        analysis.push('Market showing stable conditions');
        break;
    }

    // HPI data adjustment (scaled by time horizon)
    if (hpiData && hpiData.length > 0) {
      const recentHPI = hpiData.slice(0, 6);
      const avgHPIChange = recentHPI.reduce((sum, h) => sum + (h.change || 0), 0) / recentHPI.length;
      
      const adjustmentFactor = years / 5; // Scale adjustments by time horizon
      
      if (avgHPIChange > 0.3) {
        basePrediction += 2 * adjustmentFactor;
        analysis.push('Strong recent HPI growth');
        confidence = 'high';
      } else if (avgHPIChange < -0.3) {
        basePrediction -= 2 * adjustmentFactor;
        analysis.push('Recent HPI decline');
        confidence = 'high';
      } else {
        analysis.push('Stable HPI trends');
      }
    } else {
      analysis.push('Limited HPI data available');
      confidence = 'low';
    }

    // Sales velocity adjustment (less impact on longer time horizons)
    if (recentSales && recentSales.length >= 3) {
      const recentSalesCount = recentSales.filter(sale => {
        const saleDate = new Date(sale.dateOfTransfer as string);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return saleDate >= sixMonthsAgo;
      }).length;

      const velocityFactor = Math.max(0.5, 5 / years); // Less impact on longer horizons

      if (recentSalesCount >= 5) {
        basePrediction += 1 * velocityFactor;
        analysis.push('High sales activity (good liquidity)');
        confidence = 'high';
      } else if (recentSalesCount >= 3) {
        analysis.push('Moderate sales activity');
      } else {
        basePrediction -= 1 * velocityFactor;
        analysis.push('Low sales activity (limited liquidity)');
      }
    } else {
      analysis.push('Limited recent sales data');
      confidence = 'low';
    }

    // Cap extreme predictions (wider range for longer time horizons)
    const maxRange = years === 5 ? 20 : years === 10 ? 35 : 50;
    basePrediction = Math.max(-maxRange/2, Math.min(maxRange, basePrediction));

    // Calculate nominal vs real returns
    const realReturn = basePrediction;
    const nominalReturn = (inflationMultiplier * (1 + realReturn / 100) - 1) * 100;

    return {
      percentage: Math.round(realReturn * 10) / 10,
      nominalPercentage: Math.round(nominalReturn * 10) / 10,
      text: predictionText,
      color: predictionColor,
      icon: predictionIcon,
      confidence,
      analysis,
      inflationMultiplier,
      years
    };
  };

  const getCurrentPrediction = () => {
    const years = selectedPeriod === '5y' ? 5 : selectedPeriod === '10y' ? 10 : 20;
    return calculatePrediction(years);
  };

  const prediction = getCurrentPrediction();

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

  const getInvestmentAdvice = (percentage: number, years: number) => {
    if (years === 5) {
      if (percentage > 8) return 'Strong buy opportunity';
      if (percentage > 3) return 'Good medium-term investment';
      if (percentage > -2) return 'Consider carefully';
      return 'High risk investment';
    } else if (years === 10) {
      if (percentage > 12) return 'Excellent long-term investment';
      if (percentage > 6) return 'Good long-term investment';
      if (percentage > 0) return 'Moderate long-term potential';
      return 'Consider alternatives';
    } else {
      if (percentage > 15) return 'Outstanding long-term investment';
      if (percentage > 8) return 'Strong long-term potential';
      if (percentage > 0) return 'Moderate long-term potential';
      return 'Consider other investments';
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
            <h4 className="font-bold text-[#2C6E91] text-lg mb-1">Long-Term Value Prediction</h4>
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
          <p className="text-xs text-gray-600 mt-1">
            Real return (inflation-adjusted)
          </p>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2 mb-4">
        {[
          { key: '5y', label: '5 Years', years: 5 },
          { key: '10y', label: '10 Years', years: 10 },
          { key: '20y', label: '20 Years', years: 20 }
        ].map((period) => {
          const periodPrediction = calculatePrediction(period.years);
          return (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key as '5y' | '10y' | '20y')}
              className={`flex-1 py-2 px-3 rounded-lg border transition-all ${
                selectedPeriod === period.key
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-white/60 text-[#2C6E91] border-blue-200 hover:bg-white/80'
              }`}
            >
              <div className="text-sm font-medium">{period.label}</div>
              <div className={`text-xs ${periodPrediction.percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {periodPrediction.percentage > 0 ? '+' : ''}{periodPrediction.percentage}%
              </div>
            </button>
          );
        })}
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
            {getInvestmentAdvice(prediction.percentage, prediction.years)}
          </p>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="mt-4 bg-white/40 rounded-lg p-4 border border-blue-100">
        <h5 className="font-semibold text-[#2C6E91] mb-2">Analysis Summary</h5>
        <ul className="text-sm text-[#3B755D] space-y-1">
          {prediction.analysis.map((item, index) => (
            <li key={index}>• {item}</li>
          ))}
          <li>• {prediction.percentage > 0 ? 
            `Expected real gain of £${Math.round(prediction.percentage)}k on a £100k property` :
            `Expected real loss of £${Math.round(Math.abs(prediction.percentage))}k on a £100k property`
          }</li>
          <li>• Nominal value expected to be £{Math.round(prediction.nominalPercentage)}k (including inflation)</li>
          <li>• {prediction.confidence === 'high' ? 'High confidence due to strong data' :
                 prediction.confidence === 'medium' ? 'Moderate confidence - consider additional research' :
                 'Low confidence - consult local market experts'}</li>
        </ul>
      </div>

      {/* Why People Buy Section */}
      <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-600" />
          <h5 className="font-semibold text-[#2C6E91]">Why People Buy in This Area</h5>
        </div>
        <div className="text-sm text-[#3B755D] space-y-1">
          <p>• <strong>Location benefits:</strong> Proximity to amenities, transport, schools</p>
          <p>• <strong>Affordability:</strong> Entry-level prices for first-time buyers</p>
          <p>• <strong>Rental potential:</strong> Strong rental demand in the area</p>
          <p>• <strong>Future development:</strong> Planned infrastructure improvements</p>
          <p>• <strong>Market timing:</strong> Current prices may represent good value</p>
          <p>• <strong>Long-term growth:</strong> Property typically appreciates over time</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 text-xs text-gray-500 bg-white/60 rounded-lg p-3 border border-gray-200">
        <strong>Disclaimer:</strong> This prediction is based on historical data and market trends. 
        Property values can be affected by many factors including economic conditions, local developments, 
        and market changes. Always conduct your own research and consider consulting with property professionals.
        Past performance does not guarantee future results. Longer-term predictions have higher uncertainty.
      </div>
    </div>
  );
};

export default PostcodeTrendIndicator; 