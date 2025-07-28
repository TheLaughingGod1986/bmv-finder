'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/SimpleCard';
import { Input } from '../components/SimpleInput';
import Button from '../components/Button';
import { Search, Target, Loader2, Home, TrendingUp, BarChart3, Info, DollarSign, PoundSterling } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import EnhancedDealAnalysisCard from '../components/EnhancedDealAnalysisCard';
import { formatPostcode } from '@/utils/formatPostcode';
import { usePostcodeHistory } from '@/utils/usePostcodeHistory';
import AddressSearchInput from '../components/AddressSearchInput';
import { motion } from 'framer-motion';

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

interface DealAnalysisData {
  estimatedValue: number | null;
  confidence: 'low' | 'medium' | 'high';
  comparables: Comparable[];
  usedBedroomFilter: boolean;
  subject: SubjectProperty | null;
}

export default function AdvancedDealAnalysisPage() {
  const [postcode, setPostcode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [dealAnalysis, setDealAnalysis] = useState<DealAnalysisData | null>(null);
  const { showToast } = useToast();
  const { history, saveToHistory } = usePostcodeHistory();

  const performSearch = async (postcodeValue: string, houseNumberValue: string) => {
    const formattedPostcode = formatPostcode(postcodeValue.trim());
    
    if (!formattedPostcode || !houseNumberValue.trim()) {
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
      const response = await fetch(`/api/property-analysis?postcode=${encodeURIComponent(formattedPostcode)}&number=${encodeURIComponent(houseNumberValue.trim())}`);
      const data = await response.json();
      
      if (data.success) {
        setDealAnalysis(data);
        // Smooth scroll to content section after successful search
        setTimeout(() => {
          const contentElement = document.getElementById('content-section');
          if (contentElement) {
            // Scroll to the content section with a small offset
            const elementTop = contentElement.offsetTop;
            const offset = 50; // Small offset to scroll a bit more
            window.scrollTo({
              top: elementTop - offset,
              behavior: 'smooth'
            });
          }
        }, 100);
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

  const handleSearch = async () => {
    await performSearch(postcode, houseNumber);
  };


  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section with Search */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-10"></div>
        <div className="relative max-w-screen-2xl w-[90vw] mx-auto pt-12 pb-12">
          <div className="text-center">
            {/* Portfolio Notification Banner */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 max-w-4xl mx-auto"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Home className="w-5 h-5 text-blue-600 mt-0.5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    🎉 New Portfolio Tracking Feature
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Add properties to your portfolio to track their value, growth, and performance over time. 
                    Get monthly updates, portfolio analytics, and personalized investment insights.
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-blue-700">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Monthly value updates
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      Portfolio analytics
                    </span>
                    <span className="flex items-center gap-1">
                      <PoundSterling className="w-3 h-3" />
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

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight"
            >
              Comprehensive
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Property Analysis
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-600 mb-6 max-w-3xl mx-auto"
            >
              Get complete property insights including comprehensive valuation methods, rental yields, location analysis, 
              market trends, and investment metrics. Perfect for serious property investors and developers.
            </motion.p>

            {/* Search Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-2xl mx-auto mb-6"
            >
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Search for a Property</label>
                    <AddressSearchInput
                      value={postcode}
                      onChange={setPostcode}
                      onAddressSelect={(address) => {
                        setPostcode(address.postcode);
                        setHouseNumber(address.number);
                        // Auto-trigger search when address is selected with the new values
                        setTimeout(() => {
                          // Use the address values directly instead of relying on state
                          const formattedPostcode = formatPostcode(address.postcode.trim());
                          if (formattedPostcode && address.number.trim()) {
                            performSearch(formattedPostcode, address.number.trim());
                          }
                        }, 100);
                      }}
                      onSearch={(query) => {
                        setPostcode(query);
                        // Auto-trigger search if both fields are filled
                        if (houseNumber.trim() && query.trim()) {
                          setTimeout(() => {
                            performSearch(query, houseNumber);
                          }, 300);
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
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">House Number/Name</label>
                    <Input
                      placeholder="e.g., 10 or The Cottage"
                      value={houseNumber}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setHouseNumber(newValue);
                        
                        // Auto-trigger search when house number is entered and postcode exists
                        if (newValue.trim() && postcode.trim()) {
                          // Small delay to allow the state to update
                          setTimeout(() => {
                            performSearch(postcode, newValue);
                          }, 300);
                        }
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div id="content-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results */}
        {hasSearched && (
          <div id="analysis-results" className="space-y-8">
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
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                  <Info className="h-6 w-6 text-blue-600" />
                  Try These Sample Properties
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Test the system with these example properties to see comprehensive analysis in action.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { number: '21', postcode: 'NE5 2PR', description: 'Fourstones, Newcastle' },
                    { number: '16', postcode: 'NE5 4PR', description: 'Lowbiggin, Newcastle' },
                    { number: '10', postcode: 'SW1A 1AA', description: 'Downing Street, London' },
                  ].map((property, index) => (
                    <Card key={index} className="border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer bg-gray-50 hover:bg-white">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <Home className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold text-gray-900">{property.number} {property.postcode}</span>
                        </div>
                        <p className="text-gray-600 mb-4">{property.description}</p>
                        <Button
                          onClick={() => {
                            setHouseNumber(property.number);
                            setPostcode(property.postcode);
                            performSearch(property.postcode, property.number);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
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
      </div>
    </main>
  );
} 