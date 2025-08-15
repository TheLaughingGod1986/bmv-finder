'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from './SimpleCard';
import { Home, Bed, TrendingUp, Info, Calendar, ChevronDown, ChevronUp, BarChart3, Target, Calculator, MapPin, PoundSterling, ArrowUpRight, ArrowDownRight, Minus, RefreshCw, ChevronRight, TrendingDown } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PropertyValuationCardProps {
  property: {
    address: string;
    postcode: string;
    propertyType: string;
    bedrooms?: number;
    estimatedValue: number;
    confidence: 'high' | 'medium' | 'low';
    valueRange: {
      low: number;
      high: number;
    };
    lastUpdated: string;
    nextUpdate?: string;
    dataSource?: string;
    purchaseHistory?: {
      purchasePrice: number;
      purchaseDate: string;
      totalGain: number;
      growthPercentage: number;
      annualAppreciation: number;
    };
    mortgage?: {
      currentBalance: number;
      propertyReference: string;
    };
    historicalData?: Array<{
      date: string;
      value: number;
    }>;
    comparableSales?: Array<{
      number: string;
      address: string;
      postcode: string;
      propertyType: string;
      price: number;
      date: string;
    }>;
    valuationBreakdown?: {
      comparableSalesValue: number;
      hpiAdjustedValue: number;
      marketTrends: number;
      locationPremium: number;
      propertyCondition: number;
    };
    marketInsights?: {
      averagePricePerSqm: number;
      priceGrowth: number;
      daysOnMarket: number;
      supplyDemand: 'high' | 'medium' | 'low';
    };
  };
}

// Brand Colors - Refined, elegant color palette
const brandColors = {
  primary: {
    blue: '#3A7CA5',
    darkBlue: '#2C6E91',
    green: '#5DA271',
    darkGreen: '#3B755D'
  },
  neutral: {
    beige: '#F5F5DC',
    taupe: '#D2B48C',
    softGrey: '#E5E5E5'
  },
  accent: {
    gold: '#D4AF37',
    silver: '#C0C0C0'
  }
};

const confidenceColors = {
  high: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-red-100 text-red-800 border-red-200',
};

const confidenceLabels = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

const supplyDemandColors = {
  high: 'text-green-600',
  medium: 'text-yellow-600',
  low: 'text-red-600'
};

const supplyDemandLabels = {
  high: 'High demand',
  medium: 'Balanced',
  low: 'Low demand'
};

