'use client';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import React from 'react';

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

export function LineChart(props: { data: ChartData<'line', (number | import('chart.js').Point)[], unknown>; options?: ChartOptions<'line'> }) {
  return <Line {...(props as React.ComponentProps<typeof Line>)} />;
}
export function BarChart(props: { data: ChartData<'bar', (number | import('chart.js').Point)[], unknown>; options?: ChartOptions<'bar'> }) {
  return <Bar {...(props as React.ComponentProps<typeof Bar>)} />;
}
export function DoughnutChart(props: { data: ChartData<'doughnut', number[], unknown>; options?: ChartOptions<'doughnut'> }) {
  return <Doughnut {...(props as React.ComponentProps<typeof Doughnut>)} />;
} 