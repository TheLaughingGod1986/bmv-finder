'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  BarChart3, 
  Calculator, 
  Shield, 
  Database, 
  Target,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Building,
  PoundSterling
} from 'lucide-react';

interface PredictionExplanationCardProps {
  className?: string;
  showAdvanced?: boolean;
}

export default function PredictionExplanationCard({ 
  className = '', 
  showAdvanced = false 
}: PredictionExplanationCardProps) {
  const [isExpanded, setIsExpanded] = useState(showAdvanced);

  const dataSources = [
    {
      icon: Database,
      title: 'House Price Index (HPI)',
      description: 'Official UK government data tracking property price trends over time',
      detail: 'We analyze 12+ months of historical HPI data to identify growth patterns'
    },
    {
      icon: MapPin,
      title: 'Comparable Sales',
      description: 'Recent property sales in your area with similar characteristics',
      detail: 'Properties with matching bedrooms, size, and property type within 1km radius'
    },
    {
      icon: Building,
      title: 'Property Features',
      description: 'EPC ratings, property type, size, and construction details',
      detail: 'Energy efficiency and property characteristics influence market value'
    },
    {
      icon: TrendingUp,
      title: 'Economic Indicators',
      description: 'Inflation rates, interest rates, and economic outlook data',
      detail: 'Future economic projections help adjust growth expectations'
    }
  ];

  const calculationSteps = [
    {
      step: 1,
      title: 'Historical Analysis',
      description: 'Analyze 12+ months of HPI data to calculate annual growth rate',
      formula: 'Growth Rate = (Recent HPI - Historical HPI) / Historical HPI'
    },
    {
      step: 2,
      title: 'Inflation Adjustment',
      description: 'Adjust growth rate to account for inflation and economic factors',
      formula: 'Real Growth = Max(HPI Growth, Inflation Rate)'
    },
    {
      step: 3,
      title: 'Market Validation',
      description: 'Compare with recent comparable sales to validate predictions',
      formula: 'Adjusted Value = Base Value × Market Multiplier'
    },
    {
      step: 4,
      title: 'Future Projection',
      description: 'Apply compound growth formula for long-term predictions',
      formula: 'Future Value = Current Value × (1 + Growth Rate)^Years'
    }
  ];

  const confidenceFactors = [
    {
      factor: 'Data Quality',
      description: 'More historical data points increase confidence',
      impact: 'High'
    },
    {
      factor: 'Market Stability',
      description: 'Lower price volatility indicates higher confidence',
      impact: 'Medium'
    },
    {
      factor: 'Comparable Availability',
      description: 'More recent sales in the area boost accuracy',
      impact: 'High'
    },
    {
      factor: 'Economic Outlook',
      description: 'Stable economic projections improve reliability',
      impact: 'Medium'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">How We Calculate Predictions</h3>
              <p className="text-sm text-gray-600">Transparent methodology for accurate property valuations</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Learn More
              </>
            )}
          </button>
        </div>

        {/* Quick Overview */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Our Prediction Methodology</h4>
              <p className="text-sm text-blue-800">
                We use a sophisticated multi-factor model that combines historical data, market trends, 
                and economic indicators to provide accurate property value predictions. Our system 
                analyzes thousands of data points to give you confidence in your investment decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-600" />
            Data Sources We Use
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataSources.map((source, index) => {
              const Icon = source.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">{source.title}</h5>
                      <p className="text-sm text-gray-600 mb-2">{source.description}</p>
                      {isExpanded && (
                        <p className="text-xs text-gray-500">{source.detail}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Calculation Steps */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gray-600" />
              Calculation Process
            </h4>
            <div className="space-y-4">
              {calculationSteps.map((step, index) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {step.step}
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">{step.title}</h5>
                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                    <div className="bg-white rounded border border-gray-300 p-2">
                      <code className="text-xs text-gray-700 font-mono">{step.formula}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Confidence Factors */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-600" />
              Confidence Factors
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {confidenceFactors.map((factor, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{factor.factor}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      factor.impact === 'High' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {factor.impact} Impact
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{factor.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Disclaimer */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-2">Important Disclaimer</h4>
              <p className="text-sm text-yellow-800">
                Property predictions are estimates based on historical data and market trends. 
                Actual results may vary due to market conditions, economic changes, and other factors. 
                Always consult with a qualified property professional before making investment decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Data-driven analysis</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Updated daily</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span>AI-powered insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 