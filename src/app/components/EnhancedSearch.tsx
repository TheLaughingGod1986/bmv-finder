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

  useEffect(() => {
    if (value.trim().length === 0) {
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
    const trimmed = value.trim();
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

  // Save to history on search
  const saveToHistory = (query: string) => {
    let newHistory = [query, ...history.filter(h => h !== query)].slice(0, MAX_HISTORY);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSearch(value.trim());
      saveToHistory(value.trim());
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
    let input = e.target.value;
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
      <form onSubmit={handleSubmit} className="relative">
        <div className="w-full flex flex-col items-center mb-4">
          <div className="w-full max-w-2xl flex items-center bg-white rounded-full px-4 py-2 gap-2 border border-blue-300 focus-within:ring-2 focus-within:ring-blue-400 transition-all shadow-sm">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent outline-none text-lg px-2 py-2 rounded-full placeholder-slate-400"
              placeholder="Search by postcode, street name, or town"
              value={value}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              aria-label="Search by postcode, street, or town"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 shadow transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Search"
              disabled={isLoading}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          {isPostcode && !isValidPostcode && (
            <div className="text-xs text-red-600 mt-1">Invalid UK postcode format</div>
          )}
        </div>
        {/* History Dropdown */}
        {focused && history.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-w-2xl mx-auto">
            {history.map((h, idx) => (
              <button
                key={h}
                type="button"
                onMouseDown={() => handleHistoryClick(h)}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-100 text-slate-900"
              >
                {h}
              </button>
            ))}
          </div>
        )}
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-w-2xl mx-auto">
            {suggestions.map((s, idx) => (
              <button
                key={s.text}
                type="button"
                onMouseDown={() => handleSuggestionClick(s.text)}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-100 text-slate-900"
              >
                {s.text}
              </button>
            ))}
          </div>
        )}
      </form>
      {/* Help Text */}
      <div className="mt-3 text-center">
        <p className="text-sm text-slate-600">
          Search by postcode, street name, or town to find sold property prices
        </p>
      </div>
      {isPostcode && !isValidPostcode && (
        <p className="text-xs text-red-600 mt-1">Invalid UK postcode format</p>
      )}
    </div>
  );
};

export default EnhancedSearch; 