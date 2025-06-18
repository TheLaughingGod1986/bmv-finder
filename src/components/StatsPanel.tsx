'use client';

import { TrendingUp, Home, PoundSterling, Target, Sparkles, Zap } from 'lucide-react';
import { AreaGrowthData } from '@/types';

interface StatsPanelProps {
  areaGrowth: AreaGrowthData;
  totalProperties: number;
}

export default function StatsPanel({ areaGrowth, totalProperties }: StatsPanelProps) {
  if (!areaGrowth) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-200 to-purple-200 rounded-full opacity-20 -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full opacity-20 translate-y-12 -translate-x-12"></div>
      
      <h3 className="text-lg font-semibold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-6 relative z-10">
        Scan Results for {areaGrowth.postcode}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* Total Properties */}
        <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-4 rounded-xl border border-violet-200/50 hover-lift group">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-200">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Properties Found</p>
              <p className="text-2xl font-bold text-violet-600">{totalProperties}</p>
            </div>
          </div>
        </div>

        {/* Area Growth */}
        <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4 rounded-xl border border-amber-200/50 hover-lift group">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-200">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Area Growth</p>
              <p className="text-2xl font-bold text-amber-600">{areaGrowth.growthPercentage}%</p>
            </div>
          </div>
        </div>

        {/* Timeframe */}
        <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 rounded-xl border border-emerald-200/50 hover-lift group">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-200">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Timeframe</p>
              <p className="text-2xl font-bold text-emerald-600">{areaGrowth.timeframe}</p>
            </div>
          </div>
        </div>

        {/* Data Points */}
        <div className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-4 rounded-xl border border-cyan-200/50 hover-lift group">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-200">
              <PoundSterling className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Data Points</p>
              <p className="text-2xl font-bold text-cyan-600">{areaGrowth.dataPoints.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Chart Preview */}
      {areaGrowth.dataPoints.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-xl border border-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-200 to-gray-200 rounded-full opacity-30 -translate-y-12 translate-x-12"></div>
          
          <div className="relative z-10">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Sparkles className="h-5 w-5 text-amber-600 mr-2" />
              Price Growth Trend ({areaGrowth.timeframe})
            </h4>
            
            <div className="flex items-end justify-between h-20 space-x-2">
              {areaGrowth.dataPoints.slice(-6).map((point, index) => {
                const maxPrice = Math.max(...areaGrowth.dataPoints.map(p => p.averagePrice));
                const height = (point.averagePrice / maxPrice) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-amber-500 to-orange-500 rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-1">
                      {point.date.split('-')[1]}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between items-center mt-4 text-sm">
              <span className="text-gray-600">
                Start: {formatPrice(areaGrowth.dataPoints[0]?.averagePrice || 0)}
              </span>
              <span className="text-gray-600">
                Current: {formatPrice(areaGrowth.dataPoints[areaGrowth.dataPoints.length - 1]?.averagePrice || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Scan Info */}
      <div className="mt-6 text-center relative z-10">
        <p className="text-sm text-gray-500">
          Scan completed at {new Date().toLocaleString('en-GB')}
        </p>
        <p className="text-xs text-gray-400 mt-1 flex items-center justify-center">
          <Zap className="h-3 w-3 mr-1 text-violet-500" />
          Data sourced from Rightmove, Zoopla, and OnTheMarket
        </p>
      </div>
    </div>
  );
} 