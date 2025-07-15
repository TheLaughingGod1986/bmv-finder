'use client';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function LineChart(props: any) {
  return <Line {...props} />;
}
export function BarChart(props: any) {
  return <Bar {...props} />;
}
export function DoughnutChart(props: any) {
  return <Doughnut {...props} />;
} 