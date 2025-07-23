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
  const [offerMargin, setOfferMargin] = useState(0.85);
  const [bedrooms, setBedrooms] = useState<number | ''>('');
  const [plotSize, setPlotSize] = useState<number | ''>('');
  const [condition, setCondition] = useState('any');
  const [epcRating, setEpcRating] = useState('');
  const [searchMode, setSearchMode] = useState<'basic' | 'advanced'>('basic');
  const [searchRadius, setSearchRadius] = useState<number>(0); // 0 = exact postcode, 1 = 1km, 2 = 2km, etc.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const user = useUser();
  const session = useSession();
  const { tier, loading: tierLoading } = useUserTier(user?.id || session?.user?.id);
  
  const [payCount, setPayCount] = useState<number>(0);
  const [limitHit, setLimitHit] = useState(false);
  const { history, saveToHistory } = usePostcodeHistory();

  useEffect(() => {
    if (!user) return;
    // Fetch usage count from profile
    apiClient.getUserProfile(user.id, 'pay')
      .then(response => {
        if (!response.error && response.data && typeof response.data === 'object' && 'pay_count' in response.data) {
          setPayCount((response.data as any).pay_count || 0);
        }
      });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedPostcode = formatPostcode(postcode.trim());
    if (tier === 'free' && payCount >= 1) {
      setLimitHit(true);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      if (tier === 'free' && payCount < 1) {
        await apiClient.incrementUsage(user?.id, 'pay');
      }
      const response = await apiClient.getWhatShouldIPay({
        postcode: formattedPostcode,
        propertyType,
        offerMargin,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        plotSize: plotSize ? Number(plotSize) : undefined,
        condition,
        epcRating: epcRating || undefined,
        searchRadius
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      setResult(response.data);
      saveToHistory(formattedPostcode);
    } catch (err: unknown) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 lg:px-8 bg-neutral-50 min-h-screen">
      {/* Standardized Header */}
      <div className="text-center mb-10 max-w-3xl mx-auto pt-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3m6 0c0-1.657-1.343-3-3-3m0 0V4m0 4c1.657 0 3 1.343 3 3m-6 0c0 1.657 1.343 3 3 3m0 0v4m0-4c-1.657 0-3-1.343-3-3m6 0c0 1.657-1.343 3-3 3" /></svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-0" id="page-title">
            What Should I <span className="text-primary-600">Pay</span>?
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4" id="page-description">
          Get a <span className="text-primary-600 font-semibold">smart</span>, <span className="text-primary-600 font-semibold">data-driven</span> <span className="text-primary-600 font-semibold">offer suggestion</span> for your next property investment.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl shadow-lg p-4 lg:p-6 mb-6">
        {/* Search Mode Toggle */}
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              type="button"
              onClick={() => setSearchMode('basic')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'basic'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Basic Search
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('advanced')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'advanced'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Advanced Search
            </button>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Postcode</label>
          <SmartSearchInput
            value={postcode}
            onChange={setPostcode}
            placeholder="e.g., SW1A 1AA"
            showHistory={true}
            showSuggestions={true}
            debounceMs={300}
            minSearchLength={2}
            className=""
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Property Type</label>
          <select
            value={propertyType}
            onChange={e => setPropertyType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
            required
          >
            <option value="">Select type</option>
            <option value="D">Detached</option>
            <option value="S">Semi-Detached</option>
            <option value="T">Terraced</option>
            <option value="F">Flat</option>
            <option value="O">Other</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Search Radius</label>
          <select
            value={searchRadius}
            onChange={e => setSearchRadius(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
          >
            <option value={0}>Exact Postcode Only</option>
            <option value={1}>Within 1km</option>
            <option value={2}>Within 2km</option>
            <option value={5}>Within 5km</option>
            <option value={10}>Within 10km</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {searchRadius === 0 
              ? "Search only within the exact postcode" 
              : `Search within ${searchRadius}km radius for more comparables`
            }
          </p>
        </div>
        
        {/* Advanced Matching Criteria */}
        {searchMode === 'advanced' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-1">Bedrooms</label>
                <select
                  value={bedrooms}
                  onChange={e => setBedrooms(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                >
                  <option value="">Any</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4 Bedrooms</option>
                  <option value="5">5+ Bedrooms</option>
                </select>
              </div>
              
              <div>
                <label className="block font-medium mb-1">Property Size (m²)</label>
                                  <input
                    type="number"
                    value={plotSize}
                    onChange={e => setPlotSize(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                  />
              </div>

              <div>
                <label className="block font-medium mb-1">EPC Rating</label>
                <select
                  value={epcRating}
                  onChange={e => setEpcRating(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                >
                  <option value="">Any Rating</option>
                  <option value="A">A - Very Energy Efficient</option>
                  <option value="B">B - Energy Efficient</option>
                  <option value="C">C - Average</option>
                  <option value="D">D - Below Average</option>
                  <option value="E">E - Poor</option>
                  <option value="F">F - Very Poor</option>
                  <option value="G">G - Extremely Poor</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block font-medium mb-1">Property Condition</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
              >
                <option value="any">Any Condition</option>
                <option value="new">New Build</option>
                <option value="existing">Existing Property</option>
                <option value="energy_efficient">Energy Efficient (A-C)</option>
              </select>
            </div>
          </>
        )}
        
        <CompSlider value={offerMargin} onChange={setOfferMargin} min={0.7} max={1} step={0.01} />
        <button
          type="submit"
          className="w-full lg:w-auto rounded-xl font-semibold shadow-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 hover:from-primary-600 hover:to-primary-700 focus:ring-2 focus:ring-primary-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Calculating...</span>
            </div>
          ) : (
            <span className="text-lg">Calculate Valuation</span>
          )}
        </button>
      </form>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {result && (
        <div className="space-y-3">
          {/* Hero Section with Key Results and Primary CTA */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-3 lg:p-4 border border-blue-100">
            <div className="grid lg:grid-cols-3 gap-3 items-start">
              {/* Key Results */}
              <div className="lg:col-span-2 space-y-2">
                <div className="text-center lg:text-left">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-1">
                    Your Property Valuation
                  </h2>
                  <p className="text-xs text-gray-600">
                    Based on {result.comps.length} comparable properties in {result.searchCriteria.postcode}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  <div className="bg-white rounded-lg p-2 text-center shadow-sm border">
                    <div className="text-xs text-gray-600 mb-1">Suggested Offer</div>
                    <div className="text-base font-bold text-green-600">
                      £{result.suggestedOffer.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center shadow-sm border">
                    <div className="text-xs text-gray-600 mb-1">Market Value</div>
                    <div className="text-base font-bold text-blue-600">
                      £{result.avgValue.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center shadow-sm border lg:block hidden">
                    <div className="text-xs text-gray-600 mb-1">Confidence</div>
                    <div className="text-base font-bold text-purple-600">
                      {result.confidence.score}%
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Primary CTA - Desktop */}
              <div className="hidden lg:block">
                <PDFDownloadButton
                  userId={user?.id || session?.user?.id || ''}
                  email={user?.email || session?.user?.email}
                  propertyData={result}
                  userTier={tier}
                  className="sticky top-6"
                />
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
      {limitHit && <UpgradePrompt />}
    </div>
  );
} 