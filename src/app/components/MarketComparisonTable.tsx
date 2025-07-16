'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, SortAsc, SortDesc, Filter, Download, Search } from 'lucide-react';

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

interface MarketComparisonTableProps {
  data: MarketData[];
}

type SortField = 'region' | 'currentIndex' | 'yoyGrowth' | 'momGrowth' | 'volatility' | 'investmentScore';
type SortDirection = 'asc' | 'desc';

export default function MarketComparisonTable({ data }: MarketComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>('investmentScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<string[]>(['low', 'medium', 'high']);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedData = data
    .filter(region => 
      region.region.toLowerCase().includes(searchTerm.toLowerCase()) &&
      selectedRiskLevels.includes(region.riskLevel)
    )
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'region') {
        aValue = a.region.toLowerCase();
        bValue = b.region.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  };

  const getGrowthColor = (value: number) => {
    if (value > 5) return 'text-green-600';
    if (value > 0) return 'text-yellow-600';
    return 'text-red-600';
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  const exportToCSV = () => {
    const headers = ['Region', 'HPI Index', 'YoY Growth (%)', 'MoM Growth (%)', 'Volatility (%)', 'Risk Level', 'Investment Score', 'Trend'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedData.map(region => [
        region.region,
        region.currentIndex,
        region.yoyGrowth.toFixed(2),
        region.momGrowth.toFixed(2),
        region.volatility.toFixed(2),
        region.riskLevel,
        region.investmentScore,
        region.trend
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'market-comparison.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-900">Market Comparison Table</h3>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search regions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Risk:</span>
            {(['low', 'medium', 'high'] as const).map((risk) => (
              <button
                key={risk}
                onClick={() => setSelectedRiskLevels(prev => 
                  prev.includes(risk) 
                    ? prev.filter(r => r !== risk)
                    : [...prev, risk]
                )}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedRiskLevels.includes(risk)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {risk.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-gray-600">
          Showing {filteredAndSortedData.length} of {data.length} regions
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                <button
                  onClick={() => handleSort('region')}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Region
                  {getSortIcon('region')}
                </button>
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">
                <button
                  onClick={() => handleSort('currentIndex')}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors ml-auto"
                >
                  HPI Index
                  {getSortIcon('currentIndex')}
                </button>
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">
                <button
                  onClick={() => handleSort('yoyGrowth')}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors ml-auto"
                >
                  YoY Growth
                  {getSortIcon('yoyGrowth')}
                </button>
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">
                <button
                  onClick={() => handleSort('momGrowth')}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors ml-auto"
                >
                  MoM Growth
                  {getSortIcon('momGrowth')}
                </button>
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">
                <button
                  onClick={() => handleSort('volatility')}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors ml-auto"
                >
                  Volatility
                  {getSortIcon('volatility')}
                </button>
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900">Risk Level</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900">Trend</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">
                <button
                  onClick={() => handleSort('investmentScore')}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors ml-auto"
                >
                  Investment Score
                  {getSortIcon('investmentScore')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((region, index) => (
              <motion.tr
                key={region.region}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4 font-medium text-gray-900">
                  {region.region}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">
                  {region.currentIndex.toLocaleString()}
                </td>
                <td className={`py-3 px-4 text-right font-semibold ${getGrowthColor(region.yoyGrowth)}`}>
                  {region.yoyGrowth > 0 ? '+' : ''}{region.yoyGrowth.toFixed(1)}%
                </td>
                <td className={`py-3 px-4 text-right font-semibold ${getGrowthColor(region.momGrowth)}`}>
                  {region.momGrowth > 0 ? '+' : ''}{region.momGrowth.toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">
                  {region.volatility.toFixed(2)}%
                </td>
                <td className="py-3 px-4 text-center">
                  {getRiskBadge(region.riskLevel)}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {getTrendIcon(region.trend)}
                    <span className="text-xs capitalize">{region.trend}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-semibold text-gray-900">{region.investmentScore}/100</span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${region.investmentScore}%`,
                          backgroundColor: region.investmentScore >= 80 ? '#10B981' : 
                                          region.investmentScore >= 60 ? '#F59E0B' : '#EF4444'
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Average Growth</p>
            <p className="font-semibold text-gray-900">
              {(filteredAndSortedData.reduce((sum, r) => sum + r.yoyGrowth, 0) / filteredAndSortedData.length).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-600">Average Volatility</p>
            <p className="font-semibold text-gray-900">
              {(filteredAndSortedData.reduce((sum, r) => sum + r.volatility, 0) / filteredAndSortedData.length).toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-gray-600">High Risk Regions</p>
            <p className="font-semibold text-red-600">
              {filteredAndSortedData.filter(r => r.riskLevel === 'high').length}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Avg Investment Score</p>
            <p className="font-semibold text-gray-900">
              {Math.round(filteredAndSortedData.reduce((sum, r) => sum + r.investmentScore, 0) / filteredAndSortedData.length)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 