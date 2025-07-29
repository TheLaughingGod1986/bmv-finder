'use client';

import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface SearchCounterProps {
  user: any;
  searchCount: number;
  SEARCH_LIMIT: number;
}

export default function SearchCounter({ 
  user, 
  searchCount, 
  SEARCH_LIMIT 
}: SearchCounterProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Don't render anything on server side
  }

  if (user || searchCount === 0) {
    return null; // Don't show for logged-in users or when no searches
  }

  return (
    <div className="mb-4 text-center">
      <div className="inline-flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
        <Lock className="w-4 h-4 text-blue-600 mr-2" />
        <span className="text-sm text-blue-700">
          Searches used: {searchCount}/{SEARCH_LIMIT}
        </span>
      </div>
    </div>
  );
} 