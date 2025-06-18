'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { BMVCalculation } from '@/types';
import { MapPin, TrendingUp, Home } from 'lucide-react';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

interface MapViewProps {
  properties: BMVCalculation[];
}

export default function MapView({ properties }: MapViewProps) {
  const [selectedProperty, setSelectedProperty] = useState<BMVCalculation | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getBMVColor = (percentage: number) => {
    if (percentage >= 15) return 'text-green-600';
    if (percentage >= 10) return 'text-yellow-600';
    if (percentage >= 5) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Map */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="h-96">
          <MapComponent 
            properties={properties}
            onPropertySelect={setSelectedProperty}
          />
        </div>
      </div>

      {/* Property List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Properties on Map ({properties.length})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((bmv) => (
            <div
              key={bmv.property.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedProperty?.property.id === bmv.property.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedProperty(bmv)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <img
                    src={bmv.property.imageUrl}
                    alt={bmv.property.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm truncate">
                    {bmv.property.title}
                  </h4>
                  <p className="text-xs text-gray-600 truncate">
                    {bmv.property.address}
                  </p>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-semibold">{formatPrice(bmv.property.price)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">BMV:</span>
                      <span className={`font-semibold ${getBMVColor(bmv.bmvPercentage)}`}>
                        {bmv.bmvPercentage > 0 ? '+' : ''}{bmv.bmvPercentage}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Yield:</span>
                      <span className="font-semibold text-blue-600">
                        {bmv.rentalYield}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Property Details */}
      {selectedProperty && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Property Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img
                src={selectedProperty.property.imageUrl}
                alt={selectedProperty.property.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-lg text-gray-900">
                  {selectedProperty.property.title}
                </h4>
                <p className="text-gray-600">{selectedProperty.property.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Asking Price</p>
                  <p className="font-bold text-lg">{formatPrice(selectedProperty.property.price)}</p>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">BMV Amount</p>
                  <p className="font-bold text-lg text-green-600">
                    +{formatPrice(selectedProperty.bmvAmount)}
                  </p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Rental Yield</p>
                  <p className="font-bold text-lg text-blue-600">
                    {selectedProperty.rentalYield}%
                  </p>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Est. Monthly Rent</p>
                  <p className="font-bold text-lg text-purple-600">
                    {formatPrice(selectedProperty.estimatedRent)}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  View Full Details
                </button>
                <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
                  Save Deal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 