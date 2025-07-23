

type Comp = {
  price: number;
  date: string;
  hpiAdjusted: number;
  similarityScore?: number;
  epc_bedrooms?: number;
  epc_size?: number;
  epc_rating?: string;
  new_build?: boolean;
  energy_efficient?: boolean;
  full_address?: string;
  [key: string]: unknown;
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
        <h3 className="font-medium mt-4 mb-1">Comparable Sales (Ranked by Similarity)</h3>
        <table className="w-full text-sm border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Similarity</th>
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Address</th>
              <th className="border px-2 py-1">Bedrooms</th>
              <th className="border px-2 py-1">Size m²</th>
              <th className="border px-2 py-1">Original Price</th>
              <th className="border px-2 py-1">HPI-Adjusted</th>
            </tr>
          </thead>
          <tbody>
            {comps.map((comp, i) => (
              <tr key={i}>
                <td className="border px-2 py-1 text-center">
                  {comp.similarityScore ? (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      comp.similarityScore >= 80 ? 'bg-green-100 text-green-800' :
                      comp.similarityScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {Math.round(comp.similarityScore)}%
                    </span>
                  ) : '-'}
                </td>
                <td className="border px-2 py-1">{comp.date}</td>
                <td className="border px-2 py-1">
                  <div className="text-xs">
                    {comp.full_address || `${comp.paon} ${comp.street}`}
                    {comp.new_build && <span className="ml-1 text-blue-600">(New)</span>}
                    {comp.energy_efficient && <span className="ml-1 text-green-600">(Efficient)</span>}
                  </div>
                </td>
                <td className="border px-2 py-1 text-center">{comp.epc_bedrooms || '-'}</td>
                <td className="border px-2 py-1 text-center">{comp.epc_size ? `${comp.epc_size}m²` : '-'}</td>
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