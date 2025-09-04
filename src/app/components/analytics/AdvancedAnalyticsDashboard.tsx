'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Home,
  MapPin,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Brain,
  Zap
} from 'lucide-react';

interface PropertyRecommendation {
  id: string;
  propertyId: string;
  type: 'INVESTMENT' | 'RENTAL' | 'FLIP' | 'HOLD' | 'SELL' | 'AVOID';
  score: number;
  confidence: number;
  reasoning: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  expectedReturn: {
    percentage: number;
    amount: number;
    timeframe: string;
  };
  keyFactors: {
    bmvScore: number;
    marketTrend: number;
    locationScore: number;
    rentalYield: number;
    growthPotential: number;
  };
}

interface PricePrediction {
  id: string;
  propertyId: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  riskFactors: string[];
}

interface MarketForecast {
  id: string;
  region: string;
  timeframe: string;
  predictions: {
    averagePrice: number;
    priceGrowth: number;
    volumeGrowth: number;
    daysOnMarket: number;
  };
  confidence: number;
  keyDrivers: string[];
  risks: string[];
  opportunities: string[];
}

interface AdvancedAnalyticsDashboardProps {
  className?: string;
}

export default function AdvancedAnalyticsDashboard({ className = '' }: AdvancedAnalyticsDashboardProps) {
  const [recommendations, setRecommendations] = useState<PropertyRecommendation[]>([]);
  const [predictions, setPredictions] = useState<PricePrediction[]>([]);
  const [marketForecasts, setMarketForecasts] = useState<MarketForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'predictions' | 'forecasts' | 'insights'>('recommendations');
  const [filters, setFilters] = useState({
    timeframe: '3_YEAR',
    riskLevel: 'all',
    recommendationType: 'all',
    region: 'all'
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [filters]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch AI recommendations
      const recommendationsResponse = await fetch('/api/ai/recommendations');
      const recommendationsData = await recommendationsResponse.json();
      if (recommendationsData.success) {
        setRecommendations(recommendationsData.data);
      }

      // Fetch predictions
      const predictionsResponse = await fetch('/api/ai/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeframe: filters.timeframe,
          includeScenarios: true,
          includeRiskFactors: true,
        }),
      });
      const predictionsData = await predictionsResponse.json();
      if (predictionsData.success) {
        setPredictions(predictionsData.data.pricePrediction ? [predictionsData.data.pricePrediction] : []);
        setMarketForecasts(predictionsData.data.marketForecast ? [predictionsData.data.marketForecast] : []);
      }

    } catch (error) {
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'INVESTMENT':
      case 'RENTAL':
        return 'text-green-600 bg-green-100';
      case 'HOLD':
        return 'text-blue-600 bg-blue-100';
      case 'FLIP':
        return 'text-purple-600 bg-purple-100';
      case 'SELL':
        return 'text-orange-600 bg-orange-100';
      case 'AVOID':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-green-600 bg-green-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'HIGH':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">AI-powered insights and predictions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAnalyticsData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filters.timeframe}
            onChange={(e) => setFilters({ ...filters, timeframe: e.target.value })}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1_YEAR">1 Year</option>
            <option value="3_YEAR">3 Years</option>
            <option value="5_YEAR">5 Years</option>
            <option value="10_YEAR">10 Years</option>
          </select>

          <select
            value={filters.riskLevel}
            onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>

          <select
            value={filters.recommendationType}
            onChange={(e) => setFilters({ ...filters, recommendationType: e.target.value })}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="INVESTMENT">Investment</option>
            <option value="RENTAL">Rental</option>
            <option value="FLIP">Flip</option>
            <option value="HOLD">Hold</option>
            <option value="SELL">Sell</option>
            <option value="AVOID">Avoid</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'recommendations', label: 'AI Recommendations', icon: Brain },
              { id: 'predictions', label: 'Price Predictions', icon: TrendingUp },
              { id: 'forecasts', label: 'Market Forecasts', icon: BarChart3 },
              { id: 'insights', label: 'Insights', icon: Eye },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* AI Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">AI-Powered Recommendations</h3>
                <span className="text-sm text-gray-500">{recommendations.length} recommendations</span>
              </div>

              <div className="grid gap-4">
                {recommendations.map((recommendation) => (
                  <motion.div
                    key={recommendation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRecommendationColor(recommendation.type)}`}>
                          {recommendation.type}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(recommendation.riskLevel)}`}>
                          {recommendation.riskLevel} RISK
                        </span>
                        <span className="text-sm text-gray-500">
                          {recommendation.timeHorizon} term
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{recommendation.score}</div>
                        <div className="text-sm text-gray-500">Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{recommendation.keyFactors.bmvScore}</div>
                        <div className="text-xs text-gray-500">BMV Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{recommendation.keyFactors.marketTrend}</div>
                        <div className="text-xs text-gray-500">Market Trend</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{recommendation.keyFactors.locationScore}</div>
                        <div className="text-xs text-gray-500">Location</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{recommendation.keyFactors.rentalYield}</div>
                        <div className="text-xs text-gray-500">Rental Yield</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{recommendation.keyFactors.growthPotential}</div>
                        <div className="text-xs text-gray-500">Growth</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Expected Return: {recommendation.expectedReturn.percentage}% 
                          (£{recommendation.expectedReturn.amount.toLocaleString()})
                        </div>
                        <div className="text-xs text-gray-500">
                          Over {recommendation.expectedReturn.timeframe}
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${getConfidenceColor(recommendation.confidence)}`}>
                        {recommendation.confidence}% confidence
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Key Reasoning:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {recommendation.reasoning.slice(0, 3).map((reason, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Price Predictions Tab */}
          {activeTab === 'predictions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Price Predictions</h3>
                <span className="text-sm text-gray-500">{predictions.length} predictions</span>
              </div>

              <div className="grid gap-4">
                {predictions.map((prediction) => (
                  <motion.div
                    key={prediction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">Property Price Forecast</h4>
                        <p className="text-sm text-gray-500">{prediction.timeframe} prediction</p>
                      </div>
                      <div className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                        {prediction.confidence}% confidence
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          £{prediction.currentValue.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Current Value</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          £{prediction.predictedValue.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Predicted Value</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          +{((prediction.predictedValue - prediction.currentValue) / prediction.currentValue * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Growth</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Scenario Analysis:</h5>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-red-50 rounded">
                          <div className="text-sm font-medium text-red-600">
                            £{prediction.scenarios.pessimistic.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Pessimistic</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-sm font-medium text-blue-600">
                            £{prediction.scenarios.realistic.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Realistic</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="text-sm font-medium text-green-600">
                            £{prediction.scenarios.optimistic.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Optimistic</div>
                        </div>
                      </div>
                    </div>

                    {prediction.riskFactors.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Risk Factors:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {prediction.riskFactors.map((risk, index) => (
                            <li key={index} className="flex items-start">
                              <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Market Forecasts Tab */}
          {activeTab === 'forecasts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Market Forecasts</h3>
                <span className="text-sm text-gray-500">{marketForecasts.length} forecasts</span>
              </div>

              <div className="grid gap-4">
                {marketForecasts.map((forecast) => (
                  <motion.div
                    key={forecast.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{forecast.region} Market Forecast</h4>
                        <p className="text-sm text-gray-500">{forecast.timeframe} outlook</p>
                      </div>
                      <div className={`text-sm font-medium ${getConfidenceColor(forecast.confidence)}`}>
                        {forecast.confidence}% confidence
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">
                          £{forecast.predictions.averagePrice.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Avg Price</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">
                          +{forecast.predictions.priceGrowth}%
                        </div>
                        <div className="text-sm text-gray-500">Price Growth</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">
                          +{forecast.predictions.volumeGrowth}%
                        </div>
                        <div className="text-sm text-gray-500">Volume Growth</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-xl font-bold text-purple-600">
                          {forecast.predictions.daysOnMarket}
                        </div>
                        <div className="text-sm text-gray-500">Days on Market</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Key Drivers:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {forecast.keyDrivers.map((driver, index) => (
                            <li key={index} className="flex items-start">
                              <TrendingUp className="w-3 h-3 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                              {driver}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Opportunities:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {forecast.opportunities.map((opportunity, index) => (
                            <li key={index} className="flex items-start">
                              <Target className="w-3 h-3 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                              {opportunity}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Risks:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {forecast.risks.map((risk, index) => (
                            <li key={index} className="flex items-start">
                              <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">AI Insights</h3>
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-500">Powered by AI</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Brain className="w-6 h-6 text-blue-600 mr-2" />
                    <h4 className="text-lg font-medium text-gray-900">Market Intelligence</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Our AI analyzes market trends, economic indicators, and property data to provide 
                    intelligent insights and recommendations.
                  </p>
                  <div className="text-sm text-blue-600 font-medium">
                    {recommendations.length} active recommendations
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
                    <h4 className="text-lg font-medium text-gray-900">Predictive Analytics</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Advanced machine learning models predict property values, market trends, 
                    and investment opportunities with high accuracy.
                  </p>
                  <div className="text-sm text-green-600 font-medium">
                    {predictions.length} price predictions
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Target className="w-6 h-6 text-purple-600 mr-2" />
                    <h4 className="text-lg font-medium text-gray-900">Investment Strategy</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Personalized investment recommendations based on your risk tolerance, 
                    budget, and investment goals.
                  </p>
                  <div className="text-sm text-purple-600 font-medium">
                    AI-optimized portfolio
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <BarChart3 className="w-6 h-6 text-orange-600 mr-2" />
                    <h4 className="text-lg font-medium text-gray-900">Risk Assessment</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Comprehensive risk analysis considering market volatility, location factors, 
                    and economic conditions.
                  </p>
                  <div className="text-sm text-orange-600 font-medium">
                    Multi-factor risk model
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}
    </div>
  );
}
