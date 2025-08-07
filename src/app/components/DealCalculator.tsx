import { useState, useEffect } from 'react';
import Button from './Button';
import { useToast } from './ToastProvider';
import { supabase } from '../../lib/supabaseClient';
import { Search, Building2, Calculator, TrendingUp, Target, DollarSign, Home, MapPin, Calendar, Percent, PoundSterling, ArrowRight, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import MLPredictionCard from './MLPredictionCard';

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
      const response = await fetch(`/api/property-analysis?postcode=${encodeURIComponent(searchPostcode)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.property) {
          setLandRegistryData({
            address: data.property.address || '',
            postcode: searchPostcode,
            propertyType: data.property.propertyType || 'House',
            currentValue: data.property.estimatedValue || 0,
            lastSoldPrice: data.property.lastSoldPrice || 0,
            lastSoldDate: data.property.lastSoldDate || '',
            priceHistory: data.property.priceHistory || [],
            averageGrowthRate: data.property.averageGrowthRate || 0.03
          });
          
          // Auto-fill form with Land Registry data
          setPropertyName(data.property.address || '');
          setPurchasePrice(data.property.estimatedValue?.toString() || '');
          setCurrentValue(data.property.estimatedValue?.toString() || '');
          setPropertyType(data.property.propertyType || 'House');
          
          showToast('Property data loaded from Land Registry', 'success');
        } else {
          showToast('No property data found for this postcode', 'error');
        }
      } else {
        showToast('Error searching Land Registry', 'error');
      }
    } catch (error) {
      console.error('Error searching Land Registry:', error);
      showToast('Error searching Land Registry', 'error');
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
      <h2 className="text-2xl font-bold text-primary-700 mb-6 text-center">Deal Calculator</h2>
      {!user && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-yellow-800 text-sm">
            💡 <strong>Sign in</strong> to save your deals to your portfolio and track them over time.
          </p>
        </div>
      )}
      <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={e => e.preventDefault()}>
        <InputField label="Property Name" value={propertyName} onChange={setPropertyName} required type="text" />
        <div className="relative">
          <InputField label="Postcode" value={postcode} onChange={setPostcode} required type="text" maxLength={8} />
          <button
            type="button"
            onClick={() => searchPropertiesByPostcode(postcode)}
            disabled={!postcode || postcode.length < 3 || isSearchingProperties}
            className="absolute right-2 top-8 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSearchingProperties ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {/* Property Search Results Accordion */}
        {showPropertySearch && propertySearchResults.length > 0 && (
          <div className="md:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {/* Accordion Header */}
              <div 
                className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsAccordionExpanded(!isAccordionExpanded)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Search className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Property Search Results</h3>
                    <p className="text-xs text-gray-600">Found {propertySearchResults.length} properties in {postcode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {isAccordionExpanded ? 'Click to collapse' : 'Click to expand'}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isAccordionExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPropertySearch(false);
                      setPropertySearchResults([]);
                    }}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                    title="Close search results"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Accordion Content */}
              {isAccordionExpanded && (
                <>
                  <div className="max-h-80 overflow-y-auto">
                    <div className="divide-y divide-gray-100">
                      {propertySearchResults.map((property, index) => (
                        <div
                          key={index}
                          onClick={() => selectProperty(property)}
                          className="p-4 hover:bg-blue-50 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-start gap-4">
                            {/* Property Icon */}
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                              <Home className="w-5 h-5 text-blue-600" />
                            </div>
                            
                            {/* Property Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900 truncate">{property.title || property.address}</h4>
                                <div className="text-right ml-4">
                                  <p className="font-semibold text-gray-900 text-lg">{formatCurrency(property.price)}</p>
                                  <p className="text-xs text-gray-500">Click to select</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">{property.postcode}</p>
                                  <p className="text-gray-500">{property.property_type}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">{property.bedrooms} bedrooms</p>
                                  <p className="text-gray-500">{property.estate_type}</p>
                                </div>
                              </div>
                              
                              {/* Property Tags */}
                              <div className="flex gap-2 mt-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {property.transaction_type}
                                </span>
                                {property.new_build && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    New Build
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Accordion Footer */}
                  <div className="p-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>Select a property to auto-fill the form</span>
                      <span>{propertySearchResults.length} properties found</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        <InputField label="Purchase Price" value={purchasePrice} onChange={val => { setPurchasePrice(val); if (ltvMode === 'ltv') setDeposit(''); }} required min={0} />
        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium text-gray-700">Property Type</label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      {/* ML Predictions */}
      <div className="mt-8">
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

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-lg font-semibold text-gray-700 mb-1">ROI</div>
          <div className="text-3xl font-bold text-primary-600">{formatPercent(roi)}</div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-lg font-semibold text-gray-700 mb-1">Gross Yield</div>
          <div className="text-3xl font-bold text-green-600">{formatPercent(grossYield)}</div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-lg font-semibold text-gray-700 mb-1">Net Yield</div>
          <div className="text-3xl font-bold text-green-600">{formatPercent(netYield)}</div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-lg font-semibold text-gray-700 mb-1">Monthly Mortgage</div>
          <div className="text-3xl font-bold text-orange-600">{formatCurrency(monthlyInterest)}</div>
        </div>
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8 flex flex-col items-center md:col-span-2 border border-primary-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-lg font-semibold text-gray-700 mb-1">Total Monthly Cash Flow</div>
          <div className="text-4xl font-bold text-primary-600">{formatCurrency(totalMonthlyCashFlow)}</div>
        </div>
      </div>
      <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-4">
        <Button
          type="button"
          className="px-8 py-3 rounded-lg bg-primary-600 text-white font-semibold shadow-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={!isValid || isLoading}
        >
          {isLoading ? 'Saving...' : 'Add to Portfolio'}
        </Button>
        <Button
          type="button"
          className="px-8 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold shadow-md hover:bg-gray-200 transition-colors"
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