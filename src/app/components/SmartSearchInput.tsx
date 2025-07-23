'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Clock, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostcodeHistory } from '../../utils/usePostcodeHistory';
import { apiClient } from '@/lib/apiClient';
import { formatPostcode } from '../../utils/formatPostcode';

interface SmartSearchInputProps {
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
  id?: string;
  debounceMs?: number;
  minSearchLength?: number;
}

// UK postcode regex (loose, covers most cases)
const POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][0-9A-Z]? ?[0-9][A-Z]{2}$/i;

const SmartSearchInput: React.FC<SmartSearchInputProps> = ({
  value,
  onChange,
  onSearch,
  onSubmit,
  placeholder = "Search by postcode, street name, or town",
  className = '',
  showHistory = true,
  showSuggestions = true,
  isLoading = false,
  disabled = false,
  autoFocus = false,
  'aria-label': ariaLabel,
  id,
  debounceMs = 300,
  minSearchLength = 2
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<{ text: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPostcode, setIsPostcode] = useState(false);
  const [isValidPostcode, setIsValidPostcode] = useState(true);
  const { history, saveToHistory } = usePostcodeHistory(showHistory);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Fetch suggestions with debouncing
  useEffect(() => {
    const safeValue = value || '';
    if (safeValue.trim().length === 0 || !showSuggestions) {
      setSuggestions([]);
      return;
    }

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Only search if we have enough characters
    if (safeValue.trim().length >= minSearchLength) {
      setSearching(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const response = await apiClient.suggestPostcodes(safeValue);
                      if (!response.error && response.data && typeof response.data === 'object' && 'suggestions' in response.data && Array.isArray((response.data as { suggestions: string[] }).suggestions)) {
              setSuggestions((response.data as { suggestions: string[] }).suggestions.map((s: string) => ({ text: s })));
          }
        } catch (e) {
          setSuggestions([]);
        } finally {
          setSearching(false);
        }
      }, debounceMs);
    } else {
      setSuggestions([]);
      setSearching(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, showSuggestions, debounceMs, minSearchLength]);

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

  const shouldShowDropdown = showDropdown && (focused || suggestions.length > 0 || (showHistory && history.length > 0));

  return (
    <div className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="relative flex items-center bg-white rounded-lg border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200">
            <div className="absolute left-3 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              ref={inputRef}
              type="text"
              id={id}
              className="w-full bg-transparent outline-none text-base px-10 py-3 placeholder-gray-400 text-gray-900"
              placeholder={placeholder}
              value={value}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              aria-label={ariaLabel || placeholder}
              autoComplete="off"
              disabled={disabled}
              autoFocus={autoFocus}
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {searching && (
              <div className="absolute right-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Dropdown with recent searches and suggestions */}
      <AnimatePresence>
        {shouldShowDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
          >
            {/* Recent Searches */}
            {showHistory && history.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4" />
                  Recent Searches
                </div>
                <div className="space-y-1">
                  {history.slice(0, 5).map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryClick(query)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2"
                    >
                      <Clock className="w-3 h-3 text-gray-400" />
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-3">
                <div className="text-sm font-medium text-gray-700 mb-2">Suggestions</div>
                <div className="space-y-1">
                  {suggestions.slice(0, 5).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      {suggestion.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No results message */}
            {!searching && suggestions.length === 0 && history.length === 0 && value.trim().length >= minSearchLength && (
              <div className="p-3 text-sm text-gray-500">
                No suggestions found
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartSearchInput; 