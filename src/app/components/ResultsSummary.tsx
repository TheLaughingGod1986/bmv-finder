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
    <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 dark:bg-gray-900 dark:border-gray-700" aria-labelledby="results-summary-title">
      <header className="flex items-center justify-between mb-4">
        <h2 id="results-summary-title" className="text-lg font-bold text-gray-800 dark:text-gray-100">
          📊 Results Summary for {postcode}
        </h2>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold dark:bg-blue-900 dark:text-blue-200">
          {summary.totalProperties} properties
        </span>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
              {formatPrice(summary.avgPrice)}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Average Price</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="text-2xl font-bold text-green-600 dark:text-green-300">
              {formatPrice(summary.minPrice)}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Lowest Price</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
              {formatPrice(summary.maxPrice)}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Highest Price</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">
              {formatPrice(summary.priceRange)}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Price Range</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-500 text-center md:text-left dark:text-gray-400">
        <span className="block md:inline">These figures are based on all property sales in the selected area and time period. Hover or tap the info icons for more details about each metric.</span>
      </div>
      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-semibold text-gray-700 mb-1 dark:text-gray-200">Most Common Property Type</h3>
            {(() => {
              // Parse type and count from summary.mostCommonType (e.g., 'S (45)')
              const match = summary.mostCommonType.match(/^(\w) \((\d+)\)$/);
              if (match) {
                const abbr = match[1];
                const count = match[2];
                return (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{getTypeLabel(abbr)}</span>
                      <span className="text-gray-500 text-sm dark:text-gray-300">({count} sales)</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 dark:text-gray-400" id="property-type-legend">
                      This is the most frequently sold property type in the selected area.
                      <span className="ml-2 text-gray-400" id="property-type-legend">
                        (D = Detached, S = Semi-detached, T = Terraced, F = Flat/Maisonette, O = Other)
                      </span>
                    </div>
                  </>
                );
              } else {
                return <span className="ml-2 text-gray-600 dark:text-gray-200">{summary.mostCommonType}</span>;
              }
            })()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-1 dark:text-gray-200">Date Range</h3>
            <span className="ml-2 text-gray-600 dark:text-gray-200">
              {formatDate(summary.dateRange.earliest)} - {formatDate(summary.dateRange.latest)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-1 dark:text-gray-200">Price per Property</h3>
            <span className="ml-2 text-gray-600 dark:text-gray-200">
              {formatPrice(summary.avgPrice)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsSummary; 