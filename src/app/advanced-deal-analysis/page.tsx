'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/SimpleCard';
import { Input } from '../components/SimpleInput';
import Button from '../components/Button';
import { Search, Target, Loader2, Home, TrendingUp, BarChart3, Info, DollarSign } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import EnhancedDealAnalysisCard from '../components/EnhancedDealAnalysisCard';
import { formatPostcode } from '@/utils/formatPostcode';
import { usePostcodeHistory } from '@/utils/usePostcodeHistory';
import AddressSearchInput from '../components/AddressSearchInput';
import { motion } from 'framer-motion';

interface DealAnalysisData {
  estimatedValue: number | null;
  confidence: 'low' | 'medium' | 'high';
  comparables: any[];
  usedBedroomFilter: boolean;
  subject: any | null;
}

export default function AdvancedDealAnalysisPage() {
  const [postcode, setPostcode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [dealAnalysis, setDealAnalysis] = useState<DealAnalysisData | null>(null);
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
      const response = await fetch(`/api/property-analysis?postcode=${encodeURIComponent(formattedPostcode)}&number=${encodeURIComponent(houseNumber.trim())}`);
      const data = await response.json();
      
      if (data.success) {
        setDealAnalysis(data);
      } else {
        showToast({
          type: 'error',
          title: 'Analysis Failed',
          message: data.error || 'Failed to analyze property.',
        });
      }
    } catch (error) {
      console.error('Error in search:', error);
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to the analysis service.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };



  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Portfolio Notification Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Home className="w-5 h-5 text-green-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-green-800 mb-1">
              🎉 New Portfolio Tracking Feature
            </h3>
            <p className="text-sm text-green-700 mb-3">
              Add properties to your portfolio to track their value, growth, and performance over time. 
              Get monthly updates, portfolio analytics, and personalized investment insights.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-green-600">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Monthly value updates
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Portfolio analytics
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Total asset tracking
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Investment insights
              </span>
            </div>
          </div>
        </div>
      </motion.div>

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
          <EnhancedDealAnalysisCard 
            estimatedValue={dealAnalysis?.estimatedValue || null}
            confidence={dealAnalysis?.confidence || 'low'}
            comparables={dealAnalysis?.comparables || []}
            usedBedroomFilter={dealAnalysis?.usedBedroomFilter || false}
            subject={dealAnalysis?.subject || null}
            loading={isAnalyzing}
          />
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