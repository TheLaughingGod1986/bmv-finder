import React, { useState } from 'react';

// Reusable input component
function InputField({ label, value, onChange, type = 'number', required = false, min, step, ...props }) {
  return (
    <div className="mb-4 w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        min={min}
        step={step}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-base"
        {...props}
      />
    </div>
  );
}

function formatCurrency(val) {
  if (isNaN(val)) return '—';
  return '£' + Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatPercent(val) {
  if (isNaN(val)) return '—';
  return val.toFixed(2) + '%';
}

export default function DealCalculator() {
  // State for inputs
  const [address, setAddress] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [refurbCost, setRefurbCost] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [ltv, setLtv] = useState('75');
  const [deposit, setDeposit] = useState('');
  const [ltvMode, setLtvMode] = useState<'ltv' | 'deposit'>('ltv');
  const [otherExpenses, setOtherExpenses] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [savedDeals, setSavedDeals] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dealCalculatorDeals');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Derived/calculated values
  const p = Number(purchasePrice) || 0;
  const refurb = Number(refurbCost) || 0;
  const rent = Number(monthlyRent) || 0;
  const rate = Number(interestRate) / 100 || 0;
  const expenses = Number(otherExpenses) || 0;

  // LTV/Deposit logic
  let ltvVal = Number(ltv) / 100 || 0.75;
  let depositVal = Number(deposit) || 0;
  if (ltvMode === 'ltv') {
    depositVal = p > 0 ? p - (p * ltvVal) : 0;
  } else {
    ltvVal = p > 0 ? 1 - (depositVal / p) : 0.75;
  }

  const loanAmount = p * ltvVal;
  const initialInvestment = depositVal + refurb;

  // Monthly mortgage payment (interest only)
  const monthlyInterest = loanAmount * rate / 12;

  // Net monthly income
  const netMonthlyIncome = rent - monthlyInterest - expenses;
  const netAnnualIncome = netMonthlyIncome * 12;

  // Metrics
  const roi = initialInvestment > 0 ? (netAnnualIncome / initialInvestment) * 100 : 0;
  const grossYield = p > 0 ? (rent * 12 / p) * 100 : 0;
  const netYield = p > 0 ? (netAnnualIncome / p) * 100 : 0;
  const totalMonthlyCashFlow = netMonthlyIncome;

  // Validation
  const isValid = p > 0 && rent > 0 && rate > 0 && ltvVal > 0 && ltvVal <= 1 && address.trim().length > 0;

  // Save deal
  const handleSave = () => {
    const deal = {
      address,
      purchasePrice: p,
      refurbCost: refurb,
      monthlyRent: rent,
      interestRate: rate * 100,
      ltv: ltvVal * 100,
      deposit: depositVal,
      otherExpenses: expenses,
      roi,
      grossYield,
      netYield,
      totalMonthlyCashFlow,
      date: new Date().toISOString(),
    };
    const updated = [deal, ...savedDeals].slice(0, 10);
    setSavedDeals(updated);
    localStorage.setItem('dealCalculatorDeals', JSON.stringify(updated));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-10 mt-8 mb-12">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Deal Calculator</h2>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={e => e.preventDefault()}>
        <InputField label="Property Address" value={address} onChange={setAddress} required type="text" maxLength={120} />
        <InputField label="Purchase Price" value={purchasePrice} onChange={val => { setPurchasePrice(val); if (ltvMode === 'ltv') setDeposit(''); }} required min={0} />
        <InputField label="Refurbishment Costs" value={refurbCost} onChange={setRefurbCost} min={0} />
        <InputField label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} required min={0} />
        <InputField label="Mortgage Interest Rate (%)" value={interestRate} onChange={setInterestRate} required min={0} step={0.01} />
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button type="button" className={`px-2 py-1 rounded text-xs font-semibold ${ltvMode === 'ltv' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setLtvMode('ltv')}>Edit LTV</button>
            <button type="button" className={`px-2 py-1 rounded text-xs font-semibold ${ltvMode === 'deposit' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setLtvMode('deposit')}>Edit Deposit</button>
          </div>
          {ltvMode === 'ltv' ? (
            <InputField label="Loan-to-Value (%)" value={ltv} onChange={val => { setLtv(val); setDeposit(''); }} required min={0} max={100} step={0.1} />
          ) : (
            <InputField label="Deposit (£)" value={deposit} onChange={val => { setDeposit(val); setLtv(''); }} required min={0} max={purchasePrice || undefined} />
          )}
        </div>
        <InputField label="Other Monthly Expenses" value={otherExpenses} onChange={setOtherExpenses} min={0} />
      </form>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-xl p-4 flex flex-col items-center">
          <div className="text-lg font-semibold text-blue-700 mb-1">ROI</div>
          <div className="text-2xl font-bold text-blue-900">{formatPercent(roi)}</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 flex flex-col items-center">
          <div className="text-lg font-semibold text-purple-700 mb-1">Gross Yield</div>
          <div className="text-2xl font-bold text-purple-900">{formatPercent(grossYield)}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 flex flex-col items-center">
          <div className="text-lg font-semibold text-green-700 mb-1">Net Yield</div>
          <div className="text-2xl font-bold text-green-900">{formatPercent(netYield)}</div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 flex flex-col items-center">
          <div className="text-lg font-semibold text-orange-700 mb-1">Monthly Mortgage Payment</div>
          <div className="text-2xl font-bold text-orange-900">{formatCurrency(monthlyInterest)}</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 flex flex-col items-center md:col-span-2">
          <div className="text-lg font-semibold text-yellow-700 mb-1">Total Monthly Cash Flow</div>
          <div className="text-2xl font-bold text-yellow-900">{formatCurrency(totalMonthlyCashFlow)}</div>
        </div>
      </div>
      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <button
          type="button"
          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-all disabled:opacity-50"
          onClick={handleSave}
          disabled={!isValid}
        >
          Save Deal
        </button>
        <button
          type="button"
          className="px-6 py-2 rounded-lg bg-gray-100 text-blue-700 font-semibold shadow hover:bg-blue-200 transition-all"
          onClick={() => setShowSaved(true)}
        >
          View Saved Deals
        </button>
      </div>
      {/* Saved Deals Modal */}
      {showSaved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              onClick={() => setShowSaved(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-xl font-bold text-blue-800 mb-4">Saved Deals</h3>
            {savedDeals.length === 0 ? (
              <div className="text-gray-500">No saved deals yet.</div>
            ) : (
              <ul className="space-y-4 max-h-96 overflow-y-auto">
                {savedDeals.map((deal, idx) => (
                  <li key={idx} className="bg-blue-50 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <div className="text-sm text-gray-700 font-semibold">{deal.address}</div>
                        <div className="text-sm text-gray-700">Purchase: {formatCurrency(deal.purchasePrice)}, Refurb: {formatCurrency(deal.refurbCost)}, Rent: {formatCurrency(deal.monthlyRent)}</div>
                        <div className="text-xs text-gray-500">Saved: {new Date(deal.date).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-blue-700 font-semibold">ROI: {formatPercent(deal.roi)}</span>
                        <span className="text-purple-700 font-semibold">Gross: {formatPercent(deal.grossYield)}</span>
                        <span className="text-green-700 font-semibold">Net: {formatPercent(deal.netYield)}</span>
                        <span className="text-yellow-700 font-semibold">Cash Flow: {formatCurrency(deal.totalMonthlyCashFlow)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 