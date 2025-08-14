'use client';

import { useState } from 'react';

interface EPCData {
  address: string;
  postcode: string;
  epcRating: string;
  epcScore: number;
  epcDate: string;
  propertyType: string;
  tenure: string;
  constructionYear: number;
  totalFloorArea: number;
  environmentalRating: string;
  potentialRating: string;
  potentialScore: number;
  heatingCost: number;
  lightingCost: number;
  hotWaterCost: number;
  totalCost: number;
  co2Rating: string;
  co2Emissions: number;
}

interface EPCResponse {
  success: boolean;
  data?: {
    bestMatch: EPCData;
    allResults: EPCData[];
    totalResults: number;
    epcAnalysis: {
      rating: string;
      score: number;
      valueImpact: number;
      energyEfficiency: string;
      recommendations: string[];
    };
    propertyDetails: {
      type: string;
      tenure: string;
      constructionYear: number;
      floorArea: number;
      environmentalRating: string;
    };
    energyCosts: {
      heating: number;
      lighting: number;
      hotWater: number;
      total: number;
    };
    environmentalImpact: {
      co2Rating: string;
      co2Emissions: number;
    };
  };
  error?: string;
  message?: string;
  setupInstructions?: string[];
}

export default function EPCTestPage() {
  const [postcode, setPostcode] = useState('');
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [epcData, setEpcData] = useState<EPCResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEpcData(null);

    try {
      const params = new URLSearchParams({ postcode });
      if (number) params.append('number', number);

      const response = await fetch(`/api/epc-data?${params.toString()}`);
      const data = await response.json();
      
      setEpcData(data);
      
      if (!data.success) {
        setError(data.error || 'Failed to fetch EPC data');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('EPC API error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEPCRatingColor = (rating: string) => {
    const colors: { [key: string]: string } = {
      'A': 'bg-green-100 text-green-800 border-green-200',
      'B': 'bg-blue-100 text-blue-800 border-blue-200',
      'C': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'D': 'bg-orange-100 text-orange-800 border-orange-200',
      'E': 'bg-red-100 text-red-800 border-red-200',
      'F': 'bg-red-200 text-red-900 border-red-300',
      'G': 'bg-red-300 text-red-950 border-red-400'
    };
    return colors[rating] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getValueImpactColor = (impact: number) => {
    if (impact > 1.0) return 'text-green-600';
    if (impact < 1.0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">EPC Data Test Page</h1>
        <p className="text-gray-600">
          Test the EPC (Energy Performance Certificate) API integration with real data from the EPC Register
        </p>
      </div>

      {/* Setup Instructions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-blue-600 mb-4 flex items-center gap-2">
          <span className="text-2xl">ℹ️</span>
          Setup Instructions
        </h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>To get real EPC data, you need to configure EPC API credentials:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Register at <a href="https://epc.opendatacommunities.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">EPC Open Data Communities</a></li>
            <li>Add your API key to <code className="bg-gray-100 px-1 rounded">.env.local</code> as <code className="bg-gray-100 px-1 rounded">EPC_API_KEY</code></li>
            <li>Or use username/password: <code className="bg-gray-100 px-1 rounded">EPC_API_USERNAME</code> and <code className="bg-gray-100 px-1 rounded">EPC_API_PASSWORD</code></li>
            <li>Restart the application</li>
          </ol>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Search for EPC Data</h2>
        <p className="text-gray-600 mb-4">
          Enter a postcode and optionally a house number to fetch EPC data
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">Postcode *</label>
              <input
                id="postcode"
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g., NE5 4PR"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">House Number/Name (Optional)</label>
              <input
                id="number"
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="e.g., 21"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Fetching EPC Data...' : 'Search EPC Data'}
          </button>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <span className="text-red-600 text-xl mr-2">❌</span>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* EPC Data Display */}
      {epcData?.success && epcData.data && (
        <div className="space-y-6">
          {/* Best Match Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-green-600 mb-4 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              Best Match: {epcData.data.bestMatch.address}
            </h2>
            <p className="text-gray-600 mb-4">
              {epcData.data.bestMatch.postcode} • {epcData.data.totalResults} properties found
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">EPC Rating</div>
                <span className={`inline-block text-lg px-4 py-2 rounded-full border ${getEPCRatingColor(epcData.data.bestMatch.epcRating)}`}>
                  {epcData.data.bestMatch.epcRating}
                </span>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">Energy Score</div>
                <div className="text-3xl font-bold text-blue-600">
                  {epcData.data.bestMatch.epcScore}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">Value Impact</div>
                <div className={`text-3xl font-bold ${getValueImpactColor(epcData.data.epcAnalysis.valueImpact)}`}>
                  {((epcData.data.epcAnalysis.valueImpact - 1) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Property Type</label>
                <p className="text-lg">{epcData.data.propertyDetails.type || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tenure</label>
                <p className="text-lg">{epcData.data.propertyDetails.tenure || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Construction Year</label>
                <p className="text-lg">{epcData.data.propertyDetails.constructionYear || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Floor Area</label>
                <p className="text-lg">{epcData.data.propertyDetails.floorArea ? `${epcData.data.propertyDetails.floorArea} m²` : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Energy Costs */}
          {epcData.data.energyCosts.total && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Estimated Annual Energy Costs</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Heating</div>
                  <div className="text-xl font-bold">£{epcData.data.energyCosts.heating}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Lighting</div>
                  <div className="text-xl font-bold">£{epcData.data.energyCosts.lighting}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Hot Water</div>
                  <div className="text-xl font-bold">£{epcData.data.energyCosts.hotWater}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="text-2xl font-bold text-red-600">£{epcData.data.energyCosts.total}</div>
                </div>
              </div>
            </div>
          )}

          {/* EPC Analysis */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">EPC Analysis & Recommendations</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Energy Efficiency</label>
                <p className="text-lg font-semibold">{epcData.data.epcAnalysis.energyEfficiency}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Recommendations</label>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {epcData.data.epcAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-700">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* All Results */}
          {epcData.data.allResults.length > 1 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">All Properties Found ({epcData.data.totalResults})</h2>
              <p className="text-gray-600 mb-4">Showing top 10 results</p>
              <div className="space-y-2">
                {epcData.data.allResults.slice(0, 10).map((property, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{property.address}</div>
                      <div className="text-sm text-gray-500">{property.postcode}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-1 rounded-full border text-sm ${getEPCRatingColor(property.epcRating)}`}>
                        {property.epcRating}
                      </span>
                      <span className="text-sm text-gray-600">{property.epcScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Credentials Warning */}
      {epcData?.error === 'EPC API credentials not configured' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            API Credentials Required
          </h2>
          <div className="space-y-3">
            <p className="text-yellow-700">{epcData.message}</p>
            {epcData.setupInstructions && (
              <div>
                <p className="font-medium text-yellow-800 mb-2">Setup Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-yellow-700">
                  {epcData.setupInstructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
