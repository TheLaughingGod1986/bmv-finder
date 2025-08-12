'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Home, 
  Wrench, 
  DollarSign, 
  Calculator,
  Target,
  Award,
  Star,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  XCircle,
  Printer,
  Lightbulb
} from 'lucide-react';

import { fieldInput, fieldLabel, fieldSelect } from '../components/ui/fieldStyles';

// Enhanced field styles with validation states
const getFieldStyles = (isValid: boolean, hasValue: boolean) => {
  if (!hasValue) return fieldInput;
  return isValid 
    ? `${fieldInput} border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500` 
    : `${fieldInput} border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500`;
};
import { computeStampDuty, type PurchaseType } from '@/lib/stampDuty';

interface DealInputs {
  // Property details
  postcode: string;
  address: string;
  propertyType: string;
  purchasePrice: number;
  currentValue: number;
  // Current open-market value used for BMV guidance
  marketValue?: number;
  estimatedRenovatedValue: number;
  bedrooms: number;
  squareFootage: number;
  purchaseType: PurchaseType;
  
  // Financial details
  depositPct: number;
  interestRate: number;
  monthlyRent: number;
  otherExpenses: number;
  
  // Refurbishment
  refurbCost: number;
  refurbLevel: 'none' | 'cosmetic' | 'modernisation' | 'full_renovation';
  refurbContingencyPct: number;
  
  // Investment strategy
  desiredModel?: 'vanilla' | 'brrr' | 'flip';
  
  // BRRR specific
  remortgageLtv: number;
  timelineMonths: number;
  
  // Flip specific
  flipTimeline: number;
  sellingCosts: number;
  
  // Fees
  stampDuty: number;
  legalFees: number;
  brokerFees: number;
  // Finance and assumptions
  financeMode?: 'day1' | 'bridge_refi';
  bridgeRate?: number; // % APR during works
  bridgeMonths?: number; // months on bridge before refi
  growthAnnualPct?: number; // % per year compounding
  refurbUpliftFactor?: number; // proportion of refurb that adds to value (0.8 = 80%)
  mortgageType?: 'repayment' | 'interest_only'; // Added mortgage type selection
  // API data
  apiData?: {
    estimatedValue: number;
    monthlyRent: number;
    annualGrowth: number;
    confidence: string;
    source: string;
    lastUpdated: string;
    soldProperties?: Array<{
      id: string;
      address: string;
      postcode: string;
      price: number;
      date: string;
      bedrooms: number;
      propertyType: string;
      squareFootage: number;
    }>;
    enhancedPropertyData?: {
      epcRating: string | null;
      epcScore: number | null;
      epcSize: number | null;
      propertyType: string | null;
      houseCondition: string | null;
      squareFootage: number | null;
      buildYear: number | null;
      tenure: string | null;
      hasGarage: boolean;
      hasGarden: boolean;
      hasParking: boolean;
    };
  };
}



interface AnalysisResult {
  model: 'vanilla' | 'brrr' | 'flip';
  roi: number;
  cashFlow: number;
  totalReturn: number;
  grossYield?: number;
  estGrowthPct?: number; // annualized
  timeHorizonMonths?: number;
  // Investment breakdown
  investedDeposit?: number;
  investedRefurb?: number;
  investedFeesTotal?: number;
  investedStampDuty?: number;
  investedLegalFees?: number;
  investedBrokerFees?: number;
  investedTotal?: number;
  // Returns breakdown
  rentReturnTotal?: number;
  projectedCapitalGain?: number;
  totalProfit?: number;
  // BRRR-specific insights
  equityReleased?: number;
  cashLeftInDeal?: number;
  recyclePercent?: number; // equity released / upfront cash
  breakEvenRent?: number; // monthly rent needed for £0 cash flow
  recommendedPurchasePrice?: number;
  recommendedArv?: number;
  scenarios?: Array<{
    label: string;
    purchasePrice: number;
    refurbCost: number;
    arv: number;
    equityReleased: number;
    cashLeftInDeal: number;
    recyclePercent: number;
    totalProfit: number;
  }>;
  risk: 'low' | 'medium' | 'high';
  recommendation: string;
  pros: string[];
  cons: string[];
}

