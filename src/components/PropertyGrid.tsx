'use client';

import React from 'react';
import { BMVCalculation, BMVResult } from '@/types';
import { MapPin, Bed, TrendingUp, ExternalLink, Star, PoundSterling, Home, Sparkles, Globe } from 'lucide-react';

interface PropertyGridProps {
  properties: BMVResult[];
  nearbyProperties?: { postcode: string; properties: BMVResult[] }[];
  isLoading?: boolean;
  error?: string;
}

export default function PropertyGrid({ properties, nearbyProperties, isLoading, error }: PropertyGridProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Scanning properties...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold">Error</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="space-y-8">
        {/* No properties found message */}
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Properties Found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We couldn't find any properties in this area. This might be due to:
            </p>
            <ul className="text-gray-600 text-sm mt-2 space-y-1 max-w-md mx-auto">
              <li>• Limited property availability in this postcode</li>
              <li>• Properties outside our search criteria</li>
              <li>• Temporary data access limitations</li>
            </ul>
          </div>
        </div>

        {/* Try Larger Area Suggestion */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-blue-800 mb-2">Try Expanding Your Search</h4>
            <p className="text-blue-700 text-sm mb-4">
              No properties found in your current search area. Try increasing the search radius to find more properties in surrounding areas.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Try 3 Mile Radius
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Try 5 Mile Radius
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-3">
              Tip: Larger search areas may include properties from neighboring postcodes
            </p>
          </div>
        </div>

        {/* Development Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-lg font-semibold text-amber-800 mb-2">Development Status</h4>
              <p className="text-amber-700 text-sm leading-relaxed mb-3">
                This application is currently in development. The property scraping functionality is being built to handle modern anti-scraping measures from property websites like Rightmove, Zoopla, and OnTheMarket.
              </p>
              <div className="text-xs text-amber-600 space-y-1">
                <p><strong>Current Status:</strong> Scrapers are being developed to work with property websites</p>
                <p><strong>Challenge:</strong> Modern websites use sophisticated anti-bot measures</p>
                <p><strong>Solution:</strong> Implementing robust scraping methods or using official APIs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nearby Properties - Only show if we have real data */}
        {nearbyProperties && nearbyProperties.length > 0 && nearbyProperties.some(area => area.properties.length > 0) && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Properties in Nearby Areas</h2>
              <p className="text-gray-600">Here are some properties from surrounding postcodes:</p>
            </div>
            
            {nearbyProperties.map((area, areaIndex) => (
              <div key={areaIndex} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h3 className="text-xl font-semibold text-white">
                    Properties in {area.postcode}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {area.properties.length} properties found
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {area.properties.map((property, propertyIndex) => (
                    <div key={propertyIndex} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                      <div className="relative">
                        <img
                          src={property.property.imageUrl}
                          alt={property.property.title}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop';
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            {property.bmvPercentage > 0 ? `${property.bmvPercentage.toFixed(1)}% BMV` : 'Sample'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800 text-lg">
                            £{property.property.price.toLocaleString()}
                          </h4>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            {property.property.bedrooms} bed
                          </span>
                        </div>
                        
                        <h5 className="font-medium text-gray-700 mb-1">
                          {property.property.title}
                        </h5>
                        <p className="text-gray-600 text-sm mb-3">
                          {property.property.address}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-xs">
                            {property.property.propertyType}
                          </span>
                          <a
                            href={property.property.listingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View on Rightmove
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Found {properties.length} Properties
        </h2>
        <div className="text-sm text-gray-600">
          Sorted by BMV percentage
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property, index) => (
          <div key={property.property.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <div className="relative">
              <img
                src={property.property.imageUrl}
                alt={property.property.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop';
                }}
              />
              <div className="absolute top-2 right-2">
                <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  {property.bmvPercentage > 0 ? `${property.bmvPercentage.toFixed(1)}% BMV` : 'Sample'}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800 text-lg">
                  £{property.property.price.toLocaleString()}
                </h4>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                  {property.property.bedrooms} bed
                </span>
              </div>
              
              <h5 className="font-medium text-gray-700 mb-1">
                {property.property.title}
              </h5>
              <p className="text-gray-600 text-sm mb-3">
                {property.property.address}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">
                  {property.property.propertyType}
                </span>
                <a
                  href={property.property.listingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View on {property.property.source === 'rightmove' ? 'Rightmove' : 
                           property.property.source === 'zoopla' ? 'Zoopla' : 
                           property.property.source === 'onthemarket' ? 'OnTheMarket' : 'Original Site'}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 