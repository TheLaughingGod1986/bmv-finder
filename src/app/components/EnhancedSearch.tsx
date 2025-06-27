'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Clock } from 'lucide-react';
import { cn, getSearchSuggestions, validatePostcode } from '../../lib/utils';

interface EnhancedSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
  className?: string;
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  value,
  onChange,
  onSearch,
  isLoading,
  placeholder = "e.g., SW1A 1AA, Downing Street, Manchester",
  className
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((search: string) => {
    const trimmed = search.trim();
    if (!trimmed) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== trimmed);
      const newSearches = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(newSearches));
      return newSearches;
    });
  }, []);

  // Generate suggestions based on input
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const newSuggestions = getSearchSuggestions(value);
    setSuggestions(newSuggestions);
  }, [value]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + recentSearches.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const allItems = [...suggestions, ...recentSearches];
          const selectedItem = allItems[selectedIndex];
          if (selectedItem) {
            onChange(selectedItem);
            onSearch(selectedItem);
            saveRecentSearch(selectedItem);
            setShowSuggestions(false);
            setSelectedIndex(-1);
          }
        } else if (value.trim()) {
          onSearch(value.trim());
          saveRecentSearch(value.trim());
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [value, suggestions, recentSearches, selectedIndex, onChange, onSearch, saveRecentSearch]);

  // Handle input focus
  const handleFocus = () => {
    setShowSuggestions(true);
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay to allow for clicks on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    onSearch(suggestion);
    saveRecentSearch(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  // Handle clear button
  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const isPostcodeValid = value.trim() ? validatePostcode(value.trim()) : true;
  const hasSuggestions = suggestions.length > 0 || recentSearches.length > 0;

  return (
    <div className={cn("relative w-full max-w-2xl mx-auto animate-fade-in", className)}>
      <form
        className="flex flex-col sm:flex-row gap-2 items-stretch bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100 px-4 py-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-400"
        onSubmit={e => { e.preventDefault(); if (value.trim()) { onSearch(value.trim()); saveRecentSearch(value.trim()); setShowSuggestions(false); } }}
        role="search"
        aria-label="Property search"
      >
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-blue-400" />
          </span>
          <input
            id="postcode"
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            autoComplete="off"
            className={cn(
              "w-full pl-10 pr-12 py-3 border-2 rounded-xl text-lg font-medium bg-white/80 backdrop-blur-md",
              "focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200",
              "placeholder-gray-400 text-gray-900 shadow-sm",
              isPostcodeValid ? "border-slate-300" : "border-red-300 focus:ring-red-400",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Search for sold property prices"
          />
          {value && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
              type="button"
              tabIndex={-1}
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-lg shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
          aria-label="Search"
        >
          {isLoading ? (
            <span className="animate-spin mr-2"><Clock className="h-5 w-5" /></span>
          ) : (
            <Search className="h-5 w-5 mr-2" />
          )}
          <span className="hidden sm:inline">Search</span>
        </button>
      </form>
      {/* Validation indicator */}
      {value.trim() && (
        <div className="mt-1 text-xs pl-2">
          {isPostcodeValid ? (
            <span className="text-green-600 flex items-center gap-1">✓ Valid format</span>
          ) : (
            <span className="text-red-600 flex items-center gap-1">⚠ Invalid postcode format</span>
          )}
        </div>
      )}
      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && hasSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            ref={suggestionsRef}
            className="absolute left-0 right-0 mt-2 z-30 bg-white/90 backdrop-blur-md border border-blue-100 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="divide-y divide-blue-50">
              {suggestions.map((suggestion, i) => (
                <button
                  key={suggestion}
                  className={cn(
                    "w-full text-left px-5 py-3 text-base hover:bg-blue-50 focus:bg-blue-100 transition-colors",
                    selectedIndex === i && "bg-blue-100 text-blue-800"
                  )}
                  onMouseDown={() => handleSuggestionClick(suggestion)}
                  tabIndex={-1}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-400" />
                    {suggestion}
                  </span>
                </button>
              ))}
              {recentSearches.length > 0 && (
                <div className="px-5 py-2 text-xs text-slate-500 bg-blue-50 font-semibold">Recent Searches</div>
              )}
              {recentSearches.map((recent, i) => (
                <button
                  key={recent}
                  className={cn(
                    "w-full text-left px-5 py-3 text-base hover:bg-blue-50 focus:bg-blue-100 transition-colors",
                    selectedIndex === (suggestions.length + i) && "bg-blue-100 text-blue-800"
                  )}
                  onMouseDown={() => handleSuggestionClick(recent)}
                  tabIndex={-1}
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    {recent}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSearch; 