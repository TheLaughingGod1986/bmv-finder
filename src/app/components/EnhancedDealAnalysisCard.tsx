'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress } from './SimpleCard';
import Button from './Button';
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
  HelpCircle,
  Plus,
  Calculator,
  Info
} from 'lucide-react';
import { predictFutureValues } from '@/lib/bmvScoreEngine';

interface DealAnalysisProps {
  data: {
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
      postcode?: string;
    } | null;
    sold_prices: Array<{
      price: number;
      date: string;
      property_type: string;
      new_build: boolean;
      estate_type: string;
      transaction_type: string;
      address?: string;
      postcode?: string;
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
  };
  loading?: boolean;
}

// Equation Explanation Modal Component
function EquationModal({ isOpen, onClose, type, data }: { 
  isOpen: boolean; 
  onClose: () => void; 
  type: 'hpi' | 'current'; 
  data: any;
}) {
  if (!isOpen) return null;

  const hpiCalculation = data.deal_metrics.last_sold_price && data.deal_metrics.hpi_adjusted_value && data.hpi_data.length > 0;
  const currentHpi = data.hpi_data[0]?.hpi_value;
  const saleHpi = data.hpi_data.find(hpi => new Date(hpi.date) <= new Date(data.sold_prices[0]?.date))?.hpi_value;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {type === 'hpi' ? 'HPI Adjusted Value Calculation' : 'Current Estimate Calculation'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        
        {type === 'hpi' ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              This shows what your property would be worth if it grew exactly in line with the regional market average (HPI).
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-mono space-y-1">
                <div>HPI Adjusted Value = Last Sold Price × (Current HPI / HPI at Sale)</div>
                {hpiCalculation && (
                  <div className="text-xs text-gray-600 mt-2">
                    <div>£{data.deal_metrics.last_sold_price?.toLocaleString()} × ({currentHpi} / {saleHpi})</div>
                    <div>= £{data.deal_metrics.hpi_adjusted_value?.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Our model combines HPI data, recent local sales, property features, and market trends to estimate the current market value.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm space-y-2">
                <div className="font-medium">Factors considered:</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Regional HPI trends</li>
                  <li>• Recent comparable sales</li>
                  <li>• Property features (bedrooms, size, etc.)</li>
                  <li>• Local market conditions</li>
                  <li>• Property-specific factors</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <Button onClick={onClose} className="w-full">
          Got it
        </Button>
      </div>
    </div>
  );
}

// Tooltip Component
function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}

export default function EnhancedDealAnalysisCard({ data, loading = false }: DealAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'history' | 'market'>('overview');
  const [equationModal, setEquationModal] = useState<'hpi' | 'current' | null>(null);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Enhanced Deal Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
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
      case 'Excellent': return <CheckCircle className="h-4 w-4" />;
      case 'Good': return <CheckCircle className="h-4 w-4" />;
      case 'Fair': return <Target className="h-4 w-4" />;
      case 'Poor': return <AlertTriangle className="h-4 w-4" />;
      case 'Overpriced': return <XCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
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

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Calculate projected values
  const currentValue = data.deal_metrics.current_value_estimate || data.deal_metrics.hpi_adjusted_value || data.deal_metrics.last_sold_price || 0;
  let annualGrowthRate = 0.03; // Default 3%
  
  if (data.hpi_data && data.hpi_data.length > 0) {
    const localRegionData = data.hpi_data.filter(hpi => hpi.region === 'TYNE AND WEAR');
    const dataToUse = localRegionData.length > 0 ? localRegionData : data.hpi_data;
    
    const recentData = dataToUse.slice(0, 12);
    if (recentData.length >= 2) {
      const latestHpi = recentData[0].hpi_value;
      const oldestHpi = recentData[recentData.length - 1].hpi_value;
      const monthsDiff = recentData.length - 1;
      
      if (oldestHpi > 0 && monthsDiff > 0) {
        const totalGrowth = (latestHpi - oldestHpi) / oldestHpi;
        const annualizedGrowth = Math.pow(1 + totalGrowth, 12 / monthsDiff) - 1;
        annualGrowthRate = Math.max(0.01, Math.min(0.15, annualizedGrowth));
      }
    }
    
    if (annualGrowthRate === 0.03) {
      const region = dataToUse[0]?.region;
      if (region) {
        const regionalRates: { [key: string]: number } = {
          'TYNE AND WEAR': 0.035,
          'ENGLAND': 0.032,
          'LONDON': 0.025,
          'MANCHESTER': 0.045,
          'BIRMINGHAM': 0.038,
        };
        annualGrowthRate = regionalRates[region] || 0.032;
      }
    }
  } else if (typeof data.market_insights.price_trend === 'string') {
    if (data.market_insights.price_trend === 'rising') annualGrowthRate = 0.04;
    if (data.market_insights.price_trend === 'falling') annualGrowthRate = 0.01;
  }
  
  const projectedValues = predictFutureValues(currentValue, annualGrowthRate);

  // Create HPI trend data - deduplicate by month and show only one entry per month
  const hpiTrendData = data.hpi_data.slice(0, 12).reduce((acc, hpi) => {
    const monthKey = new Date(hpi.date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    const existingIndex = acc.findIndex(item => item.date === monthKey);
    
    if (existingIndex === -1) {
      // First entry for this month
      acc.push({
        date: monthKey,
        value: hpi.hpi_value,
        change: null // Will be calculated later
      });
    }
    return acc;
  }, [] as Array<{date: string, value: number, change: number | null}>);

  // Calculate month-over-month changes
  hpiTrendData.forEach((item, idx) => {
    const previous = hpiTrendData[idx + 1]; // Previous month in chronological order
    if (previous) {
      item.change = ((item.value - previous.value) / previous.value) * 100;
    }
  });

  // Calculate value differences for explanation
  const hpiAdjustedValue = data.deal_metrics.hpi_adjusted_value || 0;
  const currentEstimate = data.deal_metrics.current_value_estimate || 0;
  const lastSoldPrice = data.deal_metrics.last_sold_price || 0;
  
  const hpiVsSold = hpiAdjustedValue - lastSoldPrice;
  const currentVsSold = currentEstimate - lastSoldPrice;
  const currentVsHpi = currentEstimate - hpiAdjustedValue;

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Enhanced Deal Analysis
            </div>
            <Badge className={getDealRatingColor(data.deal_metrics.deal_rating)}>
              <div className="flex items-center gap-1">
                {getDealRatingIcon(data.deal_metrics.deal_rating)}
                {data.deal_metrics.deal_rating}
              </div>
            </Badge>
          </CardTitle>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4">
            {[
              { id: 'overview', label: 'Overview', icon: Target },
              { id: 'charts', label: 'Charts', icon: BarChart3 },
              { id: 'history', label: 'History', icon: Clock },
              { id: 'market', label: 'Market', icon: Building }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Deal Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Deal Score</span>
                  <span className="text-sm font-bold">{data.deal_metrics.deal_score}/100</span>
                </div>
                <Progress value={data.deal_metrics.deal_score} className="h-3" />
              </div>

              {/* Current Market Value Analysis Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary-600" />
                  Current Market Value Analysis
                </h3>
                
                {/* Value Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Last Sold Price */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <PoundSterling className="h-3 w-3" />
                      Last Sold Price (What you paid)
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

                  {/* HPI Adjusted Value */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <TrendingUp className="h-3 w-3" />
                        If Grown with Market (HPI Adjusted)
                      </div>
                      <Tooltip content="What the property would be worth if it tracked the regional market average since you bought it">
                        <HelpCircle className="h-3 w-3 text-gray-400" />
                      </Tooltip>
                    </div>
                    <div className="font-bold text-lg">
                      {formatCurrency(data.deal_metrics.hpi_adjusted_value)}
                    </div>
                    {hpiVsSold !== 0 && (
                      <div className={`text-xs font-medium ${
                        hpiVsSold > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage((hpiVsSold / lastSoldPrice) * 100)}
                      </div>
                    )}
                    <button 
                      onClick={() => setEquationModal('hpi')}
                      className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                    >
                      <Calculator className="h-3 w-3" />
                      Show Calculation
                    </button>
                  </div>

                  {/* Current Market Estimate */}
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-blue-600">
                        <Target className="h-3 w-3" />
                        Current Market Estimate
                      </div>
                      <Tooltip content="Our best estimate of your property's value, based on market data, comparables, and local trends">
                        <HelpCircle className="h-3 w-3 text-blue-400" />
                      </Tooltip>
                    </div>
                    <div className="font-bold text-lg text-blue-700">
                      {formatCurrency(data.deal_metrics.current_value_estimate)}
                    </div>
                    {currentVsSold !== 0 && (
                      <div className={`text-xs font-medium ${
                        currentVsSold > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage((currentVsSold / lastSoldPrice) * 100)} change
                      </div>
                    )}
                    <button 
                      onClick={() => setEquationModal('current')}
                      className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                    >
                      <Calculator className="h-3 w-3" />
                      Show Calculation
                    </button>
                  </div>
                </div>

                {/* Value Comparison Info Box */}
                {currentVsHpi !== 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <div className="font-medium mb-1">
                          {currentVsHpi < 0 ? 'Why is Current Estimate lower than HPI Adjusted?' : 'Why is Current Estimate higher than HPI Adjusted?'}
                        </div>
                        <div className="text-xs">
                          {currentVsHpi < 0 
                            ? "Our model estimates a lower value than the market average. This may be due to local sales that underperformed, property-specific factors, or recent market conditions."
                            : "Our model estimates a higher value than the market average. This may be due to recent improvements, high local demand, or property-specific advantages."
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add to Portfolio Button */}
                <div className="flex justify-center pt-4">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 flex items-center gap-2"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/portfolio/add', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            address: data.property_info?.address || `${data.sold_prices[0]?.property_type || 'Property'}`,
                            postcode: data.property_info?.postcode || '',
                            houseNumber: data.sold_prices[0]?.address?.split(' ')[0] || '',
                            lastSoldPrice: data.deal_metrics.last_sold_price,
                            hpiAdjustedValue: data.deal_metrics.hpi_adjusted_value,
                            currentEstimate: data.deal_metrics.current_value_estimate,
                            dealScore: data.deal_metrics.deal_score,
                            dealRating: data.deal_metrics.deal_rating
                          })
                        });

                        if (response.ok) {
                          // Show success message (you can integrate with your toast system)
                          alert('Property added to portfolio successfully!');
                        } else {
                          const error = await response.json();
                          alert(error.error || 'Failed to add to portfolio');
                        }
                      } catch (error) {
                        console.error('Error adding to portfolio:', error);
                        alert('Failed to add to portfolio');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add to Portfolio
                  </Button>
                </div>
              </div>

              {/* Price Metrics */}
              <div className="grid grid-cols-2 gap-4">
                {data.deal_metrics.price_per_sqm && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Ruler className="h-3 w-3" />
                      Price/Sqm
                    </div>
                    <div className="font-bold text-lg">
                      {formatCurrency(data.deal_metrics.price_per_sqm)}
                    </div>
                    {data.market_insights.average_price_per_sqm && (
                      <div className={`text-xs font-medium ${
                        data.deal_metrics.price_per_sqm < data.market_insights.average_price_per_sqm
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {formatPercentage((data.market_insights.average_price_per_sqm - data.deal_metrics.price_per_sqm) / data.market_insights.average_price_per_sqm * 100)} vs market
                      </div>
                    )}
                  </div>
                )}

                {data.deal_metrics.price_per_bedroom && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Bed className="h-3 w-3" />
                      Price/Bedroom
                    </div>
                    <div className="font-bold text-lg">
                      {formatCurrency(data.deal_metrics.price_per_bedroom)}
                    </div>
                    {data.market_insights.average_price_per_bedroom && (
                      <div className={`text-xs font-medium ${
                        data.deal_metrics.price_per_bedroom < data.market_insights.average_price_per_bedroom
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {formatPercentage((data.market_insights.average_price_per_bedroom - data.deal_metrics.price_per_bedroom) / data.market_insights.average_price_per_bedroom * 100)} vs market
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Projected Value Growth */}
              <div className="space-y-3">
                <h4 className="font-semibold text-green-800">Projected Value Growth</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 space-y-2 border border-green-200">
                    <div className="flex items-center gap-1 text-sm text-green-700">
                      <TrendingUp className="h-3 w-3" />
                      2 Years
                    </div>
                    <div className="font-bold text-lg text-green-800">
                      {formatCurrency(projectedValues[2].value)}
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      +{projectedValues[2].growth}% growth
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 space-y-2 border border-green-200">
                    <div className="flex items-center gap-1 text-sm text-green-700">
                      <TrendingUp className="h-3 w-3" />
                      3 Years
                    </div>
                    <div className="font-bold text-lg text-green-800">
                      {formatCurrency(projectedValues[3]?.value || projectedValues[2].value * Math.pow(1 + annualGrowthRate, 1))}
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      +{((projectedValues[3]?.growth || (projectedValues[2].growth + annualGrowthRate * 100))).toFixed(1)}% growth
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 space-y-2 border border-green-200">
                    <div className="flex items-center gap-1 text-sm text-green-700">
                      <TrendingUp className="h-3 w-3" />
                      5 Years
                    </div>
                    <div className="font-bold text-lg text-green-800">
                      {formatCurrency(projectedValues[5].value)}
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      +{projectedValues[5].growth}% growth
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 italic">
                  Based on {annualGrowthRate > 0 ? '+' : ''}{(annualGrowthRate * 100).toFixed(1)}% annual growth rate
                </div>
              </div>

              {/* HPI Trend Table */}
              {hpiTrendData.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">HPI Trend (Last 12 Months)</h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-200">
                      <div className="font-medium text-gray-700">Month</div>
                      <div className="font-medium text-gray-700">HPI Value</div>
                      <div className="font-medium text-gray-700">Change</div>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {hpiTrendData.map((hpi, index) => (
                        <div key={index} className="grid grid-cols-3 gap-4 p-4 hover:bg-gray-50">
                          <div className="font-medium text-gray-900">{hpi.date}</div>
                          <div className="font-medium">{hpi.value.toFixed(1)}</div>
                          <div>
                            {hpi.change !== null ? (
                              <span className={`font-medium ${
                                hpi.change > 0 ? 'text-green-600' : hpi.change < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {hpi.change > 0 ? '+' : ''}{hpi.change.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Property Details */}
              {data.property_info && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-blue-900">Property Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {data.property_info.bedrooms && (
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4 text-blue-600" />
                        <span>{data.property_info.bedrooms} Bedrooms</span>
                      </div>
                    )}
                    {data.property_info.floor_area_m2 && (
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-blue-600" />
                        <span>{data.property_info.floor_area_m2}m²</span>
                      </div>
                    )}
                    {data.property_info.epc_rating && (
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span>EPC: {data.property_info.epc_rating}</span>
                      </div>
                    )}
                    {data.property_info.property_type && (
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-blue-600" />
                        <span>{data.property_info.property_type}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced EPC Details */}
              {data.property_info && (data.property_info.construction_year || data.property_info.current_energy_rating || data.property_info.potential_energy_rating || data.property_info.epc_date) && (
                <div className="bg-amber-50 rounded-lg p-4 space-y-3 border border-amber-200">
                  <h4 className="font-semibold text-amber-900">Enhanced EPC Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {data.property_info.construction_year && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-amber-600" />
                        <span>Built: {data.property_info.construction_year}</span>
                      </div>
                    )}
                    {data.property_info.current_energy_rating && (
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-600" />
                        <span>Current: {data.property_info.current_energy_rating}</span>
                      </div>
                    )}
                    {data.property_info.potential_energy_rating && (
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-600" />
                        <span>Potential: {data.property_info.potential_energy_rating}</span>
                      </div>
                    )}
                    {data.property_info.epc_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-amber-600" />
                        <span>EPC Date: {formatDate(data.property_info.epc_date)}</span>
                      </div>
                    )}
                    {data.property_info.certificate_id && (
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="h-4 w-4 text-amber-600" />
                        <span>Certificate: {data.property_info.certificate_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Analysis Points */}
              {data.deal_metrics.analysis && data.deal_metrics.analysis.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900">Analysis Insights</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {data.deal_metrics.analysis.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Charts Tab */}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Charts and visualizations coming soon...</p>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900">Price History</h3>
              <div className="space-y-3">
                {data.sold_prices.map((sale, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{formatDate(sale.date)}</div>
                      <div className="text-sm text-gray-600">{sale.property_type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatCurrency(sale.price)}</div>
                      <div className="text-xs text-gray-500">{sale.transaction_type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Tab */}
          {activeTab === 'market' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900">Market Insights</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">Price Trend</div>
                  <div className="flex items-center gap-2">
                    {data.market_insights.price_trend === 'rising' && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {data.market_insights.price_trend === 'falling' && <TrendingDown className="h-4 w-4 text-red-600" />}
                    {data.market_insights.price_trend === 'stable' && <Minus className="h-4 w-4 text-gray-600" />}
                    <span className="font-medium capitalize">{data.market_insights.price_trend}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">Market Volatility</div>
                  <div className="font-medium capitalize">{data.market_insights.market_volatility}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equation Modal */}
      <EquationModal 
        isOpen={equationModal !== null} 
        onClose={() => setEquationModal(null)} 
        type={equationModal || 'hpi'} 
        data={data}
      />
    </>
  );
} 