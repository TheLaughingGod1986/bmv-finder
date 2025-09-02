'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ChartBarIcon, 
  ChartPieIcon, 
  ChartLineIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  animation?: boolean;
  responsive?: boolean;
}

interface DataVisualizationProps {
  data: DataPoint[] | TimeSeriesData[];
  config: ChartConfig;
  className?: string;
  onDataPointClick?: (dataPoint: DataPoint | TimeSeriesData) => void;
  onDataPointHover?: (dataPoint: DataPoint | TimeSeriesData) => void;
}

export default function DataVisualization({
  data,
  config,
  className = "",
  onDataPointClick,
  onDataPointHover
}: DataVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | TimeSeriesData | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      drawChart();
    }
  }, [data, config, dimensions]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Set up drawing context
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';

    // Draw based on chart type
    switch (config.type) {
      case 'bar':
        drawBarChart(ctx);
        break;
      case 'line':
        drawLineChart(ctx);
        break;
      case 'pie':
        drawPieChart(ctx);
        break;
      case 'area':
        drawAreaChart(ctx);
        break;
      case 'scatter':
        drawScatterChart(ctx);
        break;
    }
  };

  const drawBarChart = (ctx: CanvasRenderingContext2D) => {
    const padding = 40;
    const chartWidth = dimensions.width - (padding * 2);
    const chartHeight = dimensions.height - (padding * 2);
    const barWidth = chartWidth / data.length;
    const maxValue = Math.max(...data.map(d => d.value));

    // Draw grid lines
    if (config.showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(dimensions.width - padding, y);
        ctx.stroke();
      }
    }

    // Draw bars
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = padding + index * barWidth;
      const y = dimensions.height - padding - barHeight;

      // Bar color
      ctx.fillStyle = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
      
      // Draw bar
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

      // Draw value label
      ctx.fillStyle = '#374151';
      ctx.fillText(
        item.value.toLocaleString(),
        x + barWidth / 2,
        y - 5
      );

      // Draw category label
      ctx.fillText(
        item.label,
        x + barWidth / 2,
        dimensions.height - padding + 15
      );
    });

    // Draw title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(config.title, dimensions.width / 2, 20);
  };

  const drawLineChart = (ctx: CanvasRenderingContext2D) => {
    const padding = 40;
    const chartWidth = dimensions.width - (padding * 2);
    const chartHeight = dimensions.height - (padding * 2);
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue;

    // Draw grid lines
    if (config.showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(dimensions.width - padding, y);
        ctx.stroke();
      }
    }

    // Draw line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((item, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = dimensions.height - padding - ((item.value - minValue) / valueRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    ctx.fillStyle = '#3b82f6';
    data.forEach((item, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = dimensions.height - padding - ((item.value - minValue) / valueRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(config.title, dimensions.width / 2, 20);
  };

  const drawPieChart = (ctx: CanvasRenderingContext2D) => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) / 2 - 60;
    const total = data.reduce((sum, item) => sum + item.value, 0);

    let currentAngle = 0;

    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      // Draw slice
      ctx.fillStyle = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, labelX, labelY);

      currentAngle += sliceAngle;
    });

    // Draw title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(config.title, dimensions.width / 2, 20);
  };

  const drawAreaChart = (ctx: CanvasRenderingContext2D) => {
    const padding = 40;
    const chartWidth = dimensions.width - (padding * 2);
    const chartHeight = dimensions.height - (padding * 2);
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue;

    // Draw area
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.beginPath();
    ctx.moveTo(padding, dimensions.height - padding);

    data.forEach((item, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = dimensions.height - padding - ((item.value - minValue) / valueRange) * chartHeight;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(dimensions.width - padding, dimensions.height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((item, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = dimensions.height - padding - ((item.value - minValue) / valueRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(config.title, dimensions.width / 2, 20);
  };

  const drawScatterChart = (ctx: CanvasRenderingContext2D) => {
    const padding = 40;
    const chartWidth = dimensions.width - (padding * 2);
    const chartHeight = dimensions.height - (padding * 2);
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue;

    // Draw grid lines
    if (config.showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(dimensions.width - padding, y);
        ctx.stroke();
      }
    }

    // Draw scatter points
    data.forEach((item, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = dimensions.height - padding - ((item.value - minValue) / valueRange) * chartHeight;
      
      ctx.fillStyle = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(config.title, dimensions.width / 2, 20);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find closest data point
    let closestPoint: DataPoint | TimeSeriesData | null = null;
    let minDistance = Infinity;

    data.forEach((item, index) => {
      let pointX, pointY;
      
      if (config.type === 'pie') {
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        const radius = Math.min(dimensions.width, dimensions.height) / 2 - 60;
        const total = data.reduce((sum, d) => sum + d.value, 0);
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        const labelAngle = sliceAngle / 2;
        pointX = centerX + Math.cos(labelAngle) * radius;
        pointY = centerY + Math.sin(labelAngle) * radius;
      } else {
        const padding = 40;
        const chartWidth = dimensions.width - (padding * 2);
        const chartHeight = dimensions.height - (padding * 2);
        pointX = padding + (index / (data.length - 1)) * chartWidth;
        
        if (config.type === 'line' || config.type === 'area' || config.type === 'scatter') {
          const maxValue = Math.max(...data.map(d => d.value));
          const minValue = Math.min(...data.map(d => d.value));
          const valueRange = maxValue - minValue;
          pointY = dimensions.height - padding - ((item.value - minValue) / valueRange) * chartHeight;
        } else {
          const maxValue = Math.max(...data.map(d => d.value));
          const barHeight = (item.value / maxValue) * chartHeight;
          pointY = dimensions.height - padding - barHeight;
        }
      }

      const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
      if (distance < minDistance && distance < 20) {
        minDistance = distance;
        closestPoint = item;
      }
    });

    if (closestPoint) {
      setHoveredPoint(closestPoint);
      setShowTooltip(true);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
      onDataPointHover?.(closestPoint);
    } else {
      setHoveredPoint(null);
      setShowTooltip(false);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setShowTooltip(false);
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredPoint) {
      onDataPointClick?.(hoveredPoint);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <EyeIcon className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <ChartPieIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full border border-gray-200 rounded-lg bg-white"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
        
        {/* Tooltip */}
        {showTooltip && hoveredPoint && (
          <div
            className="absolute z-10 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 pointer-events-none"
            style={{
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y - 10,
              transform: 'translateY(-100%)'
            }}
          >
            <div className="font-medium">{hoveredPoint.label}</div>
            <div className="text-gray-300">
              Value: {hoveredPoint.value.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Chart Legend */}
      {config.showLegend && (
        <div className="mt-4 flex flex-wrap gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)` }}
              />
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {data.length}
          </div>
          <div className="text-sm text-gray-500">Data Points</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.max(...data.map(d => d.value)).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Max Value</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Average</div>
        </div>
      </div>
    </div>
  );
}
