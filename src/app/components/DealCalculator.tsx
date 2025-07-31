import { useState, useEffect } from 'react';
import Button from './Button';
import { useToast } from './ToastProvider';
import { supabase } from '../../lib/supabaseClient';
import DealCalculatorAddressInput from './DealCalculatorAddressInput';

// Reusable input component
interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: number;
  step?: number;
  maxLength?: number;
  max?: number;
  [key: string]: unknown;
}

// Type for saved deals
interface SavedDeal {
  id?: string;
  address: string;
  purchasePrice: number;
  refurbCost: number;
  monthlyRent: number;
  interestRate: number;
  ltv: number;
  deposit: number;
  otherExpenses: number;
  roi: number;
  grossYield: number;
  netYield: number;
  totalMonthlyCashFlow: number;
  date: string;
  postcode?: string;
  propertyType?: string;
  notes?: string;
  status?: 'active' | 'sold' | 'watching';
}

function InputField({ label, value, onChange, type = 'number', required = false, min, step, ...props }: InputFieldProps) {
  return (
    <div className="mb-4 w-full">
      <label className="block text-base font-semibold text-primary mb-1">{label}{required && <span className="text-gold">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        min={min}
        step={step}
        className="w-full px-4 py-2 border-2 border-taupe rounded-xl bg-beige text-primary focus:ring-2 focus:ring-gold focus:border-gold transition-all text-base shadow-sm"
        {...props}
      />
    </div>
  );
}

function formatCurrency(val: number): string {
  if (isNaN(val)) return '—';
  return '£' + Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatPercent(val: number): string {
  if (isNaN(val)) return '—';
  return val.toFixed(2) + '%';
}

export default function DealCalculator() {
  const { showToast } = useToast();
  
  // State for inputs
  const [postcode, setPostcode] = useState('');
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
  const [savedDeals, setSavedDeals] = useState<SavedDeal[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Authentication and portfolio loading
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  // Load saved deals from portfolio
  useEffect(() => {
    const loadSavedDeals = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/portfolio/add?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.portfolio) {
            // Convert portfolio properties to saved deals format
            const deals = data.portfolio.map((property: any) => ({
              id: property.id,
              address: property.address,
              purchasePrice: property.purchase_price,
              refurbCost: 0, // Not stored in portfolio
              monthlyRent: property.monthly_rent || 0,
              interestRate: 0, // Not stored in portfolio
              ltv: 0, // Not stored in portfolio
              deposit: 0, // Not stored in portfolio
              otherExpenses: 0, // Not stored in portfolio
              roi: property.deal_score || 0,
              grossYield: property.yield || 0,
              netYield: property.yield || 0,
              totalMonthlyCashFlow: property.monthly_rent || 0,
              date: property.created_at,
              postcode: property.postcode,
              propertyType: property.property_type,
              notes: property.notes,
              status: property.status
            }));
            setSavedDeals(deals);
          }
        }
      } catch (error) {
        console.error('Error loading saved deals:', error);
      }
    };

    loadSavedDeals();
  }, [user]);

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

  // Save deal to portfolio
  const handleSave = async () => {
    if (!user) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to save deals'
      });
      return;
    }

    // Validate required fields
    if (!postcode.trim() || !address.trim()) {
      showToast({
        type: 'error',
        title: 'Missing Information',
        message: 'Please enter both postcode and property address'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Use the dedicated postcode field
      const postcodeValue = postcode.trim().toUpperCase();
      
      // Extract house number from address
      const houseNumberMatch = address.match(/^(\d+)/);
      const houseNumber = houseNumberMatch ? houseNumberMatch[1] : '';

      const dealData = {
        address,
        postcode: postcodeValue,
        houseNumber,
        propertyType: 'Residential', // Default
        purchasePrice: p,
        currentValue: p, // Same as purchase price initially
        purchaseDate: new Date().toISOString().split('T')[0],
        dealScore: roi,
        dealRating: roi > 10 ? 'Excellent' : roi > 5 ? 'Good' : 'Fair',
        bmvScore: Math.round((roi / 15) * 100), // Convert ROI to BMV score
        monthlyRent: rent,
        yield: grossYield,
        mortgageBalance: loanAmount,
        mortgageType: 'repayment',
        mortgageRate: rate,
        monthlyMortgagePayment: monthlyInterest,
        depositAmount: deposit,
        agentFees: 0,
        otherFees: refurb,
        monthlyExpenses: otherExpenses,
        propertyNotes: `Deal Calculator: ROI ${roi.toFixed(2)}%, Gross Yield ${grossYield.toFixed(2)}%, Net Yield ${netYield.toFixed(2)}%, Monthly Cash Flow ${formatCurrency(totalMonthlyCashFlow)}, Refurb Cost ${formatCurrency(refurb)}, Interest Rate ${(rate * 100).toFixed(2)}%, LTV ${(ltvVal * 100).toFixed(1)}%`,
        notes: `Deal Calculator: ROI ${roi.toFixed(2)}%, Gross Yield ${grossYield.toFixed(2)}%, Net Yield ${netYield.toFixed(2)}%, Monthly Cash Flow ${formatCurrency(totalMonthlyCashFlow)}, Refurb Cost ${formatCurrency(refurb)}, Interest Rate ${(rate * 100).toFixed(2)}%, LTV ${(ltvVal * 100).toFixed(1)}%`,
        status: 'active' as const,
        userId: user.id
      };

      const response = await fetch('/api/portfolio/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealData),
      });

      if (response.ok) {
        const result = await response.json();
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Deal saved to portfolio successfully!'
        });
        
        // Reload saved deals
        const dealsResponse = await fetch(`/api/portfolio/add?userId=${user.id}`);
        if (dealsResponse.ok) {
          const data = await dealsResponse.json();
          if (data.success && data.portfolio) {
            const deals = data.portfolio.map((property: any) => ({
              id: property.id,
              address: property.address,
              purchasePrice: property.purchase_price,
              refurbCost: property.other_fees || 0,
              monthlyRent: property.monthly_rent || 0,
              interestRate: property.mortgage_rate ? property.mortgage_rate * 100 : 0,
              ltv: 0,
              deposit: property.deposit_amount || 0,
              otherExpenses: property.monthly_expenses || 0,
              roi: property.deal_score || 0,
              grossYield: property.yield || 0,
              netYield: property.yield || 0,
              totalMonthlyCashFlow: property.monthly_rent || 0,
              date: property.created_at,
              postcode: property.postcode,
              propertyType: property.property_type,
              notes: property.notes,
              status: property.status
            }));
            setSavedDeals(deals);
          }
        }
      } else {
        const error = await response.json();
        showToast({
          type: 'error',
          title: 'Error',
          message: error.error || 'Failed to save deal'
        });
      }
    } catch (error) {
      console.error('Error saving deal:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save deal'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-10 mt-8 mb-12">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Deal Calculator</h2>
      {!user && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-yellow-800 text-sm">
            💡 <strong>Sign in</strong> to save your deals to your portfolio and track them over time.
          </p>
        </div>
      )}
      <form className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-beige rounded-3xl shadow-xl border border-taupe p-8" onSubmit={e => e.preventDefault()}>
        <DealCalculatorAddressInput
          postcode={postcode}
          onPostcodeChange={setPostcode}
          address={address}
          onAddressChange={setAddress}
          onAddressSelect={(selectedAddress) => {
            // Optionally auto-fill some fields based on selected address
            console.log('Selected address:', selectedAddress);
          }}
          required
          className="md:col-span-2"
        />
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
            <InputField label="Deposit (£)" value={deposit} onChange={val => { setDeposit(val); setLtv(''); }} required min={0} max={Number(purchasePrice) || undefined} />
          )}
        </div>
        <InputField label="Other Monthly Expenses" value={otherExpenses} onChange={setOtherExpenses} min={0} />
      </form>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-softgrey rounded-2xl p-6 flex flex-col items-center border-2 border-gold shadow-md">
          <div className="text-lg font-semibold text-primary mb-1">ROI</div>
          <div className="text-2xl font-bold text-gold">{formatPercent(roi)}</div>
        </div>
        <div className="bg-softgrey rounded-2xl p-6 flex flex-col items-center border-2 border-silver shadow-md">
          <div className="text-lg font-semibold text-green mb-1">Gross Yield</div>
          <div className="text-2xl font-bold text-silver">{formatPercent(grossYield)}</div>
        </div>
        <div className="bg-beige rounded-2xl p-6 flex flex-col items-center border-2 border-taupe shadow-md">
          <div className="text-lg font-semibold text-green-light mb-1">Net Yield</div>
          <div className="text-2xl font-bold text-primary">{formatPercent(netYield)}</div>
        </div>
        <div className="bg-taupe rounded-2xl p-6 flex flex-col items-center border-2 border-gold shadow-md">
          <div className="text-lg font-semibold text-gold mb-1">Monthly Mortgage Payment</div>
          <div className="text-2xl font-bold text-beige">{formatCurrency(monthlyInterest)}</div>
        </div>
        <div className="bg-gold rounded-2xl p-6 flex flex-col items-center md:col-span-2 border-2 border-silver shadow-md">
          <div className="text-lg font-semibold text-beige mb-1">Total Monthly Cash Flow</div>
          <div className="text-2xl font-bold text-primary">{formatCurrency(totalMonthlyCashFlow)}</div>
        </div>
      </div>
      <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <Button
          type="button"
          className="px-7 py-3 rounded-2xl bg-primary text-beige font-bold border-2 border-gold lux-accent-gold shadow-md hover:bg-primary-light transition-colors disabled:opacity-50"
          onClick={handleSave}
          disabled={!isValid || isLoading}
        >
          {isLoading ? 'Saving...' : 'Add to Portfolio'}
        </Button>
        <Button
          type="button"
          className="px-7 py-3 rounded-2xl bg-taupe text-primary font-bold border-2 border-silver lux-accent-silver shadow-md hover:bg-gold hover:text-beige transition-colors"
          onClick={() => setShowSaved(true)}
        >
          View Portfolio
        </Button>
      </div>
      {/* Saved Deals Modal */}
      {showSaved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-beige rounded-3xl shadow-2xl border-2 border-taupe p-10 max-w-lg w-full relative">
            <button
              className="absolute top-4 right-4 text-gold hover:text-primary text-2xl font-bold focus:outline-none"
              onClick={() => setShowSaved(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-primary">Portfolio Properties</h3>
              <a 
                href="/portfolio-tracker" 
                className="text-sm text-gold hover:text-primary font-medium transition-colors"
              >
                View Full Portfolio →
              </a>
            </div>
            {savedDeals.length === 0 ? (
              <div className="text-taupe">No properties in portfolio yet. Save your first deal to get started!</div>
            ) : (
              <ul className="space-y-4 max-h-96 overflow-y-auto">
                {savedDeals.map((deal, idx) => (
                  <li key={idx} className="bg-softgrey rounded-2xl border-2 border-taupe p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <div className="text-sm text-primary font-semibold">{deal.address}</div>
                        <div className="text-sm text-taupe">
                          Purchase: {formatCurrency(deal.purchasePrice)}
                          {deal.postcode && ` • ${deal.postcode}`}
                          {deal.propertyType && ` • ${deal.propertyType}`}
                        </div>
                        <div className="text-xs text-silver">Added: {new Date(deal.date).toLocaleDateString()}</div>
                        {deal.status && (
                          <div className="text-xs text-gold font-medium capitalize">{deal.status}</div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gold font-semibold">ROI: {formatPercent(deal.roi)}</span>
                        <span className="text-silver font-semibold">Yield: {formatPercent(deal.grossYield)}</span>
                        <span className="text-primary font-semibold">Cash Flow: {formatCurrency(deal.totalMonthlyCashFlow)}</span>
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