'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  WifiOff, 
  RefreshCw, 
  Home, 
  Search, 
  Heart,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);
    setLastOnline(new Date());

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    if (navigator.onLine) {
      router.push('/');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoToSearch = () => {
    router.push('/search/properties');
  };

  const handleGoToWatchlist = () => {
    router.push('/watchlist');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          {isOnline ? (
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <WifiOff className="w-10 h-10 text-red-600" />
            </div>
          )}
        </motion.div>

        {/* Status */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          {isOnline ? 'Back Online!' : 'You\'re Offline'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-6"
        >
          {isOnline 
            ? 'Your connection has been restored. You can now access all features.'
            : 'It looks like you\'re not connected to the internet. Some features may be limited.'
          }
        </motion.p>

        {/* Last Online Time */}
        {lastOnline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-6"
          >
            <Clock className="w-4 h-4" />
            <span>Last online: {lastOnline.toLocaleTimeString()}</span>
          </motion.div>
        )}

        {/* Retry Count */}
        {retryCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-500 mb-6"
          >
            Retry attempts: {retryCount}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          {isOnline ? (
            <button
              onClick={handleGoHome}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Go to Homepage</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleRetry}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Try Again</span>
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleGoToSearch}
                  className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
                
                <button
                  onClick={handleGoToWatchlist}
                  className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Heart className="w-4 h-4" />
                  <span>Watchlist</span>
                </button>
              </div>
            </>
          )}
        </motion.div>

        {/* Offline Features */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200"
          >
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-left">
                <h3 className="text-sm font-medium text-yellow-800 mb-1">
                  Offline Features Available
                </h3>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• View cached property data</li>
                  <li>• Access saved watchlist</li>
                  <li>• Use offline calculator</li>
                  <li>• View cached market data</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* PWA Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-xs text-gray-500"
        >
          <p>BMV Finder works offline with cached data</p>
          <p>Install the app for better offline experience</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
