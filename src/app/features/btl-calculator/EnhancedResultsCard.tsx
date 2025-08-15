'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  PieChart, 
  Calculator, 
  ArrowUpRight, 
  Eye, 
  Download,
  CheckCircle,
  Target,
  Award,
  Chrome,
  Bookmark
} from 'lucide-react';
import { LineChart, DoughnutChart } from '../../components/ChartClientOnly';

export type BtlResults = {
  input: {
    postcode: string;
    region: string;
    purchasePrice: number;
    discountPct?: number;
    depositPct: number;
    refurbCost: number;
    stampDuty: number;
    legalFees: number;
    brokerFees: number;
    remortgageLtv: number;
    timelineMonths: number;
    adjustForInflation: boolean;
    monthlyRent?: number;
  };
  projections: {
    compoundHpiAnnualPct: number;
    projectedValue: number;
    inflationAdjustedValue?: number;
    appreciationGain?: number;
  };
  funding: {
    initialDeposit: number;
    initialMortgage: number;
    totalInitialInvestment: number;
    remortgageAmount: number;
    currentMortgageOutstanding: number;
    equityReleased: number;
    equityReleasedPctOfInitial: number;
    cashLeftInDeal: number;
    percentInitialLeft?: number;
  };
  inflation?: { rate: number; source?: string };
};

function Money({ value }: { value: number }) {
  return <span>£{Math.round(value).toLocaleString()}</span>;
}

function PercentBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0;
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      <TrendingUp className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} />
      {isPositive ? '+' : ''}{value.toFixed(1)}% {label}
    </div>
  );
}

