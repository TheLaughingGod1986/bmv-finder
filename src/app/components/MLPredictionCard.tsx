'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, Info, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface MLPrediction {
  propertyGrowth: number;
  rentalYield: number;
  roi: number;
  confidence: number;
  factors: string[];
  lastUpdated: string;
}

interface MLMetrics {
  growthAccuracy: number;
  rentAccuracy: number;
  roiAccuracy: number;
  totalPredictions: number;
  modelVersion: string;
  lastTrainingDate: string;
}

interface MLPredictionCardProps {
  propertyFeatures: {
    propertyType: string;
    postcode: string;
    purchasePrice: number;
    refurbishmentCost: number;
    stampDuty: number;
    legalFees: number;
    mortgageRate: number;
    ltv: number;
  };
  onPredictionUpdate?: (prediction: MLPrediction) => void;
}

export default function MLPredictionCard({ propertyFeatures, onPredictionUpdate }: MLPredictionCardProps) {
  const [prediction, setPrediction] = useState<MLPrediction | null>(null);
  const [metrics, setMetrics] = useState<MLMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    generatePrediction();
    loadMetrics();
  }, [propertyFeatures]);

  const generatePrediction = async () => {
    // Check if we have meaningful input data
    const hasValidData = propertyFeatures.purchasePrice > 0 && 
                        propertyFeatures.postcode && 
                        propertyFeatures.postcode.trim() !== '';
    
    if (!hasValidData) {
      // Return zero predictions when no valid data is provided
      const zeroPrediction = {
        propertyGrowth: 0,
        rentalYield: 0,
        roi: 0,
        confidence: 0,
        factors: ['No property data entered yet'],
        lastUpdated: new Date().toISOString()
      };
      setPrediction(zeroPrediction);
      onPredictionUpdate?.(zeroPrediction);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ml-predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_predictions',
          data: { features: propertyFeatures }
        })
      });

      if (response.ok) {
        const { predictions } = await response.json();
        setPrediction(predictions);
        onPredictionUpdate?.(predictions);
      }
    } catch (error) {
      console.error('Error generating prediction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/ml-predictions');
      if (response.ok) {
        const { metrics } = await response.json();
        setMetrics(metrics);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatCurrency = (value: number) => `£${value.toLocaleString()}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  if (!prediction) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      {/* Header with ML Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Predictions</h3>
            <p className="text-sm text-gray-600">Machine Learning Enhanced</p>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* ML Information Panel */}
      {showInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            How Our AI Learns
          </h4>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Continuous Learning:</strong> Our AI analyzes actual property outcomes to improve predictions</p>
            <p>• <strong>Similar Property Analysis:</strong> Compares your property with similar historical cases</p>
            <p>• <strong>Market Adaptation:</strong> Updates predictions based on changing market conditions</p>
            <p>• <strong>Accuracy Tracking:</strong> Monitors prediction accuracy and retrains automatically</p>
          </div>
          {metrics && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-blue-700">Model Version:</span>
                  <div className="font-semibold">{metrics.modelVersion}</div>
                </div>
                <div>
                  <span className="text-blue-700">Predictions Made:</span>
                  <div className="font-semibold">{metrics.totalPredictions}</div>
                </div>
                <div>
                  <span className="text-blue-700">Growth Accuracy:</span>
                  <div className="font-semibold">{formatPercentage(metrics.growthAccuracy)}</div>
                </div>
                <div>
                  <span className="text-blue-700">ROI Accuracy:</span>
                  <div className="font-semibold">{formatPercentage(metrics.roiAccuracy)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Predictions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Property Growth</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {formatPercentage(prediction.propertyGrowth)}
          </div>
          <div className="text-xs text-green-700">Annual appreciation</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Rental Yield</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {formatPercentage(prediction.rentalYield)}
          </div>
          <div className="text-xs text-blue-700">Annual rental return</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Predicted ROI</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {formatPercentage(prediction.roi)}
          </div>
          <div className="text-xs text-purple-700">Return on investment</div>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Prediction Confidence</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatPercentage(prediction.confidence)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${prediction.confidence * 100}%` }}
          ></div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {prediction.confidence > 0.7 ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : prediction.confidence > 0.4 ? (
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          )}
          <span className="text-xs text-gray-600">
            {prediction.confidence > 0.7 ? 'High confidence' : 
             prediction.confidence > 0.4 ? 'Moderate confidence' : 'Low confidence'}
          </span>
        </div>
      </div>

      {/* Key Factors */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Factors Considered</h4>
        <div className="space-y-2">
          {prediction.factors.map((factor, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-sm text-gray-700">{factor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-100">
        Last updated: {formatDate(prediction.lastUpdated)}
      </div>

      {/* Refresh Button */}
      <div className="mt-4 text-center">
        <button
          onClick={generatePrediction}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Updating...' : 'Refresh Predictions'}
        </button>
      </div>
    </div>
  );
} 