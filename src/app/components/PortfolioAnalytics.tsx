'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './SimpleCard';
import { 
  TrendingUp, 
  TrendingDown, 
  Home, 
  DollarSign, 
  BarChart3, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Info,
  PieChart,
  MapPin,
  Building,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Star,
  Shield,
  Calendar,
  Calculator
} from 'lucide-react';
// import { useUser } from '@supabase/auth-helpers-react';

interface PortfolioAnalytics {
  overview: {
    totalProperties: number;
    totalValue: number;
    totalEquity: number;
    totalRentalIncome: number;
    averageYield: number;
    totalGrowth: number;
    growthPercentage: number;
  };
  performance: {
    totalReturn: number;
    annualizedReturn: number;
    monthlyGrowth: number;
    bestPerformer: {
      address: string;
      growth: number;
      growthPercentage: number;
    };
    worstPerformer: {
      address: string;
      growth: number;
      growthPercentage: number;
    };
  };
  diversification: {
    byPropertyType: { [key: string]: { count: number; value: number; percentage: number } };
    byLocation: { [key: string]: { count: number; value: number; percentage: number } };
    byYield: {
      highYield: number;
      mediumYield: number;
      lowYield: number;
    };
  };
  riskMetrics: {
    averageDealScore: number;
    averageBMVScore: number;
    portfolioRisk: 'low' | 'medium' | 'high';
    concentrationRisk: number;
  };
  trends: {
    monthlyValues: Array<{ month: string; value: number; growth: number }>;
    monthlyRentalIncome: Array<{ month: string; income: number; growth: number }>;
  };
  recommendations: {
    topPerformers: Array<{ address: string; metric: string; value: number }>;
    areasForImprovement: Array<{ area: string; suggestion: string; impact: string }>;
    nextSteps: Array<{ action: string; priority: 'high' | 'medium' | 'low'; reason: string }>;
  };
}

