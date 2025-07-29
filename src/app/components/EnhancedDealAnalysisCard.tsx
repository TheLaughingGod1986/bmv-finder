'use client';


import { Card, CardContent, CardHeader, CardTitle, Badge } from './SimpleCard';
import { Home, MapPin, Bed, Calendar, AlertTriangle, CheckCircle, Info, Target, TrendingUp, Plus } from 'lucide-react';
import AddToPortfolioButton from './AddToPortfolioButton';

interface Comparable {
      address: string;
  postcode: string;
      price: number;
      date: string;
  propertyType: string;
  bedrooms?: number;
}

interface SubjectProperty {
  address?: string;
  fullAddress?: string;
  postcode?: string;
  propertyNumber?: string;
  propertyType?: string;
  bedrooms?: number;
  lastSale?: {
    price: number;
    date: string;
    propertyType: string;
  } | null;
}

interface Props {
  estimatedValue: number | null;
  confidence: 'high' | 'medium' | 'low';
  comparables: Comparable[];
  usedBedroomFilter: boolean;
  subject: SubjectProperty | null;
  loading?: boolean;
}

const confidenceColors = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-red-100 text-red-800',
};

const confidenceLabels = {
  high: 'High',
  medium: 'Medium', 
  low: 'Low',
};

const confidenceDescriptions = {
  high: 'Multiple similar properties sold recently',
  medium: 'Some similar sales, but limited data',
  low: 'Limited comparable sales data',
};

const confidenceIcons = {
  high: <CheckCircle className="h-4 w-4" />,
  medium: <Info className="h-4 w-4" />,
  low: <AlertTriangle className="h-4 w-4" />,
};

