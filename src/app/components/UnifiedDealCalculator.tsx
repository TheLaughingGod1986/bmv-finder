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
  Check
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


  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [recommendedModel, setRecommendedModel] = useState<'vanilla' | 'brrr' | 'flip' | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    financial: false,
    refurbishment: false,
    fees: false
  });
  const [includeRefurb, setIncludeRefurb] = useState<boolean>(true);
  const [sdltOverride, setSdltOverride] = useState<boolean>(false);

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
    const deposit = inputs.purchasePrice * (inputs.depositPct / 100);
    const mortgage = inputs.purchasePrice - deposit;
    const monthlyMortgage = (mortgage * (inputs.interestRate / 100)) / 12;
    const monthlyCashFlow = inputs.monthlyRent - monthlyMortgage - inputs.otherExpenses;
    const annualCashFlow = monthlyCashFlow * 12;
    const roi = (annualCashFlow / (deposit + inputs.stampDuty + inputs.legalFees + inputs.brokerFees)) * 100;
    const grossYield = inputs.monthlyRent > 0 ? (inputs.monthlyRent * 12) / inputs.purchasePrice * 100 : 0;
    const estGrowthPct = 3.0; // baseline assumption used elsewhere
    const years = Math.max(1, inputs.timelineMonths / 12);
    const investedFees = inputs.legalFees + inputs.brokerFees;
    const investedTotal = deposit + investedFees + inputs.stampDuty + (includeRefurb ? inputs.refurbCost : 0);
    const rentReturnTotal = Math.round(monthlyCashFlow * inputs.timelineMonths);
    const projectedValue = inputs.purchasePrice * Math.pow(1 + estGrowthPct / 100, years);
    const projectedCapitalGain = Math.round(Math.max(0, projectedValue - inputs.purchasePrice));
    const totalProfit = rentReturnTotal + projectedCapitalGain - investedTotal;
    
    return {
      model: 'vanilla',
      roi: Math.max(0, roi),
      cashFlow: monthlyCashFlow,
      totalReturn: totalProfit,
      grossYield,
      estGrowthPct,
      timeHorizonMonths: inputs.timelineMonths,
      investedDeposit: deposit,
      investedRefurb: includeRefurb ? inputs.refurbCost : 0,
      investedFeesTotal: investedFees,
      investedStampDuty: inputs.stampDuty,
      investedLegalFees: inputs.legalFees,
      investedBrokerFees: inputs.brokerFees,
      investedTotal,
      rentReturnTotal,
      projectedCapitalGain,
      totalProfit,
      risk: roi > 8 ? 'low' : roi > 5 ? 'medium' : 'high',
      recommendation: 'Buy and hold for rental income',
      pros: [
        'Steady monthly cash flow',
        'Long-term appreciation potential',
        'Lower risk than flipping',
        'Tax advantages available'
      ],
      cons: [
        'Requires ongoing management',
        'Market dependent for appreciation',
        'Illiquid investment'
      ]
    };
  };

  const calculateBRRR = (inputs: DealInputs): AnalysisResult => {
    const totalInvestment = inputs.purchasePrice * (inputs.depositPct / 100) + 
                           inputs.stampDuty + inputs.legalFees + inputs.brokerFees + (includeRefurb ? inputs.refurbCost : 0);
    
    // Assume 80% value add from refurb
    const uplift = (includeRefurb ? inputs.refurbCost : 0) * (inputs.refurbUpliftFactor ?? 0.8);
    const postRefurbValue = inputs.purchasePrice + uplift;
    const growthPct = (inputs.growthAnnualPct ?? 3) / 100;
    const projectedValue = postRefurbValue * Math.pow(1 + growthPct, inputs.timelineMonths / 12);
    
    const remortgageAmount = projectedValue * (inputs.remortgageLtv / 100);
    const equityReleased = remortgageAmount - (inputs.purchasePrice - (inputs.purchasePrice * (inputs.depositPct / 100)));
    const cashLeftInDeal = totalInvestment - equityReleased;
    
    const roi = (equityReleased / totalInvestment) * 100;
    
    const deposit = inputs.purchasePrice * (inputs.depositPct / 100);
    const mortgage = inputs.purchasePrice - deposit;
    const day1Monthly = (mortgage * (inputs.interestRate / 100)) / 12;
    const bridgeMonthly = (mortgage * ((inputs.bridgeRate ?? 8) / 100)) / 12;
    const monthsOnBridge = inputs.financeMode === 'bridge_refi' ? Math.min(inputs.bridgeMonths ?? 6, inputs.timelineMonths) : 0;
    const monthsOnDay1 = (inputs.timelineMonths - monthsOnBridge);
    const monthlyMortgage = monthsOnBridge > 0 
      ? ((bridgeMonthly * monthsOnBridge) + (day1Monthly * monthsOnDay1)) / (inputs.timelineMonths || 1)
      : day1Monthly;
    const monthlyCashFlow = inputs.monthlyRent - monthlyMortgage - inputs.otherExpenses;
    const investedFees = inputs.legalFees + inputs.brokerFees;
    const investedTotal = deposit + investedFees + inputs.stampDuty + (includeRefurb ? inputs.refurbCost : 0);
    const years = Math.max(1, inputs.timelineMonths / 12);
    const rentReturnTotal = Math.round(monthlyCashFlow * inputs.timelineMonths);
    const projectedCapitalGain = Math.max(0, projectedValue - inputs.purchasePrice);
    const totalProfit = equityReleased + rentReturnTotal - investedTotal;

    // BRRR insights
    const recyclePercent = investedTotal > 0 ? (equityReleased / investedTotal) * 100 : 0;
    const breakEvenRent = Math.ceil(monthlyMortgage + inputs.otherExpenses);
    // Simple guidance: target purchase price that would leave ~£0 cash in deal
    const targetArvForZeroCashIn = (investedTotal + (inputs.purchasePrice - (inputs.purchasePrice * (inputs.depositPct / 100)))) / (inputs.remortgageLtv / 100);
    const recommendedArv = Math.max(projectedValue, targetArvForZeroCashIn);
    const recommendedPurchasePrice = Math.max(0, recommendedArv - (includeRefurb ? inputs.refurbCost * (inputs.refurbUpliftFactor ?? 0.8) : 0));

    // BMV guidance ladder given market value
    const mv = inputs.marketValue ?? inputs.currentValue ?? inputs.purchasePrice;
    const bmv10 = mv * 0.9;
    const bmv15 = mv * 0.85;
    const bmv20 = mv * 0.8;
    const buildScenario = (label: string, purchasePrice: number, refurbCost: number) => {
      const dep = purchasePrice * (inputs.depositPct / 100);
      const mort = purchasePrice - dep;
      const mMonthly = (mort * (inputs.interestRate / 100)) / 12;
      const cfMonthly = inputs.monthlyRent - mMonthly - inputs.otherExpenses;
      const upfront = dep + inputs.stampDuty + inputs.legalFees + inputs.brokerFees + refurbCost;
      const upl = refurbCost * (inputs.refurbUpliftFactor ?? 0.8);
      const arv = (purchasePrice + upl) * Math.pow(1 + (inputs.growthAnnualPct ?? 3)/100, inputs.timelineMonths/12);
      const refi = arv * (inputs.remortgageLtv / 100);
      const equity = refi - (purchasePrice - dep);
      const cashLeft = Math.max(0, upfront - equity);
      const recycle = upfront > 0 ? (equity / upfront) * 100 : 0;
      const profit = equity + Math.round(cfMonthly * inputs.timelineMonths) - upfront;
      return { label, purchasePrice, refurbCost, arv, equityReleased: equity, cashLeftInDeal: cashLeft, recyclePercent: recycle, totalProfit: profit };
    };
    const scenarios = [
      buildScenario('MV-10%', bmv10, includeRefurb ? inputs.refurbCost : 0),
      buildScenario('MV-15%', bmv15, includeRefurb ? inputs.refurbCost : 0),
      buildScenario('MV-20%', bmv20, includeRefurb ? inputs.refurbCost : 0)
    ];

    return {
      model: 'brrr',
      roi: Math.max(0, roi),
      cashFlow: 0, // No cash flow during BRRR cycle
      totalReturn: totalProfit,
      grossYield: inputs.monthlyRent > 0 ? (inputs.monthlyRent * 12) / (inputs.purchasePrice + (includeRefurb ? inputs.refurbCost : 0)) * 100 : 0,
      estGrowthPct: 5.1, // assumption used in UI copy
      timeHorizonMonths: inputs.timelineMonths,
      investedDeposit: deposit,
      investedRefurb: includeRefurb ? inputs.refurbCost : 0,
      investedFeesTotal: investedFees,
      investedStampDuty: inputs.stampDuty,
      investedLegalFees: inputs.legalFees,
      investedBrokerFees: inputs.brokerFees,
      investedTotal,
      rentReturnTotal,
      projectedCapitalGain,
      totalProfit,
      equityReleased,
      cashLeftInDeal,
      recyclePercent,
      breakEvenRent,
      recommendedPurchasePrice,
      recommendedArv,
      scenarios,
      risk: cashLeftInDeal / totalInvestment < 0.3 ? 'low' : cashLeftInDeal / totalInvestment < 0.45 ? 'medium' : 'high',
      recommendation: 'Refinance to release equity and repeat',
      pros: [
        'Recycle capital for next deal',
        'Scale portfolio faster',
        'Tax efficient structure',
        'Lower ongoing cash requirements'
      ],
      cons: [
        'Higher upfront costs',
        'Refinancing risk',
        'More complex strategy',
        'Requires good credit'
      ]
    };
  };

  const calculateFlip = (inputs: DealInputs): AnalysisResult => {
    const totalInvestment = inputs.purchasePrice * (inputs.depositPct / 100) + 
                           inputs.stampDuty + inputs.legalFees + inputs.brokerFees + (includeRefurb ? inputs.refurbCost : 0);
    
    const postRefurbValue = inputs.purchasePrice + ((includeRefurb ? inputs.refurbCost : 0) * 0.8);
    const sellingPrice = postRefurbValue * 1.05; // 5% profit margin
    const netProfit = sellingPrice - inputs.purchasePrice - (includeRefurb ? inputs.refurbCost : 0) - inputs.sellingCosts;
    
    const roi = (netProfit / totalInvestment) * 100;
    const annualizedRoi = roi * (12 / inputs.flipTimeline);
    
    const deposit = inputs.purchasePrice * (inputs.depositPct / 100);
    const investedFees = inputs.legalFees + inputs.brokerFees;
    const investedTotal = deposit + investedFees + inputs.stampDuty + (includeRefurb ? inputs.refurbCost : 0);
    const years = Math.max(1, Math.round(inputs.flipTimeline / 12));
    const rentReturnTotal = 0;
    const projectedCapitalGain = Math.max(0, sellingPrice - inputs.purchasePrice);
    const totalProfit = netProfit - investedTotal;

    return {
      model: 'flip',
      roi: Math.max(0, annualizedRoi),
      cashFlow: -totalInvestment / inputs.flipTimeline, // Negative during flip
      totalReturn: totalProfit,
      grossYield: inputs.monthlyRent > 0 ? (inputs.monthlyRent * 12) / (inputs.purchasePrice + (includeRefurb ? inputs.refurbCost : 0)) * 100 : 0,
      estGrowthPct: 3.0,
      timeHorizonMonths: inputs.timelineMonths,
      investedDeposit: deposit,
      investedRefurb: includeRefurb ? inputs.refurbCost : 0,
      investedFeesTotal: investedFees,
      investedStampDuty: inputs.stampDuty,
      investedLegalFees: inputs.legalFees,
      investedBrokerFees: inputs.brokerFees,
      investedTotal,
      rentReturnTotal,
      projectedCapitalGain,
      totalProfit,
      risk: roi > 20 ? 'low' : roi > 10 ? 'medium' : 'high',
      recommendation: 'Quick renovation and resale',
      pros: [
        'Fastest capital return',
        'No ongoing management',
        'High potential returns',
        'Clear exit strategy'
      ],
      cons: [
        'Higher risk',
        'Market timing critical',
        'Requires renovation skills',
        'Tax implications on sale'
      ]
    };
  };

  const determineRecommendedModel = (results: AnalysisResult[], inputs: DealInputs): 'vanilla' | 'brrr' | 'flip' => {
    // Simple recommendation logic based on deal characteristics
    const hasRefurb = inputs.refurbCost > 0;
    const isHighValue = inputs.purchasePrice > 400000;
    const hasGoodRent = inputs.monthlyRent > inputs.purchasePrice * 0.005; // 6% gross yield
    
    if (hasRefurb && !isHighValue && inputs.monthlyRent > 0) {
      return 'brrr';
    } else if (hasRefurb && !hasGoodRent) {
      return 'flip';
    } else {
      return 'vanilla';
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

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Input Form */}
      <div className="space-y-6">
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

          {/* Property Size Fields */}
          <div className="grid gap-4 mt-4">
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

          {/* Recent Sales Section */}
          {recentSales.length > 0 && (
            <div className="mt-4">
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
                  className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white"
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
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced assumptions</h3>
          
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
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mortgage details</h3>
          
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
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deposit</h3>
          
          <div className="grid gap-4">
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
        </div>



        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Refurbishment scope</h3>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={includeRefurb}
                onChange={(e) => setIncludeRefurb(e.target.checked)}
              />
              Include refurb in analysis
            </label>
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
                Costs are calculated from the selected scope, adjusted for bedrooms & square footage, then contingency is applied. 
                For a 5-bed house, costs will be ~67% higher than a 3-bed before contingency. 
                These are estimates based on UK market averages - actual costs vary by location and condition.
              </p>
            </div>
          </div>
          )}
        </div>

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
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fees</h3>
          
          <div className="grid gap-4">
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
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Remortgage</h3>
          
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <label className={fieldLabel}>Remortgage LTV (%)</label>
                <select className={fieldSelect}>
                  <option value={75}>75% (typical)</option>
                  <option value={80}>80%</option>
                  <option value={85}>85%</option>
                </select>
              </div>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-800">Advanced</a>
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
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
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
        </div>
      </div>

      {/* Results Sidebar */}
      <div className="space-y-6">
        {/* Recommended Model */}
        {recommendedModel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-semibold">Recommended Strategy</h3>
                <p className="text-blue-100">Based on your deal characteristics</p>
              </div>
            </div>
            
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                {getModelIcon(recommendedModel)}
                <span className="font-semibold capitalize">{recommendedModel.toUpperCase()}</span>
              </div>
              <p className="text-sm text-blue-100">
                {results.find(r => r.model === recommendedModel)?.recommendation}
              </p>
            </div>
          </motion.div>
        )}

        {/* Analysis Models */}
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {getModelIcon(result.model)}
                <h3 className="font-semibold capitalize">{result.model.toUpperCase()}</h3>
                {result.model === recommendedModel && (
                  <Award className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(result.risk)}`}>
                {result.risk} risk
              </span>
            </div>

            <div className="grid gap-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">ROI</span>
                <span className="font-semibold">{result.roi.toFixed(1)}%</span>
              </div>
              {result.model !== 'brrr' && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Cash Flow</span>
                  <span className="font-semibold">£{result.cashFlow.toFixed(0)}</span>
                </div>
              )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Income after deductions ({result.timeHorizonMonths || 12} months)</span>
                  <span className="font-semibold">£{(result.rentReturnTotal || 0).toLocaleString()}</span>
                </div>
                {result.model !== 'brrr' && typeof result.grossYield === 'number' && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Gross Yield</span>
                    <span className="font-semibold">{result.grossYield.toFixed(1)}%</span>
                  </div>
                )}
                {result.model !== 'brrr' && typeof result.estGrowthPct === 'number' && (
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
              {result.model === 'brrr' ? (
                <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2 border">
                  <span className="text-sm text-gray-700">Cash left in deal</span>
                  <span className="text-lg font-semibold">£{(result.cashLeftInDeal || 0).toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2 border">
                  <span className="text-sm text-gray-700">Total Profit</span>
                  <span className={`text-lg font-semibold ${((result.totalProfit ?? result.totalReturn) || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>£{result.totalReturn.toLocaleString()}</span>
                </div>
              )}
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
                    <div className="mt-3 grid gap-1 text-xs text-gray-700">
                      <div className="flex justify-between"><span>Equity released at refi</span><span>£{(result.equityReleased || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Cash left in deal</span><span>£{(result.cashLeftInDeal || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Recycle %</span><span>{(result.recyclePercent || 0).toFixed(0)}%</span></div>
                      <div className="flex justify-between"><span>Break-even rent</span><span>£{(result.breakEvenRent || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Recommended ARV</span><span>£{(result.recommendedArv || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Target purchase (guidance)</span><span>£{(result.recommendedPurchasePrice || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>BMV guide (10%)</span><span>£{(inputs.marketValue ? inputs.marketValue * 0.9 : 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>BMV guide (15%)</span><span>£{(inputs.marketValue ? inputs.marketValue * 0.85 : 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>BMV guide (20%)</span><span>£{(inputs.marketValue ? inputs.marketValue * 0.80 : 0).toLocaleString()}</span></div>
                      {Array.isArray(result.scenarios) && result.scenarios.length > 0 && (
                        <div className="mt-2">
                          <div className="font-medium text-gray-800 mb-2">Scenario ladder</div>
                          <div className="overflow-auto">
                            <table className="w-full text-xs">
                              <thead className="text-gray-500">
                                <tr>
                                  <th className="text-left py-1 pr-2">Discount</th>
                                  <th className="text-right py-1 pr-2">Buy</th>
                                  <th className="text-right py-1 pr-2">Refurb</th>
                                  <th className="text-right py-1 pr-2">ARV</th>
                                  <th className="text-right py-1 pr-2">Equity rel.</th>
                                  <th className="text-right py-1 pr-2">Cash left</th>
                                  <th className="text-right py-1">Recycle %</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {result.scenarios.map((s, i) => (
                                  <tr key={i} className={i % 2 ? 'bg-gray-50' : ''}>
                                    <td className="py-1 pr-2">{s.label}</td>
                                    <td className="py-1 pr-2 text-right">{formatCurrency(s.purchasePrice)}</td>
                                    <td className="py-1 pr-2 text-right">{formatCurrency(s.refurbCost)}</td>
                                    <td className="py-1 pr-2 text-right">{formatCurrency(s.arv)}</td>
                                    <td className="py-1 pr-2 text-right">{formatCurrency(s.equityReleased)}</td>
                                    <td className="py-1 pr-2 text-right">{formatCurrency(s.cashLeftInDeal)}</td>
                                    <td className="py-1 text-right">{Math.round(s.recyclePercent)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}
