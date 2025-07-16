'use client';

import React from 'react';
import EnergyEfficiencyInsights from '../components/EnergyEfficiencyInsights';

const testProperties = [
  {
    id: 1,
    address: '123 Green Street, London',
    epcRating: 'A',
    epcSize: 120,
    propertyType: 'Detached'
  },
  {
    id: 2,
    address: '456 Oak Avenue, Manchester',
    epcRating: 'C',
    epcSize: 85,
    propertyType: 'Semi-detached'
  },
  {
    id: 3,
    address: '789 Pine Road, Birmingham',
    epcRating: 'E',
    epcSize: 95,
    propertyType: 'Terraced'
  },
  {
    id: 4,
    address: '321 Elm Street, Leeds',
    epcRating: 'G',
    epcSize: 75,
    propertyType: 'Flat'
  },
  {
    id: 5,
    address: '654 Maple Drive, Bristol',
    epcRating: undefined,
    epcSize: undefined,
    propertyType: 'Detached'
  }
];

export default function TestEnergyEfficiency() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Energy Efficiency Insights Test</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">How Energy Efficiency Insights Work</h2>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            This component analyzes EPC ratings to provide detailed energy efficiency insights including:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-blue-700 space-y-1">
            <li>Annual energy costs based on property size and EPC rating</li>
            <li>Carbon emissions and environmental impact</li>
            <li>Potential savings from energy efficiency improvements</li>
            <li>Personalized recommendations for each efficiency level</li>
            <li>Cost per square meter analysis</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testProperties.map((property) => (
          <div key={property.id} className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-lg mb-2">{property.address}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {property.propertyType} • {property.epcSize ? `${property.epcSize}m²` : 'Size unknown'}
            </p>
            
            <EnergyEfficiencyInsights
              epcRating={property.epcRating}
              epcSize={property.epcSize}
              propertyType={property.propertyType}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Energy Efficiency Rating Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">EPC Rating Scale</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-100 text-green-800 rounded text-xs font-bold flex items-center justify-center">A</span>
                <span>Excellent (0-50 kWh/m²/year)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-50 text-green-700 rounded text-xs font-bold flex items-center justify-center">B</span>
                <span>Good (51-90 kWh/m²/year)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-yellow-100 text-yellow-700 rounded text-xs font-bold flex items-center justify-center">C</span>
                <span>Average (91-150 kWh/m²/year)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-orange-100 text-orange-700 rounded text-xs font-bold flex items-center justify-center">D</span>
                <span>Poor (151-230 kWh/m²/year)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-red-100 text-red-700 rounded text-xs font-bold flex items-center justify-center">E</span>
                <span>Poor (231-330 kWh/m²/year)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-red-200 text-red-800 rounded text-xs font-bold flex items-center justify-center">F</span>
                <span>Very Poor (331-450 kWh/m²/year)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-red-300 text-red-900 rounded text-xs font-bold flex items-center justify-center">G</span>
                <span>Very Poor (450+ kWh/m²/year)</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Key Benefits</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Lower energy bills and running costs</li>
              <li>• Reduced carbon footprint</li>
              <li>• Higher property value and marketability</li>
              <li>• Better comfort and living conditions</li>
              <li>• Future-proof against energy regulations</li>
              <li>• Potential for government incentives</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 