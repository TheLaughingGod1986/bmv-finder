'use client';

import React, { useState } from 'react';
import Button from './Button';
import { Card, CardContent, CardHeader, CardTitle, Badge } from './SimpleCard';
import { Input } from './SimpleInput';
import { Search, MapPin, Home, Calendar, Target, Loader2 } from 'lucide-react';
import { useToast } from './ToastProvider';
import EnhancedDealAnalysisCard from './EnhancedDealAnalysisCard';
import { formatPostcode } from '@/utils/formatPostcode';
import { usePostcodeHistory } from '@/utils/usePostcodeHistory';

interface SearchResult {
  address: string;
  postcode: string;
  price: number;
  date: string;
  property_type: string;
  new_build: boolean;
  estate_type: string;
  transaction_type: string;
}

interface DealAnalysisData {
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
}

export default function DealAnalysisSearch() {
  const [postcode, setPostcode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [dealAnalysis, setDealAnalysis] = useState<DealAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
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

    setLoading(true);
    setDealAnalysis(null);
    
    try {
      // First, get basic search results
      const searchResponse = await fetch(`/api/search?postcode=${encodeURIComponent(formattedPostcode)}&number=${encodeURIComponent(houseNumber)}`);
      
      if (!searchResponse.ok) {
        throw new Error('Search failed');
      }

      const searchData = await searchResponse.json();
      setResults(searchData.results || []);
      
      if (searchData.results.length === 0) {
        showToast({
          type: 'warning',
          title: 'No Results',
          message: 'No properties found for the given address.',
        });
      } else {
        // Automatically trigger deal analysis if we have results
        await handleDealAnalysis();
      }
      
      // Save formatted postcode to history
      saveToHistory(formattedPostcode);
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Search Error',
        message: 'Failed to search for properties. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDealAnalysis = async () => {
    const formattedPostcode = formatPostcode(postcode.trim());
    if (!formattedPostcode || !houseNumber.trim()) return;

    setAnalysisLoading(true);
    try {
      const response = await fetch(`/api/property-analysis?postcode=${encodeURIComponent(formattedPostcode)}&number=${encodeURIComponent(houseNumber)}`);
      
      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setDealAnalysis(data);
      
      // Show toast with deal rating
      const dealRating = data.deal_metrics.deal_rating;
      const dealScore = data.deal_metrics.deal_score;
      
      showToast({
        type: dealRating === 'Excellent' || dealRating === 'Good' ? 'success' : 'warning',
        title: 'Analysis Complete',
        message: `Deal rating: ${dealRating} (${dealScore}/100)`,
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Analysis Error',
        message: 'Failed to analyze property. Please try again.',
      });
    } finally {
      setAnalysisLoading(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Search Form */}
      <Card className="border-2 border-primary-100 bg-gradient-to-r from-primary-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary-700">
            <Target className="h-6 w-6" />
            Property Deal Analysis
          </CardTitle>
          <p className="text-sm text-gray-600">
            Enter a house number and postcode to get comprehensive deal analysis including HPI data, sold prices, and property details.
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
                onChange={(e) => {
                  const input = e.target.value;
                  // Format as user types if it looks like a postcode
                  if (/^[A-Za-z]{1,2}\s*\d/.test(input)) {
                    const formatted = formatPostcode(input);
                    setPostcode(formatted);
                  } else {
                    setPostcode(input.toUpperCase());
                  }
                }}
                onBlur={(e) => {
                  const formatted = formatPostcode(e.target.value);
                  if (formatted !== e.target.value) {
                    setPostcode(formatted);
                  }
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              />
              {/* History dropdown */}
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
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-8 py-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analyze Deal
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deal Analysis Results */}
      {dealAnalysis && (
        <div className="space-y-6">
          <EnhancedDealAnalysisCard data={dealAnalysis} loading={analysisLoading} />
        </div>
      )}

      {/* Basic Results (if no deal analysis) */}
      {results.length > 0 && !dealAnalysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Search Results</h2>
            <Button 
              onClick={handleDealAnalysis} 
              disabled={analysisLoading}
              variant="outline"
              className="flex items-center gap-2 bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100"
            >
              <Target className="h-4 w-4" />
              {analysisLoading ? 'Analyzing...' : 'Get Deal Analysis'}
            </Button>
          </div>
          {results.map((result, index) => (
            <Card key={index} className="border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <h3 className="font-semibold text-gray-900">{result.address}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        {result.property_type}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(result.date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(result.price)}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {result.new_build && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">New Build</Badge>
                      )}
                      <Badge variant="outline" className="border-gray-300 text-gray-700">
                        {result.transaction_type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600 mr-3" />
              <span className="text-lg text-gray-600">Searching for properties...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Loading State */}
      {analysisLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600 mr-3" />
              <span className="text-lg text-gray-600">Analyzing property data...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 