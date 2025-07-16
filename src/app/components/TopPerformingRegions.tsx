'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Award, Trophy, AlertTriangle, BarChart3, MapPin, Calendar } from 'lucide-react';

interface MarketData {
  region: string;
  currentIndex: number;
  yoyGrowth: number;
  momGrowth: number;
  volatility: number;
  trend: 'rising' | 'falling' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  investmentScore: number;
  lastUpdated: string;
}

interface TopPerformingRegionsProps {
  data: MarketData[];
}

export default function TopPerformingRegions({ data }: TopPerformingRegionsProps) {
  const topPerformers = [...data]
    .sort((a, b) => b.yoyGrowth - a.yoyGrowth)
    .slice(0, 5);

  const worstPerformers = [...data]
    .sort((a, b) => a.yoyGrowth - b.yoyGrowth)
    .slice(0, 5);

  const getGrowthColor = (growth: number) => {
    if (growth > 5) return 'text-green-600';
    if (growth > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[risk]}`}>
        {risk.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h3 className="text-xl font-semibold text-gray-900">Top Performing Regions</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-green-500" />
            <h4 className="text-lg font-semibold text-gray-900">Best Performers</h4>
          </div>
          
          <div className="space-y-3">
            {topPerformers.map((region, index) => (
              <motion.div
                key={region.region}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{region.region}</p>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(region.trend)}
                        <span className="text-sm text-gray-600">{region.trend}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getGrowthColor(region.yoyGrowth)}`}>
                      {region.yoyGrowth > 0 ? '+' : ''}{region.yoyGrowth.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-600">YoY Growth</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">HPI Index</p>
                    <p className="font-semibold text-gray-900">{region.currentIndex.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">MoM Change</p>
                    <p className={`font-semibold ${getGrowthColor(region.momGrowth)}`}>
                      {region.momGrowth > 0 ? '+' : ''}{region.momGrowth.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Risk</p>
                    {getRiskBadge(region.riskLevel)}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Investment Score</span>
                    <span className="text-sm font-semibold text-gray-900">{region.investmentScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${region.investmentScore}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Worst Performers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h4 className="text-lg font-semibold text-gray-900">Challenged Regions</h4>
          </div>
          
          <div className="space-y-3">
            {worstPerformers.map((region, index) => (
              <motion.div
                key={region.region}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{region.region}</p>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(region.trend)}
                        <span className="text-sm text-gray-600">{region.trend}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getGrowthColor(region.yoyGrowth)}`}>
                      {region.yoyGrowth > 0 ? '+' : ''}{region.yoyGrowth.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-600">YoY Growth</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">HPI Index</p>
                    <p className="font-semibold text-gray-900">{region.currentIndex.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">MoM Change</p>
                    <p className={`font-semibold ${getGrowthColor(region.momGrowth)}`}>
                      {region.momGrowth > 0 ? '+' : ''}{region.momGrowth.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Risk</p>
                    {getRiskBadge(region.riskLevel)}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-red-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Investment Score</span>
                    <span className="text-sm font-semibold text-gray-900">{region.investmentScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${region.investmentScore}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-semibold text-gray-900 mb-3">Performance Summary</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Best Growth</p>
            <p className="font-semibold text-green-600">
              {topPerformers[0]?.region}: {topPerformers[0]?.yoyGrowth.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-600">Worst Growth</p>
            <p className="font-semibold text-red-600">
              {worstPerformers[0]?.region}: {worstPerformers[0]?.yoyGrowth.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-600">Growth Spread</p>
            <p className="font-semibold text-gray-900">
              {((topPerformers[0]?.yoyGrowth || 0) - (worstPerformers[0]?.yoyGrowth || 0)).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-600">Avg Investment Score</p>
            <p className="font-semibold text-gray-900">
              {Math.round(data.reduce((sum, r) => sum + r.investmentScore, 0) / data.length)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 