'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';

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
      <div className="relative">
        <input
          key="market-search-input"
          type="text"
          value={searchTerm}
          onChange={handleInputChange}

          placeholder={placeholder}
          className="w-full px-4 py-3 pl-10 pr-12 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          autoComplete="off"
          spellCheck="false"
        />
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      {searchMessage && (
        <div className="mt-2 text-sm text-gray-600">
          {searchMessage}
        </div>
      )}
    </div>
  );
} 