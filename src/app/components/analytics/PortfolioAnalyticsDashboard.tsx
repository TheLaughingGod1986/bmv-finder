'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Shield,
  MapPin,
  Home,
  Clock
} from 'lucide-react';
import { PortfolioAnalyticsEngine, PortfolioMetrics, PortfolioInsights, BenchmarkData } from '@/lib/analytics/portfolioAnalytics';
import { Portfolio, PortfolioProperty } from '@/types/portfolio';

interface PortfolioAnalyticsDashboardProps {
  portfolio: Portfolio;
  properties: PortfolioProperty[];
}

export default function PortfolioAnalyticsDashboard({ portfolio, properties }: PortfolioAnalyticsDashboardProps) {
  const [analyticsEngine, setAnalyticsEngine] = useState<PortfolioAnalyticsEngine | null>(null);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [insights, setInsights] = useState<PortfolioInsights | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'risk' | 'benchmarks'>('overview');

  useEffect(() => {
    if (portfolio && properties.length > 0) {
      const engine = new PortfolioAnalyticsEngine(portfolio, properties);
      setAnalyticsEngine(engine);
      
      const calculatedMetrics = engine.calculateMetrics();
      const calculatedInsights = engine.generateInsights();
      const calculatedBenchmarks = engine.calculateBenchmarks();
      
      setMetrics(calculatedMetrics);
      setInsights(calculatedInsights);
      setBenchmarks(calculatedBenchmarks);
      setLoading(false);
    }
  }, [portfolio, properties]);

  if (loading || !metrics || !insights) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'high': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
    }
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Portfolio Analytics
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive performance analysis for {portfolio.name}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(insights.riskAnalysis.overallRisk)}`}>
              {insights.riskAnalysis.overallRisk.toUpperCase()} RISK
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(metrics.totalValue)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className={`text-sm font-medium ${getPerformanceColor(metrics.totalGain)}`}>
              {formatCurrency(metrics.totalGain)} ({formatPercentage(metrics.totalGainPercentage)})
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Annualized Return</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(metrics.annualizedReturn * 100)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              vs {formatPercentage(insights.marketComparison.benchmarkReturn)} benchmark
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Yield</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(metrics.currentYield)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Percent className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Rental income yield
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Properties</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.propertiesCount}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Home className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Avg {Math.round(metrics.averageHoldingPeriod / 365)} years holding
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'performance', label: 'Performance', icon: Activity },
              { id: 'risk', label: 'Risk Analysis', icon: Shield },
              { id: 'benchmarks', label: 'Benchmarks', icon: Target },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Performers */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Performers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {insights.topPerformers.map((property, index) => (
                    <div key={property.propertyId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          #{index + 1}
                        </span>
                        <span className={`text-sm font-medium ${getPerformanceColor(property.gainPercentage)}`}>
                          {formatPercentage(property.gainPercentage)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                        {property.address}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {formatCurrency(property.gain)} gain
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {insights.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className={`p-2 rounded-lg ${
                        rec.priority === 'high' ? 'bg-red-100 dark:bg-red-900/20' :
                        rec.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                        'bg-blue-100 dark:bg-blue-900/20'
                      }`}>
                        {rec.type === 'buy' && <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />}
                        {rec.type === 'sell' && <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />}
                        {rec.type === 'hold' && <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                        {rec.type === 'diversify' && <PieChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {rec.message}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {rec.priority.toUpperCase()} PRIORITY
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Property Performance Table */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Property Performance
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-100 dark:bg-gray-600">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Property
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Return
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Risk
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                          {insights.topPerformers.concat(insights.underPerformers).map((property) => (
                            <tr key={property.propertyId}>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                <div className="truncate max-w-32">
                                  {property.address}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={getPerformanceColor(property.gainPercentage)}>
                                  {formatPercentage(property.gainPercentage)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(property.riskLevel)}`}>
                                  {property.riskLevel}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Risk Analysis */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Risk Breakdown
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Concentration Risk
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {insights.riskAnalysis.concentrationRisk.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(insights.riskAnalysis.concentrationRisk, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Location Risk
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {insights.riskAnalysis.locationRisk.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(insights.riskAnalysis.locationRisk, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Market Risk
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {insights.riskAnalysis.marketRisk.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(insights.riskAnalysis.marketRisk, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Risk Analysis Tab */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Diversification Score */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Diversification Score
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {metrics.diversificationScore.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      out of 100
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full" 
                        style={{ width: `${metrics.diversificationScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Risk Score */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Overall Risk Score
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {metrics.riskScore.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      out of 100
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          metrics.riskScore < 30 ? 'bg-green-500' :
                          metrics.riskScore < 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${metrics.riskScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Benchmarks Tab */}
          {activeTab === 'benchmarks' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Performance vs Benchmarks
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-100 dark:bg-gray-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Benchmark
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Return
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Volatility
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Sharpe Ratio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Max Drawdown
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {benchmarks.map((benchmark, index) => (
                        <tr key={index} className={benchmark.name === 'Your Portfolio' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {benchmark.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatPercentage(benchmark.return)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatPercentage(benchmark.volatility)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {benchmark.sharpeRatio.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatPercentage(benchmark.maxDrawdown)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
