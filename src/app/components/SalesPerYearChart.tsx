import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SalesPerYearChartProps {
  soldPrices: { dateOfTransfer: string }[];
}

const SalesPerYearChart: React.FC<SalesPerYearChartProps> = ({ soldPrices = [] }) => {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    soldPrices.forEach(sp => {
      const year = new Date(sp.dateOfTransfer).getFullYear();
      counts[year] = (counts[year] || 0) + 1;
    });
    const years = Object.keys(counts).sort();
    return {
      labels: years,
      datasets: [
        {
          label: 'Sales',
          data: years.map(year => counts[year]),
          backgroundColor: '#2563eb',
          borderRadius: 6,
        },
      ],
    };
  }, [soldPrices]);

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { title: { display: true, text: 'Year' } },
      y: { title: { display: true, text: 'Sales' }, beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  return <Bar data={data} options={options} height={200} />;
};

export default SalesPerYearChart; 