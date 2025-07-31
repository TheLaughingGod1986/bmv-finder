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
  const [isLoading, setIsLoading] = useState(true);
  
  // Always call useUser hook (Rules of Hooks requirement)
  const user = useUser();

  // Load search count from localStorage on mount
  useEffect(() => {
    try {
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
    } catch (error) {
      console.warn('Error loading search count:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const incrementSearchCount = () => {
    try {
      if (!user) {
        const newCount = searchCount + 1;
        setSearchCount(newCount);
        if (typeof window !== 'undefined') {
          localStorage.setItem('anonymous_search_count', newCount.toString());
        }
        setIsLimitReached(newCount >= SEARCH_LIMIT);
      }
    } catch (error) {
      console.warn('Error incrementing search count:', error);
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

  // Show loading state while initializing
  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <SearchLimitContext.Provider value={value}>
      {children}
    </SearchLimitContext.Provider>
  );
}

export function useSearchLimit() {
  const context = useContext(SearchLimitContext);
  if (context === undefined) {
    // Return a default context instead of throwing an error
    console.warn('useSearchLimit must be used within a SearchLimitProvider, returning default values');
    return {
      searchCount: 0,
      isLimitReached: false,
      incrementSearchCount: () => {},
      canSearch: () => true,
      SEARCH_LIMIT: 5
    };
  }
  return context;
} 