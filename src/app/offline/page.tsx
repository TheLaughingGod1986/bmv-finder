'use client';

import { useState, useEffect } from 'react';
import { getPWAManager } from '@/lib/pwa/pwaManager';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const pwaManager = getPWAManager();
    
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setRetryCount(0);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    pwaManager.on('online', handleOnline);
    pwaManager.on('offline', handleOffline);

    return () => {
      pwaManager.off('online', handleOnline);
      pwaManager.off('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  if (isOnline) {
    // Redirect to home if online
    window.location.href = '/';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
          </svg>
        </div>

        {/* Offline Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>
        <p className="text-gray-600 mb-8">
          It looks like you're not connected to the internet. Don't worry, you can still access some features while offline.
        </p>

        {/* Offline Features */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Available Offline
          </h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span className="text-gray-700">View cached properties</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span className="text-gray-700">Access your portfolio</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span className="text-gray-700">View saved searches</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm">!</span>
              </div>
              <span className="text-gray-700">New searches (queued for sync)</span>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-blue-800 font-medium">No Internet Connection</span>
          </div>
          <p className="text-blue-700 text-sm mt-2">
            We'll automatically reconnect when your connection is restored.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {retryCount > 0 ? `Retry (${retryCount})` : 'Try Again'}
          </button>
          <button
            onClick={handleGoHome}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Go to Homepage
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            If you continue to have connection issues, please check your internet connection or try again later.
          </p>
        </div>
      </div>
    </div>
  );
}
