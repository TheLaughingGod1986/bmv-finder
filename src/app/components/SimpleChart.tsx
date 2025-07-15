'use client';

import React from 'react';

interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

interface SimpleChartProps {
  data: ChartDataPoint[];
  title: string;
  subtitle?: string;
  valueFormatter?: (value: number) => string;
  color?: string;
  height?: number;
}

export default function SimpleChart({ 
  data, 
  title, 
  subtitle, 
  valueFormatter = (value) => value.toString(),
  color = '#3A7CA5',
  height = 200 
}: SimpleChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
      
      <div className="relative" style={{ height }}>
        {/* Chart bars */}
        <div className="flex items-end justify-between h-full gap-1">
          {data.map((point, index) => {
            const percentage = range > 0 ? ((point.value - minValue) / range) * 100 : 50;
            const barHeight = (percentage / 100) * (height - 40); // Leave space for labels
            
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                {/* Bar */}
                <div 
                  className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                  style={{ 
                    height: Math.max(barHeight, 4), // Minimum 4px height
                    backgroundColor: color,
                    minHeight: '4px'
                  }}
                  title={`${point.label}: ${valueFormatter(point.value)}`}
                />
                
                {/* Label */}
                <div className="text-xs text-gray-600 mt-2 text-center leading-tight">
                  {point.label}
                </div>
                
                {/* Value */}
                <div className="text-xs font-medium text-gray-900 mt-1">
                  {valueFormatter(point.value)}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {[0, 25, 50, 75, 100].map((line) => (
            <div
              key={line}
              className="absolute w-full border-t border-gray-100"
              style={{ top: `${line}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Line chart variant
export function SimpleLineChart({ 
  data, 
  title, 
  subtitle, 
  valueFormatter = (value) => value.toString(),
  color = '#3A7CA5',
  height = 200 
}: SimpleChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
      
      <div className="relative" style={{ height }}>
        {/* SVG for line chart */}
        <svg width="100%" height={height} className="absolute inset-0">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((line) => (
            <line
              key={line}
              x1="0"
              y1={height * (line / 100)}
              x2="100%"
              y2={height * (line / 100)}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}
          
          {/* Line path */}
          <path
            d={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = range > 0 ? 100 - ((point.value - minValue) / range) * 100 : 50;
              return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
            }).join(' ')}
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = range > 0 ? 100 - ((point.value - minValue) / range) * 100 : 50;
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={`${y}%`}
                r="4"
                fill={color}
                className="hover:r-6 transition-all duration-200"
              />
            );
          })}
        </svg>
        
        {/* Labels */}
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          {data.map((point, index) => (
            <div key={index} className="text-center">
              <div className="font-medium">{valueFormatter(point.value)}</div>
              <div className="text-gray-500">{point.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 