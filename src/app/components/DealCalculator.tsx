import { useState, useEffect } from 'react';
import Button from './Button';
import { useToast } from './ToastProvider';
import { supabase } from '../../lib/supabaseClient';
import { Search, Building2, Calculator, TrendingUp, Target, DollarSign, Home, MapPin, Calendar, Percent, PoundSterling, ArrowRight, Info, CheckCircle, AlertTriangle, X } from 'lucide-react';
import MLPredictionCard from './MLPredictionCard';
import { fieldInput, fieldLabel, fieldSelect } from '../components/ui/fieldStyles';


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

// Enhanced type for comprehensive deal analysis
interface EnhancedDeal {
  id?: string;
  propertyName: string;
  postcode: string;
  propertyType: string;
  purchasePrice: number;
  currentValue: number;
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
  notes?: string;
  status?: 'active' | 'sold' | 'watching';
  
  // Enhanced investment analysis
  totalInvestment: number;
  stampDuty: number;
  legalFees: number;
  surveyFees: number;
  mortgageFees: number;
  landRegistryFees: number;
  searchesFees: number;
  gasSafetyCertificate: number;
  electricalSafetyCertificate: number;
  energyPerformanceCertificate: number;
  fireSafetyAssessment: number;
  legionellaRiskAssessment: number;
  asbestosSurvey: number;
  landlordInsurance: number;
  furnitureAndAppliances: number;
  marketingAndLettingFees: number;
  contingencyFund: number;
  
  // Growth predictions
  predictedGrowth2Year: number;
  predictedGrowth5Year: number;
  predictedGrowth10Year: number;
  projectedValue2Year: number;
  projectedValue5Year: number;
  projectedValue10Year: number;
  
  // Company structure
  isLtdCompany: boolean;
  corporationTaxRate: number;
  personalTaxRate: number;
  directorLoanBalance: number;
  directorLoanInterestRate: number;
  
  // ROI calculations
  lifetimeROI: number;
  annualizedROI: number;
  cashOnCashReturn: number;
  breakEvenYears: number;
}

// Land Registry property data
interface LandRegistryProperty {
  address: string;
  postcode: string;
  propertyType: string;
  currentValue: number;
  lastSoldPrice: number;
  lastSoldDate: string;
  priceHistory: Array<{
    date: string;
    price: number;
  }>;
  averageGrowthRate: number;
}

