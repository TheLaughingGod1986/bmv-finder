'use client';

import React, { useMemo } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Chart
} from 'chart.js';
import type { ChartEvent, ActiveElement, TooltipItem } from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

import { SoldPrice } from '../../../types/sold-price';

interface ChartsPanelProps {
  soldPrices: SoldPrice[];
  onPropertyTypeFilter?: (propertyTypes: string[]) => void;
  selectedPropertyTypes?: string[];
}

const propertyTypeLabels: Record<string, string> = {
  D: 'Detached',
  S: 'Semi-detached',
  T: 'Terraced',
  F: 'Flat/Maisonette',
  O: 'Other',
};

const ChartsPanel: React.FC<ChartsPanelProps> = ({ 
  soldPrices, 
  onPropertyTypeFilter,
  selectedPropertyTypes = []
}) => {
  // Pie chart data: property type breakdown
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sp of soldPrices) {
      counts[sp.propertyType] = (counts[sp.propertyType] || 0) + 1;
    }
    const labels = Object.keys(counts).map(k => propertyTypeLabels[k] || k);
    const data = Object.values(counts);
    const colors = [
      '#2563eb', '#16a34a', '#f59e42', '#a21caf', '#64748b'
    ];
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: colors.map(color => color + '80'),
          borderWidth: 2,
          hoverBorderWidth: 3,
        },
      ],
    };
  }, [soldPrices]);

  // Bar chart data: sales per year
  const barData = useMemo(() => {
    const yearCounts: Record<string, number> = {};
    for (const sp of soldPrices) {
      const year = sp.dateOfTransfer.slice(0, 4);
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    }
    const years = Object.keys(yearCounts).sort();
    const data = years.map(y => yearCounts[y]);
    return {
      labels: years,
      datasets: [
        {
          label: 'Sales',
          data,
          backgroundColor: '#2563eb',
        },
      ],
    };
  }, [soldPrices]);

  const handlePieClick = (event: ChartEvent, elements: ActiveElement[]) => {
    if (!onPropertyTypeFilter || elements.length === 0) return;
    const clickedIndex = elements[0].index;
    const clickedPropertyType = Object.keys(propertyTypeLabels)[clickedIndex];
    if (clickedPropertyType) {
      const isCurrentlySelected = selectedPropertyTypes.includes(clickedPropertyType);
      if (isCurrentlySelected) {
        const newSelection = selectedPropertyTypes.filter(type => type !== clickedPropertyType);
        onPropertyTypeFilter(newSelection);
      } else {
        const newSelection = [...selectedPropertyTypes, clickedPropertyType];
        onPropertyTypeFilter(newSelection);
      }
    }
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          generateLabels: (chart: Chart<'pie'>) => {
            const data = chart.data;
            if (!data.labels) return [];
            return data.labels.map((label, i) => {
              const isSelected = selectedPropertyTypes.includes(Object.keys(propertyTypeLabels)[i]);
              return {
                text: String(label),
                fillStyle: Array.isArray(data.datasets[0]?.backgroundColor)
                  ? data.datasets[0].backgroundColor[i]
                  : '#2563eb',
                strokeStyle: isSelected ? '#2563eb' : '#fff', // blue border if selected
                lineWidth: isSelected ? 4 : 1,
                hidden: false,
                index: i
              };
            });
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    onClick: handlePieClick,
  };

  if (soldPrices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Property Type Breakdown</h3>
          {selectedPropertyTypes.length > 0 && (
            <button
              onClick={() => onPropertyTypeFilter?.([])}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="relative">
          <Pie data={pieData} options={pieOptions} />
          {selectedPropertyTypes.length > 0 && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Filtered by {selectedPropertyTypes.length} type{selectedPropertyTypes.length !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedPropertyTypes.map(type => propertyTypeLabels[type]).join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 text-xs text-gray-500 text-center">
          💡 Click on pie segments to filter the table data
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Sales per Year</h3>
        <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </div>
    </div>
  );
};

export default ChartsPanel; 