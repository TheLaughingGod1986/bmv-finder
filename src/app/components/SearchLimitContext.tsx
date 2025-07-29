'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@supabase/auth-helpers-react';

interface SearchLimitContextType {
  searchCount: number;
  isLimitReached: boolean;
  incrementSearchCount: () => void;
  canSearch: () => boolean;
  SEARCH_LIMIT: number;
}

const SearchLimitContext = createContext<SearchLimitContextType | undefined>(undefined);

const SEARCH_LIMIT = 5;

export function SearchLimitProvider({ children }: { children: ReactNode }) {
  const [searchCount, setSearchCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const user = useUser();

  // Load search count from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !user) {
      const storedCount = localStorage.getItem('anonymous_search_count');
      const count = storedCount ? parseInt(storedCount, 10) : 0;
      setSearchCount(count);
      setIsLimitReached(count >= SEARCH_LIMIT);
    } else if (user) {
      // Reset for logged-in users
      setSearchCount(0);
      setIsLimitReached(false);
    }
  }, [user]);

  const incrementSearchCount = () => {
    if (!user) {
      const newCount = searchCount + 1;
      setSearchCount(newCount);
      localStorage.setItem('anonymous_search_count', newCount.toString());
      setIsLimitReached(newCount >= SEARCH_LIMIT);
    }
  };

  const canSearch = () => {
    return !!user || searchCount < SEARCH_LIMIT;
  };

  const value = {
    searchCount,
    isLimitReached,
    incrementSearchCount,
    canSearch,
    SEARCH_LIMIT
  };



  return (
    <SearchLimitContext.Provider value={value}>
      {children}
    </SearchLimitContext.Provider>
  );
}

export function useSearchLimit() {
  const context = useContext(SearchLimitContext);
  if (context === undefined) {
    throw new Error('useSearchLimit must be used within a SearchLimitProvider');
  }
  return context;
} 