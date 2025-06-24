'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Clock, TrendingUp } from 'lucide-react';
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
    <div className={cn("relative", className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            "w-full pl-10 pr-12 py-3 border-2 rounded-lg text-lg font-medium",
            "focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200",
            "placeholder-gray-400 bg-white shadow-sm",
            isPostcodeValid ? "border-gray-300" : "border-red-300 focus:ring-red-400",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        />

        {value && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Validation indicator */}
        {value.trim() && (
          <div className="absolute -bottom-6 left-0 text-xs">
            {isPostcodeValid ? (
              <span className="text-green-600 flex items-center gap-1">
                ✓ Valid format
              </span>
            ) : (
              <span className="text-red-600 flex items-center gap-1">
                ⚠ Invalid postcode format
              </span>
            )}
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && hasSuggestions && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto"
          >
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={`recent-${search}`}
                    onClick={() => handleSuggestionClick(search)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors",
                      selectedIndex === index && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{search}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <TrendingUp className="h-3 w-3" />
                  Popular Areas
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`suggestion-${suggestion}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors",
                      selectedIndex === (recentSearches.length + index) && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Quick search tips */}
            <div className="border-t border-gray-100 p-3 bg-gray-50 rounded-b-lg">
              <div className="text-xs text-gray-500">
                <div className="font-semibold mb-1">💡 Search Tips:</div>
                <div className="space-y-1">
                  <div>• Try partial postcodes (e.g., "SW1A")</div>
                  <div>• Search by street name or town</div>
                  <div>• Use ⌘K to focus, Enter to search</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSearch; 