'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchLimitWarningProps {
  user: any;
  searchCount: number;
  showLimitWarning: boolean;
  SEARCH_LIMIT: number;
}

export default function SearchLimitWarning({ 
  user, 
  searchCount, 
  showLimitWarning, 
  SEARCH_LIMIT 
}: SearchLimitWarningProps) {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Don't render anything on server side
  }

  if (user) {
    return null; // Don't show for logged-in users
  }

  return (
    <div className="mt-4 text-center">
      {searchCount > 0 && (
        <div className="text-sm text-gray-600 mb-2">
          {searchCount === SEARCH_LIMIT ? (
            <span className="text-red-600 font-medium">
              <Lock className="w-4 h-4 inline mr-1" />
              Search limit reached ({searchCount}/{SEARCH_LIMIT})
            </span>
          ) : (
            <span className="text-blue-600">
              Searches used: {searchCount}/{SEARCH_LIMIT}
            </span>
          )}
        </div>
      )}
      
      {showLimitWarning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Lock className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-800">
              Search Limit Reached
            </h3>
          </div>
          <p className="text-orange-700 text-sm mb-3">
            You&apos;ve used all {SEARCH_LIMIT} free searches. Sign up for a free account to get unlimited searches and continue researching properties.
          </p>
          <button
            onClick={() => {
              // Trigger the register popup by clicking the account button in navigation
              const accountButton = document.querySelector('[data-testid="account-button"]') as HTMLElement;
              const mobileAccountButton = document.querySelector('[data-testid="account-button-mobile"]') as HTMLElement;
              
              if (accountButton) {
                accountButton.click();
              } else if (mobileAccountButton) {
                mobileAccountButton.click();
              } else {
                // Fallback to navigation
                router.push('/account');
              }
            }}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Users className="w-4 h-4 mr-2" />
            Sign Up Now
          </button>
        </motion.div>
      )}
    </div>
  );
} 