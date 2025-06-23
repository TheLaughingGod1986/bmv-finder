import React from 'react';
import { Line } from 'react-chartjs-2';

const data = {
  labels: ['2021', '2022', '2023', '2024'],
  datasets: [
    {
      label: 'Average Price',
      data: [380000, 410000, 425000, 440000],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1,
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: { position: 'top' as const },
    title: { display: true, text: 'Test Minimal Growth Chart' },
  },
};

export default function AreaPriceTrendChart() {
  return (
    <div className="mb-8 bg-white rounded-xl shadow p-4">
      <Line data={data} options={options} height={120} />
    </div>
  );
} 