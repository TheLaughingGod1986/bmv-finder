'use client';

import { useState } from 'react';
import { Search, Loader2, XCircle } from 'lucide-react';
import Button from './Button';
import { formatPostcode } from '../../utils/formatPostcode';

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
    let queryToSend = searchQuery.trim();
    if (isPostcode) {
      queryToSend = formatPostcode(queryToSend);
    }
    if (!isPostcode && searchQuery.length < 3) {
      setError('Please enter at least 3 characters for a street or town search');
      return;
    }

    setError(null);
    onSearch(queryToSend);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    // UK postcode regex (loose, covers most cases)
    const POSTCODE_REGEX = /^[A-Za-z]{1,2}\s*\d/;
    if (POSTCODE_REGEX.test(input)) {
      input = formatPostcode(input);
      setSearchQuery(input.toUpperCase());
    } else {
      setSearchQuery(input);
    }
    if (error) {
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
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
          className={`input-enhanced pl-12 pr-4 ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''
          } ${
            disabled || loading ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />
        )}
      </div>
      <Button 
        type="submit" 
        disabled={disabled || loading || !searchQuery.trim()}
        className="btn-primary"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Searching...
          </div>
        ) : (
          'Search'
        )}
      </Button>
      {error && (
        <div id={`${id}-error`} className="fieldError" role="alert" aria-live="polite">
          <XCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </form>
  );
} 