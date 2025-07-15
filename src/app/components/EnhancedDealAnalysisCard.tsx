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
  Minus
} from 'lucide-react';

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
  };
  loading?: boolean;
}

export default function EnhancedDealAnalysisCard({ data, loading = false }: DealAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'history' | 'market'>('overview');

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

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Calculate price change percentage
  const getPriceChange = () => {
    if (data.sold_prices.length < 2) return null;
    const latest = data.sold_prices[0].price;
    const previous = data.sold_prices[1].price;
    return ((latest - previous) / previous) * 100;
  };

  // Create price history chart data
  const priceHistoryData = data.sold_prices.map((sale, index) => ({
    date: formatDate(sale.date),
    price: sale.price,
    label: `Sale ${data.sold_prices.length - index}`
  })).reverse();

  // Create HPI trend data
  const hpiTrendData = data.hpi_data.slice(0, 12).map(hpi => ({
    date: new Date(hpi.date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
    value: hpi.hpi_value,
    change: hpi.hpi_change
  }));

  return (
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

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-3 gap-4">
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

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <TrendingUp className="h-3 w-3" />
                  HPI Adjusted
                </div>
                <div className="font-bold text-lg">
                  {formatCurrency(data.deal_metrics.hpi_adjusted_value)}
                </div>
                {data.deal_metrics.hpi_adjusted_value && data.deal_metrics.last_sold_price && (
                  <div className={`text-xs font-medium ${
                    data.deal_metrics.hpi_adjusted_value > data.deal_metrics.last_sold_price 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatPercentage((data.deal_metrics.hpi_adjusted_value - data.deal_metrics.last_sold_price) / data.deal_metrics.last_sold_price * 100)}
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
                    {formatPercentage((data.deal_metrics.current_value_estimate - data.deal_metrics.last_sold_price) / data.deal_metrics.last_sold_price * 100)} change
                  </div>
                )}
              </div>

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
                      <span>{data.property_info.floor_area_m2} sqm</span>
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

            {/* Analysis Points */}
            <div className="space-y-2">
              <h4 className="font-semibold">Analysis Summary</h4>
              <div className="space-y-2">
                {data.deal_metrics.analysis.map((point, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            {/* Price History Chart */}
            <div className="space-y-3">
              <h4 className="font-semibold">Price History</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {priceHistoryData.length > 0 ? (
                  <div className="space-y-3">
                    {priceHistoryData.map((sale, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                          <div>
                            <div className="font-medium">{sale.label}</div>
                            <div className="text-sm text-gray-600">{sale.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(sale.price)}</div>
                          {index > 0 && (
                            <div className={`text-xs ${
                              sale.price > priceHistoryData[index - 1].price 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {formatPercentage((sale.price - priceHistoryData[index - 1].price) / priceHistoryData[index - 1].price * 100)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No price history available
                  </div>
                )}
              </div>
            </div>

            {/* HPI Trend Chart */}
            <div className="space-y-3">
              <h4 className="font-semibold">HPI Trend (Last 12 Months)</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {hpiTrendData.length > 0 ? (
                  <div className="space-y-2">
                    {hpiTrendData.map((hpi, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{hpi.date}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{hpi.value.toFixed(1)}</span>
                          <div className={`flex items-center gap-1 text-xs ${
                            hpi.change > 0 ? 'text-green-600' : hpi.change < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {hpi.change > 0 ? <ArrowUpRight className="h-3 w-3" /> : 
                             hpi.change < 0 ? <ArrowDownRight className="h-3 w-3" /> : 
                             <Minus className="h-3 w-3" />}
                            {Math.abs(hpi.change).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No HPI data available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h4 className="font-semibold">Sales History</h4>
            {data.sold_prices.length > 0 ? (
              <div className="space-y-3">
                {data.sold_prices.map((sale, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-lg">{formatCurrency(sale.price)}</div>
                      <div className="text-sm text-gray-600">{formatDate(sale.date)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span> {sale.property_type}
                      </div>
                      <div>
                        <span className="text-gray-600">Estate:</span> {sale.estate_type}
                      </div>
                      <div>
                        <span className="text-gray-600">Transaction:</span> {sale.transaction_type}
                      </div>
                      <div>
                        <span className="text-gray-600">New Build:</span> {sale.new_build ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No sales history available
              </div>
            )}
          </div>
        )}

        {/* Market Tab */}
        {activeTab === 'market' && (
          <div className="space-y-4">
            <h4 className="font-semibold">Market Insights</h4>
            
            {/* Market Trends */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Market Trends</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Price Trend:</span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(data.market_insights.price_trend)}
                    <span className="text-sm font-medium capitalize">{data.market_insights.price_trend}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Volatility:</span>
                  <span className="text-sm font-medium capitalize">{data.market_insights.market_volatility}</span>
                </div>
              </div>
            </div>

            {/* Market Averages */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-green-600" />
                <span className="font-medium">Market Averages</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {data.market_insights.average_price_per_sqm && (
                  <div>
                    <div className="text-sm text-gray-600">Avg Price/Sqm</div>
                    <div className="font-bold">{formatCurrency(data.market_insights.average_price_per_sqm)}</div>
                  </div>
                )}
                {data.market_insights.average_price_per_bedroom && (
                  <div>
                    <div className="text-sm text-gray-600">Avg Price/Bedroom</div>
                    <div className="font-bold">{formatCurrency(data.market_insights.average_price_per_bedroom)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* HPI Data Summary */}
            {data.hpi_data.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">HPI Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Current HPI</div>
                    <div className="font-bold">{data.hpi_data[0]?.hpi_value.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Monthly Change</div>
                    <div className={`font-bold ${
                      data.hpi_data[0]?.hpi_change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(data.hpi_data[0]?.hpi_change || 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 