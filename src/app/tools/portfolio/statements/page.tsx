'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, TrendingUp, ArrowLeft, BarChart3, Home } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import Link from 'next/link';

interface MonthlyStatement {
  id: string;
  propertyId: string;
  statementMonth: string;
  rentalIncome: number;
  mortgagePayment: number;
  expenses: number;
  netProfit: number;
  notes?: string;
}

interface Property {
  id: string;
  address: string;
  postcode: string;
  monthlyRent?: number;
  monthlyMortgagePayment?: number;
  monthlyExpenses?: number;
}

export default function MonthlyStatementsPage() {
  const [user, setUser] = useState<any>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [statements, setStatements] = useState<MonthlyStatement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format

  useEffect(() => {
    if (typeof window === 'undefined' || !supabase) {
      setIsLoading(false);
      return;
    }
    
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setUser(data.session.user);
        }
      } catch (error) {
        console.error('Auth error:', error);
      }
    };

    initializeAuth();
  }, [supabase]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Load properties
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('portfolio_properties')
          .select('id, address, postcode, monthly_rent, monthly_mortgage_payment, monthly_expenses')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (propertiesError) {
          console.error('Error loading properties:', propertiesError);
          return;
        }

        setProperties(propertiesData || []);

        // Load statements for selected month
        const startDate = new Date(selectedMonth + '-01');
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

        const { data: statementsData, error: statementsError } = await supabase
          .from('portfolio_monthly_statements')
          .select('*')
          .eq('user_id', user.id)
          .gte('statement_month', startDate.toISOString().split('T')[0])
          .lte('statement_month', endDate.toISOString().split('T')[0]);

        if (statementsError) {
          console.error('Error loading statements:', statementsError);
          return;
        }

        setStatements(statementsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, selectedMonth]);

  const generateMonthlyStatement = async () => {
    if (!user || properties.length === 0) return;

    const startDate = new Date(selectedMonth + '-01');
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const newStatements: any[] = [];

    for (const property of properties) {
      const rentalIncome = property.monthlyRent || 0;
      const mortgagePayment = property.monthlyMortgagePayment || 0;
      const expenses = property.monthlyExpenses || 0;
      const netProfit = rentalIncome - mortgagePayment - expenses;

      newStatements.push({
        user_id: user.id,
        property_id: property.id,
        statement_month: startDate.toISOString().split('T')[0],
        rental_income: rentalIncome,
        mortgage_payment: mortgagePayment,
        expenses: expenses,
        net_profit: netProfit,
      });
    }

    try {
      const { error } = await supabase
        .from('portfolio_monthly_statements')
        .upsert(newStatements, { onConflict: 'property_id,statement_month' });

      if (error) {
        console.error('Error generating statements:', error);
        alert('Failed to generate monthly statements. Please try again.');
        return;
      }

      // Reload statements
      const { data: statementsData, error: statementsError } = await supabase
        .from('portfolio_monthly_statements')
        .select('*')
        .eq('user_id', user.id)
        .gte('statement_month', startDate.toISOString().split('T')[0])
        .lte('statement_month', endDate.toISOString().split('T')[0]);

      if (!statementsError) {
        setStatements(statementsData || []);
      }
    } catch (error) {
      console.error('Error generating statements:', error);
      alert('Failed to generate monthly statements. Please try again.');
    }
  };

  const totalRentalIncome = statements.reduce((sum, s) => sum + s.rentalIncome, 0);
  const totalMortgagePayments = statements.reduce((sum, s) => sum + s.mortgagePayment, 0);
  const totalExpenses = statements.reduce((sum, s) => sum + s.expenses, 0);
  const totalNetProfit = statements.reduce((sum, s) => sum + s.netProfit, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
            <p className="text-gray-600">Please sign in to view your monthly statements.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 opacity-10"></div>
        <div className="relative max-w-screen-2xl w-[90vw] mx-auto pt-20 pb-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mb-4">
                <Calendar className="w-4 h-4 mr-2" />
                Monthly Statements
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight"
            >
              Monthly Portfolio
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                Statements
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
            >
              Track your monthly rental income, mortgage payments, and net profit across your property portfolio.
            </motion.p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Link
            href="/portfolio-tracker"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolio
          </Link>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-soft p-6 mb-8 border border-gray-200"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Select Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <button
              onClick={generateMonthlyStatement}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 transition-colors font-medium"
            >
              Generate Statement
            </button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-7 h-7 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Total Rental Income</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">£{totalRentalIncome.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Home className="w-7 h-7 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Total Mortgage Payments</h3>
            </div>
            <p className="text-3xl font-bold text-red-600">£{totalMortgagePayments.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-7 h-7 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Total Expenses</h3>
            </div>
            <p className="text-3xl font-bold text-orange-600">£{totalExpenses.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-7 h-7 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Net Profit</h3>
            </div>
            <p className={`text-3xl font-bold ${totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              £{totalNetProfit.toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Statements List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          {statements.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-50 to-blue-50 rounded-full flex items-center justify-center shadow-soft">
                <Calendar className="w-16 h-16 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Monthly Statements</h3>
              <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                Generate a monthly statement to see your rental income, mortgage payments, and net profit breakdown.
              </p>
              <button
                onClick={generateMonthlyStatement}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold hover:from-blue-600 hover:to-purple-600 focus:ring-2 focus:ring-purple-600 transition shadow-soft"
              >
                <Calendar className="w-5 h-5" />
                Generate First Statement
              </button>
            </div>
          ) : (
            statements.map((statement, index) => {
              const property = properties.find(p => p.id === statement.propertyId);
              return (
                <div
                  key={statement.id}
                  className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {property?.address || 'Unknown Property'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">{property?.postcode}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Rental Income</p>
                          <p className="font-semibold text-green-600">£{statement.rentalIncome.toLocaleString()}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Mortgage Payment</p>
                          <p className="font-semibold text-red-600">£{statement.mortgagePayment.toLocaleString()}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                          <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Expenses</p>
                          <p className="font-semibold text-orange-600">£{statement.expenses.toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Net Profit</p>
                          <p className={`font-semibold ${statement.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            £{statement.netProfit.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </motion.div>
      </main>
    </div>
  );
} 