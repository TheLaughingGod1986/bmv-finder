'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, Target, Star, ArrowRight } from 'lucide-react';
import DealCalculator from '../components/DealCalculator';
import BTLCalculatorForm from '../features/btl-calculator/BTLCalculatorForm';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DealCalculatorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<'vanilla' | 'brrr'>('vanilla');

  // Initialize from URL (?mode=brrr)
  useEffect(() => {
    const m = searchParams?.get('mode');
    if (m === 'brrr' || m === 'vanilla') {
      setTab(m);
    }
  }, [searchParams]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-10"></div>
          <div className="relative max-w-screen-2xl w-[90vw] mx-auto pt-20 pb-16">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-6"
              >
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                  <Calculator className="w-4 h-4 mr-2" />
                  Professional Investment Analysis
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight"
              >
                Investment Calculator
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  ROI & Cash Flow Analysis
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
              >
                Calculate ROI, yields, and cash flow to make informed investment decisions with our comprehensive deal analysis tools.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Main Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Deal Calculator Tabs */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {/* Tabs */}
              <div className="mb-4 flex w-full items-center justify-center">
                <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setTab('vanilla')}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                      tab === 'vanilla' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Buy-to-Let (Turnkey)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('brrr')}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                      tab === 'brrr' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    BRRR (Buy • Refurbish • Rent • Refinance)
                  </button>
                </div>
              </div>
              {/* Body */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-8">
                {tab === 'vanilla' ? (
                  <DealCalculator />
                ) : (
                  <BTLCalculatorForm />
                )}
              </div>
            </motion.div>
          </section>

          {/* How to Use Section */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/80 shadow-xl rounded-2xl p-8 border border-gray-200 max-w-4xl mx-auto"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                How to Use the Deal Calculator
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-600" />
                    Input Fields
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Purchase Price:</strong> The total cost to buy the property</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Refurbishment Costs:</strong> Any renovation or improvement expenses</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Monthly Rent:</strong> Expected rental income per month</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Mortgage Rate:</strong> Annual interest rate on your mortgage</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Key Metrics
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>ROI:</strong> Return on investment percentage</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Gross Yield:</strong> Annual rent as percentage of purchase price</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Net Yield:</strong> Annual profit after expenses as percentage</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Cash Flow:</strong> Monthly profit after all costs</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Investment Tip
                </h4>
                <p className="text-blue-800">
                  A good investment typically has a net yield of 5-8% and positive cash flow. 
                  Consider factors like location, property condition, and market trends when evaluating deals.
                </p>
              </div>
            </motion.div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
            >
              <h3 className="text-2xl font-bold mb-4">Ready to Analyze More Properties?</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Use our advanced deal analysis tool to get comprehensive property insights, 
                market trends, and professional valuation estimates.
              </p>
              <button
                onClick={() => window.location.href = '/advanced-deal-analysis'}
                className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Try Advanced Deal Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </motion.div>
          </section>
        </div>
      </main>
    </div>
  );
} 