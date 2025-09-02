'use client';

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  MapIcon,
  ClockIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface MarketTrend {
  id: string;
  area: string;
  metric: string;
  value: number;
  change: number;
  changePercent: number;
  confidence: number;
  significance: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  detectedAt: string;
  metadata?: Record<string, any>;
}

interface PropertyInsight {
  id: string;
  propertyId: string;
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  actionable: boolean;
  recommendations: string[];
  metadata?: Record<string, any>;
}

interface MarketSegment {
  id: string;
  name: string;
  criteria: Record<string, any>;
  properties: number;
  avgPrice: number;
  priceGrowth: number;
  volume: number;
  volumeGrowth: number;
  bmvOpportunities: number;
  marketShare: number;
}

interface AnalyticsData {
  trends: MarketTrend[];
  insights: PropertyInsight[];
  segments: MarketSegment[];
  summary: {
    totalProperties: number;
    avgBmvScore: number;
    marketHealth: number;
    opportunityCount: number;
    riskCount: number;
    confidence: number;
  };
  recommendations: string[];
  lastUpdated: string;
}

export default function MarketIntelligenceDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'insights' | 'segments'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedArea, selectedTimeframe]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/market?area=${selectedArea}&timeframe=${selectedTimeframe}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const getSignificanceColor = (significance: string): string => {
    switch (significance) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <LightBulbIcon className="w-5 h-5 text-green-600" />;
      case 'risk': return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'trend': return <TrendingUpIcon className="w-5 h-5 text-blue-600" />;
      case 'anomaly': return <ChartBarIcon className="w-5 h-5 text-purple-600" />;
      default: return <CheckCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load analytics</h3>
        <p className="text-gray-600">Unable to fetch market intelligence data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Market Intelligence Dashboard</h2>
          <p className="text-gray-600">Advanced analytics and market insights</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <MapIcon className="w-5 h-5 text-gray-400" />
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Areas</option>
              <option value="SW1A">SW1A (Westminster)</option>
              <option value="E1">E1 (Whitechapel)</option>
              <option value="N1">N1 (Islington)</option>
              <option value="W1">W1 (Mayfair)</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Market Health</p>
              <p className="text-2xl font-bold text-gray-900">{(data.summary.marketHealth * 100).toFixed(1)}%</p>
            </div>
            <div className={`p-3 rounded-full ${data.summary.marketHealth > 0.7 ? 'bg-green-100' : data.summary.marketHealth > 0.5 ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <CheckCircleIcon className={`w-6 h-6 ${data.summary.marketHealth > 0.7 ? 'text-green-600' : data.summary.marketHealth > 0.5 ? 'text-yellow-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-600">Confidence: {(data.summary.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalProperties.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-600">Avg BMV Score: {data.summary.avgBmvScore}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Opportunities</p>
              <p className="text-2xl font-bold text-green-600">{data.summary.opportunityCount}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <LightBulbIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-600">High-value investments</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Risks</p>
              <p className="text-2xl font-bold text-red-600">{data.summary.riskCount}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-600">Market concerns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: <ChartBarIcon className="w-5 h-5" /> },
              { id: 'trends', label: 'Market Trends', icon: <TrendingUpIcon className="w-5 h-5" /> },
              { id: 'insights', label: 'Insights', icon: <LightBulbIcon className="w-5 h-5" /> },
              { id: 'segments', label: 'Market Segments', icon: <FunnelIcon className="w-5 h-5" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Trends */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Market Trends</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.trends.slice(0, 4).map(trend => (
                    <div key={trend.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{trend.metric}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSignificanceColor(trend.significance)}`}>
                          {trend.significance}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {trend.metric.includes('Price') ? formatCurrency(trend.value) : trend.value.toLocaleString()}
                        </span>
                        <div className={`flex items-center space-x-1 ${trend.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trend.changePercent >= 0 ? <TrendingUpIcon className="w-4 h-4" /> : <TrendingDownIcon className="w-4 h-4" />}
                          <span className="text-sm font-medium">{formatPercentage(trend.changePercent)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Confidence: {(trend.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Insights */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Insights</h3>
                <div className="space-y-3">
                  {data.insights.slice(0, 3).map(insight => (
                    <div key={insight.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900">{insight.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                              {insight.impact}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                          <div className="text-xs text-gray-500">
                            Confidence: {(insight.confidence * 100).toFixed(1)}% • {insight.timeframe}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <ul className="space-y-2">
                    {data.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-blue-800">
                        <CheckCircleIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-4">
              {data.trends.map(trend => (
                <div key={trend.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{trend.metric} - {trend.area}</h4>
                      <p className="text-sm text-gray-600">Detected: {new Date(trend.detectedAt).toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSignificanceColor(trend.significance)}`}>
                      {trend.significance}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Current Value</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {trend.metric.includes('Price') ? formatCurrency(trend.value) : trend.value.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Change</p>
                      <div className={`flex items-center space-x-1 ${trend.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.changePercent >= 0 ? <TrendingUpIcon className="w-4 h-4" /> : <TrendingDownIcon className="w-4 h-4" />}
                        <span className="text-lg font-semibold">{formatPercentage(trend.changePercent)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Confidence</p>
                      <p className="text-lg font-semibold text-gray-900">{(trend.confidence * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              {data.insights.map(insight => (
                <div key={insight.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                          {insight.impact}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                      
                      {insight.recommendations.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-900 mb-2">Recommendations:</p>
                          <ul className="space-y-1">
                            {insight.recommendations.slice(0, 3).map((rec, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Confidence: {(insight.confidence * 100).toFixed(1)}%</span>
                        <span>{insight.timeframe}</span>
                        {insight.actionable && (
                          <span className="text-green-600 font-medium">Actionable</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'segments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.segments.map(segment => (
                <div key={segment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{segment.name}</h4>
                    <span className="text-sm text-gray-600">{segment.marketShare.toFixed(1)}% market share</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Properties</p>
                      <p className="text-lg font-semibold text-gray-900">{segment.properties.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Price</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(segment.avgPrice)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Price Growth</p>
                      <div className={`flex items-center space-x-1 ${segment.priceGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {segment.priceGrowth >= 0 ? <TrendingUpIcon className="w-4 h-4" /> : <TrendingDownIcon className="w-4 h-4" />}
                        <span className="text-sm font-medium">{formatPercentage(segment.priceGrowth)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">BMV Opportunities</p>
                      <p className="text-sm font-semibold text-gray-900">{segment.bmvOpportunities}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
