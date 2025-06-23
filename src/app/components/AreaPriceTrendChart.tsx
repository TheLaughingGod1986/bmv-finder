import React from 'react';
import { Line } from 'react-chartjs-2';

interface AreaPriceTrendChartProps {
  labels: string[];
  data: number[];
}

const options = {
  responsive: true,
  plugins: {
    legend: { position: 'top' as const },
    title: { display: true, text: 'Average Price Growth by Year' },
  },
};

export default function AreaPriceTrendChart({ labels, data }: AreaPriceTrendChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Average Price',
        data,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="mb-8 bg-white rounded-xl shadow p-4">
      <Line data={chartData} options={options} height={120} />
    </div>
  );
} 