'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  MapPin,
  DollarSign,
  Home,
  Users,
  Building
} from 'lucide-react';

interface PropertyAnalytics {
  property: {
    id: string;
    address: string;
    postcode: string;
    propertyType: string;
    bedrooms: number;
    price: number;
  };
  market: {
    localAveragePrice: number;
    regionalAveragePrice: number;
    marketTrend: string;
    marketVelocity: number;
  };
  investment: {
    rentalYield: number;
    capitalGrowth: number;
    totalReturn: number;
    riskScore: number;
    investmentGrade: string;
  };
  location: {
    walkScore: number;
    transportScore: number;
    amenityScore: number;
    overallLocationScore: number;
  };
  predictions: {
    oneYearForecast: {
      price: number;
      confidence: number;
    };
    fiveYearForecast: {
      price: number;
      confidence: number;
    };
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    recommendations: string[];
  };
}

interface InvestmentRecommendation {
  recommendation: 'BUY' | 'HOLD' | 'SELL' | 'AVOID';
  confidence: number;
  score: number;
  reasoning: {
    primary: string;
    secondary: string[];
    risks: string[];
    opportunities: string[];
  };
  financial: {
    expectedReturn: number;
    riskLevel: string;
    timeHorizon: string;
    investmentType: string;
    targetYield: number;
  };
  market: {
    marketTiming: string;
    marketCycle: string;
    competitionLevel: string;
    demandForecast: string;
  };
}

interface PricePrediction {
  currentPrice: number;
  predictions: {
    oneMonth: { price: number; confidence: number };
    threeMonths: { price: number; confidence: number };
    sixMonths: { price: number; confidence: number };
    oneYear: { price: number; confidence: number };
    twoYears: { price: number; confidence: number };
    fiveYears: { price: number; confidence: number };
  };
  scenarios: {
    optimistic: { price: number; probability: number };
    realistic: { price: number; probability: number };
    pessimistic: { price: number; probability: number };
  };
  confidence: {
    overall: number;
    dataQuality: number;
    modelAccuracy: number;
    marketStability: number;
  };
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<PropertyAnalytics | null>(null);
  const [recommendation, setRecommendation] = useState<InvestmentRecommendation | null>(null);
  const [pricePrediction, setPricePrediction] = useState<PricePrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'investment' | 'predictions' | 'insights'>('overview');

  // Mock property data for demonstration
  const mockProperty = {
    id: 'prop_001',
    address: '123 Example Street',
    postcode: 'SW1A 1AA',
    propertyType: 'Flat',
    bedrooms: 2,
    bathrooms: 1,
    price: 650000,
    area: 800
  };

  useEffect(() => {
    if (selectedProperty) {
      loadAnalytics();
    }
  }, [selectedProperty]);

