import { NextRequest, NextResponse } from 'next/server';
import { getRegionFromPostcode } from '@/lib/getRegionFromPostcode';
import { fetchGrowthData } from '@/lib/fetchGrowthData';
import { calculateEquityRelease } from '@/lib/calculateEquityRelease';
import { computeStampDuty, PurchaseType } from '@/lib/stampDuty';
import { fetchLocationInflation } from '@/lib/fetchInflation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      postcode,
      purchasePrice,
      discountPct,
      depositPct = 25,
      refurbCost = 0,
      stampDuty,
      legalFees = 0,
      brokerFees = 0,
      remortgageLtv = 75,
      timelineMonths = 24,
      adjustForInflation = false,
      purchaseType = 'ltd',
      refurbUpliftPct,
      refurbUpliftAmount,
      currentMortgageBalance,
    } = body || {};

    if (!postcode || !purchasePrice || !depositPct || !remortgageLtv) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1) Resolve region from postcode
    const regionInfo = await getRegionFromPostcode(postcode);

    // 2) Fetch growth data (mocked fallback inside util)
    const growth = await fetchGrowthData(regionInfo.region);

    // 3) Stamp duty: override if supplied, else compute based on purchase type
    // Treat 'second_home' and 'ltd' identically; include 'first_time' as its own case
    let normalizedType: PurchaseType = purchaseType as PurchaseType;
    if (normalizedType === 'ltd') normalizedType = 'second_home';
    const stamp = typeof stampDuty === 'number' ? stampDuty : computeStampDuty(Number(purchasePrice), normalizedType);

    // 4) Core calculation
    // Location-aware CPI (mocked via ONS proxy). If adjustForInflation true, override CPI rate
    const cpiInfo = await fetchLocationInflation(postcode);

    const calc = calculateEquityRelease({
      purchasePrice: Number(purchasePrice),
      discountPct: typeof discountPct === 'number' ? Number(discountPct) : undefined,
      depositPct: Number(depositPct),
      refurbCost: Number(refurbCost),
      stampDuty: Number(stamp),
      legalFees: Number(legalFees),
      brokerFees: Number(brokerFees),
      annualHpiPct: Number(growth.annualHpiPct),
      timelineMonths: Number(timelineMonths),
      remortgageLtv: Number(remortgageLtv),
      adjustForInflation: Boolean(adjustForInflation),
      cpiAnnualPct: cpiInfo.cpiAnnualPct,
      refurbUpliftPct: typeof refurbUpliftPct === 'number' ? Number(refurbUpliftPct) : undefined,
      refurbUpliftAmount: typeof refurbUpliftAmount === 'number' ? Number(refurbUpliftAmount) : undefined,
      currentMortgageBalance: typeof currentMortgageBalance === 'number' ? Number(currentMortgageBalance) : undefined,
    });

    return NextResponse.json({
      input: {
        postcode,
        region: regionInfo.region,
        purchasePrice: Number(purchasePrice),
        discountPct: typeof discountPct === 'number' ? Number(discountPct) : undefined,
        depositPct: Number(depositPct),
        refurbCost: Number(refurbCost),
        stampDuty: Number(stamp),
        legalFees: Number(legalFees),
        brokerFees: Number(brokerFees),
        remortgageLtv: Number(remortgageLtv),
        timelineMonths: Number(timelineMonths),
        adjustForInflation: Boolean(adjustForInflation),
        purchaseType: normalizedType,
      },
      projections: {
        compoundHpiAnnualPct: growth.annualHpiPct,
        projectedValue: calc.projectedValue,
        inflationAdjustedValue: calc.inflationAdjustedValue,
        appreciationGain: calc.appreciationGain,
      },
      funding: {
        initialDeposit: calc.initialDeposit,
        initialMortgage: calc.initialMortgage,
        totalInitialInvestment: calc.totalInitialInvestment,
        remortgageAmount: calc.remortgageAmount,
        currentMortgageOutstanding: calc.currentMortgageOutstanding,
        equityReleased: calc.equityReleased,
        equityReleasedPctOfInitial: calc.equityReleasedPctOfInitial,
        cashLeftInDeal: calc.cashLeftInDeal,
        percentInitialLeft: calc.percentInitialLeft,
      },
      inflation: { rate: cpiInfo.cpiAnnualPct, source: cpiInfo.source },
    });
  } catch (error) {
    console.error('[btl-calc] error', error);
    return NextResponse.json({ error: 'Failed to calculate' }, { status: 500 });
  }
}

// No local estimator anymore; using computeStampDuty util.


