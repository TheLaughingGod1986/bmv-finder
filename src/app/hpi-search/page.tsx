'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import HpiPostcodeSearch from '../components/HpiPostcodeSearch';

export default function HpiSearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Search</span>
              </Link>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-text-primary">House Price Index Search</h1>
              <p className="text-sm text-text-secondary">Get current HPI data for any UK postcode</p>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              House Price Index Data
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Search for any UK postcode to see the latest House Price Index data, 
              including trends, growth rates, and historical information for that area.
            </p>
          </div>
        </div>

        {/* HPI Search Component */}
        <HpiPostcodeSearch />

        {/* Information Section */}
        <div className="mt-12 bg-white rounded-xl border border-gray-200 shadow-medium p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">About House Price Index (HPI)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-text-primary mb-2">What is HPI?</h4>
              <p className="text-sm text-text-secondary">
                The House Price Index (HPI) is a measure of average property price changes over time. 
                It tracks how property values have changed in different regions of the UK, with 100 representing 
                January 1995 prices as the baseline.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-text-primary mb-2">How to interpret the data</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• <strong>HPI Index:</strong> Current index value relative to 1995 baseline</li>
                <li>• <strong>Month-over-Month:</strong> Percentage change from previous month</li>
                <li>• <strong>Year-over-Year:</strong> Percentage change from same month last year</li>
                <li>• <strong>Trend Chart:</strong> Visual representation of price movements</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Usage Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">For Property Investors</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Compare growth rates across different areas</li>
                <li>• Identify regions with strong price momentum</li>
                <li>• Use historical data to spot trends</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">For Home Buyers</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Understand local market conditions</li>
                <li>• See how prices have changed over time</li>
                <li>• Make informed decisions about timing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 