'use client';

import { useState } from 'react';

interface SoldPrice {
  id: string;
  price: number;
  date_of_transfer: string;
  postcode: string;
  property_type: string;
  street: string;
  town_city: string;
  county: string;
  paon: string;
  saon: string;
  duration: string;
  old_new: string;
}

export default function Home() {
  const [postcode, setPostcode] = useState('');
  const [soldPrices, setSoldPrices] = useState<SoldPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const handleScan = async () => {
    setIsLoading(true);
    setError(null);
    setSoldPrices([]);
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcode }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch sold prices');
      }
      setSoldPrices(data.data.soldPrices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateData = async () => {
    setIsUpdating(true);
    setUpdateMsg(null);
    try {
      const response = await fetch('/api/update-land-registry', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to update data');
      }
      setUpdateMsg(data.message || 'Land Registry data updated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setUpdateMsg(`Failed to update data: ${errorMessage}`);
      console.error('Update error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatPropertyType = (type: string) => {
    const types: { [key: string]: string } = {
      'D': 'Detached',
      'S': 'Semi-detached', 
      'T': 'Terraced',
      'F': 'Flat/Maisonette',
      'O': 'Other'
    };
    return types[type] || type;
  };

  const formatDuration = (duration: string) => {
    return duration === 'F' ? 'Freehold' : duration === 'L' ? 'Leasehold' : duration;
  };

  const formatOldNew = (oldNew: string) => {
    return oldNew === 'Y' ? 'New Build' : oldNew === 'N' ? 'Existing' : oldNew;
  };

  const formatAddress = (property: SoldPrice) => {
    const parts = [property.paon, property.saon, property.street].filter(Boolean);
    return parts.join(' ');
  };

  const formatPrice = (price: number) => {
    return price ? `£${price.toLocaleString()}` : 'N/A';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Sold Property Prices
                </h1>
                <p className="text-sm text-gray-600">UK Land Registry Data</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="mb-4">
            <label htmlFor="postcode" className="block text-sm font-semibold text-gray-700 mb-2">
              Enter UK Postcode
            </label>
            <div className="flex gap-2">
              <input
                id="postcode"
                type="text"
                value={postcode}
                onChange={e => setPostcode(e.target.value.toUpperCase())}
                placeholder="e.g., SW1A 1AA"
                className="flex-1 px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 border-gray-300 text-gray-900 bg-white shadow-sm transition-all duration-200 placeholder-gray-400"
                disabled={isLoading}
              />
              <button
                onClick={handleScan}
                disabled={!postcode || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                {isLoading ? 'Loading...' : 'Get Sold Prices'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={handleUpdateData}
              disabled={isUpdating}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg font-semibold text-sm shadow-md hover:from-green-600 hover:to-green-800 transition-all duration-200"
            >
              {isUpdating ? 'Updating...' : 'Update Land Registry Data'}
            </button>
            {updateMsg && <span className="text-sm ml-2 text-gray-700">{updateMsg}</span>}
          </div>
          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              {error}
            </div>
          )}
        </div>
        {soldPrices.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Recent Sold Prices for {postcode}</h2>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {soldPrices.map((sp, idx) => (
                    <tr key={sp.id || idx} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{formatAddress(sp)}</div>
                          <div className="text-sm text-gray-500">{sp.postcode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {formatPropertyType(sp.property_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatDuration(sp.duration)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sp.old_new === 'Y' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formatOldNew(sp.old_new)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{sp.date_of_transfer}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{formatPrice(sp.price)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {soldPrices.map((sp, idx) => (
                <div key={sp.id || idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">{formatAddress(sp)}</h3>
                      <p className="text-xs text-gray-600">{sp.postcode}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{formatPrice(sp.price)}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-1 font-medium">{formatPropertyType(sp.property_type)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <span className="ml-1 font-medium">{formatDuration(sp.duration)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-1 font-medium">{formatOldNew(sp.old_new)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-1 font-medium">{sp.date_of_transfer}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {soldPrices.length === 0 && !isLoading && !error && (
          <div className="text-center text-gray-500 mt-12">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No Sold Prices Found</h3>
            <p>Enter a valid UK postcode to see recent sold property prices.</p>
          </div>
        )}
      </main>
    </div>
  );
}
