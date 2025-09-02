'use client';

import { useState, useEffect } from 'react';

interface WatchlistProperty {
  id: string;
  title: string;
  address: string;
  postcode: string;
  price: number;
  priceFormatted: string;
  bedrooms?: number;
  bathrooms?: number;
  propertyType: string;
  listingType: 'sale' | 'rent';
  imageUrl?: string;
  bmvScore?: number;
  marketValue?: number;
  potentialProfit?: number;
  addedAt: string;
  source: 'chrome-extension' | 'manual' | 'api';
  metadata?: {
    website?: string;
    agent?: string;
  };
}

interface PropertyComparisonProps {
  selectedProperties: WatchlistProperty[];
  onClose: () => void;
}

export default function PropertyComparison({ selectedProperties, onClose }: PropertyComparisonProps) {
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedProperties.length > 0) {
      loadComparisonData();
    }
  }, [selectedProperties]);

  const loadComparisonData = async () => {
    setIsLoading(true);
    
    try {
      // Simulate loading comparison data (BMV scores, market values, etc.)
      const data = selectedProperties.map(property => ({
        ...property,
        bmvScore: Math.floor(Math.random() * 100),
        marketValue: Math.floor(property.price * (0.8 + Math.random() * 0.4)),
        potentialProfit: Math.floor(property.price * (0.1 + Math.random() * 0.2)),
        rentalYield: Math.floor((Math.random() * 8 + 2) * 100) / 100,
        pricePerSqft: Math.floor(property.price / (property.bedrooms ? property.bedrooms * 200 : 1000)),
        daysOnMarket: Math.floor(Math.random() * 90),
        priceChange: Math.floor((Math.random() - 0.5) * 20000)
      }));

      setComparisonData(data);
    } catch (error) {
      console.error('Failed to load comparison data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBMVScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getBMVScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (selectedProperties.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Properties Selected</h2>
            <p className="text-gray-600 mb-4">
              Select at least 2 properties from your watchlist to compare them.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Property Comparison</h2>
            <p className="text-gray-600">
              Comparing {selectedProperties.length} properties
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="p-6">
              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-4 font-semibold text-gray-900">Property</th>
                      {comparisonData.map((property, index) => (
                        <th key={property.id} className="text-center p-4 font-semibold text-gray-900 min-w-[200px]">
                          <div className="space-y-2">
                            {property.imageUrl ? (
                              <img
                                src={property.imageUrl}
                                alt={property.title}
                                className="w-full h-24 object-cover rounded-lg mx-auto"
                              />
                            ) : (
                              <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center mx-auto">
                                <span className="text-gray-400 text-2xl">🏠</span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-sm">{property.title}</div>
                              <div className="text-xs text-gray-600">{property.address}</div>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Price */}
                    <tr className="border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-900">Price</td>
                      {comparisonData.map((property) => (
                        <td key={property.id} className="p-4 text-center">
                          <div className="text-lg font-bold text-gray-900">{property.priceFormatted}</div>
                        </td>
                      ))}
                    </tr>

                    {/* BMV Score */}
                    <tr className="border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-900">BMV Score</td>
                      {comparisonData.map((property) => (
                        <td key={property.id} className="p-4 text-center">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getBMVScoreColor(property.bmvScore || 0)}`}>
                            {property.bmvScore || 0}% - {getBMVScoreLabel(property.bmvScore || 0)}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Market Value */}
                    <tr className="border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-900">Market Value</td>
                      {comparisonData.map((property) => (
                        <td key={property.id} className="p-4 text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(property.marketValue || 0)}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Potential Profit */}
                    <tr className="border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-900">Potential Profit</td>
                      {comparisonData.map((property) => (
                        <td key={property.id} className="p-4 text-center">
                          <div className={`text-sm font-medium ${
                            (property.potentialProfit || 0) > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(property.potentialProfit || 0)}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Rental Yield */}
                    <tr className="border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-900">Rental Yield</td>
                      {comparisonData.map((property) => (
                        <td key={property.id} className="p-4 text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {property.rentalYield || 0}%
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Price per Sq Ft */}
                    <tr className="border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-900">Price per Sq Ft</td>
                      {comparisonData.map((property) => (
                        <td key={property.id} className="p-4 text-center">
                          <div className="text-sm font-medium text-gray-900">
                            £{property.pricePerSqft || 0}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Bedrooms */}
                    <tr className="border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-900">Bedrooms</td>
                      {comparisonData.map((property) => (
                        <td key={property.id} className="p-4 text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {property.bedrooms || 'N/A'}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Bathrooms */}
                    <tr className="border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-900">Bathrooms</td>
                      {comparisonData.map((property) => (
                        <td key={property.id} className="p-4 text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {property.bathrooms || 'N/A'}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Property Type */}
                    <tr className="border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-900">Property Type</td>
                      {comparisonData.map((property) => (
                        <td key={property.id} className="p-4 text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {property.propertyType}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Source */}
                    <tr className="border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-900">Source</td>
                      {comparisonData.map((property) => (
                        <td key={property.id} className="p-4 text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {property.source.replace('-', ' ')}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Days on Market */}
                    <tr className="border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-900">Days on Market</td>
                      {comparisonData.map((property) => (
                        <td key={property.id} className="p-4 text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {property.daysOnMarket || 0} days
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Price Change */}
                    <tr className="border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-900">Price Change</td>
                      {comparisonData.map((property) => (
                        <td key={property.id} className="p-4 text-center">
                          <div className={`text-sm font-medium ${
                            (property.priceChange || 0) > 0 ? 'text-green-600' : 
                            (property.priceChange || 0) < 0 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {formatCurrency(property.priceChange || 0)}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Actions */}
                    <tr>
                      <td className="p-4 font-medium text-gray-900">Actions</td>
                      {comparisonData.map((property) => (
                        <td key={property.id} className="p-4 text-center">
                          <div className="space-y-2">
                            <a
                              href={property.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              View Original
                            </a>
                            <button
                              onClick={() => {
                                // Add to favorites or perform other actions
                                console.log('Add to favorites:', property.id);
                              }}
                              className="block w-full px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                            >
                              Add to Favorites
                            </button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Best BMV Score</h3>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.max(...comparisonData.map(p => p.bmvScore || 0))}%
                  </div>
                  <p className="text-blue-800 text-sm">
                    {comparisonData.find(p => p.bmvScore === Math.max(...comparisonData.map(p => p.bmvScore || 0)))?.title}
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Highest Potential Profit</h3>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(Math.max(...comparisonData.map(p => p.potentialProfit || 0)))}
                  </div>
                  <p className="text-green-800 text-sm">
                    {comparisonData.find(p => p.potentialProfit === Math.max(...comparisonData.map(p => p.potentialProfit || 0)))?.title}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">Best Rental Yield</h3>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.max(...comparisonData.map(p => p.rentalYield || 0))}%
                  </div>
                  <p className="text-purple-800 text-sm">
                    {comparisonData.find(p => p.rentalYield === Math.max(...comparisonData.map(p => p.rentalYield || 0)))?.title}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
