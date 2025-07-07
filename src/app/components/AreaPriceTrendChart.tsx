import React, { useMemo, useState } from 'react';
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
import { cn } from '../../lib/utils';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement);

interface AreaPriceTrendChartProps {
  labels: string[];
  data: number[];
  areaName?: string;
  className?: string;
}

const cardClass = "bg-white rounded-2xl shadow-xl p-6 mb-8 w-full";

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

export default function AreaPriceTrendChart({ labels, data, areaName, className }: AreaPriceTrendChartProps) {
  // Sort labels and data chronologically (earliest date first)
  const combined = labels.map((label, i) => ({ label, value: data[i] }));
  combined.sort((a, b) => {
    // Try to parse as dates; fallback to string compare
    const dateA = Date.parse(a.label);
    const dateB = Date.parse(b.label);
    if (!isNaN(dateA) && !isNaN(dateB)) {
      return dateA - dateB;
    }
    return a.label.localeCompare(b.label);
  });
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
    <div className={className}>
      {/* Unified Header */}
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-lg md:text-xl font-semibold text-text-primary flex items-center">
          Average Sold Price Growth in {formatAreaName(areaName)}
          <button
            className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
            aria-label="Learn more about this chart"
            title="This chart shows the average sold property price for each year in your selected area, based on official UK Land Registry data. It helps you see how property values have changed over time."
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>
        </h3>
      </div>
      <p className="text-sm text-text-secondary mb-6 leading-relaxed">
        This chart displays the average price of properties sold in {formatAreaName(areaName)} for each year, 
        based on official UK Land Registry data. Use it to identify trends in property values over time.
      </p>
      <div className="relative flex-1 min-h-[320px] flex items-center justify-center">
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
          <div className="w-full h-[340px] md:h-[420px] p-2 md:p-4">
            <Line data={chartData} options={{
              ...chartOptions,
              elements: {
                line: { borderWidth: 5 },
                point: { radius: 8, borderWidth: 3, hoverRadius: 12 },
              },
              layout: { padding: 32 },
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  title: {
                    ...chartOptions.scales.y.title,
                    font: { size: 18, weight: 700 },
                  },
                  ticks: {
                    ...chartOptions.scales.y.ticks,
                    font: { size: 16, weight: 600 },
                  },
                  grid: { color: '#cbd5e1', lineWidth: 1.5 },
                },
                x: {
                  ...chartOptions.scales.x,
                  title: {
                    ...chartOptions.scales.x.title,
                    font: { size: 18, weight: 700 },
                  },
                  ticks: {
                    ...chartOptions.scales.x.ticks,
                    font: { size: 16, weight: 600 },
                  },
                  grid: { color: '#e2e8f0', lineWidth: 1.5 },
                },
              },
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  ...chartOptions.plugins.legend,
                  labels: {
                    ...chartOptions.plugins.legend.labels,
                    font: { size: 18, weight: 700 },
                  },
                },
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  bodyFont: { size: 18, weight: 700 },
                  callbacks: {
                    label: function(context) {
                      return `£${context.parsed.y.toLocaleString()}`;
                    }
                  }
                },
              },
            }} />
          </div>
        )}
      </div>
      <div className="mt-4 text-xs text-slate-500 flex items-center gap-2 border-t border-gray-100 pt-4">
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
    <div className="w-full h-full">
      <Bar data={data} options={barOptions} />
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
    <div className="w-full h-full">
      <Pie data={data} options={pieOptions} />
    </div>
  );
}