function InputField({ label, value, onChange, type = 'number', required = false, min, step, ...props }: InputFieldProps) {
  return (
    <div className="w-full">
      <label className={fieldLabel}>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min={min}
        step={step}
        className={fieldInput}
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
  
  // Enhanced state for comprehensive analysis
  const [propertyName, setPropertyName] = useState('');
  const [postcode, setPostcode] = useState('');
  const [propertyType, setPropertyType] = useState('House');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [refurbCost, setRefurbCost] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [ltv, setLtv] = useState('75');
  const [deposit, setDeposit] = useState('');
  const [ltvMode, setLtvMode] = useState<'ltv' | 'deposit'>('ltv');
  const [otherExpenses, setOtherExpenses] = useState('');
  
  // Company structure
  const [isLtdCompany, setIsLtdCompany] = useState(false);
  const [corporationTaxRate, setCorporationTaxRate] = useState('25');
  const [personalTaxRate, setPersonalTaxRate] = useState('40');
  const [directorLoanBalance, setDirectorLoanBalance] = useState('');
  const [directorLoanInterestRate, setDirectorLoanInterestRate] = useState('2.25');
  
  // UI state
  const [showSaved, setShowSaved] = useState(false);
  const [savedDeals, setSavedDeals] = useState<EnhancedDeal[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingProperty, setIsSearchingProperty] = useState(false);
  const [landRegistryData, setLandRegistryData] = useState<LandRegistryProperty | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'company' | 'results'>('basic');
  
  // Property search functionality
  const [isSearchingProperties, setIsSearchingProperties] = useState(false);
  const [propertySearchResults, setPropertySearchResults] = useState<any[]>([]);
  const [showPropertySearch, setShowPropertySearch] = useState(false);
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(true);
  


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

  // Comprehensive fee calculations
  const calculateStampDuty = (price: number, isLtd: boolean) => {
    if (isLtd) {
      // Higher rates for companies
      if (price <= 150000) return price * 0.03;
      if (price <= 250000) return 4500 + (price - 150000) * 0.05;
      if (price <= 925000) return 9500 + (price - 250000) * 0.08;
      if (price <= 1500000) return 59500 + (price - 925000) * 0.13;
      return 177500 + (price - 1500000) * 0.15;
    } else {
      // Standard rates
      if (price <= 250000) return 0;
      if (price <= 925000) return (price - 250000) * 0.05;
      if (price <= 1500000) return 33750 + (price - 925000) * 0.10;
      return 93750 + (price - 1500000) * 0.12;
    }
  };

  const stampDuty = calculateStampDuty(p, isLtdCompany);
  const legalFees = Math.max(1500, p * 0.01);
  const surveyFees = Math.max(500, p * 0.002);
  const mortgageFees = Math.max(1000, p * 0.005);
  const landRegistryFees = 200;
  const searchesFees = 300;
  const gasSafetyCertificate = 80;
  const electricalSafetyCertificate = 150;
  const energyPerformanceCertificate = 60;
  const fireSafetyAssessment = 200;
  const legionellaRiskAssessment = 150;
  const asbestosSurvey = 300;
  const landlordInsurance = 300;
  const furnitureAndAppliances = 2000;
  const marketingAndLettingFees = 500;
  const contingencyFund = Math.max(2000, p * 0.02);

  // Total investment calculation
  const totalInvestment = depositVal + stampDuty + legalFees + surveyFees + 
                         mortgageFees + landRegistryFees + searchesFees + 
                         gasSafetyCertificate + electricalSafetyCertificate + 
                         energyPerformanceCertificate + fireSafetyAssessment + 
                         legionellaRiskAssessment + asbestosSurvey + landlordInsurance + 
                         furnitureAndAppliances + marketingAndLettingFees + 
                         contingencyFund + refurb;

  // Growth predictions based on Land Registry data or defaults
  const averageGrowthRate = landRegistryData?.averageGrowthRate || 0.03; // 3% default
  const predictedGrowth2Year = Math.pow(1 + averageGrowthRate, 2) - 1;
  const predictedGrowth5Year = Math.pow(1 + averageGrowthRate, 5) - 1;
  const predictedGrowth10Year = Math.pow(1 + averageGrowthRate, 10) - 1;
  
  const projectedValue2Year = p * (1 + predictedGrowth2Year);
  const projectedValue5Year = p * (1 + predictedGrowth5Year);
  const projectedValue10Year = p * (1 + predictedGrowth10Year);

  // Enhanced ROI calculations
  const annualRent = rent * 12;
  const annualMortgagePayment = (p * ltvVal * rate) / 12 * 12;
  const annualExpenses = expenses * 12 + landlordInsurance + (Number(directorLoanBalance) || 0) * (Number(directorLoanInterestRate) / 100 || 0.0225);
  const annualProfit = annualRent - annualMortgagePayment - annualExpenses;
  
  const lifetimeROI = totalInvestment > 0 ? (annualProfit / totalInvestment) * 100 : 0;
  const annualizedROI = totalInvestment > 0 ? (annualProfit / totalInvestment) * 100 : 0;
  const cashOnCashReturn = totalInvestment > 0 ? (annualProfit / totalInvestment) * 100 : 0;
  const breakEvenYears = annualProfit > 0 ? totalInvestment / annualProfit : 0;

  // Authentication and portfolio loading
  useEffect(() => {
    const getUser = async () => {
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return;
      }
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };
    getUser();
  }, []);

  // Land Registry search function
  const searchLandRegistry = async (searchPostcode: string) => {
    setIsSearchingProperty(true);
    try {
      // Use comprehensive valuation API for more accurate property data
      const response = await fetch(`/api/comprehensive-valuation?postcode=${encodeURIComponent(searchPostcode)}&number=1`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.summary?.finalValue) {
          setLandRegistryData({
            address: data.data.property?.address || '',
            postcode: searchPostcode,
            propertyType: data.data.property?.propertyType || 'House',
            currentValue: data.data.summary.finalValue || 0,
            lastSoldPrice: data.data.property?.lastSoldPrice || 0,
            lastSoldDate: data.data.property?.lastSoldDate || '',
            priceHistory: [], // Will be populated from sales comparison
            averageGrowthRate: 0.03
          });
          
          // Auto-fill form with Land Registry data
          setPropertyName(data.subject?.address || '');
          setPurchasePrice(data.estimatedValue?.toString() || '');
          setCurrentValue(data.estimatedValue?.toString() || '');
          setPropertyType(data.subject?.propertyType || 'House');
          
          showToast({
            type: 'success',
            title: 'Success',
            message: 'Property data loaded from Land Registry'
          });
        } else {
          showToast({
            type: 'error',
            title: 'No Data',
            message: 'No property data found for this postcode'
          });
        }
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Error searching Land Registry'
        });
      }
    } catch (error) {
      console.error('Error searching Land Registry:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Error searching Land Registry'
      });
    } finally {
      setIsSearchingProperty(false);
    }
  };

  // Search for properties by postcode
  const searchPropertiesByPostcode = async (searchPostcode: string) => {
    if (!searchPostcode || searchPostcode.length < 3) return;
    
    setIsSearchingProperties(true);
    try {
      const response = await fetch(`/api/search-properties?postcode=${encodeURIComponent(searchPostcode)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setPropertySearchResults(data.properties || []);
        setShowPropertySearch(true);
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to search properties'
        });
      }
    } catch (error) {
      console.error('Error searching properties:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to search properties'
      });
    } finally {
      setIsSearchingProperties(false);
    }
  };



  // Select a property from search results
  const selectProperty = (property: any) => {
    setPropertyName(property.title || property.address || '');
    setPostcode(property.postcode || '');
    setPropertyType(property.property_type || 'House');
    setPurchasePrice(property.price?.toString() || '');
    setCurrentValue(property.price?.toString() || '');
    
    // Estimate monthly rent based on price (typical 0.5% of price)
    const estimatedRent = property.price ? (property.price * 0.005) : 0;
    setMonthlyRent(estimatedRent.toString());
    
    // Estimate refurbishment costs based on property type
    let estimatedRefurb = 0;
    if (property.property_type?.toLowerCase().includes('flat')) {
      estimatedRefurb = 15000;
    } else if (property.property_type?.toLowerCase().includes('house')) {
      estimatedRefurb = 25000;
    } else {
      estimatedRefurb = 20000;
    }
    setRefurbCost(estimatedRefurb.toString());
    
    setShowPropertySearch(false);
    setPropertySearchResults([]);
    setIsAccordionExpanded(true);
    
    showToast({
      type: 'success',
      title: 'Property Selected',
      message: `Auto-filled form with ${property.title || property.address}`
    });
  };

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
              propertyName: property.address, // Changed from address to propertyName
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
  const isValid = p > 0 && rent > 0 && rate > 0 && ltvVal > 0 && ltvVal <= 1 && propertyName.trim().length > 0;

  // Equity release and cash-left-in-deal (2 years)
  const maxRemortgage2Year = projectedValue2Year * ltvVal;
  const outstandingMortgage2Year = loanAmount; // interest-only assumption
  const potentialEquityRelease2Year = Math.max(0, maxRemortgage2Year - outstandingMortgage2Year);
  const totalEquity2Year = Math.max(0, projectedValue2Year - outstandingMortgage2Year);
  const cashLeftVsInitial2Year = Math.max(0, initialInvestment - potentialEquityRelease2Year);
  const cashLeftVsTotalUpfront2Year = Math.max(0, totalInvestment - potentialEquityRelease2Year);

  // Repayment timeline estimate (refi at 24 months + cash flow thereafter)
  const monthsToRepayAfterRefi = totalMonthlyCashFlow > 0 ? Math.ceil(cashLeftVsInitial2Year / totalMonthlyCashFlow) : Infinity;
  const totalMonthsToPayback = isFinite(monthsToRepayAfterRefi) ? 24 + monthsToRepayAfterRefi : Infinity;

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
    if (!postcode.trim() || !propertyName.trim()) {
      showToast({
        type: 'error',
        title: 'Missing Information',
        message: 'Please enter both postcode and property name'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Use the dedicated postcode field
      const postcodeValue = postcode.trim().toUpperCase();
      
      const dealData = {
        address: propertyName, // API expects 'address' field
        postcode: postcodeValue,
        houseNumber: '', // No longer extracting house number
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
              propertyName: property.address, // Changed from address to propertyName
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
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Deal Calculator</h2>
      {!user && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            💡 <strong>Sign in</strong> to save your deals to your portfolio and track them over time.
          </p>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <form className="space-y-4 rounded-lg border border-gray-200 bg-white p-4" onSubmit={e => e.preventDefault()}>
          <div className="flex flex-col gap-2">
            <label className={fieldLabel}>Postcode<span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input
                type="text"
                value={postcode}
                onChange={(e) => {
                  // Clean input - only allow letters, numbers, and spaces
                  let value = e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
                  
                  // Remove extra spaces
                  value = value.replace(/\s+/g, ' ').trim();
                  
                  // Handle common UK postcode patterns
                  if (value.length >= 5) {
                    // Pattern: NE54PR -> NE5 4PR
                    if (value.match(/^[A-Z]{2}[0-9][0-9A-Z][0-9][A-Z]{2}$/)) {
                      value = value.replace(/^([A-Z]{2}[0-9][0-9A-Z])([0-9][A-Z]{2})$/, '$1 $2');
                    }
                    // Pattern: NE54PR -> NE5 4PR (alternative)
                    else if (value.match(/^[A-Z]{2}[0-9][0-9][A-Z][0-9][A-Z]{2}$/)) {
                      value = value.replace(/^([A-Z]{2}[0-9][0-9][A-Z])([0-9][A-Z]{2})$/, '$1 $2');
                    }
                    // Pattern: NE54PR -> NE5 4PR (another variation)
                    else if (value.match(/^[A-Z]{2}[0-9][0-9][0-9][A-Z]{2}$/)) {
                      value = value.replace(/^([A-Z]{2}[0-9][0-9][0-9])([A-Z]{2})$/, '$1 $2');
                    }
                  }
                  
                  setPostcode(value);
                }}
                placeholder="e.g., NE5 4PR"
                className={`${fieldInput} flex-1`}
                maxLength={8}
              />
              <button
                type="button"
                onClick={() => searchLandRegistry(postcode)}
                disabled={!postcode.trim() || isSearchingProperty}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
              >
                {isSearchingProperty ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className={fieldLabel}>Property Address<span className="text-red-500">*</span></label>
            <input
              type="text"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="e.g., 16 Lowbiggin"
              className={fieldInput}
              maxLength={120}
            />
          </div>
          <div className="space-y-3">
            {/* Last Sold Price Information */}
            {landRegistryData && landRegistryData.lastSoldPrice && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-800">Last Sold Price</div>
                    <div className="text-lg font-bold text-blue-900">{formatCurrency(landRegistryData.lastSoldPrice)}</div>
                    <div className="text-xs text-blue-600">Sold on {new Date(landRegistryData.lastSoldDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-800">Recommended Offer</div>
                    <div className="text-lg font-bold text-green-600">{formatCurrency(landRegistryData.lastSoldPrice * 0.85)}</div>
                    <div className="text-xs text-blue-600">15% below last sale</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-700">
                  💡 <strong>Why this offer price?</strong> We recommend 15% below the last sold price to account for market conditions, 
                  potential refurbishment needs, and to ensure a good investment margin.
                </div>
              </div>
            )}
            
            {/* Purchase Price Input */}
            <div className="flex flex-col gap-2">
              <label className={fieldLabel}>Offer/Asking Price (£)<span className="text-red-500">*</span></label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => {
                  setPurchasePrice(e.target.value);
                  if (ltvMode === 'ltv') setDeposit('');
                }}
                placeholder="e.g., 250000"
                className={fieldInput}
                min={0}
                required
              />
              {landRegistryData && landRegistryData.lastSoldPrice && (
                <div className="text-xs text-gray-600">
                  💡 <strong>Tip:</strong> Consider offering 10-20% below the asking price for better investment returns
                </div>
              )}
            </div>
          </div>
        <div className="flex flex-col gap-2">
          <label className={fieldLabel}>Property Type</label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className={fieldSelect}
          >
            <option value="House">House</option>
            <option value="Flat">Flat</option>
            <option value="Detached">Detached</option>
            <option value="Semi-Detached">Semi-Detached</option>
            <option value="Terraced">Terraced</option>
            <option value="Bungalow">Bungalow</option>
          </select>
        </div>
        <InputField label="Refurbishment Costs" value={refurbCost} onChange={setRefurbCost} min={0} />
        <InputField label="Current Value" value={currentValue} onChange={setCurrentValue} min={0} />
        <InputField label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} required min={0} />
        <InputField label="Mortgage Interest Rate (%)" value={interestRate} onChange={setInterestRate} required min={0} step={0.01} />
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button type="button" className={`px-2 py-1 rounded-md text-xs font-medium border ${ltvMode === 'ltv' ? 'border-gray-900 text-gray-900' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`} onClick={() => setLtvMode('ltv')}>Edit LTV</button>
            <button type="button" className={`px-2 py-1 rounded-md text-xs font-medium border ${ltvMode === 'deposit' ? 'border-gray-900 text-gray-900' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`} onClick={() => setLtvMode('deposit')}>Edit Deposit</button>
          </div>
          {ltvMode === 'ltv' ? (
            <InputField label="Loan-to-Value (%)" value={ltv} onChange={val => { setLtv(val); setDeposit(''); }} required min={0} max={100} step={0.1} />
          ) : (
            <InputField label="Deposit (£)" value={deposit} onChange={val => { setDeposit(val); setLtv(''); }} required min={0} max={Number(purchasePrice) || undefined} />
          )}
        </div>
        <InputField label="Other Monthly Expenses" value={otherExpenses} onChange={setOtherExpenses} min={0} />
        </form>

        <div className="space-y-6">
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <MLPredictionCard 
              propertyFeatures={{
                propertyType: propertyType,
                postcode: postcode,
                purchasePrice: p,
                refurbishmentCost: refurb,
                stampDuty: stampDuty,
                legalFees: legalFees,
                mortgageRate: rate,
                ltv: ltvVal
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-md border border-gray-200 bg-white p-4 flex flex-col items-center">
              <div className="text-sm font-medium text-gray-700 mb-1">ROI</div>
              <div className="text-2xl font-bold text-gray-900">{formatPercent(roi)}</div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4 flex flex-col items-center">
              <div className="text-sm font-medium text-gray-700 mb-1">Gross Yield</div>
              <div className="text-2xl font-bold text-gray-900">{formatPercent(grossYield)}</div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4 flex flex-col items-center">
              <div className="text-sm font-medium text-gray-700 mb-1">Net Yield</div>
              <div className="text-2xl font-bold text-gray-900">{formatPercent(netYield)}</div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4 flex flex-col items-center">
              <div className="text-sm font-medium text-gray-700 mb-1">Monthly Mortgage</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyInterest)}</div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-6 flex flex-col items-center md:col-span-2">
              <div className="text-sm font-medium text-gray-700 mb-1">Total Monthly Cash Flow</div>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalMonthlyCashFlow)}</div>
            </div>
          </div>

          {/* Equity Release and Cash Left in Deal (2 Years) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-md border border-gray-200 bg-white p-4 flex flex-col">
              <div className="text-sm font-medium text-gray-700 mb-1">Projected Value (2 Years)</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(projectedValue2Year)}</div>
              <div className="text-xs text-gray-500 mt-1">Assumes {formatPercent(averageGrowthRate * 100)} annual growth</div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4 flex flex-col">
              <div className="text-sm font-medium text-gray-700 mb-1">Potential Equity Release (2 Years)</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(potentialEquityRelease2Year)}</div>
              <div className="text-xs text-gray-500 mt-1">Remortgage to {(ltvVal * 100).toFixed(0)}% LTV, interest-only</div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4 flex flex-col">
              <div className="text-sm font-medium text-gray-700 mb-1">Cash Left in Deal (vs Initial Investment)</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(cashLeftVsInitial2Year)}</div>
              <div className="text-xs text-gray-500 mt-1">Initial investment {formatCurrency(initialInvestment)}</div>
            </div>
          </div>
          <div>
            <div className="rounded-md border border-gray-200 bg-white p-4 flex flex-col">
              <div className="text-sm font-medium text-gray-700 mb-1">Cash Left in Deal (vs Total Upfront Cost)</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(cashLeftVsTotalUpfront2Year)}</div>
              <div className="text-xs text-gray-500 mt-1">Upfront cost includes deposit, fees and refurb: {formatCurrency(totalInvestment)}</div>
            </div>
          </div>

          {/* Compact mobile summary */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <div className="text-[11px] text-gray-600">Equity Release (2y)</div>
              <div className="text-lg font-semibold">{formatCurrency(potentialEquityRelease2Year)}</div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <div className="text-[11px] text-gray-600">Cash Left (vs Initial)</div>
              <div className="text-lg font-semibold">{formatCurrency(cashLeftVsInitial2Year)}</div>
            </div>
          </div>

          {/* Payback timeline */}
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="text-sm font-medium text-gray-700 mb-1">Full payback timeline</div>
            {isFinite(totalMonthsToPayback) && totalMonthsToPayback > 0 ? (
              (() => {
                const years = Math.floor(totalMonthsToPayback / 12);
                const months = totalMonthsToPayback % 12;
                return (
                  <div className="text-lg font-semibold text-gray-900">≈ {years}y {months}m</div>
                );
              })()
            ) : (
              <div className="text-xs text-gray-500">Add rent and costs to estimate payback timeline.</div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Assumes refinance at 24m and net monthly cash flow of {formatCurrency(totalMonthlyCashFlow)} with {formatCurrency(cashLeftVsInitial2Year)} left after refi.
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-3">
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          disabled={!isValid || isLoading}
        >
          {isLoading ? 'Saving...' : 'Add to Portfolio'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowSaved(true)}
        >
          View Portfolio
        </Button>
      </div>
      {/* Saved Deals Modal */}
      {showSaved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold focus:outline-none transition-colors"
              onClick={() => setShowSaved(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Portfolio Properties</h3>
              <a 
                href="/portfolio-tracker" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                View Full Portfolio →
              </a>
            </div>
            {savedDeals.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No properties in portfolio yet. Save your first deal to get started!</div>
            ) : (
              <ul className="space-y-4">
                {savedDeals.map((deal, idx) => (
                  <li key={idx} className="bg-gray-50 rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{deal.propertyName}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Purchase: {formatCurrency(deal.purchasePrice)}
                          {deal.postcode && ` • ${deal.postcode}`}
                          {deal.propertyType && ` • ${deal.propertyType}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">Added: {new Date(deal.date).toLocaleDateString()}</div>
                        {deal.status && (
                          <div className="text-xs text-green-600 font-medium capitalize mt-1">{deal.status}</div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 text-right">
                        <span className="text-primary-600 font-semibold">ROI: {formatPercent(deal.roi)}</span>
                        <span className="text-green-600 font-semibold">Yield: {formatPercent(deal.grossYield)}</span>
                        <span className="text-blue-600 font-semibold">Cash Flow: {formatCurrency(deal.totalMonthlyCashFlow)}</span>
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