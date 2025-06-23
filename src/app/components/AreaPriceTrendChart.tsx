import React from 'react';
import { Line } from 'react-chartjs-2';
import type { TooltipItem } from 'chart.js';

interface AreaPriceTrendChartProps {
  labels: string[];
  data: number[];
  areaName?: string;
}

const options = {
  responsive: true,
  plugins: {
    legend: { 
      position: 'top' as const,
      labels: {
        font: {
          size: 14,
          weight: 600
        }
      }
    },
    title: { 
      display: false // We'll handle the title in our custom UI
    },
    tooltip: {
      callbacks: {
        label: function(context: TooltipItem<'line'>) {
          return `Average Price: £${context.parsed.y.toLocaleString()}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      title: {
        display: true,
        text: 'Average Sold Price (£)',
        font: {
          size: 12,
          weight: 500
        }
      },
      ticks: {
        callback: function(value: string | number) {
          const num = typeof value === 'number' ? value : Number(value);
          return '£' + num.toLocaleString();
        }
      }
    },
    x: {
      title: {
        display: true,
        text: 'Year',
        font: {
          size: 12,
          weight: 500
        }
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index' as const,
  }
};

export default function AreaPriceTrendChart({ labels, data, areaName }: AreaPriceTrendChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Average Price',
        data,
        borderColor: 'rgb(59, 130, 246)', // Blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.2,
        fill: true,
      },
    ],
  };

  const formatAreaName = (name?: string) => {
    if (!name) return 'this area';
    return name.length > 30 ? name.substring(0, 30) + '...' : name;
  };

  return (
    <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {/* Header with title and info icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-gray-900">
            Average Sold Price Growth in {formatAreaName(areaName)}
          </h3>
          <button
            className="text-blue-500 hover:text-blue-700 transition-colors"
            aria-label="Learn more about this chart"
            title="This chart shows the average sold property price for each year in your selected area, based on official UK Land Registry data. It helps you see how property values have changed over time."
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
        This chart displays the average price of properties sold in {formatAreaName(areaName)} for each year, 
        based on official UK Land Registry data. Use it to identify trends in property values over time.
      </p>

      {/* Chart or No Data Message */}
      <div className="relative min-h-[200px] flex items-center justify-center">
        {labels.length === 0 || data.length === 0 ? (
          <div className="text-center py-12 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-lg font-medium text-gray-700">
                Not enough data to show a price trend
              </span>
            </div>
            <div className="text-sm text-gray-500 mb-4 leading-relaxed">
              This usually means there haven&apos;t been enough property sales in this area in recent years, 
              or the data is too sparse to calculate a reliable trend. We need at least two years of sales data to show meaningful patterns.
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 border border-gray-100">
              <strong>Try this:</strong> Search for a broader area (like just the first part of the postcode) 
              or try a different nearby postcode to see more results.
            </div>
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>

      {/* How to read section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          How to read this chart
        </h4>
        <p className="text-sm text-blue-800">
          Each point represents the average price of all properties sold in that year. 
          A rising line indicates increasing property values, while a flat or falling line suggests stable or decreasing prices.
        </p>
      </div>

      {/* Data source */}
      <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        Source: UK Land Registry, updated daily
      </div>
    </div>
  );
} 