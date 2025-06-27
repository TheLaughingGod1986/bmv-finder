import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import type { SoldPrice } from '../../../types/sold-price';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement);

interface AreaPriceTrendChartProps {
  labels: string[];
  data: number[];
  areaName?: string;
}

const cardClass = "bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-8 w-full";

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        font: { size: 16, weight: 600 },
        color: '#334155',
        usePointStyle: true,
        padding: 20,
      },
    },
    tooltip: {
      bodyFont: { size: 16 },
      callbacks: {
        label: function(context: TooltipItem<'line'>) {
          return `Average Price: £${context.parsed.y.toLocaleString()}`;
        }
      }
    },
    title: { display: false },
  },
  layout: { padding: 16 },
  scales: {
    y: {
      beginAtZero: false,
      title: {
        display: true,
        text: 'Average Sold Price (£)',
        font: { size: 14, weight: 600 },
        color: '#64748b',
      },
      ticks: {
        color: '#64748b',
        font: { size: 14 },
        callback: function(value: string | number) {
          const num = typeof value === 'number' ? value : Number(value);
          return '£' + num.toLocaleString();
        }
      },
      grid: { color: '#e0e7ef' },
    },
    x: {
      title: {
        display: true,
        text: 'Year',
        font: { size: 14, weight: 600 },
        color: '#64748b',
      },
      ticks: { color: '#64748b', font: { size: 14 } },
      grid: { color: '#f1f5f9' },
    },
  },
  interaction: { intersect: false, mode: 'index' as const },
};

export default function AreaPriceTrendChart({ labels, data, areaName }: AreaPriceTrendChartProps) {
  // Sort labels and data chronologically (earliest year first)
  const combined = labels.map((label, i) => ({ label, value: data[i] }));
  combined.sort((a, b) => a.label.localeCompare(b.label));
  const sortedLabels = combined.map(item => item.label);
  const sortedData = combined.map(item => item.value);

  const chartData = {
    labels: sortedLabels,
    datasets: [
      {
        label: `${areaName} Average`,
        data: sortedData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      }
    ]
  };

  const formatAreaName = (name?: string) => {
    if (!name) return 'this area';
    return name.length > 30 ? name.substring(0, 30) + '...' : name;
  };

  return (
    <div className={cardClass + " min-h-[400px] flex flex-col"}>
      {/* Header with title and info icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold gradient-text">
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
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        This chart displays the average price of properties sold in {formatAreaName(areaName)} for each year, 
        based on official UK Land Registry data. Use it to identify trends in property values over time.
      </p>
      <div className="relative flex-1 min-h-[250px] flex items-center justify-center">
        {labels.length === 0 || data.length === 0 ? (
          <div className="text-center py-12 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg className="w-10 h-10 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-lg font-medium text-blue-400">
                Not enough data to show a price trend
              </span>
            </div>
            <div className="text-sm text-slate-500 mb-4 leading-relaxed">
              This usually means there haven&apos;t been enough property sales in this area in recent years, 
              or the data is too sparse to calculate a reliable trend. We need at least two years of sales data to show meaningful patterns.
            </div>
            <div className="text-xs text-blue-400 bg-blue-50 rounded-lg p-3 border border-blue-100">
              <strong>Try this:</strong> Search for a broader area (like just the first part of the postcode) 
              or try a different nearby postcode to see more results.
            </div>
          </div>
        ) : (
          <div className="w-full h-[260px] md:h-[340px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
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
      <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        Source: UK Land Registry, updated daily
      </div>
    </div>
  );
}

export function SalesPerYearBarChart({ soldPrices }: { soldPrices: SoldPrice[] }) {
  // Count sales per year
  const yearCounts: Record<string, number> = {};
  soldPrices.forEach(sp => {
    const year = sp.dateOfTransfer.slice(0, 4);
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });
  const years = Object.keys(yearCounts).sort();
  const data = {
    labels: years,
    datasets: [{
      label: 'Sales',
      data: years.map(y => yearCounts[y]),
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
    }],
  };
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { bodyFont: { size: 16 } },
    },
    layout: { padding: 16 },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Number of Sales', font: { size: 14, weight: 600 }, color: '#64748b' },
        ticks: { color: '#64748b', font: { size: 14 } },
        grid: { color: '#e0e7ef' },
      },
      x: {
        title: { display: true, text: 'Year', font: { size: 14, weight: 600 }, color: '#64748b' },
        ticks: { color: '#64748b', font: { size: 14 } },
        grid: { color: '#f1f5f9' },
      },
    },
  };
  return (
    <div className={cardClass + " min-h-[320px] flex flex-col"}>
      <h4 className="font-semibold mb-2 text-blue-800">Sales Per Year</h4>
      <div className="flex-1 w-full h-[220px] md:h-[260px]">
        <Bar data={data} options={barOptions} />
      </div>
    </div>
  );
}

export function PropertyTypePieChart({ soldPrices }: { soldPrices: SoldPrice[] }) {
  // Count property types
  const typeCounts: Record<string, number> = {};
  soldPrices.forEach(sp => {
    const type = sp.propertyType || 'Unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  const types = Object.keys(typeCounts);
  const data = {
    labels: types,
    datasets: [{
      data: types.map(t => typeCounts[t]),
      backgroundColor: [
        'rgba(59,130,246,0.7)', // blue
        'rgba(16,185,129,0.7)', // green
        'rgba(168,85,247,0.7)', // purple
        'rgba(251,191,36,0.7)', // yellow
        'rgba(239,68,68,0.7)', // red
        'rgba(107,114,128,0.7)', // gray
      ],
      borderColor: '#fff',
      borderWidth: 2,
    }],
  };
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { font: { size: 16 }, color: '#334155', usePointStyle: true, padding: 20 } },
      tooltip: { bodyFont: { size: 16 } },
    },
    layout: { padding: 16 },
  };
  return (
    <div className={cardClass + " min-h-[320px] flex flex-col"}>
      <h4 className="font-semibold mb-2 text-blue-800">Property Type Distribution</h4>
      <div className="flex-1 w-full h-[220px] md:h-[260px]">
        <Pie data={data} options={pieOptions} />
      </div>
    </div>
  );
} 