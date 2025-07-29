'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BMVExplanationAccordionProps {
  className?: string;
}

export default function BMVExplanationAccordion({ className = '' }: BMVExplanationAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const bmvCategories = [
    {
      category: 'below',
      label: 'Below Market Value',
      icon: <TrendingDown className="w-4 h-4" />,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      scoreRange: '7.0 - 10.0',
      description: 'Properties priced below current market value',
      explanation: 'These properties represent good investment opportunities, often due to motivated sellers, property condition, or market timing.'
    },
    {
      category: 'neutral',
      label: 'Market Value',
      icon: <Minus className="w-4 h-4" />,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      scoreRange: '4.0 - 6.9',
      description: 'Properties priced at fair market value',
      explanation: 'These properties are priced appropriately for current market conditions and represent standard market value.'
    },
    {
      category: 'above',
      label: 'Above Market Value',
      icon: <TrendingUp className="w-4 h-4" />,
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      scoreRange: '1.0 - 3.9',
      description: 'Properties priced above current market value',
      explanation: 'These properties may be overpriced or have premium features that justify higher pricing.'
    }
  ];

  const scoringFactors = [
    {
      factor: 'Price Comparison (50%)',
      description: 'How the property price compares to recent comparable sales in the area',
      details: 'Properties 15%+ below market get highest scores, while those 20%+ above get lowest scores'
    },
    {
      factor: 'Market Confidence (20%)',
      description: 'Based on the number of comparable properties available',
      details: 'More comparable sales = higher confidence = better score'
    },
    {
      factor: 'Market Trend (20%)',
      description: 'Considers whether the market is rising, falling, or stable',
      details: 'Below-market deals are more valuable in rising markets, less impressive in falling markets'
    },
    {
      factor: 'Data Quality (10%)',
      description: 'Rewards using inflation-adjusted data for more accurate comparisons',
      details: 'HPI-adjusted data provides more accurate historical comparisons'
    }
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-[#3A7CA5]" />
          <span className="font-medium text-gray-900">Understanding Value Indicators & Deal Scores</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-6">
                             {/* Overview */}
               <div className="bg-blue-50 rounded-lg p-4">
                 <h4 className="font-semibold text-[#3A7CA5] mb-2">What are Value Indicators?</h4>
                 <p className="text-sm text-gray-700">
                   Value indicators show a single score from 1-10 that indicates how good a deal each property 
                   represents. Higher scores (7-10) mean better investment opportunities, while lower scores 
                   (1-3) indicate overpriced properties. This compares against current market value, 
                   not historical prices.
                 </p>
               </div>

                             {/* Value Categories */}
               <div>
                 <h4 className="font-semibold text-gray-900 mb-3">Value Categories</h4>
                <div className="space-y-3">
                  {bmvCategories.map((category) => (
                    <div key={category.category} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className={`p-2 rounded-full ${category.bgColor}`}>
                        <div className={category.textColor}>
                          {category.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{category.label}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            Score: {category.scoreRange}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{category.description}</p>
                        <p className="text-xs text-gray-500">{category.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoring Factors */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">How is the Score Calculated?</h4>
                <div className="space-y-3">
                  {scoringFactors.map((factor, index) => (
                    <div key={index} className="p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{factor.factor}</span>
                        <span className="text-xs bg-[#3A7CA5] text-white px-2 py-1 rounded">
                          {factor.factor.includes('50%') ? '50%' : 
                           factor.factor.includes('20%') ? '20%' : '10%'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{factor.description}</p>
                      <p className="text-xs text-gray-500">{factor.details}</p>
                    </div>
                  ))}
                </div>
              </div>

                             {/* Example */}
               <div className="bg-green-50 rounded-lg p-4">
                 <h4 className="font-semibold text-green-800 mb-2">Example</h4>
                 <div className="text-sm text-green-700 space-y-1">
                   <p>• A property priced at £200,000 when similar properties sell for £220,000</p>
                   <p>• 10% below market = High base score (8-9)</p>
                   <p>• 5 comparable sales = Good confidence bonus</p>
                   <p>• Rising market = Positive trend adjustment</p>
                   <p>• <strong>Final Deal Score: 8.5</strong> (Green badge with ↓ icon)</p>
                 </div>
               </div>

                             {/* Tips */}
               <div className="bg-yellow-50 rounded-lg p-4">
                 <h4 className="font-semibold text-yellow-800 mb-2">💡 Investment Tips</h4>
                 <ul className="text-sm text-yellow-700 space-y-1">
                   <li>• <strong>Green badges (7.0-10.0):</strong> Best investment opportunities</li>
                   <li>• <strong>Gray badges (4.0-6.9):</strong> Fair market value</li>
                   <li>• <strong>Red badges (1.0-3.9):</strong> Overpriced properties</li>
                   <li>• Higher deal scores don't guarantee profit - always do your own research</li>
                   <li>• Consider why a property is below market value (condition, location, etc.)</li>
                 </ul>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 