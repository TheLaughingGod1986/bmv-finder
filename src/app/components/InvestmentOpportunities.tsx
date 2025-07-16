'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, DollarSign, Calendar, MapPin, Star, AlertTriangle, Info, ArrowUpRight } from 'lucide-react';

interface MarketData {
  region: string;
  currentIndex: number;
  yoyGrowth: number;
  momGrowth: number;
  volatility: number;
  trend: 'rising' | 'falling' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  investmentScore: number;
  lastUpdated: string;
}

interface InvestmentOpportunitiesProps {
  data: MarketData[];
}

export default function InvestmentOpportunities({ data }: InvestmentOpportunitiesProps) {
  const [filterType, setFilterType] = useState<'all' | 'growth' | 'stability' | 'value'>('all');

  const getOpportunityType = (region: MarketData) => {
    if (region.yoyGrowth > 8 && region.volatility < 3) return 'growth';
    if (region.volatility < 2 && region.yoyGrowth > 0) return 'stability';
    if (region.currentIndex < 100 && region.yoyGrowth > 0) return 'value';
    return 'balanced';
  };

  const getOpportunityDescription = (region: MarketData) => {
    const type = getOpportunityType(region);
    switch (type) {
      case 'growth':
        return 'High growth potential with strong momentum';
      case 'stability':
        return 'Stable market with predictable returns';
      case 'value':
        return 'Undervalued market with upside potential';
      default:
        return 'Balanced opportunity with moderate risk/reward';
    }
  };

  const getOpportunityIcon = (type: string) => {
    switch (type) {
      case 'growth': return TrendingUp;
      case 'stability': return Target;
      case 'value': return DollarSign;
      default: return Star;
    }
  };

  const getOpportunityColor = (type: string) => {
    switch (type) {
      case 'growth': return 'from-green-500 to-emerald-500';
      case 'stability': return 'from-blue-500 to-indigo-500';
      case 'value': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const filterOpportunities = () => {
    let filtered = data;
    
    switch (filterType) {
      case 'growth':
        filtered = data.filter(r => r.yoyGrowth > 5 && r.trend === 'rising');
        break;
      case 'stability':
        filtered = data.filter(r => r.volatility < 3 && r.riskLevel === 'low');
        break;
      case 'value':
        filtered = data.filter(r => r.currentIndex < 120 && r.yoyGrowth > 0);
        break;
      default:
        filtered = data;
    }
    
    return filtered.sort((a, b) => b.investmentScore - a.investmentScore);
  };

  const opportunities = filterOpportunities();

  const getConfidenceLevel = (score: number) => {
    if (score >= 80) return { level: 'High', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Low', color: 'text-red-600', bg: 'bg-red-100' };
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-green-500" />
          <h3 className="text-xl font-semibold text-gray-900">Investment Opportunities</h3>
        </div>
        <div className="flex gap-2">
          {(['all', 'growth', 'stability', 'value'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filterType === type
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Description */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              {filterType === 'all' && 'All Investment Opportunities'}
              {filterType === 'growth' && 'High Growth Opportunities'}
              {filterType === 'stability' && 'Stable Investment Options'}
              {filterType === 'value' && 'Value Investment Opportunities'}
            </p>
            <p className="text-sm text-gray-600">
              {filterType === 'all' && 'Comprehensive view of all regional investment opportunities ranked by potential.'}
              {filterType === 'growth' && 'Regions with strong growth momentum and rising trends.'}
              {filterType === 'stability' && 'Low-risk regions with stable, predictable returns.'}
              {filterType === 'value' && 'Undervalued markets with potential for significant appreciation.'}
            </p>
          </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="space-y-4">
        {opportunities.slice(0, 10).map((region, index) => {
          const opportunityType = getOpportunityType(region);
          const Icon = getOpportunityIcon(opportunityType);
          const confidence = getConfidenceLevel(region.investmentScore);
          
          return (
            <motion.div
              key={region.region}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Rank and Icon */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getOpportunityColor(opportunityType)} text-white flex items-center justify-center text-sm font-bold`}>
                      {index + 1}
                    </div>
                    <Icon className="w-5 h-5 text-gray-400 mt-2" />
                  </div>

                  {/* Region Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{region.region}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${confidence.bg} ${confidence.color}`}>
                        {confidence.level} Confidence
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {getOpportunityDescription(region)}
                    </p>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Growth Rate</p>
                        <p className={`font-semibold ${region.yoyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {region.yoyGrowth > 0 ? '+' : ''}{region.yoyGrowth.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Volatility</p>
                        <p className="font-semibold text-gray-900">{region.volatility.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">HPI Index</p>
                        <p className="font-semibold text-gray-900">{region.currentIndex.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Risk Level</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          region.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                          region.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {region.riskLevel.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investment Score */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {region.investmentScore}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Investment Score</div>
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${region.investmentScore}%`,
                        backgroundColor: region.investmentScore >= 80 ? '#10B981' : 
                                        region.investmentScore >= 60 ? '#F59E0B' : '#EF4444'
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                  <MapPin className="w-4 h-4" />
                  View Properties
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                  <Calendar className="w-4 h-4" />
                  Market Analysis
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                  Compare
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-semibold text-gray-900 mb-3">Opportunity Summary</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Opportunities</p>
            <p className="font-semibold text-gray-900">{opportunities.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Avg Investment Score</p>
            <p className="font-semibold text-gray-900">
              {Math.round(opportunities.reduce((sum, r) => sum + r.investmentScore, 0) / opportunities.length)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">High Confidence</p>
            <p className="font-semibold text-green-600">
              {opportunities.filter(r => r.investmentScore >= 80).length}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Avg Growth Rate</p>
            <p className="font-semibold text-gray-900">
              {opportunities.length > 0 ? 
                (opportunities.reduce((sum, r) => sum + r.yoyGrowth, 0) / opportunities.length).toFixed(1) + '%' : 
                'N/A'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 