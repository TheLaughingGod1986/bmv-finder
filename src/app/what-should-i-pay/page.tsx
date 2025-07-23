"use client";

import { useState, useEffect } from 'react';
import ValuationBreakdown from '../components/ValuationBreakdown';
import ValuationExplanation from '../components/ValuationExplanation';
import MarketInsights from '../components/MarketInsights';
import ConfidenceScore from '../components/ConfidenceScore';
import CompSlider from '../components/CompSlider';
import { useUser, useSession } from '@supabase/auth-helpers-react';
import { useUserTier } from '@/hooks/useUserTier';
import UpgradePrompt from '../components/UpgradePrompt';
import { apiClient } from '@/lib/apiClient';
import { formatPostcode } from '@/utils/formatPostcode';
import { usePostcodeHistory } from '@/utils/usePostcodeHistory';
import SmartSearchInput from '../components/SmartSearchInput';
import PDFDownloadButton from '../components/PDFDownloadButton';

export default function WhatShouldIPayPage() {
  const [postcode, setPostcode] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  
  const user = useUser();
  const session = useSession();
  const { tier, loading: tierLoading } = useUserTier(user?.id || session?.user?.id);
  const { history, saveToHistory } = usePostcodeHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!postcode || !propertyType) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const formattedPostcode = postcode.toUpperCase().replace(/\s+/g, ' ');
      const response = await apiClient.getWhatShouldIPay({
        postcode: formattedPostcode,
        propertyType,
        offerMargin: 0.85, // Default 15% discount for investors
      });
      
      setResult(response.data);
      saveToHistory(formattedPostcode);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-3 px-4 lg:px-6 bg-neutral-50 min-h-screen">
      {/* Standardized Header */}
      <div className="text-center mb-4 max-w-2xl mx-auto pt-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3m6 0c0-1.657-1.343-3-3-3m0 0V4m0 4c1.657 0 3 1.343 3 3m-6 0c0 1.657 1.343 3 3 3m0 0v4m0-4c-1.657 0-3-1.343-3-3m6 0c0 1.657 1.343 3-3 3" /></svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-0" id="page-title">
            What Should I <span className="text-primary-600">Pay</span>?
          </h1>
        </div>
        <p className="text-sm text-gray-600 max-w-xl mx-auto mb-2" id="page-description">
          Get a <span className="text-primary-600 font-semibold">smart</span>, <span className="text-primary-600 font-semibold">data-driven</span> <span className="text-primary-600 font-semibold">offer suggestion</span> for your next property investment.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 bg-white rounded-xl shadow-lg p-3 lg:p-4 mb-4">
        {/* Simple Search Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
              Postcode *
            </label>
            <input
              type="text"
              id="postcode"
              name="postcode"
              value={postcode}
              onChange={e => setPostcode(e.target.value)}
              placeholder="e.g., NE5 4PR"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 transition-colors"
              required
            />
          </div>
          
          <div>
            <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
              Property Type *
            </label>
            <select
              id="propertyType"
              name="propertyType"
              value={propertyType}
              onChange={e => setPropertyType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 transition-colors"
              required
            >
              <option value="">Select property type</option>
              <option value="D">Detached</option>
              <option value="S">Semi-detached</option>
              <option value="T">Terraced</option>
              <option value="F">Flats/Maisonettes</option>
              <option value="O">Other</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl text-base"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Analyzing Property...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Get Professional Valuation</span>
            </div>
          )}
        </button>
      </form>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {result && (
        <div className="space-y-2">
          {/* Hero Section with Key Results and Primary CTA */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-2 lg:p-3 border border-blue-100">
            <div className="grid lg:grid-cols-3 gap-2 items-start">
              {/* Key Results */}
              <div className="lg:col-span-3 space-y-2">
                <div className="text-center lg:text-left">
                  <h2 className="text-base lg:text-lg font-bold text-gray-900 mb-1">
                    Your Property Valuation
                  </h2>
                  <p className="text-xs text-gray-600">
                    Based on {result.comps.length} comparable properties in {result.searchCriteria.postcode}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  <div className="bg-white rounded-lg p-2 text-center shadow-sm border">
                    <div className="text-xs text-gray-600 mb-1">Suggested Offer</div>
                    <div className="text-sm font-bold text-green-600">
                      £{result.suggestedOffer.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center shadow-sm border">
                    <div className="text-xs text-gray-600 mb-1">Market Value</div>
                    <div className="text-sm font-bold text-blue-600">
                      £{result.avgValue.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center shadow-sm border lg:block hidden">
                    <div className="text-xs text-gray-600 mb-1">Confidence</div>
                    <div className="text-sm font-bold text-purple-600">
                      {result.confidence.score}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile CTA - Prominent placement */}
          <div className="lg:hidden">
            <PDFDownloadButton
              userId={user?.id || session?.user?.id || ''}
              email={user?.email || session?.user?.email}
              propertyData={result}
              userTier={tier}
            />
          </div>

          {/* Detailed Analysis Sections */}
          <div className="grid lg:grid-cols-3 gap-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-3">
              <ValuationExplanation
                avgValue={result.avgValue}
                suggestedOffer={result.suggestedOffer}
                offerMargin={result.offerMargin}
                comps={result.comps}
                searchCriteria={result.searchCriteria}
                confidence={result.confidence}
                latestYoY={result.latestYoY}
              />
              
              <ValuationBreakdown
                avgValue={result.avgValue}
                suggestedOffer={result.suggestedOffer}
                offerMargin={result.offerMargin}
                comps={result.comps}
              />
              
              <ConfidenceScore
                score={result.confidence.score}
                rating={result.confidence.rating}
                reason={result.confidence.reason}
              />
              
              {result.latestYoY !== null && (
                <div className="bg-white rounded-lg border p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">Latest Market Growth</div>
                      <div className="text-xs text-gray-600">Year-over-year HPI change</div>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {result.latestYoY.toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}
              
              <MarketInsights
                marketInsights={result.marketInsights}
                priceRange={result.priceRange}
                latestYoY={result.latestYoY}
              />
            </div>
            
            {/* Sidebar - Desktop only */}
            <div className="hidden lg:block">
              <div className="sticky top-6 space-y-3">
                {/* Secondary CTA for additional conversion opportunity */}
                <PDFDownloadButton
                  userId={user?.id || session?.user?.id || ''}
                  email={user?.email || session?.user?.email}
                  propertyData={result}
                  userTier={tier}
                />
                
                {/* Quick Stats */}
                <div className="bg-white rounded-lg border p-3 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">Quick Stats</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-xs">Comparable Properties</span>
                      <span className="font-semibold text-sm">{result.comps.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-xs">Confidence Level</span>
                      <span className="font-semibold text-sm">{result.confidence.score}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-xs">Investor Discount</span>
                      <span className="font-semibold text-sm">{((1 - result.offerMargin) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 