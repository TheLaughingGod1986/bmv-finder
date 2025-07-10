'use client';

import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  initialValue?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  id?: string;
}

export default function SearchInput({ 
  onSearch, 
  placeholder = "Search by postcode, street, or town",
  className = '',
  loading = false,
  disabled = false,
  initialValue = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  id
}: SearchInputProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    // UK postcode regex (loose, covers most cases)
    const POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][0-9A-Z]? ?[0-9][A-Z]{2}$/i;
    const isPostcode = POSTCODE_REGEX.test(searchQuery.toUpperCase());
    
    if (!isPostcode && searchQuery.length < 3) {
      setError('Please enter at least 3 characters for a street or town search');
      return;
    }

    setError(null);
    onSearch(searchQuery.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (error) {
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#3B755D] w-5 h-5" />
        <input 
          type="text" 
          id={id}
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          disabled={disabled || loading}
          aria-label={ariaLabel || placeholder}
          aria-describedby={ariaDescribedby}
          aria-invalid={error ? 'true' : 'false'}
          aria-busy={loading}
          className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-[#D2B48C] focus:border-[#3A7CA5] focus:ring-[#3A7CA5]'
          } focus:ring-2 focus:ring-offset-0 outline-none transition-all duration-200 ease-in-out hover:border-[#3A7CA5] ${
            disabled || loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          }`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#3A7CA5] w-5 h-5 animate-spin" />
        )}
      </div>
      <button 
        type="submit" 
        disabled={disabled || loading || !searchQuery.trim()}
        className={`px-6 py-3 rounded-lg font-semibold shadow transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 ${
          disabled || loading || !searchQuery.trim()
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-[#5DA271] text-white hover:bg-[#3B755D] hover:shadow-lg'
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Searching...
          </div>
        ) : (
          'Search'
        )}
      </button>
      {error && (
        <div id={`${id}-error`} className="text-red-600 text-sm mt-1" role="alert" aria-live="polite">
          {error}
        </div>
      )}
    </form>
  );
} 