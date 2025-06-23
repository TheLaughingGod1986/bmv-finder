import React from 'react';

interface ResultsSummaryProps {
  summary: {
    totalProperties: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    priceRange: number;
    mostCommonType: string;
    dateRange: {
      earliest: string;
      latest: string;
    };
  };
  postcode: string;
}

const PROPERTY_TYPE_LABELS: { [key: string]: string } = {
  'D': 'Detached',
  'S': 'Semi-detached',
  'T': 'Terraced',
  'F': 'Flat/Maisonette',
  'O': 'Other',
};

function getTypeLabel(type: string) {
  return PROPERTY_TYPE_LABELS[type] || type;
}

const ResultsSummary: React.FC<ResultsSummaryProps> = ({ summary, postcode }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          📊 Results Summary for {postcode}
        </h3>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
          {summary.totalProperties} properties
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatPrice(summary.avgPrice)}
          </div>
          <div className="text-sm text-gray-600">Average Price</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatPrice(summary.minPrice)}
          </div>
          <div className="text-sm text-gray-600">Lowest Price</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formatPrice(summary.maxPrice)}
          </div>
          <div className="text-sm text-gray-600">Highest Price</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {formatPrice(summary.priceRange)}
          </div>
          <div className="text-sm text-gray-600">Price Range</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Most Common Property Type:</span>
            {(() => {
              // Parse type and count from summary.mostCommonType (e.g., 'S (45)')
              const match = summary.mostCommonType.match(/^(\w) \((\d+)\)$/);
              if (match) {
                const abbr = match[1];
                const count = match[2];
                return (
                  <>
                    <span className="ml-2 text-gray-800 font-medium">{getTypeLabel(abbr)}</span>
                    <span className="ml-1 text-gray-500">({count} sales)</span>
                    <span
                      className="ml-1 text-gray-400 cursor-help"
                      title="D = Detached, S = Semi-detached, T = Terraced, F = Flat/Maisonette, O = Other"
                      aria-label="Property type legend"
                    >
                      ℹ️
                    </span>
                    <div className="text-xs text-gray-500 mt-1">This is the most frequently sold property type in the selected area.</div>
                  </>
                );
              } else {
                return <span className="ml-2 text-gray-600">{summary.mostCommonType}</span>;
              }
            })()}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Date Range:</span>
            <span className="ml-2 text-gray-600">
              {formatDate(summary.dateRange.earliest)} - {formatDate(summary.dateRange.latest)}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Price per Property:</span>
            <span className="ml-2 text-gray-600">
              {formatPrice(summary.avgPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsSummary; 