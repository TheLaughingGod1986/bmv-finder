'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/apiClient';

export default function TestApiClient() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testSuggestPostcodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.suggestPostcodes('SW1');
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testLastUpdated = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getLastUpdated();
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testHpiData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getHpiData('SW1A1AA');
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">API Client Test</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testSuggestPostcodes}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Suggest Postcodes'}
        </button>
        
        <button
          onClick={testLastUpdated}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50 ml-2"
        >
          {loading ? 'Testing...' : 'Test Last Updated'}
        </button>
        
        <button
          onClick={testHpiData}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50 ml-2"
        >
          {loading ? 'Testing...' : 'Test HPI Data'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Results:</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 