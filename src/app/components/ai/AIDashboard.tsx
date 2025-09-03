'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Settings, 
  Play, 
  Pause, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Activity,
  Database,
  Cpu
} from 'lucide-react';

interface PropertyRecommendation {
  id: string;
  propertyId: string;
  recommendationType: 'INVESTMENT' | 'RENTAL' | 'FLIP' | 'HOLD' | 'SELL' | 'AVOID';
  confidence: number;
  score: number;
  reasoning: string[];
  factors: RecommendationFactor[];
  financialProjection: FinancialProjection;
  riskAssessment: RiskAssessment;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

interface RecommendationFactor {
  name: string;
  weight: number;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  value: number;
  description: string;
  source: string;
}

interface FinancialProjection {
  currentValue: number;
  projectedValue1Year: number;
  projectedValue3Year: number;
  projectedValue5Year: number;
  rentalIncome: number;
  totalReturn: number;
  annualizedReturn: number;
  cashFlow: number;
  roi: number;
  paybackPeriod: number;
}

interface RiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
}

interface RiskFactor {
  name: string;
  probability: number;
  impact: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

interface MLModel {
  id: string;
  name: string;
  type: 'REGRESSION' | 'CLASSIFICATION' | 'CLUSTERING' | 'DEEP_LEARNING' | 'ENSEMBLE';
  version: string;
  accuracy: number;
  status: 'TRAINING' | 'READY' | 'DEPRECATED' | 'ERROR';
  features: string[];
  performance: {
    trainingAccuracy: number;
    validationAccuracy: number;
    testAccuracy: number;
    predictionLatency: number;
    throughput: number;
  };
  lastTrained: Date;
}

interface ModelStats {
  totalModels: number;
  readyModels: number;
  trainingModels: number;
  totalPredictions: number;
  averageAccuracy: number;
  averageLatency: number;
}

export default function AIDashboard() {
  const [recommendations, setRecommendations] = useState<PropertyRecommendation[]>([]);
  const [models, setModels] = useState<MLModel[]>([]);
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'models' | 'insights'>('overview');
  const [selectedRecommendation, setSelectedRecommendation] = useState<PropertyRecommendation | null>(null);

  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    setIsLoading(true);
    try {
      // Load recommendations
      const recommendationsResponse = await fetch('/api/ai/recommendations?userId=current');
      const recommendationsData = await recommendationsResponse.json();
      if (recommendationsData.success) {
        setRecommendations(recommendationsData.recommendations);
      }

      // Load models
      const modelsResponse = await fetch('/api/ai/models');
      const modelsData = await modelsResponse.json();
      if (modelsData.success) {
        setModels(modelsData.models);
        setStats(modelsData.stats);
      }
    } catch (error) {
      console.error('Error loading AI data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewRecommendations = async () => {
    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current',
          maxRecommendations: 10
        })
      });

      if (response.ok) {
        loadAIData();
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  const getRecommendationTypeColor = (type: string) => {
    switch (type) {
      case 'INVESTMENT': return 'text-green-600 bg-green-100';
      case 'RENTAL': return 'text-blue-600 bg-blue-100';
      case 'FLIP': return 'text-purple-600 bg-purple-100';
      case 'HOLD': return 'text-yellow-600 bg-yellow-100';
      case 'SELL': return 'text-red-600 bg-red-100';
      case 'AVOID': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case 'REGRESSION': return <TrendingUp className="w-4 h-4" />;
      case 'CLASSIFICATION': return <Target className="w-4 h-4" />;
      case 'CLUSTERING': return <BarChart3 className="w-4 h-4" />;
      case 'DEEP_LEARNING': return <Brain className="w-4 h-4" />;
      case 'ENSEMBLE': return <Cpu className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'READY': return 'text-green-600 bg-green-100';
      case 'TRAINING': return 'text-blue-600 bg-blue-100';
      case 'DEPRECATED': return 'text-gray-600 bg-gray-100';
      case 'ERROR': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading AI data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Dashboard</h1>
            <p className="text-gray-600">AI-powered property recommendations and machine learning insights</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAIData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={generateNewRecommendations}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Zap className="w-4 h-4" />
              Generate Recommendations
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'recommendations', label: 'Recommendations', icon: Target },
              { id: 'models', label: 'ML Models', icon: Brain },
              { id: 'insights', label: 'Insights', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Brain className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">ML Models</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalModels}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active Recommendations</p>
                  <p className="text-2xl font-bold text-gray-900">{recommendations.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Model Accuracy</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPercentage(stats.averageAccuracy * 100)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Zap className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Predictions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPredictions.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Model Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.readyModels}</div>
                <div className="text-sm text-gray-600">Ready Models</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.trainingModels}</div>
                <div className="text-sm text-gray-600">Training Models</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.averageLatency.toFixed(0)}ms</div>
                <div className="text-sm text-gray-600">Avg Latency</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
            </div>
            <div className="p-6">
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recommendations available</p>
                  <button
                    onClick={generateNewRecommendations}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Generate Recommendations
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {recommendations.map((recommendation) => (
                    <div
                      key={recommendation.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedRecommendation(recommendation)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRecommendationTypeColor(recommendation.recommendationType)}`}>
                          {recommendation.recommendationType}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Score:</span>
                          <span className="text-lg font-bold text-gray-900">{recommendation.score}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Confidence</span>
                          <span className="text-sm font-medium">{formatPercentage(recommendation.confidence)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${recommendation.confidence}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Risk Level</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(recommendation.riskAssessment.overallRisk)}`}>
                            {recommendation.riskAssessment.overallRisk}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Current Value:</span>
                          <div className="font-medium">{formatCurrency(recommendation.financialProjection.currentValue)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">5Y Projection:</span>
                          <div className="font-medium">{formatCurrency(recommendation.financialProjection.projectedValue5Year)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">ROI:</span>
                          <div className="font-medium">{formatPercentage(recommendation.financialProjection.roi)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Rental Income:</span>
                          <div className="font-medium">{formatCurrency(recommendation.financialProjection.rentalIncome)}</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Key Factors:</h4>
                        <div className="space-y-1">
                          {recommendation.factors.slice(0, 3).map((factor, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">{factor.name}</span>
                              <span className={`px-2 py-1 rounded ${
                                factor.impact === 'POSITIVE' ? 'bg-green-100 text-green-800' :
                                factor.impact === 'NEGATIVE' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {factor.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'models' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Machine Learning Models</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Latency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Trained
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {models.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{model.name}</div>
                        <div className="text-sm text-gray-500">v{model.version}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getModelTypeIcon(model.type)}
                        {model.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getModelStatusColor(model.status)}`}>
                        {model.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${model.accuracy * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{formatPercentage(model.accuracy * 100)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {model.performance.predictionLatency.toFixed(0)}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(model.lastTrained).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Recommendation Trends</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Investment Opportunities</span>
                    <span className="text-sm font-medium">{recommendations.filter(r => r.recommendationType === 'INVESTMENT').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rental Properties</span>
                    <span className="text-sm font-medium">{recommendations.filter(r => r.recommendationType === 'RENTAL').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Properties to Avoid</span>
                    <span className="text-sm font-medium">{recommendations.filter(r => r.recommendationType === 'AVOID').length}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Risk Distribution</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Low Risk</span>
                    <span className="text-sm font-medium">{recommendations.filter(r => r.riskAssessment.overallRisk === 'LOW').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Medium Risk</span>
                    <span className="text-sm font-medium">{recommendations.filter(r => r.riskAssessment.overallRisk === 'MEDIUM').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">High Risk</span>
                    <span className="text-sm font-medium">{recommendations.filter(r => r.riskAssessment.overallRisk === 'HIGH').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Detail Modal */}
      {selectedRecommendation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recommendation Details</h3>
                <button
                  onClick={() => setSelectedRecommendation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRecommendationTypeColor(selectedRecommendation.recommendationType)}`}>
                    {selectedRecommendation.recommendationType}
                  </span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">Score: {selectedRecommendation.score}</div>
                    <div className="text-sm text-gray-600">Confidence: {formatPercentage(selectedRecommendation.confidence)}</div>
                  </div>
                </div>

                {/* Financial Projection */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Financial Projection</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Current Value</div>
                      <div className="font-medium">{formatCurrency(selectedRecommendation.financialProjection.currentValue)}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">1Y Projection</div>
                      <div className="font-medium">{formatCurrency(selectedRecommendation.financialProjection.projectedValue1Year)}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">5Y Projection</div>
                      <div className="font-medium">{formatCurrency(selectedRecommendation.financialProjection.projectedValue5Year)}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">ROI</div>
                      <div className="font-medium">{formatPercentage(selectedRecommendation.financialProjection.roi)}</div>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Risk Assessment</h4>
                  <div className="flex items-center gap-4 mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(selectedRecommendation.riskAssessment.overallRisk)}`}>
                      {selectedRecommendation.riskAssessment.overallRisk} Risk
                    </span>
                    <span className="text-sm text-gray-600">Score: {selectedRecommendation.riskAssessment.riskScore}</span>
                  </div>
                  <div className="space-y-2">
                    {selectedRecommendation.riskAssessment.riskFactors.map((factor, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{factor.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          factor.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                          factor.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {factor.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reasoning */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">AI Reasoning</h4>
                  <div className="space-y-2">
                    {selectedRecommendation.reasoning.map((reason, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
