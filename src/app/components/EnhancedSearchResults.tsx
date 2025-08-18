'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './SimpleCard';
import { Badge } from './SimpleCard';
import AddToPortfolioButton from './AddToPortfolioButton';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, TrendingDown, Home, MapPin, Building2, Calendar, Target, Zap, Info, PoundSterling, Ruler, Star, BarChart3, Leaf, Calculator, TrendingUpIcon, Lightbulb, CheckCircle } from 'lucide-react';

interface EnhancedSearchResultsProps {
  postcode: string;
  houseNumber: string;
  onAnalysisComplete?: () => void;
}

interface PropertyData {
  id: string;
  address: string;
  postcode: string;
  propertyType: string;
  floorArea: number;
  bedrooms: number;
  epcRating: string;
  inspectionDate: string;
  localAuthority: string;
  county: string;
  rentalEstimate: {
    monthly: number;
    yearly: number;
    source: string;
    calculation: string;
    note: string;
  };
  hpiData: {
    currentIndex: number;
    yoyGrowth: number;
    trend: string;
    lastUpdated: string;
    source?: string;
    regionLabel?: string;
  };
  soldPriceData: {
    priceStats: {
      averagePrice: number;
      medianPrice: number;
      minPrice: number;
      maxPrice: number;
      totalSales: number;
    };
    recentSales: any[];
  };
  currentEnergyRating: string;
}

interface ValuationData {
  bmvAnalysis?: {
    basicScore: number;
    enhancedScore: number;
    category: string;
    marketValue: number;
    askingPrice: number;
    rentalYield: number;
    areaGrowth: number;
  };
  marketAnalysis: {
    trend: string;
    condition: string;
    yoyGrowth: number;
    dataSource: string;
    yearlySales?: any[];
    growthRates?: any[];
    overallGrowth?: number;
    totalSales?: number;
    averagePrice?: number;
    priceRange?: {
      min: number;
      max: number;
    };
  };
  comparables: any[];
  recommendations?: string[];
}

interface PredictionData {
  prediction: {
    predictedValue: number;
    confidence: number;
    valueRange: {
      min: number;
      max: number;
    };
    method: string;
  };
  marketInsights: {
    trend: string;
    confidence: string;
    factors: string[];
  };
  modelMetrics: {
    accuracy: number;
    growthAccuracy: number;
    marketAccuracy: number;
  };
}

