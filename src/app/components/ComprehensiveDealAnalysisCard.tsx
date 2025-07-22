'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from './SimpleCard';
import { 
  Home, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  BarChart3, 
  Calculator,
  Star,
  Award,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Train,
  GraduationCap,
  ShoppingBag,
  Shield,
  Clock,
  DollarSign,
  Bus,
  School,
  Store,
  Trees
} from 'lucide-react';
import AddToPortfolioButton, { extractPropertyDataFromValuation } from './AddToPortfolioButton';
import MissingDataCard from './MissingDataCard';
import { useToast } from '@/hooks/useToast';

interface ComprehensiveValuationData {
  property: {
    address: string;
    postcode: string;
    propertyType: string;
    bedrooms?: number;
    floorArea?: number;
    floor_area_m2?: number;
    epcRating?: string;
    lastSoldPrice?: number;
    lastSoldDate?: string;
  };
  methods: {
    salesComparison: {
      name: string;
      value: number;
      confidence: number;
      breakdown: {
        comparableSales: number;
        locationPremium: number;
        adjustments: number;
        finalValue: number;
      };
      factors: {
        positive: string[];
        negative: string[];
        neutral: string[];
      };
      formula: string;
      description: string;
      valuationType: string;
      whyThisMethod: string;
      whyThisResult: string;
    };
    incomeApproach: {
      name: string;
      value: number;
      confidence: number;
      breakdown: {
        grossRent: number;
        operatingExpenses: number;
        netOperatingIncome: number;
        capRate: number;
        propertyValue: number;
        dataSource: string;
        dataQuality: string;
      };
      factors: {
        positive: string[];
        negative: string[];
        neutral: string[];
      };
      formula: string;
      description: string;
      valuationType: string;
      whyThisMethod: string;
      whyThisResult: string;
    };
    costApproach: {
      name: string;
      value: number;
      confidence: number;
      breakdown: {
        constructionCost: number;
        constructionCostPerSqm: number;
        floorArea: number;
        depreciation: number;
        depreciatedCost: number;
        landValue: number;
        landValueRatio: number;
        propertyValue: number;
      };
      factors: {
        positive: string[];
        negative: string[];
        neutral: string[];
      };
      formula: string;
      description: string;
      valuationType: string;
      whyThisMethod: string;
      whyThisResult: string;
    };
  };
  summary: {
    finalValue: number;
    confidence: number;
    valueRange: {
      min: number;
      max: number;
    };
    recommendedMethod: string;
    overallFactors: {
      positive: string[];
      negative: string[];
      neutral: string[];
    };
  };
  missingData?: {
    fields: Array<{
      name: string;
      displayName: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      estimatedImprovement: number;
      currentValue?: any;
      suggestedValue?: string;
    }>;
    totalPotentialImprovement: number;
    message: string;
  };
}

interface PlanningAuthorityData {
  postcode_area: string;
  planning_applications?: Array<{
    application_id: string;
    property_address: string;
    application_type: string;
    status: string;
    decision_date: string;
    estimated_value: number;
    description: string;
    impact_on_value: string;
  }>;
  local_authority?: {
    council_tax_band: string;
    planning_zone: string;
    conservation_area: boolean;
    listed_building: boolean;
    flood_risk: string;
    transport_score: number;
    school_score: number;
    amenity_score: number;
  };
  transport?: {
    nearest_tube?: {
      station: string;
      distance_meters: number;
      lines: string[];
      frequency_minutes: number;
    };
    nearest_train?: {
      station: string;
      distance_meters: number;
      lines: string[];
      frequency_minutes: number;
    };
    nearest_bus?: {
      stops: string[];
      distance_meters: number;
      routes: string[];
      frequency_minutes: number;
    };
  };
  schools?: Array<{
    name: string;
    distance_meters: number;
    ofsted_rating: string;
    type: string;
    age_range: string;
  }>;
  amenities?: {
    supermarkets?: Array<{
      name: string;
      distance_meters: number;
    }>;
    restaurants?: Array<{
      name: string;
      distance_meters: number;
      rating: number;
    }>;
    parks?: Array<{
      name: string;
      distance_meters: number;
    }>;
  };
  market_metrics?: {
    avg_days_on_market: number;
    price_reduction_rate: number;
    market_sentiment: string;
    demand_score: number;
    supply_score: number;
    price_trend: string;
    rental_yield: number;
    capital_growth_rate: number;
  };
  recent_activity?: {
    properties_sold_last_month: number;
    properties_listed_last_month: number;
    avg_price_per_sqm: number;
    price_volatility: string;
  };
}

