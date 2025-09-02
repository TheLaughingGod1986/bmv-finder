'use client';

import { Home, Plus, TrendingUp, PieChart } from 'lucide-react';

interface PortfolioProperty {
  id: string;
  address: string;
  postcode: string;
  propertyType: string;
  bedrooms: number;
  floorArea: number;
  epcRating: string;
  lastSalePrice: number;
  lastSaleDate: string;
  totalSales: number;
  currentValuation: number;
  capitalGrowth: number;
  grossYield: number;
  portfolioFit: {
    diversification: number;
    riskLevel: string;
    potential: string;
  };
}

interface PropertyManagementProps {
  properties: PortfolioProperty[];
  onAddProperty: () => void;
}

export default function PropertyManagement({ properties, onAddProperty }: PropertyManagementProps) {
  if (!properties || properties.length === 0) {
    return (
      <div className="text-center py-8">
        <Home className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No properties yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add your first property to start tracking your investments.
        </p>
        <div className="mt-6">
          <button
            onClick={onAddProperty}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
        <button
          onClick={onAddProperty}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </button>
      </div>
      
      <div className="space-y-4">
        {properties.map((property) => (
          <div key={property.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900">{property.address}</h4>
                <p className="text-sm text-gray-500">{property.postcode}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  £{property.currentValuation?.toLocaleString() || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  {property.bedrooms} bed • {property.propertyType}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Capital Growth</p>
                <p className={`font-medium ${property.capitalGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {property.capitalGrowth >= 0 ? '+' : ''}{property.capitalGrowth?.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-gray-500">Gross Yield</p>
                <p className="font-medium text-gray-900">{property.grossYield?.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-500">EPC Rating</p>
                <p className="font-medium text-gray-900">{property.epcRating}</p>
              </div>
              <div>
                <p className="text-gray-500">Risk Level</p>
                <p className={`font-medium ${
                  property.portfolioFit?.riskLevel === 'LOW' ? 'text-green-600' :
                  property.portfolioFit?.riskLevel === 'HIGH' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {property.portfolioFit?.riskLevel || 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Portfolio Fit Indicators */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  <PieChart className="h-3 w-3 text-blue-600 mr-1" />
                  <span className="text-gray-500">Diversification:</span>
                  <span className="ml-1 font-medium text-gray-900">{property.portfolioFit?.diversification || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-gray-500">Potential:</span>
                  <span className={`ml-1 font-medium ${
                    property.portfolioFit?.potential === 'HIGH' ? 'text-green-600' :
                    property.portfolioFit?.potential === 'LOW' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {property.portfolioFit?.potential || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
