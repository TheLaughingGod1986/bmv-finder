'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Home, 
  Bed, 
  Ruler, 
  Zap, 
  Calendar,
  PoundSterling,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  MapPin,
  Clock,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Star,
  Award,
  Lightbulb,
  Info,
  Download,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';

interface ComparableProperty {
  address: string;
  price: number;
  date: string;
  bedrooms: number;
  floorArea: number;
  epcRating: string;
  distance: number;
  similarity: number;
  adjustedPrice: number;
}

interface GrowthPrediction {
  year: number;
  value: number;
  growth: number;
  confidence: number;
  factors: string[];
}

interface DealAnalysisData {
  property_info: {
    address: string;
    bedrooms: number | null;
    epc_rating: string | null;
    floor_area_m2: number | null;
    property_type: string | null;
    construction_year?: string;
    current_energy_rating?: string;
    potential_energy_rating?: string;
    epc_date?: string;
    certificate_id?: string;
  } | null;
  sold_prices: Array<{
    price: number;
    date: string;
    property_type: string;
    new_build: boolean;
    estate_type: string;
    transaction_type: string;
  }>;
  hpi_data: Array<{
    date: string;
    hpi_value: number;
    hpi_change: number;
    region: string;
  }>;
  deal_metrics: {
    last_sold_price: number | null;
    hpi_adjusted_value: number | null;
    current_value_estimate: number | null;
    price_per_sqm: number | null;
    price_per_bedroom: number | null;
    deal_score: number;
    deal_rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Overpriced';
    analysis: string[];
  };
  market_insights: {
    average_price_per_sqm: number | null;
    average_price_per_bedroom: number | null;
    price_trend: 'rising' | 'falling' | 'stable';
    market_volatility: 'low' | 'medium' | 'high';
  };
}

interface AdvancedDealAnalysisCardProps {
  data: DealAnalysisData;
  loading?: boolean;
}

