'use client';

import { useState } from 'react';
import PropertyInputSelector from './PropertyInputSelector';

interface Property {
  id?: string;
  address: string;
  postcode: string;
  propertyType?: string;
  bedrooms?: number;
  floorArea?: number;
  lastSalePrice?: number;
  lastSaleDate?: string;
  epcRating?: string;
}

export default function PropertyInputSelectorDemo() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [inputProperty, setInputProperty] = useState<Property | null>(null);

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    console.log('Property selected:', property);
  };

  const handlePropertyInput = (property: Property) => {
    setInputProperty(property);
    console.log('Property input:', property);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Property Input Selector Demo</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          This demo shows how the PropertyInputSelector component can be used in different contexts 
          with different configurations. The component is fully reusable and can be customized to show 
          only the input methods you need.
        </p>
      </div>

      {/* Full Featured Demo */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Full Featured Version</h2>
        <p className="text-gray-600">All input methods enabled</p>
        <PropertyInputSelector
          onPropertySelect={handlePropertySelect}
          onPropertyInput={handlePropertyInput}
          title="Full Property Input"
          description="Choose from all available input methods"
          showManualInput={true}
          showPortfolio={true}
          showWatchlist={true}
          showPostcodeSearch={true}
        />
      </div>

      {/* Postcode Search Only Demo */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Postcode Search Only</h2>
        <p className="text-gray-600">Only postcode search enabled - useful for quick property lookups</p>
        <PropertyInputSelector
          onPropertySelect={handlePropertySelect}
          onPropertyInput={handlePropertyInput}
          title="Quick Property Search"
          description="Search for properties by postcode only"
          showManualInput={false}
          showPortfolio={false}
          showWatchlist={false}
          showPostcodeSearch={true}
        />
      </div>

      {/* Portfolio & Watchlist Only Demo */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Portfolio & Watchlist Only</h2>
        <p className="text-gray-600">Only portfolio and watchlist selection - useful for existing property analysis</p>
        <PropertyInputSelector
          onPropertySelect={handlePropertySelect}
          onPropertyInput={handlePropertyInput}
          title="Select Existing Property"
          description="Choose from your portfolio or watchlist"
          showManualInput={false}
          showPortfolio={true}
          showWatchlist={true}
          showPostcodeSearch={false}
        />
      </div>

      {/* Manual Input Only Demo */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Manual Input Only</h2>
        <p className="text-gray-600">Only manual property input - useful for adding new properties</p>
        <PropertyInputSelector
          onPropertySelect={handlePropertySelect}
          onPropertyInput={handlePropertyInput}
          title="Add New Property"
          description="Enter property details manually"
          showManualInput={true}
          showPortfolio={false}
          showWatchlist={false}
          showPostcodeSearch={false}
        />
      </div>

      {/* Results Display */}
      {(selectedProperty || inputProperty) && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Results</h2>
          
          {selectedProperty && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Selected Property</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Address:</strong> {selectedProperty.address}</p>
                  <p><strong>Postcode:</strong> {selectedProperty.postcode}</p>
                  <p><strong>Property Type:</strong> {selectedProperty.propertyType || 'N/A'}</p>
                  <p><strong>Bedrooms:</strong> {selectedProperty.bedrooms || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Floor Area:</strong> {selectedProperty.floorArea ? `${selectedProperty.floorArea}m²` : 'N/A'}</p>
                  <p><strong>Last Sold Price:</strong> {selectedProperty.lastSalePrice ? `£${selectedProperty.lastSalePrice.toLocaleString()}` : 'N/A'}</p>
                  <p><strong>Last Sold Date:</strong> {selectedProperty.lastSaleDate || 'N/A'}</p>
                  <p><strong>EPC Rating:</strong> {selectedProperty.epcRating || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {inputProperty && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Input Property</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Address:</strong> {inputProperty.address}</p>
                  <p><strong>Postcode:</strong> {inputProperty.postcode}</p>
                  <p><strong>Property Type:</strong> {inputProperty.propertyType || 'N/A'}</p>
                  <p><strong>Bedrooms:</strong> {inputProperty.bedrooms || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Floor Area:</strong> {inputProperty.floorArea ? `${inputProperty.floorArea}m²` : 'N/A'}</p>
                  <p><strong>Last Sold Price:</strong> {inputProperty.lastSalePrice ? `£${inputProperty.lastSalePrice.toLocaleString()}` : 'N/A'}</p>
                  <p><strong>Last Sold Date:</strong> {inputProperty.lastSaleDate || 'N/A'}</p>
                  <p><strong>EPC Rating:</strong> {inputProperty.epcRating || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Usage Examples */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Usage Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Deal Analysis</h3>
            <p className="text-sm text-gray-600 mb-3">
              Use in deal analysis pages to let users quickly select properties for analysis
            </p>
            <code className="text-xs bg-gray-200 p-2 rounded block">
              {`<PropertyInputSelector
  onPropertySelect={handlePropertySelect}
  onPropertyInput={handlePropertyInput}
  showManualInput={true}
  showPortfolio={true}
  showWatchlist={true}
  showPostcodeSearch={true}
/>`}
            </code>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Portfolio Management</h3>
            <p className="text-sm text-gray-600 mb-3">
              Use in portfolio pages to let users add new properties or select existing ones
            </p>
            <code className="text-xs bg-gray-200 p-2 rounded block">
              {`<PropertyInputSelector
  onPropertySelect={handlePropertySelect}
  onPropertyInput={handlePropertyInput}
  showManualInput={true}
  showPortfolio={false}
  showWatchlist={false}
  showPostcodeSearch={true}
/>`}
            </code>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Search</h3>
            <p className="text-sm text-gray-600 mb-3">
              Use for quick property searches with minimal UI
            </p>
            <code className="text-xs bg-gray-200 p-2 rounded block">
              {`<PropertyInputSelector
  onPropertySelect={handlePropertySelect}
  onPropertyInput={handlePropertyInput}
  showManualInput={false}
  showPortfolio={false}
  showWatchlist={false}
  showPostcodeSearch={true}
/>`}
            </code>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Property Comparison</h3>
            <p className="text-sm text-gray-600 mb-3">
              Use for property comparison tools
            </p>
            <code className="text-xs bg-gray-200 p-2 rounded block">
              {`<PropertyInputSelector
  onPropertySelect={handlePropertySelect}
  onPropertyInput={handlePropertyInput}
  showManualInput={true}
  showPortfolio={true}
  showWatchlist={true}
  showPostcodeSearch={true}
/>`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
