import React, { useEffect, useRef } from 'react';
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
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap and ESC close
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const sortedHistory = React.useMemo(() =>
    [...history].sort((a, b) => new Date(a.dateOfTransfer).getTime() - new Date(b.dateOfTransfer).getTime()),
    [history]
  );
  if (!open || !property) return null;

  const oldest = sortedHistory[0];
  const latest = sortedHistory[sortedHistory.length - 1];
  const growthAbs = latest.price - oldest.price;
  const growthPct = ((latest.price / oldest.price) - 1) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-2 sm:px-0">
      <div
        ref={modalRef}
        className="relative w-full max-w-lg sm:rounded-2xl bg-white shadow-2xl border border-blue-100 overflow-y-auto max-h-[95vh] flex flex-col"
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
      >
        {/* Close button, sticky on mobile */}
        <button
          className="absolute top-4 right-4 z-10 rounded-full bg-white/90 hover:bg-blue-100 text-gray-500 hover:text-blue-700 shadow-lg p-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Close"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="px-4 pt-8 pb-4 sm:p-8 flex-1 flex flex-col">
          <h3 className="font-bold text-xl mb-1 text-blue-900">Price History</h3>
          <div className="mb-2 text-sm text-gray-600 break-words">
            {formatAddress(property)} <span className="text-gray-400">({property.postcode})</span>
          </div>
          <div className="mb-4">
            <h4 className="font-semibold text-base mb-2 text-blue-800">Sale History by Year</h4>
            <div className="overflow-x-auto rounded-lg border border-blue-50 shadow-sm">
              <table className="min-w-full text-xs sm:text-sm bg-white">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="text-left px-2 py-2 font-semibold text-gray-700 whitespace-nowrap sticky left-0 bg-blue-50">Latest Sale Date</th>
                    <th className="text-left px-2 py-2 font-semibold text-gray-700 whitespace-nowrap">Sale Price</th>
                    <th className="text-left px-2 py-2 font-semibold text-gray-700 whitespace-nowrap">Growth</th>
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
                        <td className="px-2 py-2 font-semibold whitespace-nowrap">{new Date(sale.dateOfTransfer).toLocaleDateString()}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{formatPrice(sale.price)}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{growth}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="my-6 flex justify-center">
            <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 flex flex-col items-center w-full max-w-md shadow-sm">
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
            <div className="relative w-full max-w-[400px] mx-auto overflow-x-auto">
              <svg width="100%" height="180" viewBox="0 0 400 180" className="w-full h-auto min-w-[400px]">
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
                {/* Legend - Only Property */}
                <rect x={250} y={40} width={90} height={28} fill="#fff" stroke="#e5e7eb" rx={8} />
                <circle cx={265} cy={56} r={6} fill="#2563eb" />
                <text x={280} y={60} fontSize="12" fill="#2563eb">Property</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PropertyHistoryModal.displayName = 'PropertyHistoryModal';

export default PropertyHistoryModal; 