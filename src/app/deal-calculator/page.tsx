'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, Target } from 'lucide-react';
import DealCalculator from '../components/DealCalculator';

export default function DealCalculatorPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Standardized Header */}
        <section className="mb-10 max-w-3xl mx-auto pt-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Calculator className="w-7 h-7 text-blue-600" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-0" id="page-title">Deal Calculator</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4" id="page-description">
            Analyze property investment opportunities with our comprehensive deal calculator. Calculate ROI, yields, and cash flow to make informed investment decisions.
          </p>
        </section>

        {/* Deal Calculator Component */}
        <section className="mt-8 md:mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <DealCalculator />
            </div>
          </motion.div>
        </section>

        {/* Additional Information */}
        <section className="mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white/80 shadow-lg rounded-2xl p-8 border border-slate-200 max-w-4xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">How to Use the Deal Calculator</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Input Fields</h3>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>Purchase Price:</strong> The total cost to buy the property</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>Refurbishment Costs:</strong> Any renovation or improvement expenses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>Monthly Rent:</strong> Expected rental income per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>Mortgage Rate:</strong> Annual interest rate on your mortgage</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Key Metrics</h3>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>ROI:</strong> Return on investment percentage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>Gross Yield:</strong> Annual rent as percentage of purchase price</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>Net Yield:</strong> Annual profit after expenses as percentage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>Cash Flow:</strong> Monthly profit after all costs</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Investment Tip</h4>
              <p className="text-blue-800 text-sm">
                A good investment typically has a net yield of 5-8% and positive cash flow. 
                Consider factors like location, property condition, and market trends when evaluating deals.
              </p>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
} 