import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface GrowthOverYearsChartProps {
  soldPrices: { dateOfTransfer: string, price: number }[];
}

const GrowthOverYearsChart: React.FC<GrowthOverYearsChartProps> = ({ soldPrices = [] }) => {
  const data = useMemo(() => {
    const yearMap: Record<string, { total: number; count: number }> = {};
    soldPrices.forEach(sp => {
      const year = new Date(sp.dateOfTransfer).getFullYear();
      if (!yearMap[year]) yearMap[year] = { total: 0, count: 0 };
      yearMap[year].total += sp.price;
      yearMap[year].count += 1;
    });
    const years = Object.keys(yearMap).sort();
    const avgByYear = years.map(year => yearMap[year].total / yearMap[year].count);
    const growth = avgByYear.map((avg, idx, arr) => {
      if (idx === 0) return 0;
      const prev = arr[idx - 1];
      return prev ? Math.round(((avg - prev) / prev) * 1000) / 10 : 0;
    });
    return {
      labels: years,
      datasets: [
        {
          label: 'Growth (%)',
          data: growth,
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22,163,74,0.2)',
          tension: 0.3,
          pointRadius: 3,
          fill: true,
        },
      ],
    };
  }, [soldPrices]);

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { enabled: true, callbacks: { label: (ctx: any) => `${ctx.parsed.y}%` } },
    },
    scales: {
      x: { title: { display: true, text: 'Year' } },
      y: { title: { display: true, text: 'Growth (%)' }, beginAtZero: false, ticks: { callback: (v: number) => `${v}%` } },
    },
  };

  return <Line data={data} options={options} height={200} />;
};

export default GrowthOverYearsChart; 