function AreaGrowthTable({ soldPrices }: { soldPrices: SoldPrice[] }) {
  // Calculate average price per year
  const rows = useMemo(() => {
    const yearMap: Record<string, number[]> = {};
    soldPrices.forEach(sp => {
      const year = new Date(sp.dateOfTransfer).getFullYear();
      if (!yearMap[year]) yearMap[year] = [];
      yearMap[year].push(sp.price);
    });
    const years = Object.keys(yearMap).sort();
    const avgByYear = years.map(year => {
      const prices = yearMap[year];
      return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    });
    return years.map((year, idx) => {
      const avg = avgByYear[idx];
      if (idx === 0) return { year, avg, growth: null, growthPct: null };
      const prev = avgByYear[idx - 1];
      const growth = avg - prev;
      const growthPct = prev ? (growth / prev) * 100 : null;
      return { year, avg, growth, growthPct };
    });
  }, [soldPrices]);

  // Total growth from first to last year
  const total = useMemo(() => {
    if (rows.length < 2) return null;
    const first = rows[0].avg;
    const last = rows[rows.length - 1].avg;
    const growth = last - first;
    const growthPct = first ? (growth / first) * 100 : null;
    return { growth, growthPct };
  }, [rows]);

  return (
    <div className="mt-8">
      <h4 className="font-semibold mb-2 text-blue-800">Growth of Area Per Year</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border rounded-xl">
          <thead>
            <tr className="bg-blue-50 text-blue-900">
              <th className="px-4 py-2 text-left font-semibold">Year</th>
              <th className="px-4 py-2 text-left font-semibold">Avg Price</th>
              <th className="px-4 py-2 text-left font-semibold">Growth</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.year} className={i === rows.length - 1 ? 'bg-yellow-50' : ''}>
                <td className="px-4 py-2">{row.year}</td>
                <td className="px-4 py-2">£{row.avg.toLocaleString()}</td>
                <td className="px-4 py-2">
                  {row.growth === null ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    <span className={row.growth > 0 ? 'text-green-600 font-semibold' : row.growth < 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                      {row.growth > 0 ? '+' : ''}£{row.growth.toLocaleString()} {row.growthPct !== null && (
                        <span className="text-xs font-normal">({row.growthPct > 0 ? '+' : ''}{row.growthPct.toFixed(1)}%)</span>
                      )}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {total && (
              <tr className="bg-blue-50 font-bold">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2">
                  <span className={total.growth > 0 ? 'text-green-700' : total.growth < 0 ? 'text-red-700' : 'text-gray-700'}>
                    {total.growth > 0 ? '+' : ''}£{total.growth.toLocaleString()} {total.growthPct !== null && (
                      <span className="text-xs font-normal">({total.growthPct > 0 ? '+' : ''}{total.growthPct.toFixed(1)}%)</span>
                    )}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SalesAndTypeCharts({ soldPrices }: { soldPrices: SoldPrice[] }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
        <SalesPerYearBarChart soldPrices={soldPrices} />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
        <PropertyTypePieChart soldPrices={soldPrices} />
        <AreaGrowthTable soldPrices={soldPrices} />
      </div>
    </div>
  );
}

export { AreaGrowthTable };

function PriceDistributionHistogram({ soldPrices }: { soldPrices: SoldPrice[] }) {
  // Create price bands
  const bands = [0, 100000, 200000, 300000, 400000, 500000, 750000, 1000000, 2000000];
  const bandLabels = bands.map((b, i) => i < bands.length - 1 ? `£${b.toLocaleString()}–£${bands[i+1].toLocaleString()}` : `£${b.toLocaleString()}+`);
  const bandCounts = Array(bands.length).fill(0);
  soldPrices.forEach(sp => {
    const price = sp.price;
    let idx = bands.findIndex((b, i) => price >= b && (i === bands.length - 1 || price < bands[i+1]));
    if (idx === -1) idx = bands.length - 1;
    bandCounts[idx]++;
  });
  const data = {
    labels: bandLabels,
    datasets: [{
      label: 'Number of Sales',
      data: bandCounts,
      backgroundColor: 'rgba(59,130,246,0.7)',
      borderColor: 'rgb(59,130,246)',
      borderWidth: 1,
      borderRadius: 6,
    }],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { bodyFont: { size: 14 } },
    },
    scales: {
      x: { title: { display: true, text: 'Price Band' }, ticks: { font: { size: 12 } } },
      y: { title: { display: true, text: 'Sales' }, beginAtZero: true, ticks: { precision: 0, font: { size: 12 } } },
    },
  };
  return (
    <div className="w-full h-full">
      <Bar data={data} options={options} />
    </div>
  );
}

function RecentSalesTable({ soldPrices }: { soldPrices: SoldPrice[] }) {
  const recent = [...soldPrices].sort((a, b) => new Date(b.dateOfTransfer).getTime() - new Date(a.dateOfTransfer).getTime()).slice(0, 5);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const typeLabels: { [key: string]: string } = { 'D': 'Detached', 'S': 'Semi-Detached', 'T': 'Terraced', 'F': 'Flat/Maisonette', 'O': 'Other' };
  return (
    <div className="mb-8">
      <h4 className="font-semibold mb-2 text-blue-800">Recent Notable Sales</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border rounded-xl">
          <thead>
            <tr className="bg-blue-50 text-blue-900">
              <th className="px-4 py-2 text-left font-semibold">Date</th>
              <th className="px-4 py-2 text-left font-semibold">Price</th>
              <th className="px-4 py-2 text-left font-semibold">Type</th>
              <th className="px-4 py-2 text-left font-semibold">Address</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((sp, i) => (
              <tr key={i} className={i === 0 ? 'bg-yellow-50' : ''}>
                <td className="px-4 py-2">{formatDate(sp.dateOfTransfer)}</td>
                <td className="px-4 py-2">£{sp.price.toLocaleString()}</td>
                <td className="px-4 py-2">{typeLabels[sp.propertyType] || sp.propertyType}</td>
                <td className="px-4 py-2 truncate max-w-[120px]">{[sp.paon, sp.street, sp.town_city].filter(Boolean).join(' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TenurePieChart({ soldPrices }: { soldPrices: SoldPrice[] }) {
  const tenureCounts: Record<string, number> = { Freehold: 0, Leasehold: 0, Unknown: 0 };
  soldPrices.forEach(sp => {
    if (sp.duration === 'F') tenureCounts.Freehold++;
    else if (sp.duration === 'L') tenureCounts.Leasehold++;
    else tenureCounts.Unknown++;
  });
  const data = {
    labels: ['Freehold', 'Leasehold', 'Unknown'],
    datasets: [{
      data: [tenureCounts.Freehold, tenureCounts.Leasehold, tenureCounts.Unknown],
      backgroundColor: [
        'rgba(16,185,129,0.7)', // green
        'rgba(59,130,246,0.7)', // blue
        'rgba(107,114,128,0.7)', // gray
      ],
      borderColor: '#fff',
      borderWidth: 2,
    }],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const, labels: { font: { size: 14 }, color: '#334155', usePointStyle: true, padding: 20 } },
      tooltip: { bodyFont: { size: 14 } },
    },
    layout: { padding: 16 },
  };
  return (
    <div className="w-full h-full">
      <Pie data={data} options={options} />
    </div>
  );
}

export { PriceDistributionHistogram, RecentSalesTable, TenurePieChart };

// Combined Sales and Property Type Charts
export function SalesAndPropertyTypeCharts({ soldPrices }: { soldPrices: SoldPrice[] }) {
  const [activeTab, setActiveTab] = useState<'sales' | 'types'>('sales');

  return (
    <div className={cardClass + " min-h-[320px] flex flex-col"}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-blue-800">Market Activity</h4>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'sales' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Sales
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'types' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Types
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full h-[220px] md:h-[260px]">
        {activeTab === 'sales' ? (
          <SalesPerYearBarChart soldPrices={soldPrices} />
        ) : (
          <PropertyTypePieChart soldPrices={soldPrices} />
        )}
      </div>
    </div>
  );
}

// Combined Price and Tenure Charts
export function PriceAndTenureCharts({ soldPrices }: { soldPrices: SoldPrice[] }) {
  const [activeTab, setActiveTab] = useState<'price' | 'tenure'>('price');

  return (
    <div className={cardClass + " min-h-[320px] flex flex-col"}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-blue-800">Property Details</h4>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('price')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'price' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Prices
          </button>
          <button
            onClick={() => setActiveTab('tenure')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'tenure' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Tenure
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full h-[220px] md:h-[260px]">
        {activeTab === 'price' ? (
          <PriceDistributionHistogram soldPrices={soldPrices} />
        ) : (
          <TenurePieChart soldPrices={soldPrices} />
        )}
      </div>
    </div>
  );
} 