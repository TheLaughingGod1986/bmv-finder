'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/SimpleCard';

import EnhancedSearchResults from '../../components/EnhancedSearchResults';
import PropertyInputSelector from '../../components/PropertyInputSelector';
import { motion } from 'framer-motion';
import { Home, TrendingUp, BarChart3, Target, PoundSterling, Calculator, MapPin, Eye, Zap, Sparkles } from 'lucide-react';

interface Property {
  address: string;
  postcode: string;
  propertyType?: string;
  bedrooms?: number;
  floorArea?: number;
  epcRating?: string;
  salesHistory?: Array<{ price: number; date: string; [key: string]: unknown }>;
  totalSales?: number;
  priceRange?: { min: number; max: number };
  currentValuation?: number; // Added for current market value
}

export default function AdvancedDealAnalysisPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [inputProperty, setInputProperty] = useState<Property | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [dealAnalysis, setDealAnalysis] = useState<{ success: boolean; [key: string]: unknown } | null>(null);
  const [propertyDiscoveryData, setPropertyDiscoveryData] = useState<{
    comparables: Array<{ address: string; price: number; date: string; propertyType: string; bedrooms: number; floorArea: number; epcRating: string }>;
    totalSales: number;
    priceRange: { min: number; max: number };
  } | null>(null);

  const handlePropertySelect = (property: Property) => {
    
    setSelectedProperty(property);
    setHasSearched(true);
    setDealAnalysis({ success: true });
    
    // Store the Property Discovery data for use in analysis
    if (property.salesHistory && property.salesHistory.length > 0) {
      const discoveryData = {
        comparables: property.salesHistory.map((sale: { price: number; date: string; [key: string]: unknown }) => ({
          address: property.address.split(',')[0] || property.address.split(' ')[0],
          price: sale.price,
          date: sale.date,
          propertyType: property.propertyType || 'Unknown',
          bedrooms: property.bedrooms || 0,
          floorArea: property.floorArea || 0,
          epcRating: property.epcRating || 'Unknown'
        })),
        totalSales: property.totalSales || 0,
        priceRange: property.priceRange || { min: 0, max: 0 },
        // Don't set marketAnalysis here - let the comprehensive valuation API provide it
        // This ensures we get the correct current value and calculations
      };
      
      setPropertyDiscoveryData(discoveryData);
    } else {
      
    }
    
    // Smooth scroll to content section
    setTimeout(() => {
      const contentElement = document.getElementById('content-section');
      if (contentElement) {
        const elementTop = contentElement.offsetTop;
        const offset = 50;
        window.scrollTo({
          top: elementTop - offset,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const handlePropertyInput = (property: Property) => {
    setInputProperty(property);
    setSelectedProperty(property);
    setHasSearched(true);
    setDealAnalysis({ success: true });
    
    // Smooth scroll to content section
    setTimeout(() => {
      const contentElement = document.getElementById('content-section');
      if (contentElement) {
        const elementTop = contentElement.offsetTop;
        const offset = 50;
        window.scrollTo({
          top: elementTop - offset,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  // Extract house number from address
  const getHouseNumber = (address: string) => {
    const parts = address.split(' ');
    return parts[0];
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
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
                    🎉 Enhanced Property Analysis with Consolidated APIs
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Now powered by our new consolidated APIs providing comprehensive property data including EPC analysis, 
                    BMV scoring, market trends, and predictions - all from unified endpoints.
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-blue-700">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Enhanced search results
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Market analysis
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      BMV scoring
                    </span>
                    <span className="flex items-center gap-1">
                      <Calculator className="w-3 h-3" />
                      Property predictions
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight"
            >
              Enhanced
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Property Analysis
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
            >
              Get complete property insights using our new consolidated APIs. Comprehensive data including EPC analysis, 
              BMV scoring, market trends, and AI-powered predictions - all in one unified interface.
            </motion.p>

            {/* Property Input Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-4xl mx-auto mb-6"
            >
              <PropertyInputSelector
                onPropertySelect={handlePropertySelect}
                onPropertyInput={handlePropertyInput}
                title="Select Property for Analysis"
                description="Choose how you'd like to input property details for comprehensive analysis"
                showManualInput={true}
                showPortfolio={true}
                showWatchlist={true}
                showPostcodeSearch={true}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      {hasSearched && (
        <section id="content-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Selected Property Info */}
            {(selectedProperty || inputProperty) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Selected Property
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium text-gray-900">{(selectedProperty || inputProperty)?.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Postcode</p>
                      <p className="font-medium text-gray-900">{(selectedProperty || inputProperty)?.postcode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Property Type</p>
                      <p className="font-medium text-gray-900">{(selectedProperty || inputProperty)?.propertyType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bedrooms</p>
                      <p className="font-medium text-gray-900">{(selectedProperty || inputProperty)?.bedrooms || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Floor Area</p>
                      <p className="font-medium text-gray-900">
                        {(selectedProperty || inputProperty)?.floorArea ? `${(selectedProperty || inputProperty)?.floorArea}m²` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">EPC Rating</p>
                      <p className="font-medium text-gray-900">{(selectedProperty || inputProperty)?.epcRating || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Search Results */}
            {dealAnalysis && (selectedProperty || inputProperty) && (
              <EnhancedSearchResults
                postcode={(selectedProperty || inputProperty)?.postcode || ''}
                houseNumber={getHouseNumber((selectedProperty || inputProperty)?.address || '')}
                propertyDiscoveryData={propertyDiscoveryData}
                onAnalysisComplete={() => {
              
                }}
              />
            )}
          </motion.div>
        </section>
      )}

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Comprehensive Analysis Features</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our new consolidated APIs provide comprehensive property insights in one unified interface
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
              <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Market Analysis</h3>
              <p className="text-gray-600 text-sm flex-grow">
                Comprehensive market trends, growth rates, and sales performance data
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
              <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">BMV Scoring</h3>
              <p className="text-gray-600 text-sm flex-grow">
                Advanced Below Market Value analysis with enhanced scoring algorithms
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center"
          >
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
              <Zap className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">EPC Analysis</h3>
              <p className="text-gray-600 text-sm flex-grow">
                Energy performance insights, efficiency ratings, and upgrade recommendations for the area
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center"
          >
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
              <Sparkles className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Predictions</h3>
              <p className="text-gray-600 text-sm flex-grow">
                Machine learning powered property value predictions and market insights
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

 