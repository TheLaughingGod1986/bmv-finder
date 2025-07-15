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
  XCircle
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

export default function DealAnalysisCard({ data, loading = false }: DealAnalysisProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Deal Analysis
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Deal Analysis
          </div>
          <Badge className={getDealRatingColor(data.deal_metrics.deal_rating)}>
            <div className="flex items-center gap-1">
              {getDealRatingIcon(data.deal_metrics.deal_rating)}
              {data.deal_metrics.deal_rating}
            </div>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deal Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Deal Score</span>
            <span className="text-sm font-bold">{data.deal_metrics.deal_score}/100</span>
          </div>
          <Progress value={data.deal_metrics.deal_score} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <PoundSterling className="h-3 w-3" />
              Last Sold
            </div>
            <div className="font-semibold">
              {formatCurrency(data.deal_metrics.last_sold_price)}
            </div>
            {data.sold_prices.length > 0 && (
              <div className="text-xs text-gray-500">
                {formatDate(data.sold_prices[0].date)}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <TrendingUp className="h-3 w-3" />
              HPI Adjusted
            </div>
            <div className="font-semibold">
              {formatCurrency(data.deal_metrics.hpi_adjusted_value)}
            </div>
            {data.deal_metrics.hpi_adjusted_value && data.deal_metrics.last_sold_price && (
              <div className={`text-xs ${data.deal_metrics.hpi_adjusted_value > data.deal_metrics.last_sold_price ? 'text-green-600' : 'text-red-600'}`}>
                {((data.deal_metrics.hpi_adjusted_value - data.deal_metrics.last_sold_price) / data.deal_metrics.last_sold_price * 100).toFixed(1)}% difference
              </div>
            )}
          </div>

          {data.deal_metrics.price_per_sqm && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Ruler className="h-3 w-3" />
                Price/m²
              </div>
              <div className="font-semibold">
                {formatCurrency(data.deal_metrics.price_per_sqm)}
              </div>
              {data.market_insights.average_price_per_sqm && (
                <div className={`text-xs ${data.deal_metrics.price_per_sqm < data.market_insights.average_price_per_sqm ? 'text-green-600' : 'text-red-600'}`}>
                  {((data.market_insights.average_price_per_sqm - data.deal_metrics.price_per_sqm) / data.market_insights.average_price_per_sqm * 100).toFixed(1)}% vs market
                </div>
              )}
            </div>
          )}

          {data.deal_metrics.price_per_bedroom && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Bed className="h-3 w-3" />
                Price/Bedroom
              </div>
              <div className="font-semibold">
                {formatCurrency(data.deal_metrics.price_per_bedroom)}
              </div>
              {data.market_insights.average_price_per_bedroom && (
                <div className={`text-xs ${data.deal_metrics.price_per_bedroom < data.market_insights.average_price_per_bedroom ? 'text-green-600' : 'text-red-600'}`}>
                  {((data.market_insights.average_price_per_bedroom - data.deal_metrics.price_per_bedroom) / data.market_insights.average_price_per_bedroom * 100).toFixed(1)}% vs market
                </div>
              )}
            </div>
          )}
        </div>

        {/* Property Information */}
        {data.property_info && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Property Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-gray-500" />
                <span>{data.property_info.property_type || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-gray-500" />
                <span>{data.property_info.bedrooms || 'N/A'} bedrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-gray-500" />
                <span>{data.property_info.floor_area_m2 || 'N/A'} m²</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-gray-500" />
                <span>EPC {data.property_info.epc_rating || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Market Insights */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Market Insights</h4>
          <div className="flex items-center gap-2 mb-2">
            {getTrendIcon(data.market_insights.price_trend)}
            <span className="text-sm capitalize">
              Market is {data.market_insights.price_trend}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Volatility: <span className="capitalize">{data.market_insights.market_volatility}</span>
          </div>
        </div>

        {/* Analysis Details */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full"
        >
          {showDetails ? 'Hide' : 'Show'} Analysis Details
        </Button>

        {showDetails && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium">Analysis Breakdown</h4>
            <div className="space-y-2">
              {data.deal_metrics.analysis.map((analysis, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                  {analysis}
                </div>
              ))}
            </div>

            {/* Recent Sales */}
            {data.sold_prices.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Recent Sales History</h5>
                <div className="space-y-2">
                  {data.sold_prices.slice(0, 3).map((sale, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                      <span>{formatDate(sale.date)}</span>
                      <span className="font-medium">{formatCurrency(sale.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HPI Trend */}
            {data.hpi_data.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">HPI Trend (Last 6 Months)</h5>
                <div className="space-y-1">
                  {data.hpi_data.slice(0, 6).map((hpi, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{formatDate(hpi.date)}</span>
                      <div className="flex items-center gap-2">
                        <span>{hpi.hpi_value.toFixed(2)}</span>
                        <span className={`text-xs ${hpi.hpi_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {hpi.hpi_change >= 0 ? '+' : ''}{hpi.hpi_change.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 