export default function AdvancedDealAnalysisCard({ data, loading = false }: AdvancedDealAnalysisCardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'comparables' | 'predictions' | 'market' | 'insights'>('overview');
  const [showDetailedComparables, setShowDetailedComparables] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'2y' | '5y' | '10y'>('5y');

  // Mock comparable properties - replace with real API call
  const [comparables, setComparables] = useState<ComparableProperty[]>([]);
  const [growthPredictions, setGrowthPredictions] = useState<GrowthPrediction[]>([]);

  useEffect(() => {
    // Generate mock comparables
    const mockComparables: ComparableProperty[] = [
      {
        address: "12 Oak Street, LE13 0EJ",
        price: 185000,
        date: "2024-01-15",
        bedrooms: 6,
        floorArea: 95,
        epcRating: "D",
        distance: 0.2,
        similarity: 92,
        adjustedPrice: 192000
      },
      {
        address: "25 Maple Avenue, LE13 0EJ",
        price: 175000,
        date: "2023-11-20",
        bedrooms: 5,
        floorArea: 88,
        epcRating: "C",
        distance: 0.5,
        similarity: 87,
        adjustedPrice: 181000
      },
      {
        address: "8 Elm Road, LE13 0EJ",
        price: 195000,
        date: "2023-09-10",
        bedrooms: 6,
        floorArea: 102,
        epcRating: "B",
        distance: 0.3,
        similarity: 85,
        adjustedPrice: 198000
      }
    ];

    // Generate growth predictions
    const currentValue = data.deal_metrics.current_value_estimate || data.deal_metrics.hpi_adjusted_value || 200000;
    const annualGrowthRate = 0.04; // 4% annual growth
    
    const predictions: GrowthPrediction[] = [
      {
        year: 2,
        value: Math.round(currentValue * Math.pow(1 + annualGrowthRate, 2)),
        growth: Math.round((Math.pow(1 + annualGrowthRate, 2) - 1) * 100),
        confidence: 85,
        factors: ['Strong local market', 'Transport improvements', 'School catchment']
      },
      {
        year: 5,
        value: Math.round(currentValue * Math.pow(1 + annualGrowthRate, 5)),
        growth: Math.round((Math.pow(1 + annualGrowthRate, 5) - 1) * 100),
        confidence: 75,
        factors: ['Regional development', 'Infrastructure investment', 'Demographic trends']
      },
      {
        year: 10,
        value: Math.round(currentValue * Math.pow(1 + annualGrowthRate, 10)),
        growth: Math.round((Math.pow(1 + annualGrowthRate, 10) - 1) * 100),
        confidence: 65,
        factors: ['Long-term market trends', 'Economic stability', 'Property cycle']
      }
    ];

    setComparables(mockComparables);
    setGrowthPredictions(predictions);
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const getDealRatingColor = (rating: string) => {
    switch (rating) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'Good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Poor': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Overpriced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDealRatingIcon = (rating: string) => {
    switch (rating) {
      case 'Excellent': return <Award className="h-4 w-4" />;
      case 'Good': return <CheckCircle className="h-4 w-4" />;
      case 'Fair': return <Target className="h-4 w-4" />;
      case 'Poor': return <AlertTriangle className="h-4 w-4" />;
      case 'Overpriced': return <XCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'falling': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getEPCColor = (rating: string) => {
    switch (rating) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-blue-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'E': return 'bg-red-500';
      case 'F': return 'bg-red-600';
      case 'G': return 'bg-red-700';
      default: return 'bg-gray-500';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-900">Advanced Deal Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDealRatingColor(data.deal_metrics.deal_rating)}`}>
            <div className="flex items-center gap-1">
              {getDealRatingIcon(data.deal_metrics.deal_rating)}
              {data.deal_metrics.deal_rating}
            </div>
          </span>
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {[
          { id: 'overview', label: 'Overview', icon: Target },
          { id: 'comparables', label: 'Comparables', icon: BarChart3 },
          { id: 'predictions', label: 'Predictions', icon: TrendingUp },
          { id: 'market', label: 'Market', icon: Building },
          { id: 'insights', label: 'Insights', icon: Lightbulb }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content based on active tab */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Deal Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Deal Score</span>
                <span className="text-sm font-bold">{data.deal_metrics.deal_score}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${data.deal_metrics.deal_score}%`,
                    backgroundColor: data.deal_metrics.deal_score >= 80 ? '#10B981' : 
                                    data.deal_metrics.deal_score >= 60 ? '#F59E0B' : '#EF4444'
                  }}
                ></div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <PoundSterling className="h-3 w-3" />
                  Last Sold
                </div>
                <div className="font-bold text-lg">
                  {formatCurrency(data.deal_metrics.last_sold_price)}
                </div>
                {data.sold_prices.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {formatDate(data.sold_prices[0].date)}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-4 space-y-2 border border-blue-200">
                <div className="flex items-center gap-1 text-sm text-blue-600">
                  <Target className="h-3 w-3" />
                  Current Estimate
                </div>
                <div className="font-bold text-lg text-blue-700">
                  {formatCurrency(data.deal_metrics.current_value_estimate)}
                </div>
                {data.deal_metrics.current_value_estimate && data.deal_metrics.last_sold_price && (
                  <div className={`text-xs font-medium ${
                    data.deal_metrics.current_value_estimate > data.deal_metrics.last_sold_price 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {((data.deal_metrics.current_value_estimate - data.deal_metrics.last_sold_price) / data.deal_metrics.last_sold_price * 100).toFixed(1)}% change
                  </div>
                )}
              </div>

              <div className="bg-green-50 rounded-lg p-4 space-y-2 border border-green-200">
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Ruler className="h-3 w-3" />
                  Price per m²
                </div>
                <div className="font-bold text-lg text-green-700">
                  {formatCurrency(data.deal_metrics.price_per_sqm)}
                </div>
                <div className="text-xs text-gray-500">per square meter</div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 space-y-2 border border-purple-200">
                <div className="flex items-center gap-1 text-sm text-purple-600">
                  <Bed className="h-3 w-3" />
                  Price per Bed
                </div>
                <div className="font-bold text-lg text-purple-700">
                  {formatCurrency(data.deal_metrics.price_per_bedroom)}
                </div>
                <div className="text-xs text-gray-500">per bedroom</div>
              </div>
            </div>

            {/* Property Details */}
            {data.property_info && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Property Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Bedrooms:</span>
                    <p className="font-medium">{data.property_info.bedrooms || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Floor Area:</span>
                    <p className="font-medium">{data.property_info.floor_area_m2 || 'N/A'} m²</p>
                  </div>
                  <div>
                    <span className="text-gray-600">EPC Rating:</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${getEPCColor(data.property_info.epc_rating || '')}`}></div>
                      <span className="font-medium">{data.property_info.epc_rating || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Property Type:</span>
                    <p className="font-medium">{data.property_info.property_type || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Comparables Tab */}
        {activeTab === 'comparables' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Comparable Properties</h4>
              <button
                onClick={() => setShowDetailedComparables(!showDetailedComparables)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                {showDetailedComparables ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showDetailedComparables ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            <div className="space-y-4">
              {comparables.map((comp, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold text-gray-900">{comp.address}</h5>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium text-gray-600">{comp.similarity}% match</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Price:</span>
                          <p className="font-semibold">{formatCurrency(comp.price)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Adjusted:</span>
                          <p className="font-semibold text-blue-600">{formatCurrency(comp.adjustedPrice)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Bedrooms:</span>
                          <p className="font-medium">{comp.bedrooms}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Distance:</span>
                          <p className="font-medium">{comp.distance}km</p>
                        </div>
                      </div>

                      {showDetailedComparables && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Floor Area:</span>
                              <p className="font-medium">{comp.floorArea} m²</p>
                            </div>
                            <div>
                              <span className="text-gray-600">EPC Rating:</span>
                              <div className="flex items-center gap-1">
                                <div className={`w-3 h-3 rounded-full ${getEPCColor(comp.epcRating)}`}></div>
                                <span className="font-medium">{comp.epcRating}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Sale Date:</span>
                              <p className="font-medium">{formatDate(comp.date)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparable Summary */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h5 className="font-semibold text-blue-900 mb-2">Comparable Analysis</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Average Price:</span>
                  <p className="font-semibold text-blue-900">
                    {formatCurrency(comparables.reduce((sum, c) => sum + c.price, 0) / comparables.length)}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Average Adjusted:</span>
                  <p className="font-semibold text-blue-900">
                    {formatCurrency(comparables.reduce((sum, c) => sum + c.adjustedPrice, 0) / comparables.length)}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Price Range:</span>
                  <p className="font-semibold text-blue-900">
                    {formatCurrency(Math.min(...comparables.map(c => c.price)))} - {formatCurrency(Math.max(...comparables.map(c => c.price)))}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Avg Similarity:</span>
                  <p className="font-semibold text-blue-900">
                    {Math.round(comparables.reduce((sum, c) => sum + c.similarity, 0) / comparables.length)}%
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Growth Predictions</h4>
              <div className="flex gap-2">
                {(['2y', '5y', '10y'] as const).map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedTimeframe === timeframe
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {growthPredictions.map((prediction, index) => (
                <div key={prediction.year} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h5 className="text-lg font-semibold text-gray-900">{prediction.year} Year Prediction</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prediction.confidence)} bg-opacity-10`}>
                        {prediction.confidence}% confidence
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{formatCurrency(prediction.value)}</div>
                      <div className={`text-sm font-medium ${prediction.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {prediction.growth > 0 ? '+' : ''}{prediction.growth}% growth
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h6 className="font-medium text-gray-700">Growth Factors:</h6>
                    <div className="flex flex-wrap gap-2">
                      {prediction.factors.map((factor, factorIndex) => (
                        <span key={factorIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Prediction Disclaimer */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  These predictions are based on historical HPI data and market trends. Actual results may vary due to economic conditions, local developments, and other factors.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Market Tab */}
        {activeTab === 'market' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h4 className="text-lg font-semibold text-gray-900">Market Analysis</h4>

            {/* Market Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">Market Trends</h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price Trend:</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(data.market_insights.price_trend)}
                      <span className="text-sm font-medium capitalize">{data.market_insights.price_trend}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Market Volatility:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      data.market_insights.market_volatility === 'low' ? 'bg-green-100 text-green-800' :
                      data.market_insights.market_volatility === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {data.market_insights.market_volatility.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-3">Market Averages</h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">Avg Price per m²:</span>
                    <span className="font-semibold text-blue-900">
                      {formatCurrency(data.market_insights.average_price_per_sqm)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">Avg Price per Bedroom:</span>
                    <span className="font-semibold text-blue-900">
                      {formatCurrency(data.market_insights.average_price_per_bedroom)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* HPI Data */}
            {data.hpi_data.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h5 className="font-semibold text-green-900 mb-3">HPI Trend (Last 6 Months)</h5>
                <div className="space-y-2">
                  {data.hpi_data.slice(0, 6).map((hpi, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-green-700">{formatDate(hpi.date)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-900">{hpi.hpi_value.toFixed(2)}</span>
                        <span className={`text-xs font-medium ${hpi.hpi_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {hpi.hpi_change >= 0 ? '+' : ''}{hpi.hpi_change.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h4 className="text-lg font-semibold text-gray-900">Investment Insights</h4>

            {/* Analysis Breakdown */}
            <div className="space-y-3">
              {data.deal_metrics.analysis.map((analysis, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5" />
                    <p className="text-sm text-gray-700">{analysis}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Investment Recommendations */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <h5 className="font-semibold text-blue-900 mb-3">Investment Recommendations</h5>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• Consider this property for {data.deal_metrics.deal_score >= 80 ? 'immediate investment' : data.deal_metrics.deal_score >= 60 ? 'strategic investment' : 'long-term hold'}</p>
                <p>• Monitor local market conditions and HPI trends</p>
                <p>• Compare with similar properties in the area</p>
                <p>• Consider energy efficiency improvements for better EPC rating</p>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h5 className="font-semibold text-red-900 mb-3">Risk Assessment</h5>
              <div className="space-y-2 text-sm text-red-800">
                <p>• Market volatility: {data.market_insights.market_volatility}</p>
                <p>• Price trend: {data.market_insights.price_trend}</p>
                <p>• Deal score: {data.deal_metrics.deal_score}/100</p>
                <p>• Always conduct thorough due diligence before investing</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 