'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Clock, X, Loader2, Home, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { formatPostcode } from '../../utils/formatPostcode';
import { usePostcodeHistory } from '../../utils/usePostcodeHistory';

interface AddressSuggestion {
  address: string;
  postcode: string;
  number: string;
  street: string;
  display: string;
}

interface AddressSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: AddressSuggestion) => void;
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
  debounceMs?: number;
  minSearchLength?: number;
}

// UK postcode regex (loose, covers most cases)
const POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][0-9A-Z]? ?[0-9][A-Z]{2}$/i;

const AddressSearchInput: React.FC<AddressSearchInputProps> = ({
  value,
  onChange,
  onAddressSelect,
  onSearch,
  onSubmit,
  placeholder = "Enter postcode or start typing an address...",
  className,
  showHistory = true,
  showSuggestions = true,
  isLoading = false,
  disabled = false,
  autoFocus = false,
  'aria-label': ariaLabel = "Search for an address",
  debounceMs = 300,
  minSearchLength = 2
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPostcode, setIsPostcode] = useState(false);
  const [isValidPostcode, setIsValidPostcode] = useState(true);
  const { history, saveToHistory } = usePostcodeHistory(showHistory);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Fetch suggestions with debouncing
  useEffect(() => {
    const safeValue = value || '';
    if (safeValue.trim().length === 0 || !showSuggestions) {
      setSuggestions([]);
      setAddresses([]);
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
          const response = await fetch(`/api/address-suggestions?q=${encodeURIComponent(safeValue)}`);
          const data = await response.json();
          
          if (data.suggestions) {
            setSuggestions(data.suggestions);
          }
          if (data.addresses) {
            setAddresses(data.addresses);
          }
        } catch (e) {
          setSuggestions([]);
          setAddresses([]);
        } finally {
          setSearching(false);
        }
      }, debounceMs);
    } else {
      setSuggestions([]);
      setAddresses([]);
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

  const handleAddressClick = (address: AddressSuggestion) => {
    if (onAddressSelect) {
      onAddressSelect(address);
    } else {
      // Fallback: just set the full address as the value
      onChange(address.display);
      if (onSearch) {
        onSearch(address.display);
      }
    }
    saveToHistory(address.postcode);
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

  const shouldShowDropdown = showDropdown && (focused || suggestions.length > 0 || addresses.length > 0 || (showHistory && history.length > 0));

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
                aria-label="Clear input"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !value.trim() || disabled}
              className="absolute right-4 sm:right-6 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-full p-2 sm:p-3 transition-colors touch-target disabled:cursor-not-allowed"
              aria-label="Search"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Dropdown with History, Suggestions, and Addresses */}
        <AnimatePresence>
          {shouldShowDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-xl border border-gray-200 shadow-large max-h-96 overflow-y-auto"
            >
              {/* Search History */}
              {history.length > 0 && showHistory && (
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent Searches
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

              {/* Address Suggestions */}
              {addresses.length > 0 && (
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Addresses
                  </h3>
                  <div className="space-y-2">
                    {addresses.slice(0, 8).map((address, index) => (
                      <button
                        key={index}
                        onClick={() => handleAddressClick(address)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors touch-target flex items-center gap-3"
                      >
                        <Building className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-text-primary font-medium truncate">
                            {address.number} {address.street}
                          </div>
                          <div className="text-xs text-text-tertiary truncate">
                            {address.postcode}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Postcode Suggestions */}
              {suggestions.length > 0 && showSuggestions && (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Postcodes
                  </h3>
                  <div className="space-y-2">
                    {suggestions.slice(0, 5).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors touch-target flex items-center gap-3"
                      >
                        <MapPin className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                        <span className="text-sm text-text-primary truncate">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {searching && (
                <div className="p-4 text-center">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto text-text-tertiary" />
                  <p className="text-xs text-text-tertiary mt-2">Searching...</p>
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
            <MapPin className="w-4 h-4" />
            Please enter a valid UK postcode format (e.g., SW1A 1AA)
          </p>
        </div>
      )}
    </div>
  );
};

export default AddressSearchInput; 