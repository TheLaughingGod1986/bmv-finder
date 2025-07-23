'use client';

import { useState } from 'react';
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
  Shield,
  Lightbulb,
  Info
} from 'lucide-react';

interface EnhancedPredictionProps {
  data: {
    postcode: string;
    number: string;
    prediction: {
      predictedValue: number;
      confidence: number;
      predictionRange: {
        low: number;
        high: number;
      };
      factors: {
        hpiAdjustment: number;
        comparableSales: number;
        energyEfficiency: number;
        marketTrends: number;
        economicFactors: number;
      };
      breakdown: {
        baseValue: number;
        hpiMultiplier: number;
        energyEfficiencyBonus: number;
        marketTrendAdjustment: number;
        inflationAdjustment: number;
      };
      futureProjections: {
        oneYear: number;
        threeYear: number;
        fiveYear: number;
        tenYear: number;
      };
      riskFactors: string[];
      recommendations: string[];
    };
    features: {
      propertyType: string;
      bedrooms: number | null;
      floorArea: number | null;
      epcRating: string | null;
      lastSoldPrice: number | null;
      lastSoldDate: string | null;
      hpiDataPoints: number;
      transactionVolume: number;
    };
  };
  loading?: boolean;
}

export default function EnhancedPredictionCard({ data, loading = false }: EnhancedPredictionProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'projections' | 'analysis'>('overview');

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Enhanced Property Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
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

  const calculateGrowth = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'breakdown', label: 'Breakdown', icon: Target },
    { id: 'projections', label: 'Projections', icon: TrendingUp },
    { id: 'analysis', label: 'Analysis', icon: Info }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Enhanced Property Prediction
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-1"
              >
                <Icon className="h-3 w-3" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Main Prediction */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.prediction.predictedValue)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Predicted Current Value
              </div>
              <div className="flex items-center justify-center gap-4 mt-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {getConfidenceLabel(data.prediction.confidence)} Confidence
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {Math.round(data.prediction.confidence * 100)}%
                </Badge>
              </div>
            </div>

            {/* Prediction Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg border">
                <div className="text-lg font-semibold text-red-700">
                  {formatCurrency(data.prediction.predictionRange.low)}
                </div>
                <div className="text-sm text-red-600">Low Estimate</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border">
                <div className="text-lg font-semibold text-green-700">
                  {formatCurrency(data.prediction.predictionRange.high)}
                </div>
                <div className="text-sm text-green-600">High Estimate</div>
              </div>
            </div>

            {/* Property Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.features.bedrooms && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Bed className="h-5 w-5 mx-auto text-gray-600 mb-1" />
                  <div className="font-semibold">{data.features.bedrooms}</div>
                  <div className="text-xs text-gray-600">Bedrooms</div>
                </div>
              )}
              {data.features.floorArea && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Ruler className="h-5 w-5 mx-auto text-gray-600 mb-1" />
                  <div className="font-semibold">{data.features.floorArea}m²</div>
                  <div className="text-xs text-gray-600">Floor Area</div>
                </div>
              )}
              {data.features.epcRating && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Zap className="h-5 w-5 mx-auto text-gray-600 mb-1" />
                  <div className="font-semibold">{data.features.epcRating}</div>
                  <div className="text-xs text-gray-600">EPC Rating</div>
                </div>
              )}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Building className="h-5 w-5 mx-auto text-gray-600 mb-1" />
                <div className="font-semibold">{data.features.propertyType}</div>
                <div className="text-xs text-gray-600">Type</div>
              </div>
            </div>

            {/* Last Sale Comparison */}
            {data.features.lastSoldPrice && (
              <div className="p-4 bg-yellow-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Last Sold</div>
                    <div className="text-sm text-gray-600">
                      {data.features.lastSoldDate && new Date(data.features.lastSoldDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(data.features.lastSoldPrice)}</div>
                    <div className={`text-sm font-medium ${
                      data.prediction.predictedValue > data.features.lastSoldPrice ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(calculateGrowth(data.prediction.predictedValue, data.features.lastSoldPrice))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div className="space-y-6">
            {/* Factor Weights */}
            <div>
              <h3 className="font-semibold mb-3">Prediction Factors</h3>
              <div className="space-y-3">
                {Object.entries(data.prediction.factors).map(([factor, value]) => (
                  <div key={factor} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="capitalize">{factor.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                    <div className="font-semibold">{formatCurrency(value)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div>
              <h3 className="font-semibold mb-3">Value Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>Base Value</span>
                  <span className="font-semibold">{formatCurrency(data.prediction.breakdown.baseValue)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span>HPI Multiplier</span>
                  <span className="font-semibold">{data.prediction.breakdown.hpiMultiplier.toFixed(3)}x</span>
                </div>
                {data.prediction.breakdown.energyEfficiencyBonus !== 0 && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span>Energy Efficiency Bonus</span>
                    <span className={`font-semibold ${
                      data.prediction.breakdown.energyEfficiencyBonus > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(data.prediction.breakdown.energyEfficiencyBonus)}
                    </span>
                  </div>
                )}
                {data.prediction.breakdown.marketTrendAdjustment !== 0 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span>Market Trend Adjustment</span>
                    <span className={`font-semibold ${
                      data.prediction.breakdown.marketTrendAdjustment > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(data.prediction.breakdown.marketTrendAdjustment)}
                    </span>
                  </div>
                )}
                {data.prediction.breakdown.inflationAdjustment !== 0 && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span>Inflation Adjustment</span>
                    <span className="font-semibold text-purple-600">
                      {formatCurrency(data.prediction.breakdown.inflationAdjustment)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projections' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Future Value Projections</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(data.prediction.futureProjections).map(([period, value]) => (
                  <div key={period} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(value)}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {period.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    {data.features.lastSoldPrice && (
                      <div className="text-xs text-gray-500 mt-1">
                        {formatPercentage(calculateGrowth(value, data.features.lastSoldPrice))} from last sale
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Chart */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-3">Growth Trajectory</h4>
              <div className="space-y-2">
                {Object.entries(data.prediction.futureProjections).map(([period, value], index) => {
                  const growth = data.features.lastSoldPrice ? 
                    calculateGrowth(value, data.features.lastSoldPrice) : 0;
                  return (
                    <div key={period} className="flex items-center gap-3">
                      <div className="w-16 text-sm text-gray-600 capitalize">
                        {period.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(Math.max(growth, 0), 100)}%` }}
                        ></div>
                      </div>
                      <div className="w-20 text-sm font-medium text-right">
                        {formatPercentage(growth / 100)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Risk Factors */}
            {data.prediction.riskFactors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Risk Factors
                </h3>
                <div className="space-y-2">
                  {data.prediction.riskFactors.map((risk, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-orange-800">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {data.prediction.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Recommendations
                </h3>
                <div className="space-y-2">
                  {data.prediction.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-yellow-800">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Quality */}
            <div>
              <h3 className="font-semibold mb-3">Data Quality</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">HPI Data Points</div>
                  <div className="font-semibold">{data.features.hpiDataPoints}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Transaction Volume</div>
                  <div className="font-semibold">{data.features.transactionVolume}</div>
                </div>
              </div>
            </div>

            {/* Confidence Explanation */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                Confidence Score Explanation
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• <strong>High (80%+):</strong> Comprehensive data with consistent predictions</div>
                <div>• <strong>Medium (60-79%):</strong> Good data with some uncertainty</div>
                <div>• <strong>Low (Below 60%):</strong> Limited data or inconsistent predictions</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 