export interface CalcInput {
  purchasePrice: number; // Agreed price
  discountPct?: number; // Optional BMV discount % against market
  depositPct: number; // e.g., 25
  refurbCost: number;
  stampDuty: number;
  legalFees: number;
  brokerFees: number;
  annualHpiPct: number; // Region growth % annualized
  timelineMonths: number; // e.g., 24
  remortgageLtv: number; // e.g., 75
  adjustForInflation?: boolean; // If true, adjust outputs by CPI
  cpiAnnualPct?: number; // default 3
  // Optional value-add inputs
  refurbUpliftPct?: number; // Percentage uplift applied immediately after refurb
  refurbUpliftAmount?: number; // Absolute uplift amount applied immediately
  currentMortgageBalance?: number; // If provided, override outstanding balance at refinance
}

export interface CalcOutput {
  projectedValue: number; // Future value after growth
  purchaseMarketValue?: number; // Implied MV at purchase (accounting for discount)
  postRefurbValue?: number; // Value immediately after refurb uplift
  inflationAdjustedValue?: number; // If CPI applied
  // Performance metrics
  grossYieldPct?: number; // annual rent / purchase price
  roiPct?: number; // (annual net rent + appreciation) / total initial investment
  appreciationGain?: number; // projectedValue - purchaseMarketValue
  // Real (inflation-adjusted) equivalents, if adjustForInflation is true
  realProjectedValue?: number;
  realRemortgageAmount?: number;
  realEquityReleased?: number;
  realCashLeftInDeal?: number;
  initialDeposit: number;
  initialMortgage: number; // Purchase price - deposit (ignoring fees)
  totalInitialInvestment: number; // deposit + fees + refurb + stamp
  remortgageAmount: number; // projected * LTV
  currentMortgageOutstanding: number; // outstanding at refinance
  equityReleased: number; // remortgage - current mortgage - remortgage fees (simplified)
  equityReleasedPctOfInitial: number; // equity / totalInitialInvestment
  cashLeftInDeal: number; // totalInitialInvestment - equityReleased
  percentInitialLeft: number; // cashLeftInDeal / totalInitialInvestment
}

// Compound growth helper: FV = PV * (1 + r)^(t)
function compound(present: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 100;
  const years = months / 12;
  return present * Math.pow(1 + r, years);
}

export function calculateEquityRelease(input: CalcInput): CalcOutput {
  const {
    purchasePrice,
    discountPct = 0,
    depositPct,
    refurbCost,
    stampDuty,
    legalFees,
    brokerFees,
    annualHpiPct,
    timelineMonths,
    remortgageLtv,
    adjustForInflation = false,
    cpiAnnualPct = 3,
    refurbUpliftPct,
    refurbUpliftAmount,
    currentMortgageBalance,
  } = input;

  // If discount provided, treat as evidence of market value uplift at purchase
  // Market Value at purchase = purchasePrice / (1 - discountPct)
  const purchaseMarketValue = discountPct > 0 ? purchasePrice / (1 - discountPct / 100) : purchasePrice;

  // Apply value uplift from refurbishment (immediate increase)
  const upliftFromPct = typeof refurbUpliftPct === 'number' ? purchaseMarketValue * (refurbUpliftPct / 100) : 0;
  const upliftFromAmount = typeof refurbUpliftAmount === 'number' ? refurbUpliftAmount : 0;
  const valueAfterRefurb = purchaseMarketValue + Math.max(0, upliftFromPct + upliftFromAmount);

  // Projected value in future using HPI compound growth on the post-refurb value
  const projectedValueNominal = compound(valueAfterRefurb, annualHpiPct, timelineMonths);
  const appreciationGain = Math.max(0, projectedValueNominal - purchaseMarketValue);

  // Initial deposit and mortgage (ignoring fees in LTV for standard completion)
  const initialDeposit = (depositPct / 100) * purchasePrice;
  const initialMortgage = purchasePrice - initialDeposit;

  // Total initial cash invested = deposit + refurb + stamp + all fees
  const totalInitialInvestment = initialDeposit + refurbCost + stampDuty + legalFees + brokerFees;

  // Remortgage amount based on projected value and LTV
  const remortgageAmount = (remortgageLtv / 100) * projectedValueNominal;

  // Assume interest-only during the period, so outstanding approx equals initial mortgage
  const currentMortgageOutstanding = typeof currentMortgageBalance === 'number' && currentMortgageBalance >= 0
    ? currentMortgageBalance
    : initialMortgage;

  // Remortgage fees – simplified placeholders (valuation, legals, product)
  const remortgageFees = 1500; // Flat placeholder

  // Equity released is what you can draw after clearing old mortgage and paying remortgage fees
  const equityReleased = Math.max(0, remortgageAmount - currentMortgageOutstanding - remortgageFees);

  const equityReleasedPctOfInitial = totalInitialInvestment > 0 ? equityReleased / totalInitialInvestment : 0;
  const cashLeftInDeal = Math.max(0, totalInitialInvestment - equityReleased);
  const percentInitialLeft = totalInitialInvestment > 0 ? cashLeftInDeal / totalInitialInvestment : 1;

  // Optional inflation adjustment on projected value only (informative)
  const inflationAdjustedValue = adjustForInflation
    ? compound(projectedValueNominal, -cpiAnnualPct, timelineMonths)
    : undefined;

  // If inflation-adjusted analysis requested, also compute real-terms funding metrics
  let realProjectedValue: number | undefined;
  let realRemortgageAmount: number | undefined;
  let realEquityReleased: number | undefined;
  let realCashLeftInDeal: number | undefined;
  if (adjustForInflation && typeof inflationAdjustedValue === 'number') {
    realProjectedValue = inflationAdjustedValue;
    realRemortgageAmount = (remortgageLtv / 100) * realProjectedValue;
    // Deflate outstanding mortgage to present value to compare in real terms
    const deflator = compound(1, -cpiAnnualPct, timelineMonths);
    const realOutstanding = currentMortgageOutstanding * deflator;
    realEquityReleased = Math.max(0, realRemortgageAmount - realOutstanding - remortgageFees);
    realCashLeftInDeal = Math.max(0, totalInitialInvestment - realEquityReleased);
  }

  return {
    projectedValue: projectedValueNominal,
    purchaseMarketValue,
    postRefurbValue: valueAfterRefurb,
    inflationAdjustedValue,
    realProjectedValue,
    appreciationGain,
    initialDeposit,
    initialMortgage,
    totalInitialInvestment,
    remortgageAmount,
    currentMortgageOutstanding,
    equityReleased,
    equityReleasedPctOfInitial,
    cashLeftInDeal,
    percentInitialLeft,
    realRemortgageAmount,
    realEquityReleased,
    realCashLeftInDeal,
  };
}


