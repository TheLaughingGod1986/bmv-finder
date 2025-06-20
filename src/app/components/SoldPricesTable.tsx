import React, { useState, useMemo } from 'react';
import { SoldPrice } from '../../../types/sold-price';

interface SoldPricesTableProps {
  soldPrices: SoldPrice[];
  postcode: string;
  formatAddress: (sp: SoldPrice) => string;
  formatPrice: (price: number) => string;
  formatDuration: (duration: string) => string;
  formatPropertyType: (type: string) => string;
  handleShowHistory: (id: string) => void;
}

const SoldPricesTable: React.FC<SoldPricesTableProps> = React.memo(({
  soldPrices,
  postcode,
  formatAddress,
  formatPrice,
  formatDuration,
  formatPropertyType,
  handleShowHistory,
}) => {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(soldPrices.length / pageSize);
  const paginatedSoldPrices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return soldPrices.slice(start, start + pageSize);
  }, [soldPrices, page]);
  const handlePrev = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages, p + 1));
  React.useEffect(() => { setPage(1); }, [soldPrices]);

  if (!soldPrices.length) {
    return (
      <div className="text-center text-gray-500 mt-12">
        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 className="text-xl font-semibold mb-2">No Sold Prices Found</h3>
        <p>Try adjusting your filters or search for a different postcode or area.</p>
      </div>
    );
  }
  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-purple-50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Property Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Town/City</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">District</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">County</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedSoldPrices.map((sp, idx) => (
              <tr key={sp.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-150`}>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                    onClick={() => handleShowHistory(sp.id)}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleShowHistory(sp.id); }}
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{formatAddress(sp)}</div>
                      <div className="text-sm text-gray-500">{sp.postcode}</div>
                    </div>
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{sp.date_of_transfer.slice(0, 4)}</td>
                <td className="px-6 py-4">
                  <div className="text-lg font-bold text-blue-700">{formatPrice(sp.price)}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{formatDuration(sp.duration)}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {formatPropertyType(sp.property_type)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{sp.town_city}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{sp.district}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{sp.county}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {paginatedSoldPrices.map((sp, idx) => (
          <div key={sp.id} className="shadow-md rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{formatAddress(sp)}</h3>
                <p className="text-xs text-gray-600">{sp.postcode}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-700">{formatPrice(sp.price)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-gray-500">Date:</span> <span className="ml-1 font-medium">{sp.date_of_transfer.slice(0, 4)}</span></div>
              <div><span className="text-gray-500">Price:</span> <span className="ml-1 font-medium">{formatPrice(sp.price)}</span></div>
              <div><span className="text-gray-500">Type:</span> <span className="ml-1 font-medium">{formatDuration(sp.duration)}</span></div>
              <div><span className="text-gray-500">Property Type:</span> <span className="ml-1 font-medium bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-medium">{formatPropertyType(sp.property_type)}</span></div>
              <div><span className="text-gray-500">Town:</span> <span className="ml-1 font-medium">{sp.town_city}</span></div>
              <div><span className="text-gray-500">District:</span> <span className="ml-1 font-medium">{sp.district}</span></div>
              <div><span className="text-gray-500">County:</span> <span className="ml-1 font-medium">{sp.county}</span></div>
            </div>
          </div>
        ))}
      </div>
      {/* Pagination Controls */}
      {soldPrices.length > pageSize && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            className="px-3 py-1 rounded bg-gray-100 text-gray-700 font-medium disabled:opacity-50"
            onClick={handlePrev}
            disabled={page === 1}
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1 rounded bg-gray-100 text-gray-700 font-medium disabled:opacity-50"
            onClick={handleNext}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
      {/* Legend for codes */}
      <div className="mt-8 text-xs text-gray-500">
        <div className="mb-1 font-semibold">Legend:</div>
        <div><b>PPD Category Type:</b> A = Standard, B = Additional (e.g. repossession, buy-to-let, etc.)</div>
        <div><b>Record Status:</b> A = Addition, C = Change, D = Deletion</div>
      </div>
    </div>
  );
});

SoldPricesTable.displayName = 'SoldPricesTable';

export default SoldPricesTable; 