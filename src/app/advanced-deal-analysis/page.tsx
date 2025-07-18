'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/SimpleCard';
import { Input } from '../components/SimpleInput';
import Button from '../components/Button';
import { Search, Target, Loader2, Calculator, DollarSign, MapPin, TrendingUp, BarChart3, Award } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import ComprehensiveDealAnalysisCard from '../components/ComprehensiveDealAnalysisCard';
import { formatPostcode } from '@/utils/formatPostcode';
import { usePostcodeHistory } from '@/utils/usePostcodeHistory';

export default function AdvancedDealAnalysisPage() {
  const [postcode, setPostcode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
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
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-primary-700">Advanced Deal Analysis</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Get comprehensive property analysis including valuation methods, rental yields, location insights, 
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
            Enter a house number and postcode to get comprehensive deal analysis including all valuation methods, 
            rental data, location insights, and market metrics.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Postcode</label>
              <Input
                placeholder="e.g., SW1A 1AA"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                onBlur={(e) => {
                  const formatted = formatPostcode(e.target.value);
                  if (formatted !== e.target.value) {
                    setPostcode(formatted);
                  }
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              />
              {history.length > 0 && (
                <div className="mt-1 text-xs text-gray-500">
                  Recent: {history.slice(0, 3).map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setPostcode(h)}
                      className="mr-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSearch} 
                disabled={isAnalyzing}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-8 py-2"
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
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {hasSearched && (
        <ComprehensiveDealAnalysisCard 
          postcode={formatPostcode(postcode.trim())} 
          houseNumber={houseNumber} 
          loading={isAnalyzing}
          onAnalysisComplete={() => setIsAnalyzing(false)}
        />
      )}

      {/* Features Overview */}
      {!hasSearched && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          <Card className="border-2 border-blue-100 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Calculator className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Three Valuation Methods</h3>
                <p className="text-sm text-blue-700">
                  Sales Comparison, Income Approach, and Cost Approach with detailed breakdowns and confidence scores.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">Rental & Yield Analysis</h3>
                <p className="text-sm text-green-700">
                  Comprehensive rental data, yield calculations, and income approach valuations with market comparisons.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 bg-purple-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Location Intelligence</h3>
                <p className="text-sm text-purple-700">
                  Transport links, schools, amenities, planning data, and location premium calculations.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 bg-orange-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Market Analysis</h3>
                <p className="text-sm text-orange-700">
                  Market sentiment, demand/supply scores, price trends, and recent activity data.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-100 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Investment Metrics</h3>
                <p className="text-sm text-red-700">
                  Deal scores, ROI calculations, risk assessments, and investment recommendations.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-teal-100 bg-teal-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Award className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-teal-800 mb-2">Professional Grade</h3>
                <p className="text-sm text-teal-700">
                  Industry-standard valuation methods with transparent calculations and confidence scoring.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
} 