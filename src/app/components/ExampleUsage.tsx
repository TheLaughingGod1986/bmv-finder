'use client';

import { useState, useEffect } from 'react';
import { apiClient, PropertySearchResult, HpiData, BmvScore } from '@/lib/apiClient';

// Example: Updated Property Search Component
export function PropertySearchExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<PropertySearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.searchProperties(searchTerm);
      
      if (response.error) {
        setError(response.error);
      } else {
        setResults(response.data as PropertySearchResult);
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Enter postcode or address"
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      {error && <div className="error">{error}</div>}
      {results && (
        <div>
          <h3>Found {results.totalCount} properties</h3>
          {/* Display results */}
        </div>
      )}
    </div>
  );
}

// Example: Updated HPI Component
export function HpiDataExample() {
  const [postcode, setPostcode] = useState('');
  const [hpiData, setHpiData] = useState<HpiData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHpiData = async () => {
    setLoading(true);
    
    try {
      const response = await apiClient.getHpiData(postcode);
      
      if (response.data) {
        setHpiData(response.data as HpiData);
      }
    } catch (err) {
              // Failed to fetch HPI data
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={postcode}
        onChange={(e) => setPostcode(e.target.value)}
        placeholder="Enter postcode"
      />
      <button onClick={fetchHpiData} disabled={loading}>
        {loading ? 'Loading...' : 'Get HPI Data'}
      </button>
      
      {hpiData && (
        <div>
          <h3>HPI Data for {hpiData.region}</h3>
          <p>Index: {hpiData.index}</p>
          <p>Date: {hpiData.date}</p>
        </div>
      )}
    </div>
  );
}

// Example: Updated BMV Scoring Component
export function BmvScoringExample() {
  const [postcode, setPostcode] = useState('');
  const [propertyData, setPropertyData] = useState({
    price: 250000,
    propertyType: 'T',
    dateOfTransfer: '2024-01-15'
  });
  const [bmvScore, setBmvScore] = useState<BmvScore | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateBmvScore = async () => {
    setLoading(true);
    
    try {
      const response = await apiClient.getEnhancedBmvScore(postcode, propertyData);
      
      if (response.data) {
        setBmvScore(response.data as BmvScore);
      }
    } catch (err) {
              // Failed to calculate BMV score
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={postcode}
        onChange={(e) => setPostcode(e.target.value)}
        placeholder="Enter postcode"
      />
      <button onClick={calculateBmvScore} disabled={loading}>
        {loading ? 'Calculating...' : 'Calculate BMV Score'}
      </button>
      
      {bmvScore && (
        <div>
          <h3>BMV Score: {bmvScore.score}</h3>
          <p>Category: {bmvScore.category}</p>
        </div>
      )}
    </div>
  );
}

// Example: Custom API Request
export function CustomApiExample() {
  const [data, setData] = useState<any>(null);

  const makeCustomRequest = async () => {
    try {
      // Example of a custom request to a specific service
      const response = await apiClient.customRequest(
        'property-search',
        'custom-action',
        { customData: 'value' },
        { param1: 'value1' }
      );
      
      if (response.data) {
        setData(response.data);
      }
    } catch (err) {
              // Custom request failed
    }
  };

  return (
    <div>
      <button onClick={makeCustomRequest}>Make Custom Request</button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
} 