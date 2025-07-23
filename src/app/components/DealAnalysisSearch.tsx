'use client';

import { useState } from 'react';
import Button from './Button';
import { Card, CardContent, CardHeader, CardTitle, Badge } from './SimpleCard';
import { Input } from './SimpleInput';
import { Search, MapPin, Home, Calendar, Target, Loader2, Calculator, BarChart3, Brain } from 'lucide-react';
import { useToast } from './ToastProvider';
import EnhancedDealAnalysisCard from './EnhancedDealAnalysisCard';
import NextGenValuationCard from './NextGenValuationCard';
import MLValuationCard from './MLValuationCard';
import { formatPostcode } from '@/utils/formatPostcode';
import { usePostcodeHistory } from '@/utils/usePostcodeHistory';
import AddressSearchInput from './AddressSearchInput';

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
  estimatedValue: number | null;
  confidence: 'low' | 'medium' | 'high';
  comparables: unknown[];
  usedBedroomFilter: boolean;
  subject: unknown | null;
}

export default function DealAnalysisSearch() {
  const [postcode, setPostcode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [dealAnalysis, setDealAnalysis] = useState<DealAnalysisData | null>(null);
  const [nextGenValuation, setNextGenValuation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [valuationLoading, setValuationLoading] = useState(false);
  const [showNextGenValuation, setShowNextGenValuation] = useState(false);
  const [showMLValuation, setShowMLValuation] = useState(false);
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
      // Expecting: { estimatedValue, confidence, comparables, usedBedroomFilter, subject }
      setDealAnalysis(data);
      // Optionally show a toast for confidence
      if (data.confidence === 'low') {
        showToast({
          type: 'warning',
          title: 'Low Confidence',
          message: 'Not enough comparables found. Please interpret this estimate with caution.'
        });
      } else if (data.confidence === 'medium') {
        showToast({
          type: 'info',
          title: 'Medium Confidence',
          message: 'Estimate is based on a limited set of comparables.'
        });
      } else {
        showToast({
          type: 'success',
          title: 'Analysis Complete',
          message: 'High confidence estimate based on recent sales.'
        });
      }
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

  const handleNextGenValuation = async () => {
    const formattedPostcode = formatPostcode(postcode.trim());
    if (!formattedPostcode || !houseNumber.trim()) return;

    setValuationLoading(true);
    try {
      const response = await fetch(`/api/next-gen-valuation?postcode=${encodeURIComponent(formattedPostcode)}&number=${encodeURIComponent(houseNumber)}`);
      
      if (!response.ok) {
        throw new Error('Valuation failed');
      }

      const data = await response.json();
      setNextGenValuation(data);
      setShowNextGenValuation(true);
      
      showToast({
        type: 'success',
        title: 'Next-Gen Valuation Complete',
        message: `Current value: £${data.valuation.currentValue.toLocaleString()} (${data.valuation.confidence}% confidence)`,
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Valuation Error',
        message: 'Failed to generate next-generation valuation. Please try again.',
      });
    } finally {
      setValuationLoading(false);
    }
  };

  const handleMLValuation = async () => {
    const formattedPostcode = formatPostcode(postcode.trim());
    if (!formattedPostcode || !houseNumber.trim()) return;

    setValuationLoading(true);
    try {
      const response = await fetch(`/api/ml-valuation?postcode=${encodeURIComponent(formattedPostcode)}&number=${encodeURIComponent(houseNumber)}`);
      
      if (!response.ok) {
        throw new Error('ML Valuation failed');
      }

      const data = await response.json();
      setNextGenValuation(data); // Store ML valuation in nextGenValuation state
      setShowMLValuation(true);
      
      showToast({
        type: 'success',
        title: 'ML Valuation Complete',
        message: `Current value: £${data.valuation.currentValue.toLocaleString()} (${data.valuation.confidence}% confidence)`,
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'ML Valuation Error',
        message: 'Failed to generate ML valuation. Please try again.',
      });
    } finally {
      setValuationLoading(false);
    }
  };



  const handleAddToPortfolio = (valuation: unknown) => {
    showToast({
      type: 'success',
      title: 'Added to Portfolio',
      message: 'Property has been added to your portfolio for tracking.',
    });
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
          </div>
        </CardContent>
      </Card>

      {/* Deal Analysis Results */}
      {dealAnalysis && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Deal Analysis Results</h2>
            <div className="flex gap-3">
              <Button 
                onClick={handleNextGenValuation} 
                disabled={valuationLoading}
                variant="outline"
                className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <Calculator className="h-4 w-4" />
                {valuationLoading ? 'Generating...' : 'Next-Gen Valuation'}
              </Button>
              <Button 
                onClick={() => setShowNextGenValuation(!showNextGenValuation)} 
                disabled={!nextGenValuation}
                variant="outline"
                className="flex items-center gap-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              >
                <BarChart3 className="h-4 w-4" />
                {showNextGenValuation ? 'Hide' : 'Show'} Next-Gen
              </Button>
              <Button 
                onClick={handleMLValuation} 
                disabled={valuationLoading}
                variant="outline"
                className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Brain className="h-4 w-4" />
                {valuationLoading ? 'Generating...' : 'ML Valuation'}
              </Button>
              <Button 
                onClick={() => setShowMLValuation(!showMLValuation)} 
                disabled={!nextGenValuation}
                variant="outline"
                className="flex items-center gap-2 bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
              >
                <BarChart3 className="h-4 w-4" />
                {showMLValuation ? 'Hide' : 'Show'} ML
              </Button>
            </div>
          </div>
          
          {showNextGenValuation && nextGenValuation ? (
            <NextGenValuationCard data={nextGenValuation} loading={valuationLoading} />
          ) : (
            dealAnalysis && (
              <EnhancedDealAnalysisCard
                estimatedValue={dealAnalysis.estimatedValue}
                confidence={dealAnalysis.confidence}
                comparables={dealAnalysis.comparables}
                usedBedroomFilter={dealAnalysis.usedBedroomFilter}
                subject={dealAnalysis.subject}
                loading={analysisLoading}
              />
            )
          )}

          {showMLValuation && (
            <MLValuationCard 
              postcode={formatPostcode(postcode.trim())} 
              houseNumber={houseNumber} 
              onAddToPortfolio={handleAddToPortfolio}
            />
          )}
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