  const loadAnalytics = async () => {
    if (!selectedProperty) return;

    setIsLoading(true);
    try {
      // Load property analytics
      const analyticsResponse = await fetch('/api/analytics/property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyData: selectedProperty,
          postcode: selectedProperty.postcode
        })
      });
      const analyticsData = await analyticsResponse.json();
      setAnalytics(analyticsData.analytics);

      // Load investment recommendation
      const recommendationResponse = await fetch('/api/analytics/investment-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyData: selectedProperty,
          postcode: selectedProperty.postcode,
          region: 'London'
        })
      });
      const recommendationData = await recommendationResponse.json();
      setRecommendation(recommendationData.recommendation);

      // Load price prediction
      const predictionResponse = await fetch('/api/analytics/predictions/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyData: selectedProperty
        })
      });
      const predictionData = await predictionResponse.json();
      setPricePrediction(predictionData.prediction);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return 'text-green-600 bg-green-100';
      case 'HOLD': return 'text-yellow-600 bg-yellow-100';
      case 'SELL': return 'text-orange-600 bg-orange-100';
      case 'AVOID': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getInvestmentGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!selectedProperty) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Analytics Dashboard</h2>
          <p className="text-gray-600 mb-6">Select a property to view comprehensive analytics and insights</p>
          
          <button
            onClick={() => setSelectedProperty(mockProperty)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load Demo Property
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Analytics</h1>
            <p className="text-gray-600">{selectedProperty.address}, {selectedProperty.postcode}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAnalytics}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Property Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Current Price</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedProperty.price)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <Home className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Property Type</p>
                <p className="text-xl font-bold text-gray-900">{selectedProperty.propertyType}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Bedrooms</p>
                <p className="text-xl font-bold text-gray-900">{selectedProperty.bedrooms}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Postcode</p>
                <p className="text-xl font-bold text-gray-900">{selectedProperty.postcode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'investment', label: 'Investment', icon: Target },
              { id: 'predictions', label: 'Predictions', icon: TrendingUp },
              { id: 'insights', label: 'Insights', icon: AlertTriangle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && analytics && (
            <div className="space-y-6">
              {/* Market Analysis */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Local Average Price</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.market.localAveragePrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Regional Average Price</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.market.regionalAveragePrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Market Trend</p>
                    <p className="text-2xl font-bold text-gray-900 capitalize">{analytics.market.marketTrend}</p>
                  </div>
                </div>
              </div>

              {/* Investment Metrics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Rental Yield</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(analytics.investment.rentalYield)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Capital Growth</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(analytics.investment.capitalGrowth)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Return</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(analytics.investment.totalReturn)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Investment Grade</p>
                    <p className={`text-2xl font-bold ${getInvestmentGradeColor(analytics.investment.investmentGrade)}`}>
                      {analytics.investment.investmentGrade}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Scores */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Scores</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Walk Score</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.location.walkScore}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Transport Score</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.location.transportScore}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Amenity Score</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.location.amenityScore}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Overall Score</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.location.overallLocationScore}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Investment Tab */}
          {activeTab === 'investment' && recommendation && (
            <div className="space-y-6">
              {/* Recommendation */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Investment Recommendation</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(recommendation.recommendation)}`}>
                    {recommendation.recommendation}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Confidence</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(recommendation.confidence)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Score</p>
                    <p className="text-2xl font-bold text-gray-900">{recommendation.score.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Expected Return</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(recommendation.financial.expectedReturn)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Primary Reason</h4>
                  <p className="text-gray-600 mb-4">{recommendation.reasoning.primary}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {recommendation.reasoning.secondary.map((strength, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Risks</h4>
                      <ul className="space-y-1">
                        {recommendation.reasoning.risks.map((risk, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Analysis */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Risk Level</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">{recommendation.financial.riskLevel}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Time Horizon</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">{recommendation.financial.timeHorizon}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Investment Type</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">{recommendation.financial.investmentType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Target Yield</p>
                    <p className="text-xl font-bold text-gray-900">{formatPercentage(recommendation.financial.targetYield)}</p>
                  </div>
                </div>
              </div>

              {/* Market Conditions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Conditions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Market Timing</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">{recommendation.market.marketTiming}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Market Cycle</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">{recommendation.market.marketCycle}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Competition Level</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">{recommendation.market.competitionLevel}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Demand Forecast</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">{recommendation.market.demandForecast}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Predictions Tab */}
          {activeTab === 'predictions' && pricePrediction && (
            <div className="space-y-6">
              {/* Price Predictions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Predictions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(pricePrediction.predictions).map(([period, prediction]: [string, any]) => (
                    <div key={period} className="text-center">
                      <p className="text-sm font-medium text-gray-500 mb-1 capitalize">{period.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(prediction.price)}</p>
                      <p className="text-sm text-gray-600">Confidence: {formatPercentage(prediction.confidence)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scenarios */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Scenarios</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(pricePrediction.scenarios).map(([scenario, data]: [string, any]) => (
                    <div key={scenario} className="text-center">
                      <p className="text-sm font-medium text-gray-500 mb-1 capitalize">{scenario}</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.price)}</p>
                      <p className="text-sm text-gray-600">Probability: {formatPercentage(data.probability * 100)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confidence Metrics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction Confidence</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Overall</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(pricePrediction.confidence.overall)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Data Quality</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(pricePrediction.confidence.dataQuality)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Model Accuracy</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(pricePrediction.confidence.modelAccuracy)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Market Stability</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(pricePrediction.confidence.marketStability)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && analytics && (
            <div className="space-y-6">
              {/* SWOT Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Strengths</h3>
                  <ul className="space-y-2">
                    {analytics.insights.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Weaknesses</h3>
                  <ul className="space-y-2">
                    {analytics.insights.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Opportunities</h3>
                  <ul className="space-y-2">
                    {analytics.insights.opportunities.map((opportunity, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        {opportunity}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                  <ul className="space-y-2">
                    {analytics.insights.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600">
                        <Target className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
