'use client';

import React, { useState } from 'react';
import AddressSearchInput from '../components/AddressSearchInput';
import { Card, CardContent, CardHeader, CardTitle } from '../components/SimpleCard';

interface AddressSuggestion {
  address: string;
  postcode: string;
  number: string;
  street: string;
  display: string;
}

export default function TestAddressSearchPage() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleAddressSelect = (address: AddressSuggestion) => {
    setSelectedAddress(address);
    setSearchHistory(prev => [address.display, ...prev.slice(0, 4)]);
  };

  const handleSearch = (query: string) => {
    setSearchHistory(prev => [query, ...prev.slice(0, 4)]);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 text-primary-700">Address Search Test</h1>
        <p className="text-lg text-gray-600">
          Test the enhanced address search functionality with postcode input and address dropdown selection.
        </p>
      </div>

      <div className="space-y-8">
        {/* Search Input */}
        <Card className="border-2 border-primary-100">
          <CardHeader>
            <CardTitle className="text-primary-700">Enhanced Address Search</CardTitle>
            <p className="text-sm text-gray-600">
              Start typing a postcode or address to see suggestions and select from the dropdown.
            </p>
          </CardHeader>
          <CardContent>
            <AddressSearchInput
              value={searchValue}
              onChange={setSearchValue}
              onAddressSelect={handleAddressSelect}
              onSearch={handleSearch}
              placeholder="Try typing 'NE5' or 'SW1A' or any address..."
              showHistory={true}
              showSuggestions={true}
              debounceMs={300}
              minSearchLength={2}
              className="mb-4"
            />
            
            <div className="text-sm text-gray-500">
              <p>Features:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Auto-formats postcodes as you type</li>
                <li>Shows address suggestions with house numbers</li>
                <li>Displays postcode suggestions</li>
                <li>Remembers search history</li>
                <li>Auto-fills house number when address is selected</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Selected Address Display */}
        {selectedAddress && (
          <Card className="border-2 border-green-100 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-700">Selected Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div><strong>Full Address:</strong> {selectedAddress.display}</div>
                <div><strong>House Number:</strong> {selectedAddress.number}</div>
                <div><strong>Street:</strong> {selectedAddress.street}</div>
                <div><strong>Postcode:</strong> {selectedAddress.postcode}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <Card className="border-2 border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-700">Recent Searches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {searchHistory.map((search, index) => (
                  <div key={index} className="p-2 bg-blue-50 rounded border">
                    {search}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="border-2 border-gray-100">
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">1. Postcode Search</h4>
                <p className="text-sm text-gray-600">Try typing &quot;NE5&quot; to see postcode suggestions and addresses in that area.</p>
              </div>
              <div>
                <h4 className="font-semibold">2. Address Search</h4>
                <p className="text-sm text-gray-600">Try typing &quot;SW1A&quot; to see addresses in Westminster area.</p>
              </div>
              <div>
                <h4 className="font-semibold">3. Street Search</h4>
                <p className="text-sm text-gray-600">Try typing a street name to see matching addresses.</p>
              </div>
              <div>
                <h4 className="font-semibold">4. Auto-formatting</h4>
                <p className="text-sm text-gray-600">Type &quot;NE52PR&quot; and watch it auto-format to &quot;NE5 2PR&quot;.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 