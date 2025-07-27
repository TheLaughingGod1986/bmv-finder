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
              <div className="text-sm text-gray-600 mt-1">
                Property Number: {subject.propertyNumber}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge className={confidenceColors[confidence]}>
                {confidenceIcons[confidence]}
                <span className="ml-1">{confidenceLabels[confidence]} Confidence</span>
              </Badge>
              <div className="text-xs text-gray-600">
                {confidenceDescriptions[confidence]}
              </div>
              {usedBedroomFilter && <span className="text-xs text-gray-500">(Matched by bedrooms)</span>}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Current Value & Growth */}
          <div className="lg:col-span-1">
            {/* Current Estimated Value Section */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-green-900">Current Estimated Value</h3>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">Live Estimate</span>
                </div>
              </div>
              
              <div className="text-3xl font-bold text-green-800 mb-4">
                £{estimatedValue ? estimatedValue.toLocaleString() : 'N/A'}
              </div>
              
              {/* Growth Indicators */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-white rounded-lg border border-green-100">
                  <div className="text-xs text-gray-600 mb-1">Change from Last Sale</div>
                  <div className={`text-sm font-semibold ${
                    estimatedValue && estimatedValue > (comparables[0]?.price || 0) ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {estimatedValue && estimatedValue > (comparables[0]?.price || 0) ? '+' : ''}£{estimatedValue ? (estimatedValue - (comparables[0]?.price || 0)).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-green-100">
                  <div className="text-xs text-gray-600 mb-1">Change %</div>
                  <div className={`text-sm font-semibold ${
                    estimatedValue && estimatedValue > (comparables[0]?.price || 0) ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {estimatedValue && estimatedValue > (comparables[0]?.price || 0) ? '+' : ''}{estimatedValue ? ((estimatedValue - (comparables[0]?.price || 0)) / (comparables[0]?.price || 1) * 100).toFixed(1) : 'N/A'}%
                  </div>
                </div>
              </div>
            </div>

            {/* Market Trend Indicator */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Market Trend</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-blue-700">Rising</span>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              <div className="text-xs text-blue-800">
                Property values in this area have increased by an average of 
                <span className="font-semibold"> {estimatedValue ? ((estimatedValue - (comparables[comparables.length - 1]?.price || 0)) / (comparables[comparables.length - 1]?.price || 1) * 100).toFixed(1) : 'N/A'}% </span>
                since the oldest comparable sale
              </div>
            </div>

            {/* Add to Portfolio Button */}
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
              <div className="text-center">
                <h4 className="text-sm font-semibold text-purple-900 mb-2">Track This Property</h4>
                <p className="text-xs text-purple-700 mb-4">
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
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
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
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">Data Quality</span>
                <span className={`font-semibold ${
                  confidence === 'high' ? 'text-green-600' : 
                  confidence === 'medium' ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {confidence === 'high' ? 'Excellent' : confidence === 'medium' ? 'Good' : 'Limited'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    confidence === 'high' ? 'bg-green-500 w-full' : 
                    confidence === 'medium' ? 'bg-yellow-500 w-2/3' : 
                    'bg-red-500 w-1/3'
                  }`}
                ></div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700">{comparables.length} comparables used</div>
                <div className="text-xs text-gray-500">for this valuation</div>
              </div>
            </div>

            {/* Value Confidence Explanation */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-3">Why this value is accurate</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <span><strong>{comparables.length}</strong> recent comparable sales</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <span>Official Land Registry data</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <span>Property type & location factors</span>
                    </div>
                    {comparables.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-blue-800">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span>Most recent: <strong>{formatDate(comparables[0]?.date || '')}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Comparable Sales */}
            <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-sm font-medium text-gray-900 mb-3">Recent Comparable Sales</div>
              <div className="space-y-2">
                {comparables.slice(0, 3).map((sale, index) => {
                  const prevSale = comparables[index + 1];
                  const priceChange = sale.price - (prevSale?.price || 0);
                  const percentageChange = prevSale ? ((priceChange / prevSale.price) * 100).toFixed(1) : null;
                  const isIncrease = priceChange > 0;
                  const isDecrease = priceChange < 0;

                  return (
                    <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">{formatDate(sale.date)}</span>
                      <span className="font-medium text-gray-900">£{sale.price.toLocaleString()}</span>
                      {percentageChange !== null && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          isIncrease ? 'bg-green-100 text-green-700' :
                          isDecrease ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
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
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="text-sm text-gray-700">
                <div className="font-medium mb-3 text-gray-900">Valuation Context</div>
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
                  <div className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200">
                    This estimate reflects current market conditions and comparable sales analysis
                  </div>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl">
              <h4 className="font-medium text-gray-900 mb-3">Property Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Postcode:</span>
                  <span className="font-medium">{subject?.postcode || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{subject?.propertyType || 'N/A'}</span>
                </div>
                {subject?.bedrooms && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bedrooms:</span>
                    <span className="font-medium">{subject.bedrooms}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="text-xs text-yellow-800">
                <div className="font-medium mb-1">Important Notice</div>
                This is an estimated value based on comparable sales analysis. For professional valuation, consult a qualified surveyor.
              </div>
            </div>
          </div>
        </div>

        {/* Warning if low confidence or few comparables */}
        {(confidence === 'low' || comparables.length < 3) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              {confidence === 'low'
                ? 'Low confidence: Not enough similar sales found. Please interpret this estimate with caution.'
                : 'Fewer than 3 comparables found. Estimate may be less reliable.'}
            </span>
          </div>
        )}

        {/* Comparable Sales List */}
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            Comparable Sales Used ({comparables.length})
          </h3>
          {comparables.length === 0 ? (
            <div className="text-gray-500 text-sm">No comparable sales found in this area.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparables.map((comp, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-white hover:bg-gray-50 transition">
                  <div className="mb-3">
                    <div className="font-medium text-gray-900 text-sm">{comp.address}</div>
                    <div className="text-xs text-gray-600">{comp.postcode} • {comp.propertyType} {comp.bedrooms ? `• ${comp.bedrooms} bed` : ''}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-lg text-primary-700">{formatCurrency(comp.price)}</div>
                    <div className="text-xs text-gray-500">{formatDate(comp.date)}</div>
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
                  <div className="text-xs text-gray-600">Find properties with similar characteristics that sold recently</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Market Adjustment</div>
                  <div className="text-xs text-gray-600">Adjust for market changes since comparable sales occurred</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Property-Specific Factors</div>
                  <div className="text-xs text-gray-600">Consider unique features, condition, and location advantages</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Data Quality</div>
                  <div className="text-xs text-gray-600">All data from official Land Registry records</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 