export default function UnifiedDealCalculator() {
  const formatCurrency = (value?: number): string => `£${Math.round(value || 0).toLocaleString()}`;
  
  // Add step management for progressive form flow
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [inputs, setInputs] = useState<DealInputs>({
    postcode: '',
    address: '',
    propertyType: 'House',
    purchasePrice: 250000,
    currentValue: 250000,
    marketValue: 250000,
    estimatedRenovatedValue: 280000,
    bedrooms: 3,
    squareFootage: 1200,
    purchaseType: 'second_home',
    depositPct: 25,
    interestRate: 5,
    monthlyRent: 1200,
    otherExpenses: 200,
    refurbCost: 0,
    refurbLevel: 'none',
    refurbContingencyPct: 10,
    remortgageLtv: 75,
    timelineMonths: 24,
    flipTimeline: 6,
    sellingCosts: 5000,
    stampDuty: 7500,
    legalFees: 1500,
    brokerFees: 1000,
    financeMode: 'day1',
    bridgeRate: 8,
    bridgeMonths: 6,
    growthAnnualPct: 3,
    refurbUpliftFactor: 0.8,
    desiredModel: undefined,
    mortgageType: 'repayment',
  });

  const [addressMode, setAddressMode] = useState<'search' | 'manual' | 'watchlist'>('search');
  const [watchlist, setWatchlist] = useState<Array<{ id: string; address: string; postcode: string; price?: number }>>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [recentSales, setRecentSales] = useState<Array<{
    paon: string;
    street: string;
    postcode: string;
    price: number;
    dateOfTransfer: string;
    propertyType: string;
  }>>([]);
  const [showRecentSales, setShowRecentSales] = useState(false);
  const [showBrrrDetailsModal, setShowBrrrDetailsModal] = useState(false);

  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [recommendedModel, setRecommendedModel] = useState<'vanilla' | 'brrr' | 'flip' | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    financial: false,
    refurbishment: false,
    fees: false
  });
  const [includeRefurb, setIncludeRefurb] = useState<boolean>(true);
  const [sdltOverride, setSdltOverride] = useState<boolean>(false);
  
  // Accordion states for each model (closed by default)
  const [openAccordions, setOpenAccordions] = useState<{
    vanilla: boolean;
    brrr: boolean;
    flip: boolean;
  }>({
    vanilla: false,
    brrr: false,
    flip: false
  });

  // Function to handle next step
  const handleNextStep = () => {
    // Validate required fields before proceeding
    if (currentStep === 1 && !inputs.desiredModel) {
      // Show error message or prevent progression
      return; // Don't proceed without strategy selection
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Function to handle previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Function to handle strategy selection with smart defaults
  const handleStrategySelection = (model: 'vanilla' | 'brrr' | 'flip') => {
    setInputs(prev => {
      const newInputs = { ...prev, desiredModel: model };
      
      // Only apply defaults if refurbishment level hasn't been explicitly set
      // or if it's currently 'none' (user's choice)
      if (prev.refurbLevel === 'none') {
        // Keep 'none' level for user's choice
        newInputs.refurbCost = 0;
      } else {
        // Apply smart defaults based on strategy
        switch (model) {
          case 'vanilla':
            newInputs.refurbLevel = 'cosmetic';
            newInputs.refurbCost = calculateRefurbCost('cosmetic', newInputs.bedrooms, newInputs.squareFootage, newInputs.refurbContingencyPct);
            newInputs.purchasePrice = 250000;
            newInputs.estimatedRenovatedValue = 260000;
            break;
          case 'brrr':
            newInputs.refurbLevel = 'modernisation';
            newInputs.refurbCost = calculateRefurbCost('modernisation', newInputs.bedrooms, newInputs.squareFootage, newInputs.refurbContingencyPct);
            newInputs.purchasePrice = 200000;
            newInputs.estimatedRenovatedValue = 280000;
            break;
          case 'flip':
            newInputs.refurbLevel = 'full_renovation';
            newInputs.refurbCost = calculateRefurbCost('full_renovation', newInputs.bedrooms, newInputs.squareFootage, newInputs.refurbContingencyPct);
            newInputs.purchasePrice = 180000;
            newInputs.estimatedRenovatedValue = 300000;
            break;
        }
      }
      
      return newInputs;
    });
  };

  const toggleAccordion = (model: 'vanilla' | 'brrr' | 'flip') => {
    setOpenAccordions(prev => ({
      ...prev,
      [model]: !prev[model]
    }));
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowBrrrDetailsModal(false);
      }
    };

    if (showBrrrDetailsModal) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [showBrrrDetailsModal]);

  // Check authentication and load watchlist
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          setIsAuthenticated(true);
          // Load watchlist if authenticated
          const watchlistResponse = await fetch('/api/watchlist');
          if (watchlistResponse.ok) {
            const data = await watchlistResponse.json();
            setWatchlist(data.watchlist || []);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();
  }, []);

  // Function to validate postcode using Postcodes.io
  const validatePostcode = async (postcode: string) => {
    try {
      const response = await fetch(`https://postcodes.io/postcodes/${encodeURIComponent(postcode)}/validate`);
      if (response.ok) {
        const result = await response.json();
        return result.result;
      }
      return false;
    } catch (error) {
      console.error('Failed to validate postcode:', error);
      return false;
    }
  };

  // Function to fetch property data from API
  const fetchPropertyData = async (postcode: string, bedrooms: number) => {
    try {
      // First validate the postcode
      const isValid = await validatePostcode(postcode);
      if (!isValid) {
        console.error('Invalid postcode format');
        return;
      }

      const response = await fetch(`/api/deal-calculator-data?postcode=${encodeURIComponent(postcode)}&bedrooms=${bedrooms}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInputs(prev => ({
            ...prev,
            estimatedRenovatedValue: data.data.estimatedValue,
            monthlyRent: data.data.monthlyRent,
            growthAnnualPct: data.data.annualGrowth,
            apiData: data.data
          }));
          
          // Show success message
          console.log('Property data fetched successfully:', data.data);
          console.log('Enhanced property data available:', data.data.enhancedPropertyData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch property data:', error);
    }
  };

  // Validation functions
  const validatePurchasePrice = (price: number) => {
    return price > 0 && price <= 10000000; // £0 - £10M
  };

  const validateMonthlyRent = (rent: number) => {
    return rent > 0 && rent <= 50000; // £0 - £50k
  };

  const validateDeposit = (deposit: number) => {
    return deposit >= 15 && deposit <= 40; // 15-40%
  };

  const validateInterestRate = (rate: number) => {
    return rate > 0 && rate <= 20; // 0-20%
  };

  // Ensure refurbishment cost is calculated correctly
  useEffect(() => {
    const calculatedCost = calculateRefurbCost(inputs.refurbLevel, inputs.bedrooms, inputs.squareFootage, inputs.refurbContingencyPct);
    if (calculatedCost !== inputs.refurbCost) {
      setInputs(prev => ({ ...prev, refurbCost: calculatedCost }));
    }
  }, [inputs.refurbLevel, inputs.bedrooms, inputs.squareFootage, inputs.refurbContingencyPct]);

  // Fetch recent sales when postcode changes
  useEffect(() => {
    const fetchRecentSales = async () => {
      if (!inputs.postcode.trim()) {
        setRecentSales([]);
        return;
      }

      try {
        const response = await fetch(`/api/recent-sales?postcode=${encodeURIComponent(inputs.postcode.trim())}&limit=10`);
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
          setRecentSales(data.data);
        } else {
          setRecentSales([]);
        }
      } catch (error) {
        console.error('Error fetching recent sales:', error);
        setRecentSales([]);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchRecentSales();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [inputs.postcode]);

  // Calculate all three models when inputs change
  useEffect(() => {
    const vanillaResult = calculateVanillaBTL(inputs);
    const brrrResult = calculateBRRR(inputs);
    const flipResult = calculateFlip(inputs);
    
    const allResults = [vanillaResult, brrrResult, flipResult];
    setResults(allResults);
    
    // Determine recommended model
    const recommended = determineRecommendedModel(allResults, inputs);
    setRecommendedModel(recommended);
  }, [inputs]);

  const calculateVanillaBTL = (inputs: DealInputs): AnalysisResult => {
    // For vanilla BTL, we assume buying at or near market value with minimal renovation
    const deposit = inputs.purchasePrice * (inputs.depositPct / 100);
    const mortgage = inputs.purchasePrice - deposit;
    const monthlyMortgage = (mortgage * (inputs.interestRate / 100)) / 12;
    
    // Vanilla BTL typically has minimal renovation - just cosmetic touch-ups
    // If user wants vanilla but has high refurb costs, cap them for realistic vanilla scenario
    const refurbCost = inputs.desiredModel === 'vanilla' 
      ? Math.min(inputs.refurbCost, 8000) // Cap at £8k for vanilla - just cosmetic
      : inputs.refurbCost;
    
    const investedFees = inputs.legalFees + inputs.brokerFees;
    const investedTotal = deposit + investedFees + inputs.stampDuty + refurbCost;
    
    // Monthly cash flow - rental income starts immediately after purchase
    const monthlyCashFlow = inputs.monthlyRent - monthlyMortgage - inputs.otherExpenses;
    const annualCashFlow = monthlyCashFlow * 12;
    const grossYield = inputs.monthlyRent > 0 ? (inputs.monthlyRent * 12) / inputs.purchasePrice * 100 : 0;
    
    // Calculate total return over 2 years
    const timeHorizonMonths = 24;
    const years = Math.max(1, timeHorizonMonths / 12);
    const rentReturnTotal = Math.round(monthlyCashFlow * timeHorizonMonths);
    const projectedValue = inputs.purchasePrice * Math.pow(1 + (inputs.growthAnnualPct || 3) / 100, years);
    const projectedCapitalGain = Math.round(Math.max(0, projectedValue - inputs.purchasePrice));
    const totalProfit = rentReturnTotal + projectedCapitalGain - investedTotal;
    const roi = investedTotal > 0 ? (totalProfit / investedTotal) * 100 : 0;
    
    // Debug logging
    console.log('Vanilla BTL Calculation:', {
      purchasePrice: inputs.purchasePrice,
      deposit,
      refurbCost,
      investedTotal,
      monthlyCashFlow,
      annualCashFlow,
      rentReturnTotal,
      projectedCapitalGain,
      totalProfit,
      roi
    });
    
    return {
      model: 'vanilla',
      roi: roi, // Show actual ROI (including negative values)
      cashFlow: annualCashFlow, // Return annual cash flow, not monthly
      totalReturn: totalProfit,
      grossYield,
      estGrowthPct: inputs.growthAnnualPct || 3,
      timeHorizonMonths,
      investedDeposit: deposit,
      investedRefurb: refurbCost,
      investedFeesTotal: investedFees,
      investedStampDuty: inputs.stampDuty,
      investedLegalFees: inputs.legalFees,
      investedBrokerFees: inputs.brokerFees,
      investedTotal: investedTotal,
      rentReturnTotal,
      projectedCapitalGain,
      totalProfit,
      risk: roi > 8 ? 'low' : roi > 5 ? 'medium' : 'high',
      recommendation: 'Buy at market value, minimal renovation, immediate rental income',
      pros: [
        'Immediate rental income after purchase',
        'Lower risk profile',
        'Steady monthly cash flow',
        'Long-term capital appreciation',
        'Minimal renovation disruption',
        'Predictable returns'
      ],
      cons: [
        'Lower potential returns',
        'Requires larger initial deposit',
        'Limited capital recycling',
        'Buying at market value (no BMV discount)',
        'Lower leverage potential'
      ]
    };
  };

  const calculateBRRR = (inputs: DealInputs): AnalysisResult => {
    // BRRR strategy: Buy distressed property at big discount, renovate over months, then refinance
    const deposit = inputs.purchasePrice * (inputs.depositPct / 100);
    const mortgage = inputs.purchasePrice - deposit;
    
    // BRRR requires significant renovation to add value
    // If user wants BRRR but has low refurb costs, suggest minimum viable renovation
    const refurbCost = inputs.desiredModel === 'brrr' 
      ? Math.max(inputs.refurbCost, 20000) // BRRR needs substantial renovation
      : inputs.refurbCost;
    
    const investedFees = inputs.legalFees + inputs.brokerFees;
    const totalInvestment = deposit + inputs.stampDuty + investedFees + refurbCost;
    
    // Use user's estimated renovated value
    const postRefurbValue = inputs.estimatedRenovatedValue;
    const growthPct = (inputs.growthAnnualPct ?? 3) / 100;
    const projectedValue = postRefurbValue * Math.pow(1 + growthPct, inputs.timelineMonths / 12);
    
    // Calculate equity release at refinance
    const remortgageAmount = projectedValue * (inputs.remortgageLtv / 100);
    const equityReleased = remortgageAmount - (inputs.purchasePrice - deposit);
    
    // Calculate total profit: equity released + capital appreciation - total investment
    const capitalAppreciation = projectedValue - inputs.purchasePrice;
    const totalProfit = equityReleased + capitalAppreciation - totalInvestment;
    
    // Calculate ROI based on total profit vs total investment
    const roi = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
    
    // Debug logging
    console.log('BRRR Calculation:', {
      purchasePrice: inputs.purchasePrice,
      deposit,
      refurbCost,
      totalInvestment,
      postRefurbValue,
      projectedValue,
      remortgageAmount,
      equityReleased,
      capitalAppreciation,
      totalProfit,
      roi
    });
    
    // Calculate realistic annual cash flow accounting for renovation downtime
    const monthlyCashFlow = inputs.monthlyRent - (inputs.purchasePrice * (1 - inputs.depositPct / 100) * (inputs.interestRate / 100) / 12) - inputs.otherExpenses;
    
    // BRRR typically has 3-6 months renovation, then 6-9 months rental income
    const renovationMonths = Math.min(inputs.timelineMonths || 6, 6); // Assume 6 months max renovation
    const rentalMonths = 12 - renovationMonths;
    const rentReturnTotal = monthlyCashFlow * rentalMonths; // Only count months when property is rented
    
    // BRRR insights
    const cashLeftInDeal = totalInvestment - equityReleased;
    const recyclePercent = totalInvestment > 0 ? (equityReleased / totalInvestment) * 100 : 0;
    const breakEvenRent = Math.ceil((mortgage * (inputs.interestRate / 100) / 12) + inputs.otherExpenses);
    
    // BMV guidance ladder - BRRR needs bigger discounts
    const mv = inputs.marketValue ?? inputs.currentValue ?? inputs.purchasePrice;
    const bmv15 = mv * 0.85; // 15% below market value
    const bmv20 = mv * 0.8;  // 20% below market value
    const bmv25 = mv * 0.75; // 25% below market value
    
    const buildScenario = (label: string, purchasePrice: number, refurbCost: number) => {
      const dep = purchasePrice * (inputs.depositPct / 100);
      const upfront = dep + inputs.stampDuty + inputs.legalFees + inputs.brokerFees + refurbCost;
      
      // Adjust ARV based on purchase price ratio
      const priceRatio = purchasePrice / inputs.purchasePrice;
      const adjustedArv = inputs.estimatedRenovatedValue * priceRatio;
      const arv = adjustedArv * Math.pow(1 + (inputs.growthAnnualPct ?? 3)/100, inputs.timelineMonths/12);
      
      const refi = arv * (inputs.remortgageLtv / 100);
      const equity = refi - (purchasePrice - dep);
      const cashLeft = Math.max(0, upfront - equity);
      const recycle = upfront > 0 ? (equity / upfront) * 100 : 0;
      const profit = equity - upfront;
      
      return { 
        label, 
        purchasePrice, 
        refurbCost, 
        arv, 
        equityReleased: equity, 
        cashLeftInDeal: cashLeft, 
        recyclePercent: recycle, 
        totalProfit: profit 
      };
    };
    
    const scenarios = [
      buildScenario('MV-15%', bmv15, refurbCost),
      buildScenario('MV-20%', bmv20, refurbCost),
      buildScenario('MV-25%', bmv25, refurbCost)
    ];

    return {
      model: 'brrr',
      roi: roi, // Show actual ROI (including negative values)
      cashFlow: rentReturnTotal, // Realistic annual cash flow (accounts for renovation downtime)
      totalReturn: totalProfit,
      grossYield: inputs.monthlyRent > 0 ? (inputs.monthlyRent * 12) / (inputs.purchasePrice + refurbCost) * 100 : 0,
      estGrowthPct: inputs.growthAnnualPct ?? 3,
      timeHorizonMonths: inputs.timelineMonths,
      investedDeposit: deposit,
      investedRefurb: refurbCost,
      investedFeesTotal: investedFees,
      investedStampDuty: inputs.stampDuty,
      investedLegalFees: inputs.legalFees,
      investedBrokerFees: inputs.brokerFees,
      investedTotal: totalInvestment,
      rentReturnTotal,
      projectedCapitalGain: projectedValue - inputs.purchasePrice,
      totalProfit,
      equityReleased,
      cashLeftInDeal,
      recyclePercent,
      breakEvenRent,
      recommendedPurchasePrice: bmv20, // Recommend 20% below market value
      recommendedArv: postRefurbValue,
      scenarios,
      risk: cashLeftInDeal / totalInvestment < 0.3 ? 'low' : cashLeftInDeal / totalInvestment < 0.45 ? 'medium' : 'high',
      recommendation: 'Buy distressed property at 15-20% discount, renovate significantly, refinance to release equity',
      pros: [
        'Recycle capital for next deal',
        'Scale portfolio faster',
        'Tax efficient structure',
        'Lower ongoing cash requirements',
        'Higher potential returns through value-add',
        'Build equity through renovation'
      ],
      cons: [
        'Higher upfront costs',
        'Refinancing risk',
        'More complex strategy',
        'Requires good credit',
        'No rental income during renovation',
        'Renovation timeline risk'
      ]
    };
  };

  const calculateFlip = (inputs: DealInputs): AnalysisResult => {
    // Flip strategy: Buy distressed property at discount, renovate quickly, sell for profit
    const deposit = inputs.purchasePrice * (inputs.depositPct / 100);
    const investedFees = inputs.legalFees + inputs.brokerFees;
    
    // Flip requires significant renovation to add value
    // If user wants flip but has low refurb costs, suggest minimum viable renovation
    const refurbCost = inputs.desiredModel === 'flip' 
      ? Math.max(inputs.refurbCost, 25000) // Flip needs substantial renovation
      : inputs.refurbCost;
    
    const totalInvestment = deposit + inputs.stampDuty + investedFees + refurbCost;
    
    // Calculate post-renovation value and selling price
    const postRefurbValue = inputs.estimatedRenovatedValue;
    const sellingPrice = postRefurbValue * 1.05; // 5% profit margin
    const netProfit = sellingPrice - inputs.purchasePrice - refurbCost - inputs.sellingCosts;
    
    const roi = (netProfit / totalInvestment) * 100;
    const annualizedRoi = roi * (12 / inputs.flipTimeline);
    
    const investedTotal = totalInvestment;
    const years = Math.max(1, Math.round(inputs.flipTimeline / 12));
    const rentReturnTotal = 0; // No rental income during flip
    const projectedCapitalGain = Math.max(0, sellingPrice - inputs.purchasePrice);
    const totalProfit = netProfit;

    return {
      model: 'flip',
      roi: annualizedRoi, // Show actual ROI (including negative values)
      cashFlow: -totalInvestment / inputs.flipTimeline, // Negative during flip
      totalReturn: totalProfit,
      grossYield: 0, // No rental yield during flip
      estGrowthPct: 0, // No long-term growth consideration
      timeHorizonMonths: inputs.flipTimeline,
      investedDeposit: deposit,
      investedRefurb: refurbCost,
      investedFeesTotal: investedFees,
      investedStampDuty: inputs.stampDuty,
      investedLegalFees: inputs.legalFees,
      investedBrokerFees: inputs.brokerFees,
      investedTotal: investedTotal,
      rentReturnTotal,
      projectedCapitalGain,
      totalProfit,
      risk: roi > 20 ? 'low' : roi > 10 ? 'medium' : 'high',
      recommendation: 'Buy distressed property at 15-20% discount, renovate quickly, sell for profit within 6-12 months',
      pros: [
        'Fastest capital return',
        'No ongoing management',
        'High potential returns',
        'Clear exit strategy',
        'No long-term commitment',
        'Capital gains tax benefits'
      ],
      cons: [
        'Higher risk',
        'Market timing critical',
        'Requires renovation skills',
        'Tax implications on sale',
        'No rental income',
        'Selling costs reduce profit'
      ]
    };
  };

  const determineRecommendedModel = (results: AnalysisResult[], inputs: DealInputs): 'vanilla' | 'brrr' | 'flip' => {
    // Consider user's desired model first, then analyze deal characteristics
    const userDesired = inputs.desiredModel;
    
    // Analyze deal characteristics
    const hasRefurb = inputs.refurbCost > 0;
    const isHighValue = inputs.purchasePrice > 400000;
    const hasGoodRent = inputs.monthlyRent > inputs.purchasePrice * 0.005; // 6% gross yield
    const isBelowMarketValue = inputs.purchasePrice < (inputs.marketValue ?? inputs.currentValue ?? inputs.purchasePrice) * 0.9; // 10% below market
    
    // If user has a strong preference, respect it but validate
    if (userDesired === 'vanilla') {
      // Vanilla works best with minimal renovation and good rental yields
      if (hasGoodRent && inputs.refurbCost <= 15000) {
        return 'vanilla';
      }
    } else if (userDesired === 'brrr') {
      // BRRR needs significant renovation and below market value
      if (hasRefurb && inputs.refurbCost >= 20000 && isBelowMarketValue) {
        return 'brrr';
      }
    } else if (userDesired === 'flip') {
      // Flip needs significant renovation and below market value
      if (hasRefurb && inputs.refurbCost >= 25000 && isBelowMarketValue) {
        return 'flip';
      }
    }
    
    // Fallback recommendation logic based on deal characteristics
    if (hasRefurb && isBelowMarketValue && inputs.refurbCost >= 20000) {
      if (hasGoodRent) {
        return 'brrr'; // Good rental potential suggests BRRR over flip
      } else {
        return 'flip'; // Poor rental potential suggests flip
      }
    } else if (hasGoodRent && inputs.refurbCost <= 15000) {
      return 'vanilla'; // Good rental yield with minimal renovation
    } else if (hasRefurb && !isBelowMarketValue) {
      return 'vanilla'; // High renovation costs but no BMV discount
    } else {
      return 'vanilla'; // Default to vanilla for safety
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-700 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getModelIcon = (model: string) => {
    switch (model) {
      case 'vanilla': return <Home className="w-5 h-5" />;
      case 'brrr': return <TrendingUp className="w-5 h-5" />;
      case 'flip': return <Wrench className="w-5 h-5" />;
      default: return <Calculator className="w-5 h-5" />;
    }
  };

  const getModelColor = (model: string) => {
    switch (model) {
      case 'vanilla': return 'border-blue-200 bg-blue-50';
      case 'brrr': return 'border-purple-200 bg-purple-50';
      case 'flip': return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  // Calculate refurbishment cost based on property size and level
  const calculateRefurbCost = (level: string, bedrooms: number, squareFootage: number, contingencyPct?: number) => {
    const baseCosts = {
      none: 0,
      cosmetic: 12000,
      modernisation: 30000,
      full_renovation: 55000
    };
    
    // Adjust for property size (bedrooms and square footage)
    const bedroomMultiplier = Math.max(1, bedrooms / 3); // 3-bed as baseline
    const sizeMultiplier = Math.max(0.8, Math.min(1.5, squareFootage / 1200)); // 1200 sq ft as baseline
    
    const baseCost = baseCosts[level as keyof typeof baseCosts] || 12000;
    const sizedCost = baseCost * bedroomMultiplier * sizeMultiplier;
    const contingencyMultiplier = 1 + (Math.max(0, contingencyPct ?? 0) / 100);
    return Math.round(sizedCost * contingencyMultiplier);
  };

  // Handle refurbishment level change and update cost
  const handleRefurbLevelChange = (level: string) => {
    const newCost = calculateRefurbCost(level, inputs.bedrooms, inputs.squareFootage, inputs.refurbContingencyPct);
    setInputs(prev => ({ 
      ...prev, 
      refurbLevel: level as any,
      refurbCost: newCost
    }));
  };

  // Get refurbishment level description and details
  const getRefurbLevelDetails = (level: string) => {
    const details = {
      none: {
        label: 'None',
        description: 'No renovation required - property is ready to rent or sell',
        includes: ['Property is in good condition', 'No structural work needed', 'Ready for immediate use'],
        typicalCost: '£0',
        timeline: '0 weeks',
        bestFor: 'Properties in excellent condition or new builds'
      },
      cosmetic: {
        label: 'Cosmetic',
        description: 'Surface-level improvements for visual appeal and basic functionality',
        includes: [
          'Painting and decorating',
          'New carpets/flooring',
          'Kitchen cabinet refresh',
          'Bathroom updates',
          'Lighting improvements',
          'Basic repairs'
        ],
        typicalCost: '£8,000 - £15,000',
        timeline: '2-4 weeks',
        bestFor: 'Properties in good structural condition needing visual refresh'
      },
      modernisation: {
        label: 'Modernisation',
        description: 'Significant updates to bring property to modern standards',
        includes: [
          'Full kitchen replacement',
          'Bathroom renovation',
          'New heating system',
          'Electrical upgrades',
          'New windows/doors',
          'Insulation improvements',
          'Roof repairs if needed'
        ],
        typicalCost: '£20,000 - £40,000',
        timeline: '6-12 weeks',
        bestFor: 'Properties needing major updates but with good structure'
      },
      full_renovation: {
        label: 'Full Renovation',
        description: 'Complete property transformation including structural work',
        includes: [
          'Structural modifications',
          'Complete kitchen rebuild',
          'Multiple bathroom renovations',
          'New heating and electrical systems',
          'Roof replacement if needed',
          'Extension work',
          'Complete redecoration',
          'Garden landscaping'
        ],
        typicalCost: '£40,000 - £80,000+',
        timeline: '12-20 weeks',
        bestFor: 'Distressed properties or major value-add opportunities'
      }
    };
    
    return details[level as keyof typeof details] || details.cosmetic;
  };

  // Calculate monthly mortgage payment based on type and finance mode
  const calculateMonthlyMortgagePayment = () => {
    const principal = inputs.purchasePrice * (1 - inputs.depositPct / 100);
    
    // Handle bridge financing
    if (inputs.financeMode === 'bridge_refi') {
      const bridgeRate = inputs.bridgeRate || 10; // Default to 10% if not set
      const monthlyRate = bridgeRate / 100 / 12;
      // Bridge loans are interest-only during the renovation period
      return Math.round(principal * monthlyRate);
    }
    
    // Handle regular BTL mortgages
    const monthlyRate = inputs.interestRate / 100 / 12;
    const totalPayments = 25 * 12; // 25-year mortgage term
    
    if (inputs.mortgageType === 'interest_only') {
      // Interest-only: just the monthly interest
      return Math.round(principal * monthlyRate);
    } else {
      // Repayment: full amortization formula
      const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
      return Math.round(monthlyPayment);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Deal Calculator</h1>
          <p className="text-lg text-gray-600">Analyze your property investment strategy step by step</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Labels */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-16">
            <span className={`text-sm font-medium ${currentStep === 1 ? 'text-blue-600' : 'text-gray-500'}`}>
              Property & Strategy
            </span>
            <span className={`text-sm font-medium ${currentStep === 2 ? 'text-blue-600' : 'text-gray-500'}`}>
              Financial Details
            </span>
            <span className={`text-sm font-medium ${currentStep === 3 ? 'text-blue-600' : 'text-gray-500'}`}>
              Results & Analysis
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Property Details & Strategy Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Property Source Selection */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                  
                  <div className="grid gap-4">
                    <div>
                      <label className={fieldLabel}>Property source</label>
                      <div className={`grid gap-2 text-sm ${isAuthenticated ? 'grid-cols-4' : 'grid-cols-3'}`}>
                        {(['search','manual','watchlist'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => { setAddressMode(m); }}
                            className={`rounded-lg border-2 px-3 py-2 font-medium transition-all ${
                              addressMode === m 
                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {m === 'search' ? 'Search by postcode' : m === 'manual' ? 'Add manually' : 'From watchlist'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {addressMode === 'search' && (
                      <div>
                        <label className={fieldLabel}>Postcode</label>
                        <div className="flex gap-2">
                          <input
                            value={inputs.postcode}
                            onChange={(e) => {
                              let value = e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
                              value = value.replace(/\s+/g, ' ').trim();
                              
                              if (value.length >= 5) {
                                if (value.match(/^[A-Z]{2}[0-9][0-9A-Z][0-9][A-Z]{2}$/)) {
                                  value = value.replace(/^([A-Z]{2}[0-9][0-9A-Z])([0-9][A-Z]{2})$/, '$1 $2');
                                } else if (value.match(/^[A-Z]{2}[0-9][0-9][A-Z][0-9][A-Z]{2}$/)) {
                                  value = value.replace(/^([A-Z]{2}[0-9][0-9][A-Z])([0-9][A-Z]{2})$/, '$1 $2');
                                } else if (value.match(/^[A-Z]{2}[0-9][0-9][0-9][A-Z]{2}$/)) {
                                  value = value.replace(/^([A-Z]{2}[0-9][0-9][0-9])([A-Z]{2})$/, '$1 $2');
                                }
                              }
                              
                              setInputs(prev => ({ ...prev, postcode: value }));
                            }}
                            placeholder="e.g., NE5 4PR"
                            className={fieldInput}
                            maxLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => fetchPropertyData(inputs.postcode, inputs.bedrooms)}
                            disabled={!inputs.postcode.trim() || inputs.bedrooms === 0}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            Fetch Data
                          </button>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Postcode validation powered by <a href="https://postcodes.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Postcodes.io</a>
                        </div>
                        {inputs.apiData && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-xs text-green-700">
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">Data fetched from API</span>
                                <span className="text-green-600">({inputs.apiData.confidence} confidence)</span>
                              </div>
                              
                              {/* Sold Properties Dropdown */}
                              {inputs.apiData.soldProperties && inputs.apiData.soldProperties.length > 0 && (
                                <div className="mt-2">
                                  <label className="block text-xs font-medium text-green-700 mb-1">
                                    Select a sold property to analyze:
                                  </label>
                                  <select
                                    onChange={(e) => {
                                      const selectedProperty = inputs.apiData.soldProperties.find(p => p.id === e.target.value);
                                                                             if (selectedProperty) {
                                         setInputs(prev => ({
                                           ...prev,
                                           estimatedRenovatedValue: selectedProperty.price,
                                           purchasePrice: selectedProperty.price,
                                           bedrooms: selectedProperty.bedrooms,
                                           squareFootage: selectedProperty.squareFootage || prev.squareFootage,
                                           propertyType: selectedProperty.propertyType
                                         }));
                                         
                                         // Also update with enhanced property data if available
                                         if (inputs.apiData?.enhancedPropertyData) {
                                           setInputs(prev => ({
                                             ...prev,
                                             squareFootage: inputs.apiData.enhancedPropertyData.squareFootage || prev.squareFootage,
                                             propertyType: inputs.apiData.enhancedPropertyData.propertyType || prev.propertyType
                                           }));
                                         }
                                       }
                                    }}
                                    className="w-full text-xs border border-green-200 rounded px-2 py-1 bg-white"
                                  >
                                    <option value="">Choose a property...</option>
                                    {inputs.apiData.soldProperties.map((property) => (
                                      <option key={property.id} value={property.id}>
                                        {property.address} - £{property.price.toLocaleString()} ({property.bedrooms} bed, {property.date})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              
                                                             <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                                 <div>Avg Value: £{inputs.apiData.estimatedValue.toLocaleString()}</div>
                                 <div>Rent: £{inputs.apiData.monthlyRent}/month</div>
                                 <div>Growth: {inputs.apiData.annualGrowth}%/year</div>
                               </div>
                               
                               {/* Enhanced Property Data Display */}
                               {inputs.apiData.enhancedPropertyData && (
                                 <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                   <div className="text-xs font-medium text-blue-700 mb-2">Enhanced Property Details</div>
                                   <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
                                     {inputs.apiData.enhancedPropertyData.epcRating && (
                                       <div className="flex items-center gap-1">
                                         <span className="font-medium">EPC:</span>
                                         <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                           inputs.apiData.enhancedPropertyData.epcRating === 'A' ? 'bg-green-100 text-green-700' :
                                           inputs.apiData.enhancedPropertyData.epcRating === 'B' ? 'bg-blue-100 text-blue-700' :
                                           inputs.apiData.enhancedPropertyData.epcRating === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                           inputs.apiData.enhancedPropertyData.epcRating === 'D' ? 'bg-orange-100 text-orange-700' :
                                           'bg-red-100 text-red-700'
                                         }`}>
                                           {inputs.apiData.enhancedPropertyData.epcRating}
                                         </span>
                                       </div>
                                     )}
                                     {inputs.apiData.enhancedPropertyData.propertyType && (
                                       <div>
                                         <span className="font-medium">Type:</span> {inputs.apiData.enhancedPropertyData.propertyType}
                                       </div>
                                     )}
                                     {inputs.apiData.enhancedPropertyData.squareFootage && (
                                       <div>
                                         <span className="font-medium">Size:</span> {inputs.apiData.enhancedPropertyData.squareFootage} sqm
                                       </div>
                                     )}
                                     {inputs.apiData.enhancedPropertyData.houseCondition && (
                                       <div>
                                         <span className="font-medium">Condition:</span> {inputs.apiData.enhancedPropertyData.houseCondition}
                                       </div>
                                     )}
                                     {inputs.apiData.enhancedPropertyData.buildYear && (
                                       <div>
                                         <span className="font-medium">Built:</span> {inputs.apiData.enhancedPropertyData.buildYear}
                                       </div>
                                     )}
                                     {inputs.apiData.enhancedPropertyData.tenure && (
                                       <div>
                                         <span className="font-medium">Tenure:</span> {inputs.apiData.enhancedPropertyData.tenure}
                                       </div>
                                     )}
                                   </div>
                                   <div className="mt-2 flex gap-2 text-xs">
                                     {inputs.apiData.enhancedPropertyData.hasGarage && (
                                       <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Garage</span>
                                     )}
                                     {inputs.apiData.enhancedPropertyData.hasGarden && (
                                       <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Garden</span>
                                       )}
                                     {inputs.apiData.enhancedPropertyData.hasParking && (
                                       <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Parking</span>
                                     )}
                                   </div>
                                 </div>
                               )}
                               
                               {/* Fallback message when no enhanced data */}
                               {!inputs.apiData.enhancedPropertyData && (
                                 <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                                   <div className="text-xs text-gray-600">
                                     <span className="font-medium">Note:</span> Enhanced property data (EPC, condition, etc.) not available for this postcode. 
                                     The system is using regional estimates and basic property characteristics.
                                   </div>
                                 </div>
                               )}
                            </div>
                          </div>
                        )}
                        <p className="mt-1 text-xs text-gray-500">Enter postcode and click "Fetch Data" to auto-populate values</p>
                      </div>
                    )}

                    {addressMode === 'manual' && (
                      <div>
                        <label className={fieldLabel}>House number and street</label>
                        <input
                          value={inputs.address}
                          onChange={(e) => setInputs(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="e.g., 73 Belgrave Road"
                          className={fieldInput}
                        />
                        <p className="mt-1 text-xs text-gray-500">Enter the property address manually if it's not in our database.</p>
                      </div>
                    )}

                    {addressMode === 'watchlist' && (
                      <div className="max-h-48 overflow-auto rounded-lg border border-gray-200 bg-white text-sm">
                        {watchlist.length === 0 && (
                          <div className="px-3 py-2 text-xs text-gray-500">No properties in watchlist.</div>
                        )}
                        {watchlist.map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50"
                            onClick={() => {
                              setInputs(prev => ({ 
                                ...prev, 
                                postcode: w.postcode || prev.postcode, 
                                address: w.address || prev.address 
                              }));
                            }}
                          >
                            <span className="truncate">{w.address}</span>
                            <span className="shrink-0 text-xs text-gray-500">{w.postcode}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Property Size Fields */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className={fieldLabel}>Bedrooms</label>
                        <input
                          type="number"
                          value={inputs.bedrooms}
                          onChange={(e) => setInputs(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
                          className={fieldInput}
                          min={1}
                          max={10}
                        />
                      </div>
                      <div>
                        <label className={fieldLabel}>Square Footage</label>
                        <input
                          type="number"
                          value={inputs.squareFootage}
                          onChange={(e) => setInputs(prev => ({ ...prev, squareFootage: Number(e.target.value) }))}
                          className={fieldInput}
                          min={500}
                          max={5000}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Investment Strategy Selection - Required */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Investment Strategy <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">Choose your investment approach to see tailored recommendations and smart defaults</p>
                  
                  {!inputs.desiredModel && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-sm text-red-700 font-medium">
                          Please select an investment strategy to continue
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid gap-4">
                    {(['vanilla', 'brrr', 'flip'] as const).map((model) => (
                      <button
                        key={model}
                        type="button"
                        onClick={() => handleStrategySelection(model)}
                        className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                          inputs.desiredModel === model 
                            ? 'border-blue-500 bg-blue-50 shadow-lg' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${
                            inputs.desiredModel === model 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {getModelIcon(model)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-lg font-semibold text-gray-900 capitalize">
                                {model === 'vanilla' ? 'Vanilla BTL' : model.toUpperCase()}
                              </h4>
                              {inputs.desiredModel === model && (
                                <div className="flex items-center gap-2 text-blue-600">
                                  <CheckCircle className="w-5 h-5" />
                                  <span className="text-sm font-medium">Selected</span>
                                </div>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                              {model === 'vanilla' 
                                ? 'Buy at market value, minimal renovation (£5-8k), immediate rental income'
                                : model === 'brrr'
                                ? 'Buy distressed property at 15-20% discount, renovate significantly (£20k+), refinance to release equity'
                                : 'Buy distressed property at 15-20% discount, renovate quickly (£25k+), sell for profit within 6-12 months'
                              }
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1">
                                <div className="font-medium text-gray-700">Best for:</div>
                                <div className="text-gray-600">
                                  {model === 'vanilla' 
                                    ? 'Steady income, lower risk, long-term holds'
                                    : model === 'brrr'
                                    ? 'Scaling portfolio, capital recycling, higher returns'
                                    : 'Quick profits, no ongoing management, capital gains'
                                  }
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="font-medium text-gray-700">Timeline:</div>
                                <div className="text-gray-600">
                                  {model === 'vanilla' 
                                    ? 'Immediate rental'
                                    : model === 'brrr'
                                    ? '6-12 months'
                                    : '6-12 months'
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Sales Section */}
                {recentSales.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <button
                      type="button"
                      onClick={() => setShowRecentSales(!showRecentSales)}
                      className="flex items-center justify-between w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">
                          Recent Sales ({recentSales.length} properties)
                        </span>
                      </div>
                      {showRecentSales ? (
                        <ChevronUp className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                    
                    {showRecentSales && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white"
                      >
                        <div className="p-3">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Sold in the last 12 months
                          </div>
                          {recentSales.map((sale, index) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {sale.paon} {sale.street}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(sale.dateOfTransfer).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </div>
                              </div>
                              <div className="text-right ml-2">
                                <div className="text-sm font-semibold text-gray-900">
                                  £{sale.price.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {sale.propertyType}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Next Step Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleNextStep}
                    disabled={!inputs.desiredModel || (!inputs.postcode.trim() && !inputs.address.trim())}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    Continue to Financial Details
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Financial Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h3>
                  <p className="text-sm text-gray-600 mb-6">Configure your investment parameters and assumptions</p>
                  
                  <div className="grid gap-6">
                    {/* Purchase Price & Values */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className={fieldLabel}>Purchase Price (£)</label>
                        <input
                          type="number"
                          value={inputs.purchasePrice}
                          onChange={(e) => setInputs(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                          className={getFieldStyles(validatePurchasePrice(inputs.purchasePrice), inputs.purchasePrice > 0)}
                          min={0}
                        />
                        <div className="mt-1 flex items-center gap-2">
                          {inputs.purchasePrice > 0 && (
                            validatePurchasePrice(inputs.purchasePrice) ? (
                              <span className="text-green-600 text-xs">✓ Valid price</span>
                            ) : (
                              <span className="text-red-600 text-xs">⚠ Price should be £0 - £10M</span>
                            )
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {inputs.desiredModel === 'vanilla' && 'Market value or slightly below'}
                          {inputs.desiredModel === 'brrr' && '15-20% below market value recommended'}
                          {inputs.desiredModel === 'flip' && '15-20% below market value for maximum profit'}
                        </p>
                      </div>
                      <div>
                        <label className={fieldLabel}>Estimated Current Value (£)</label>
                        <input
                          type="number"
                          value={inputs.estimatedRenovatedValue}
                          onChange={(e) => setInputs(prev => ({ ...prev, estimatedRenovatedValue: Number(e.target.value) }))}
                          className={fieldInput}
                          min={0}
                        />
                        <p className="mt-1 text-xs text-gray-500">Current market value of the property</p>
                      </div>
                    </div>


                    
                    {/* Refurbishment Level */}
                    <div className="w-full">
                      <label className={fieldLabel}>Refurbishment Level</label>
                      <select
                        value={inputs.refurbLevel}
                        onChange={(e) => handleRefurbLevelChange(e.target.value)}
                        className={fieldSelect}
                      >
                        <option value="none">None</option>
                        <option value="cosmetic">Cosmetic</option>
                        <option value="modernisation">Modernisation</option>
                        <option value="full_renovation">Full Renovation</option>
                      </select>
                      
                      {/* Refurbishment Level Details - Compact */}
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 w-full">
                        {(() => {
                          const details = getRefurbLevelDetails(inputs.refurbLevel);
                          return (
                            <div className="space-y-2">
                              {/* Price and Level - Compact Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  <span className="font-semibold text-gray-900">{details.label}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-blue-600">{details.typicalCost}</div>
                                  <div className="text-xs text-gray-600">{details.timeline}</div>
                                </div>
                              </div>
                              
                              {/* Description */}
                              <p className="text-sm text-gray-700">{details.description}</p>
                              
                              {/* Key Information - Side by Side */}
                              <div className="grid grid-cols-2 gap-3">
                                {/* What's Included */}
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">What's Included</h5>
                                  <div className="space-y-1">
                                    {details.includes.map((item, index) => (
                                      <div key={index} className="flex items-start gap-1 text-xs text-gray-700">
                                        <span className="text-blue-500 text-sm">•</span>
                                        <span>{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* Best For */}
                                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded border border-blue-200">
                                  <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Best For</h5>
                                  <p className="text-xs text-blue-700">{details.bestFor}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Refurbishment Costs - Now below the level */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="w-full">
                        <label className={fieldLabel}>Contingency (%)</label>
                        <input
                          type="number"
                          value={inputs.refurbContingencyPct || 10}
                          onChange={(e) => {
                            const contingency = Number(e.target.value);
                            setInputs(prev => ({ 
                              ...prev, 
                              refurbContingencyPct: contingency,
                              refurbCost: calculateRefurbCost(prev.refurbLevel, prev.bedrooms, prev.squareFootage, contingency)
                            }));
                          }}
                          className={fieldInput}
                          min={0}
                          max={50}
                          step={5}
                        />
                        <p className="mt-1 text-xs text-gray-500">Buffer for unexpected costs • 10-20% recommended</p>
                      </div>
                      
                      <div className="w-full">
                        <label className={fieldLabel}>Refurbishment Cost (£)</label>
                        <div className="relative w-full">
                          <input
                            type="number"
                            value={inputs.refurbCost}
                            onChange={(e) => setInputs(prev => ({ ...prev, refurbCost: Number(e.target.value) }))}
                            className={fieldInput}
                            min={0}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                          <span className="text-blue-600 font-medium">Auto-calculated</span>
                          <span>•</span>
                          <span>{inputs.refurbLevel.replace('_', ' ')} level</span>
                          <span>•</span>
                          <span>{inputs.bedrooms} bed, {inputs.squareFootage} sq ft</span>
                        </div>
                      </div>
                    </div>

                    {/* Mortgage Details */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className={fieldLabel}>Deposit (%)</label>
                        <input
                          type="number"
                          value={inputs.depositPct}
                          onChange={(e) => setInputs(prev => ({ ...prev, depositPct: Number(e.target.value) }))}
                          className={getFieldStyles(validateDeposit(inputs.depositPct), inputs.depositPct > 0)}
                          min={15}
                          max={40}
                        />
                        <div className="mt-1 flex items-center gap-2">
                          {inputs.depositPct > 0 && (
                            validateDeposit(inputs.depositPct) ? (
                              <span className="text-green-600 text-xs">✓ Valid deposit</span>
                            ) : (
                              <span className="text-red-600 text-xs">⚠ Deposit should be 15-40%</span>
                            )
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">15-40% recommended</p>
                      </div>
                      <div>
                        <label className={fieldLabel}>Interest Rate (%)</label>
                        <input
                          type="number"
                          value={inputs.interestRate}
                          onChange={(e) => setInputs(prev => ({ ...prev, interestRate: Number(e.target.value) }))}
                          className={getFieldStyles(validateInterestRate(inputs.interestRate), inputs.interestRate > 0)}
                          min={0}
                          step={0.1}
                        />
                        <div className="mt-1 flex items-center gap-2">
                          {inputs.interestRate > 0 && (
                            validateInterestRate(inputs.interestRate) ? (
                              <span className="text-green-600 text-xs">✓ Valid rate</span>
                            ) : (
                              <span className="text-red-600 text-xs">⚠ Rate should be 0-20%</span>
                            )
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Current BTL mortgage rate</p>
                      </div>
                      <div>
                        <label className={fieldLabel}>Purchase Type</label>
                        <select
                          value={inputs.purchaseType}
                          onChange={(e) => setInputs(prev => ({ ...prev, purchaseType: e.target.value as PurchaseType }))}
                          className={fieldSelect}
                        >
                          <option value="second_home">Second Home</option>
                          <option value="buy_to_let">Buy to Let</option>
                          <option value="limited_company">Limited Company</option>
                        </select>
                      </div>
                    </div>

                    {/* Mortgage Type Selection - 50/50 Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="w-full">
                        <label className={fieldLabel}>Mortgage Type</label>
                        <select
                          value={inputs.mortgageType || 'repayment'}
                          onChange={(e) => setInputs(prev => ({ ...prev, mortgageType: e.target.value as 'repayment' | 'interest_only' }))}
                          className={fieldSelect}
                        >
                          <option value="repayment">Repayment Mortgage</option>
                          <option value="interest_only">Interest Only Mortgage</option>
                        </select>
                        <div className="mt-1 text-xs text-gray-600">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-blue-600 font-medium">Repayment</span>
                            <span>•</span>
                            <span>Capital + interest, builds equity</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-purple-600 font-medium">Interest Only</span>
                            <span>•</span>
                            <span>Interest only, lower monthly cost</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full">
                        <label className={fieldLabel}>
                          {inputs.financeMode === 'bridge_refi' ? 'Monthly Bridge Payment' : 'Monthly Mortgage Payment'}
                        </label>
                        <div className="relative w-full">
                          <input
                            type="text"
                            value={`£${calculateMonthlyMortgagePayment().toLocaleString()}`}
                            className={`${fieldInput} bg-gray-50 cursor-not-allowed`}
                            readOnly
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                          <span className="text-blue-600 font-medium">Auto-calculated</span>
                          <span>•</span>
                          <span>{(inputs.purchasePrice * (1 - inputs.depositPct / 100)).toLocaleString()} mortgage</span>
                          <span>•</span>
                          {inputs.financeMode === 'bridge_refi' ? (
                            <>
                              <span>{inputs.bridgeRate || 10}% bridge rate</span>
                              <span>•</span>
                              <span className="text-orange-600 font-medium">Bridge Loan</span>
                            </>
                          ) : (
                            <>
                              <span>{inputs.interestRate}% interest rate</span>
                              <span>•</span>
                              <span className={`font-medium ${inputs.mortgageType === 'interest_only' ? 'text-purple-600' : 'text-blue-600'}`}>
                                {inputs.mortgageType === 'interest_only' ? 'Interest Only' : 'Repayment'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Monthly Rent & Expenses */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className={fieldLabel}>Monthly Rent (£)</label>
                        <input
                          type="number"
                          value={inputs.monthlyRent}
                          onChange={(e) => setInputs(prev => ({ ...prev, monthlyRent: Number(e.target.value) }))}
                          className={getFieldStyles(validateMonthlyRent(inputs.monthlyRent), inputs.monthlyRent > 0)}
                          min={0}
                        />
                        <div className="mt-1 flex items-center gap-2">
                          {inputs.monthlyRent > 0 && (
                            validateMonthlyRent(inputs.monthlyRent) ? (
                              <span className="text-green-600 text-xs">✓ Valid rent</span>
                            ) : (
                              <span className="text-red-600 text-xs">⚠ Rent should be £0 - £50k</span>
                            )
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Expected rental income after renovation</p>
                      </div>
                      <div>
                        <label className={fieldLabel}>Other Monthly Expenses (£)</label>
                        <input
                          type="number"
                          value={inputs.otherExpenses}
                          onChange={(e) => setInputs(prev => ({ ...prev, otherExpenses: Number(e.target.value) }))}
                          className={fieldInput}
                          min={0}
                        />
                        <p className="mt-1 text-xs text-gray-500">Insurance, maintenance, void periods</p>
                      </div>
                    </div>

                    {/* Growth & Refurb Assumptions */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className={fieldLabel}>Annual Growth (%)</label>
                        <input
                          type="number"
                          value={inputs.growthAnnualPct || 3}
                          onChange={(e) => setInputs(prev => ({ ...prev, growthAnnualPct: Number(e.target.value) }))}
                          className={fieldInput}
                          min={0}
                          step={0.1}
                        />
                        <p className="mt-1 text-xs text-gray-500">Long-term property value appreciation</p>
                      </div>
                      <div>
                        <label className={fieldLabel}>Refurb Uplift Factor</label>
                        <select
                          value={inputs.refurbUpliftFactor || 0.8}
                          onChange={(e) => setInputs(prev => ({ ...prev, refurbUpliftFactor: Number(e.target.value) }))}
                          className={fieldSelect}
                        >
                          <option value={0.7}>70% of refurb cost</option>
                          <option value={0.8}>80% of refurb cost</option>
                          <option value={0.9}>90% of refurb cost</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">How much value refurb adds</p>
                      </div>
                    </div>

                    {/* Finance Mode */}
                    <div>
                      <label className={fieldLabel}>Finance Mode</label>
                      <select
                        value={inputs.financeMode || 'day1'}
                        onChange={(e) => setInputs(prev => ({ ...prev, financeMode: e.target.value as 'day1' | 'bridge_refi' }))}
                        className={fieldSelect}
                      >
                        <option value="day1">Day-1 buy-to-let</option>
                        <option value="bridge_refi">Bridge → refinance</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        {inputs.financeMode === 'day1' 
                          ? 'Standard BTL mortgage from day one'
                          : 'Short-term bridge loan, then refinance to BTL'
                        }
                      </p>
                    </div>

                    {/* Bridge Finance Details */}
                    {inputs.financeMode === 'bridge_refi' && (
                      <div className="grid gap-4 md:grid-cols-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <label className={fieldLabel}>Bridge Rate (% APR)</label>
                          <input
                            type="number"
                            value={inputs.bridgeRate || 12}
                            onChange={(e) => setInputs(prev => ({ ...prev, bridgeRate: Number(e.target.value) }))}
                            className={fieldInput}
                            min={0}
                            step={0.1}
                          />
                          <p className="mt-1 text-xs text-gray-500">Typical: 10-15% APR</p>
                        </div>
                        <div>
                          <label className={fieldLabel}>Bridge Term (months)</label>
                          <input
                            type="number"
                            value={inputs.bridgeMonths || 6}
                            onChange={(e) => setInputs(prev => ({ ...prev, bridgeMonths: Number(e.target.value) }))}
                            className={fieldInput}
                            min={1}
                            max={24}
                          />
                          <p className="mt-1 text-xs text-gray-500">6-12 months typical</p>
                        </div>
                      </div>
                    )}

                    {/* Strategy-Specific Fields */}
                    {inputs.desiredModel === 'brrr' && (
                      <div className="grid gap-4 md:grid-cols-2 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div>
                          <label className={fieldLabel}>Remortgage LTV (%)</label>
                          <input
                            type="number"
                            value={inputs.remortgageLtv || 75}
                            onChange={(e) => setInputs(prev => ({ ...prev, remortgageLtv: Number(e.target.value) }))}
                            className={fieldInput}
                            min={60}
                            max={85}
                          />
                          <p className="mt-1 text-xs text-purple-600">LTV for refinancing after renovation</p>
                        </div>
                        <div>
                          <label className={fieldLabel}>Timeline (months)</label>
                          <input
                            type="number"
                            value={inputs.timelineMonths || 12}
                            onChange={(e) => setInputs(prev => ({ ...prev, timelineMonths: Number(e.target.value) }))}
                            className={fieldInput}
                            min={6}
                            max={24}
                          />
                          <p className="mt-1 text-xs text-purple-600">Time to complete BRRR cycle</p>
                        </div>
                      </div>
                    )}

                    {inputs.desiredModel === 'flip' && (
                      <div className="grid gap-4 md:grid-cols-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div>
                          <label className={fieldLabel}>Flip Timeline (months)</label>
                          <input
                            type="number"
                            value={inputs.flipTimeline || 12}
                            onChange={(e) => setInputs(prev => ({ ...prev, flipTimeline: Number(e.target.value) }))}
                            className={fieldInput}
                            min={3}
                            max={24}
                          />
                          <p className="mt-1 text-xs text-orange-600">Time to complete and sell</p>
                        </div>
                        <div>
                          <label className={fieldLabel}>Selling Costs (%)</label>
                          <input
                            type="number"
                            value={inputs.sellingCosts || 3}
                            onChange={(e) => setInputs(prev => ({ ...prev, sellingCosts: Number(e.target.value) }))}
                            className={fieldInput}
                            min={1}
                            max={5}
                          />
                          <p className="mt-1 text-xs text-orange-600">Agent fees, legal costs, etc.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <button
                    onClick={handlePrevStep}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back to Property Details
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    Continue to Results
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Results & Analysis */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Results & Analysis</h3>
                  <p className="text-sm text-gray-600 mb-6">Review your investment analysis and recommendations</p>
                  
                  {/* Calculate Results Button */}
                  <div className="text-center mb-8">
                    <button
                      onClick={() => {
                        const vanillaResult = calculateVanillaBTL(inputs);
                        const brrrResult = calculateBRRR(inputs);
                        const flipResult = calculateFlip(inputs);
                        setResults([vanillaResult, brrrResult, flipResult]);
                      }}
                      className="px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center gap-3 mx-auto"
                    >
                      <Calculator className="w-5 h-5" />
                      Calculate Investment Analysis
                    </button>
                  </div>

                  {/* Results Display */}
                  {results && results.length > 0 && (
                    <div className="space-y-6">
                      {/* Strategy Comparison Summary */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Strategy Comparison</h4>
                        <div className="grid gap-4 md:grid-cols-3">
                          {results.map((result) => (
                            <div key={result.model} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center gap-2 mb-3">
                                <div className={`p-2 rounded-lg ${getModelColor(result.model)}`}>
                                  {getModelIcon(result.model)}
                                </div>
                                <h5 className="font-semibold text-gray-900 capitalize">
                                  {result.model === 'vanilla' ? 'Vanilla BTL' : result.model.toUpperCase()}
                                </h5>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">ROI:</span>
                                  <span className={`font-semibold ${result.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {result.roi.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Cash Flow:</span>
                                  <span className={`font-semibold ${result.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(result.cashFlow)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Risk:</span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(result.risk)}`}>
                                    {result.risk}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Detailed Results for Each Strategy */}
                      {results.map((result) => (
                        <div key={result.model} className="border border-gray-200 rounded-xl overflow-hidden">
                          {/* Strategy Header */}
                          <div className={`p-4 ${getModelColor(result.model)}`}>
                            <div className="flex items-center gap-3">
                              {getModelIcon(result.model)}
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 capitalize">
                                  {result.model === 'vanilla' ? 'Vanilla BTL' : result.model.toUpperCase()} Analysis
                                </h4>
                                <p className="text-sm text-gray-700">{result.recommendation}</p>
                              </div>
                            </div>
                          </div>

                          {/* Strategy Content */}
                          <div className="p-6 bg-white">
                            <div className="grid gap-6 md:grid-cols-2">
                              {/* Key Metrics */}
                              <div className="space-y-4">
                                <h5 className="font-semibold text-gray-900">Key Metrics</h5>
                                <div className="grid gap-3">
                                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600">Total ROI</span>
                                    <span className={`font-semibold text-lg ${result.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {result.roi.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600">Annual Cash Flow</span>
                                    <span className={`font-semibold text-lg ${result.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatCurrency(result.cashFlow)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600">Total Profit</span>
                                    <span className={`font-semibold text-lg ${result.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatCurrency(result.totalProfit)}
                                    </span>
                                  </div>
                                  {result.grossYield && (
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                      <span className="text-sm text-gray-600">Gross Yield</span>
                                      <span className="font-semibold text-lg text-blue-600">
                                        {result.grossYield.toFixed(1)}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Investment Breakdown */}
                              <div className="space-y-4">
                                <h5 className="font-semibold text-gray-900">Investment Breakdown</h5>
                                <div className="grid gap-3">
                                  {result.investedDeposit && (
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                      <span className="text-sm text-gray-600">Deposit</span>
                                      <span className="font-semibold text-gray-900">
                                        {formatCurrency(result.investedDeposit)}
                                      </span>
                                    </div>
                                  )}
                                  {result.investedRefurb && (
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                      <span className="text-sm text-gray-600">Refurbishment</span>
                                      <span className="font-semibold text-gray-900">
                                        {formatCurrency(result.investedRefurb)}
                                      </span>
                                    </div>
                                  )}
                                  {result.investedFeesTotal && (
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                      <span className="text-sm text-gray-600">Fees & Costs</span>
                                      <span className="font-semibold text-gray-900">
                                        {formatCurrency(result.investedFeesTotal)}
                                      </span>
                                    </div>
                                  )}
                                  {result.investedTotal && (
                                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                      <span className="text-sm font-medium text-blue-700">Total Investment</span>
                                      <span className="font-bold text-lg text-blue-700">
                                        {formatCurrency(result.investedTotal)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Strategy-Specific Insights */}
                            {result.model === 'brrr' && result.equityReleased && (
                              <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <h6 className="font-semibold text-purple-900 mb-3">BRRR Insights</h6>
                                <div className="grid gap-3 md:grid-cols-3">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                      {formatCurrency(result.equityReleased)}
                                    </div>
                                    <div className="text-sm text-purple-700">Equity Released</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                      {formatCurrency(result.cashLeftInDeal || 0)}
                                    </div>
                                    <div className="text-sm text-purple-700">Cash Left in Deal</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                      {(result.recyclePercent || 0).toFixed(0)}%
                                    </div>
                                    <div className="text-sm text-purple-700">Capital Recycled</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {result.model === 'flip' && result.projectedCapitalGain && (
                              <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <h6 className="font-semibold text-orange-900 mb-3">Flip Insights</h6>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                      {formatCurrency(result.projectedCapitalGain)}
                                    </div>
                                    <div className="text-sm text-orange-700">Capital Gain</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                      {inputs.flipTimeline || 12} months
                                    </div>
                                    <div className="text-sm text-orange-700">Timeline</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Pros & Cons */}
                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                              <div>
                                <h6 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  Advantages
                                </h6>
                                <ul className="space-y-2">
                                  {result.pros.map((pro, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                      {pro}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h6 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                                  <XCircle className="w-4 h-4" />
                                  Considerations
                                </h6>
                                <ul className="space-y-2">
                                  {result.cons.map((con, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                      {con}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Results State */}
                  {(!results || results.length === 0) && (
                    <div className="text-center py-12 text-gray-500">
                      <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg mb-2">Ready to analyze your investment?</p>
                      <p className="text-sm">Click the button above to calculate detailed results for all three strategies</p>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <button
                    onClick={handlePrevStep}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back to Financial Details
                  </button>
                  {results && results.length > 0 && (
                    <button
                      onClick={() => window.print()}
                      className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print Report
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Results Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Preview</h3>
              
              {currentStep === 1 && (
                <div className="space-y-4">
                  {/* Strategy Guidance */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Strategy Guidance
                    </h4>
                    {inputs.desiredModel === 'vanilla' && (
                      <div className="text-sm text-blue-800">
                        <p className="mb-2"><strong>Vanilla BTL:</strong> Best for steady income and lower risk</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Aim for 5-8% gross yield</li>
                          <li>• Purchase at or near market value</li>
                          <li>• Minimal renovation (£5-8k)</li>
                          <li>• Immediate rental income</li>
                        </ul>
                      </div>
                    )}
                    {inputs.desiredModel === 'brrr' && (
                      <div className="text-sm text-blue-800">
                        <p className="mb-2"><strong>BRRR:</strong> Best for scaling portfolio quickly</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Buy 15-20% below market value</li>
                          <li>• Renovate for £20-30k value-add</li>
                          <li>• Refinance to release equity</li>
                          <li>• 6-12 month timeline</li>
                        </ul>
                      </div>
                    )}
                    {inputs.desiredModel === 'flip' && (
                      <div className="text-sm text-blue-800">
                        <p className="mb-2"><strong>FLIP:</strong> Best for quick capital gains</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Buy 15-20% below market value</li>
                          <li>• Maximum renovation impact (£25k+)</li>
                          <li>• Sell within 6-12 months</li>
                          <li>• No ongoing management</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Property Insights */}
                  {inputs.postcode && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Property Insights
                      </h4>
                      <div className="text-sm text-green-800">
                        <p className="mb-2"><strong>Postcode:</strong> {inputs.postcode}</p>
                        <p className="mb-2"><strong>Bedrooms:</strong> {inputs.bedrooms}</p>
                        <p className="mb-2"><strong>Size:</strong> {inputs.squareFootage} sq ft</p>
                        {inputs.bedrooms >= 3 && (
                          <p className="text-xs text-green-700 mt-2">
                            ✓ Good family home potential<br/>
                            ✓ Strong rental demand<br/>
                            ✓ Good resale market
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Tips */}
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Quick Tips
                    </h4>
                    <div className="text-sm text-purple-800 space-y-2">
                      <p>• Enter a postcode to enable the continue button</p>
                      <p>• Select your investment strategy for tailored guidance</p>
                      <p>• Use the property size fields for accurate calculations</p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  {/* Financial Summary */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Financial Summary
                    </h4>
                    <div className="text-sm text-blue-800 space-y-2">
                      <div className="flex justify-between">
                        <span>Purchase Price:</span>
                        <span className="font-semibold">{formatCurrency(inputs.purchasePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deposit:</span>
                        <span className="font-semibold">{formatCurrency(inputs.purchasePrice * (inputs.depositPct / 100))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Refurb Cost:</span>
                        <span className="font-semibold">{formatCurrency(inputs.refurbCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Rent:</span>
                        <span className="font-semibold">{formatCurrency(inputs.monthlyRent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Mortgage:</span>
                        <span className="font-semibold">{formatCurrency(calculateMonthlyMortgagePayment())}</span>
                      </div>
                      
                      {/* New Enhanced Metrics */}
                      <div className="border-t border-blue-200 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span>Monthly Cash Flow:</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${
                              (inputs.monthlyRent - calculateMonthlyMortgagePayment() - inputs.otherExpenses) >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {formatCurrency(inputs.monthlyRent - calculateMonthlyMortgagePayment() - inputs.otherExpenses)}
                            </span>
                            {(inputs.monthlyRent - calculateMonthlyMortgagePayment() - inputs.otherExpenses) >= 0 ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-600">⚠</span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Investment:</span>
                          <span className="font-semibold">{formatCurrency(
                            (inputs.purchasePrice * (inputs.depositPct / 100)) + 
                            inputs.refurbCost + 
                            inputs.stampDuty + 
                            inputs.legalFees + 
                            inputs.brokerFees
                          )}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Yield Calculator */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Quick Yield Calc
                    </h4>
                    <div className="text-sm text-green-800 space-y-2">
                      <div className="flex justify-between">
                        <span>Gross Yield:</span>
                        <span className="font-semibold">
                          {inputs.purchasePrice > 0 ? ((inputs.monthlyRent * 12 / inputs.purchasePrice) * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Net Yield:</span>
                        <span className="font-semibold">
                          {inputs.purchasePrice > 0 ? (((inputs.monthlyRent - inputs.otherExpenses) * 12 / inputs.purchasePrice) * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                      <div className="text-xs text-green-700 mt-2">
                        {inputs.purchasePrice > 0 && (inputs.monthlyRent * 12 / inputs.purchasePrice) * 100 >= 5 ? (
                          <span className="text-green-600">✓ Good yield potential</span>
                        ) : (
                          <span className="text-orange-600">⚠ Consider negotiating price</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Strategy-Specific Tips */}
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Strategy Tips
                    </h4>
                    <div className="text-sm text-purple-800">
                      {inputs.desiredModel === 'vanilla' && (
                        <p>Ensure monthly rent covers mortgage + expenses for positive cash flow</p>
                      )}
                      {inputs.desiredModel === 'brrr' && (
                        <p>Target 15-20% below market value to create equity for renovation</p>
                      )}
                      {inputs.desiredModel === 'flip' && (
                        <p>Calculate total costs including selling fees to ensure profit margin</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  {/* Results Summary */}
                  {results && results.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Results Summary
                      </h4>
                      <div className="text-sm text-green-800 space-y-2">
                        {results.map((result) => (
                          <div key={result.model} className="border-b border-green-200 pb-2 last:border-b-0">
                            <div className="font-medium capitalize mb-1">
                              {result.model === 'vanilla' ? 'Vanilla BTL' : result.model.toUpperCase()}
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span>ROI:</span>
                                <span className={result.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {result.roi.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Cash Flow:</span>
                                <span className={result.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {formatCurrency(result.cashFlow)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Best Strategy */}
                  {results && results.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Recommended Strategy
                      </h4>
                      <div className="text-sm text-blue-800">
                        {(() => {
                          const bestStrategy = results.reduce((best, current) => 
                            current.roi > best.roi ? current : best
                          );
                          return (
                            <div>
                              <p className="font-medium capitalize mb-1">
                                {bestStrategy.model === 'vanilla' ? 'Vanilla BTL' : bestStrategy.model.toUpperCase()}
                              </p>
                              <p className="text-xs">
                                Highest ROI at {bestStrategy.roi.toFixed(1)}%
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Action Items */}
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Next Steps
                    </h4>
                    <div className="text-sm text-purple-800 space-y-2">
                      <p>• Review detailed analysis for each strategy</p>
                      <p>• Compare pros and cons</p>
                      <p>• Print report for your records</p>
                      <p>• Consider market conditions</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Default State */}
              {(!currentStep || currentStep < 1) && (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Start with Step 1 to see tailored guidance</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
