"use client";

import React, { useState, useEffect } from 'react';
import ValuationBreakdown from '../components/ValuationBreakdown';
import ConfidenceScore from '../components/ConfidenceScore';
import CompSlider from '../components/CompSlider';
import { useUser } from '@supabase/auth-helpers-react';
import { useUserTier } from '@/hooks/useUserTier';
import UpgradePrompt from '../components/UpgradePrompt';
import { apiClient } from '@/lib/apiClient';
import { formatPostcode } from '@/utils/formatPostcode';
import { usePostcodeHistory } from '@/utils/usePostcodeHistory';
import SmartSearchInput from '../components/SmartSearchInput';

export default function WhatShouldIPayPage() {
  const [postcode, setPostcode] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [offerMargin, setOfferMargin] = useState(0.85);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const user = useUser();
  const { tier, loading: tierLoading } = useUserTier(user?.id);
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
        offerMargin
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      setResult(response.data);
      saveToHistory(formattedPostcode);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 bg-[#FAF9F6] min-h-screen">
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
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl shadow-lg p-6 mb-6">
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
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
            required
          >
            <option value="">Select type</option>
            <option value="detached">Detached</option>
            <option value="semi-detached">Semi-Detached</option>
            <option value="terraced">Terraced</option>
            <option value="flat">Flat</option>
            <option value="bungalow">Bungalow</option>
          </select>
        </div>
        <CompSlider value={offerMargin} onChange={setOfferMargin} min={0.7} max={1} step={0.01} />
        <button
          type="submit"
          className="rounded-full font-semibold shadow bg-primary-500 text-white px-5 py-2.5 hover:bg-primary-600 focus:ring-2 focus:ring-primary-400 transition"
          disabled={loading}
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
      </form>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {result && (
        <div className="space-y-4">
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
            <div className="rounded-lg border p-4 bg-white shadow">
              <div className="font-medium">Latest Year-over-Year HPI Growth:</div>
              <div className="text-lg font-bold text-blue-700">{(result.latestYoY * 100).toFixed(2)}%</div>
            </div>
          )}
        </div>
      )}
      {limitHit && <UpgradePrompt />}
    </div>
  );
} 