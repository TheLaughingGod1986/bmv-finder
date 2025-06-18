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
            <h2 className="text-xl font-bold mb-4 text-blue-800">Recent Sold Prices for {postcode}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-purple-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky top-0 z-10">Address</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky top-0 z-10">Postcode</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky top-0 z-10">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky top-0 z-10">Sold Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky top-0 z-10">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {soldPrices.map((sp, idx) => (
                    <tr key={sp.id || idx} className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50 transition' : 'bg-gray-50 hover:bg-blue-50 transition'}>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{formatAddress(sp)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{sp.postcode}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{sp.property_type}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{sp.date_of_transfer}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-blue-700">{formatPrice(sp.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
