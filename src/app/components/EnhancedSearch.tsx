'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, TrendingUp, Building, Home, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EnhancedSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  className?: string;
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  value,
  onChange,
  onSearch,
  isLoading,
  className
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = [
    { 
      icon: <MapPin className="w-4 h-4" />, 
      text: 'SW1A 1AA', 
      description: 'Buckingham Palace, London',
      category: 'Famous Address'
    },
    { 
      icon: <Building className="w-4 h-4" />, 
      text: 'M1 1AA', 
      description: 'Manchester City Centre',
      category: 'City Centre'
    },
    { 
      icon: <Home className="w-4 h-4" />, 
      text: 'B1 1AA', 
      description: 'Birmingham City Centre',
      category: 'City Centre'
    },
    { 
      icon: <TrendingUp className="w-4 h-4" />, 
      text: 'L1 1AA', 
      description: 'Liverpool City Centre',
      category: 'City Centre'
    },
    { 
      icon: <Sparkles className="w-4 h-4" />, 
      text: 'SE22 0HP', 
      description: 'East Dulwich, London',
      category: 'Popular Area'
    },
    { 
      icon: <Sparkles className="w-4 h-4" />, 
      text: 'W11 1AA', 
      description: 'Notting Hill, London',
      category: 'Popular Area'
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSearch(value.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setFocused(true);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setFocused(false);
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const getPlaceholder = () => {
    if (isLoading) return 'Searching...';
    return 'Enter postcode, street name, or town...';
  };

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className={cn(
          "relative flex items-center bg-white rounded-2xl shadow-lg border-2 transition-all duration-200",
          focused 
            ? "border-blue-500 shadow-blue-100" 
            : "border-slate-200 hover:border-slate-300 hover:shadow-xl"
        )}>
          {/* Search Icon */}
          <div className="absolute left-4 text-slate-400">
            <Search className="w-5 h-5" />
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={getPlaceholder()}
            disabled={isLoading}
            className={cn(
              "w-full pl-12 pr-12 py-4 text-lg font-medium text-slate-900 placeholder-slate-500",
              "bg-transparent border-none outline-none focus:ring-0",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />

          {/* Clear Button */}
          {value && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Search Button */}
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className={cn(
              "absolute right-2 p-2 rounded-xl transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              value.trim() && !isLoading
                ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
            aria-label="Search properties"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Popular Searches
            </h3>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                    {suggestion.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                      {suggestion.text}
                    </div>
                    <div className="text-sm text-slate-500">
                      {suggestion.description}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    {suggestion.category}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Search Tips */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-600 mb-2">Search Tips:</h4>
              <div className="text-xs text-slate-500 space-y-1">
                <div>• Try partial postcodes (e.g., "SW1" for all SW1 areas)</div>
                <div>• Search by street name or town</div>
                <div>• Use full postcodes for precise results</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-3 text-center">
        <p className="text-sm text-slate-600">
          Search by postcode, street name, or town to find sold property prices
        </p>
      </div>
    </div>
  );
};

export default EnhancedSearch; 