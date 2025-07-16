'use client';

import { useState } from 'react';

interface Property {
  guid: string;
  address: string;
  postcode: string;
  price: number;
  date: string;
  property_type: string;
  property_type_label: string;
  epc_bedrooms?: number;
  epc_size?: number;
  epc_rating?: string;
  has_epc: boolean;
  energy_efficient: boolean;
  hpi_value?: number;
  hpi_region?: string;
  has_hpi: boolean;
  price_range: string;
}

export default function TestEnhancedSearch() {
  const [searchParams, setSearchParams] = useState({
    postcode: '',
    number: '',
    street: '',
    property_type: '',
    price_min: '',
    price_max: '',
    epc_rating: '',
    bedrooms: '',
    has_epc: false,
    energy_efficient: false
  });
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value.toString());
        }
      });
      params.append('size', '10');

      const response = await fetch(`/api/search/enhanced?${params}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        setTotal(data.total);
      } else {
        console.error('Search failed:', data.error);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedSearch = async () => {
    setLoading(true);
    try {
      const searchData = {
        query: searchParams.street || searchParams.postcode,
        filters: {
          price_min: searchParams.price_min ? parseInt(searchParams.price_min) : undefined,
          price_max: searchParams.price_max ? parseInt(searchParams.price_max) : undefined,
          property_type: searchParams.property_type || undefined,
          epc_rating: searchParams.epc_rating || undefined,
          bedrooms: searchParams.bedrooms ? parseInt(searchParams.bedrooms) : undefined,
          has_epc: searchParams.has_epc,
          energy_efficient: searchParams.energy_efficient
        },
        size: 10
      };

      const response = await fetch('/api/search/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
      });
      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        setTotal(data.total);
      } else {
        console.error('Advanced search failed:', data.error);
      }
    } catch (error) {
      console.error('Advanced search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Enhanced Property Search Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Search Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Postcode</label>
              <input
                type="text"
                value={searchParams.postcode}
                onChange={(e) => setSearchParams({...searchParams, postcode: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., BH1 4HF"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Property Number</label>
              <input
                type="text"
                value={searchParams.number}
                onChange={(e) => setSearchParams({...searchParams, number: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., 5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Street</label>
              <input
                type="text"
                value={searchParams.street}
                onChange={(e) => setSearchParams({...searchParams, street: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., AYLESBURY ROAD"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Property Type</label>
              <select
                value={searchParams.property_type}
                onChange={(e) => setSearchParams({...searchParams, property_type: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="">Any</option>
                <option value="D">Detached</option>
                <option value="S">Semi-detached</option>
                <option value="T">Terraced</option>
                <option value="F">Flat/Maisonette</option>
                <option value="O">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Min Price</label>
                <input
                  type="number"
                  value={searchParams.price_min}
                  onChange={(e) => setSearchParams({...searchParams, price_min: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="100000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Price</label>
                <input
                  type="number"
                  value={searchParams.price_max}
                  onChange={(e) => setSearchParams({...searchParams, price_max: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="500000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">EPC Rating</label>
              <select
                value={searchParams.epc_rating}
                onChange={(e) => setSearchParams({...searchParams, epc_rating: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="">Any</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="G">G</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bedrooms</label>
              <input
                type="number"
                value={searchParams.bedrooms}
                onChange={(e) => setSearchParams({...searchParams, bedrooms: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="3"
                min="1"
                max="10"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchParams.has_epc}
                  onChange={(e) => setSearchParams({...searchParams, has_epc: e.target.checked})}
                  className="mr-2"
                />
                Has EPC Data
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchParams.energy_efficient}
                  onChange={(e) => setSearchParams({...searchParams, energy_efficient: e.target.checked})}
                  className="mr-2"
                />
                Energy Efficient (A-C)
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Search Actions</h2>
          
          <div className="space-y-4">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Basic Search'}
            </button>

            <button
              onClick={handleAdvancedSearch}
              disabled={loading}
              className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Advanced Search'}
            </button>

            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold mb-2">Search Results</h3>
              <p>Total: {total.toLocaleString()} properties</p>
              <p>Showing: {results.length} results</p>
            </div>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold p-6 border-b">Search Results</h2>
          <div className="divide-y">
            {results.map((property, index) => (
              <div key={property.guid} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{property.address}</h3>
                    <p className="text-gray-600">{property.postcode}</p>
                    <p className="text-sm text-gray-500">{property.date}</p>
                  </div>
                  
                  <div>
                    <p className="text-2xl font-bold text-green-600">£{property.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{property.price_range}</p>
                    <p className="text-sm">{property.property_type_label}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">EPC Data</h4>
                    {property.has_epc ? (
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Rating:</span> 
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${
                            property.energy_efficient ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {property.epc_rating}
                          </span>
                        </p>
                        {property.epc_bedrooms && (
                          <p className="text-sm"><span className="font-medium">Bedrooms:</span> {property.epc_bedrooms}</p>
                        )}
                        {property.epc_size && (
                          <p className="text-sm"><span className="font-medium">Size:</span> {property.epc_size}m²</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No EPC data</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">HPI Data</h4>
                    {property.has_hpi ? (
                      <div className="space-y-1">
                        <p className="text-sm"><span className="font-medium">HPI Value:</span> {property.hpi_value}</p>
                        <p className="text-sm"><span className="font-medium">Region:</span> {property.hpi_region}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No HPI data</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 