'use client';

import { DoughnutChart, LineChart, BarChart } from '@/app/components/ChartClientOnly';
import type { BtlResults } from './ResultsCard';

export default function ResultsCharts({ results }: { results: BtlResults }) {
  const r = results;

  // Donut: initial investment composition
  const initialLabels = ['Deposit', 'Stamp', 'Fees', 'Refurb'];
  const initialValues = [
    r.funding.initialDeposit,
    r.input.stampDuty,
    r.input.legalFees + r.input.brokerFees,
    r.input.refurbCost,
  ];
  const donutData = {
    labels: initialLabels,
    datasets: [{
      data: initialValues,
      backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#9333ea'],
      borderWidth: 0,
    }],
  };

  // Stacked bar: refinance composition
  const refinanceLabels = ['At refinance'];
  const outstanding = r.funding.currentMortgageOutstanding;
  const remortgage = r.funding.remortgageAmount;
  const equity = Math.max(0, r.funding.equityReleased);
  const cashLeft = Math.max(0, r.funding.cashLeftInDeal);
  const stackedData = {
    labels: refinanceLabels,
    datasets: [
      { label: 'Outstanding', data: [outstanding], backgroundColor: '#ef4444' },
      { label: 'Remortgage', data: [remortgage], backgroundColor: '#2563eb' },
      { label: 'Equity released', data: [equity], backgroundColor: '#10b981' },
      { label: 'Cash left', data: [cashLeft], backgroundColor: '#f59e0b' },
    ],
  };
  const stackedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } },
    scales: { x: { stacked: true }, y: { stacked: true } },
  };

  // Line: value trajectory
  const purchaseMV = r.projections?.purchaseMarketValue ?? r.input.purchasePrice;
  const postRefurb = r.projections?.postRefurbValue ?? purchaseMV + r.input.refurbCost;
  const projected = r.projections.projectedValue;
  const lineData = {
    labels: ['Purchase MV', 'Post‑refurb', `${r.input.timelineMonths}m projected`],
    datasets: [{
      label: 'Property value',
      data: [purchaseMV, postRefurb, projected],
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.15)',
      fill: true,
      tension: 0.3,
    }],
  };

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-md border border-gray-200 bg-white p-3">
        <div className="mb-2 text-sm font-medium text-gray-700">Initial investment breakdown</div>
        <div className="h-52">
          <DoughnutChart data={donutData as any} />
        </div>
      </div>
      <div className="rounded-md border border-gray-200 bg-white p-3">
        <div className="mb-2 text-sm font-medium text-gray-700">Refinance composition</div>
        <div className="h-52">
          <BarChart data={stackedData as any} options={stackedOptions as any} />
        </div>
      </div>
      <div className="rounded-md border border-gray-200 bg-white p-3">
        <div className="mb-2 text-sm font-medium text-gray-700">Value trajectory</div>
        <div className="h-52">
          <LineChart data={lineData as any} />
        </div>
      </div>
    </div>
  );
}


