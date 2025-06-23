import React from 'react';

interface SoldPrice {
  id: string;
  price: number;
  date_of_transfer: string;
  postcode: string;
  property_type: string;
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
                {history.map((h, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-1">{h.date_of_transfer}</td>
                    <td className="px-2 py-1">£{h.price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Growth Section */}
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded flex items-center gap-2">
              <span className="text-green-700 font-semibold">Growth:</span>
              <span className="text-green-900 font-bold text-lg">£{(history[history.length-1].price - history[0].price).toLocaleString()}</span>
              <span className="text-green-700 font-semibold">(
                {(((history[history.length-1].price / history[0].price) - 1) * 100).toFixed(1)}%
              )</span>
              <span className="ml-2 text-xs text-gray-500">from first to last sale</span>
            </div>
            <div className="mb-2 text-xs text-gray-500">Percentage growth is calculated from the first recorded sale to the most recent sale of this property.</div>
            <div className="relative">
              <svg width="100%" height="120" viewBox="0 0 400 120">
                {/* Y-axis ticks and labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                  const price = Math.round(history[0].price + t * (history[history.length-1].price - history[0].price));
                  const y = 90 - t * 60;
                  return (
                    <g key={i}>
                      <line x1={35} y1={y} x2={390} y2={y} stroke="#e5e7eb" strokeDasharray="2 2" />
                      <text x={30} y={y+4} fontSize="10" textAnchor="end" fill="#6b7280">£{price.toLocaleString()}</text>
                    </g>
                  );
                })}
                {/* X-axis ticks and labels */}
                {history.map((d, i) => {
                  const x = (i / (history.length - 1)) * 340 + 50;
                  return (
                    <g key={i}>
                      <line x1={x} y1={90} x2={x} y2={95} stroke="#6b7280" />
                      <text x={x} y={110} fontSize="10" textAnchor="middle" fill="#6b7280">{d.date_of_transfer.slice(0,4)}</text>
                    </g>
                  );
                })}
                {/* Y-axis label */}
                <text x={10} y={60} fontSize="11" textAnchor="middle" fill="#374151" transform="rotate(-90 10 60)">Sale Price (£)</text>
                {/* X-axis label */}
                <text x={200} y={118} fontSize="11" textAnchor="middle" fill="#374151">Year</text>
                {/* Chart line */}
                {history.map((d, i, arr) => {
                  if (i === 0) return null;
                  const prev = arr[i - 1];
                  const x1 = ((i - 1) / (arr.length - 1)) * 340 + 50;
                  const x2 = (i / (arr.length - 1)) * 340 + 50;
                  const y1 = 90 - ((prev.price - arr[0].price) / (arr[arr.length - 1].price - arr[0].price + 1) * 60);
                  const y2 = 90 - ((d.price - arr[0].price) / (arr[arr.length - 1].price - arr[0].price + 1) * 60);
                  return (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#16a34a" strokeWidth="2" />
                  );
                })}
                {/* Data points with tooltips */}
                {history.map((d, i) => {
                  const x = (i / (history.length - 1)) * 340 + 50;
                  const y = 90 - ((d.price - history[0].price) / (history[history.length - 1].price - history[0].price + 1) * 60);
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="4" fill="#16a34a">
                        <title>£{d.price.toLocaleString()} on {d.date_of_transfer}</title>
                      </circle>
                      <text x={x} y={y-8} fontSize="10" textAnchor="middle" fill="#16a34a">£{d.price.toLocaleString()}</text>
                    </g>
                  );
                })}
              </svg>
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