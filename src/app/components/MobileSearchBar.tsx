'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, TrendingUp, Building2 } from 'lucide-react';
import AddressSearchInput from './AddressSearchInput';

interface MobileSearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function MobileSearchBar({ 
  onSearch, 
  isLoading = false, 
  placeholder = "Search by address or postcode..." 
}: MobileSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    onSearch(query);
    setIsExpanded(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
      setIsExpanded(false);
    }
  };

  const quickSearches = [
    { label: 'London Properties', query: 'London' },
    { label: 'Manchester Area', query: 'Manchester' },
    { label: 'Birmingham', query: 'Birmingham' },
    { label: 'Leeds', query: 'Leeds' },
    { label: 'Liverpool', query: 'Liverpool' },
    { label: 'Bristol', query: 'Bristol' },
  ];

  return (
    <div ref={searchRef} className="relative w-full">
      <AnimatePresence>
        {!isExpanded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
          >
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl px-4 py-4 text-left text-gray-500 hover:bg-white hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <span className="text-sm">Search properties...</span>
              </div>
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-0 left-0 right-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200"
          >
            <form onSubmit={handleSubmit} className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Search Suggestions */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Popular Searches
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {quickSearches.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleSearch(item.query)}
                      className="flex items-center gap-2 px-3 py-2 text-xs bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg transition-all duration-200"
                    >
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Features */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <TrendingUp className="w-3 h-3" />
                  <span>Get market insights & BMV scores</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Building2 className="w-3 h-3" />
                  <span>Access UK Land Registry data</span>
                </div>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                disabled={!searchTerm.trim() || isLoading}
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {isLoading ? 'Searching...' : 'Search Properties'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 