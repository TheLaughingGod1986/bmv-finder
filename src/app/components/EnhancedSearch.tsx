'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, TrendingUp, Building, Home, Sparkles, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useUser } from '@supabase/auth-helpers-react';
import { useUserTier } from '@/hooks/useUserTier';
import UpgradePrompt from './UpgradePrompt';

interface EnhancedSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  className?: string;
}

// UK postcode regex (loose, covers most cases)
const POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][0-9A-Z]? ?[0-9][A-Z]{2}$/i;

function formatIfPostcode(input: string) {
  const upper = input.toUpperCase();
  // Remove all non-alphanumeric except space
  const cleaned = upper.replace(/[^A-Z0-9 ]/g, '');
  // Remove all spaces for formatting
  const noSpace = cleaned.replace(/\s+/g, '');
  // Only format if it looks like a postcode (6 or 7 chars, ends with 3 letters/digits)
  if (noSpace.length >= 5 && noSpace.length <= 8) {
    // Insert space before last 3 chars
    return noSpace.slice(0, -3) + ' ' + noSpace.slice(-3);
  }
  return cleaned;
}

const MAX_HISTORY = 5;

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  value,
  onChange,
  onSearch,
  isLoading,
  className
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<{ text: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPostcode, setIsPostcode] = useState(false);
  const [isValidPostcode, setIsValidPostcode] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const user = useUser();
  const { tier, loading: tierLoading } = useUserTier(user?.id);
  const [lookupCount, setLookupCount] = useState<number>(0);
  const [limitHit, setLimitHit] = useState(false);

  useEffect(() => {
    const safeValue = value || '';
    if (safeValue.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    let ignore = false;
    async function fetchSuggestions() {
      try {
        const res = await fetch(`/api/suggest-postcodes?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (!ignore && data.suggestions) {
          setSuggestions(data.suggestions.map((s: string) => ({ text: s })));
        }
      } catch (e) {
        if (!ignore) setSuggestions([]);
      }
    }
    fetchSuggestions();
    return () => { ignore = true; };
  }, [value]);

  useEffect(() => {
    const safeValue = value || '';
    const trimmed = safeValue.trim();
    // Only validate as postcode if it matches postcode pattern
    if (POSTCODE_REGEX.test(trimmed)) {
      setIsPostcode(true);
      setIsValidPostcode(true);
    } else if (/^[A-Za-z]{1,2}[0-9]/.test(trimmed)) {
      setIsPostcode(true);
      setIsValidPostcode(false);
    } else {
      setIsPostcode(false);
      setIsValidPostcode(true);
    }
  }, [value]);

  // Load history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('searchHistory');
      if (stored) setHistory(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/profile-usage?userId=${user.id}`)
      .then(res => res.json())
      .then(data => setLookupCount(data.lookup_count || 0));
  }, [user]);

  if (tier === 'free' && lookupCount >= 3) {
    return <UpgradePrompt />;
  }

  // Save to history on search
  const saveToHistory = (query: string) => {
    let newHistory = [query, ...history.filter(h => h !== query)].slice(0, MAX_HISTORY);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeValue = value || '';
    if (safeValue.trim() && !isLoading) {
      onSearch(safeValue.trim());
      saveToHistory(safeValue.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    onSearch(suggestion);
    saveToHistory(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleHistoryClick = (query: string) => {
    onChange(query);
    onSearch(query);
    saveToHistory(query);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value || '';
    // If it looks like a postcode (starts with a letter and contains a digit), format it
    if (/^[A-Za-z]{1,2}\s*\d/.test(input)) {
      input = formatIfPostcode(input);
      onChange(input.toUpperCase());
    } else {
      onChange(input);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="max-w-4xl mx-auto">
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="relative mb-8">
          <div className="relative">
            <div className="relative flex items-center bg-white rounded-2xl border-2 border-gray-200 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-200 shadow-soft hover:shadow-medium">
              <div className="absolute left-4 text-text-tertiary">
                <Search className="w-6 h-6" />
              </div>
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-transparent outline-none text-lg px-12 py-4 placeholder-gray-400 text-text-primary"
                placeholder="Search by postcode, street name, or town"
                value={value}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                aria-label="Search by postcode, street, or town"
                autoComplete="off"
              />
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-20 p-2 text-text-tertiary hover:text-text-secondary transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || !value.trim()}
                className="absolute right-2 p-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Search"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Suggestions and History Dropdown */}
          <AnimatePresence>
            {showSuggestions && (suggestions.length > 0 || history.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-large z-dropdown overflow-hidden"
              >
                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="p-2">
                    <div className="text-xs font-medium text-text-secondary px-3 py-2">Suggestions</div>
                    {suggestions.slice(0, 5).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4 text-text-tertiary" />
                        <span className="text-text-primary">{suggestion.text}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* History */}
                {history.length > 0 && (
                  <div className="p-2 border-t border-gray-100">
                    <div className="text-xs font-medium text-text-secondary px-3 py-2">Recent Searches</div>
                    {history.slice(0, 3).map((query, index) => (
                      <button
                        key={index}
                        onClick={() => handleHistoryClick(query)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4 text-text-tertiary" />
                        <span className="text-text-primary">{query}</span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Building className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">2.5M+</div>
                <div className="text-sm text-text-secondary">Properties</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-secondary-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">BMV Score</div>
                <div className="text-sm text-text-secondary">Investment Rating</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">Live Data</div>
                <div className="text-sm text-text-secondary">Updated Daily</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSearch; 