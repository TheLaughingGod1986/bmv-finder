'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, 
  TrendingUp, 
  Home, 
  Building, 
  DollarSign, 
  BarChart3, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  MapPin,
  Calendar,
  Ruler,
  Bed,
  Zap,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Percent,
  PoundSterling
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

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
}

export default function ComprehensiveValuationPage() {
  const [postcode, setPostcode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [valuationData, setValuationData] = useState<ComprehensiveValuationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValuation = async () => {
    if (!postcode || !houseNumber) {
      setError('Please enter both postcode and house number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch comprehensive valuation data
      const response = await fetch(`/api/comprehensive-valuation?postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(houseNumber)}`);
      const data = await response.json();

      if (data.success) {
        setValuationData(data.data);
        // Check if this is mock data (no real property found)
        if (data.data.property.address.includes('Example Street')) {
          setError('Property not found in database. Showing demonstration with sample data.');
        }
      } else {
        setError(data.error || 'Failed to generate valuation');
      }
    } catch (err) {
      setError('Error generating valuation');
      console.error('Valuation error:', err);
    } finally {
      setLoading(false);
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
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Comprehensive Property Valuation
          </h1>
          <p className="text-lg text-gray-600">
            Professional-grade valuation using three standard approaches: Sales Comparison, Income, and Cost
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>💡 Try these sample properties:</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <button 
                onClick={() => { setHouseNumber('10'); setPostcode('SW1A 1AA'); }}
                className="text-left p-2 bg-white rounded border hover:bg-blue-100 transition-colors"
              >
                <strong>10 Downing Street</strong><br/>
                SW1A 1AA, London
              </button>
              <button 
                onClick={() => { setHouseNumber('1'); setPostcode('M1 1AA'); }}
                className="text-left p-2 bg-white rounded border hover:bg-blue-100 transition-colors"
              >
                <strong>1 Piccadilly Gardens</strong><br/>
                M1 1AA, Manchester
              </button>
              <button 
                onClick={() => { setHouseNumber('1'); setPostcode('B1 1AA'); }}
                className="text-left p-2 bg-white rounded border hover:bg-blue-100 transition-colors"
              >
                <strong>1 Victoria Square</strong><br/>
                B1 1AA, Birmingham
              </button>
            </div>
          </div>
        </motion.div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                House Number/Name
              </label>
              <input
                type="text"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="e.g., 21 or Flat 3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postcode
              </label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                placeholder="e.g., NE1 1AA"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleValuation}
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Generate Valuation
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
              {error.includes('Property not found') && (
                <div className="mt-2 text-sm text-red-700">
                  <p>Try searching for a property that exists in our database, or use the demonstration data to see how the valuation methods work.</p>
                  <p className="mt-1">Example: Try searching for properties in major cities like London (SW1A 1AA), Manchester (M1 1AA), or Birmingham (B1 1AA).</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Valuation Results */}
        {valuationData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Property Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Home className="w-6 h-6 text-blue-500" />
                Property Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold">{valuationData.property.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Property Type</p>
                  <p className="font-semibold">{valuationData.property.propertyType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bedrooms</p>
                  <p className="font-semibold">{valuationData.property.bedrooms || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Floor Area</p>
                  <p className="font-semibold">{valuationData.property.floorArea ? `${valuationData.property.floorArea}m²` : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Three Valuation Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sales Comparison Method */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  <h3 className="text-xl font-bold text-gray-900">Sales Comparison</h3>
                </div>
                
                <div className="mb-4">
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(valuationData.methods.salesComparison.value)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-sm font-medium ${getConfidenceColor(valuationData.methods.salesComparison.confidence)}`}>
                      {getConfidenceLabel(valuationData.methods.salesComparison.confidence)} Confidence
                    </span>
                    <span className="text-sm text-gray-500">
                      ({Math.round(valuationData.methods.salesComparison.confidence * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Formula</p>
                  <p className="text-xs bg-gray-50 p-2 rounded font-mono">
                    {valuationData.methods.salesComparison.formula}
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Breakdown</p>
                  <div className="space-y-1">
                    {Object.entries(valuationData.methods.salesComparison.breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                        <span className="font-medium">{formatCurrency(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Key Factors</p>
                  <div className="space-y-1">
                    {valuationData.methods.salesComparison.factors.positive.map((factor, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        {factor}
                      </div>
                    ))}
                    {valuationData.methods.salesComparison.factors.negative.map((factor, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        {factor}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  {valuationData.methods.salesComparison.description}
                </p>

                {/* Technical Details for Advanced Users */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Technical Analysis</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Type of Valuation</p>
                      <p className="text-xs text-gray-800">{valuationData.methods.salesComparison.valuationType}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Why This Method</p>
                      <p className="text-xs text-gray-800">{valuationData.methods.salesComparison.whyThisMethod}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Why This Result</p>
                      <p className="text-xs text-gray-800">{valuationData.methods.salesComparison.whyThisResult}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Income Approach Method */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-6 h-6 text-purple-500" />
                  <h3 className="text-xl font-bold text-gray-900">Income Approach</h3>
                </div>
                
                <div className="mb-4">
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(valuationData.methods.incomeApproach.value)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-sm font-medium ${getConfidenceColor(valuationData.methods.incomeApproach.confidence)}`}>
                      {getConfidenceLabel(valuationData.methods.incomeApproach.confidence)} Confidence
                    </span>
                    <span className="text-sm text-gray-500">
                      ({Math.round(valuationData.methods.incomeApproach.confidence * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Formula</p>
                  <p className="text-xs bg-gray-50 p-2 rounded font-mono">
                    {valuationData.methods.incomeApproach.formula}
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Breakdown</p>
                  <div className="space-y-1">
                    {Object.entries(valuationData.methods.incomeApproach.breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                        <span className="font-medium">{key.includes('Rate') ? `${value}%` : formatCurrency(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Key Factors</p>
                  <div className="space-y-1">
                    {valuationData.methods.incomeApproach.factors.positive.map((factor, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        {factor}
                      </div>
                    ))}
                    {valuationData.methods.incomeApproach.factors.negative.map((factor, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        {factor}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  {valuationData.methods.incomeApproach.description}
                </p>

                {/* Technical Details for Advanced Users */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Technical Analysis</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Type of Valuation</p>
                      <p className="text-xs text-gray-800">{valuationData.methods.incomeApproach.valuationType}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Why This Method</p>
                      <p className="text-xs text-gray-800">{valuationData.methods.incomeApproach.whyThisMethod}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Why This Result</p>
                      <p className="text-xs text-gray-800">{valuationData.methods.incomeApproach.whyThisResult}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Approach Method */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="w-6 h-6 text-orange-500" />
                  <h3 className="text-xl font-bold text-gray-900">Cost Approach</h3>
                </div>
                
                <div className="mb-4">
                  <p className="text-3xl font-bold text-orange-600">
                    {formatCurrency(valuationData.methods.costApproach.value)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-sm font-medium ${getConfidenceColor(valuationData.methods.costApproach.confidence)}`}>
                      {getConfidenceLabel(valuationData.methods.costApproach.confidence)} Confidence
                    </span>
                    <span className="text-sm text-gray-500">
                      ({Math.round(valuationData.methods.costApproach.confidence * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Formula</p>
                  <p className="text-xs bg-gray-50 p-2 rounded font-mono">
                    {valuationData.methods.costApproach.formula}
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Breakdown</p>
                  <div className="space-y-1">
                    {Object.entries(valuationData.methods.costApproach.breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                        <span className="font-medium">{formatCurrency(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Key Factors</p>
                  <div className="space-y-1">
                    {valuationData.methods.costApproach.factors.positive.map((factor, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        {factor}
                      </div>
                    ))}
                    {valuationData.methods.costApproach.factors.negative.map((factor, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        {factor}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  {valuationData.methods.costApproach.description}
                </p>

                {/* Technical Details for Advanced Users */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Technical Analysis</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Type of Valuation</p>
                      <p className="text-xs text-gray-800">{valuationData.methods.costApproach.valuationType}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Why This Method</p>
                      <p className="text-xs text-gray-800">{valuationData.methods.costApproach.whyThisMethod}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Why This Result</p>
                      <p className="text-xs text-gray-800">{valuationData.methods.costApproach.whyThisResult}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-500" />
                Final Valuation Summary
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Recommended Value</p>
                    <p className="text-4xl font-bold text-blue-600">
                      {formatCurrency(valuationData.summary.finalValue)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-sm font-medium ${getConfidenceColor(valuationData.summary.confidence)}`}>
                        {getConfidenceLabel(valuationData.summary.confidence)} Confidence
                      </span>
                      <span className="text-sm text-gray-500">
                        ({Math.round(valuationData.summary.confidence * 100)}%)
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Value Range</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(valuationData.summary.valueRange.min)} - {formatCurrency(valuationData.summary.valueRange.max)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Recommended Method</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {valuationData.summary.recommendedMethod}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Overall Factors</p>
                  <div className="space-y-2">
                    {valuationData.summary.overallFactors.positive.map((factor, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        {factor}
                      </div>
                    ))}
                    {valuationData.summary.overallFactors.negative.map((factor, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        {factor}
                      </div>
                    ))}
                    {valuationData.summary.overallFactors.neutral.map((factor, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <Info className="w-4 h-4" />
                        {factor}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Professional Valuation Disclaimer</p>
                  <p>
                    This comprehensive valuation uses three standard professional approaches but should not replace 
                    a formal RICS surveyor valuation when accuracy is crucial. Market conditions, individual property 
                    features, and local factors may affect actual values. Always conduct thorough due diligence 
                    before making investment decisions.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 