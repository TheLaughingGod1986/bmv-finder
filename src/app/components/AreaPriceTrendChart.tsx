import React from 'react';
import { Line } from 'react-chartjs-2';

interface TrendDataEntry {
  year: string;
  avgPrice: number;
  pctChange: number | null;
}

interface AreaPriceTrendChartProps {
  filteredTrendData: TrendDataEntry[];
}

const AreaPriceTrendChart: React.FC<AreaPriceTrendChartProps> = React.memo(({ filteredTrendData }) => {
  if (filteredTrendData.length <= 1) return null;
  return (
    <div className="mb-8 bg-white rounded-xl shadow p-4">
      <h3 className="font-semibold text-gray-800 mb-2">Area Price Trend</h3>
      <p className="text-gray-600 text-sm mb-4">This interactive chart shows the average sold price and year-on-year percentage change for properties matching your filters. Use it to spot trends and compare price growth over time.</p>
      <Line
        data={{
          labels: filteredTrendData.map((d) => d.year),
          datasets: [
            {
              label: 'Avg Price',
              data: filteredTrendData.map((d) => d.avgPrice),
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37,99,235,0.1)',
              yAxisID: 'y',
              tension: 0.3,
            },
            {
              label: 'YoY % Change',
              data: filteredTrendData.map((d) => d.pctChange),
              borderColor: '#16a34a',
              backgroundColor: 'rgba(22,163,74,0.1)',
              yAxisID: 'y1',
              tension: 0.3,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { position: 'top' as const },
            title: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  if (context.dataset.label === 'Avg Price') {
                    return `Avg Price: £${context.parsed.y.toLocaleString()}`;
                  }
                  if (context.dataset.label === 'YoY % Change') {
                    return `YoY % Change: ${context.parsed.y !== null ? context.parsed.y + '%' : 'N/A'}`;
                  }
                  return context.formattedValue;
                }
              }
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: { display: true, text: 'Avg Price (£)' },
              ticks: { callback: (v: any) => '£' + v.toLocaleString() },
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: { display: true, text: 'YoY % Change' },
              grid: { drawOnChartArea: false },
              ticks: { callback: (v: any) => v + '%' },
            },
          },
        }}
        height={120}
      />
    </div>
  );
});

AreaPriceTrendChart.displayName = 'AreaPriceTrendChart';

export default AreaPriceTrendChart; 