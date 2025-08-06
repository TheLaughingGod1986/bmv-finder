'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic imports for chart components
const LineChart = dynamic(() => import('./ChartClientOnly').then(mod => ({ default: mod.LineChart })), {
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: false,
});

const BarChart = dynamic(() => import('./ChartClientOnly').then(mod => ({ default: mod.BarChart })), {
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: false,
});

interface DynamicChartProps {
  type: 'line' | 'bar';
  data: any;
  options?: any;
  className?: string;
}

export default function DynamicChart({ type, data, options, className }: DynamicChartProps) {
  const ChartComponent = type === 'line' ? LineChart : BarChart;

  return (
    <div className={className}>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <ChartComponent data={data} options={options} />
      </Suspense>
    </div>
  );
} 