function formatCurrency(amount: number | null) {
  if (amount === null) return 'N/A';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function EnhancedDealAnalysisCard({ estimatedValue, confidence, comparables, usedBedroomFilter, subject, loading = false }: Props) {

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Property Analysis
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-primary-700">
              <Home className="h-6 w-6" />
              {subject?.fullAddress || subject?.address || 'Property'}
            </CardTitle>
            {subject?.propertyNumber && (
              <div className="text-sm text-gray-700 mt-1 font-medium">
                Property Number: {subject.propertyNumber}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge className={confidenceColors[confidence]}>
                {confidenceIcons[confidence]}
                <span className="ml-1">{confidenceLabels[confidence]} Confidence</span>
              </Badge>
              <div className="text-xs text-gray-700 font-medium">
                {confidenceDescriptions[confidence]}
              </div>
              {usedBedroomFilter && <span className="text-xs text-gray-600 font-medium">(Matched by bedrooms)</span>}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Current Value & Growth */}
          <div className="lg:col-span-1">
            {/* Current Estimated Value Section - Enhanced for Prominence */}
            <div className="p-6 bg-gradient-to-br from-[#3A7CA5] via-[#2C6E91] to-[#1f2e66] border-2 border-[#D4AF37] rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white drop-shadow-sm">Current Estimated Value</h3>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                  <div className="w-2 h-2 bg-[#5DA271] rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-white drop-shadow-sm">Live Estimate</span>
                </div>
              </div>
              
              <div className="text-5xl font-black text-white mb-6 text-center tracking-tight drop-shadow-lg">
                £{estimatedValue ? estimatedValue.toLocaleString() : 'N/A'}
              </div>
              
              {/* Growth Indicators - Enhanced */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg">
                  <div className="text-xs text-white mb-2 font-medium drop-shadow-sm">Change from Last Sale</div>
                  <div className={`text-lg font-bold drop-shadow-sm ${
                    estimatedValue && subject?.lastSale && estimatedValue > subject.lastSale.price ? 'text-[#5DA271]' : 'text-red-200'
                  }`}>
                    {estimatedValue && subject?.lastSale ? 
                      `${estimatedValue > subject.lastSale.price ? '+' : ''}£${(estimatedValue - subject.lastSale.price).toLocaleString()}` : 
                      'N/A'
                    }
                  </div>
                </div>
                <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg">
                  <div className="text-xs text-white mb-2 font-medium drop-shadow-sm">Change %</div>
                  <div className={`text-lg font-bold drop-shadow-sm ${
                    estimatedValue && subject?.lastSale && estimatedValue > subject.lastSale.price ? 'text-[#5DA271]' : 'text-red-200'
                  }`}>
                    {estimatedValue && subject?.lastSale ? 
                      `${estimatedValue > subject.lastSale.price ? '+' : ''}${((estimatedValue - subject.lastSale.price) / subject.lastSale.price * 100).toFixed(1)}%` : 
                      'N/A'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Market Trend Indicator */}
            <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white drop-shadow-sm">Market Trend</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white drop-shadow-sm">Rising</span>
                  <div className="w-2 h-2 bg-[#5DA271] rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="text-xs text-white drop-shadow-sm">
                Property values in this area have increased by an average of 
                <span className="font-semibold"> {estimatedValue ? ((estimatedValue - (comparables[comparables.length - 1]?.price || 0)) / (comparables[comparables.length - 1]?.price || 1) * 100).toFixed(1) : 'N/A'}% </span>
                since the oldest comparable sale
              </div>
            </div>

            {/* Add to Portfolio Button */}
            <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg">
              <div className="text-center">
                <h4 className="text-sm font-semibold text-white mb-2 drop-shadow-sm">Track This Property</h4>
                <p className="text-xs text-white/90 mb-4 drop-shadow-sm">
                  Add to your portfolio to track value changes, growth, and performance over time
                </p>
                <AddToPortfolioButton
                  propertyData={{
                    address: subject?.fullAddress || subject?.address || `${subject?.propertyNumber} ${subject?.postcode}`,
                    postcode: subject?.postcode || '',
                    houseNumber: subject?.propertyNumber || '',
                    propertyType: subject?.propertyType || '',
                    bedrooms: subject?.bedrooms,
                    purchasePrice: comparables[0]?.price || estimatedValue || 0,
                    currentValue: estimatedValue || 0,
                    purchaseDate: comparables[0]?.date || new Date().toISOString().split('T')[0],
                    dealScore: confidence === 'high' ? 85 : confidence === 'medium' ? 65 : 45,
                    dealRating: confidence === 'high' ? 'Good' : confidence === 'medium' ? 'Fair' : 'Limited',
                    bmvScore: confidence === 'high' ? 80 : confidence === 'medium' ? 60 : 40,
                    notes: `Added from deal analysis. Confidence: ${confidence}, Comparables: ${comparables.length}`
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg font-medium transition-colors border border-white/30 backdrop-blur-sm"
                  size="md"
                  showIcon={true}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Portfolio
                </AddToPortfolioButton>
              </div>
            </div>
          </div>

          {/* Middle Column - Confidence & Data Quality */}
          <div className="lg:col-span-1">
            {/* Confidence Meter */}
            <div className="p-4 bg-[#F5F5DC] rounded-xl border border-[#E5E5E5] shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-[#2C6E91]">Data Quality</span>
                <span className={`font-semibold ${
                  confidence === 'high' ? 'text-[#5DA271]' : 
                  confidence === 'medium' ? 'text-[#D4AF37]' : 
                  'text-red-600'
                }`}>
                  {confidence === 'high' ? 'Excellent' : confidence === 'medium' ? 'Good' : 'Limited'}
                </span>
              </div>
              <div className="w-full bg-[#E5E5E5] rounded-full h-3 mb-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    confidence === 'high' ? 'bg-[#5DA271] w-full' : 
                    confidence === 'medium' ? 'bg-[#D4AF37] w-2/3' : 
                    'bg-red-500 w-1/3'
                  }`}
                ></div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-[#2C6E91]">{comparables.length} comparables used</div>
                <div className="text-xs text-[#3B755D]">for this valuation</div>
              </div>
            </div>

            {/* Value Confidence Explanation */}
            <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-3 drop-shadow-sm">Why this value is accurate</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white drop-shadow-sm">
                      <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                      <span><strong>{comparables.length}</strong> recent comparable sales</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white drop-shadow-sm">
                      <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                      <span>Official Land Registry data</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white drop-shadow-sm">
                      <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                      <span>Property type & location factors</span>
                    </div>
                    {comparables.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-white drop-shadow-sm">
                        <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                        <span>Most recent: <strong>{formatDate(comparables[0]?.date || '')}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Comparable Sales */}
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="text-sm font-medium text-white mb-3 drop-shadow-sm">Recent Comparable Sales</div>
              <div className="space-y-2">
                {comparables.slice(0, 3).map((sale, index) => {
                  const prevSale = comparables[index + 1];
                  const priceChange = sale.price - (prevSale?.price || 0);
                  const percentageChange = prevSale ? ((priceChange / prevSale.price) * 100).toFixed(1) : null;
                  const isIncrease = priceChange > 0;
                  const isDecrease = priceChange < 0;

                  return (
                    <div key={index} className="flex items-center justify-between text-xs p-2 bg-white/10 rounded-lg border border-white/20">
                      <span className="text-white/90 drop-shadow-sm">{formatDate(sale.date)}</span>
                      <span className="font-medium text-white drop-shadow-sm">£{sale.price.toLocaleString()}</span>
                      {percentageChange !== null && (
                        <span className={`text-xs px-2 py-1 rounded backdrop-blur-sm border ${
                          isIncrease ? 'bg-green-500/20 text-green-200 border-green-300/30' :
                          isDecrease ? 'bg-red-500/20 text-red-200 border-red-300/30' :
                          'bg-white/20 text-white border-white/30'
                        }`}>
                          {isIncrease ? '↗' : isDecrease ? '↘' : '→'} {Math.abs(parseFloat(percentageChange))}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Valuation Context & Details */}
          <div className="lg:col-span-1">
            {/* Valuation Context */}
            <div className="p-4 bg-[#F5F5DC] border border-[#E5E5E5] rounded-xl shadow-soft">
              <div className="text-sm text-[#2C6E91]">
                <div className="font-medium mb-3 text-[#2C6E91]">Valuation Context</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current estimate:</span>
                    <span className="font-semibold">£{estimatedValue ? estimatedValue.toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comparable sales:</span>
                    <span className="font-semibold">{comparables.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Most recent:</span>
                    <span className="font-semibold">£{(comparables[0]?.price || 0).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-[#3B755D] mt-3 pt-3 border-t border-[#E5E5E5]">
                    This estimate reflects current market conditions and comparable sales analysis
                  </div>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="mt-4 p-4 bg-white border border-[#E5E5E5] rounded-xl shadow-soft">
              <h4 className="font-medium text-[#2C6E91] mb-3">Property Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#3B755D]">Postcode:</span>
                  <span className="font-medium text-[#2C6E91]">{subject?.postcode || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3B755D]">Type:</span>
                  <span className="font-medium text-[#2C6E91]">{subject?.propertyType || 'N/A'}</span>
                </div>
                {subject?.bedrooms && (
                  <div className="flex justify-between">
                    <span className="text-[#3B755D]">Bedrooms:</span>
                    <span className="font-medium text-[#2C6E91]">{subject.bedrooms}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-4 p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl">
              <div className="text-xs text-[#2C6E91]">
                <div className="font-medium mb-1 text-[#2C6E91]">Important Notice</div>
                This is an estimated value based on comparable sales analysis. For professional valuation, consult a qualified surveyor.
              </div>
            </div>
          </div>
        </div>

        {/* Warning if low confidence or few comparables */}
        {(confidence === 'low' || comparables.length < 3) && (
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-4 mt-6 flex items-center gap-2 shadow-soft">
            <AlertTriangle className="h-5 w-5 text-[#D4AF37]" />
            <span className="text-sm text-[#2C6E91]">
              {confidence === 'low'
                ? 'Low confidence: Not enough similar sales found. Please interpret this estimate with caution.'
                : 'Fewer than 3 comparables found. Estimate may be less reliable.'}
            </span>
          </div>
        )}

        {/* Comparable Sales List */}
        <div className="mt-6">
          <h3 className="font-semibold text-[#2C6E91] mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#3A7CA5]" />
            Comparable Sales Used ({comparables.length})
          </h3>
          {comparables.length === 0 ? (
            <div className="text-[#3B755D] text-sm">No comparable sales found in this area.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparables.map((comp, idx) => (
                <div key={idx} className="border border-[#E5E5E5] rounded-xl p-4 bg-white hover:bg-[#F5F5DC] transition shadow-soft">
                  <div className="mb-3">
                    <div className="font-medium text-[#2C6E91] text-sm">{comp.address}</div>
                    <div className="text-xs text-[#3B755D]">{comp.postcode} • {comp.propertyType} {comp.bedrooms ? `• ${comp.bedrooms} bed` : ''}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-lg text-[#3A7CA5]">{formatCurrency(comp.price)}</div>
                    <div className="text-xs text-[#3B755D]">{formatDate(comp.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Methodology Explanation */}
        <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-gray-600" />
            How this valuation is calculated
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Comparable Sales Analysis</div>
                  <div className="text-xs text-gray-700 font-medium">Find properties with similar characteristics that sold recently</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Market Adjustment</div>
                  <div className="text-xs text-gray-700 font-medium">Adjust for market changes since comparable sales occurred</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Property-Specific Factors</div>
                  <div className="text-xs text-gray-700 font-medium">Consider unique features, condition, and location advantages</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Data Quality</div>
                  <div className="text-xs text-gray-700 font-medium">All data from official Land Registry records</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 