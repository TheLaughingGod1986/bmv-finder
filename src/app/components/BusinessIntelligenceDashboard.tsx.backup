'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  BanknotesIcon,
  HomeIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface BusinessMetrics {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    growthRate: number;
  };
  searches: {
    total: number;
    thisMonth: number;
    averagePerUser: number;
    growthRate: number;
  };
  predictions: {
    total: number;
    thisMonth: number;
    accuracy: number;
    averageConfidence: number;
  };
  revenue: {
    monthly: number;
    growth: number;
    averagePerUser: number;
    projections: number;
  };
  market: {
    totalProperties: number;
    averagePrice: number;
    priceGrowth: number;
    hotMarkets: Array<{ area: string; growth: number; volume: number }>;
  };
}

interface TimeSeriesData {
  date: string;
  value: number;
  label: string;
}

export default function BusinessIntelligenceDashboard() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('searches');

  // Mock data - replace with real API calls
  const mockMetrics = useMemo((): BusinessMetrics => ({
    users: {
      total: 1247,
      active: 892,
      newThisMonth: 156,
      growthRate: 12.5
    },
    searches: {
      total: 45678,
      thisMonth: 3421,
      averagePerUser: 36.7,
      growthRate: 8.3
    },
    predictions: {
      total: 12345,
      thisMonth: 987,
      accuracy: 94.2,
      averageConfidence: 87.5
    },
    revenue: {
      monthly: 45600,
      growth: 15.8,
      averagePerUser: 36.5,
      projections: 520000
    },
    market: {
      totalProperties: 234567,
      averagePrice: 285000,
      priceGrowth: 6.2,
      hotMarkets: [
        { area: 'Manchester', growth: 12.5, volume: 2345 },
        { area: 'Birmingham', growth: 9.8, volume: 1890 },
        { area: 'Leeds', growth: 8.4, volume: 1567 },
        { area: 'Liverpool', growth: 7.2, volume: 1234 }
      ]
    }
  }), []);

  const mockTimeSeriesData: Record<string, TimeSeriesData[]> = {
    searches: [
      { date: '2024-01-01', value: 120, label: 'Jan 1' },
      { date: '2024-01-02', value: 145, label: 'Jan 2' },
      { date: '2024-01-03', value: 132, label: 'Jan 3' },
      { date: '2024-01-04', value: 167, label: 'Jan 4' },
      { date: '2024-01-05', value: 189, label: 'Jan 5' },
      { date: '2024-01-06', value: 156, label: 'Jan 6' },
      { date: '2024-01-07', value: 178, label: 'Jan 7' }
    ],
    users: [
      { date: '2024-01-01', value: 45, label: 'Jan 1' },
      { date: '2024-01-02', value: 52, label: 'Jan 2' },
      { date: '2024-01-03', value: 48, label: 'Jan 3' },
      { date: '2024-01-04', value: 61, label: 'Jan 4' },
      { date: '2024-01-05', value: 67, label: 'Jan 5' },
      { date: '2024-01-06', value: 58, label: 'Jan 6' },
      { date: '2024-01-07', value: 63, label: 'Jan 7' }
    ],
    predictions: [
      { date: '2024-01-01', value: 23, label: 'Jan 1' },
      { date: '2024-01-02', value: 28, label: 'Jan 2' },
      { date: '2024-01-03', value: 25, label: 'Jan 3' },
      { date: '2024-01-04', value: 32, label: 'Jan 4' },
      { date: '2024-01-05', value: 35, label: 'Jan 5' },
      { date: '2024-01-06', value: 29, label: 'Jan 6' },
      { date: '2024-01-07', value: 31, label: 'Jan 7' }
    ]
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMetrics(mockMetrics);
      setLoading(false);
    }, 1000);
  }, [mockMetrics]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) return <ArrowUpIcon className="w-4 h-4 text-green-500" />;
    if (value < 0) return <ArrowDownIcon className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Intelligence Dashboard</h1>
            <p className="text-gray-600">Real-time insights into your property platform performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Users */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <UsersIcon className="w-8 h-8 text-blue-600" />
              <div className="flex items-center space-x-1">
                {getGrowthIcon(metrics.users.growthRate)}
                <span className={`text-sm font-medium ${getGrowthColor(metrics.users.growthRate)}`}>
                  {formatPercentage(metrics.users.growthRate)}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{formatNumber(metrics.users.total)}</p>
            <p className="text-sm text-gray-600 mt-2">
              {metrics.users.active} active • {metrics.users.newThisMonth} new this month
            </p>
          </div>

          {/* Searches */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 text-green-600" />
              <div className="flex items-center space-x-1">
                {getGrowthIcon(metrics.searches.growthRate)}
                <span className={`text-sm font-medium ${getGrowthColor(metrics.searches.growthRate)}`}>
                  {formatPercentage(metrics.searches.growthRate)}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Total Searches</h3>
            <p className="text-3xl font-bold text-green-600">{formatNumber(metrics.searches.total)}</p>
            <p className="text-sm text-gray-600 mt-2">
              {metrics.searches.thisMonth} this month • {metrics.searches.averagePerUser.toFixed(1)} per user
            </p>
          </div>

          {/* Predictions */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                                <ArrowTrendingUpIcon className="w-8 h-8 text-purple-600" />
              <div className="text-sm font-medium text-purple-600">
                {metrics.predictions.accuracy.toFixed(1)}% accurate
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Predictions Made</h3>
            <p className="text-3xl font-bold text-purple-600">{formatNumber(metrics.predictions.total)}</p>
            <p className="text-sm text-gray-600 mt-2">
              {metrics.predictions.thisMonth} this month • {metrics.predictions.averageConfidence.toFixed(1)}% confidence
            </p>
          </div>

          {/* Revenue */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                              <BanknotesIcon className="w-8 h-8 text-orange-600" />
              <div className="flex items-center space-x-1">
                {getGrowthIcon(metrics.revenue.growth)}
                <span className={`text-sm font-medium ${getGrowthColor(metrics.revenue.growth)}`}>
                  {formatPercentage(metrics.revenue.growth)}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
            <p className="text-3xl font-bold text-orange-600">{formatCurrency(metrics.revenue.monthly)}</p>
            <p className="text-sm text-gray-600 mt-2">
              {formatCurrency(metrics.revenue.averagePerUser)} per user • {formatCurrency(metrics.revenue.projections)} projected
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Activity Trends</h2>
            <div className="flex space-x-2">
              {['searches', 'users', 'predictions'].map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    selectedMetric === metric
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-end justify-between space-x-2">
            {mockTimeSeriesData[selectedMetric]?.map((data, index) => {
              const maxValue = Math.max(...mockTimeSeriesData[selectedMetric].map(d => d.value));
              const height = (data.value / maxValue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">{data.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Market Insights</h2>
            <MapPinIcon className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Total Properties</p>
                <p className="text-sm text-gray-600">In database</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.market.totalProperties)}</p>
                <p className="text-sm text-gray-600">properties</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Average Price</p>
                <p className="text-sm text-gray-600">Market average</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.market.averagePrice)}</p>
                <p className={`text-sm ${getGrowthColor(metrics.market.priceGrowth)}`}>
                  {formatPercentage(metrics.market.priceGrowth)} growth
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">Hot Markets</h3>
            <div className="space-y-3">
              {metrics.market.hotMarkets.map((market, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{market.area}</p>
                    <p className="text-sm text-gray-600">{formatNumber(market.volume)} properties</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${getGrowthColor(market.growth)}`}>
                      {formatPercentage(market.growth)}
                    </p>
                    <p className="text-sm text-gray-600">growth</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <ClockIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">2.3s</p>
            <p className="text-sm text-gray-600">Average Response Time</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <EyeIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">94.2%</p>
            <p className="text-sm text-gray-600">Uptime</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <CalendarIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">87.5%</p>
            <p className="text-sm text-gray-600">User Retention</p>
          </div>
        </div>
      </div>
    </div>
  );
} 