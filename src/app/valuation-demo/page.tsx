'use client';

import PropertyValuationCard from '../components/PropertyValuationCard';

export default function ValuationDemoPage() {
  // Sample data for the NE5 property we've been working with
  const sampleProperty = {
    address: "21, FOURSTONES, NEWCASTLE UPON TYNE, NE5 2PR",
    postcode: "NE5 2PR",
    propertyType: "Terraced House",
    bedrooms: 3,
    estimatedValue: 90223,
    confidence: 'medium' as const,
    valueRange: {
      low: 85000,
      high: 95000,
    },
    lastUpdated: "30 May 2025",
    nextUpdate: "30 Jun 2025",
    dataSource: "Your property value is connected to Hometrack (Zoopla) for automatic updates",
    purchaseHistory: {
      purchasePrice: 87650,
      purchaseDate: "2024-02-28",
      totalGain: 2573,
      growthPercentage: 2.94,
      annualAppreciation: 2.94
    },
    mortgage: {
      currentBalance: 65750,
      propertyReference: "21, FOURSTONES"
    },
    historicalData: [
      { date: "2024-06-01", value: 87650 },
      { date: "2024-08-01", value: 88500 },
      { date: "2024-10-01", value: 89200 },
      { date: "2025-01-01", value: 89800 },
      { date: "2025-03-01", value: 90000 },
      { date: "2025-05-01", value: 90223 },
    ],
    comparableSales: [
      {
        number: "21",
        address: "FOURSTONES, NEWCASTLE UPON TYNE, NEWCASTLE UPON TYNE, TYNE AND WEAR, NE5 2PR",
        postcode: "NE5 2PR",
        propertyType: "T",
        price: 87650,
        date: "2024-02-28"
      },
      {
        number: "9",
        address: "FOURSTONES, NEWCASTLE UPON TYNE, NEWCASTLE UPON TYNE, TYNE AND WEAR, NE5 2PR",
        postcode: "NE5 2PR",
        propertyType: "T",
        price: 82000,
        date: "2022-09-22"
      },
      {
        number: "5",
        address: "FOURSTONES, NEWCASTLE UPON TYNE, NEWCASTLE UPON TYNE, TYNE AND WEAR, NE5 2PR",
        postcode: "NE5 2PR",
        propertyType: "T",
        price: 100000,
        date: "2022-01-28"
      },
      {
        number: "19",
        address: "FOURSTONES, NEWCASTLE UPON TYNE, NEWCASTLE UPON TYNE, TYNE AND WEAR, NE5 2PR",
        postcode: "NE5 2PR",
        propertyType: "T",
        price: 109000,
        date: "2021-06-03"
      },
      {
        number: "29",
        address: "FOURSTONES, NEWCASTLE UPON TYNE, NEWCASTLE UPON TYNE, TYNE AND WEAR, NE5 2PR",
        postcode: "NE5 2PR",
        propertyType: "T",
        price: 97500,
        date: "2007-11-09"
      },
      {
        number: "33",
        address: "FOURSTONES, NEWCASTLE UPON TYNE, NEWCASTLE UPON TYNE, TYNE AND WEAR, NE5 2PR",
        postcode: "NE5 2PR",
        propertyType: "T",
        price: 57000,
        date: "2003-09-17"
      }
    ],
    valuationBreakdown: {
      comparableSalesValue: 63158,
      hpiAdjustedValue: 90223,
      marketTrends: 2500,
      locationPremium: 3500,
      propertyCondition: 1842
    },
    marketInsights: {
      averagePricePerSqm: 2850,
      priceGrowth: 2.8,
      daysOnMarket: 45,
      supplyDemand: 'medium' as const
    },
  };

  // Sample data for a London property (similar to the image)
  const londonProperty = {
    address: "Flat 305, Marsden House, London, SE3 9FW",
    postcode: "SE3 9FW",
    propertyType: "Purpose Built Flat",
    bedrooms: 2,
    estimatedValue: 348000,
    confidence: 'low' as const,
    valueRange: {
      low: 279000,
      high: 418000,
    },
    lastUpdated: "30 May 2025",
    historicalData: [
      { date: "2024-06-01", value: 345000 },
      { date: "2024-08-01", value: 338000 },
      { date: "2024-10-01", value: 350000 },
      { date: "2025-01-01", value: 352000 },
      { date: "2025-03-01", value: 348000 },
      { date: "2025-05-01", value: 348000 },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Property Valuation Demo
          </h1>
          <p className="text-gray-600">
            Showcasing the new valuation card design inspired by professional property platforms
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Newcastle Property */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              Newcastle Property (NE5 2PR)
            </h2>
            <PropertyValuationCard property={sampleProperty} />
          </div>

          {/* London Property */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              London Property (SE3 9FW)
            </h2>
            <PropertyValuationCard property={londonProperty} />
          </div>
        </div>

        {/* Design Features */}
        <div className="mt-12 bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Design Features Implemented
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">✅ Visual Elements</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Clean, professional card layout</li>
                <li>• Prominent value display with dark background</li>
                <li>• Visual range indicator with progress bar</li>
                <li>• Interactive confidence indicator with tooltip</li>
                <li>• Historical trend graph with area fill</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">✅ User Experience</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Clear information hierarchy</li>
                <li>• Responsive design for all screen sizes</li>
                <li>• Hover effects and smooth transitions</li>
                <li>• Accessible color contrast ratios</li>
                <li>• Professional typography and spacing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 