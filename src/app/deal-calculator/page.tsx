'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, Target } from 'lucide-react';
import DealCalculator from '../components/DealCalculator';

export default function DealCalculatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <section className="mb-12">
          <div className="bg-white/80 shadow-lg rounded-2xl p-8 md:p-12 max-w-4xl mx-auto text-center border border-slate-200">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center mb-4"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Calculator className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold mb-4 text-blue-800 leading-tight"
            >
              Deal Calculator
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-700 mb-6 font-medium"
            >
              Analyze property investment opportunities with our comprehensive deal calculator. 
              Calculate ROI, yields, and cash flow to make informed investment decisions.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto"
            >
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <TrendingUp className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">ROI Analysis</h3>
                  <p className="text-sm text-blue-800">Calculate return on investment including all costs and potential returns</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <Target className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Yield Calculation</h3>
                  <p className="text-sm text-green-800">Determine gross and net rental yields for your investment</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <Calculator className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-purple-900 mb-1">Cash Flow</h3>
                  <p className="text-sm text-purple-800">Understand monthly cash flow after all expenses and mortgage</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Deal Calculator Component */}
        <section className="mt-8 md:mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <DealCalculator className="w-full" />
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