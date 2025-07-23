'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './SimpleCard';
import Button from './Button';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  BarChart3,
  Zap,
  Shield,
  Home,
  Clock,
  School,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface MLValuationResult {
  currentValue: number;
  confidence: number;
  valueRange: { min: number; max: number };
  randomForestPrediction: number;
  lstmPrediction: number;
  ensemblePrediction: number;
  featureImportance: {
    postcode: number;
    bedrooms: number;
    floorArea: number;
    epcRating: number;
    interestRates: number;
    inflation: number;
    timeToSell: number;
  };
  marketInsights: {
    trend: 'rising' | 'falling' | 'stable';
    volatility: 'low' | 'medium' | 'high';
    seasonality: number;
    forecast: {
      threeMonth: number;
      sixMonth: number;
      twelveMonth: number;
    };
  };
  signalImpacts: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
}

interface MLValuationCardProps {
  postcode: string;
  houseNumber: string;
  onAddToPortfolio?: (valuation: MLValuationResult) => void;
}

export default function MLValuationCard({ postcode, houseNumber, onAddToPortfolio }: MLValuationCardProps) {
  const [valuation, setValuation] = useState<MLValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const generateMLValuation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ml-valuation?postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(houseNumber)}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate ML valuation');
      }

      const data = await response.json();
      setValuation(data.valuation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          ML-Enhanced Valuation
        </CardTitle>
        <div className="text-sm text-gray-600">
          Advanced machine learning model using Random Forest, LSTM time-series analysis, and external signals
        </div>
      </CardHeader>
      
      <CardContent>
        {!valuation && !loading && (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Generate an ML-enhanced property valuation using advanced algorithms and external data signals
            </p>
            <Button onClick={generateMLValuation} className="bg-purple-600 hover:bg-purple-700">
              <Brain className="w-4 h-4 mr-2" />
              Generate ML Valuation
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing property with machine learning models...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={generateMLValuation} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {valuation && (
          <div className="space-y-6">
            {/* Main Valuation Result */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {formatCurrency(valuation.currentValue)}
                </h3>
                <p className="text-gray-600 mb-4">
                  Value Range: {formatCurrency(valuation.valueRange.min)} - {formatCurrency(valuation.valueRange.max)}
                </p>
                
                <div className="flex items-center justify-center gap-4 mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(valuation.confidence)} bg-gray-100`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {getConfidenceLabel(valuation.confidence)} Confidence
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100">
                    <Target className="w-3 h-3 mr-1" />
                    {formatPercentage(valuation.confidence)}
                  </span>
                </div>

                {onAddToPortfolio && (
                  <Button 
                    onClick={() => onAddToPortfolio(valuation)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Add to Portfolio
                  </Button>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'models', label: 'ML Models', icon: Brain },
                  { id: 'features', label: 'Features', icon: Target },
                  { id: 'signals', label: 'Signals', icon: Activity }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Market Insights */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Market Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Trend</span>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(valuation.marketInsights.trend)}
                          <span className="capitalize">{valuation.marketInsights.trend}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Volatility</span>
                        <span className={`capitalize ${getVolatilityColor(valuation.marketInsights.volatility)}`}>
                          {valuation.marketInsights.volatility}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Seasonality</span>
                        <span>{formatPercentage(valuation.marketInsights.seasonality)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Forecast */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Price Forecast
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">3 Months</span>
                        <span className="font-medium">{formatCurrency(valuation.marketInsights.forecast.threeMonth)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">6 Months</span>
                        <span className="font-medium">{formatCurrency(valuation.marketInsights.forecast.sixMonth)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">12 Months</span>
                        <span className="font-medium">{formatCurrency(valuation.marketInsights.forecast.twelveMonth)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'models' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Random Forest */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Random Forest
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600 mb-2">
                        {formatCurrency(valuation.randomForestPrediction)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Handles nonlinear effects and feature interactions
                      </p>
                    </CardContent>
                  </Card>

                  {/* LSTM */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        LSTM
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600 mb-2">
                        {formatCurrency(valuation.lstmPrediction)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Time-series analysis with seasonality
                      </p>
                    </CardContent>
                  </Card>

                  {/* Ensemble */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Ensemble
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {formatCurrency(valuation.ensemblePrediction)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Combined prediction (60% RF, 40% LSTM)
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Feature Importance</CardTitle>
                    <div className="text-sm text-gray-600">
                      How much each factor influences the valuation
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(valuation.featureImportance)
                      .sort(([,a], [,b]) => b - a)
                      .map(([feature, importance]) => (
                        <div key={feature} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">
                              {feature.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-sm text-gray-600">
                              {formatPercentage(importance)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${importance * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'signals' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Positive Signals */}
                  {valuation.signalImpacts.positive.length > 0 && (
                    <Card className="border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          Positive Factors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {valuation.signalImpacts.positive.map((signal, index) => (
                            <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {signal}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Negative Signals */}
                  {valuation.signalImpacts.negative.length > 0 && (
                    <Card className="border-red-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                          <AlertTriangle className="w-4 h-4" />
                          Risk Factors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {valuation.signalImpacts.negative.map((signal, index) => (
                            <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {signal}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Neutral Signals */}
                  {valuation.signalImpacts.neutral.length > 0 && (
                    <Card className="border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                          <Info className="w-4 h-4" />
                          Neutral Factors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {valuation.signalImpacts.neutral.map((signal, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {signal}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 