export default function PropertyValuationCard({ property }: PropertyValuationCardProps) {
  const [showConfidenceInfo, setShowConfidenceInfo] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showMarketInsights, setShowMarketInsights] = useState(false);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [selectedComparable, setSelectedComparable] = useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatShortCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `£${(amount / 1000000).toFixed(1)}m`;
    } else if (amount >= 1000) {
      return `£${(amount / 1000).toFixed(0)}k`;
    }
    return formatCurrency(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden" style={{ borderColor: brandColors.neutral.softGrey }}>
          <CardHeader className="pb-6 border-b" style={{ borderColor: brandColors.neutral.softGrey }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: brandColors.primary.darkBlue }}>
                  Property Valuation Report
                </h2>
                <h3 className="text-xl font-medium mb-3" style={{ color: brandColors.primary.blue }}>
                  {property.address}
                </h3>
                
                {/* Property Details */}
                <div className="flex items-center gap-8 text-sm" style={{ color: brandColors.primary.darkGreen }}>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>{property.propertyType}</span>
                  </div>
                  {property.bedrooms && (
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4" />
                      <span>{property.bedrooms} bed</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{property.postcode}</span>
                  </div>
                </div>
              </div>
              
              {/* Confidence and Update Info */}
              <div className="text-right">
                <button
                  onClick={() => setShowConfidenceInfo(!showConfidenceInfo)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${confidenceColors[property.confidence]}`}
                >
                  {confidenceLabels[property.confidence]}
                  <Info className="h-4 w-4" />
                </button>
                
                <div className="mt-2 text-sm text-gray-500 flex items-center justify-end gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Last updated: {property.lastUpdated}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="grid grid-cols-12 gap-8">
              {/* Left Column - Main Value & Key Metrics */}
              <div className="col-span-4">
                {/* Main Value Display */}
                <div className="rounded-2xl p-6 mb-6 shadow-lg text-white" style={{ background: `linear-gradient(135deg, ${brandColors.primary.darkBlue} 0%, ${brandColors.primary.blue} 100%)` }}>
                  <div className="text-5xl font-bold mb-3">
                    {formatCurrency(property.estimatedValue)}
                  </div>
                  
                  {/* Value Range */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span>Low: {formatShortCurrency(property.valueRange.low)}</span>
                    <div className="flex-1 mx-4">
                      <div className="h-2 rounded-full relative" style={{ backgroundColor: brandColors.neutral.taupe }}>
                        <div 
                          className="h-2 rounded-full absolute top-0 left-0"
                          style={{ 
                            backgroundColor: brandColors.accent.gold,
                            width: `${((property.estimatedValue - property.valueRange.low) / (property.valueRange.high - property.valueRange.low)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <span>High: {formatShortCurrency(property.valueRange.high)}</span>
                  </div>
                  
                  {/* Update Info */}
                  {property.nextUpdate && (
                    <div className="text-sm opacity-90 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      <span>Next update: {property.nextUpdate}</span>
                    </div>
                  )}
                </div>

                {/* Purchase History Summary */}
                {property.purchaseHistory && (
                  <div className="bg-white border rounded-xl p-6 shadow-sm" style={{ borderColor: brandColors.neutral.taupe }}>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: brandColors.primary.darkBlue }}>
                      <TrendingUp className="h-5 w-5" />
                      Investment Summary
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: brandColors.primary.darkGreen }}>Purchase Price</span>
                        <span className="font-bold" style={{ color: brandColors.primary.blue }}>
                          {formatCurrency(property.purchaseHistory.purchasePrice)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: brandColors.primary.darkGreen }}>Total Gain</span>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {formatCurrency(property.purchaseHistory.totalGain)}
                          </div>
                          <div className="text-xs text-green-600">
                            {property.purchaseHistory.growthPercentage.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: brandColors.primary.darkGreen }}>Annual Growth</span>
                        <span className="font-bold text-green-600">
                          {property.purchaseHistory.annualAppreciation.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mortgage Summary */}
                {property.mortgage && (
                  <div className="mt-6 bg-white border rounded-xl p-6 shadow-sm" style={{ borderColor: brandColors.neutral.taupe }}>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: brandColors.primary.darkBlue }}>
                      <PoundSterling className="h-5 w-5" />
                      Mortgage
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: brandColors.primary.darkGreen }}>Current Balance</span>
                        <span className="font-bold" style={{ color: brandColors.primary.blue }}>
                          {formatCurrency(property.mortgage.currentBalance)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: brandColors.primary.darkGreen }}>Equity</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(property.estimatedValue - property.mortgage.currentBalance)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: brandColors.primary.darkGreen }}>LTV Ratio</span>
                        <span className="font-bold" style={{ color: brandColors.primary.blue }}>
                          {((property.mortgage.currentBalance / property.estimatedValue) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Charts & Details */}
              <div className="col-span-8">
                {/* Historical Trend Graph */}
                {property.historicalData && property.historicalData.length > 0 && (
                  <div className="bg-white border rounded-xl p-6 shadow-sm mb-6" style={{ borderColor: brandColors.neutral.taupe }}>
                    <h4 className="text-lg font-semibold mb-4" style={{ color: brandColors.primary.darkBlue }}>
                      Historical Price Trend
                    </h4>
                    
                    <div className="h-64">
                      <Line
                        data={{
                          labels: property.historicalData.map(point => {
                            const date = new Date(point.date);
                            return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
                          }),
                          datasets: [
                            {
                              label: 'Property Value',
                              data: property.historicalData.map(point => point.value),
                              borderColor: brandColors.primary.blue,
                              backgroundColor: `${brandColors.primary.blue}20`,
                              borderWidth: 2,
                              fill: true,
                              tension: 0.4,
                              pointBackgroundColor: brandColors.primary.blue,
                              pointBorderColor: 'white',
                              pointBorderWidth: 2,
                              pointRadius: 4,
                              pointHoverRadius: 6,
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            },
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              titleColor: 'white',
                              bodyColor: 'white',
                              borderColor: brandColors.primary.blue,
                              borderWidth: 1,
                              callbacks: {
                                label: function(context) {
                                  return `Value: ${formatCurrency(context.parsed.y)}`;
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              grid: {
                                color: '#f3f4f6',
                                
                              },
                              ticks: {
                                color: '#6b7280',
                                font: {
                                  size: 11
                                },
                                maxTicksLimit: 6
                              }
                            },
                            y: {
                              grid: {
                                color: '#f3f4f6',
                                
                              },
                              ticks: {
                                color: '#6b7280',
                                font: {
                                  size: 11
                                },
                                callback: function(value) {
                                  return formatShortCurrency(Number(value));
                                }
                              },
                              beginAtZero: false
                            }
                          },
                          interaction: {
                            intersect: false,
                            mode: 'index'
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Market Insights Grid */}
                {property.marketInsights && (
                  <div className="bg-white border rounded-xl p-6 shadow-sm mb-6" style={{ borderColor: brandColors.neutral.taupe }}>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: brandColors.primary.darkBlue }}>
                      <BarChart3 className="h-5 w-5" />
                      Market Insights
                    </h4>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                        <div className="text-2xl font-bold mb-1" style={{ color: brandColors.primary.blue }}>
                          {formatCurrency(property.marketInsights.averagePricePerSqm)}
                        </div>
                        <div className="text-sm" style={{ color: brandColors.primary.darkGreen }}>Avg Price/m²</div>
                      </div>
                      
                      <div className="text-center p-4 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {getGrowthIcon(property.marketInsights.priceGrowth)}
                          <span className="text-2xl font-bold" style={{ color: brandColors.primary.blue }}>
                            {formatPercentage(property.marketInsights.priceGrowth)}
                          </span>
                        </div>
                        <div className="text-sm" style={{ color: brandColors.primary.darkGreen }}>Price Growth</div>
                      </div>
                      
                      <div className="text-center p-4 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                        <div className="text-2xl font-bold mb-1" style={{ color: brandColors.primary.blue }}>
                          {property.marketInsights.daysOnMarket}
                        </div>
                        <div className="text-sm" style={{ color: brandColors.primary.darkGreen }}>Days on Market</div>
                      </div>
                      
                      <div className="text-center p-4 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                        <div className="text-lg font-bold mb-1" style={{ color: brandColors.primary.blue }}>
                          {supplyDemandLabels[property.marketInsights.supplyDemand]}
                        </div>
                        <div className="text-sm" style={{ color: brandColors.primary.darkGreen }}>Supply & Demand</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comparable Sales */}
                {property.comparableSales && property.comparableSales.length > 0 && (
                  <div className="bg-white border rounded-xl p-6 shadow-sm" style={{ borderColor: brandColors.neutral.taupe }}>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: brandColors.primary.darkBlue }}>
                      <MapPin className="h-5 w-5" />
                      Recent Comparable Sales
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {property.comparableSales.slice(0, 6).map((sale, index) => (
                        <div 
                          key={index} 
                          className={`rounded-lg p-4 transition-all duration-200 cursor-pointer ${
                            selectedComparable === index ? 'ring-2 ring-offset-2' : 'hover:shadow-md'
                          }`}
                          style={{ 
                            backgroundColor: selectedComparable === index ? brandColors.neutral.beige : 'white',
                            borderColor: selectedComparable === index ? brandColors.primary.blue : brandColors.neutral.taupe,
                            borderWidth: '1px',
                            
                          }}
                          onClick={() => setSelectedComparable(selectedComparable === index ? null : index)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-lg font-bold" style={{ color: brandColors.primary.darkBlue }}>{sale.number}</span>
                            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: brandColors.accent.silver, color: brandColors.primary.darkGreen }}>
                              {sale.propertyType}
                            </span>
                          </div>
                          
                          <div className="text-sm mb-2" style={{ color: brandColors.primary.blue }}>
                            {sale.postcode}
                          </div>
                          
                          <div className="text-xl font-bold mb-1" style={{ color: brandColors.primary.darkBlue }}>
                            {formatCurrency(sale.price)}
                          </div>
                          
                          <div className="text-xs" style={{ color: brandColors.primary.darkGreen }}>
                            {new Date(sale.date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <Card className="w-full max-w-4xl mx-auto bg-white shadow-xl border-0 rounded-2xl overflow-hidden" style={{ borderColor: brandColors.neutral.softGrey }}>
          <CardHeader className="pb-4 border-b" style={{ borderColor: brandColors.neutral.softGrey }}>
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2" style={{ color: brandColors.primary.darkBlue }}>
                Your estimated home value for
              </h2>
              <h3 className="text-lg font-medium mb-3" style={{ color: brandColors.primary.blue }}>
                {property.address}
              </h3>
              
              {/* Property Details */}
              <div className="flex items-center justify-center gap-6 text-sm" style={{ color: brandColors.primary.darkGreen }}>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span>{property.propertyType}</span>
                </div>
                {property.bedrooms && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    <span>{property.bedrooms} bed</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Estimated Value Section */}
          <div className="text-center">
            {/* Main Value Display */}
            <div className="rounded-2xl p-6 mb-4 shadow-lg text-white" style={{ background: `linear-gradient(135deg, ${brandColors.primary.darkBlue} 0%, ${brandColors.primary.blue} 100%)` }}>
              <div className="text-4xl font-bold mb-2">
                {formatCurrency(property.estimatedValue)}
              </div>
              
              {/* Value Range */}
              <div className="flex items-center justify-between text-sm">
                <span>Low: {formatShortCurrency(property.valueRange.low)}</span>
                <div className="flex-1 mx-4">
                  <div className="h-1 rounded-full relative" style={{ backgroundColor: brandColors.neutral.taupe }}>
                    <div 
                      className="h-1 rounded-full absolute top-0 left-0"
                      style={{ 
                        backgroundColor: brandColors.accent.gold,
                        width: `${((property.estimatedValue - property.valueRange.low) / (property.valueRange.high - property.valueRange.low)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <span>High: {formatShortCurrency(property.valueRange.high)}</span>
              </div>
            </div>

            {/* Confidence Indicator */}
            <button
              onClick={() => setShowConfidenceInfo(!showConfidenceInfo)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${confidenceColors[property.confidence]}`}
            >
              {confidenceLabels[property.confidence]}
              <Info className="h-4 w-4" />
            </button>

            {/* Confidence Info Tooltip */}
            {showConfidenceInfo && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p className="mb-2">
                  <strong>Confidence levels:</strong>
                </p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>High:</strong> Multiple recent comparable sales</li>
                  <li>• <strong>Medium:</strong> Some comparable sales available</li>
                  <li>• <strong>Low:</strong> Limited comparable sales data</li>
                </ul>
              </div>
            )}

            {/* Last Updated */}
            <div className="mt-4 text-sm text-gray-500 flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Last updated: {property.lastUpdated}</span>
            </div>
            
            {/* Next Update & Data Source */}
            {property.nextUpdate && (
              <div className="mt-2 text-sm text-gray-500 flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4" />
                <span>Next update: {property.nextUpdate}</span>
              </div>
            )}
            
            {property.dataSource && (
              <div className="mt-2 text-sm text-gray-500 flex items-center justify-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>{property.dataSource}</span>
              </div>
            )}
          </div>

          {/* Purchase History Section */}
          {property.purchaseHistory && (
            <div className="border-t pt-6" style={{ borderColor: brandColors.neutral.softGrey }}>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: brandColors.primary.darkBlue }}>
                <TrendingUp className="h-5 w-5" />
                Valuation Change
              </h4>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                  <span className="font-medium" style={{ color: brandColors.primary.darkGreen }}>Purchased for</span>
                  <span className="font-bold" style={{ color: brandColors.primary.blue }}>
                    {formatCurrency(property.purchaseHistory.purchasePrice)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                  <span className="font-medium" style={{ color: brandColors.primary.darkGreen }}>Purchase Date</span>
                  <span className="font-bold" style={{ color: brandColors.primary.blue }}>
                    {new Date(property.purchaseHistory.purchaseDate).toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                  <span className="font-medium" style={{ color: brandColors.primary.darkGreen }}>Since Purchase</span>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatCurrency(property.purchaseHistory.totalGain)} ({property.purchaseHistory.growthPercentage.toFixed(2)}%)
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                  <span className="font-medium" style={{ color: brandColors.primary.darkGreen }}>Annual Appreciation</span>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {property.purchaseHistory.annualAppreciation.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mortgage Section */}
          {property.mortgage && (
            <div className="border-t pt-6" style={{ borderColor: brandColors.neutral.softGrey }}>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: brandColors.primary.darkBlue }}>
                <PoundSterling className="h-5 w-5" />
                Mortgage
              </h4>
              
              <div className="p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md" 
                   style={{ backgroundColor: brandColors.neutral.beige }}
                   onClick={() => setShowPurchaseHistory(!showPurchaseHistory)}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold" style={{ color: brandColors.primary.blue }}>
                      {formatCurrency(property.mortgage.currentBalance)}
                    </div>
                    <div className="text-sm mt-1" style={{ color: brandColors.primary.darkGreen }}>
                      {property.mortgage.propertyReference}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5" style={{ color: brandColors.primary.blue }} />
                </div>
              </div>
              
              {showPurchaseHistory && (
                <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                  <p className="text-sm" style={{ color: brandColors.primary.darkBlue }}>
                    <strong>Mortgage Details:</strong>
                  </p>
                  <p className="text-sm mt-1" style={{ color: brandColors.primary.darkGreen }}>
                    Current balance: {formatCurrency(property.mortgage.currentBalance)}
                  </p>
                  <p className="text-sm mt-1" style={{ color: brandColors.primary.darkGreen }}>
                    Property: {property.mortgage.propertyReference}
                  </p>
                  <p className="text-sm mt-1" style={{ color: brandColors.primary.darkGreen }}>
                    Equity: {formatCurrency(property.estimatedValue - property.mortgage.currentBalance)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Interactive Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 hover:shadow-md"
              style={{ 
                borderColor: showBreakdown ? brandColors.primary.blue : brandColors.neutral.taupe,
                color: showBreakdown ? brandColors.primary.blue : brandColors.primary.darkGreen,
                backgroundColor: showBreakdown ? `${brandColors.primary.blue}10` : 'transparent'
              }}
            >
              <Calculator className="h-4 w-4" />
              <span className="font-medium">Valuation Breakdown</span>
              {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setShowMarketInsights(!showMarketInsights)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 hover:shadow-md"
              style={{ 
                borderColor: showMarketInsights ? brandColors.primary.blue : brandColors.neutral.taupe,
                color: showMarketInsights ? brandColors.primary.blue : brandColors.primary.darkGreen,
                backgroundColor: showMarketInsights ? `${brandColors.primary.blue}10` : 'transparent'
              }}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium">Market Insights</span>
              {showMarketInsights ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Valuation Breakdown Section */}
          {showBreakdown && property.valuationBreakdown && (
            <div className="border-t pt-6" style={{ borderColor: brandColors.neutral.softGrey }}>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: brandColors.primary.darkBlue }}>
                <Target className="h-5 w-5" />
                Valuation Breakdown
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                    <span className="font-medium" style={{ color: brandColors.primary.darkGreen }}>Comparable Sales</span>
                    <span className="font-bold" style={{ color: brandColors.primary.blue }}>
                      {formatCurrency(property.valuationBreakdown.comparableSalesValue)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                    <span className="font-medium" style={{ color: brandColors.primary.darkGreen }}>HPI Adjusted</span>
                    <span className="font-bold" style={{ color: brandColors.primary.blue }}>
                      {formatCurrency(property.valuationBreakdown.hpiAdjustedValue)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                    <span className="font-medium" style={{ color: brandColors.primary.darkGreen }}>Market Trends</span>
                    <span className="font-bold" style={{ color: brandColors.primary.blue }}>
                      {formatCurrency(property.valuationBreakdown.marketTrends)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                    <span className="font-medium" style={{ color: brandColors.primary.darkGreen }}>Location Premium</span>
                    <span className="font-bold" style={{ color: brandColors.primary.blue }}>
                      {formatCurrency(property.valuationBreakdown.locationPremium)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                    <span className="font-medium" style={{ color: brandColors.primary.darkGreen }}>Property Condition</span>
                    <span className="font-bold" style={{ color: brandColors.primary.blue }}>
                      {formatCurrency(property.valuationBreakdown.propertyCondition)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 rounded-lg font-bold text-lg" style={{ backgroundColor: brandColors.accent.gold, color: 'white' }}>
                    <span>Total Estimated Value</span>
                    <span>{formatCurrency(property.estimatedValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Market Insights Section */}
          {showMarketInsights && property.marketInsights && (
            <div className="border-t pt-6" style={{ borderColor: brandColors.neutral.softGrey }}>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: brandColors.primary.darkBlue }}>
                <BarChart3 className="h-5 w-5" />
                Market Insights
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                  <div className="text-2xl font-bold mb-1" style={{ color: brandColors.primary.blue }}>
                    {formatCurrency(property.marketInsights.averagePricePerSqm)}
                  </div>
                  <div className="text-sm" style={{ color: brandColors.primary.darkGreen }}>Avg Price/m²</div>
                </div>
                
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getGrowthIcon(property.marketInsights.priceGrowth)}
                    <span className="text-2xl font-bold" style={{ color: brandColors.primary.blue }}>
                      {formatPercentage(property.marketInsights.priceGrowth)}
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: brandColors.primary.darkGreen }}>Price Growth</div>
                </div>
                
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                  <div className="text-2xl font-bold mb-1" style={{ color: brandColors.primary.blue }}>
                    {property.marketInsights.daysOnMarket}
                  </div>
                  <div className="text-sm" style={{ color: brandColors.primary.darkGreen }}>Days on Market</div>
                </div>
                
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                  <div className="text-lg font-bold mb-1" style={{ color: brandColors.primary.blue }}>
                    {supplyDemandLabels[property.marketInsights.supplyDemand]}
                  </div>
                  <div className="text-sm" style={{ color: brandColors.primary.darkGreen }}>Supply & Demand</div>
                </div>
              </div>
            </div>
          )}

          {/* Historical Trend Graph */}
          {property.historicalData && property.historicalData.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Historical Price Trend
              </h4>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="h-48">
                  <Line
                    data={{
                      labels: property.historicalData.map(point => {
                        const date = new Date(point.date);
                        return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
                      }),
                      datasets: [
                        {
                          label: 'Property Value',
                          data: property.historicalData.map(point => point.value),
                          borderColor: brandColors.primary.blue,
                          backgroundColor: `${brandColors.primary.blue}20`,
                          borderWidth: 2,
                          fill: true,
                          tension: 0.4,
                          pointBackgroundColor: brandColors.primary.blue,
                          pointBorderColor: 'white',
                          pointBorderWidth: 2,
                          pointRadius: 3,
                          pointHoverRadius: 5,
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: 'white',
                          bodyColor: 'white',
                          borderColor: brandColors.primary.blue,
                          borderWidth: 1,
                          callbacks: {
                            label: function(context) {
                              return `Value: ${formatCurrency(context.parsed.y)}`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          grid: {
                            color: '#f3f4f6',
                            
                          },
                          ticks: {
                            color: '#6b7280',
                            font: {
                              size: 10
                            },
                            maxTicksLimit: 6
                          }
                        },
                        y: {
                          grid: {
                            color: '#f3f4f6',
                            
                          },
                          ticks: {
                            color: '#6b7280',
                            font: {
                              size: 10
                            },
                            callback: function(value) {
                              return formatShortCurrency(Number(value));
                            }
                          },
                          beginAtZero: false
                        }
                      },
                      interaction: {
                        intersect: false,
                        mode: 'index'
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Comparable Sales Section */}
          {property.comparableSales && property.comparableSales.length > 0 && (
            <div className="border-t pt-6" style={{ borderColor: brandColors.neutral.softGrey }}>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: brandColors.primary.darkBlue }}>
                <MapPin className="h-5 w-5" />
                Comparable Sales Used ({Math.min(property.comparableSales.length, 6)})
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {property.comparableSales.slice(0, 6).map((sale, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg p-4 shadow-sm transition-all duration-200 cursor-pointer ${
                      selectedComparable === index ? 'ring-2 ring-offset-2' : 'hover:shadow-md'
                    }`}
                    style={{ 
                      backgroundColor: selectedComparable === index ? brandColors.neutral.beige : 'white',
                      borderColor: selectedComparable === index ? brandColors.primary.blue : brandColors.neutral.taupe,
                      borderWidth: '1px',
                      
                    }}
                    onClick={() => setSelectedComparable(selectedComparable === index ? null : index)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-lg font-bold" style={{ color: brandColors.primary.darkBlue }}>{sale.number}</span>
                      <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: brandColors.accent.silver, color: brandColors.primary.darkGreen }}>
                        {sale.propertyType}
                      </span>
                    </div>
                    
                    <div className="text-sm mb-3 line-clamp-2" style={{ color: brandColors.primary.darkGreen }}>
                      {sale.address}
                    </div>
                    
                    <div className="text-sm mb-2" style={{ color: brandColors.primary.blue }}>
                      {sale.postcode}
                    </div>
                    
                    <div className="text-xl font-bold mb-1" style={{ color: brandColors.primary.darkBlue }}>
                      {formatCurrency(sale.price)}
                    </div>
                    
                    <div className="text-sm" style={{ color: brandColors.primary.darkGreen }}>
                      {new Date(sale.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    
                    {/* Price comparison with estimated value */}
                    {selectedComparable === index && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: brandColors.neutral.softGrey }}>
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: brandColors.primary.darkGreen }}>Difference:</span>
                          <span 
                            className={`font-bold ${sale.price > property.estimatedValue ? 'text-red-600' : 'text-green-600'}`}
                          >
                            {sale.price > property.estimatedValue ? '+' : ''}{formatCurrency(sale.price - property.estimatedValue)}
                          </span>
                        </div>
                        <div className="text-xs mt-1" style={{ color: brandColors.primary.blue }}>
                          {((sale.price - property.estimatedValue) / property.estimatedValue * 100).toFixed(1)}% {sale.price > property.estimatedValue ? 'higher' : 'lower'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {selectedComparable !== null && (
                <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: brandColors.neutral.beige }}>
                  <p className="text-sm" style={{ color: brandColors.primary.darkBlue }}>
                    <strong>Selected:</strong> {property.comparableSales[selectedComparable].number} {property.comparableSales[selectedComparable].address}
                  </p>
                  <p className="text-sm mt-1" style={{ color: brandColors.primary.darkGreen }}>
                    This property sold for {formatCurrency(property.comparableSales[selectedComparable].price)} on{' '}
                    {new Date(property.comparableSales[selectedComparable].date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
      </div>
    </div>
  );
} 