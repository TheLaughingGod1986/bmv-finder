import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { SoldPrice } from '../../../types/sold-price';

interface TrendDataEntry {
  year: string;
  avgPrice: number;
  count: number;
  pctChange: number | null;
}

interface AreaPriceTrendChartProps {
  soldPrices: SoldPrice[];
}

const AreaPriceTrendChart: React.FC<AreaPriceTrendChartProps> = React.memo(({ soldPrices }) => {
  const trendData = useMemo(() => {
    if (soldPrices.length === 0) return [];
    
    const yearlyData: Record<string, { total: number; count: number }> = {};
    for (const sp of soldPrices) {
      const year = sp.date_of_transfer.slice(0, 4);
      if (!yearlyData[year]) yearlyData[year] = { total: 0, count: 0 };
      yearlyData[year].total += sp.price;
      yearlyData[year].count++;
    }

    const sortedYears = Object.keys(yearlyData).sort();
    
    const data: TrendDataEntry[] = sortedYears.map(year => ({
      year,
      avgPrice: yearlyData[year].total / yearlyData[year].count,
      count: yearlyData[year].count,
      pctChange: null,
    }));

    for (let i = 1; i < data.length; i++) {
      const prevYearData = data[i-1];
      const currYearData = data[i];
      if (prevYearData && currYearData.avgPrice && prevYearData.avgPrice) {
        currYearData.pctChange = parseFloat(
          (((currYearData.avgPrice - prevYearData.avgPrice) / prevYearData.avgPrice) * 100).toFixed(1)
        );
      }
    }
    
    return data;

  }, [soldPrices]);
  
  const filteredTrendData = trendData.filter(d => d.count > 1); // Only show years with more than 1 sale

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