export default function EnhancedResultsCard({ results, estimatedMonthlyCashFlow, timelineMonths }: { results: BtlResults; estimatedMonthlyCashFlow?: number; timelineMonths?: number }) {
  const [activeChart, setActiveChart] = useState<'composition' | 'timeline'>('composition');
  const r = results;
  
  const percentLeft = typeof r.funding.percentInitialLeft === 'number'
    ? r.funding.percentInitialLeft
    : (r.funding.cashLeftInDeal > 0 && r.funding.totalInitialInvestment > 0)
      ? r.funding.cashLeftInDeal / r.funding.totalInitialInvestment
      : 0;

  const brrr = (() => {
    if (percentLeft <= 0.3) return { 
      label: 'BRRR-friendly', 
      color: 'from-green-500 to-green-600', 
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      icon: Award 
    };
    if (percentLeft <= 0.45) return { 
      label: 'Borderline BRRR', 
      color: 'from-orange-500 to-orange-600', 
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
      icon: Target 
    };
    return { 
      label: 'Weak for BRRR', 
      color: 'from-red-500 to-red-600', 
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      icon: TrendingUp 
    };
  })();

  // Calculate performance metrics
  const grossYield = r.input.monthlyRent && r.input.purchasePrice > 0 
    ? ((r.input.monthlyRent * 12) / r.input.purchasePrice) * 100 
    : null;
  
  const roiPct = r.funding.totalInitialInvestment > 0 
    ? (r.funding.equityReleased / r.funding.totalInitialInvestment) * 100 
    : null;

  const appreciationReturn = r.projections.appreciationGain && r.funding.totalInitialInvestment > 0
    ? (r.projections.appreciationGain / r.funding.totalInitialInvestment) * 100
    : null;

  // Chart data and options
  const compositionData = {
    labels: ['Deposit', 'Stamp Duty', 'Legal & Broker', 'Refurbishment'],
    datasets: [{
      data: [
        r.funding.initialDeposit,
        r.input.stampDuty,
        r.input.legalFees + r.input.brokerFees,
        r.input.refurbCost
      ],
      backgroundColor: [
        '#3B82F6', // Blue
        '#EF4444', // Red
        '#F59E0B', // Amber
        '#10B981'  // Green
      ],
      borderWidth: 0
    }]
  };

  const compositionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            try {
              const dataset = context.chart.data.datasets[0] as any;
              const total = (dataset.data as number[]).reduce((a: number, b: number) => a + b, 0) || 0;
              const value = Number(context.parsed) || 0;
              const pct = total > 0 ? (value / total) * 100 : 0;
              return `${context.label}: £${value.toLocaleString()} (${pct.toFixed(1)}%)`;
            } catch {
              return `${context.label}: £${context.parsed.toLocaleString()}`;
            }
          }
        }
      }
    }
  };

  const timelineData = {
    labels: ['Purchase', 'Post-Refurb', `${r.input.timelineMonths}m Projection`],
    datasets: [{
      label: 'Property Value',
      data: [
        r.input.purchasePrice,
        r.input.purchasePrice + (r.input.refurbCost * 0.8), // Assume 80% value add from refurb
        r.projections.projectedValue
      ],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const timelineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Value: £${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return '£' + (value / 1000).toFixed(0) + 'k';
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Chrome Extension Promo Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-2">
              <Chrome className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">Supercharge your property sourcing</div>
              <div className="text-sm text-blue-100">Get instant BMV analysis on any property listing</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/30">
              Install Extension
            </button>
            <button className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10">
              View Watchlist
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Results Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Investment Analysis</div>
              <div className="flex items-center gap-2">
                <div className="text-xl font-bold text-gray-900">{r.input.region}</div>
                <div className="text-sm text-gray-500">• {r.input.postcode.toUpperCase()}</div>
              </div>
            </div>
            <div className={`rounded-xl ${brrr.bgColor} p-3`}>
              <brrr.icon className={`h-6 w-6 ${brrr.textColor}`} />
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Initial Investment */}
          <div className="rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <Calculator className="h-3 w-3" />
              Initial Investment
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              <Money value={r.funding.totalInitialInvestment} />
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Deposit <Money value={r.funding.initialDeposit} /> • Fees <Money value={r.input.stampDuty + r.input.legalFees + r.input.brokerFees} />
            </div>
          </div>

          {/* Projected Value */}
          <div className="rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <TrendingUp className="h-3 w-3" />
              Projected Value
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              <Money value={r.projections.projectedValue} />
            </div>
            <div className="mt-1 flex items-center gap-2">
              <PercentBadge value={r.projections.compoundHpiAnnualPct} label="HPI" />
              {appreciationReturn && (
                <div className="text-xs text-gray-500">
                  {appreciationReturn.toFixed(1)}% gain
                </div>
              )}
            </div>
          </div>

          {/* Equity Released */}
          <div className="rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <ArrowUpRight className="h-3 w-3" />
              Equity Released
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              <Money value={r.funding.equityReleased} />
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {(r.funding.equityReleasedPctOfInitial * 100).toFixed(1)}% of initial investment
            </div>
          </div>

          {/* Cash Left in Deal */}
          <div className="rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span className="inline-block h-1.5 w-1.5 rounded-sm bg-gray-400" />
              Cash Left in Deal
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              <Money value={r.funding.cashLeftInDeal} />
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {(percentLeft * 100).toFixed(1)}% of initial £{Math.round(r.funding.totalInitialInvestment).toLocaleString()}
            </div>
          </div>

          {/* Performance (emphasize ROI for compact summary) */}
          <div className="rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <PieChart className="h-3 w-3" />
              Performance
            </div>
            <div className="mt-2">
              <div className="text-[11px] text-gray-600">ROI</div>
              <div className="text-2xl font-bold text-gray-900">{roiPct ? `${roiPct.toFixed(1)}%` : '—'}</div>
              {grossYield && (
                <div className="mt-1 text-xs text-gray-500">Gross yield {grossYield.toFixed(1)}%</div>
              )}
            </div>
          </div>
        </div>

        {/* BRRR Analysis */}
        <div className="border-t border-gray-100 p-6">
          <div className={`rounded-xl ${brrr.bgColor} p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <brrr.icon className={`h-5 w-5 ${brrr.textColor}`} />
                <div>
                  <div className={`font-semibold ${brrr.textColor}`}>BRRR Strategy Assessment</div>
                  <div className="text-sm text-gray-600">
                    {percentLeft <= 0.3 ? 'Excellent refinancing opportunity' : 
                     percentLeft <= 0.45 ? 'Marginal refinancing potential' : 
                     'Consider alternative strategies'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${brrr.textColor}`}>{brrr.label}</div>
                <div className="text-sm text-gray-600">{(percentLeft * 100).toFixed(1)}% left in deal</div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${brrr.color}`} 
                  style={{ width: `${Math.min(100, Math.max(0, percentLeft * 100))}%` }} 
                />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Target: 25-30% for optimal BRRR strategy
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="border-t border-gray-100 p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Deal Analysis</h3>
            <div className="flex rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setActiveChart('composition')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeChart === 'composition' 
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Composition
              </button>
              <button
                onClick={() => setActiveChart('timeline')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeChart === 'timeline' 
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Timeline
              </button>
            </div>
          </div>
          <div className="mb-3 text-xs text-gray-600">
            This chart shows the composition of your total upfront deal cost. Total initial investment: <strong>£{Math.round(r.funding.totalInitialInvestment).toLocaleString()}</strong> (100%).
          </div>

          <div className="h-64">
            {activeChart === 'composition' ? (
              <DoughnutChart data={compositionData} options={compositionOptions} />
            ) : (
              <LineChart data={timelineData} options={timelineOptions} />
            )}
          </div>
        </div>

        {/* Payback Timeline */}
        <div className="border-t border-gray-100 p-6">
          <div className="rounded-lg border border-gray-100 p-4">
            <div className="text-sm font-medium text-gray-700">Full payback timeline</div>
            {typeof estimatedMonthlyCashFlow === 'number' && estimatedMonthlyCashFlow > 0 ? (
              (() => {
                const remaining = Math.max(0, r.funding.cashLeftInDeal || 0);
                const monthsAfterRefi = Math.ceil(remaining / estimatedMonthlyCashFlow);
                const totalMonths = (timelineMonths ?? 24) + (isFinite(monthsAfterRefi) ? monthsAfterRefi : 0);
                const years = Math.floor(totalMonths / 12);
                const months = totalMonths % 12;
                return (
                  <div className="mt-1 text-gray-900 text-lg font-semibold">
                    ≈ {years}y {months}m
                    <div className="mt-1 text-xs text-gray-500">
                      Assumes refinance at {timelineMonths ?? 24}m and net monthly cash flow of £{Math.round(estimatedMonthlyCashFlow).toLocaleString()} with £{Math.round(remaining).toLocaleString()} left in deal after refi.
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="mt-1 text-xs text-gray-500">
                Add monthly rent to estimate a payback timeline.
              </div>
            )}
          </div>
        </div>

        {/* Compact mobile summary for parity with Turnkey */}
        <div className="border-t border-gray-100 p-6 md:hidden">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <div className="text-[11px] text-gray-600">Equity Release</div>
              <div className="text-lg font-semibold">£{Math.round(r.funding.equityReleased).toLocaleString()}</div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <div className="text-[11px] text-gray-600">Cash Left</div>
              <div className="text-lg font-semibold">£{Math.round(r.funding.cashLeftInDeal).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* CRO Section */}
        <div className="border-t border-gray-100 bg-gray-50 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Save to Watchlist */}
            <div className="relative flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm">
              <div className="rounded-full bg-blue-100 p-2">
                <Bookmark className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Save Analysis</div>
                <div className="text-xs text-gray-500">Add to watchlist for tracking</div>
              </div>
              <button aria-label="Save analysis" className="absolute right-[-10px] top-1/2 -translate-y-1/2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700">
                Save
              </button>
            </div>

            {/* Export Report */}
            <div className="relative flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm">
              <div className="rounded-full bg-green-100 p-2">
                <Download className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Export Report</div>
                <div className="text-xs text-gray-500">Download PDF summary</div>
              </div>
              <button aria-label="Export report" className="absolute right-[-10px] top-1/2 -translate-y-1/2 rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-green-700">
                Export
              </button>
            </div>

            {/* View Similar */}
            <div className="relative flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm">
              <div className="rounded-full bg-purple-100 p-2">
                <Eye className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Similar Deals</div>
                <div className="text-xs text-gray-500">Find comparable properties</div>
              </div>
              <button aria-label="Explore similar deals" className="absolute right-[-10px] top-1/2 -translate-y-1/2 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-purple-700">
                Explore
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
