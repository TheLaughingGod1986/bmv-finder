import React from 'react';
import { formatPrice } from '../../lib/utils';

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
  // All hooks must be called before any return
  const sortedHistory = React.useMemo(() =>
    [...history].sort((a, b) => new Date(a.dateOfTransfer).getTime() - new Date(b.dateOfTransfer).getTime()),
    [history]
  );
  // Only return null after all hooks
  if (!open || !property) return null;

  // Ensure chronological order for chart and summary
  const oldest = sortedHistory[0];
  const latest = sortedHistory[sortedHistory.length - 1];
  const growthAbs = latest.price - oldest.price;
  const growthPct = ((latest.price / oldest.price) - 1) * 100;

  // Calculate average price per year for all properties in the dataset
  const allYears = Array.from(new Set(history.map(h => new Date(h.dateOfTransfer).getFullYear()))).sort();
  const yearToPrices: Record<string, number[]> = {};
  history.forEach(h => {
    const year = new Date(h.dateOfTransfer).getFullYear();
    if (!yearToPrices[year]) yearToPrices[year] = [];
    yearToPrices[year].push(h.price);
  });
  const avgPricesByYear = allYears.map(year => {
    const prices = yearToPrices[year] || [];
    return prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>✕</button>
        <h3 className="font-bold text-lg mb-2">Price History</h3>
        <div className="mb-2 text-sm text-gray-600">{formatAddress(property)} ({property.postcode})</div>
        <div className="mb-4">
          <h4 className="font-semibold text-base mb-2 text-blue-800">Sale History by Year</h4>
          <table className="min-w-full text-xs mb-4 border rounded overflow-hidden">
            <thead>
              <tr className="bg-blue-50">
                <th className="text-left px-2 py-1 font-semibold text-gray-700">Latest Sale Date</th>
                <th className="text-left px-2 py-1 font-semibold text-gray-700">Sale Price</th>
                <th className="text-left px-2 py-1 font-semibold text-gray-700">Growth</th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.map((sale, i) => {
                const prev = i > 0 ? sortedHistory[i - 1] : null;
                let growth = null;
                if (prev) {
                  const abs = sale.price - prev.price;
                  const pct = ((sale.price / prev.price) - 1) * 100;
                  growth = (
                    <span className={abs >= 0 ? "text-green-700" : "text-red-700"}>
                      {abs >= 0 ? '+' : ''}{formatPrice(abs)} ({abs >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                    </span>
                  );
                } else {
                  growth = '—';
                }
                return (
                  <tr key={sale.id} className={i % 2 === 0 ? "bg-yellow-50" : "bg-white"}>
                    <td className="px-2 py-1 font-semibold">{new Date(sale.dateOfTransfer).toLocaleDateString()}</td>
                    <td className="px-2 py-1">{formatPrice(sale.price)}</td>
                    <td className="px-2 py-1">{growth}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="my-6 flex justify-center">
          <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-4 flex flex-col items-center w-full max-w-md shadow-sm">
            <div className={
              growthAbs >= 0 ? "text-green-800 font-semibold text-lg" : "text-red-800 font-semibold text-lg"
            }>
              {growthAbs >= 0 ? '+' : ''}{formatPrice(growthAbs)} ({growthAbs >= 0 ? '+' : ''}{growthPct.toFixed(1)}%)
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Growth from {oldest ? new Date(oldest.dateOfTransfer).getFullYear() : ''} to {latest ? new Date(latest.dateOfTransfer).getFullYear() : ''}
            </div>
          </div>
        </div>
        <hr className="my-6 border-blue-100" />
        <div className="mb-4 text-xs text-gray-500 text-center">Percentage growth is calculated from the first recorded sale to the most recent sale of this property.</div>
        <div className="flex justify-center items-center">
          <div className="relative">
            <svg width="100%" height="180" viewBox="0 0 400 180">
              {/* Chart background */}
              <rect x={45} y={30} width={340} height={100} fill="#f8fafc" rx={8} />
              {/* Y-axis ticks and labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                const price = Math.round(sortedHistory[0].price + t * (sortedHistory[sortedHistory.length-1].price - sortedHistory[0].price));
                const y = 130 - t * 100;
                return (
                  <g key={i}>
                    <line x1={45} y1={y} x2={385} y2={y} stroke="#e5e7eb" strokeDasharray="2 2" />
                    <text x={35} y={y + 4} fontSize="11" fill="#888" textAnchor="end">{formatPrice(price)}</text>
                  </g>
                );
              })}
              {/* Price line for property */}
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                points={sortedHistory.map((sale, i) => {
                  const x = 45 + (i * (340 / (sortedHistory.length - 1 || 1)));
                  const y = 130 - ((sale.price - sortedHistory[0].price) / (sortedHistory[sortedHistory.length-1].price - sortedHistory[0].price || 1)) * 100;
                  return `${x},${y}`;
                }).join(' ')}
              />
              {/* Price line for area average */}
              <polyline
                fill="none"
                stroke="#888"
                strokeWidth="2"
                strokeDasharray="4 2"
                points={avgPricesByYear.map((avg, i) => {
                  if (avg === null) return '';
                  const x = 45 + (i * (340 / (avgPricesByYear.length - 1 || 1)));
                  const y = 130 - ((avg - sortedHistory[0].price) / (sortedHistory[sortedHistory.length-1].price - sortedHistory[0].price || 1)) * 100;
                  return `${x},${y}`;
                }).filter(Boolean).join(' ')}
              />
              {/* Data points and year labels */}
              {sortedHistory.map((sale, i) => {
                const x = 45 + (i * (340 / (sortedHistory.length - 1 || 1)));
                const y = 130 - ((sale.price - sortedHistory[0].price) / (sortedHistory[sortedHistory.length-1].price - sortedHistory[0].price || 1)) * 100;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={7} fill="#2563eb" stroke="#fff" strokeWidth="2" />
                    <text x={x} y={y - 12} fontSize="12" fontWeight="bold" textAnchor="middle" fill="#2563eb">{formatPrice(sale.price)}</text>
                    <text x={x} y={150} fontSize="12" textAnchor="middle" fill="#374151">{new Date(sale.dateOfTransfer).getFullYear()}</text>
                  </g>
                );
              })}
              {/* Y-axis label */}
              <text x={10} y={80} fontSize="13" fontWeight="bold" textAnchor="middle" fill="#374151" transform="rotate(-90 10 80)">Price (£)</text>
              {/* X-axis label */}
              <text x={200} y={170} fontSize="13" fontWeight="bold" textAnchor="middle" fill="#374151">Year</text>
              {/* Legend */}
              <rect x={250} y={40} width={120} height={36} fill="#fff" stroke="#e5e7eb" rx={8} />
              <circle cx={265} cy={56} r={6} fill="#2563eb" />
              <text x={280} y={60} fontSize="12" fill="#2563eb">Property</text>
              <line x1={265} y1={76} x2={275} y2={76} stroke="#888" strokeWidth="2" strokeDasharray="4 2" />
              <text x={280} y={80} fontSize="12" fill="#888">Area Average</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

PropertyHistoryModal.displayName = 'PropertyHistoryModal';

export default PropertyHistoryModal; 