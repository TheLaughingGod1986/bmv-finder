'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, MapPin, Calendar, PoundSterling, Home, TrendingUp, TrendingDown, Info, Building2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { apiClient } from '@/lib/apiClient';

export interface PropertyData {
  id: string;
  price: number;
  dateOfTransfer: string;
  postcode: string;
  propertyType: string;
  propertyTypeLabel: string;
  street: string;
  town_city: string;
  county: string;
  paon: string;
  saon: string;
  duration: string;
  durationLabel: string;
  locality: string;
  fullAddress: string;
  year: number;
  month: number;
  priceRange: string;
}

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyData | null;
}

export default function PropertyModal({ isOpen, onClose, property }: PropertyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [similarProperties, setSimilarProperties] = useState<PropertyData[]>([]);

  const fetchSimilarProperties = useCallback(async () => {
    if (!property) return;
    
    setIsLoading(true);
    try {
      const response = await apiClient.searchProperties(property.postcode, {
        page: 1,
        pageSize: 5
      });

      if (!response.error && response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray((response.data as { data: PropertyData[] }).data)) {
        // Filter out the current property and get similar ones
        const similar = (response.data as { data: PropertyData[] }).data
          .filter((p: PropertyData) => p.id !== property.id)
          .slice(0, 4);
        setSimilarProperties(similar);
      }
    } catch (error) {
      // Error fetching similar properties
    } finally {
      setIsLoading(false);
    }
  }, [property]);

  useEffect(() => {
    if (isOpen && property) {
      fetchSimilarProperties();
    }
  }, [isOpen, property, fetchSimilarProperties]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  if (!property) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Property Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Main Property Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {formatPrice(property.price)}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      Sold {formatDate(property.dateOfTransfer)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {property.priceRange}
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {[property.paon, property.street].filter(Boolean).join(' ')}
                      </p>
                      <p className="text-gray-600">
                        {property.town_city}
                      </p>
                      <p className="text-gray-500 font-mono">{property.postcode}</p>
                    </div>
                  </div>
                </div>

                {/* Property Details Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center space-x-2">
                    <Home className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">{property.propertyTypeLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Tenure</p>
                      <p className="font-medium">{property.durationLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Year</p>
                      <p className="font-medium">{property.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Month</p>
                      <p className="font-medium">{getMonthName(property.month)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Similar Properties */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Similar Properties in {property.postcode}
                </h4>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : similarProperties.length > 0 ? (
                  <div className="space-y-3">
                    {similarProperties.map((prop) => (
                      <div
                        key={prop.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          // You could implement navigation to this property
                          // Navigate to property
                        }}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {prop.paon && prop.saon ? `${prop.saon} ${prop.paon}` : prop.paon || prop.saon} {prop.street}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(prop.dateOfTransfer)} • {prop.propertyTypeLabel}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatPrice(prop.price)}
                          </p>
                          <p className="text-xs text-gray-500">{prop.priceRange}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No similar properties found
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 