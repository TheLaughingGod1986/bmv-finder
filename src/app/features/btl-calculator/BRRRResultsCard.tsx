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
  Bookmark,
  Brain,
  Zap,
  BarChart3
} from 'lucide-react';
import { LineChart, DoughnutChart } from '../../components/ChartClientOnly';

export type BrrrResults = {
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
    realProjectedValue?: number;
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
  predictions?: {
    propertyGrowth: number;
    rentalYield: number;
    predictedRoi: number;
    confidence: number;
    factors: string[];
  };
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

export default function BRRRResultsCard({ results, predictions }: { results: BrrrResults; predictions?: BrrrResults['predictions'] }) {
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

  const netYield = grossYield && r.input.monthlyRent ? grossYield - 2 : null; // Approximate costs

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
      {/* AI Predictions Section */}
      {predictions && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-100 p-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">AI-Powered Predictions</div>
                  <div className="text-sm text-gray-500">Machine Learning Enhanced</div>
                </div>
              </div>
              <div className="rounded-full bg-gray-100 p-2">
                <BarChart3 className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Prediction Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <div className="text-sm font-medium text-gray-700">Property Growth</div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{predictions.propertyGrowth.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">Annual appreciation</div>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <div className="text-sm font-medium text-gray-700">Rental Yield</div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{predictions.rentalYield.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">Annual rental return</div>
              </div>

              <div className="rounded-lg bg-purple-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <div className="text-sm font-medium text-gray-700">Predicted ROI</div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{predictions.predictedRoi.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">Return on investment</div>
              </div>
            </div>

            {/* Confidence Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">Prediction Confidence</div>
                <div className="text-sm font-semibold text-gray-900">{predictions.confidence.toFixed(1)}%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-red-500 to-yellow-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, predictions.confidence)}%` }}
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="rounded-full bg-red-100 p-1">
                  <Target className="h-3 w-3 text-red-600" />
                </div>
                <div className="text-xs text-gray-600">Low confidence</div>
              </div>
            </div>

            {/* Key Factors */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Key Factors Considered</div>
              <ul className="space-y-1">
                {predictions.factors.map((factor, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Last updated: {new Date().toLocaleDateString('en-GB')}</div>
              <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                <Zap className="h-3 w-3" />
                Refresh Predictions
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Results Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">BRRR Analysis</div>
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
              {r.projections.appreciationGain && (
                <div className="text-xs text-gray-500">
                  {((r.projections.appreciationGain / r.funding.totalInitialInvestment) * 100).toFixed(1)}% gain
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
        </div>

        {/* Financial Metrics */}
        <div className="border-t border-gray-100 p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">ROI</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {roiPct ? `${roiPct.toFixed(1)}%` : '0.00%'}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gross Yield</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {grossYield ? `${grossYield.toFixed(1)}%` : '0.00%'}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net Yield</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {netYield ? `${netYield.toFixed(1)}%` : '0.00%'}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Mortgage</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                <Money value={r.funding.currentMortgageOutstanding / 12} />
              </div>
            </div>
          </div>
        </div>

        {/* Projected Values */}
        <div className="border-t border-gray-100 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Projected Value (2 Years)
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                <Money value={r.projections.projectedValue} />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Assumes {r.projections.compoundHpiAnnualPct.toFixed(2)}% annual growth
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Potential Equity Release (2 Years)
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                <Money value={r.funding.equityReleased} />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Remortgage to {r.input.remortgageLtv}% LTV, interest-only
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Cash Left in Deal (vs Initial Investment)
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                <Money value={r.funding.cashLeftInDeal} />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Initial investment <Money value={r.funding.totalInitialInvestment} />
              </div>
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
