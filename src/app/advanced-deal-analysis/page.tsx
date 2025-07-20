'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/SimpleCard';
import { Input } from '../components/SimpleInput';
import Button from '../components/Button';
import { Search, Target, Loader2, Calculator, DollarSign, MapPin, TrendingUp, BarChart3, Award, Home, Building, Percent, Shield, ArrowUpRight, ArrowDownRight, Minus, PoundSterling, Ruler, Bed, Zap, Calendar, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import ComprehensiveDealAnalysisCard from '../components/ComprehensiveDealAnalysisCard';
import { formatPostcode } from '@/utils/formatPostcode';
import { usePostcodeHistory } from '@/utils/usePostcodeHistory';
import AddressSearchInput from '../components/AddressSearchInput';
import { motion } from 'framer-motion';

interface ValuationMethod {
  name: string;
  value: number;
  confidence: number;
  breakdown: {
    [key: string]: number;
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
  icon: React.ComponentType<any>;
  color: string;
}

interface ComprehensiveValuationData {
  property: {
    address: string;
    postcode: string;
    propertyType: string;
    bedrooms?: number;
    floorArea?: number;
    epcRating?: string;
    constructionYear?: string;
    lastSoldPrice?: number;
    lastSoldDate?: string;
  };
  methods: {
    salesComparison: ValuationMethod;
    incomeApproach: ValuationMethod;
    costApproach: ValuationMethod;
  };
  summary: {
    finalValue: number;
    confidence: number;
    valueRange: { min: number; max: number };
    recommendedMethod: string;
    overallFactors: {
      positive: string[];
      negative: string[];
      neutral: string[];
    };
  };
  confidence?: {
    overall: number;
    dataQuality: number;
    marketConditions: number;
    comparableQuality: number;
    methodology: number;
    factors: {
      positive: string[];
      negative: string[];
    };
  };
  rentalYield?: {
    grossYield: number;
    netYield: number;
    monthlyRent: number;
    annualRent: number;
    managementFees: number;
    maintenanceReserve: number;
    voidPeriods: number;
    confidence: number;
    marketComparison: {
      averageYield: number;
      marketPosition: string;
    };
    factors: {
      positive: string[];
      negative: string[];
    };
  };
}

export default function AdvancedDealAnalysisPage() {
  const [postcode, setPostcode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [valuationData, setValuationData] = useState<ComprehensiveValuationData | null>(null);
  const [showValuationDetails, setShowValuationDetails] = useState(false);
  const { showToast } = useToast();
  const { history, saveToHistory } = usePostcodeHistory();

  const handleSearch = async () => {
    const formattedPostcode = formatPostcode(postcode.trim());
    if (!formattedPostcode || !houseNumber.trim()) {
      showToast({
        type: 'error',
        title: 'Missing Information',
        message: 'Please enter both postcode and house number.',
      });
      return;
    }

    setIsAnalyzing(true);
    setHasSearched(true);
    saveToHistory(formattedPostcode);

    try {
      // Get comprehensive valuation data
      const valuationResponse = await fetch(`/api/comprehensive-valuation?postcode=${encodeURIComponent(formattedPostcode)}&number=${encodeURIComponent(houseNumber.trim())}`);
      if (valuationResponse.ok) {
        const valuationResult = await valuationResponse.json();
        setValuationData(valuationResult);
      }
    } catch (error) {
      console.error('Error fetching valuation data:', error);
    } finally {
      setIsAnalyzing(false);
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    return 'Low';
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-primary-700">Comprehensive Property Analysis</h1>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          Get complete property insights including comprehensive valuation methods, rental yields, location analysis, 
          market trends, and investment metrics. Perfect for serious property investors and developers.
        </p>
      </div>

      {/* Search Form */}
      <Card className="border-2 border-primary-100 bg-gradient-to-r from-primary-50 to-blue-50 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary-700">
            <Target className="h-6 w-6" />
            Property Analysis Search
          </CardTitle>
          <p className="text-sm text-gray-600">
            Enter a house number and postcode to get comprehensive analysis including all valuation methods, 
            rental data, location insights, and market metrics.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Search for a Property</label>
              <AddressSearchInput
                value={postcode}
                onChange={setPostcode}
                onAddressSelect={(address) => {
                  setPostcode(address.postcode);
                  setHouseNumber(address.number);
                  // Auto-trigger search when address is selected
                  setTimeout(() => handleSearch(), 100);
                }}
                onSearch={(query) => {
                  setPostcode(query);
                  // Auto-trigger search if both fields are filled
                  if (houseNumber.trim()) {
                    handleSearch();
                  }
                }}
                placeholder="Start typing a postcode or address..."
                showHistory={true}
                showSuggestions={true}
                debounceMs={300}
                minSearchLength={2}
                className=""
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">House Number/Name</label>
                <Input
                  placeholder="e.g., 10 or The Cottage"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  disabled={isAnalyzing || !postcode.trim() || !houseNumber.trim()}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Analyze Property
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-8">
          {/* Deal Analysis Card */}
          <ComprehensiveDealAnalysisCard 
            postcode={postcode}
            houseNumber={houseNumber}
            isAnalyzing={isAnalyzing}
          />

          {/* Comprehensive Valuation Results */}
          {valuationData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-2 border-primary-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary-700">
                    <Calculator className="h-6 w-6" />
                    Comprehensive Valuation Analysis
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Detailed breakdown of three professional valuation methods with confidence scores and market insights.
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Property Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-lg mb-3 text-gray-800">Property Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{valuationData.property.address}</span>
                      </div>
                      {valuationData.property.bedrooms && (
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{valuationData.property.bedrooms} bedrooms</span>
                        </div>
                      )}
                      {valuationData.property.floorArea && (
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{valuationData.property.floorArea}m²</span>
                        </div>
                      )}
                      {valuationData.property.epcRating && (
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">EPC: {valuationData.property.epcRating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Final Value Summary */}
                  <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6 mb-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-primary-700 mb-2">
                        Estimated Market Value
                      </h3>
                      <div className="text-4xl font-bold text-primary-800 mb-2">
                        {formatCurrency(valuationData.summary.finalValue)}
                      </div>
                      <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                        <span className={`flex items-center gap-1 ${getConfidenceColor(valuationData.summary.confidence)}`}>
                          <Shield className="h-4 w-4" />
                          {getConfidenceLabel(valuationData.summary.confidence)} Confidence
                        </span>
                        <span className="flex items-center gap-1">
                          <Percent className="h-4 w-4" />
                          {formatPercentage(valuationData.summary.confidence)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        Range: {formatCurrency(valuationData.summary.valueRange.min)} - {formatCurrency(valuationData.summary.valueRange.max)}
                      </div>
                    </div>
                  </div>

                  {/* Valuation Methods */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-800 mb-4">Valuation Methods</h3>
                    
                    {/* Sales Comparison */}
                    <Card className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Home className="h-5 w-5 text-blue-600" />
                            <h4 className="font-semibold text-gray-800">Sales Comparison</h4>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-800">
                              {formatCurrency(valuationData.methods.salesComparison.value)}
                            </div>
                            <div className={`text-sm ${getConfidenceColor(valuationData.methods.salesComparison.confidence)}`}>
                              {formatPercentage(valuationData.methods.salesComparison.confidence)} confidence
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {valuationData.methods.salesComparison.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {valuationData.methods.salesComparison.factors.positive.map((factor, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              <CheckCircle className="h-3 w-3" />
                              {factor}
                            </span>
                          ))}
                          {valuationData.methods.salesComparison.factors.negative.map((factor, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              <AlertTriangle className="h-3 w-3" />
                              {factor}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Income Approach */}
                    <Card className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold text-gray-800">Income Approach</h4>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-800">
                              {formatCurrency(valuationData.methods.incomeApproach.value)}
                            </div>
                            <div className={`text-sm ${getConfidenceColor(valuationData.methods.incomeApproach.confidence)}`}>
                              {formatPercentage(valuationData.methods.incomeApproach.confidence)} confidence
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {valuationData.methods.incomeApproach.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {valuationData.methods.incomeApproach.factors.positive.map((factor, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              <CheckCircle className="h-3 w-3" />
                              {factor}
                            </span>
                          ))}
                          {valuationData.methods.incomeApproach.factors.negative.map((factor, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              <AlertTriangle className="h-3 w-3" />
                              {factor}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cost Approach */}
                    <Card className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-purple-600" />
                            <h4 className="font-semibold text-gray-800">Cost Approach</h4>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-800">
                              {formatCurrency(valuationData.methods.costApproach.value)}
                            </div>
                            <div className={`text-sm ${getConfidenceColor(valuationData.methods.costApproach.confidence)}`}>
                              {formatPercentage(valuationData.methods.costApproach.confidence)} confidence
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {valuationData.methods.costApproach.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {valuationData.methods.costApproach.factors.positive.map((factor, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              <CheckCircle className="h-3 w-3" />
                              {factor}
                            </span>
                          ))}
                          {valuationData.methods.costApproach.factors.negative.map((factor, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              <AlertTriangle className="h-3 w-3" />
                              {factor}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Rental Yield Analysis */}
                  {valuationData.rentalYield && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4">Rental Yield Analysis</h3>
                      <Card className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {formatPercentage(valuationData.rentalYield.grossYield)}
                              </div>
                              <div className="text-sm text-gray-600">Gross Yield</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {formatPercentage(valuationData.rentalYield.netYield)}
                              </div>
                              <div className="text-sm text-gray-600">Net Yield</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-800">
                                {formatCurrency(valuationData.rentalYield.monthlyRent)}
                              </div>
                              <div className="text-sm text-gray-600">Monthly Rent</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-800">
                                {formatCurrency(valuationData.rentalYield.annualRent)}
                              </div>
                              <div className="text-sm text-gray-600">Annual Rent</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* Sample Properties for Quick Testing */}
      {!hasSearched && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-2 border-primary-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary-700">
                <Info className="h-6 w-6" />
                Try These Sample Properties
              </CardTitle>
              <p className="text-sm text-gray-600">
                Test the system with these example properties to see comprehensive analysis in action.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { number: '21', postcode: 'NE5 2PR', description: 'Fourstones, Newcastle' },
                  { number: '16', postcode: 'NE5 4PR', description: 'Lowbiggin, Newcastle' },
                  { number: '10', postcode: 'SW1A 1AA', description: 'Downing Street, London' },
                ].map((property, index) => (
                  <Card key={index} className="border border-gray-200 hover:border-primary-300 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Home className="h-4 w-4 text-primary-600" />
                        <span className="font-semibold text-gray-800">{property.number} {property.postcode}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{property.description}</p>
                      <Button
                        onClick={() => {
                          setHouseNumber(property.number);
                          setPostcode(property.postcode);
                          setTimeout(() => handleSearch(), 100);
                        }}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm"
                      >
                        Analyze This Property
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </main>
  );
} 