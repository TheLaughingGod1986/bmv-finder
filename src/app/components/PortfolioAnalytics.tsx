'use client';

import { TrendingUp, PieChart, Home, PoundSterling } from 'lucide-react';

interface PortfolioStats {
  totalProperties: number;
  totalValue: number;
  totalGrowth: number;
  averageYield: number;
  totalDiversification: number;
}

interface PortfolioAnalyticsProps {
  stats: PortfolioStats;
}

export default function PortfolioAnalytics({ stats }: PortfolioAnalyticsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center">
          <Home className="h-8 w-8 text-blue-600" />
          <div className="ml-3">
            <p className="text-sm font-medium text-blue-600">Properties</p>
            <p className="text-2xl font-bold text-blue-900">{stats.totalProperties}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center">
          <PoundSterling className="h-8 w-8 text-green-600" />
          <div className="ml-3">
            <p className="text-sm font-medium text-green-600">Total Value</p>
            <p className="text-2xl font-bold text-green-900">£{(stats.totalValue / 1000).toFixed(0)}k</p>
          </div>
        </div>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-purple-600" />
          <div className="ml-3">
            <p className="text-sm font-medium text-purple-600">Growth</p>
            <p className="text-2xl font-bold text-purple-900">{stats.totalGrowth.toFixed(1)}%</p>
          </div>
        </div>
      </div>
      
      <div className="bg-orange-50 p-4 rounded-lg">
        <div className="flex items-center">
          <PieChart className="h-8 w-8 text-orange-600" />
          <div className="ml-3">
            <p className="text-sm font-medium text-orange-600">Avg Yield</p>
            <p className="text-2xl font-bold text-orange-900">{stats.averageYield.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
} 