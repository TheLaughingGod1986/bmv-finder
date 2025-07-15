import React from 'react';
import DealAnalysisSearch from '../components/DealAnalysisSearch';

export default function AdvancedDealAnalysisPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6 text-primary-700">Advanced Deal Analysis</h1>
      <p className="mb-8 text-gray-700 max-w-2xl">
        Enter a house number and postcode to get a comprehensive deal analysis, including HPI data, sold prices, property details, and market insights. This tool is ideal for in-depth property investment research.
      </p>
      <DealAnalysisSearch />
    </main>
  );
} 