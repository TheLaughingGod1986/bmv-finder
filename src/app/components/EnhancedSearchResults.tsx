'use client';

import { useState, useEffect } from 'react';
import { 
  Home, 
  BarChart3, 
  Leaf, 
  Zap, 
  Building2, 
  Calculator, 
  TrendingUp, 
  MapPin, 
  Calendar,
  Minus,
  TrendingDown
} from 'lucide-react';
import { Badge } from './SimpleCard';

interface PropertyDiscoveryData {
  comparables?: Array<{
    address: string;
    price: number;
    date: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface PropertyData {
  address: string;
  postcode: string;
  propertyType?: string;
  bedrooms?: number;
  epcRating?: string;
  inspectionDate?: string;
  lastUpdated?: string;
  lastSaleDate?: string;
  lastSalePrice?: number;
  soldPriceData?: {
    priceStats?: {
      averagePrice?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  hpiData?: {
    yoyGrowth?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface EnhancedSearchResultsProps {
  postcode: string;
  houseNumber: string;
  propertyDiscoveryData?: PropertyDiscoveryData;
  onAnalysisComplete?: () => void;
}

export default function EnhancedSearchResults({ 
  postcode, 
  houseNumber, 
  propertyDiscoveryData,
  onAnalysisComplete 
}: EnhancedSearchResultsProps) {
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [valuationData, setValuationData] = useState<{
    marketAnalysis?: {
      averagePrice?: number;
      totalSales?: number;
      overallGrowth?: number;
      [key: string]: unknown;
    };
    epcAnalysis?: {
      totalProperties?: number;
      averageRating?: string;
      energyEfficientCount?: number;
      [key: string]: unknown;
    };
    comparables?: Array<{
      address: string;
      price: number;
      date: string;
      adjustedPrice?: number;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  } | null>(null);
  const [predictionData, setPredictionData] = useState<{
    prediction?: {
      predictedValue?: number;
      confidence?: number;
      factors?: string[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  } | null>(null);
  const [marketTrendsData, setMarketTrendsData] = useState<{
    currentTrend?: string;
    forecastGrowth?: number;
    marketPhase?: string;
    [key: string]: unknown;
  } | null>(null);
  const [investmentRecommendationData, setInvestmentRecommendationData] = useState<{
    recommendation?: string;
    riskLevel?: string;
    factors?: string[];
    [key: string]: unknown;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      if (!postcode || !houseNumber) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // If we have Property Discovery data, use it for comparables
        if (propertyDiscoveryData && propertyDiscoveryData.comparables) {
          // Always fetch comprehensive valuation data to get market analysis
          const valuationResponse = await fetch(`/api/property-valuation?type=comprehensive&postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(houseNumber)}`);
          
          if (valuationResponse.ok) {
            const valuationResult = await valuationResponse.json();
            
            // Check if the API response has a nested structure
            const apiMarketAnalysis = valuationResult.marketAnalysis || valuationResult.data?.marketAnalysis;
            const apiComparables = valuationResult.comparables || valuationResult.data?.comparables;
            
            // Ensure we have valid market analysis data before proceeding
            if (!apiMarketAnalysis || !apiMarketAnalysis.averagePrice) {
              setError('Failed to get valid market analysis data from API');
              return;
            }
            
            // Property Discovery data should NEVER overwrite API market analysis
            // Only use Property Discovery data for comparables, ALWAYS use API for market analysis
            if (propertyDiscoveryData && propertyDiscoveryData.comparables) {
              // Ensure we ALWAYS use the comprehensive valuation API data for market analysis
              const mergedValuationData = {
                comparables: propertyDiscoveryData.comparables,
                marketAnalysis: apiMarketAnalysis // ALWAYS use API data, never fallback
              };
              
              setValuationData(mergedValuationData);
            } else {
              // No Property Discovery data, use full API response
              setValuationData(valuationResult);
            }

          } else {
            setError('Failed to fetch valuation data');
          }
        }

        // Fetch property data
        const propertyResponse = await fetch(`/api/enhanced-property-search?postcode=${encodeURIComponent(postcode)}&includeRental=true&includeHPI=true&includeSoldPrices=true&limit=100`);
        if (propertyResponse.ok) {
          const propertyResult = await propertyResponse.json();
          if (propertyResult.success && propertyResult.data?.properties) {
            const targetProperty = propertyResult.data.properties.find((p: PropertyData) => 
              p.address.toLowerCase().includes(houseNumber.toLowerCase()) ||
              p.address.split(',')[0].toLowerCase() === houseNumber.toLowerCase()
            );
            if (targetProperty) {
              setPropertyData(targetProperty);
            }
          }
        }

        // Only fetch valuation data if we don't have Property Discovery data
        if (!propertyDiscoveryData || !propertyDiscoveryData.comparables) {
          const valuationResponse = await fetch(`/api/property-valuation?type=comprehensive&postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(houseNumber)}`);
          if (valuationResponse.ok) {
            const valuationResult = await valuationResponse.json();
            setValuationData(valuationResult);
          }
        }

        // Fetch prediction data
        const predictionResponse = await fetch(`/api/predictions?postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(houseNumber)}`);
        if (predictionResponse.ok) {
          const predictionResult = await predictionResponse.json();
          setPredictionData(predictionResult);
        }

        // Fetch market trends data
        const trendsResponse = await fetch(`/api/market-trends?postcode=${encodeURIComponent(postcode)}`);
        if (trendsResponse.ok) {
          const trendsResult = await trendsResponse.json();
          setMarketTrendsData(trendsResult.data);
        }

        // Fetch investment recommendations
        const recommendationsResponse = await fetch(`/api/investment-recommendations?postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(houseNumber)}`);
        if (recommendationsResponse.ok) {
          const recommendationsResult = await recommendationsResponse.json();
          setInvestmentRecommendationData(recommendationsResult.data);
        }

        setLoading(false);
        onAnalysisComplete?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, [postcode, houseNumber, propertyDiscoveryData, onAnalysisComplete]);

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

  const getTrendIcon = (trend: string | null | undefined) => {
    if (!trend) return <Minus className="h-4 w-4 text-gray-600" />;
    
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

  const getBMVCategoryColor = (category: string | null | undefined) => {
    if (!category) return 'bg-gray-100 text-gray-800 border-gray-200';
    
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

  const getMarketTrend = (yoyGrowth: number | null | undefined): string => {
    if (yoyGrowth === null || yoyGrowth === undefined) return 'stable';
    if (yoyGrowth > 2) return 'rising';
    if (yoyGrowth < -2) return 'falling';
    return 'stable';
  };

  const getGrowthRateForYear = (year: number, growthRates: Array<{ year: number; rate: number; [key: string]: unknown }>) => {
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

  // Early return if no data
  if (!propertyData || !predictionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'No property data found'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'market', label: 'Market Analysis', icon: BarChart3 },
    { id: 'epc', label: 'EPC Analysis', icon: Leaf },
    { id: 'predictions', label: 'AI Predictions', icon: Zap },
    { id: 'comparables', label: 'Comparables', icon: Building2 },
    { id: 'valuation', label: 'Predicted Valuation', icon: Calculator },
    { id: 'property-analysis', label: 'Property Analysis', icon: Building2 },
    { id: 'market-trends', label: 'Market Trends', icon: TrendingUp },
    { id: 'investment-recommendations', label: 'Investment Recommendations', icon: TrendingUp },
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
                {propertyData?.hpiData ? getTrendIcon(propertyData?.hpiData.yoyGrowth > 0 ? 'rising' : propertyData?.hpiData.yoyGrowth < 0 ? 'falling' : 'stable') : getTrendIcon('stable')}
                <span className="ml-1">
                  {propertyData?.hpiData?.yoyGrowth !== null ? `${propertyData?.hpiData.yoyGrowth}%` : 'N/A'} YoY
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
      <div className="min-h-[600px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Predicted Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {predictionData?.prediction?.predictedValue 
                        ? formatCurrency(predictionData.prediction.predictedValue)
                        : formatCurrency(propertyData?.soldPriceData?.priceStats?.averagePrice || 0)
                      }
                    </p>
                  </div>
                  <Calculator className="h-8 w-8 text-primary-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Market Growth</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {propertyData?.hpiData?.yoyGrowth !== null ? `${propertyData.hpiData.yoyGrowth}%` : 'N/A'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">EPC Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {propertyData?.epcRating || 'N/A'}
                    </p>
                  </div>
                  <Leaf className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Bedrooms</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {propertyData?.bedrooms || 'N/A'}
                    </p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Property Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Property Details</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Address:</span> {propertyData?.address || 'N/A'}</p>
                    <p><span className="font-medium">Postcode:</span> {propertyData?.postcode || 'N/A'}</p>
                    <p><span className="font-medium">Property Type:</span> {propertyData?.propertyType || 'N/A'}</p>
                    <p><span className="font-medium">Bedrooms:</span> {propertyData?.bedrooms || 'N/A'}</p>
                    <p><span className="font-medium">Floor Area:</span> {propertyData?.floorArea ? `${propertyData.floorArea}m²` : 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Market Information</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Current Value:</span> {formatCurrency(propertyData?.soldPriceData?.priceStats?.averagePrice || 0)}</p>
                    <p><span className="font-medium">Predicted Value:</span> {predictionData?.prediction?.predictedValue ? formatCurrency(predictionData.prediction.predictedValue) : 'N/A'}</p>
                    <p><span className="font-medium">Market Growth:</span> {propertyData?.hpiData?.yoyGrowth !== null ? `${propertyData.hpiData.yoyGrowth}%` : 'N/A'}</p>
                    <p><span className="font-medium">EPC Rating:</span> {propertyData?.epcRating || 'N/A'}</p>
                    <p><span className="font-medium">Last Updated:</span> {propertyData?.lastUpdated ? formatDate(propertyData.lastUpdated) : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Market Analysis</h3>
              {valuationData?.marketAnalysis ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(valuationData.marketAnalysis.averagePrice)}
                    </p>
                    <p className="text-sm text-gray-600">Average Price</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {valuationData.marketAnalysis.totalSales}
                    </p>
                    <p className="text-sm text-gray-600">Total Sales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {valuationData.marketAnalysis.overallGrowth}%
                    </p>
                    <p className="text-sm text-gray-600">Overall Growth</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No market analysis data available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'epc' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">EPC Analysis</h3>
              {valuationData?.epcAnalysis ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {valuationData.epcAnalysis.totalProperties}
                    </p>
                    <p className="text-sm text-gray-600">Total Properties</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {valuationData.epcAnalysis.averageRating}
                    </p>
                    <p className="text-sm text-gray-600">Average Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {valuationData.epcAnalysis.energyEfficientCount}
                    </p>
                    <p className="text-sm text-gray-600">Energy Efficient</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No EPC analysis data available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Predictions</h3>
              {predictionData?.prediction ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Predicted Value</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(predictionData.prediction.predictedValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Confidence Level</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {predictionData.prediction.confidence}%
                      </p>
                    </div>
                  </div>
                  {predictionData.prediction.factors && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Key Factors</p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {predictionData.prediction.factors.map((factor: string, index: number) => (
                          <li key={index}>• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No prediction data available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'comparables' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Comparable Properties</h3>
              {valuationData?.comparables ? (
                <div className="space-y-4">
                  {valuationData.comparables.slice(0, 5).map((sale: { address: string; price: number; date: string; [key: string]: unknown }, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{sale.address}</p>
                          <p className="text-sm text-gray-600">{formatDate(sale.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatCurrency(sale.price)}
                          </p>
                          {sale.adjustedPrice && (
                            <p className="text-sm text-gray-600">
                              Adjusted: {formatCurrency(sale.adjustedPrice as number || 0)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No comparable properties data available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'valuation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Predicted Valuation</h3>
              {predictionData?.prediction ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary-700">
                      {formatCurrency(predictionData.prediction.predictedValue)}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">Predicted Market Value</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">
                        {predictionData.prediction.confidence}%
                      </p>
                      <p className="text-sm text-gray-600">Confidence Level</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">
                        {formatCurrency(propertyData?.soldPriceData?.priceStats?.averagePrice || 0)}
                      </p>
                      <p className="text-sm text-gray-600">Current Market Average</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No valuation data available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'property-analysis' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Property Analysis</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Property Characteristics</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Type:</span> {propertyData?.propertyType || 'N/A'}</p>
                      <p><span className="font-medium">Bedrooms:</span> {propertyData?.bedrooms || 'N/A'}</p>
                      <p><span className="font-medium">Floor Area:</span> {propertyData?.floorArea ? `${propertyData.floorArea}m²` : 'N/A'}</p>
                      <p><span className="font-medium">EPC Rating:</span> {propertyData?.epcRating || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Market Position</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Current Value:</span> {formatCurrency(propertyData?.soldPriceData?.priceStats?.averagePrice || 0)}</p>
                      <p><span className="font-medium">Market Growth:</span> {propertyData?.hpiData?.yoyGrowth !== null ? `${propertyData.hpiData.yoyGrowth}%` : 'N/A'}</p>
                      <p><span className="font-medium">Last Sale:</span> {propertyData?.lastSaleDate ? formatDate(propertyData.lastSaleDate) : 'N/A'}</p>
                      <p><span className="font-medium">Last Sale Price:</span> {propertyData?.lastSalePrice ? formatCurrency(propertyData.lastSalePrice) : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'market-trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Market Trends</h3>
              {marketTrendsData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {marketTrendsData.currentTrend || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">Current Trend</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {marketTrendsData.forecastGrowth || 'N/A'}%
                      </p>
                      <p className="text-sm text-gray-600">Forecast Growth</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {marketTrendsData.marketPhase || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">Market Phase</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No market trends data available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'investment-recommendations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Investment Recommendations</h3>
              {investmentRecommendationData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Recommendation</h4>
                      <p className="text-gray-600">{investmentRecommendationData.recommendation || 'No recommendation available'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Risk Level</h4>
                      <p className="text-gray-600">{investmentRecommendationData.riskLevel || 'N/A'}</p>
                    </div>
                  </div>
                  {investmentRecommendationData.factors && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Key Factors</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {investmentRecommendationData.factors.map((factor: string, index: number) => (
                          <li key={index}>• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No investment recommendations available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

