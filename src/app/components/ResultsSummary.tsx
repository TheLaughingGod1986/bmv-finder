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
    <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8" aria-labelledby="results-summary-title">
      <header className="flex items-center justify-between mb-4">
        <h2 id="results-summary-title" className="text-lg font-bold text-gray-800">
          📊 Results Summary for {postcode}
        </h2>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
          {summary.totalProperties} properties
        </span>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(summary.avgPrice)}
            </div>
            <span
              className="ml-1 text-blue-400 cursor-help"
              title="The average price of all properties sold in this area during the selected period."
              aria-label="What is Average Price?"
            >
              <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
            </span>
          </div>
          <div className="text-sm text-gray-600">Average Price</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(summary.minPrice)}
            </div>
            <span
              className="ml-1 text-green-400 cursor-help"
              title="The lowest price paid for a property in this area during the selected period."
              aria-label="What is Lowest Price?"
            >
              <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
            </span>
          </div>
          <div className="text-sm text-gray-600">Lowest Price</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="text-2xl font-bold text-purple-600">
              {formatPrice(summary.maxPrice)}
            </div>
            <span
              className="ml-1 text-purple-400 cursor-help"
              title="The highest price paid for a property in this area during the selected period."
              aria-label="What is Highest Price?"
            >
              <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
            </span>
          </div>
          <div className="text-sm text-gray-600">Highest Price</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="text-2xl font-bold text-orange-600">
              {formatPrice(summary.priceRange)}
            </div>
            <span
              className="ml-1 text-orange-400 cursor-help"
              title="The difference between the highest and lowest property prices in this area during the selected period."
              aria-label="What is Price Range?"
            >
              <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
            </span>
          </div>
          <div className="text-sm text-gray-600">Price Range</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-500 text-center md:text-left">
        <span className="block md:inline">These figures are based on all property sales in the selected area and time period. Hover or tap the info icons for more details about each metric.</span>
      </div>
      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-semibold text-gray-700 mb-1">Most Common Property Type</h3>
            {(() => {
              // Parse type and count from summary.mostCommonType (e.g., 'S (45)')
              const match = summary.mostCommonType.match(/^(\w) \((\d+)\)$/);
              if (match) {
                const abbr = match[1];
                const count = match[2];
                return (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-gray-800">{getTypeLabel(abbr)}</span>
                      <span className="text-gray-500 text-sm">({count} sales)</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      This is the most frequently sold property type in the selected area.
                      <span className="ml-2 text-gray-400" id="property-type-legend">
                        (D = Detached, S = Semi-detached, T = Terraced, F = Flat/Maisonette, O = Other)
                      </span>
                    </div>
                  </>
                );
              } else {
                return <span className="ml-2 text-gray-600">{summary.mostCommonType}</span>;
              }
            })()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-1">Date Range</h3>
            <span className="ml-2 text-gray-600">
              {formatDate(summary.dateRange.earliest)} - {formatDate(summary.dateRange.latest)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-1">Price per Property</h3>
            <span className="ml-2 text-gray-600">
              {formatPrice(summary.avgPrice)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsSummary; 