interface Props {
  postcode: string;
  houseNumber: string;
  loading?: boolean;
  onAnalysisComplete?: () => void;
}

export default function ComprehensiveDealAnalysisCard({ postcode, houseNumber, loading = false, onAnalysisComplete }: Props) {
  const [valuationData, setValuationData] = useState<ComprehensiveValuationData | null>(null);
  const [planningData, setPlanningData] = useState<PlanningAuthorityData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'valuation' | 'rental' | 'location' | 'market' | 'improve'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [showMissingDataForm, setShowMissingDataForm] = useState(false);
  const [missingData, setMissingData] = useState({ floor_area_m2: '', epc_rating: '', bedrooms: '' });
  const { success, error } = useToast();
  const [errorState, setError] = useState<any>(null);

  useEffect(() => {
    if (postcode && houseNumber) {
      fetchComprehensiveData();
    }
  }, [postcode, houseNumber]);

  const fetchComprehensiveData = async () => {
    setIsLoading(true);
    try {
      // Fetch comprehensive valuation data
      const valuationResponse = await fetch(`/api/comprehensive-valuation?postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(houseNumber)}`);
      if (valuationResponse.ok) {
        const valuationResult = await valuationResponse.json();
        setValuationData(valuationResult.data);
      } else {
        let errorObj = null;
        try {
          errorObj = await valuationResponse.json();
        } catch (e) {
          errorObj = { error: valuationResponse.statusText };
        }
        console.error('[DEBUG] Valuation API error:', errorObj);
        setValuationData(null);
        setError(errorObj);
      }

      // Fetch planning authority data
      const planningResponse = await fetch(`/api/planning-authority?postcode=${encodeURIComponent(postcode)}`);
      if (planningResponse.ok) {
        const planningResult = await planningResponse.json();
        console.log('Planning API response:', planningResult);
        setPlanningData(planningResult.data);
        console.log('Setting planningData:', planningResult.data);
      } else {
        let errorObj = null;
        try {
          errorObj = await planningResponse.json();
        } catch (e) {
          errorObj = { error: planningResponse.statusText };
        }
        console.error('Planning API error:', errorObj);
        setPlanningData(null);
        setError(errorObj);
      }
    } catch (error) {
      console.error('[DEBUG] Error fetching comprehensive data:', error);
      setValuationData(null);
      setError({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
      if (onAnalysisComplete) onAnalysisComplete();
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-blue-600 bg-blue-100';
    if (confidence >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 0.6) return <Info className="h-4 w-4" />;
    if (confidence >= 0.4) return <AlertTriangle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const calculateRentalYield = () => {
    if (!valuationData) return null;
    const annualRent = valuationData.methods.incomeApproach.breakdown.grossRent;
    const propertyValue = valuationData.summary.finalValue;
    return (annualRent / propertyValue) * 100;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDealRating = (confidence: number): string => {
    if (confidence >= 0.8) return 'Excellent';
    if (confidence >= 0.7) return 'Good';
    if (confidence >= 0.6) return 'Fair';
    if (confidence >= 0.5) return 'Poor';
    return 'Very Poor';
  };

  const handleMissingDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/property-analysis/submit-missing-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postcode: valuationData?.property?.postcode,
          number: valuationData?.property?.address?.split(' ')[0],
          ...missingData,
        }),
      });
      if (res.ok) {
        success('Thank you! Your data was submitted and will improve future valuations.');
        setShowMissingDataForm(false);
      } else {
        error('Failed to submit data.');
      }
    } catch {
      error('Failed to submit data.');
    }
  };

  if (loading || isLoading) {
    return (
      <Card className="border-2 border-primary-100">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
            <span className="text-lg text-gray-600">Loading comprehensive analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fix: Check for needsManualAdd on the error prop, not the error toast function
  const needsManualAdd = !!errorState && typeof errorState === 'object' && errorState?.needsManualAdd;
  if (valuationData === null && needsManualAdd) {
    return (
      <Card className="bg-yellow-50 border-yellow-200 text-yellow-900 p-8 text-center">
        <CardHeader>
          <CardTitle>No Data Found for This Property</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">We couldn&apos;t find any data for this property. You can manually add it to your portfolio to track and enrich its details.</p>
          {/* Minimal manual add form */}
          <ManualAddToPortfolioForm postcode={postcode} houseNumber={houseNumber} />
        </CardContent>
      </Card>
    );
  }

  if (!valuationData) {
    return (
      <Card className="border-2 border-primary-100">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Enter a property address to get comprehensive analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rentalYield = calculateRentalYield();

  // Floor Area display logic
  const floorArea = valuationData?.property?.floor_area_m2 ?? valuationData?.property?.floorArea;

  return (
    <div className="space-y-6">
      {/* Property Header */}
      <Card className="border-2 border-primary-100 bg-gradient-to-r from-primary-50 to-blue-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary-700">
                <Home className="h-6 w-6" />
                {valuationData.property.address}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {valuationData.property.postcode} • {valuationData.property.propertyType} • {valuationData.property.bedrooms} bed
                {floorArea ? ` • ${floorArea}m²` : ' • Floor Area Missing'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-700">
                {formatCurrency(valuationData.summary.finalValue)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${getConfidenceColor(valuationData.summary.confidence)}`}>
                  {getConfidenceIcon(valuationData.summary.confidence)}
                  <span className="ml-1">{Math.round(valuationData.summary.confidence * 100)}% Confidence</span>
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center pt-4">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Track This Property</h4>
              <p className="text-sm text-gray-600 mb-4">
                Add this property to your portfolio to track its value, growth, and performance over time. 
                Get monthly updates, portfolio analytics, and investment insights.
              </p>
            </div>
            
            <AddToPortfolioButton
              propertyData={{
                address: valuationData.property.address,
                postcode: valuationData.property.postcode,
                houseNumber: houseNumber,
                propertyType: valuationData.property.propertyType,
                bedrooms: valuationData.property.bedrooms,
                floorArea: valuationData.property.floorArea,
                epcRating: valuationData.property.epcRating,
                constructionYear: undefined,
                purchasePrice: valuationData.property.lastSoldPrice || valuationData.summary.finalValue * 0.85,
                currentValue: valuationData.summary.finalValue,
                purchaseDate: valuationData.property.lastSoldDate || new Date().toISOString().split('T')[0],
                dealScore: Math.round(valuationData.summary.confidence * 100),
                dealRating: getDealRating(valuationData.summary.confidence),
                bmvScore: Math.round(valuationData.summary.confidence * 100),
                rentalIncome: valuationData.methods.incomeApproach?.breakdown?.grossRent * 12,
                yield: valuationData.methods.incomeApproach?.breakdown?.capRate,
                mortgageBalance: 0,
                notes: `Added from comprehensive valuation. Confidence: ${Math.round(valuationData.summary.confidence * 100)}%`
              }}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
              showIcon={true}
            >
              <Home className="w-5 h-5 mr-2" />
              Add to Portfolio
            </AddToPortfolioButton>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-500">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Monthly Value Updates</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <BarChart3 className="w-3 h-3" />
                <span>Portfolio Analytics</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <Target className="w-3 h-3" />
                <span>Investment Insights</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'valuation', label: 'Valuation', icon: Calculator },
          { id: 'rental', label: 'Rental & Yield', icon: DollarSign },
          { id: 'location', label: 'Location', icon: MapPin },
          { id: 'market', label: 'Market', icon: TrendingUp },
          { id: 'improve', label: 'Improve', icon: Target }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {formatCurrency(valuationData.summary.finalValue)}
                  </div>
                  <div className="text-sm text-gray-600">Final Value</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {rentalYield ? `${rentalYield.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Rental Yield</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">
                    {formatCurrency(valuationData.property.lastSoldPrice || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Last Sold</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">
                    {floorArea ? `${floorArea}m²` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Floor Area</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valuation Methods Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Valuation Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(valuationData.methods).map(([key, method]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-gray-600">{method.valuationType}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(method.value)}</div>
                    <div className={`text-sm ${getConfidenceColor(method.confidence)}`}>
                      {Math.round(method.confidence * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Location Insights */}
          {planningData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {planningData.local_authority && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-700">
                        {planningData.local_authority.transport_score}/10
                      </div>
                      <div className="text-xs text-gray-600">Transport</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-700">
                        {planningData.local_authority.school_score}/10
                      </div>
                      <div className="text-xs text-gray-600">Schools</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="text-lg font-bold text-purple-700">
                        {planningData.local_authority.amenity_score}/10
                      </div>
                      <div className="text-xs text-gray-600">Amenities</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <div className="text-lg font-bold text-orange-700">
                        {planningData.local_authority.council_tax_band}
                      </div>
                      <div className="text-xs text-gray-600">Council Tax</div>
                    </div>
                  </div>
                )}
                {planningData.local_authority?.conservation_area && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                    <Shield className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">Conservation Area</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Portfolio Information */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Home className="h-5 w-5" />
                Portfolio Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-green-700 mb-4">
                Add this property to your portfolio to track its performance and get comprehensive investment insights.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-800 text-sm">Monthly Updates</h4>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" />
                      Automatic value recalculations
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart3 className="w-3 h-3" />
                      Portfolio performance analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="w-3 h-3" />
                      Investment recommendations
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-800 text-sm">Portfolio Features</h4>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3" />
                      Total asset value tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      Monthly income calculations
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      Risk assessment & diversification
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <p className="text-xs text-green-800 font-medium">
                  💡 <strong>Pro Tip:</strong> Edit purchase price, add mortgage details, and track rental income to get personalized portfolio insights.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Market Sentiment */}
          {planningData?.market_metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Market Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Market Trend</span>
                  <div className="flex items-center gap-1">
                    {planningData.market_metrics.price_trend === 'increasing' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : planningData.market_metrics.price_trend === 'decreasing' ? (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    ) : (
                      <Minus className="h-4 w-4 text-gray-600" />
                    )}
                    <span className="text-sm font-medium capitalize">
                      {planningData.market_metrics.price_trend}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Demand Score</span>
                  <span className={`text-sm font-medium ${getScoreColor(planningData.market_metrics.demand_score)}`}>
                    {planningData.market_metrics.demand_score}/10
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Capital Growth</span>
                  <span className="text-sm font-medium text-green-600">
                    {planningData.market_metrics.capital_growth_rate}%
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Valuation Tab */}
      {activeTab === 'valuation' && (
        <div className="space-y-6">
          {Object.entries(valuationData.methods).map(([key, method]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    {method.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-primary-700">
                      {formatCurrency(method.value)}
                    </div>
                    <Badge className={`${getConfidenceColor(method.confidence)}`}>
                      {Math.round(method.confidence * 100)}%
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(method.breakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span className="font-medium">
                            {typeof value === 'number' ? formatCurrency(value) : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Factors</h4>
                    <div className="space-y-2">
                      {method.factors.positive.map((factor, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle className="h-3 w-3" />
                          {factor}
                        </div>
                      ))}
                      {method.factors.negative.map((factor, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          {factor}
                        </div>
                      ))}
                      {method.factors.neutral.map((factor, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <Info className="h-3 w-3" />
                          {factor}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Analysis</h4>
                  <p className="text-sm text-gray-600">{method.whyThisResult}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rental & Yield Tab */}
      {activeTab === 'rental' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Rental Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-700">
                    {formatCurrency(valuationData.methods.incomeApproach.breakdown.grossRent)}
                  </div>
                  <div className="text-sm text-gray-600">Annual Rent</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-700">
                    {rentalYield ? `${rentalYield.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Rental Yield</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-700">
                    {valuationData.methods.incomeApproach.breakdown.capRate}%
                  </div>
                  <div className="text-sm text-gray-600">Cap Rate</div>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <h4 className="font-medium">Income Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Annual Rent</span>
                      <span className="font-medium">{formatCurrency(valuationData.methods.incomeApproach.breakdown.grossRent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Operating Expenses</span>
                      <span className="font-medium">-{formatCurrency(valuationData.methods.incomeApproach.breakdown.operatingExpenses)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Net Operating Income</span>
                      <span>{formatCurrency(valuationData.methods.incomeApproach.breakdown.netOperatingIncome)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Value</span>
                      <span className="font-medium">{formatCurrency(valuationData.methods.incomeApproach.value)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cap Rate</span>
                      <span className="font-medium">{valuationData.methods.incomeApproach.breakdown.capRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Source</span>
                      <span className="font-medium text-sm">{valuationData.methods.incomeApproach.breakdown.dataSource}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Location Tab */}
      {activeTab === 'location' && planningData && (
        <div className="space-y-6">
          {/* Transport */}
          {planningData.transport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Train className="h-5 w-5" />
                  Transport Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {planningData.transport.nearest_tube && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Train className="h-4 w-4 text-red-600" />
                        <span className="font-medium">Nearest Tube</span>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{planningData.transport.nearest_tube.station}</div>
                        <div className="text-gray-600">{planningData.transport.nearest_tube.distance_meters}m away</div>
                        <div className="text-gray-600">{planningData.transport.nearest_tube.frequency_minutes}min frequency</div>
                      </div>
                    </div>
                  )}
                  {planningData.transport.nearest_train && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Train className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Nearest Train</span>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{planningData.transport.nearest_train.station}</div>
                        <div className="text-gray-600">{planningData.transport.nearest_train.distance_meters}m away</div>
                        <div className="text-gray-600">{planningData.transport.nearest_train.frequency_minutes}min frequency</div>
                      </div>
                    </div>
                  )}
                  {planningData.transport.nearest_bus && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Bus className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Nearest Bus</span>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{planningData.transport.nearest_bus.distance_meters}m away</div>
                        <div className="text-gray-600">Routes: {planningData.transport.nearest_bus.routes.join(', ')}</div>
                        <div className="text-gray-600">{planningData.transport.nearest_bus.frequency_minutes}min frequency</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schools */}
          {planningData.schools && planningData.schools.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Nearby Schools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {planningData.schools.map((school, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{school.name}</div>
                        <div className="text-sm text-gray-600">
                          {school.distance_meters}m away • {school.type} • {school.age_range}
                        </div>
                      </div>
                      <Badge className={`${
                        school.ofsted_rating === 'Outstanding' ? 'bg-green-100 text-green-800' :
                        school.ofsted_rating === 'Good' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {school.ofsted_rating}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Amenities */}
          {planningData.amenities && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Local Amenities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {planningData.amenities.supermarkets && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Supermarkets
                      </h4>
                      <div className="space-y-2">
                        {planningData.amenities.supermarkets.map((supermarket, index) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium">{supermarket.name}</div>
                            <div className="text-gray-600">{supermarket.distance_meters}m away</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {planningData.amenities.restaurants && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Restaurants
                      </h4>
                      <div className="space-y-2">
                        {planningData.amenities.restaurants.map((restaurant, index) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium">{restaurant.name}</div>
                            <div className="text-gray-600">
                              {restaurant.distance_meters}m away • ⭐ {restaurant.rating}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {planningData.amenities.parks && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Trees className="h-4 w-4" />
                        Parks
                      </h4>
                      <div className="space-y-2">
                        {planningData.amenities.parks.map((park, index) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium">{park.name}</div>
                            <div className="text-gray-600">{park.distance_meters}m away</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Market Tab */}
      {activeTab === 'market' && planningData?.market_metrics && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {planningData.market_metrics.avg_days_on_market}
                  </div>
                  <div className="text-sm text-gray-600">Days on Market</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {(planningData.market_metrics.price_reduction_rate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Price Reduction Rate</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">
                    {planningData.market_metrics.demand_score}/10
                  </div>
                  <div className="text-sm text-gray-600">Demand Score</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">
                    {planningData.market_metrics.supply_score}/10
                  </div>
                  <div className="text-sm text-gray-600">Supply Score</div>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <h4 className="font-medium">Market Sentiment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">Price Trend</span>
                    </div>
                    <div className="text-2xl font-bold capitalize">
                      {planningData.market_metrics.price_trend}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="font-medium">Capital Growth</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {planningData.market_metrics.capital_growth_rate}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {planningData.recent_activity && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Market Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {planningData.recent_activity.properties_sold_last_month}
                    </div>
                    <div className="text-sm text-gray-600">Properties Sold (Last Month)</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {planningData.recent_activity.properties_listed_last_month}
                    </div>
                    <div className="text-sm text-gray-600">Properties Listed (Last Month)</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">
                      {formatCurrency(planningData.recent_activity.avg_price_per_sqm)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Price per m²</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Improve Tab */}
      {activeTab === 'improve' && valuationData?.missingData && (
        <div className="space-y-6">
          <MissingDataCard 
            missingData={valuationData.missingData}
            onDataUpdate={(fieldName, value) => {
              console.log(`User provided ${fieldName}: ${value}`);
              // Here you could implement logic to update the valuation with new data
              // For now, we'll just log the update
            }}
          />
        </div>
      )}
    </div>
  );
} 

function ManualAddToPortfolioForm({ postcode, houseNumber }: { postcode: string; houseNumber: string }) {
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const propertyData = {
        address: address || `${houseNumber} ${postcode}`,
        postcode,
        houseNumber,
        propertyType,
        bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        purchaseDate,
        currentValue: purchasePrice ? parseFloat(purchasePrice) : undefined,
        dealScore: 0,
        dealRating: 'Manual',
        bmvScore: 0,
        notes: 'Manually added property',
      };
      const res = await fetch('/api/portfolio/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData),
      });
      if (res.ok) {
        success('Property added to your portfolio!');
      } else {
        const data = await res.json();
        error(data.error || 'Failed to add property');
      }
    } catch (err) {
      error('Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <input
        className="w-full border rounded p-2"
        placeholder="Address (optional)"
        value={address}
        onChange={e => setAddress(e.target.value)}
      />
      <input
        className="w-full border rounded p-2"
        placeholder="Property Type (e.g. Terraced)"
        value={propertyType}
        onChange={e => setPropertyType(e.target.value)}
        required
      />
      <input
        className="w-full border rounded p-2"
        placeholder="Bedrooms (optional)"
        type="number"
        value={bedrooms}
        onChange={e => setBedrooms(e.target.value)}
      />
      <input
        className="w-full border rounded p-2"
        placeholder="Purchase Price (£)"
        type="number"
        value={purchasePrice}
        onChange={e => setPurchasePrice(e.target.value)}
        required
      />
      <input
        className="w-full border rounded p-2"
        placeholder="Purchase Date (YYYY-MM-DD)"
        type="date"
        value={purchaseDate}
        onChange={e => setPurchaseDate(e.target.value)}
        required
      />
      <button
        type="submit"
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Adding...' : 'Add to Portfolio'}
      </button>
    </form>
  );
} 