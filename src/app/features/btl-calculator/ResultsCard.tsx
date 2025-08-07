export type BtlResults = {
  input: {
    postcode: string;
    region: string;
    purchasePrice: number;
    discountPct?: number;
    depositPct: number;
    refurbCost: number;
    stampDuty: number;
    legalFees: number;
    brokerFees: number;
    remortgageLtv: number;
    timelineMonths: number;
    adjustForInflation: boolean;
  };
  projections: {
    compoundHpiAnnualPct: number; // Annual HPI used
    projectedValue: number; // After timeline
    inflationAdjustedValue?: number;
    appreciationGain?: number;
    realProjectedValue?: number;
  };
  funding: {
    initialDeposit: number;
    initialMortgage: number;
    totalInitialInvestment: number; // deposit + fees + refurb + stamp
    remortgageAmount: number;
    currentMortgageOutstanding: number; // approximated as initialMortgage (interest-only assumption)
    equityReleased: number;
    equityReleasedPctOfInitial: number; // equityReleased / totalInitialInvestment
    cashLeftInDeal: number; // totalInitialInvestment - equityReleased
    percentInitialLeft?: number;
  };
  inflation?: { rate: number; source?: string };
};

function Money({ value }: { value: number }) {
  return <span>£{Math.round(value).toLocaleString()}</span>;
}

export default function ResultsCard({ results }: { results: BtlResults }) {
  const r = results;
  const percentLeft = typeof r.funding.percentInitialLeft === 'number'
    ? r.funding.percentInitialLeft
    : (r.funding.cashLeftInDeal > 0 && r.funding.totalInitialInvestment > 0)
      ? r.funding.cashLeftInDeal / r.funding.totalInitialInvestment
      : 0;

  const brrr = (() => {
    if (percentLeft <= 0.3) return { label: 'BRRR-friendly', color: 'bg-green-500', text: 'text-green-700' };
    if (percentLeft <= 0.45) return { label: 'Borderline', color: 'bg-yellow-500', text: 'text-yellow-700' };
    return { label: 'Weak for BRRR', color: 'bg-red-500', text: 'text-red-700' };
  })();
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4">
        <div className="text-sm text-gray-500">Region</div>
        <div className="text-lg font-semibold">{r.input.region} • {r.input.postcode.toUpperCase()}</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-gray-100 p-3">
          <div className="text-xs uppercase text-gray-500">Initial investment</div>
          <div className="mt-1 text-xl font-semibold"><Money value={r.funding.totalInitialInvestment} /></div>
          <div className="mt-1 text-xs text-gray-500">
            Deposit <Money value={r.funding.initialDeposit} /> • Stamp <Money value={r.input.stampDuty} /> • Fees <Money value={r.input.legalFees + r.input.brokerFees} /> • Refurb <Money value={r.input.refurbCost} />
          </div>
        </div>
        <div className="rounded-md border border-gray-100 p-3">
          <div className="text-xs uppercase text-gray-500">Projected value ({r.input.timelineMonths}m)</div>
          <div className="mt-1 text-xl font-semibold"><Money value={r.projections.projectedValue} /></div>
          <div className="mt-1 text-xs text-gray-500">Annual HPI {r.projections.compoundHpiAnnualPct.toFixed(1)}%</div>
          {typeof r.projections.appreciationGain === 'number' && (
            <div className="mt-1 text-xs text-gray-500">Expected growth gain <Money value={r.projections.appreciationGain} /></div>
          )}
          {r.projections.realProjectedValue && (
            <div className="mt-1 text-xs text-gray-500">Real terms (inflation-adjusted): <Money value={r.projections.realProjectedValue} /></div>
          )}
        </div>
        <div className="rounded-md border border-gray-100 p-3">
          <div className="text-xs uppercase text-gray-500">Remortgage amount @ {r.input.remortgageLtv}% LTV</div>
          <div className="mt-1 text-xl font-semibold"><Money value={r.funding.remortgageAmount} /></div>
          <div className="mt-1 text-xs text-gray-500">Outstanding mortgage <Money value={r.funding.currentMortgageOutstanding} /></div>
        </div>
        <div className="rounded-md border border-gray-100 p-3">
          <div className="text-xs uppercase text-gray-500">Equity released</div>
          <div className="mt-1 text-xl font-semibold"><Money value={r.funding.equityReleased} /></div>
          <div className="mt-1 text-xs text-gray-500">{(r.funding.equityReleasedPctOfInitial * 100).toFixed(1)}% of initial investment</div>
          {/* Yield and ROI */}
          {(() => {
            // If we have rent in input, compute gross yield; ROI approximates equity release vs. initial
            const monthlyRent = (r as any).input?.monthlyRent as number | undefined;
            const grossYield = monthlyRent && r.input.purchasePrice > 0 ? ((monthlyRent * 12) / r.input.purchasePrice) * 100 : null;
            const roiPct = r.funding.totalInitialInvestment > 0 ? (r.funding.equityReleased / r.funding.totalInitialInvestment) * 100 : null;
            return (
              <div className="mt-2 grid gap-1 text-xs text-gray-600">
                {grossYield !== null && <div>Gross yield ~{grossYield.toFixed(1)}%</div>}
                {roiPct !== null && <div>ROI at refinance ~{roiPct.toFixed(1)}%</div>}
              </div>
            );
          })()}
        </div>
      </div>
      {/* Charts */}
      {/* Render charts below using client-only Chart.js wrappers */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="mt-4 rounded-md border border-gray-100 p-3 bg-gray-50">
        <div className="text-sm">Cash left in deal: <strong><Money value={r.funding.cashLeftInDeal} /></strong></div>
        <div className="mt-1 text-xs text-gray-600">This is {(percentLeft * 100).toFixed(1)}% of your initial investment.</div>
        {/* BRRR visual indicator */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>BRRR suitability</span>
            <span className={`${brrr.text} font-medium`}>{brrr.label}</span>
          </div>
          <div className="mt-1 h-2 w-full rounded bg-gray-200">
            <div className={`h-2 rounded ${brrr.color}`} style={{ width: `${Math.min(100, Math.max(0, percentLeft * 100))}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-gray-500">Aim for under ~25–30% left in the deal after refinance.</div>
        </div>
        {r.inflation && (
          <div className="mt-1 text-xs text-gray-600">Adjusted for inflation at {r.inflation.rate.toFixed(1)}%/yr{r.inflation.source ? ` (${r.inflation.source})` : ''}.</div>
        )}
      </div>
    </div>
  );
}


