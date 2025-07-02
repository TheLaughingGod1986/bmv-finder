'use client';

import React, { useState } from 'react';
import { TrendingUp, Target, Calculator, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BMVLegendProps {
  className?: string;
  variant?: 'compact' | 'full';
}

const BMVLegend: React.FC<BMVLegendProps> = ({ className, variant = 'full' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (variant === 'compact') {
    return (
      <div className={cn("bg-blue-50 border border-blue-200 rounded-lg p-4", className)}>
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">BMV Score Explained</h4>
            <p className="text-sm text-blue-800 leading-relaxed">
              Our <strong>Below Market Value (BMV)</strong> score identifies properties that may be undervalued compared to similar homes in the area. 
              Higher scores suggest better investment potential based on local market trends, rental yields, and price growth patterns.
            </p>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-blue-700 hover:text-blue-800 text-sm font-medium mt-2 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Learn more about scoring
                </>
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-semibold text-blue-900 mb-2">What we analyze:</h5>
                <ul className="space-y-1 text-blue-800">
                  <li>• Local market price trends</li>
                  <li>• Rental yield potential</li>
                  <li>• Property type demand</li>
                  <li>• Area growth patterns</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-blue-900 mb-2">Score categories:</h5>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-blue-800">90-100: Exceptional value</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-800">70-89: Good investment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-blue-800">50-69: Average value</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-6 shadow-sm", className)}>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-2">BMV Score: Your Investment Intelligence</h3>
          <p className="text-slate-700 leading-relaxed">
            Our <strong>Below Market Value (BMV)</strong> scoring system uses advanced analytics to identify properties that may be undervalued 
            compared to their true market potential. Perfect for investors seeking opportunities and buyers looking for the best value.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* How it works */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            How the Score Works
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-700 text-sm font-bold">1</span>
              </div>
              <div>
                <h5 className="font-medium text-slate-900">Market Analysis</h5>
                <p className="text-sm text-slate-600">Compares the property against similar homes in the area, considering size, type, and location factors.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-700 text-sm font-bold">2</span>
              </div>
              <div>
                <h5 className="font-medium text-slate-900">Growth Potential</h5>
                <p className="text-sm text-slate-600">Analyzes historical price trends and predicts future growth based on local market dynamics.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-700 text-sm font-bold">3</span>
              </div>
              <div>
                <h5 className="font-medium text-slate-900">Rental Yield</h5>
                <p className="text-sm text-slate-600">Calculates potential rental income and compares it to similar properties in the area.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-700 text-sm font-bold">4</span>
              </div>
              <div>
                <h5 className="font-medium text-slate-900">Investment Score</h5>
                <p className="text-sm text-slate-600">Combines all factors into a single score that indicates the property&apos;s investment potential.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Score categories */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Score Categories
          </h4>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-green-900">90-100: Exceptional Value</span>
              </div>
              <p className="text-sm text-green-800">
                Properties significantly below market value with strong growth potential. 
                These are rare opportunities that often attract multiple offers.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="font-semibold text-blue-900">70-89: Good Investment</span>
              </div>
              <p className="text-sm text-blue-800">
                Properties offering solid value with good potential for appreciation. 
                Suitable for both investors and homebuyers seeking value.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="font-semibold text-yellow-900">50-69: Average Value</span>
              </div>
              <p className="text-sm text-yellow-800">
                Properties priced around market value. Good for stable investments 
                but may not offer significant upside potential.
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="font-semibold text-red-900">Below 50: Overvalued</span>
              </div>
              <p className="text-sm text-red-800">
                Properties that may be priced above their true market value. 
                Consider negotiating or looking at alternatives.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data sources */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-2">Data Sources & Methodology</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our BMV scoring uses official UK Land Registry data, local market trends, and proprietary algorithms. 
              We analyze over 30 million property transactions to provide accurate, data-driven insights. 
              Scores are updated regularly to reflect current market conditions and ensure relevance for modern property decisions.
            </p>
            <div className="mt-3 text-xs text-slate-500">
              <strong>Note:</strong> BMV scores are for guidance only and should not be the sole factor in property decisions. 
              Always conduct your own research and consider professional advice.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BMVLegend; 