'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './SimpleCard';
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
  Info,
  Shield,
  TrendingUpIcon,
  TrendingDownIcon,
  Activity
} from 'lucide-react';

interface NextGenValuationCardProps {
  data: {
    valuation: {
      currentValue: number;
      confidence: number;
      valueRange: { min: number; max: number };
      breakdown: {
        hpiAdjusted: number;
        comparableSales: number;
        energyEfficiency: number;
        marketTrends: number;
        propertyCharacteristics: number;
      };
      comparables: Array<{
        price: number;
        date: string;
        propertyType: string;
        bedrooms?: number;
        floorArea?: number;
        epcRating?: string;
        distance: number;
        similarity: number;
        hpiAdjustedPrice: number;
        pricePerSqm?: number;
        pricePerBedroom?: number;
      }>;
      factors: {
        positive: string[];
        negative: string[];
        neutral: string[];
      };
      futureProjections: {
        oneYear: number;
        threeYear: number;
        fiveYear: number;
        tenYear: number;
      };
      marketInsights: {
        localMarketTrend: 'rising' | 'falling' | 'stable';
        marketVolatility: 'low' | 'medium' | 'high';
        demandIndicator: 'high' | 'medium' | 'low';
        supplyIndicator: 'high' | 'medium' | 'low';
      };
    };
    features: any;
  };
  loading?: boolean;
}

export default function NextGenValuationCard({ data, loading = false }: NextGenValuationCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showComparables, setShowComparables] = useState(false);
  const [showFactors, setShowFactors] = useState(false);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { valuation } = data;
  const confidenceColor = valuation.confidence >= 80 ? 'text-green-600' : 
                         valuation.confidence >= 60 ? 'text-yellow-600' : 'text-red-600';
  
  const confidenceIcon = valuation.confidence >= 80 ? <Shield className="h-5 w-5" /> :
                        valuation.confidence >= 60 ? <AlertTriangle className="h-5 w-5" /> :
                        <XCircle className="h-5 w-5" />;

  return (
    <div className="space-y-6">
      {/* Main Valuation Card */}
      <Card className="w-full border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <Calculator className="h-6 w-6 text-blue-600" />
            Next-Generation Property Valuation
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Comprehensive valuation using AI-powered analysis of multiple data sources
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Value Display */}
          <div className="text-center p-6 bg-white rounded-lg border border-blue-200">
            <div className="text-sm text-gray-600 mb-2">Current Market Value</div>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              £{valuation.currentValue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              Range: £{valuation.valueRange.min.toLocaleString()} - £{valuation.valueRange.max.toLocaleString()}
            </div>
          </div>

          {/* Confidence Score */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {confidenceIcon}
              <span className="font-semibold">Confidence Score</span>
            </div>
            <div className={`text-xl font-bold ${confidenceColor}`}>
              {valuation.confidence}%
            </div>
          </div>

          {/* Market Insights */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUpIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Market Trend</span>
              </div>
              <div className="text-lg font-semibold capitalize">
                {valuation.marketInsights.localMarketTrend}
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Volatility</span>
              </div>
              <div className="text-lg font-semibold capitalize">
                {valuation.marketInsights.marketVolatility}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex-1"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showBreakdown ? 'Hide' : 'Show'} Breakdown
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowComparables(!showComparables)}
              className="flex-1"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {showComparables ? 'Hide' : 'Show'} Comparables
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFactors(!showFactors)}
              className="flex-1"
            >
              <Info className="h-4 w-4 mr-2" />
              {showFactors ? 'Hide' : 'Show'} Factors
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Valuation Breakdown */}
      {showBreakdown && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Valuation Breakdown
            </CardTitle>
            <p className="text-sm text-gray-600">
              How the final value was calculated using multiple data sources
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">HPI Adjusted</span>
                </div>
                <div className="text-lg font-bold">£{valuation.breakdown.hpiAdjusted.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Market inflation adjustment</div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Comparable Sales</span>
                </div>
                <div className="text-lg font-bold">£{valuation.breakdown.comparableSales.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Local market comparison</div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Energy Efficiency</span>
                </div>
                <div className="text-lg font-bold">£{valuation.breakdown.energyEfficiency.toLocaleString()}</div>
                <div className="text-sm text-gray-600">EPC rating adjustment</div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Property Features</span>
                </div>
                <div className="text-lg font-bold">£{valuation.breakdown.propertyCharacteristics.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Type, bedrooms, tenure</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparable Sales */}
      {showComparables && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Comparable Sales Analysis
            </CardTitle>
            <p className="text-sm text-gray-600">
              Recent sales of similar properties in the area
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {valuation.comparables.slice(0, 5).map((comp, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">£{comp.price.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">{comp.date}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span> {comp.propertyType}
                      {comp.bedrooms && <span className="ml-2">• {comp.bedrooms} beds</span>}
                    </div>
                    <div>
                      <span className="text-gray-600">Similarity:</span> {comp.similarity}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Factors Analysis */}
      {showFactors && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Valuation Factors
            </CardTitle>
            <p className="text-sm text-gray-600">
              Key factors influencing the property's value
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {valuation.factors.positive.length > 0 && (
              <div>
                <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Positive Factors
                </h4>
                <ul className="space-y-1">
                  {valuation.factors.positive.map((factor, index) => (
                    <li key={index} className="text-sm text-green-600">• {factor}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {valuation.factors.negative.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Negative Factors
                </h4>
                <ul className="space-y-1">
                  {valuation.factors.negative.map((factor, index) => (
                    <li key={index} className="text-sm text-red-600">• {factor}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {valuation.factors.neutral.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Minus className="h-4 w-4" />
                  Neutral Factors
                </h4>
                <ul className="space-y-1">
                  {valuation.factors.neutral.map((factor, index) => (
                    <li key={index} className="text-sm text-gray-600">• {factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Future Projections */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Future Value Projections
          </CardTitle>
          <p className="text-sm text-gray-600">
            Conservative estimates based on historical market performance
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">1 Year</div>
              <div className="text-lg font-bold text-blue-600">
                £{valuation.futureProjections.oneYear.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">3 Years</div>
              <div className="text-lg font-bold text-green-600">
                £{valuation.futureProjections.threeYear.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">5 Years</div>
              <div className="text-lg font-bold text-yellow-600">
                £{valuation.futureProjections.fiveYear.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">10 Years</div>
              <div className="text-lg font-bold text-purple-600">
                £{valuation.futureProjections.tenYear.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 