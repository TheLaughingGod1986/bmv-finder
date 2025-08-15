'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Minus, Filter, ArrowUpDown } from 'lucide-react';

interface MarketData {
  region: string;
  currentIndex: number;
  yoyGrowth: number;
  timeframeGrowth: number;
  momGrowth: number;
  volatility: number;
  trend: 'rising' | 'falling' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  investmentScore: number;
  lastUpdated: string;
  dataPoints: number;
}

interface MarketComparisonTableProps {
  data: MarketData[];
}

export default function MarketComparisonTable({ data }: MarketComparisonTableProps) {
  const [sortField, setSortField] = useState<keyof MarketData>('investmentScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<Set<string>>(new Set(['low', 'medium', 'high']));

  const handleSort = (field: keyof MarketData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleRiskLevel = (level: string) => {
    const newSelected = new Set(selectedRiskLevels);
    if (newSelected.has(level)) {
      newSelected.delete(level);
    } else {
      newSelected.add(level);
    }
    setSelectedRiskLevels(newSelected);
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(region => selectedRiskLevels.has(region.riskLevel));
    
    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [data, sortField, sortDirection, selectedRiskLevels]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvestmentScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">Market Comparison Table</h2>
        </div>
      </div>

      {/* Risk Level Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Risk:</span>
        </div>
        {(['low', 'medium', 'high'] as const).map((level) => (
          <button
            key={level}
            onClick={() => toggleRiskLevel(level)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedRiskLevels.has(level)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {level.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600 mb-4">
        Showing {filteredAndSortedData.length} of {data.length} regions
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Region</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">HPI Index</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Growth</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">YoY Growth</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Volatility</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Risk Level</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Trend</th>
              <th 
                className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('investmentScore')}
              >
                <div className="flex items-center gap-1">
                  Investment Score
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((region, index) => (
              <motion.tr
                key={region.region}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4 font-medium text-gray-900">{region.region}</td>
                <td className="py-3 px-4 text-gray-700">
                  {region.currentIndex?.toLocaleString() || 'N/A'}
                </td>
                <td className="py-3 px-4">
                  <span className={`font-medium ${region.timeframeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {region.timeframeGrowth >= 0 ? '+' : ''}{region.timeframeGrowth?.toFixed(2) || '0.00'}%
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`font-medium ${region.yoyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {region.yoyGrowth >= 0 ? '+' : ''}{region.yoyGrowth?.toFixed(2) || '0.00'}%
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {region.volatility?.toFixed(2) || '0.00'}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(region.riskLevel)}`}>
                    {region.riskLevel.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(region.trend)}
                    <span className="capitalize">{region.trend}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`font-bold ${getInvestmentScoreColor(region.investmentScore)}`}>
                    {region.investmentScore}/100
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No regions match the current filters
        </div>
      )}
    </motion.div>
  );
} 