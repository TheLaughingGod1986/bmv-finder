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
  district: string;
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
            <table className="min-w-full text-xs mb-2">
              <thead>
                <tr>
                  <th className="text-left px-2 py-1">Date</th>
                  <th className="text-left px-2 py-1">Price</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1">{h.date_of_transfer}</td>
                    <td className="px-2 py-1">£{h.price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mb-2">
              <span className="font-semibold">Growth:</span> £{(history[history.length-1].price - history[0].price).toLocaleString()} ({(((history[history.length-1].price / history[0].price) - 1) * 100).toFixed(1)}%)
            </div>
            <svg width="100%" height="80" viewBox="0 0 400 80">
              {history.map((d, i, arr) => {
                if (i === 0) return null;
                const prev = arr[i - 1];
                const x1 = ((i - 1) / (arr.length - 1)) * 380 + 10;
                const x2 = (i / (arr.length - 1)) * 380 + 10;
                const y1 = 70 - ((prev.price - arr[0].price) / (arr[arr.length - 1].price - arr[0].price + 1) * 60);
                const y2 = 70 - ((d.price - arr[0].price) / (arr[arr.length - 1].price - arr[0].price + 1) * 60);
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#16a34a" strokeWidth="2" />
                );
              })}
              {history.map((d, i) => {
                const x = (i / (history.length - 1)) * 380 + 10;
                const y = 70 - ((d.price - history[0].price) / (history[history.length - 1].price - history[0].price + 1) * 60);
                return (
                  <circle key={i} cx={x} cy={y} r="3" fill="#16a34a" />
                );
              })}
            </svg>
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