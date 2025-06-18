'use client';

import { TrendingUp, Home, PoundSterling, Target, Sparkles, Zap } from 'lucide-react';

interface StatsPanelProps {
  stats: any;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  if (!stats) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateAverageBMV = () => {
    if (!stats.properties || stats.properties.length === 0) return 0;
    const totalBMV = stats.properties.reduce((sum: number, p: any) => sum + p.bmvPercentage, 0);
    return (totalBMV / stats.properties.length).toFixed(1);
  };

  const calculateAverageYield = () => {
    if (!stats.properties || stats.properties.length === 0) return 0;
    const totalYield = stats.properties.reduce((sum: number, p: any) => sum + p.rentalYield, 0);
    return (totalYield / stats.properties.length).toFixed(1);
  };

  const findBestDeal = () => {
    if (!stats.properties || stats.properties.length === 0) return null;
    return stats.properties.reduce((best: any, current: any) => 
      current.bmvPercentage > best.bmvPercentage ? current : best
    );
  };

  const bestDeal = findBestDeal();

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-200 to-purple-200 rounded-full opacity-20 -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full opacity-20 translate-y-12 -translate-x-12"></div>
      
      <h3 className="text-lg font-semibold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-6 relative z-10">
        Scan Results for {stats.postcode}
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
              <p className="text-2xl font-bold text-violet-600">{stats.totalProperties}</p>
            </div>
          </div>
        </div>

        {/* Average BMV */}
        <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 rounded-xl border border-emerald-200/50 hover-lift group">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-200">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Average BMV</p>
              <p className="text-2xl font-bold text-emerald-600">{calculateAverageBMV()}%</p>
            </div>
          </div>
        </div>

        {/* Average Yield */}
        <div className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-4 rounded-xl border border-cyan-200/50 hover-lift group">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-200">
              <PoundSterling className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Average Yield</p>
              <p className="text-2xl font-bold text-cyan-600">{calculateAverageYield()}%</p>
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
              <p className="text-2xl font-bold text-amber-600">{stats.areaGrowth || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Best Deal Highlight */}
      {bestDeal && (
        <div className="mt-6 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 p-6 rounded-xl border border-emerald-200/50 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full opacity-30 -translate-y-12 translate-x-12"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Sparkles className="h-5 w-5 text-emerald-600 mr-2" />
                Best BMV Opportunity
              </h4>
              <p className="text-sm text-gray-600 mb-3">{bestDeal.property.title}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm">
                  <span className="text-gray-600">Price: </span>
                  <span className="font-semibold text-violet-600">{formatPrice(bestDeal.property.price)}</span>
                </span>
                <span className="text-sm">
                  <span className="text-gray-600">BMV: </span>
                  <span className="font-semibold text-emerald-600">+{bestDeal.bmvPercentage}%</span>
                </span>
                <span className="text-sm">
                  <span className="text-gray-600">Yield: </span>
                  <span className="font-semibold text-cyan-600">{bestDeal.rentalYield}%</span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                +{bestDeal.bmvPercentage}%
              </div>
              <div className="text-sm text-gray-600">Below Market Value</div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Info */}
      <div className="mt-6 text-center relative z-10">
        <p className="text-sm text-gray-500">
          Scan completed at {new Date(stats.scannedAt).toLocaleString('en-GB')}
        </p>
        <p className="text-xs text-gray-400 mt-1 flex items-center justify-center">
          <Zap className="h-3 w-3 mr-1 text-violet-500" />
          Data sourced from Rightmove, Zoopla, and OnTheMarket
        </p>
      </div>
    </div>
  );
} 