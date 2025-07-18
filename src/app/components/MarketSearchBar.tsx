'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import SmartSearchInput from './SmartSearchInput';

interface MarketData {
  region: string;
  currentIndex: number;
  yoyGrowth: number;
  momGrowth: number;
  volatility: number;
  trend: 'rising' | 'falling' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  investmentScore: number;
  lastUpdated: string;
  dataPoints: number;
  timeframeGrowth: number;
  propertyCount: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
    median: number;
  };
}

interface MarketSearchBarProps {
  onSearchChange: (searchTerm: string, filteredData: any[]) => void;
  placeholder?: string;
  initialValue?: string;
  timeframe?: string;
}

export default function MarketSearchBar({ onSearchChange, placeholder = "Search regions or postcodes...", initialValue = "", timeframe = "1y" }: MarketSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update search term when initialValue changes
  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  const handleSearch = async (term: string) => {

    // Don't update searchTerm here to avoid input conflicts
    if (!term.trim()) {
      onSearchChange('', []);
      setSearchMessage('');
      return;
    }
    setIsSearching(true);
    setSearchMessage('Searching...');
    try {
      const response = await fetch(`/api/market-analysis/enhanced?timeframe=${timeframe}&search=${encodeURIComponent(term)}`);
      const result = await response.json();

      if (result.success && result.data) {
        onSearchChange(term, result.data);
        setSearchMessage(result.data.length > 0 
          ? `Found ${result.data.length} region(s) for "${term}"`
          : `No matching region found for "${term}"`
        );
      } else {
        onSearchChange(term, []);
        setSearchMessage(`No matching region found for "${term}"`);
      }
    } catch (error) {
      console.error('Search error:', error);
      onSearchChange(term, []);
      setSearchMessage('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Check if input looks like a postcode (shorter minimum for postcodes)
    const isPostcode = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(value.trim());
    const minLength = isPostcode ? 2 : 3; // Allow shorter searches for postcodes
    
    // Only search if there's a meaningful term
    if (value.trim().length >= minLength) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(value);
      }, 1000); // Much longer debounce time
    } else if (value.trim().length === 0) {
      // Clear results immediately when input is empty
      onSearchChange('', []);
      setSearchMessage('');
    }
  };

  return (
    <div className="relative">
      <SmartSearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        onSearch={(query) => {
          setSearchTerm(query);
          handleSearch(query);
        }}
        placeholder={placeholder}
        showHistory={true}
        showSuggestions={true}
        debounceMs={1000}
        minSearchLength={2}
        className=""
      />
      {searchMessage && (
        <div className="mt-2 text-sm text-gray-600">
          {searchMessage}
        </div>
      )}
    </div>
  );
} 