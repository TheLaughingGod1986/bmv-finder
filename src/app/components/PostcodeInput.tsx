'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Clock, X, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { apiClient } from '@/lib/apiClient';
import { formatPostcode } from '../../utils/formatPostcode';
import { usePostcodeHistory } from '../../utils/usePostcodeHistory';

interface PostcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  onSubmit?: (e: React.FormEvent) => void;
  placeholder?: string;
  className?: string;
  showHistory?: boolean;
  showSuggestions?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
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

const PostcodeInput: React.FC<PostcodeInputProps> = ({
  value,
  onChange,
  onSearch,
  onSubmit,
  placeholder = "Enter UK postcode (e.g., SW1A 1AA)",
  className,
  showHistory = true,
  showSuggestions = true,
  isLoading = false,
  disabled = false,
  autoFocus = false,
  'aria-label': ariaLabel = "Enter UK postcode"
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<{ text: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPostcode, setIsPostcode] = useState(false);
  const [isValidPostcode, setIsValidPostcode] = useState(true);
  const { history, saveToHistory } = usePostcodeHistory(showHistory);

  // Load history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && showHistory) {
      const stored = localStorage.getItem('postcodeHistory');
      if (stored) setHistory(JSON.parse(stored));
    }
  }, [showHistory]);

  // Fetch suggestions
  useEffect(() => {
    const safeValue = value || '';
    if (safeValue.trim().length === 0 || !showSuggestions) {
      setSuggestions([]);
      return;
    }
    let ignore = false;
    async function fetchSuggestions() {
      try {
        const response = await apiClient.suggestPostcodes(value);
        if (!ignore && !response.error && response.data && typeof response.data === 'object' && 'suggestions' in response.data && Array.isArray((response.data as any).suggestions)) {
          setSuggestions((response.data as any).suggestions.map((s: string) => ({ text: s })));
        }
      } catch (e) {
        if (!ignore) setSuggestions([]);
      }
    }
    fetchSuggestions();
    return () => { ignore = true; };
  }, [value, showSuggestions]);

  // Validate postcode format
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

  // Save to history
  const saveToHistory = (query: string) => {
    if (!showHistory) return;
    let newHistory = [query, ...history.filter(h => h !== query)].slice(0, MAX_HISTORY);
    setHistory(newHistory);
    localStorage.setItem('postcodeHistory', JSON.stringify(newHistory));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let safeValue = value || '';
    safeValue = formatPostcode(safeValue.trim());
    if (safeValue && !isLoading && !disabled) {
      if (onSubmit) {
        onSubmit(e);
      } else if (onSearch) {
        onSearch(safeValue);
      }
      saveToHistory(safeValue);
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    if (onSearch) {
      onSearch(suggestion);
    }
    saveToHistory(suggestion);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleHistoryClick = (query: string) => {
    onChange(query);
    if (onSearch) {
      onSearch(query);
    }
    saveToHistory(query);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setFocused(true);
    setShowDropdown(true);
  };

  const handleBlur = () => {
    setFocused(false);
    // Format postcode on blur
    if (value) {
      const formatted = formatPostcode(value);
      if (formatted !== value) {
        onChange(formatted);
      }
    }
    setTimeout(() => setShowDropdown(false), 200);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value || '';
    // Format as user types if it looks like a postcode
    if (/^[A-Za-z]{1,2}\s*\d/.test(input)) {
      input = formatPostcode(input);
      onChange(input.toUpperCase());
    } else {
      onChange(input);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="relative flex items-center bg-white rounded-2xl border-2 border-gray-200 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-200 shadow-soft hover:shadow-medium">
            <div className="absolute left-4 text-text-tertiary">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent outline-none text-base sm:text-lg px-12 py-4 sm:py-4 placeholder-gray-400 text-text-primary"
              placeholder={placeholder}
              value={value}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              aria-label={ariaLabel}
              autoComplete="off"
              disabled={disabled}
              autoFocus={autoFocus}
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-4 p-1 text-text-tertiary hover:text-text-primary transition-colors touch-target"
                aria-label="Clear postcode"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !value.trim() || disabled}
              className="absolute right-4 sm:right-6 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-full p-2 sm:p-3 transition-colors touch-target disabled:cursor-not-allowed"
              aria-label="Search postcode"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Dropdown with History and Suggestions */}
        <AnimatePresence>
          {showDropdown && (suggestions.length > 0 || (history.length > 0 && showHistory)) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-xl border border-gray-200 shadow-large max-h-80 overflow-y-auto"
            >
              {/* Search History */}
              {history.length > 0 && showHistory && (
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent Postcodes
                  </h3>
                  <div className="space-y-2">
                    {history.slice(0, 3).map((query, index) => (
                      <button
                        key={index}
                        onClick={() => handleHistoryClick(query)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors touch-target flex items-center gap-3"
                      >
                        <Clock className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                        <span className="text-sm text-text-primary truncate">{query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && showSuggestions && (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Suggestions
                  </h3>
                  <div className="space-y-2">
                    {suggestions.slice(0, 5).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors touch-target flex items-center gap-3"
                      >
                        <MapPin className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                        <span className="text-sm text-text-primary truncate">{suggestion.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Postcode Validation */}
      {isPostcode && !isValidPostcode && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Please enter a valid UK postcode format (e.g., SW1A 1AA)
          </p>
        </div>
      )}
    </div>
  );
};

export default PostcodeInput; 