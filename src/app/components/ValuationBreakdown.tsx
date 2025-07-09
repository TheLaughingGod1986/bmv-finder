import React from 'react';

type Comp = {
  price: number;
  date: string;
  hpiAdjusted: number;
  [key: string]: any;
};

type Props = {
  avgValue: number;
  suggestedOffer: number;
  offerMargin: number;
  comps: Comp[];
};

export default function ValuationBreakdown({ avgValue, suggestedOffer, offerMargin, comps }: Props) {
  return (
    <div className="rounded-lg border p-4 bg-white shadow">
      <h2 className="text-lg font-semibold mb-2">Valuation Breakdown</h2>
      <div className="mb-2">
        <div>Average HPI-Adjusted Value: <span className="font-bold">£{avgValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
        <div>Investor Offer Margin: <span className="font-bold">{Math.round(offerMargin * 100)}%</span></div>
        <div>Suggested Offer: <span className="font-bold text-green-700">£{suggestedOffer.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
      </div>
      <div>
        <h3 className="font-medium mt-4 mb-1">Comparable Sales</h3>
        <table className="w-full text-sm border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Original Price</th>
              <th className="border px-2 py-1">HPI-Adjusted</th>
            </tr>
          </thead>
          <tbody>
            {comps.map((comp, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{comp.date}</td>
                <td className="border px-2 py-1">£{comp.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="border px-2 py-1">£{comp.hpiAdjusted ? comp.hpiAdjusted.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 