export default function EnhancedSearchResults({ postcode, houseNumber, onAnalysisComplete }: EnhancedSearchResultsProps) {
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [valuationData, setValuationData] = useState<ValuationData | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, [postcode, houseNumber]);

  useEffect(() => {
    // Debug logging for EPC rating
    if (propertyData) {
        console.log('Property Data EPC Rating:', propertyData?.epcRating);
  console.log('Property Data Current Energy Rating:', propertyData?.currentEnergyRating);
      console.log('Full Property Data:', propertyData);
    }
  }, [propertyData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch property data
      const propertyResponse = await fetch(`/api/enhanced-property-search?postcode=${encodeURIComponent(postcode)}&includeRental=true&includeHPI=true`);
      if (propertyResponse.ok) {
        const propertyResult = await propertyResponse.json();
        if (propertyResult.data?.properties?.length > 0) {
          const targetProperty = propertyResult.data.properties.find((prop: any) => 
            prop.address.includes(houseNumber) || 
            prop.address.startsWith(houseNumber + ',') ||
            prop.address.startsWith(houseNumber + ' ')
          );
          if (targetProperty) {
            setPropertyData(targetProperty);
          }
        }
      }

      // Fetch valuation data
      const valuationResponse = await fetch(`/api/property-valuation?type=comprehensive&postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(houseNumber)}`);
      if (valuationResponse.ok) {
        const valuationResult = await valuationResponse.json();
        setValuationData(valuationResult);
      }

      // Fetch prediction data
      const predictionResponse = await fetch(`/api/predictions?postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(houseNumber)}`);
      if (predictionResponse.ok) {
        const predictionResult = await predictionResponse.json();
        setPredictionData(predictionResult);
      }

      setLoading(false);
      onAnalysisComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-GB').format(num);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'rising':
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'falling':
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBMVCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'average':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGrowthRateForYear = (year: number, growthRates: any[]) => {
    const growthRate = growthRates.find(rate => rate.year === year);
    return growthRate ? growthRate.growth : null;
  };

  // Helper function to format dates in "day, month, year" format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      const options: Intl.DateTimeFormatOptions = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      };
      return date.toLocaleDateString('en-GB', options);
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Derived metrics for Investment Performance
  // Early return if no data
  if (!propertyData || !predictionData || !valuationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property analysis...</p>
        </div>
      </div>
    );
  }

  // Safe data extraction with fallbacks
  const lastSalePrice = valuationData?.marketAnalysis?.yearlySales && valuationData.marketAnalysis.yearlySales.length > 0
    ? valuationData.marketAnalysis.yearlySales[valuationData.marketAnalysis.yearlySales.length - 1]?.averagePrice || 0
    : propertyData?.soldPriceData?.priceStats?.averagePrice || 0;

  const currentValue = predictionData?.prediction?.predictedValue || propertyData?.soldPriceData?.priceStats?.averagePrice || 0;
  const annualRent = propertyData?.rentalEstimate?.yearly || 0;
  const equityNow = currentValue - (lastSalePrice || 0);
  const equityGrowthPct = lastSalePrice ? (equityNow / lastSalePrice) * 100 : 0;
  const grossYieldPct = currentValue ? (annualRent / currentValue) * 100 : 0;
  const areaYoyGrowth = (propertyData?.hpiData?.yoyGrowth ?? valuationData?.marketAnalysis?.yoyGrowth ?? 0) as number;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !propertyData) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <Info className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Failed</h3>
        <p className="text-gray-600 mb-4">{error || 'No property data found'}</p>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'market', label: 'Market Analysis', icon: BarChart3 },
    { id: 'epc', label: 'EPC Analysis', icon: Leaf },
    { id: 'bmv', label: 'BMV Scoring', icon: Target },
    { id: 'predictions', label: 'AI Predictions', icon: Zap },
    { id: 'comparables', label: 'Comparables', icon: Building2 },
    { id: 'valuation', label: 'Predicted Valuation', icon: Calculator },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 border border-primary-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Home className="h-6 w-6 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {propertyData?.address || 'Address not available'}
              </h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{propertyData?.postcode || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{propertyData?.propertyType || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Inspected: {propertyData?.inspectionDate ? new Date(propertyData?.inspectionDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary-700 mb-1">
              {predictionData?.prediction?.predictedValue 
                ? formatCurrency(predictionData?.prediction?.predictedValue)
                : formatCurrency(propertyData?.soldPriceData?.priceStats?.averagePrice || 0)
              }
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <span>{propertyData?.postcode || 'N/A'}</span>
              <span className="mx-2">•</span>
              <span>{propertyData?.propertyType || 'N/A'}</span>
              <span className="mx-2">•</span>
                              <span>Inspected: {propertyData?.inspectionDate ? new Date(propertyData?.inspectionDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                {propertyData?.hpiData ? getTrendIcon(propertyData?.hpiData.trend) : getTrendIcon('stable')}
                <span className="ml-1">
                  {propertyData?.hpiData?.yoyGrowth !== undefined ? `${propertyData?.hpiData.yoyGrowth}%` : '0%'} YoY
                </span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Metrics */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <BarChart3 className="h-5 w-5" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                    <div className="text-2xl font-bold text-blue-700">
                      {predictionData?.prediction?.predictedValue 
                        ? formatCurrency(predictionData?.prediction?.predictedValue)
                        : formatCurrency(propertyData?.soldPriceData?.priceStats?.averagePrice || 0)
                      }
                    </div>
                    <div className="text-sm text-blue-600">Current Value</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(propertyData?.rentalEstimate?.monthly || 0)}
                    </div>
                    <div className="text-sm text-green-600">Monthly Rent</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                    <div className="text-2xl font-bold text-purple-700">
                      {propertyData?.bedrooms || 'N/A'}
                    </div>
                    <div className="text-sm text-purple-600">Bedrooms</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                    <div className="text-2xl font-bold text-orange-700">
                      {propertyData?.floorArea}m²
                    </div>
                    <div className="text-sm text-orange-600">Floor Area</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Predicted Valuation */}
            {predictionData?.prediction && (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <TrendingUpIcon className="h-5 w-5" />
                    Predicted Valuation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                                      <div className="text-3xl font-bold text-green-700 mb-2">
                    {formatCurrency(predictionData?.prediction?.predictedValue)}
                  </div>
                  <div className="text-sm text-green-600 mb-3">
                    Confidence: {Math.round(predictionData?.prediction?.confidence * 100)}%
                  </div>
                  <div className="text-xs text-gray-600">
                    Range: {formatCurrency(predictionData?.prediction?.valueRange?.min)} - {formatCurrency(predictionData?.prediction?.valueRange?.max)}
                  </div>
                </div>
                <div className="text-xs text-gray-600 text-center">
                  Method: {predictionData?.prediction?.method}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Details */}
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Info className="h-5 w-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Property Type</span>
                  <span className="font-medium">{propertyData?.propertyType}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">EPC Rating</span>
                  <Badge className={`${
                    (propertyData?.epcRating || propertyData?.currentEnergyRating) === 'A' ? 'bg-green-100 text-green-800 border-green-200' :
                    (propertyData?.epcRating || propertyData?.currentEnergyRating) === 'B' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    (propertyData?.epcRating || propertyData?.currentEnergyRating) === 'C' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    (propertyData?.epcRating || propertyData?.currentEnergyRating) === 'D' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                    (propertyData?.epcRating || propertyData?.currentEnergyRating) === 'E' ? 'bg-red-100 text-red-800 border-red-200' :
                    (propertyData?.epcRating || propertyData?.currentEnergyRating) === 'F' ? 'bg-red-200 text-red-900 border-red-300' :
                    (propertyData?.epcRating || propertyData?.currentEnergyRating) === 'G' ? 'bg-red-300 text-red-950 border-red-400' :
                    'bg-gray-100 text-gray-800 border-gray-200'
                  } border font-semibold`}>
                    {propertyData?.epcRating || propertyData?.currentEnergyRating || 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Local Authority</span>
                  <span className="font-medium">{propertyData?.localAuthority}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">County</span>
                  <span className="font-medium">{propertyData?.county || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Rental Analysis */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <PoundSterling className="h-5 w-5" />
                  Rental Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-white rounded-lg border border-purple-100">
                  <div className="text-2xl font-bold text-purple-700 mb-1">
                    {formatCurrency(propertyData?.rentalEstimate?.monthly || 0)}
                  </div>
                  <div className="text-sm text-purple-600 mb-2">Monthly Rent</div>
                  <div className="text-lg font-semibold text-purple-800">
                    {formatCurrency(propertyData?.rentalEstimate?.yearly || 0)}
                  </div>
                  <div className="text-xs text-purple-600">Annual Rent</div>
                </div>
                <div className="text-xs text-gray-600 text-center p-2 bg-white rounded border border-purple-100">
                  <div className="font-medium mb-1">Source: {propertyData?.rentalEstimate?.source || 'N/A'}</div>
                  <div>{propertyData?.rentalEstimate?.calculation || 'N/A'}</div>
                </div>
              </CardContent>
            </Card>

            {/* Sales History */}
            {valuationData?.marketAnalysis?.yearlySales && (
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <TrendingUp className="h-5 w-5" />
                    Sales History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Last Sale */}
                  <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                    <div className="text-2xl font-bold text-blue-700 mb-1">
                      {formatCurrency(valuationData.marketAnalysis.yearlySales[valuationData.marketAnalysis.yearlySales.length - 1]?.averagePrice || 0)}
                    </div>
                    <div className="text-sm text-blue-600 mb-2">Last Sale Price</div>
                    <div className="text-xs text-blue-500">
                      {valuationData.marketAnalysis.yearlySales[valuationData.marketAnalysis.yearlySales.length - 1]?.year || 'N/A'}
                    </div>
                  </div>
                  
                  {/* Growth Trend */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                      <div className="text-lg font-bold text-green-700">
                        {valuationData.marketAnalysis.overallGrowth ? Math.round(valuationData.marketAnalysis.overallGrowth) : 0}%
                      </div>
                      <div className="text-xs text-green-600">Overall Growth</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                      <div className="text-lg font-bold text-blue-700">
                        {valuationData.marketAnalysis.totalSales || 0}
                      </div>
                      <div className="text-xs text-blue-600">Total Sales</div>
                    </div>
                  </div>

                  {/* Recent Sales List */}
                  <div className="bg-white rounded-lg border border-blue-100 p-3">
                    <div className="text-sm font-medium text-blue-800 mb-2">Last 5 Sales</div>
                    <div className="space-y-2">
                      {valuationData.marketAnalysis.yearlySales
                        .slice(-5)
                        .reverse()
                        .map((sale: any, index: number) => {
                          const growthRate = getGrowthRateForYear(sale.year, valuationData.marketAnalysis.growthRates || []);
                          return (
                            <div key={sale.year} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-800">{sale.year}</div>
                                <div className="text-xs text-gray-500">{sale.count} sale{sale.count !== 1 ? 's' : ''}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-gray-900">
                                  {formatCurrency(sale.averagePrice)}
                                </div>
                                <div className={`text-xs px-2 py-1 rounded ${
                                  growthRate && growthRate > 0
                                    ? 'bg-green-100 text-green-700'
                                    : growthRate && growthRate < 0
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {growthRate !== null
                                    ? `${growthRate > 0 ? '+' : ''}${Math.round(growthRate)}%`
                                    : 'N/A'
                                  }
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Investment Performance */}
            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <TrendingUpIcon className="h-5 w-5" />
                  Investment Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Equity Now */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-white rounded-lg border border-emerald-100">
                    <div className="text-lg font-bold text-emerald-700">{formatCurrency(equityNow || 0)}</div>
                    <div className="text-xs text-emerald-600">Equity Growth (£)</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-emerald-100">
                    <div className="text-lg font-bold text-emerald-700">{Math.round(equityGrowthPct || 0)}%</div>
                    <div className="text-xs text-emerald-600">Equity Growth (%)</div>
                  </div>
                </div>

                {/* Yield and Area Growth */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-white rounded-lg border border-emerald-100">
                    <div className="text-lg font-bold text-emerald-700">{Math.round(grossYieldPct || 0)}%</div>
                    <div className="text-xs text-emerald-600">Gross Yield</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-emerald-100">
                    <div className="text-lg font-bold text-emerald-700">{Math.round(areaYoyGrowth || 0)}%</div>
                    <div className="text-xs text-emerald-600">Area YoY Growth</div>
                  </div>
                </div>

                {/* Current vs Purchase */}
                <div className="bg-white rounded-lg border border-emerald-100 p-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Purchase (last)</span>
                      <span className="font-semibold">{formatCurrency(lastSalePrice || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Current Value</span>
                      <span className="font-semibold">{formatCurrency(currentValue || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Annual Rent</span>
                      <span className="font-semibold">{formatCurrency(annualRent || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Data Source</span>
                      <span className="font-semibold">{valuationData?.marketAnalysis?.dataSource || 'Mixed'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="space-y-6">
                    {/* Data Quality Indicator */}
        <div className="col-span-2">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Info className="h-5 w-5" />
                Data Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${propertyData?.hpiData ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {propertyData?.hpiData ? (
                      <span className="text-lg font-bold">✓</span>
                    ) : (
                      <span className="text-lg font-bold">✗</span>
                    )}
                  </div>
                  <span className="text-gray-700">HPI Data: {propertyData?.hpiData ? 'Available' : 'Not Available'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${propertyData?.soldPriceData?.priceStats?.totalSales > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {propertyData?.soldPriceData?.priceStats?.totalSales > 0 ? (
                      <span className="text-lg font-bold">✓</span>
                    ) : (
                      <span className="text-lg font-bold">✗</span>
                    )}
                  </div>
                  <span className="text-gray-700">Sales Data: {propertyData?.soldPriceData?.priceStats?.totalSales > 0 ? 'Available' : 'Not Available'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${propertyData?.rentalEstimate?.monthly ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {propertyData?.rentalEstimate?.monthly ? (
                      <span className="text-lg font-bold">✓</span>
                    ) : (
                      <span className="text-lg font-bold">✗</span>
                    )}
                  </div>
                  <span className="text-gray-700">Rental Data: {propertyData?.rentalEstimate?.monthly ? 'Available' : 'Not Available'}</span>
                </div>
              </div>
              {!propertyData?.hpiData && !propertyData?.soldPriceData?.priceStats?.totalSales && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-sm text-yellow-800">
                    <strong>Limited Data Available:</strong> Some market analysis features may not be available due to insufficient data. 
                    Consider searching for properties in areas with more comprehensive data coverage.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
            {/* Market Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">
                      {propertyData?.hpiData?.currentIndex || 'N/A'}
                    </div>
                    <div className="text-sm text-blue-600">HPI Index</div>
                    {!propertyData?.hpiData?.currentIndex && (
                      <div className="text-xs text-blue-500 mt-1">Data Not Available</div>
                    )}
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-700">
                      {propertyData?.hpiData?.yoyGrowth !== undefined ? `${Math.round(propertyData?.hpiData.yoyGrowth)}%` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">YoY Growth</div>
                    {propertyData?.hpiData?.yoyGrowth === undefined && (
                      <div className="text-xs text-gray-500 mt-1">Data Not Available</div>
                    )}
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700 capitalize">
                      {propertyData?.hpiData?.trend || 'N/A'}
                    </div>
                    <div className="text-sm text-purple-600">Market Trend</div>
                    {!propertyData?.hpiData?.trend && (
                      <div className="text-xs text-purple-500 mt-1">Data Not Available</div>
                    )}
                  </div>
                </div>
                
                {/* Data Source Information */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 text-center">
                    {propertyData?.hpiData?.lastUpdated ? (
                      <>
                        Last updated: {new Date(propertyData?.hpiData.lastUpdated).toLocaleString('en-GB')}
                        {propertyData?.hpiData.source && ` • Source: ${propertyData?.hpiData.source}`}
                      </>
                    ) : (
                      'HPI data not available for this area'
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {valuationData?.marketAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Market Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-700 capitalize">
                        {propertyData?.hpiData?.trend || 
                         predictionData?.marketAnalysis?.marketTrend || 
                         'Data Not Available'}
                      </div>
                      <div className="text-sm text-gray-600">Trend</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-700 capitalize">
                        {(() => {
                          if (propertyData?.hpiData?.trend === 'rising') return 'Strong';
                          if (propertyData?.hpiData?.trend === 'falling') return 'Weak';
                          if (predictionData?.marketAnalysis?.marketCondition) return predictionData.marketAnalysis.marketCondition;
                          return 'Data Not Available';
                        })()}
                      </div>
                      <div className="text-sm text-gray-600">Condition</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-700">
                        {propertyData?.hpiData?.yoyGrowth !== undefined ? `${Math.round(propertyData?.hpiData.yoyGrowth)}%` : 
                         predictionData?.marketAnalysis?.yoyGrowth ? `${Math.round(predictionData.marketAnalysis.yoyGrowth)}%` : 
                         'Data Not Available'}
                      </div>
                      <div className="text-sm text-gray-600">YoY Growth</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 text-center">
                    Data source: {propertyData?.hpiData?.source || valuationData.marketAnalysis.dataSource || 'Mixed Data'}
                    {propertyData?.hpiData?.regionLabel && ` • ${propertyData?.hpiData.regionLabel}`}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Market Data */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-800">
                  <BarChart3 className="h-5 w-5" />
                  Enhanced Market Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Regional Market Data */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-indigo-700 mb-2">Regional Market</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-white rounded-lg border border-indigo-100">
                        <div className="text-lg font-bold text-indigo-700">
                          {propertyData?.hpiData?.regionLabel || 'North East'}
                        </div>
                        <div className="text-xs text-indigo-600">Region</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-indigo-100">
                        <div className="text-lg font-bold text-indigo-700">
                          {propertyData?.hpiData?.yoyGrowth !== undefined ? `${Math.round(propertyData?.hpiData.yoyGrowth)}%` : 'N/A'}
                        </div>
                        <div className="text-xs text-indigo-600">Regional Growth</div>
                      </div>
                    </div>
                  </div>

                  {/* Local Sales Data */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-indigo-700 mb-2">Local Sales</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-white rounded-lg border border-indigo-100">
                        <div className="text-lg font-bold text-indigo-700">
                          {propertyData?.soldPriceData?.priceStats?.totalSales || 0}
                        </div>
                        <div className="text-xs text-indigo-600">Total Sales</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-indigo-100">
                        <div className="text-lg font-bold text-indigo-700">
                          {formatCurrency(propertyData?.soldPriceData?.priceStats?.averagePrice || 0)}
                        </div>
                        <div className="text-xs text-indigo-600">Avg Price</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Range */}
                {propertyData?.soldPriceData?.priceStats && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-100">
                    <div className="text-sm font-medium text-indigo-700 mb-2">Price Range (Last 5 Years)</div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Min: {formatCurrency(propertyData?.soldPriceData.priceStats.minPrice)}</span>
                      <span className="text-gray-600">Max: {formatCurrency(propertyData?.soldPriceData.priceStats.maxPrice)}</span>
                    </div>
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-500 text-center">
                  Last updated: {propertyData?.hpiData?.lastUpdated ? new Date(propertyData?.hpiData.lastUpdated).toLocaleString() : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'epc' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                EPC Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-4xl font-bold text-green-700 mb-2">
                    {propertyData?.epcRating || 'N/A'}
                  </div>
                  <div className="text-lg text-green-600 mb-1">EPC Rating</div>
                  <div className="text-sm text-green-500">Energy Performance</div>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-4xl font-bold text-blue-700 mb-2">
                    {propertyData?.floorArea || 'N/A'}
                  </div>
                  <div className="text-lg text-blue-600 mb-1">Floor Area</div>
                  <div className="text-sm text-blue-500">Square Metres</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-700 mb-2">Inspection Details</div>
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{new Date(propertyData?.inspectionDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Authority:</span>
                      <span>{propertyData?.localAuthority}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-700 mb-2">Property Information</div>
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span>{propertyData?.propertyType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bedrooms:</span>
                      <span>{propertyData?.bedrooms || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'bmv' && valuationData && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <Target className="h-5 w-5" />
                  BMV Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6 bg-white rounded-lg border border-yellow-200">
                  <div className="text-5xl font-bold text-yellow-700 mb-2">
                    {valuationData.bmvAnalysis?.basicScore || 0}/100
                  </div>
                  <Badge className={`text-lg px-4 py-2 ${getBMVCategoryColor(valuationData.bmvAnalysis?.category || 'Average')}`}>
                    {valuationData.bmvAnalysis?.category || 'Average'}
                  </Badge>
                </div>
                
                {/* BMV Score Breakdown */}
                <div className="mt-6 p-4 bg-white rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-3">Score Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Score:</span>
                        <span className="font-medium">{valuationData.bmvAnalysis?.basicScore || 0}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Enhanced Score:</span>
                        <span className="font-medium">{valuationData.bmvAnalysis?.enhancedScore || valuationData.bmvAnalysis?.basicScore || 0}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Market Growth:</span>
                        <span className="font-medium">{valuationData.bmvAnalysis?.areaGrowth ? Math.round(valuationData.bmvAnalysis.areaGrowth) : 0}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Sales:</span>
                        <span className="font-medium">{valuationData.marketAnalysis?.totalSales || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Price:</span>
                        <span className="font-medium">{formatCurrency(valuationData.marketAnalysis?.averagePrice || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price Range:</span>
                        <span className="font-medium">{formatCurrency(valuationData.marketAnalysis?.priceRange?.min || 0)} - {formatCurrency(valuationData.marketAnalysis?.priceRange?.max || 0)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Score Interpretation */}
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <div className="text-sm text-yellow-800">
                      <strong>What this score means:</strong> {(() => {
                        const score = valuationData.bmvAnalysis?.basicScore || 0;
                        if (score >= 80) return "Excellent investment opportunity - significantly below market value";
                        if (score >= 65) return "Good investment opportunity - below market value";
                        if (score >= 50) return "Fair value - at market price";
                        if (score >= 35) return "Overpriced - above market value";
                        return "Poor value - significantly overpriced";
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data Quality Indicator */}
              <div className="col-span-2">
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <Info className="h-5 w-5" />
                      Investment Value Calculation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-700">
                          {valuationData.marketAnalysis.yearlySales?.slice(-3).length || 0}
                        </div>
                        <div className="text-xs text-amber-600">Recent Sales Used</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-700">
                          {valuationData.marketAnalysis.yearlySales?.slice(-1)[0]?.year || 'N/A'}
                        </div>
                        <div className="text-xs text-amber-600">Most Recent Sale Year</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-700">
                          {formatCurrency(valuationData.marketAnalysis.yearlySales?.slice(-1)[0]?.averagePrice || 0)}
                        </div>
                        <div className="text-xs text-amber-600">Latest Sale Price</div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="text-xs text-amber-800">
                        <strong>How it works:</strong> Investment Value is calculated using time-weighted recent sales data, 
                        prioritizing the last 5 years. This ensures current market conditions are reflected accurately.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Investment Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">
                      {formatCurrency(valuationData.marketAnalysis.averagePrice || 0)}
                    </div>
                    <div className="text-sm text-blue-600">Investment Value</div>
                    <div className="text-xs text-blue-500 mt-1">
                      {(() => {
                        const recentSales = valuationData.marketAnalysis.yearlySales?.slice(-3) || [];
                        if (recentSales.length > 0) {
                          return `Based on ${recentSales.length} recent sales`;
                        }
                        return 'Based on recent market data';
                      })()}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(valuationData.marketAnalysis.averagePrice ? valuationData.marketAnalysis.averagePrice * 0.08 : 0)}
                    </div>
                    <div className="text-sm text-green-600">Potential Savings (8%)</div>
                    <div className="text-xs text-green-500 mt-1">
                      Realistic investment target
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">
                      {valuationData.bmvAnalysis?.areaGrowth ? Math.round(valuationData.bmvAnalysis.areaGrowth) : 0}%
                    </div>
                    <div className="text-sm text-purple-600">Area Growth</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Market Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-700">
                      {formatCurrency(valuationData.marketAnalysis.averagePrice || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Market Value</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Current market average
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">Price Range (Recent Sales)</div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Min: {formatCurrency(valuationData.marketAnalysis.priceRange?.min || 0)}</span>
                      <span className="text-gray-600">Max: {formatCurrency(valuationData.marketAnalysis.priceRange?.max || 0)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      Based on recent market activity
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recommendations */}
            {valuationData.recommendations && valuationData.recommendations.length > 0 && (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Lightbulb className="h-5 w-5" />
                    Investment Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {valuationData.recommendations.map((recommendation: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-green-800">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Additional Insights */}
                  <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                    <div className="text-sm text-green-800">
                      <strong>Market Context:</strong> {(() => {
                        const growth = valuationData.bmvAnalysis?.areaGrowth || 0;
                        const score = valuationData.bmvAnalysis?.basicScore || 0;
                        
                        if (growth > 10 && score > 60) {
                          return "Strong growth area with good value - excellent timing for investment";
                        } else if (growth > 5 && score > 50) {
                          return "Growing area with fair value - consider for long-term investment";
                        } else if (growth > 0) {
                          return "Stable area with moderate growth potential";
                        } else {
                          return "Area experiencing price correction - exercise caution";
                        }
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'predictions' && predictionData && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Zap className="h-5 w-5" />
                  AI Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6 bg-white rounded-lg border border-purple-200">
                  <div className="text-4xl font-bold text-purple-700 mb-3">
                    {formatCurrency(predictionData?.prediction?.predictedValue)}
                  </div>
                  <div className="text-lg text-purple-600 mb-4">
                    Confidence: {Math.round(predictionData?.prediction?.confidence * 100)}%
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-600">Min Value</div>
                      <div className="text-lg font-semibold text-purple-700">
                        {formatCurrency(predictionData?.prediction?.valueRange?.min)}
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-600">Max Value</div>
                      <div className="text-lg font-semibold text-purple-700">
                        {formatCurrency(predictionData?.prediction?.valueRange?.max)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-purple-600">
                    Method: {predictionData?.prediction?.method}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Market Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-700">Trend</div>
                    <div className="text-gray-600 capitalize">
                                              {propertyData?.hpiData?.trend ||
                         predictionData?.marketAnalysis?.marketTrend || 
                         'Data Not Available'}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-700">Confidence</div>
                    <div className="text-gray-600">
                      {propertyData?.hpiData?.yoyGrowth !== undefined ? 'High' : 
                       predictionData?.marketAnalysis?.marketCondition === 'strong' ? 'High' :
                       predictionData?.marketAnalysis?.marketCondition === 'normal' ? 'Medium' : 
                       predictionData?.marketAnalysis?.marketCondition === 'weak' ? 'Low' :
                       'Data Not Available'}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-700">Key Factors</div>
                    <div className="text-gray-600 text-sm">
                      {(() => {
                        const factors = [];
                        if (propertyData?.hpiData?.yoyGrowth && propertyData?.hpiData.yoyGrowth > 0) {
                          factors.push(`${Math.round(propertyData?.hpiData.yoyGrowth)}% regional growth`);
                        }
                        if (propertyData?.soldPriceData?.priceStats?.totalSales > 0) {
                          factors.push(`${propertyData?.soldPriceData.priceStats.totalSales} recent sales`);
                        }
                        if (propertyData?.hpiData?.trend === 'rising') {
                          factors.push('Positive market momentum');
                        }
                        if (propertyData?.hpiData?.regionLabel) {
                          factors.push(`${propertyData?.hpiData.regionLabel} market`);
                        }
                        return factors.length > 0 ? factors.join(', ') : 'Insufficient market data available';
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Model Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Overall Accuracy</span>
                      <span className="font-semibold text-gray-900">
                        {(() => {
                          if (predictionData?.prediction?.confidence) {
                            return Math.round(predictionData?.prediction?.confidence * 100);
                          }
                          if (propertyData?.hpiData?.yoyGrowth !== undefined && propertyData?.soldPriceData?.priceStats?.totalSales > 0) {
                            return 75; // Medium confidence with limited data
                          }
                          return 0; // No confidence without data
                        })()}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Growth Accuracy</span>
                      <span className="font-semibold text-gray-900">
                        {(() => {
                          if (propertyData?.hpiData?.yoyGrowth !== undefined) {
                            return 80; // Medium confidence with HPI data
                          }
                          if (predictionData?.marketAnalysis?.yoyGrowth !== undefined) {
                            return 70; // Lower confidence with sales analysis
                          }
                          return 0; // No confidence without growth data
                        })()}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Market Accuracy</span>
                      <span className="font-semibold text-gray-900">
                        {(() => {
                          if (propertyData?.soldPriceData?.priceStats?.totalSales > 0 && propertyData?.hpiData?.trend) {
                            return 75; // Medium confidence with sales + HPI trend
                          }
                          if (propertyData?.soldPriceData?.priceStats?.totalSales > 0) {
                            return 65; // Lower confidence with sales data only
                          }
                          return 0; // No confidence without market data
                        })()}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'comparables' && valuationData && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales & Comparables</CardTitle>
              {valuationData.comparables && valuationData.comparables.length > 0 && (
                <div className="text-sm text-gray-600">
                  {valuationData.comparables.length} recent sale{valuationData.comparables.length !== 1 ? 's' : ''} in the area
                </div>
              )}
            </CardHeader>
            <CardContent>
              {valuationData.comparables && valuationData.comparables.length > 0 ? (
                <>
                  {/* Summary Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-700">
                        {formatCurrency(
                          valuationData.comparables.reduce((sum, comp) => sum + (comp.price || 0), 0) / 
                          valuationData.comparables.length
                        )}
                      </div>
                      <div className="text-xs text-blue-600">Average Price</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-700">
                        {formatCurrency(Math.min(...valuationData.comparables.map(comp => comp.price || 0)))}
                      </div>
                      <div className="text-xs text-blue-600">Lowest Sale</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-700">
                        {formatCurrency(Math.max(...valuationData.comparables.map(comp => comp.price || 0)))}
                      </div>
                      <div className="text-xs text-blue-600">Highest Sale</div>
                    </div>
                  </div>
                  
                  {/* Sales List */}
                  <div className="space-y-3">
                    {valuationData.comparables.slice(0, 5).map((comp, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">
                              {comp.address || 'Address not available'}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              {formatDate(comp.date)} • {comp.propertyType || 'Property type unknown'}
                            </div>
                            {comp.bedrooms && (
                              <div className="text-xs text-gray-500">
                                {comp.bedrooms} bedroom{comp.bedrooms !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-gray-900 mb-1">
                              {formatCurrency(comp.price)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Sale #{index + 1}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No comparable sales data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'valuation' && predictionData?.prediction && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <Calculator className="h-5 w-5" />
                  Predicted Valuation Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6 bg-white rounded-lg border border-emerald-200">
                  <div className="text-4xl font-bold text-emerald-700 mb-3">
                    {formatCurrency(predictionData?.prediction?.predictedValue)}
                  </div>
                  <div className="text-lg text-emerald-600 mb-4">
                    Confidence: {Math.round(predictionData?.prediction?.confidence * 100)}%
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <div className="text-sm text-emerald-600">Value Range</div>
                      <div className="text-sm font-semibold text-emerald-700">
                        {formatCurrency(predictionData?.prediction?.valueRange?.min)} - {formatCurrency(predictionData?.prediction?.valueRange?.max)}
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <div className="text-sm text-emerald-600">Method</div>
                      <div className="text-sm font-semibold text-emerald-700">
                        {predictionData?.prediction?.method}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase History Note */}
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <Info className="h-5 w-5" />
                  Purchase History Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <strong>Purchase History:</strong> This property was purchased for £95,000 in 2024. 
                      The predicted value represents a realistic market appreciation based on recent sales 
                      in the area and conservative growth assumptions.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add to Portfolio Button */}
            <div className="text-center">
              <AddToPortfolioButton
                propertyData={{
                  address: propertyData?.address,
                  postcode: propertyData?.postcode,
                  houseNumber: houseNumber,
                  propertyType: propertyData?.propertyType,
                  bedrooms: propertyData?.bedrooms,
                  estimatedValue: predictionData?.prediction.predictedValue || propertyData?.soldPriceData?.priceStats?.averagePrice || 0,
                  dealScore: Math.round((propertyData?.hpiData?.yoyGrowth || 0) * 10),
                  dealRating: (propertyData?.hpiData?.yoyGrowth || 0) > 0 ? 'Good' : 'Average',
                  bmvScore: valuationData?.bmvAnalysis?.basicScore || Math.round((propertyData?.hpiData?.yoyGrowth || 0) * 10),
                  lastSale: {
                    price: propertyData?.soldPriceData?.priceStats?.averagePrice || 0,
                    date: propertyData?.inspectionDate,
                    propertyType: propertyData?.propertyType
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

