'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, MapPin, BarChart3, Info } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

interface HpiDataCardProps {
  postcode: string;
  className?: string;
}

interface HpiData {
  date: string;
  region: string;
  average_price?: number;
  index: number;
  percentage_change?: number;
  year?: number;
  month?: number;
}

export default function HpiDataCard({ postcode, className = '' }: HpiDataCardProps) {
  const [hpiData, setHpiData] = useState<HpiData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postcode) return;

    const fetchHpiData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/hpi/postcode?postcode=${encodeURIComponent(postcode)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch HPI data');
        }
        
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setHpiData(data.results);
        } else {
          setError('No HPI data available for this area');
        }
      } catch (err) {
        setError('Unable to load HPI data');
        console.error('HPI data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHpiData();
  }, [postcode]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">House Price Index</h3>
        </div>
        <div className="text-sm text-gray-500">
          <Info className="w-4 h-4 inline mr-1" />
          {error}
        </div>
      </div>
    );
  }

  if (hpiData.length === 0) {
    return null;
  }

  // Calculate useful metrics
  const latestData = hpiData[0];
  const oldestData = hpiData[hpiData.length - 1];
  
  // Use index values for calculations since average_price is not available
  const latestIndex = latestData?.index;
  const oldestIndex = oldestData?.index;
  
  const totalGrowth = (latestIndex && oldestIndex && oldestIndex > 0) 
    ? ((latestIndex - oldestIndex) / oldestIndex * 100) 
    : 0;
  
  // Calculate annual growth from index values
  const oneYearAgo = hpiData.find(d => {
    const latestDate = new Date(latestData.date + '-01');
    const dataDate = new Date(d.date + '-01');
    const diffInMonths = (latestDate.getFullYear() - dataDate.getFullYear()) * 12 + 
                        (latestDate.getMonth() - dataDate.getMonth());
    return diffInMonths >= 12;
  });
  
  const annualGrowth = (latestIndex && oneYearAgo?.index && oneYearAgo.index > 0)
    ? ((latestIndex - oneYearAgo.index) / oneYearAgo.index * 100)
    : 0;
    
  const dataPoints = hpiData.length;
  const timeSpan = oldestData ? `${oldestData.date} - ${latestData.date}` : '';

  // Get growth color
  const getGrowthColor = (growth: number) => {
    if (growth > 5) return 'text-green-600';
    if (growth > 0) return 'text-blue-600';
    if (growth < -5) return 'text-red-600';
    return 'text-orange-600';
  };

  // Get growth icon
  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return '↗';
    if (growth < 0) return '↘';
    return '→';
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl shadow-md">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">House Price Index</h3>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4" />
              {latestData.region}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 font-medium">Latest Data</div>
          <div className="text-sm font-semibold text-gray-900">{latestData.date}</div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Current HPI Index */}
        <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">HPI Index</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {latestIndex ? latestIndex.toFixed(1) : 'N/A'}
          </div>
          <div className={`text-sm font-medium ${getGrowthColor(annualGrowth)}`}>
            {getGrowthIcon(annualGrowth)} {annualGrowth > 0 ? '+' : ''}{annualGrowth.toFixed(1)}% this year
          </div>
        </div>

        {/* Total Growth */}
        <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">Total Growth</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {totalGrowth > 0 ? '+' : ''}{totalGrowth.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">
            {dataPoints} data points
          </div>
        </div>

        {/* Data Period */}
        <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-semibold text-gray-700">Data Period</span>
          </div>
          <div className="text-lg font-bold text-gray-900 mb-2">
            {timeSpan}
          </div>
          <div className="text-sm text-gray-600">
            {oldestData?.date} to {latestData?.date}
          </div>
        </div>
      </div>

      {/* Additional Info & Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Data Source Info */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Data Source</span>
          </div>
          <div className="space-y-2 text-xs text-blue-700">
            <div><strong>Source:</strong> Official House Price Index data from Land Registry</div>
            <div><strong>Coverage:</strong> Regional average across {latestData.region}</div>
            <div><strong>Data Points:</strong> {dataPoints} records</div>
          </div>
        </div>

        {/* Trend Explanation */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Understanding HPI vs Local Trends</span>
          </div>
          <div className="space-y-2 text-xs text-amber-700">
            <div>• <strong>HPI Index:</strong> Regional price index across {latestData.region} (base 100)</div>
            <div>• <strong>Local Data:</strong> Specific to your postcode area</div>
            <div>• <strong>Differences are normal</strong> and indicate market segmentation</div>
            <div>• Use both for comprehensive market understanding</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {hpiData.length > 1 && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="text-lg font-bold text-gray-900 mb-1">{oldestIndex ? oldestIndex.toFixed(1) : 'N/A'}</div>
            <div className="text-xs text-gray-600">Lowest (Oldest)</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="text-lg font-bold text-gray-900 mb-1">{latestIndex ? latestIndex.toFixed(1) : 'N/A'}</div>
            <div className="text-xs text-gray-600">Highest (Latest)</div>
          </div>
        </div>
      )}
    </div>
  );
} 