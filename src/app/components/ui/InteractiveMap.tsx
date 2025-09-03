'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPinIcon, HomeIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface PropertyMarker {
  id: string;
  lat: number;
  lng: number;
  price: number;
  bmvScore: number;
  address: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  imageUrl?: string;
  dateOfTransfer: string;
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface InteractiveMapProps {
  properties: PropertyMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onPropertySelect?: (property: PropertyMarker) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  className?: string;
}

export default function InteractiveMap({
  properties,
  center = { lat: 51.5074, lng: -0.1278 }, // London default
  zoom = 12,
  onPropertySelect,
  onBoundsChange,
  className = ""
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyMarker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filteredProperties, setFilteredProperties] = useState(properties);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
  const [bmvThreshold, setBmvThreshold] = useState(70);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');

  useEffect(() => {
    setFilteredProperties(properties);
  }, [properties]);

  useEffect(() => {
    // Filter properties based on current filters
    const filtered = properties.filter(property => {
      const priceMatch = property.price >= priceRange[0] && property.price <= priceRange[1];
      const bmvMatch = property.bmvScore >= bmvThreshold;
      const typeMatch = propertyTypeFilter === 'all' || property.propertyType === propertyTypeFilter;
      
      return priceMatch && bmvMatch && typeMatch;
    });
    
    setFilteredProperties(filtered);
  }, [properties, priceRange, bmvThreshold, propertyTypeFilter]);

  const getMarkerColor = (bmvScore: number): string => {
    if (bmvScore >= 90) return 'bg-red-500';
    if (bmvScore >= 80) return 'bg-orange-500';
    if (bmvScore >= 70) return 'bg-yellow-500';
    if (bmvScore >= 60) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getMarkerSize = (price: number): string => {
    if (price >= 1000000) return 'w-6 h-6';
    if (price >= 500000) return 'w-5 h-5';
    if (price >= 250000) return 'w-4 h-4';
    return 'w-3 h-3';
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handlePropertyClick = (property: PropertyMarker) => {
    setSelectedProperty(property);
    onPropertySelect?.(property);
  };

  const propertyTypes = ['all', ...Array.from(new Set(properties.map(p => p.propertyType)))];

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapRef}
        className="w-full h-96 bg-gray-100 rounded-lg border border-gray-200 relative overflow-hidden"
      >
        {/* Mock Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPinIcon className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Interactive Map View</p>
            <p className="text-xs">Properties: {filteredProperties.length}</p>
          </div>
        </div>

        {/* Property Markers */}
        {filteredProperties.map((property) => (
          <div
            key={property.id}
            className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110 ${getMarkerColor(property.bmvScore)} ${getMarkerSize(property.price)} rounded-full border-2 border-white shadow-lg`}
            style={{
              left: `${((property.lng + 180) / 360) * 100}%`,
              top: `${((90 - property.lat) / 180) * 100}%`,
            }}
            onClick={() => handlePropertyClick(property)}
            title={`${property.address} - ${formatPrice(property.price)} (${property.bmvScore}% BMV)`}
          />
        ))}
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 space-y-4 min-w-64">
        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="2000000"
              step="25000"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <input
              type="range"
              min="0"
              max="2000000"
              step="25000"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* BMV Threshold Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            BMV Score: {bmvThreshold}%+
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={bmvThreshold}
            onChange={(e) => setBmvThreshold(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Property Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type
          </label>
          <select
            value={propertyTypeFilter}
            onChange={(e) => setPropertyTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {propertyTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">BMV Score Legend:</p>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">90%+ (Excellent)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-xs text-gray-600">80-89% (Very Good)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-xs text-gray-600">70-79% (Good)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">60-69% (Fair)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Below 60%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Property Details Panel */}
      {selectedProperty && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Property Details</h3>
            <button
              onClick={() => setSelectedProperty(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedProperty.address}</p>
              <p className="text-xs text-gray-500">{selectedProperty.propertyType}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(selectedProperty.price)}
              </span>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                selectedProperty.bmvScore >= 80 ? 'bg-green-100 text-green-800' :
                selectedProperty.bmvScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedProperty.bmvScore}% BMV
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              {selectedProperty.bedrooms && (
                <div className="flex items-center space-x-1">
                  <HomeIcon className="w-4 h-4 text-gray-400" />
                  <span>{selectedProperty.bedrooms} bed</span>
                </div>
              )}
              {selectedProperty.bathrooms && (
                <div className="flex items-center space-x-1">
                  <span className="text-gray-400">🛁</span>
                  <span>{selectedProperty.bathrooms} bath</span>
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              Sold: {new Date(selectedProperty.dateOfTransfer).toLocaleDateString()}
            </div>
            
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
              View Full Details
            </button>
          </div>
        </div>
      )}

      {/* Map Stats */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <MapPinIcon className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{filteredProperties.length} properties</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUpIcon className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">
              {filteredProperties.filter(p => p.bmvScore >= 80).length} high BMV
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
