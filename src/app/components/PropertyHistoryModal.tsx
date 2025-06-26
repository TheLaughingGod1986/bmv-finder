import React from 'react';

interface SoldPrice {
  id: string;
  price: number;
  dateOfTransfer: string;
  postcode: string;
  propertyType: string;
  street: string;
  town_city: string;
  county: string;
  paon: string;
  saon: string;
  duration: string;
  old_new: string;
  locality: string;
  ppd_category_type: string;
  record_status: string;
  growthPct?: number;
}

interface PropertyHistoryModalProps {
  open: boolean;
  property: SoldPrice | null;
  history: SoldPrice[];
  formatAddress: (property: SoldPrice) => string;
  onClose: () => void;
}

const PropertyHistoryModal: React.FC<PropertyHistoryModalProps> = React.memo(({ open, property, history, formatAddress, onClose }) => {
  // Sort history by date descending
  const sortedHistory = React.useMemo(() =>
    [...history].sort((a, b) => new Date(b.dateOfTransfer).getTime() - new Date(a.dateOfTransfer).getTime()),
    [history]
  );

  if (!open || !property) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>✕</button>
        <h3 className="font-bold text-lg mb-2">Price History</h3>
        <div className="mb-2 text-sm text-gray-600">{formatAddress(property)} ({property.postcode})</div>
        {history.length > 1 ? (
          <>
            <div className="mb-2 text-xs text-gray-500">Each point shows a sale of this property. Hover a point for details.</div>
            <table className="min-w-full text-xs mb-4 border rounded overflow-hidden">
              <thead>
                <tr className="bg-blue-50">
                  <th className="text-left px-2 py-1 font-semibold text-gray-700">Date</th>
                  <th className="text-left px-2 py-1 font-semibold text-gray-700">Price</th>
                </tr>
              </thead>
              <tbody>
                {sortedHistory.map((h, i) => (
                  <tr key={i} className={
                    (h.id === property.id ? 'bg-yellow-100 ' : '') + (i % 2 === 0 ? 'bg-white' : 'bg-blue-50/50')
                  }>
                    <td className="px-2 py-1 whitespace-nowrap">{new Date(h.dateOfTransfer).toLocaleDateString('en-GB')}</td>
                    <td className="px-2 py-1 whitespace-nowrap">£{h.price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="my-6 flex justify-center">
              <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-4 flex flex-col items-center w-full max-w-md shadow-sm">
                <div className="text-green-800 font-semibold text-lg mb-1">Growth: £{(history[history.length-1].price - history[0].price).toLocaleString()} <span className="text-base">({(((history[history.length-1].price / history[0].price) - 1) * 100).toFixed(1)}%)</span></div>
                <div className="text-green-700 text-xs">from first to last sale</div>
              </div>
            </div>
            <hr className="my-6 border-blue-100" />
            <div className="mb-4 text-xs text-gray-500 text-center">Percentage growth is calculated from the first recorded sale to the most recent sale of this property.</div>
            <div className="flex justify-center items-center">
              <div className="relative">
                <svg width="100%" height="140" viewBox="0 0 400 140">
                  {/* Y-axis ticks and labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                    const price = Math.round(history[0].price + t * (history[history.length-1].price - history[0].price));
                    const y = 100 - t * 70;
                    return (
                      <g key={i}>
                        <line x1={45} y1={y} x2={390} y2={y} stroke="#e5e7eb" strokeDasharray="2 2" />
                        <text x={40} y={y+5} fontSize="13" fontWeight="bold" textAnchor="end" fill="#374151">£{(price >= 1000 ? (price/1000).toFixed(0) + 'k' : price.toLocaleString())}</text>
                      </g>
                    );
                  })}
                  {/* X-axis ticks and labels */}
                  {history.map((d, i) => {
                    const x = (i / (history.length - 1)) * 320 + 60;
                    return (
                      <g key={i}>
                        <line x1={x} y1={100} x2={x} y2={110} stroke="#6b7280" />
                        <text x={x} y={125} fontSize="13" fontWeight="bold" textAnchor="middle" fill="#374151">{d.dateOfTransfer.slice(0,4)}</text>
                      </g>
                    );
                  })}
                  {/* Y-axis label */}
                  <text x={15} y={70} fontSize="13" fontWeight="bold" textAnchor="middle" fill="#374151" transform="rotate(-90 15 70)">Price (£)</text>
                  {/* X-axis label */}
                  <text x={200} y={135} fontSize="13" fontWeight="bold" textAnchor="middle" fill="#374151">Year</text>
                  {/* Chart background */}
                  <rect x={45} y={30} width={345} height={70} fill="#f8fafc" rx={8} />
                  {/* Chart line */}
                  {history.map((d, i, arr) => {
                    if (i === 0) return null;
                    const prev = arr[i - 1];
                    const x1 = ((i - 1) / (arr.length - 1)) * 320 + 60;
                    const x2 = (i / (arr.length - 1)) * 320 + 60;
                    const y1 = 100 - ((prev.price - arr[0].price) / (arr[arr.length - 1].price - arr[0].price + 1) * 70);
                    const y2 = 100 - ((d.price - arr[0].price) / (arr[arr.length - 1].price - arr[0].price + 1) * 70);
                    return (
                      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6366f1" strokeWidth="3" />
                    );
                  })}
                  {/* Data points with tooltips */}
                  {history.map((d, i) => {
                    const x = (i / (history.length - 1)) * 320 + 60;
                    const y = 100 - ((d.price - history[0].price) / (history[history.length - 1].price - history[0].price + 1) * 70);
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="6" fill="#6366f1" stroke="#fff" strokeWidth="2">
                          <title>£{d.price.toLocaleString()} on {d.dateOfTransfer}</title>
                        </circle>
                        <text x={x} y={y-12} fontSize="12" fontWeight="bold" textAnchor="middle" fill="#6366f1">£{(d.price >= 1000 ? (d.price/1000).toFixed(0) + 'k' : d.price.toLocaleString())}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </>
        ) : (
          <div className="text-gray-500">Only one sale found for this property.</div>
        )}
      </div>
    </div>
  );
});

PropertyHistoryModal.displayName = 'PropertyHistoryModal';

export default PropertyHistoryModal; 