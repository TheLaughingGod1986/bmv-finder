'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/useToast';

interface WatchlistItem {
  id: string;
  address: string;
  house_number?: string;
  street?: string;
  postcode: string;
  town?: string;
  county?: string;
  property_type?: string;
  price: number;
  notes?: string;
  status?: string;
  source?: string;
  date_added?: string;
  last_updated?: string;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist');
      if (response.ok) {
        const data = await response.json();
        console.log('Watchlist API response:', data);
        if (data.success && Array.isArray(data.data)) {
          setWatchlist(data.data);
          setError(null);
        } else {
          console.warn('Invalid watchlist data format:', data);
          setWatchlist([]);
          const errorMsg = 'Invalid watchlist data format';
          setError(errorMsg);
          showError(errorMsg);
        }
      } else {
        const errorMsg = 'Failed to load watchlist';
        setError(errorMsg);
        showError(errorMsg);
        setWatchlist([]);
      }
    } catch (err) {
      console.error('Error loading watchlist:', err);
      const errorMsg = 'Error loading watchlist';
      setError(errorMsg);
      showError(errorMsg);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading watchlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Property Watchlist</h1>
          <p className="text-gray-600 mt-2">
            Track and analyze your potential investment properties
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
              <p><strong>Debug Info:</strong></p>
              <p>Watchlist type: {typeof watchlist}</p>
              <p>Watchlist length: {Array.isArray(watchlist) ? watchlist.length : 'N/A'}</p>
              <p>Watchlist data: {JSON.stringify(watchlist, null, 2)}</p>
            </div>
          )}
                  </div>

        {error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-red-900 mb-2">
              Error Loading Watchlist
            </h3>
            <p className="text-red-600 mb-6">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : !Array.isArray(watchlist) || watchlist.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No properties in your watchlist
            </h3>
            <p className="text-gray-600 mb-6">
              Start by adding properties to your watchlist to track them
            </p>
              <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
              Go Back
              </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(watchlist) && watchlist
              .filter(property => property.address && property.price)
              .map((property) => {
              return (
                <motion.div
                  key={property.id || `property-${Math.random()}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {property.house_number && property.street 
                      ? `${property.house_number} ${property.street}`
                      : property.address}
                </h3>
                  <p className="text-2xl font-bold text-blue-600 mb-4">
                    {formatPrice(property.price)}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    {property.property_type && (
                      <span>{property.property_type}</span>
                    )}
                    {property.town && (
                      <span>{property.town}</span>
                    )}
                    <span>{property.postcode}</span>
                          </div>
              
                  <div className="text-sm text-gray-500">
                    {property.source && <p>Source: {property.source}</p>}
                    {property.status && <p>Status: {property.status}</p>}
                    {property.notes && <p>Notes: {property.notes}</p>}
                          </div>
                          </div>
                </motion.div>
              );
            })}
                          </div>
                        )}
                          </div>
                          </div>
                );
}
