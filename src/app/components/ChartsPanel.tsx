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
} from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

import { SoldPrice } from '../../../types/sold-price';

interface ChartsPanelProps {
  soldPrices: SoldPrice[];
}

const propertyTypeLabels: Record<string, string> = {
  D: 'Detached',
  S: 'Semi-detached',
  T: 'Terraced',
  F: 'Flat/Maisonette',
  O: 'Other',
};

const ChartsPanel: React.FC<ChartsPanelProps> = ({ soldPrices }) => {
  // Pie chart data: property type breakdown
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sp of soldPrices) {
      counts[sp.property_type] = (counts[sp.property_type] || 0) + 1;
    }
    const labels = Object.keys(counts).map(k => propertyTypeLabels[k] || k);
    const data = Object.values(counts);
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            '#2563eb', '#16a34a', '#f59e42', '#a21caf', '#64748b'
          ],
        },
      ],
    };
  }, [soldPrices]);

  // Bar chart data: sales per year
  const barData = useMemo(() => {
    const yearCounts: Record<string, number> = {};
    for (const sp of soldPrices) {
      const year = sp.date_of_transfer.slice(0, 4);
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

  if (!soldPrices.length) return null;

  return (
    <div className="grid md:grid-cols-2 gap-8 mb-8">
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Property Type Breakdown</h3>
        <Pie data={pieData} />
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Sales Per Year</h3>
        <Bar data={barData} options={{ plugins: { legend: { display: false } } }} />
      </div>
    </div>
  );
};

export default ChartsPanel; 