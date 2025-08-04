import { useMemo } from 'react';
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
  soldPrices: { dateOfTransfer?: string, date?: string, price: number }[];
}

const GrowthOverYearsChart: React.FC<GrowthOverYearsChartProps> = ({ soldPrices = [] }) => {
  const data = useMemo(() => {
    // Filter out invalid data
    const validSales = soldPrices.filter(sp => {
      const dateField = sp.dateOfTransfer || sp.date;
      return dateField && sp.price && sp.price > 0 && !isNaN(sp.price);
    });

    if (validSales.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Growth (%)',
          data: [],
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22,163,74,0.2)',
          tension: 0.3,
          pointRadius: 3,
          fill: true,
        }],
      };
    }

    const yearMap: Record<string, { total: number; count: number }> = {};
    validSales.forEach(sp => {
      const dateField = sp.dateOfTransfer || sp.date;
      if (!dateField) return; // Skip if no date field
      
      const year = new Date(dateField).getFullYear();
      if (isNaN(year)) return; // Skip if invalid year
      
      if (!yearMap[year]) yearMap[year] = { total: 0, count: 0 };
      yearMap[year].total += sp.price;
      yearMap[year].count += 1;
    });

    const years = Object.keys(yearMap).sort();
    
    if (years.length < 2) {
      return {
        labels: years,
        datasets: [{
          label: 'Growth (%)',
          data: years.length === 1 ? [0] : [],
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22,163,74,0.2)',
          tension: 0.3,
          pointRadius: 3,
          fill: true,
        }],
      };
    }

    const avgByYear = years.map(year => yearMap[year].total / yearMap[year].count);
    const growth = avgByYear.map((avg, idx, arr) => {
      if (idx === 0) return 0;
      const prev = arr[idx - 1];
      return prev && prev > 0 ? Math.round(((avg - prev) / prev) * 1000) / 10 : 0;
    });

    return {
      labels: years,
      datasets: [{
        label: 'Growth (%)',
        data: growth,
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22,163,74,0.2)',
        tension: 0.3,
        pointRadius: 3,
        fill: true,
      }],
    };
  }, [soldPrices]);

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
              tooltip: { enabled: true, callbacks: { label: (ctx: { parsed: { y: number } }) => `${ctx.parsed.y}%` } },
    },
    scales: {
      x: { title: { display: true, text: 'Year' } },
      y: {
        title: { display: true, text: 'Growth (%)' },
        beginAtZero: false,
        ticks: {
          callback: (tickValue: string | number) => {
            if (typeof tickValue === 'number') {
              return `${tickValue}%`;
            }
            return tickValue;
          }
        }
      },
    },
  };

  // Show message if not enough data
  if (data.labels.length < 2) {
    return (
      <div className="w-full h-64 bg-white border border-[#E5E5E5] rounded-lg p-4 flex items-center justify-center">
        <div className="text-center text-[#3B755D]">
          <div className="text-lg font-medium mb-2">Not enough data for growth chart</div>
          <div className="text-sm">Need at least 2 years of sales data to show growth trends</div>
        </div>
      </div>
    );
  }

  return <Line data={data} options={options} height={200} />;
};

export default GrowthOverYearsChart; 