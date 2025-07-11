'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Filler
} from 'chart.js';
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Calendar, 
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Info,
  HelpCircle
} from 'lucide-react';
import { postcodeToRegion, isValidPostcodeFormat } from '@/utils/postcodeToRegion';
import { format } from 'date-fns';
import { useUser } from '@supabase/auth-helpers-react';
import { useUserTier } from '@/hooks/useUserTier';
import UpgradePrompt from '../components/UpgradePrompt';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HpiData {
  region: string;
  date: string;
  index: number;
  yoyGrowth?: number; // <-- update field name
  monthOverMonth?: number;
  regionType: string;
}

interface TimeSeriesData {
  date: string;
  avgIndex: number;
  minIndex: number;
  maxIndex: number;
  count: number;
}

const REGIONS = [
  'United Kingdom',
  'London',
  'South East',
  'South West',
  'East of England',
  'West Midlands',
  'East Midlands',
  'Yorkshire and The Humber',
  'North West',
  'North East',
  'Wales',
  'Scotland',
  'Northern Ireland'
];

export default function HpiDashboard() {
  const [hpiData, setHpiData] = useState<HpiData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('United Kingdom');
  const [postcodeInput, setPostcodeInput] = useState('');
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '2020-01', end: '2024-12' });
  const [dateLimits, setDateLimits] = useState<{ min: string; max: string }>({ min: '2020-01', max: '2024-12' });
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'comparison'>('chart');
  const [showHelp, setShowHelp] = useState(false);
  const user = useUser();
  const { tier, loading: tierLoading } = useUserTier(user?.id);
  const [lookupCount, setLookupCount] = useState<number>(0);
  const [limitHit, setLimitHit] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Fetch lookup count from profile
    fetch(`/api/profile-usage?userId=${user.id}`)
      .then(res => res.json())
      .then(data => setLookupCount(data.lookup_count || 0));
  }, [user]);

  useEffect(() => {
    // Fetch min/max date range on mount
    async function fetchDateLimits() {
      try {
        const res = await fetch('/api/hpi/date-range');
        const result = await res.json();
        if (result.success && result.minDate && result.maxDate) {
          setDateLimits({ min: result.minDate.slice(0, 7), max: result.maxDate.slice(0, 7) });
          setDateRange({ start: result.minDate.slice(0, 7), end: result.maxDate.slice(0, 7) });
        }
      } catch (err) {
        // fallback to defaults
      }
    }
    fetchDateLimits();
  }, []);

  const fetchHpiData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch latest data for all regions
      const response = await fetch('/api/hpi');
      const result = await response.json();

      if (result.success) {
        setHpiData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch HPI data');
      }

      // Fetch time series data for selected region
      const timeSeriesResponse = await fetch('/api/hpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: selectedRegion,
          startDate: dateRange.start,
          endDate: dateRange.end,
          groupBy: 'month'
        })
      });

      const timeSeriesResult = await timeSeriesResponse.json();
      if (timeSeriesResult.success) {
        setTimeSeriesData(timeSeriesResult.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedRegion, dateRange]);

  useEffect(() => {
    fetchHpiData();
  }, [fetchHpiData]);

  const handlePostcodeSearch = async () => {
    setPostcodeError(null);
    if (!postcodeInput || !isValidPostcodeFormat(postcodeInput)) {
      setPostcodeError('Please enter a valid UK postcode.');
      return;
    }
    if (tier === 'free' && lookupCount >= 3) {
      setLimitHit(true);
      return;
    }
    const region = postcodeToRegion(postcodeInput);
    if (!region || region === 'United Kingdom') {
      setPostcodeError('Could not map postcode to a specific HPI region. Please try a different postcode or select a region manually.');
      return;
    }
    setSelectedRegion(region);
    setPostcodeError(null);

    if (tier === 'free' && lookupCount < 3) {
      await fetch('/api/increment-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, type: 'lookup' }),
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (value: number) => {
    if (value > 5) return 'text-green-600';
    if (value > 0) return 'text-blue-600';
    if (value < -5) return 'text-red-600';
    return 'text-orange-600';
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  // Chart data for time series
  const timeSeriesChartData = {
    labels: timeSeriesData.map(d => d.date),
    datasets: [
      {
        label: 'HPI Index',
        data: timeSeriesData.map(d => d.avgIndex),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Chart data for regional comparison
  const regionalChartData = {
    labels: hpiData.map(d => d.region),
    datasets: [
      {
        label: 'Current HPI Index',
        data: hpiData.map(d => d.index),
        backgroundColor: hpiData.map(d => 
          d.yoyGrowth && d.yoyGrowth > 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: hpiData.map(d => 
          d.yoyGrowth && d.yoyGrowth > 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
        ),
        borderWidth: 2
      }
    ]
  };

  // Growth comparison data
  const growthData = {
    labels: hpiData.filter(d => d.yoyGrowth !== undefined).map(d => d.region),
    datasets: [
      {
        label: 'Year-over-Year Growth',
        data: hpiData.filter(d => d.yoyGrowth !== undefined).map(d => d.yoyGrowth!),
        backgroundColor: hpiData.filter(d => d.yoyGrowth !== undefined).map(d => 
          d.yoyGrowth! > 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: hpiData.filter(d => d.yoyGrowth !== undefined).map(d => 
          d.yoyGrowth! > 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
        ),
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'House Price Index Trends'
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  // Helper to format YYYY-MM as 'MMM YYYY'
  const formatMonthYear = (ym: string) => {
    if (!ym) return '';
    const [year, month] = ym.split('-');
    if (!year || !month) return ym;
    return format(new Date(Number(year), Number(month) - 1), 'MMM yyyy');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchHpiData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Standardized Header */}
      <div className="text-center mb-10 max-w-3xl mx-auto pt-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-0" id="page-title">House Price Index Dashboard</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4" id="page-description">
          UK property market trends and analysis
        </p>
        <span>Current Plan: <b>{tier?.toUpperCase()}</b></span>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Understanding House Price Index (HPI) Data
            </h2>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showHelp ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          {showHelp && (
            <div className="space-y-4 text-sm text-blue-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">What is HPI?</h3>
                  <p className="mb-2">The House Price Index (HPI) measures changes in house prices over time. It's calculated using data from property sales and provides a standardized way to track market trends.</p>
                  <p><strong>Base year:</strong> 2015 = 100. An index of 120 means prices are 20% higher than in 2015.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Understanding Growth Rates</h3>
                  <ul className="space-y-1">
                    <li><strong>YoY Growth:</strong> Year-over-Year change (e.g., +5.2% means prices are 5.2% higher than the same month last year)</li>
                    <li><strong>MoM Growth:</strong> Month-over-Month change (e.g., +0.3% means prices are 0.3% higher than last month)</li>
                    <li><strong>Positive values:</strong> Prices are increasing</li>
                    <li><strong>Negative values:</strong> Prices are decreasing</li>
                  </ul>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Regional Data</h3>
                  <p className="mb-2">HPI data is available for different UK regions. Each region may show different trends based on local market conditions, economic factors, and demand.</p>
                  <p><strong>Tip:</strong> Use the postcode search to find HPI data for your specific area.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Data Sources</h3>
                  <p className="mb-2">This dashboard uses official House Price Index data from the Office for National Statistics (ONS) and other government sources.</p>
                  <p><strong>Update frequency:</strong> Data is typically updated monthly with a 2-3 month lag.</p>
                </div>
              </div>
              
              <div className="bg-blue-100 p-3 rounded-lg">
                <h3 className="font-semibold mb-1">💡 How to Use This Dashboard</h3>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Search by postcode</strong> to see HPI data for your local area</li>
                  <li>• <strong>Select different regions</strong> to compare market performance</li>
                  <li>• <strong>Adjust date ranges</strong> to analyze trends over different periods</li>
                  <li>• <strong>Switch between views</strong> to see data in different formats</li>
                  <li>• <strong>Monitor growth rates</strong> to understand market momentum</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {/* Show available date range */}
          <div className="mb-2 text-sm text-gray-500">
            Available: {formatMonthYear(dateLimits.min)} – {formatMonthYear(dateLimits.max)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Search by Postcode
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={postcodeInput}
                  onChange={e => setPostcodeInput(e.target.value)}
                  placeholder="e.g. SW1A 1AA"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <button
                  onClick={handlePostcodeSearch}
                  className="rounded-full font-semibold shadow bg-primary-500 text-white px-5 py-2.5 hover:bg-primary-600 focus:ring-2 focus:ring-primary-400 transition"
                >
                  Search
                </button>
              </div>
              {postcodeError && <div className="text-red-600 text-sm mt-1">{postcodeError}</div>}
              <div className="text-xs text-gray-500 mt-1">Enter a UK postcode to see HPI for your area.</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Or select region
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {REGIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Start Date
              </label>
              <input
                type="month"
                value={dateRange.start}
                min={dateLimits.min}
                max={dateLimits.max}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setDateRange(prev => ({
                    ...prev,
                    start: newStart,
                    end: newStart > prev.end ? newStart : prev.end
                  }));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                End Date
              </label>
              <input
                type="month"
                value={dateRange.end}
                min={dateLimits.min}
                max={dateLimits.max}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  setDateRange(prev => ({
                    ...prev,
                    end: newEnd,
                    start: newEnd < prev.start ? newEnd : prev.start
                  }));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-600">Current HPI</p>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      House Price Index value (2015 = 100)
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {hpiData.find(d => d.region === selectedRegion)?.index?.toFixed(1) || 'N/A'}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-600">YoY Growth</p>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Year-over-Year growth rate
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <p className={`text-2xl font-bold ${getGrowthColor(hpiData.find(d => d.region === selectedRegion)?.yoyGrowth ?? 0)}`}>
                  {formatPercentage(hpiData.find(d => d.region === selectedRegion)?.yoyGrowth ?? 0)}
                </p>
              </div>
              {getGrowthIcon(hpiData.find(d => d.region === selectedRegion)?.yoyGrowth ?? 0)}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-600">MoM Growth</p>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Month-over-Month growth rate
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <p className={`text-2xl font-bold ${getGrowthColor(hpiData.find(d => d.region === selectedRegion)?.monthOverMonth || 0)}`}>
                  {formatPercentage(hpiData.find(d => d.region === selectedRegion)?.monthOverMonth || 0)}
                </p>
              </div>
              {getGrowthIcon(hpiData.find(d => d.region === selectedRegion)?.monthOverMonth || 0)}
            </div>
          </div>
        </div>

        {/* Market Insights */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Market Insights for {selectedRegion}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Market Trend:</span>
                <span className={`font-medium ${hpiData.find(d => d.region === selectedRegion)?.yoyGrowth && hpiData.find(d => d.region === selectedRegion)?.yoyGrowth! > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {hpiData.find(d => d.region === selectedRegion)?.yoyGrowth && hpiData.find(d => d.region === selectedRegion)?.yoyGrowth! > 0 ? 'Rising' : 'Declining'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Growth Momentum:</span>
                <span className={`font-medium ${hpiData.find(d => d.region === selectedRegion)?.monthOverMonth && hpiData.find(d => d.region === selectedRegion)?.monthOverMonth! > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {hpiData.find(d => d.region === selectedRegion)?.monthOverMonth && hpiData.find(d => d.region === selectedRegion)?.monthOverMonth! > 0 ? 'Accelerating' : 'Slowing'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">vs UK Average:</span>
                <span className={`font-medium ${
                  (hpiData.find(d => d.region === selectedRegion)?.yoyGrowth ?? 0) > (hpiData.find(d => d.region === 'United Kingdom')?.yoyGrowth ?? 0) ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(hpiData.find(d => d.region === selectedRegion)?.yoyGrowth ?? 0) > (hpiData.find(d => d.region === 'United Kingdom')?.yoyGrowth ?? 0) ? 'Above Average' : 'Below Average'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Data Currency:</span>
                <span className="font-medium text-gray-900">
                  {hpiData.find(d => d.region === selectedRegion)?.date ? 
                    new Date(hpiData.find(d => d.region === selectedRegion)?.date!).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 
                    'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
          
          {/* Market Context */}
          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">💡 What This Means</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              {(() => {
                const regionData = hpiData.find(d => d.region === selectedRegion);
                const ukData = hpiData.find(d => d.region === 'United Kingdom');
                const yoyGrowth = regionData?.yoyGrowth ?? 0;
                const momGrowth = regionData?.monthOverMonth ?? 0;
                
                if (yoyGrowth > 5) {
                  return `The ${selectedRegion} market is showing strong growth with a ${formatPercentage(yoyGrowth)} year-over-year increase. This suggests high demand and potentially rising property values.`;
                } else if (yoyGrowth > 0) {
                  return `The ${selectedRegion} market is experiencing moderate growth with a ${formatPercentage(yoyGrowth)} year-over-year increase. This indicates stable market conditions.`;
                } else if (yoyGrowth > -5) {
                  return `The ${selectedRegion} market is showing a slight decline with a ${formatPercentage(yoyGrowth)} year-over-year change. This may indicate cooling market conditions.`;
                } else {
                  return `The ${selectedRegion} market is experiencing significant decline with a ${formatPercentage(yoyGrowth)} year-over-year decrease. This suggests challenging market conditions.`;
                }
              })()}
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setViewMode('chart')}
              className={`rounded-full font-semibold shadow px-5 py-2.5 transition focus:ring-2 focus:ring-primary-400 ${
                viewMode === 'chart' 
                  ? 'bg-primary-500 text-white hover:bg-primary-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Chart View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-full font-semibold shadow px-5 py-2.5 transition focus:ring-2 focus:ring-primary-400 ${
                viewMode === 'table' 
                  ? 'bg-primary-500 text-white hover:bg-primary-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <PieChart className="w-4 h-4 mr-2" />
              Table View
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`rounded-full font-semibold shadow px-5 py-2.5 transition focus:ring-2 focus:ring-primary-400 ${
                viewMode === 'comparison' 
                  ? 'bg-primary-500 text-white hover:bg-primary-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Activity className="w-4 h-4 mr-2" />
              Regional Comparison
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'chart' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col min-h-[400px]" style={{height: '100%'}}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              HPI Trend - {selectedRegion}
            </h3>
            <div className="flex-1 min-h-[300px]">
              <Line data={timeSeriesChartData} options={chartOptions} />
            </div>
          </div>
        )}

        {viewMode === 'table' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Regional HPI Data</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Index
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      YoY Growth
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MoM Growth
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hpiData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.index.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={getGrowthColor(item.yoyGrowth ?? 0)}>
                          {formatPercentage(item.yoyGrowth ?? 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={getGrowthColor(item.monthOverMonth || 0)}>
                          {formatPercentage(item.monthOverMonth || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'comparison' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current HPI by Region</h3>
              <div className="h-80">
                <Bar data={regionalChartData} options={chartOptions} />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Year-over-Year Growth</h3>
              <div className="h-80">
                <Bar data={growthData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}

        {limitHit && <UpgradePrompt />}
      </div>
    </div>
  );
} 