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
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  X
} from 'lucide-react';

import { fieldInput, fieldLabel, fieldSelect } from '../components/ui/fieldStyles';
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
  desiredModel: 'vanilla' | 'brrr' | 'flip';
  
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
    refurbCost: 15000,
    refurbLevel: 'cosmetic',
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
    desiredModel: 'vanilla' as const,
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

  // Multi-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const steps = [
    { id: 1, title: 'Property Details', description: 'Basic property information' },
    { id: 2, title: 'Investment Strategy', description: 'Choose your investment model' },
    { id: 3, title: 'Financial Details', description: 'Prices, rent, and assumptions' },
    { id: 4, title: 'Mortgage & Deposit', description: 'Financing details' },
    { id: 5, title: 'Review & Calculate', description: 'Summary and results' }
  ];

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
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
    
    return {
      model: 'vanilla',
      roi: Math.max(0, roi),
      cashFlow: monthlyCashFlow,
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
    const cashLeftInDeal = totalInvestment - equityReleased;
    
    // Calculate ROI based on total profit (equity released minus investment)
    const totalProfit = equityReleased - totalInvestment;
    const roi = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
    
    // During renovation period, no rental income (property is being worked on)
    const monthlyCashFlow = 0; // No cash flow during BRRR cycle
    const rentReturnTotal = 0; // No rent during renovation
    
    // BRRR insights
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
      roi: Math.max(0, roi),
      cashFlow: 0, // No cash flow during BRRR cycle
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
      roi: Math.max(0, annualizedRoi),
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

  // Progress Bar Component
  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Deal Calculator</h2>
        <span className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      
      {/* Step Indicators */}
      <div className="flex justify-between mt-4">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => goToStep(step.id)}
            className={`flex flex-col items-center space-y-2 ${
              step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step.id < currentStep 
                ? 'bg-green-500 text-white' 
                : step.id === currentStep 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step.id < currentStep ? '✓' : step.id}
            </div>
            <span className="text-xs font-medium max-w-20 text-center">{step.title}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Progress Bar */}
      <div className="lg:col-span-2">
        <ProgressBar />
      </div>
      
      {/* Input Form */}
      <div className="space-y-6">
        {/* Step 1: Property Details */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
            
            <div className="grid gap-3">
              <div className="grid gap-1">
                <label className={fieldLabel}>Property source</label>
                <div className={`grid gap-2 text-xs ${isAuthenticated ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {(['search','manual','watchlist'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setAddressMode(m); }}
                      className={`rounded-md border px-2 py-1 ${addressMode === m ? 'border-gray-900 text-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
                    >
                      {m === 'search' ? 'Search by postcode' : m === 'manual' ? 'Add manually' : 'From watchlist'}
                    </button>
                  ))}
                </div>
              </div>

              {addressMode === 'search' && (
                <div>
                  <label className={fieldLabel}>Postcode</label>
                  <input
                    value={inputs.postcode}
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
                      
                      setInputs(prev => ({ ...prev, postcode: value }));
                    }}
                    placeholder="e.g., NE5 4PR"
                    className={fieldInput}
                    maxLength={8}
                  />
                </div>
              )}

              {addressMode === 'manual' && (
                <>
                  <label className={`${fieldLabel} mt-2`}>House number and street</label>
                  <input
                    value={inputs.address}
                    onChange={(e) => setInputs(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g., 73 Belgrave Road"
                    className={`${fieldInput} mt-1`}
                  />
                  <p className="mt-1 text-xs text-gray-500">Enter the property address manually if it's not in our database.</p>
                </>
              )}

              {addressMode === 'watchlist' && (
                <div className="mt-2 max-h-48 overflow-auto rounded-md border border-gray-200 bg-white text-sm">
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
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={nextStep}
                disabled={!inputs.postcode && !inputs.address}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next: Investment Strategy
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Investment Strategy */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Strategy</h3>
            
            <div className="grid gap-3 mt-2">
              {(['vanilla', 'brrr', 'flip'] as const).map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, desiredModel: model }))}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    inputs.desiredModel === model 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getModelIcon(model)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {model === 'vanilla' ? 'Vanilla BTL' : model.toUpperCase()}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {model === 'vanilla' 
                          ? 'Buy at market value, minimal renovation (£5-8k), immediate rental income'
                          : model === 'brrr'
                          ? 'Buy distressed property at 15-20% discount, renovate significantly (£20k+), refinance to release equity'
                          : 'Buy distressed property at 15-20% discount, renovate quickly (£25k+), sell for profit within 6-12 months'
                        }
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        {model === 'vanilla' 
                          ? 'Best for: Steady income, lower risk, long-term holds'
                          : model === 'brrr'
                          ? 'Best for: Scaling portfolio, capital recycling, higher returns'
                          : 'Best for: Quick profits, no ongoing management, capital gains'
                        }
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Previous: Property Details
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={!inputs.desiredModel}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next: Financial Details
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Financial Details */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h3>
            
            <div className="grid gap-4">
              <div>
                <label className={fieldLabel}>Offer/asking price (£)</label>
                <input
                  type="number"
                  value={inputs.purchasePrice}
                  onChange={(e) => setInputs(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                  className={fieldInput}
                  min={0}
                />
              </div>

              <div>
                <label className={fieldLabel}>Open market value (MV)</label>
                <div className="text-sm text-gray-900 px-3 py-2 border rounded-lg bg-gray-50">
                  £{(inputs.marketValue || 0).toLocaleString()}
                </div>
              </div>

              <div>
                <label className={fieldLabel}>Estimated renovated value</label>
                <input
                  type="number"
                  value={inputs.estimatedRenovatedValue}
                  onChange={(e) => setInputs(prev => ({ ...prev, estimatedRenovatedValue: Number(e.target.value) }))}
                  className={fieldInput}
                  min={0}
                />
                <p className="mt-1 text-xs text-gray-500">What you think the property will be worth after refurbishment</p>
              </div>

              <div>
                <label className={fieldLabel}>Monthly rent (optional)</label>
                <input
                  type="number"
                  value={inputs.monthlyRent}
                  onChange={(e) => setInputs(prev => ({ ...prev, monthlyRent: Number(e.target.value) }))}
                  className={fieldInput}
                  min={0}
                />
                <p className="mt-1 text-xs text-gray-500">Used to calculate gross yield and rental performance metrics</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={fieldLabel}>Growth (%/yr)</label>
                  <input
                    type="number"
                    value={inputs.growthAnnualPct}
                    onChange={(e) => setInputs(prev => ({ ...prev, growthAnnualPct: Number(e.target.value) }))}
                    className={fieldInput}
                    min={0}
                    step={0.1}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Refurb uplift factor</label>
                  <select
                    value={inputs.refurbUpliftFactor}
                    onChange={(e) => setInputs(prev => ({ ...prev, refurbUpliftFactor: Number(e.target.value) }))}
                    className={fieldSelect}
                  >
                    <option value={0.7}>70% of refurb cost</option>
                    <option value={0.8}>80% of refurb cost</option>
                    <option value={0.9}>90% of refurb cost</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={fieldLabel}>Finance mode</label>
                  <select
                    value={inputs.financeMode}
                    onChange={(e) => setInputs(prev => ({ ...prev, financeMode: e.target.value as 'day1' | 'bridge_refi' }))}
                    className={fieldSelect}
                  >
                    <option value="day1">Day-1 buy-to-let</option>
                    <option value="bridge_refi">Bridge → refinance</option>
                  </select>
                </div>
                {inputs.financeMode === 'bridge_refi' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={fieldLabel}>Bridge rate (% APR)</label>
                      <input
                        type="number"
                        value={inputs.bridgeRate}
                        onChange={(e) => setInputs(prev => ({ ...prev, bridgeRate: Number(e.target.value) }))}
                        className={fieldInput}
                        min={0}
                        step={0.1}
                      />
                    </div>
                    <div>
                      <label className={fieldLabel}>Bridge term (months)</label>
                      <input
                        type="number"
                        value={inputs.bridgeMonths}
                        onChange={(e) => setInputs(prev => ({ ...prev, bridgeMonths: Number(e.target.value) }))}
                        className={fieldInput}
                        min={0}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Previous: Investment Strategy
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={!inputs.purchasePrice || !inputs.desiredModel}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next: Mortgage & Deposit
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Mortgage & Deposit */}
        {currentStep === 4 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mortgage & Deposit</h3>
            
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={fieldLabel}>Type</label>
                  <select
                    defaultValue="interest_only"
                    className={fieldSelect}
                  >
                    <option value="interest_only">Interest only</option>
                    <option value="repayment">Repayment</option>
                  </select>
                </div>
                <div>
                  <label className={fieldLabel}>Rate (%)</label>
                  <input
                    type="number"
                    value={inputs.interestRate}
                    onChange={(e) => setInputs(prev => ({ ...prev, interestRate: Number(e.target.value) }))}
                    className={fieldInput}
                    min={0}
                    max={20}
                    step={0.1}
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Outstanding balance at refinance: £318,750
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={fieldLabel}>Deposit</label>
                <select
                  value={inputs.depositPct}
                  onChange={(e) => setInputs(prev => ({ ...prev, depositPct: Number(e.target.value) }))}
                  className={fieldSelect}
                >
                  <option value={10}>10%</option>
                  <option value={15}>15%</option>
                  <option value={20}>20%</option>
                  <option value={25}>25%</option>
                  <option value={30}>30%</option>
                  <option value={35}>35%</option>
                  <option value={40}>40%</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Deposit amount: £{Math.round(inputs.purchasePrice * (inputs.depositPct / 100)).toLocaleString()}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Previous: Financial Details
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={!inputs.interestRate || !inputs.depositPct}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next: Refurbishment & Fees
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Refurbishment & Fees */}
        {currentStep === 5 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Refurbishment & Fees</h3>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeRefurb"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={includeRefurb}
                  onChange={(e) => setIncludeRefurb(e.target.checked)}
                />
                <label htmlFor="includeRefurb" className="text-sm font-medium text-gray-900">
                  Include refurbishment in analysis
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sdltOverride"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={sdltOverride}
                  onChange={(e) => setSdltOverride(e.target.checked)}
                />
                <label htmlFor="sdltOverride" className="text-sm font-medium text-gray-900">
                  Override stamp duty (uses local CPI estimate)
                </label>
              </div>
            </div>
            
            {includeRefurb && (
            <div className="grid gap-4">
              <div className="grid gap-3">
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${inputs.refurbLevel === 'cosmetic' ? 'border-green-600 bg-green-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`} onClick={() => {
                  const newCost = calculateRefurbCost('cosmetic', inputs.bedrooms, inputs.squareFootage, inputs.refurbContingencyPct);
                  setInputs(prev => ({ ...prev, refurbLevel: 'cosmetic', refurbCost: newCost }));
                }}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {inputs.refurbLevel === 'cosmetic' && (
                        <Check className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">Cosmetic refresh</h4>
                        <p className="text-sm text-gray-600 mt-1">Painting/decor, flooring, minor joinery, fixtures & fittings.</p>
                        <div className="mt-1 text-xs text-gray-500">
                          {inputs.desiredModel === 'vanilla' 
                            ? 'Perfect for vanilla BTL - quick turnaround, immediate rental'
                            : inputs.desiredModel === 'brrr'
                            ? 'May not add enough value for BRRR strategy'
                            : 'May not justify flip margins - consider higher level'
                          }
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">£{calculateRefurbCost('cosmetic', inputs.bedrooms, inputs.squareFootage, inputs.refurbContingencyPct).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${inputs.refurbLevel === 'modernisation' ? 'border-green-600 bg-green-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`} onClick={() => {
                  const newCost = calculateRefurbCost('modernisation', inputs.bedrooms, inputs.squareFootage, inputs.refurbContingencyPct);
                  setInputs(prev => ({ ...prev, refurbLevel: 'modernisation', refurbCost: newCost }));
                }}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {inputs.refurbLevel === 'modernisation' && (
                        <Check className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">Modernisation</h4>
                        <p className="text-sm text-gray-600 mt-1">New kitchen/bath updates, partial rewire, boiler/heating refresh, windows in parts.</p>
                        <div className="mt-1 text-xs text-gray-500">
                          {inputs.desiredModel === 'vanilla' 
                            ? 'Good for vanilla if you want higher rental value'
                            : inputs.desiredModel === 'brrr'
                            ? 'Good balance for BRRR - adds value without excessive cost'
                            : 'Good for flip - significant improvement for resale'
                          }
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">£{calculateRefurbCost('modernisation', inputs.bedrooms, inputs.squareFootage, inputs.refurbContingencyPct).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${inputs.refurbLevel === 'full_renovation' ? 'border-green-600 bg-green-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`} onClick={() => {
                  const newCost = calculateRefurbCost('full_renovation', inputs.bedrooms, inputs.squareFootage, inputs.refurbContingencyPct);
                  setInputs(prev => ({ ...prev, refurbLevel: 'full_renovation', refurbCost: newCost }));
                }}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {inputs.refurbLevel === 'full_renovation' && (
                        <Check className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">Full renovation</h4>
                        <p className="text-sm text-gray-600 mt-1">Full rewire, plumbing/heating, new kitchen & bathrooms, windows/doors, possible structural repairs.</p>
                        <div className="mt-1 text-xs text-gray-500">
                          {inputs.desiredModel === 'vanilla' 
                            ? 'May delay rental income - consider if necessary'
                            : inputs.desiredModel === 'brrr'
                            ? 'Excellent for BRRR - maximum value creation'
                            : 'Perfect for flip - maximum resale appeal'
                          }
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">£{calculateRefurbCost('full_renovation', inputs.bedrooms, inputs.squareFootage, inputs.refurbContingencyPct).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={fieldLabel}>Contingency</label>
                <select 
                  className={fieldSelect}
                  value={inputs.refurbContingencyPct}
                  onChange={(e) => {
                    const pct = Number(e.target.value);
                    // Recalculate current level cost including contingency
                    const newCost = calculateRefurbCost(inputs.refurbLevel, inputs.bedrooms, inputs.squareFootage, pct);
                    setInputs(prev => ({ ...prev, refurbContingencyPct: pct, refurbCost: newCost }));
                  }}
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={10}>10%</option>
                  <option value={15}>15%</option>
                  <option value={20}>20%</option>
                  <option value={25}>25%</option>
                </select>
              </div>

              <div>
                <label className={fieldLabel}>Refurbishment cost (£) — override</label>
                <input
                  type="number"
                  value={inputs.refurbCost}
                  onChange={(e) => setInputs(prev => ({ ...prev, refurbCost: Number(e.target.value) }))}
                  className={fieldInput}
                  min={0}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {inputs.desiredModel === 'vanilla' 
                    ? 'For vanilla BTL, keep costs under £8k for quick rental turnaround. Focus on cosmetic improvements only.'
                    : inputs.desiredModel === 'brrr'
                    ? 'For BRRR, aim for £20k+ renovation to justify refinance. Ensure 80%+ value-add ratio.'
                    : 'For flip, aim for £25k+ renovation for maximum resale impact. Focus on high-visibility improvements.'
                  }
                  <br />
                  Costs are calculated from the selected scope, adjusted for bedrooms & square footage, then contingency is applied. 
                  For a 5-bed house, costs will be ~67% higher than a 3-bed before contingency. 
                  These are estimates based on UK market averages - actual costs vary by location and condition.
                </p>
              </div>
            </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={fieldLabel}>Stamp duty (£) — override</label>
                <input
                  type="number"
                  value={inputs.stampDuty}
                  onChange={(e) => setInputs(prev => ({ ...prev, stampDuty: Number(e.target.value) }))}
                  className={fieldInput}
                  min={0}
                />
                <p className="mt-1 text-xs text-gray-500">Type affects auto-calculated SDLT. Override to use a custom value.</p>
              </div>

              <div>
                <label className={fieldLabel}>Legal fees (£)</label>
                <input
                  type="number"
                  value={inputs.legalFees}
                  onChange={(e) => setInputs(prev => ({ ...prev, legalFees: Number(e.target.value) }))}
                  className={fieldInput}
                  min={0}
                />
              </div>

              <div>
                <label className={fieldLabel}>Broker fees (£)</label>
                <input
                  type="number"
                  value={inputs.brokerFees}
                  onChange={(e) => setInputs(prev => ({ ...prev, brokerFees: Number(e.target.value) }))}
                  className={fieldInput}
                  min={0}
                />
              </div>

              <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-600">Total fees</span>
                <span className="font-semibold">£{(inputs.stampDuty + inputs.legalFees + inputs.brokerFees).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={fieldLabel}>Remortgage LTV (%)</label>
                <select className={fieldSelect}>
                  <option value={75}>75% (typical)</option>
                  <option value={80}>80%</option>
                  <option value={85}>85%</option>
                </select>
              </div>
              <div>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800">Advanced</a>
              </div>
            </div>
            <p className="text-xs text-gray-500">Most lenders cap BTL remortgage around 75% LTV; 80% may require tighter stress tests.</p>
            <div className="text-sm text-gray-600">
              Est. remortgage @75% in 24m: £352,091 (assumes 5.1%/yr HPI)
            </div>

            <div>
              <label className={fieldLabel}>Remortgage timeline</label>
              <select
                className={fieldSelect}
                value={inputs.timelineMonths}
                onChange={(e) => setInputs(prev => ({ ...prev, timelineMonths: Number(e.target.value) }))}
              >
                <option value={24}>2 years</option>
                <option value={36}>3 years</option>
                <option value={60}>5 years</option>
                <option value={120}>10 years</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="adjustInflation"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="adjustInflation" className="text-sm font-medium text-gray-900">
                Adjust for inflation (uses local CPI estimate)
              </label>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Previous: Refurbishment & Fees
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={!inputs.refurbCost || !inputs.stampDuty || !inputs.legalFees || !inputs.brokerFees}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next: Purchase Type
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Purchase Type */}
        {currentStep === 6 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase type</h3>
            
            <div className="grid gap-2">
              <div className="grid gap-2 text-xs grid-cols-3">
                <button
                  type="button"
                  className="rounded-md border px-2 py-1 border-gray-300 text-gray-600 hover:border-gray-400"
                >
                  First-time buyer
                </button>
                <button
                  type="button"
                  className="rounded-md border px-2 py-1 border-gray-300 text-gray-600 hover:border-gray-400"
                >
                  Personal
                </button>
                <button
                  type="button"
                  className="rounded-md border px-2 py-1 border-gray-900 text-gray-900"
                >
                  Second home / LTD
                </button>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Previous: Refurbishment & Fees
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={!inputs.purchaseType}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next: Review & Calculate
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Review & Calculate */}
        {currentStep === 7 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Combined Deal Summary & Strategy Recommendation */}
            {recommendedModel && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-6 h-6" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Deal Summary & Strategy</h3>
                    <p className="text-blue-100">Complete analysis of your investment opportunity</p>
                  </div>
                </div>
                
                {/* Key Financial Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/20 rounded-lg p-3 text-center">
                    <div className="text-xs text-blue-100 font-medium mb-1">TOTAL INVESTMENT NEEDED</div>
                    <div className="text-xl font-bold text-white">
                      £{results[0]?.investedTotal ? results[0].investedTotal.toLocaleString() : '0'}
                    </div>
                    <div className="text-xs text-blue-100">Initial Capital Required</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3 text-center">
                    <div className="text-xs text-blue-100 font-medium mb-1">BEST MODEL ROI</div>
                    <div className="text-xl font-bold text-green-300">
                      {Math.max(...results.map(r => r.roi)).toFixed(1)}%
                    </div>
                    <div className="text-xs text-blue-100">
                      {results.find(r => r.roi === Math.max(...results.map(r => r.roi)))?.model.toUpperCase()} Strategy
                    </div>
                  </div>
                </div>

                {/* Strategy Comparison */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {results.map((result) => (
                    <div key={result.model} className={`text-center p-2 rounded-lg ${
                      result.model === recommendedModel ? 'bg-white/30 border-2 border-white' : 'bg-white/10'
                    }`}>
                      <div className="font-medium text-white capitalize">{result.model}</div>
                      <div className="text-lg font-bold text-white">{result.roi.toFixed(1)}%</div>
                      <div className="text-blue-100 text-xs">ROI</div>
                    </div>
                  ))}
                </div>

                {/* Recommended Strategy Details */}
                <div className="bg-white/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    {getModelIcon(recommendedModel)}
                    <span className="font-semibold capitalize">{recommendedModel.toUpperCase()}</span>
                    <span className="text-blue-100 text-sm">RECOMMENDED</span>
                  </div>
                  <p className="text-sm text-blue-100 mb-3">
                    {results.find(r => r.model === recommendedModel)?.recommendation}
                  </p>
                </div>

                {/* Why This Strategy Was Recommended */}
                <div className="bg-white/20 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-white mb-3">Why {recommendedModel.toUpperCase()} Was Recommended:</h4>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const result = results.find(r => r.model === recommendedModel);
                      if (!result) return null;
                      
                      if (recommendedModel === 'vanilla') {
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-300" />
                              <span className="text-white font-medium">Good rental yield: {result.grossYield?.toFixed(1)}% gross yield</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-300" />
                              <span className="text-white font-medium">Minimal renovation needed: £{result.investedRefurb?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-300" />
                              <span className="text-white font-medium">Immediate cash flow: £{result.cashFlow?.toFixed(0)}/month</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-300" />
                              <span className="text-white font-medium">Lower risk profile with steady returns</span>
                            </div>
                          </>
                        );
                      } else if (recommendedModel === 'brrr') {
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-300" />
                              <span className="text-white font-medium">Significant renovation potential: £{result.investedRefurb?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-300" />
                              <span className="text-white font-medium">Below market value purchase opportunity</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-300" />
                              <span className="text-white font-medium">Equity release potential: £{(result.equityReleased || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-300" />
                              <span className="text-white font-medium">Capital recycling: {(result.recyclePercent || 0).toFixed(0)}%</span>
                            </div>
                          </>
                        );
                      } else if (recommendedModel === 'flip') {
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-300" />
                              <span className="text-white font-medium">High renovation impact: £{result.investedRefurb?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-300" />
                              <span className="text-white font-medium">Quick turnaround: {result.timeHorizonMonths} months</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-300" />
                              <span className="text-white font-medium">Below market value purchase opportunity</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-300" />
                              <span className="text-white font-medium">High potential returns: {result.roi.toFixed(1)}% ROI</span>
                            </div>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* Key Decision Factors */}
                <div className="bg-white/20 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3">Key Decision Factors:</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs text-blue-100">
                    <div>
                      <div className="font-medium">Purchase Price</div>
                      <div>£{inputs.purchasePrice?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-medium">Refurb Cost</div>
                      <div>£{inputs.refurbCost?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-medium">Monthly Rent</div>
                      <div>£{inputs.monthlyRent?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-medium">Gross Yield</div>
                      <div>{inputs.monthlyRent && inputs.purchasePrice ? ((inputs.monthlyRent * 12) / inputs.purchasePrice * 100).toFixed(1) : '0'}%</div>
                    </div>
                  </div>
                </div>
        )}

        {/* Right Side - Results */}
        {currentStep === 7 && results && results.length > 0 && (
          <div className="space-y-6">
            {/* Analysis Models */}
            <div className="space-y-6">
              {results.map((result, index) => (
              <motion.div
                key={result.model}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border rounded-xl p-6 ${getModelColor(result.model)} ${
                  result.model === recommendedModel ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Accordion Header - Always Visible */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getModelIcon(result.model)}
                    <h3 className="font-semibold capitalize">{result.model.toUpperCase()}</h3>
                    {result.model === recommendedModel && (
                      <Award className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(result.risk)}`}>
                      {result.risk} risk
                    </span>
                    <button
                      onClick={() => toggleAccordion(result.model as 'vanilla' | 'brrr' | 'flip')}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      {openAccordions[result.model as 'vanilla' | 'brrr' | 'flip'] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Key Financial Summary - Always Visible */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200 mb-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">INITIAL COST</div>
                      <div className="text-lg font-bold text-gray-800">£{(result.investedTotal || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">NET RETURN</div>
                      <div className={`text-lg font-bold ${(result.totalProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        £{(result.totalProfit || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">ROI</div>
                      <div className="text-lg font-bold text-blue-600">{result.roi.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>

                {/* Accordion Content - Simple Conditional Rendering */}
                {openAccordions[result.model as 'vanilla' | 'brrr' | 'flip'] && (
                  <div className="space-y-4">
                    {/* Detailed Metrics */}
                    <div className="grid gap-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">ROI</span>
                        <span className="font-semibold">{result.roi.toFixed(1)}%</span>
                      </div>
                      
                      {/* Model-specific metrics */}
                      {result.model === 'vanilla' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Monthly Cash Flow</span>
                            <span className={`font-semibold ${result.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              £{result.cashFlow.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Annual Cash Flow</span>
                            <span className={`font-semibold ${(result.cashFlow * 12) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              £{(result.cashFlow * 12).toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}
                      
                      {result.model === 'brrr' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Equity Released</span>
                            <span className="font-semibold text-purple-600">£{(result.equityReleased || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Capital Recycle %</span>
                            <span className="font-semibold text-purple-600">{(result.recyclePercent || 0).toFixed(0)}%</span>
                          </div>
                        </>
                      )}
                      
                      {result.model === 'flip' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Flip Timeline</span>
                            <span className="font-semibold text-orange-600">{inputs.flipTimeline} months</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Annualized ROI</span>
                            <span className="font-semibold text-orange-600">{result.roi.toFixed(1)}%</span>
                          </div>
                        </>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Income after deductions ({result.timeHorizonMonths || 12} months)</span>
                        <span className="font-semibold">£{(result.rentReturnTotal || 0).toLocaleString()}</span>
                      </div>
                      
                      {result.model !== 'flip' && typeof result.grossYield === 'number' && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Gross Yield</span>
                          <span className="font-semibold">{result.grossYield.toFixed(1)}%</span>
                        </div>
                      )}
                      
                      {result.model !== 'flip' && typeof result.estGrowthPct === 'number' && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Estimated Growth</span>
                          <span className="font-semibold">{result.estGrowthPct.toFixed(1)}% / yr</span>
                        </div>
                      )}
                      
                      {typeof result.timeHorizonMonths === 'number' && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Timeframe</span>
                          <span className="font-semibold">{(result.timeHorizonMonths / 12).toFixed(0)} year{result.timeHorizonMonths >= 24 ? 's' : ''}</span>
                        </div>
                      )}
                      
                      {/* Model-specific summary metric */}
                      {result.model === 'brrr' ? (
                        <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2 border">
                          <span className="text-sm text-gray-700">Cash left in deal</span>
                          <span className="text-lg font-semibold">£{(result.cashLeftInDeal || 0).toLocaleString()}</span>
                        </div>
                      ) : result.model === 'flip' ? (
                        <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2 border">
                          <span className="text-sm text-gray-700">Total Profit</span>
                          <span className={`text-lg font-semibold ${(result.totalProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            £{(result.totalProfit || 0).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center bg-white/600 rounded-lg px-3 py-2 border">
                          <span className="text-sm text-gray-700">Total Profit</span>
                          <span className={`text-lg font-semibold ${(result.totalProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            £{(result.totalProfit || 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Key Financial Summary - Highlighted */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
                      <h4 className="text-sm font-bold text-blue-800 mb-3 text-center">KEY FINANCIAL SUMMARY</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-xs text-blue-600 font-medium mb-1">ESTIMATED COST NEEDED</div>
                          <div className="text-lg font-bold text-blue-800">£{(result.investedTotal || 0).toLocaleString()}</div>
                          <div className="text-xs text-blue-600">Initial Investment</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-blue-600 font-medium mb-1">RETURNS AFTER TERM</div>
                          <div className={`text-lg font-bold ${(result.totalProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            £{(result.totalProfit || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-600">
                            {result.model === 'brrr' ? 'Equity Released' : 
                             result.model === 'flip' ? 'Sale Profit' : 
                             'Net Profit'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="text-center">
                          <div className="text-xs text-blue-600 font-medium mb-1">NET POSITION</div>
                          <div className={`text-lg font-bold ${(result.totalProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {result.totalProfit >= 0 ? '+' : ''}£{(result.totalProfit || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-600">
                            {result.totalProfit >= 0 ? 'Profit' : 'Loss'} over {(result.timeHorizonMonths || 12) / 12} year{(result.timeHorizonMonths || 12) / 12 >= 2 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Investment & Returns Breakdown */}
                    <div className="grid md:grid-cols-2 gap-4 mb-2 text-sm">
                      <div className="bg-white/60 rounded-lg p-3 border">
                        <div className="font-medium text-gray-800 mb-2">Investment</div>
                        <div className="flex justify-between"><span className="text-gray-600">Deposit</span><span>£{(result.investedDeposit || 0).toLocaleString()}</span></div>
                        {typeof result.investedRefurb === 'number' && result.investedRefurb > 0 && (
                          <div className="flex justify-between"><span className="text-gray-600">Refurb</span><span>£{result.investedRefurb.toLocaleString()}</span></div>
                        )}
                        <div className="flex justify-between"><span className="text-gray-600">Stamp duty</span><span>£{(result.investedStampDuty || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Legal fees</span><span>£{(result.investedLegalFees || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Broker fees</span><span>£{(result.investedBrokerFees || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between font-semibold mt-1 pt-1 border-t"><span>Total invested</span><span>£{(result.investedTotal || 0).toLocaleString()}</span></div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3 border">
                        <div className="font-medium text-gray-800 mb-2">Returns</div>
                        <div className="flex justify-between"><span className="text-gray-600">Rent over {(result.timeHorizonMonths || 12) / 12} yr</span><span>£{(result.rentReturnTotal || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Value gain (projected)</span><span>£{(result.projectedCapitalGain || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between font-medium mt-1"><span className="text-gray-700">Total returns</span><span>£{(((result.rentReturnTotal || 0) + (result.projectedCapitalGain || 0))).toLocaleString()}</span></div>
                        {result.model === 'brrr' && (
                          <div className="mt-3">
                            <div className="grid gap-1 text-xs text-gray-700 mb-3">
                              <div className="flex justify-between"><span>Equity released at refi</span><span>£{(result.equityReleased || 0).toLocaleString()}</span></div>
                              <div className="flex justify-between"><span>Cash left in deal</span><span>£{(result.cashLeftInDeal || 0).toLocaleString()}</span></div>
                              <div className="flex justify-between"><span>Recycle %</span><span>{(result.recyclePercent || 0).toFixed(0)}%</span></div>
                            </div>
                            <button
                              onClick={() => setShowBrrrDetailsModal(true)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors"
                            >
                              See details
                            </button>
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-600">Minus invested capital</div>
                        <div className="flex justify-between text-xs"><span className="text-gray-600">- Deposit</span><span>£{(result.investedDeposit || 0).toLocaleString()}</span></div>
                        {typeof result.investedRefurb === 'number' && result.investedRefurb > 0 && (
                          <div className="flex justify-between text-xs"><span className="text-gray-600">- Refurb</span><span>£{result.investedRefurb.toLocaleString()}</span></div>
                        )}
                        <div className="flex justify-between text-xs"><span className="text-gray-600">- Stamp duty</span><span>£{(result.investedStampDuty || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-600">- Legal fees</span><span>£{(result.investedLegalFees || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-600">- Broker fees</span><span>£{(result.investedBrokerFees || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between font-semibold mt-2">
                          <span>{result.model === 'brrr' ? 'Cash left in deal' : 'Total profit'}</span>
                          <span>£{(result.model === 'brrr' ? (result.cashLeftInDeal || 0) : (result.totalProfit || 0)).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Pros and Cons */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Pros</h4>
                        <ul className="space-y-1">
                          {result.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                              <CheckCircle className="w-3 h-3 text-green-700 mt-0.5 flex-shrink-0" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Cons</h4>
                        <ul className="space-y-1">
                          {result.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                              <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                              </motion.div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Previous: Purchase Type
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={!inputs.purchaseType}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next: Review & Calculate
              </button>
            </div>
          </div>
        )}

        {/* Right Side - Results */}
        {currentStep === 7 && results && results.length > 0 && (
          <div className="space-y-6">
            {/* Analysis Models */}
            <div className="space-y-6">
              {results.map((result, index) => (
                <motion.div
                  key={result.model}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border rounded-xl p-6 ${getModelColor(result.model)} ${
                    result.model === recommendedModel ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {/* Accordion Header - Always Visible */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getModelIcon(result.model)}
                      <h3 className="font-semibold capitalize">{result.model.toUpperCase()}</h3>
                      {result.model === recommendedModel && (
                        <Award className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(result.risk)}`}>
                        {result.risk} risk
                      </span>
                      <button
                        onClick={() => toggleAccordion(result.model as 'vanilla' | 'brrr' | 'flip')}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                      >
                        {openAccordions[result.model as 'vanilla' | 'brrr' | 'flip'] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Key Financial Summary - Always Visible */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200 mb-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-xs text-gray-500 font-medium mb-1">INITIAL COST</div>
                        <div className="text-lg font-bold text-gray-800">£{(result.investedTotal || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium mb-1">NET RETURN</div>
                        <div className={`text-lg font-bold ${(result.totalProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          £{(result.totalProfit || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium mb-1">ROI</div>
                        <div className="text-lg font-bold text-blue-600">{result.roi.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Accordion Content - Simple Conditional Rendering */}
                  {openAccordions[result.model as 'vanilla' | 'brrr' | 'flip'] && (
                    <div className="space-y-4">
                      {/* Detailed Metrics */}
                      <div className="grid gap-3 mb-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">ROI</span>
                          <span className="font-semibold">{result.roi.toFixed(1)}%</span>
                        </div>
                        
                        {/* Model-specific metrics */}
                        {result.model === 'vanilla' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Monthly Cash Flow</span>
                              <span className={`font-semibold ${result.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                £{result.cashFlow.toFixed(0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Annual Cash Flow</span>
                              <span className={`font-semibold ${(result.cashFlow * 12) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                £{(result.cashFlow * 12).toLocaleString()}
                              </span>
                            </div>
                          </>
                        )}
                        
                        {result.model === 'brrr' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Equity Released</span>
                              <span className="font-semibold text-purple-600">£{(result.equityReleased || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Capital Recycle %</span>
                              <span className="font-semibold text-purple-600">{(result.recyclePercent || 0).toFixed(0)}%</span>
                            </div>
                          </>
                        )}
                        
                        {result.model === 'flip' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Flip Timeline</span>
                              <span className="font-semibold text-orange-600">{(result.timeHorizonMonths || 0) / 12} years</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Annualized ROI</span>
                              <span className="font-semibold text-orange-600">{((result.roi / ((result.timeHorizonMonths || 12) / 12)) || 0).toFixed(1)}%</span>
                            </div>
                          </>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Income after deductions ({result.timeHorizonMonths || 12} months)</span>
                          <span className="font-semibold">£{(result.rentReturnTotal || 0).toLocaleString()}</span>
                        </div>
                        
                        {result.model !== 'flip' && typeof result.grossYield === 'number' && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Gross Yield</span>
                            <span className="font-semibold">{result.grossYield.toFixed(1)}%</span>
                          </div>
                        )}
                        
                        {result.model !== 'flip' && typeof result.estGrowthPct === 'number' && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Estimated Growth</span>
                            <span className="font-semibold">{result.estGrowthPct.toFixed(1)}% / yr</span>
                          </div>
                        )}
                        
                        {typeof result.timeHorizonMonths === 'number' && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Timeframe</span>
                            <span className="font-semibold">{(result.timeHorizonMonths / 12).toFixed(0)} year{result.timeHorizonMonths >= 24 ? 's' : ''}</span>
                          </div>
                        )}
                        
                        {/* Model-specific summary metric */}
                        {result.model === 'brrr' ? (
                          <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2 border">
                            <span className="text-sm text-gray-700">Cash left in deal</span>
                            <span className="text-lg font-semibold">£{(result.cashLeftInDeal || 0).toLocaleString()}</span>
                          </div>
                        ) : result.model === 'flip' ? (
                          <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2 border">
                            <span className="text-sm text-gray-700">Total Profit</span>
                            <span className={`text-lg font-semibold ${(result.totalProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              £{(result.totalProfit || 0).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2 border">
                            <span className="text-sm text-gray-700">Total Profit</span>
                            <span className={`text-lg font-semibold ${(result.totalProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              £{(result.totalProfit || 0).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Key Financial Summary - Highlighted */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-3 text-center">KEY FINANCIAL SUMMARY</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-xs text-blue-600 font-medium mb-1">ESTIMATED COST NEEDED</div>
                            <div className="text-lg font-bold text-blue-900">£{(result.investedTotal || 0).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600 font-medium mb-1">RETURNS AFTER TERM</div>
                            <div className="text-lg font-bold text-green-700">£{(((result.rentReturnTotal || 0) + (result.projectedCapitalGain || 0))).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600 font-medium mb-1">NET POSITION</div>
                            <div className={`text-lg font-bold ${(result.totalProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              £{(result.totalProfit || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Investment & Returns Breakdown */}
                      <div className="grid md:grid-cols-2 gap-4 mb-2 text-sm">
                        <div className="bg-white/60 rounded-lg p-3 border">
                          <div className="font-medium text-gray-800 mb-2">Investment</div>
                          <div className="flex justify-between"><span className="text-gray-600">Deposit</span><span>£{(result.investedDeposit || 0).toLocaleString()}</span></div>
                          {typeof result.investedRefurb === 'number' && result.investedRefurb > 0 && (
                            <div className="flex justify-between"><span className="text-gray-600">Refurb</span><span>£{result.investedRefurb.toLocaleString()}</span></div>
                          )}
                          <div className="flex justify-between"><span className="text-gray-600">Stamp duty</span><span>£{(result.investedStampDuty || 0).toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Legal fees</span><span>£{(result.investedLegalFees || 0).toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Broker fees</span><span>£{(result.investedBrokerFees || 0).toLocaleString()}</span></div>
                          <div className="flex justify-between font-semibold mt-1 pt-1 border-t"><span>Total invested</span><span>£{(result.investedTotal || 0).toLocaleString()}</span></div>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3 border">
                          <div className="font-medium text-gray-800 mb-2">Returns</div>
                          <div className="flex justify-between"><span className="text-gray-600">Rent over {(result.timeHorizonMonths || 12) / 12} yr</span><span>£{(result.rentReturnTotal || 0).toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Value gain (projected)</span><span>£{(result.projectedCapitalGain || 0).toLocaleString()}</span></div>
                          <div className="flex justify-between font-medium mt-1"><span className="text-gray-700">Total returns</span><span>£{(((result.rentReturnTotal || 0) + (result.projectedCapitalGain || 0))).toLocaleString()}</span></div>
                          {result.model === 'brrr' && (
                            <div className="mt-3">
                              <div className="grid gap-1 text-xs text-gray-700 mb-3">
                                <div className="flex justify-between"><span>Equity released at refi</span><span>£{(result.equityReleased || 0).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Cash left in deal</span><span>£{(result.cashLeftInDeal || 0).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Recycle %</span><span>{(result.recyclePercent || 0).toFixed(0)}%</span></div>
                              </div>
                              <button
                                onClick={() => setShowBrrrDetailsModal(true)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors"
                              >
                                See details
                              </button>
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-600">Minus invested capital</div>
                          <div className="flex justify-between text-xs"><span className="text-gray-600">- Deposit</span><span>£{(result.investedDeposit || 0).toLocaleString()}</span></div>
                          {typeof result.investedRefurb === 'number' && result.investedRefurb > 0 && (
                            <div className="flex justify-between text-xs"><span className="text-gray-600">- Refurb</span><span>£{result.investedRefurb.toLocaleString()}</span></div>
                          )}
                          <div className="flex justify-between text-xs"><span className="text-gray-600">- Stamp duty</span><span>£{(result.investedStampDuty || 0).toLocaleString()}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-gray-600">- Legal fees</span><span>£{(result.investedLegalFees || 0).toLocaleString()}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-gray-600">- Broker fees</span><span>£{(result.investedBrokerFees || 0).toLocaleString()}</span></div>
                          <div className="flex justify-between font-semibold mt-2">
                            <span>{result.model === 'brrr' ? 'Cash left in deal' : 'Total profit'}</span>
                            <span>£{(result.model === 'brrr' ? (result.cashLeftInDeal || 0) : (result.totalProfit || 0)).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pros and Cons */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Pros</h4>
                          <ul className="space-y-1">
                            {result.pros.map((pro, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                <CheckCircle className="w-3 h-3 text-green-700 mt-0.5 flex-shrink-0" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Cons</h4>
                          <ul className="space-y-1">
                            {result.cons.map((con, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BRRR Details Modal */}
      {showBrrrDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowBrrrDetailsModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">BRRR Strategy Details</h2>
              </div>
              <button
                onClick={() => setShowBrrrDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {results.find(r => r.model === 'brrr') && (() => {
                const result = results.find(r => r.model === 'brrr')!;
                return (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="text-sm text-purple-600 font-medium">Equity Released</div>
                        <div className="text-2xl font-bold text-purple-900">£{(result.equityReleased || 0).toLocaleString()}</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm text-blue-600 font-medium">Cash Left in Deal</div>
                        <div className="text-2xl font-bold text-blue-900">£{(result.cashLeftInDeal || 0).toLocaleString()}</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm text-green-600 font-medium">Recycle %</div>
                        <div className="text-2xl font-bold text-green-900">{(result.recyclePercent || 0).toFixed(0)}%</div>
                      </div>
                    </div>

                    {/* BRRR Insights */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">BRRR Strategy Insights</h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600">Break-even rent</span>
                            <span className="font-medium">£{(result.breakEvenRent || 0).toLocaleString()}/month</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600">Your estimated ARV</span>
                            <span className="font-medium">£{inputs.estimatedRenovatedValue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Target purchase price</span>
                            <span className="font-medium">£{(result.recommendedPurchasePrice || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600">BMV guide (10%)</span>
                            <span className="font-medium">£{(inputs.marketValue ? inputs.marketValue * 0.9 : 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600">BMV guide (15%)</span>
                            <span className="font-medium">£{(inputs.marketValue ? inputs.marketValue * 0.85 : 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">BMV guide (20%)</span>
                            <span className="font-medium">£{(inputs.marketValue ? inputs.marketValue * 0.80 : 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Explanation Section */}
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">What These Numbers Mean:</h4>
                        <div className="text-xs text-blue-800 space-y-1">
                          <p><strong>Break-even rent:</strong> The minimum monthly rent needed to cover all costs (mortgage + expenses)</p>
                          <p><strong>Recommended ARV:</strong> The target property value after refurbishment and market growth</p>
                          <p><strong>Target purchase price:</strong> What you should aim to buy for to achieve optimal returns</p>
                          <p><strong>BMV guides:</strong> Below Market Value targets - aim for 10-20% discount for best BRRR returns</p>
                        </div>
                      </div>
                    </div>

                    {/* Scenario Ladder */}
                    {Array.isArray(result.scenarios) && result.scenarios.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Scenario Analysis</h3>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Discount</th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Buy</th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Refurb</th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">ARV</th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Equity Released</th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Cash Left</th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Recycle %</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {result.scenarios.map((s, i) => (
                                  <tr key={i} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{s.label}</td>
                                    <td className="py-3 px-4 text-sm text-right text-gray-900">{formatCurrency(s.purchasePrice)}</td>
                                    <td className="py-3 px-4 text-sm text-right text-gray-900">{formatCurrency(s.refurbCost)}</td>
                                    <td className="py-3 px-4 text-sm text-right text-gray-900">{formatCurrency(s.arv)}</td>
                                    <td className="py-3 px-4 text-sm text-right text-gray-900">{formatCurrency(s.equityReleased)}</td>
                                    <td className="py-3 px-4 text-sm text-right text-gray-900">{formatCurrency(s.cashLeftInDeal)}</td>
                                    <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">{Math.round(s.recyclePercent)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Strategy Guidance */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">Strategy Guidance</h3>
                      <div className="text-sm text-blue-800 space-y-2">
                        <p>• Target properties at 10-20% below market value for optimal BRRR returns</p>
                        <p>• Ensure refurbishment adds at least 80% of cost to property value</p>
                        <p>• Plan for 6-12 months between purchase and refinance</p>
                        <p>• Maintain good credit score for favorable refinance terms</p>
                      </div>
                    </div>

                    {/* What You Should Offer */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900 mb-3">What You Should Offer</h3>
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <h4 className="font-medium text-green-900 mb-2">🎯 Ideal Purchase Price</h4>
                          <div className="text-2xl font-bold text-green-700 mb-2">
                            £{(inputs.marketValue ? inputs.marketValue * 0.85 : 0).toLocaleString()}
                          </div>
                          <p className="text-sm text-green-800">Aim for 15% below market value for optimal returns</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <h4 className="font-medium text-green-900 mb-2">💰 Maximum Offer</h4>
                          <div className="text-2xl font-bold text-green-700 mb-2">
                            £{(inputs.marketValue ? inputs.marketValue * 0.9 : 0).toLocaleString()}
                          </div>
                          <p className="text-sm text-green-800">Don't pay more than 10% below market value</p>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <h4 className="font-medium text-green-900 mb-2">📈 Your Estimated Renovated Value</h4>
                          <div className="text-2xl font-bold text-green-700 mb-2">
                            £{inputs.estimatedRenovatedValue.toLocaleString()}
                          </div>
                          <p className="text-sm text-green-800">Your estimate of what the property will be worth after refurbishment</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-900 mb-2">💡 Negotiation Tips</h4>
                        <div className="text-xs text-yellow-800 space-y-1">
                          <p>• Start your offer at 20% below market value and negotiate up</p>
                          <p>• Highlight any issues that justify the discount (damp, outdated kitchen, etc.)</p>
                          <p>• Be prepared to walk away if the seller won't meet your target price</p>
                          <p>• Consider offering a quick completion to sweeten the deal</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