export default function PortfolioAnalytics() {
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'diversification' | 'risk' | 'recommendations'>('overview');
  // const user = useUser();
  const user = null; // Temporarily disabled

  useEffect(() => {
    if (user?.id) {
      fetchAnalytics();
    }
  }, [user?.id]);

  const fetchAnalytics = async () => {
    try {
      // For now, use mock data since the API endpoint doesn't exist
      // Note: Replace with actual API endpoint when backend is ready
      const mockAnalytics: PortfolioAnalytics = {
        overview: {
          totalProperties: 3,
          totalValue: 780000,
          totalEquity: 195000,
          totalRentalIncome: 42000,
          averageYield: 5.4,
          totalGrowth: 75000,
          growthPercentage: 10.6
        },
        performance: {
          totalReturn: 75000,
          annualizedReturn: 8.2,
          monthlyGrowth: 0.7,
          bestPerformer: {
            address: '42 Park Avenue',
            growth: 25000,
            growthPercentage: 7.8
          },
          worstPerformer: {
            address: '7 Church Lane',
            growth: 30000,
            growthPercentage: 15.4
          }
        },
        diversification: {
          byPropertyType: {
            'Semi-detached': { count: 1, value: 210000, percentage: 27 },
            'Terraced': { count: 1, value: 345000, percentage: 44 },
            'Detached': { count: 1, value: 225000, percentage: 29 }
          },
          byLocation: {
            'NE5 2PR': { count: 1, value: 210000, percentage: 27 },
            'SE3 9FE': { count: 1, value: 345000, percentage: 44 },
            'SS9 5EL': { count: 1, value: 225000, percentage: 29 }
          },
          byYield: {
            highYield: 1,
            mediumYield: 1,
            lowYield: 1
          }
        },
        riskMetrics: {
          averageDealScore: 78,
          averageBMVScore: 75,
          portfolioRisk: 'medium',
          concentrationRisk: 0.44
        },
        trends: {
          monthlyValues: [
            { month: 'Jan 2024', value: 720000, growth: 2.1 },
            { month: 'Feb 2024', value: 735000, growth: 2.1 },
            { month: 'Mar 2024', value: 750000, growth: 2.0 },
            { month: 'Apr 2024', value: 765000, growth: 2.0 },
            { month: 'May 2024', value: 780000, growth: 2.0 }
          ],
          monthlyRentalIncome: [
            { month: 'Jan 2024', income: 4000, growth: 0 },
            { month: 'Feb 2024', income: 4100, growth: 2.5 },
            { month: 'Mar 2024', income: 4150, growth: 1.2 },
            { month: 'Apr 2024', income: 4200, growth: 1.2 },
            { month: 'May 2024', income: 4200, growth: 0 }
          ]
        },
        recommendations: {
          topPerformers: [
            { address: '42 Park Avenue', metric: 'Growth', value: 7.8 },
            { address: '7 Church Lane', metric: 'Yield', value: 6.2 },
            { address: '15 High Street', metric: 'BMV Score', value: 78 }
          ],
          areasForImprovement: [
            { area: 'Diversification', suggestion: 'Consider adding a flat to diversify property types', impact: 'Medium' },
            { area: 'Location Spread', suggestion: 'Look for properties in different regions', impact: 'High' },
            { area: 'Yield Optimization', suggestion: 'Review rental rates for potential increases', impact: 'Medium' }
          ],
          nextSteps: [
            { action: 'Review rental yields', priority: 'high', reason: 'Current average yield is below market rate' },
            { action: 'Consider refinancing', priority: 'medium', reason: 'Good equity position allows for portfolio expansion' },
            { action: 'Monitor market trends', priority: 'low', reason: 'Stay informed about local market conditions' }
          ]
        }
      };
      
      setAnalytics(mockAnalytics);
      setLoading(false);
    } catch (error) {
              // Error fetching analytics
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
            <span className="text-lg text-gray-600">Loading portfolio analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No portfolio data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'diversification', label: 'Diversification', icon: PieChart },
          { id: 'risk', label: 'Risk Analysis', icon: Shield },
          { id: 'recommendations', label: 'Recommendations', icon: Target }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalProperties}</p>
                </div>
                <Home className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.overview.totalValue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Growth</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.overview.totalGrowth)}</p>
                  <p className={`text-sm ${analytics.overview.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(analytics.overview.growthPercentage)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Yield</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.averageYield.toFixed(1)}%</p>
                </div>
                <Calculator className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {formatCurrency(analytics.performance.totalReturn)}
                  </div>
                  <div className="text-sm text-gray-600">Total Return</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {analytics.performance.annualizedReturn.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Annualized Return</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">Best Growth</p>
                    <p className="text-sm text-green-600">{analytics.performance.bestPerformer.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-800">{formatPercentage(analytics.performance.bestPerformer.growthPercentage)}</p>
                    <p className="text-sm text-green-600">{formatCurrency(analytics.performance.bestPerformer.growth)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-red-800">Worst Growth</p>
                    <p className="text-sm text-red-600">{analytics.performance.worstPerformer.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-800">{formatPercentage(analytics.performance.worstPerformer.growthPercentage)}</p>
                    <p className="text-sm text-red-600">{formatCurrency(analytics.performance.worstPerformer.growth)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diversification Tab */}
      {activeTab === 'diversification' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Property Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.diversification.byPropertyType).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{type}</p>
                      <p className="text-sm text-gray-600">{data.count} properties</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(data.value)}</p>
                      <p className="text-sm text-gray-600">{data.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.diversification.byLocation).map(([area, data]) => (
                  <div key={area} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{area}</p>
                      <p className="text-sm text-gray-600">{data.count} properties</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(data.value)}</p>
                      <p className="text-sm text-gray-600">{data.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Analysis Tab */}
      {activeTab === 'risk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {analytics.riskMetrics.averageDealScore.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Deal Score</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {analytics.riskMetrics.averageBMVScore.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600">Avg BMV Score</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Portfolio Risk</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getRiskColor(analytics.riskMetrics.portfolioRisk)}`}>
                    {analytics.riskMetrics.portfolioRisk.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Concentration Risk</span>
                  <span className="font-bold">{analytics.riskMetrics.concentrationRisk.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Yield Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-800">High Yield (&gt;8%)</span>
                  <span className="font-bold text-green-800">{analytics.diversification.byYield.highYield}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="font-medium text-yellow-800">Medium Yield (5-8%)</span>
                  <span className="font-bold text-yellow-800">{analytics.diversification.byYield.mediumYield}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-red-800">Low Yield (&lt;5%)</span>
                  <span className="font-bold text-red-800">{analytics.diversification.byYield.lowYield}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.recommendations.topPerformers.map((performer, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-800">{performer.address}</p>
                    <p className="text-sm text-green-600">{performer.metric}: {performer.value.toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recommendations.areasForImprovement.map((area, index) => (
                  <div key={index} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <h4 className="font-medium text-yellow-800">{area.area}</h4>
                    <p className="text-sm text-yellow-700 mt-1">{area.suggestion}</p>
                    <p className="text-xs text-yellow-600 mt-1">Impact: {area.impact}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recommended Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recommendations.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(step.priority)}`}></div>
                    <div className="flex-1">
                      <p className="font-medium">{step.action}</p>
                      <p className="text-sm text-gray-600">{step.reason}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(step.priority)} bg-opacity-10`}>
                      {step.priority.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 