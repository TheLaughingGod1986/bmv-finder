'use client';

import { useState } from 'react';
import { Search, Building2, TrendingUp, Target, Shield, Zap } from 'lucide-react';

interface PropertyDiscoveryProps {
  onPropertySelect?: (property: DiscoveredProperty | DiscoveredProperty[]) => void;
}

interface EPCUpgrade {
  currentRating: string;
  potentialRating: string;
  estimatedCost: number;
  annualSavings: number;
  [key: string]: unknown;
}

interface DiscoveredProperty {
  address: string;
  postcode: string;
  propertyType: string;
  bedrooms: number;
  floorArea: number;
  epcRating: string;
  lastSalePrice: number;
  lastSaleDate: string | null;
  currentValuation: number;
  capitalGrowth: number;
  recommendedRent: number;
  grossYield: number;
  marketPhase: string;
  portfolioFit: {
    diversification: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    investmentPotential: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  epcUpgrade: EPCUpgrade;
}

export default function PropertyDiscovery({ onPropertySelect }: PropertyDiscoveryProps) {
  const [postcode, setPostcode] = useState('');
  const [properties, setProperties] = useState<DiscoveredProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!postcode.trim()) return;

    setLoading(true);
    setError(null);
    setProperties([]);
    setSelectedProperties(new Set());

    try {
      const response = await fetch(`/api/portfolio/discover?postcode=${encodeURIComponent(postcode.trim())}`);
      const data = await response.json();

      if (data.success) {
        setProperties(data.data.properties);
      } else {
        setError(data.error || 'Failed to discover properties');
      }
    } catch (err) {
      setError('Failed to connect to discovery service');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySelect = (property: DiscoveredProperty) => {
    const newSelected = new Set(selectedProperties);
    if (newSelected.has(property.address)) {
      newSelected.delete(property.address);
    } else {
      newSelected.add(property.address);
    }
    setSelectedProperties(newSelected);
  };

  const handleAddToPortfolio = () => {
    const selectedPropertyList = properties.filter(p => selectedProperties.has(p.address));
    if (onPropertySelect && selectedPropertyList.length > 0) {
      onPropertySelect(selectedPropertyList);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'HIGH': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          Discover Properties
        </h2>
        <p className="text-gray-600 mb-4">
          Search by postcode to find properties in your area and add them to your portfolio
        </p>
        
        <div className="flex gap-3">
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="Enter postcode (e.g., NE5 4PR)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !postcode.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {properties.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Found {properties.length} properties in {postcode}
            </h3>
            {selectedProperties.size > 0 && (
              <button
                onClick={handleAddToPortfolio}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Add {selectedProperties.size} to Portfolio
              </button>
            )}
          </div>

          <div className="space-y-4">
            {properties.map((property, index) => (
              <div
                key={`${property.address}-${index}`}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedProperties.has(property.address)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handlePropertySelect(property)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedProperties.has(property.address)}
                        onChange={() => handlePropertySelect(property)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <h4 className="font-medium text-gray-900">{property.address}</h4>
                      <span className="text-sm text-gray-500">({property.postcode})</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{property.propertyType} • {property.bedrooms} beds</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span>EPC {property.epcRating}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span>£{property.currentValuation.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-gray-400" />
                        <span>£{property.recommendedRent}/month</span>
                      </div>
                    </div>

                    {/* Investment Metrics */}
                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">
                          {property.capitalGrowth > 0 ? '+' : ''}{property.capitalGrowth}%
                        </div>
                        <div className="text-gray-500">Growth</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{property.grossYield}%</div>
                        <div className="text-gray-500">Yield</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{property.portfolioFit.diversification}/100</div>
                        <div className="text-gray-500">Diversification</div>
                      </div>
                    </div>

                    {/* Portfolio Fit Indicators */}
                    <div className="mt-3 flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(property.portfolioFit.riskLevel)}`}>
                        Risk: {property.portfolioFit.riskLevel}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPotentialColor(property.portfolioFit.investmentPotential)}`}>
                        Potential: {property.portfolioFit.investmentPotential}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                        Market: {property.marketPhase}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Discovering properties...</p>
        </div>
      )}
    </div>
  );
}
