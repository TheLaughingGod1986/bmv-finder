'use client';


import { Zap, TrendingUp, TrendingDown, Leaf, PoundSterling, Thermometer, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EnergyEfficiencyInsightsProps {
  epcRating?: string;
  epcSize?: number;
  propertyType?: string;
  className?: string;
}

interface EnergyData {
  rating: string;
  energyCost: number;
  carbonEmissions: number;
  potentialSavings: number;
  efficiencyLevel: 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Very Poor';
  color: string;
  bgColor: string;
  recommendations: string[];
}

const getEnergyData = (rating: string, size: number = 100): EnergyData => {
  const baseCosts = {
    'A': { cost: 0.5, carbon: 0.1, savings: 0 },
    'B': { cost: 0.8, carbon: 0.2, savings: 0.3 },
    'C': { cost: 1.2, carbon: 0.4, savings: 0.6 },
    'D': { cost: 1.8, carbon: 0.6, savings: 1.0 },
    'E': { cost: 2.5, carbon: 0.9, savings: 1.5 },
    'F': { cost: 3.2, carbon: 1.2, savings: 2.0 },
    'G': { cost: 4.0, carbon: 1.5, savings: 2.5 }
  };

  const data = baseCosts[rating as keyof typeof baseCosts] || baseCosts['D'];
  const annualCost = Math.round(data.cost * size);
  const annualCarbon = Math.round(data.carbon * size);
  const annualSavings = Math.round(data.savings * size);

  const efficiencyLevels = {
    'A': 'Excellent',
    'B': 'Good', 
    'C': 'Average',
    'D': 'Poor',
    'E': 'Poor',
    'F': 'Very Poor',
    'G': 'Very Poor'
  };

  const colors = {
    'A': { color: 'text-green-800', bg: 'bg-green-100' },
    'B': { color: 'text-green-700', bg: 'bg-green-50' },
    'C': { color: 'text-yellow-700', bg: 'bg-yellow-100' },
    'D': { color: 'text-orange-700', bg: 'bg-orange-100' },
    'E': { color: 'text-red-700', bg: 'bg-red-100' },
    'F': { color: 'text-red-800', bg: 'bg-red-200' },
    'G': { color: 'text-red-900', bg: 'bg-red-300' }
  };

  const recommendations = {
    'A': ['Maintain current efficiency', 'Consider renewable energy sources'],
    'B': ['Upgrade to A rating for maximum savings', 'Install smart heating controls'],
    'C': ['Improve insulation', 'Upgrade heating system', 'Install double glazing'],
    'D': ['Major insulation upgrade needed', 'Replace heating system', 'Consider renewable energy'],
    'E': ['Urgent efficiency improvements required', 'Professional energy audit recommended'],
    'F': ['Complete energy efficiency overhaul needed', 'Consider major renovation'],
    'G': ['Immediate action required', 'Professional assessment essential']
  };

  return {
    rating,
    energyCost: annualCost,
    carbonEmissions: annualCarbon,
    potentialSavings: annualSavings,
    efficiencyLevel: efficiencyLevels[rating as keyof typeof efficiencyLevels] as EnergyData['efficiencyLevel'],
    color: colors[rating as keyof typeof colors]?.color || 'text-gray-700',
    bgColor: colors[rating as keyof typeof colors]?.bg || 'bg-gray-100',
    recommendations: recommendations[rating as keyof typeof recommendations] || []
  };
};

export default function EnergyEfficiencyInsights({ 
  epcRating, 
  epcSize, 
  propertyType,
  className 
}: EnergyEfficiencyInsightsProps) {
  if (!epcRating) {
    return (
      <div className={cn("bg-gray-50 rounded-lg p-4", className)}>
        <div className="flex items-center gap-2 text-gray-500">
          <Zap className="w-4 h-4" />
          <span className="text-sm">No EPC data available</span>
        </div>
      </div>
    );
  }

  const energyData = getEnergyData(epcRating, epcSize);

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Energy Efficiency</h3>
        <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium", energyData.bgColor, energyData.color)}>
          EPC {epcRating}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Annual Energy Cost */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <PoundSterling className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Annual Cost</span>
          </div>
          <div className="text-lg font-bold text-blue-900">
            £{energyData.energyCost.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600">
            {epcSize ? `${Math.round(energyData.energyCost / epcSize)}/m²` : 'per year'}
          </div>
        </div>

        {/* Carbon Emissions */}
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Carbon</span>
          </div>
          <div className="text-lg font-bold text-green-900">
            {energyData.carbonEmissions} tonnes
          </div>
          <div className="text-xs text-green-600">CO₂ per year</div>
        </div>
      </div>

      {/* Efficiency Level */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Thermometer className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Efficiency Level</span>
        </div>
        <div className={cn("inline-flex items-center px-3 py-1 rounded-full text-sm font-medium", energyData.bgColor, energyData.color)}>
          {energyData.efficiencyLevel}
        </div>
      </div>

      {/* Potential Savings */}
      {energyData.potentialSavings > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Potential Annual Savings</span>
          </div>
          <div className="text-lg font-bold text-green-600">
            £{energyData.potentialSavings.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">
            If upgraded to A rating
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-gray-700">Recommendations</span>
        </div>
        <ul className="space-y-1">
          {energyData.recommendations.map((rec, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
              {rec}
            </li>
          ))}
        </ul>
      </div>

      {/* Property Size Info */}
      {epcSize && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Property size: {epcSize}m² • Cost per m²: £{Math.round(energyData.energyCost / epcSize)}/year
          </div>
        </div>
      )}
    </div>
  );
} 