import React, { useState, useMemo } from 'react';
import { SoldPrice } from '../../../types/sold-price';

interface SoldPricesTableProps {
  soldPrices: SoldPrice[];
  formatAddress: (sp: SoldPrice) => string;
  formatPrice: (price: number) => string;
  formatDuration: (duration: string) => string;
  formatPropertyType: (type: string) => string;
  handleShowHistory: (id: string) => void;
  requestSort: (key: keyof SoldPrice) => void;
  sortConfig: { key: keyof SoldPrice; direction: string };
  getHasHistory: (property: SoldPrice) => boolean;
  isDateSortDisabled: boolean;
}

const SortableHeader: React.FC<{
  title: string;
  sortKey: keyof SoldPrice;
  requestSort: (key: keyof SoldPrice) => void;
  sortConfig: { key: keyof SoldPrice; direction: string };
  disabled?: boolean;
  disabledTooltip?: string;
}> = ({ title, sortKey, requestSort, sortConfig, disabled = false, disabledTooltip }) => {
  const isSorted = sortConfig.key === sortKey;
  const icon = isSorted ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕';

  return (
    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
      <button
        type="button"
        onClick={() => requestSort(sortKey)}
        className="flex items-center space-x-1 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
        title={disabled ? disabledTooltip : `Sort by ${title}`}
      >
        <span>{title}</span>
        <span className={`text-gray-400 ${isSorted ? 'text-gray-800' : ''}`}>{icon}</span>
      </button>
    </th>
  );
};

const SoldPricesTable: React.FC<SoldPricesTableProps> = React.memo(({
  soldPrices,
  formatAddress,
  formatPrice,
  formatDuration,
  formatPropertyType,
  handleShowHistory,
  requestSort,
  sortConfig,
  getHasHistory,
  isDateSortDisabled,
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
      {/* Tooltip styles */}
      <style>{`
        .custom-tooltip {
          position: relative;
          display: inline-block;
        }
        .custom-tooltip .custom-tooltiptext {
          visibility: hidden;
          width: 180px;
          background-color: #374151;
          color: #fff;
          text-align: center;
          border-radius: 6px;
          padding: 6px 0;
          position: absolute;
          z-index: 10;
          bottom: 125%;
          left: 50%;
          margin-left: -90px;
          opacity: 0;
          transition: opacity 0.3s;
          font-size: 0.85rem;
          pointer-events: none;
        }
        .custom-tooltip:focus .custom-tooltiptext,
        .custom-tooltip:hover .custom-tooltiptext {
          visibility: visible;
          opacity: 1;
        }
        .custom-tooltip .custom-tooltiptext::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: #374151 transparent transparent transparent;
        }
      `}</style>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-purple-50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
              <SortableHeader title="Date" sortKey="date_of_transfer" requestSort={requestSort} sortConfig={sortConfig} disabled={isDateSortDisabled} disabledTooltip="Sorting disabled: all results are from the same year" />
              <SortableHeader title="Price" sortKey="price" requestSort={requestSort} sortConfig={sortConfig} />
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Property Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Town/City</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">County</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedSoldPrices.map((sp, idx) => (
              <tr key={sp.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-150`}>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-400 rounded disabled:opacity-50 disabled:cursor-not-allowed group"
                    onClick={() => handleShowHistory(sp.id)}
                    disabled={!getHasHistory(sp)}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleShowHistory(sp.id); }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900">{formatAddress(sp)}</div>
                      {getHasHistory(sp) && (
                        <span className="ml-1 text-blue-500 cursor-pointer custom-tooltip" tabIndex={-1} aria-label="View price history">
                          <svg className="w-4 h-4 inline-block align-text-bottom" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 8v.01M12 12v.01M12 16v.01" />
                          </svg>
                          <span className="custom-tooltiptext">Click to view full price history for this property</span>
                        </span>
                      )}
                    </div>
                    {!getHasHistory(sp) && <div className="text-xs text-gray-400 mt-1">No other sales found</div>}
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
                <td className="px-6 py-4 text-sm text-gray-700">{sp.county}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {paginatedSoldPrices.map((sp) => (
          <div key={sp.id} className="shadow-md rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  {formatAddress(sp)}
                  {getHasHistory(sp) && (
                    <span className="text-blue-500 cursor-pointer custom-tooltip" tabIndex={-1} aria-label="View price history">
                      <svg className="w-4 h-4 inline-block align-text-bottom" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 8v.01M12 12v.01M12 16v.01" />
                      </svg>
                      <span className="custom-tooltiptext">Tap to view full price history for this property</span>
                    </span>
                  )}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-700">{formatPrice(sp.price)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs border-b pb-3 mb-3">
              <div><span className="text-gray-500">Date:</span> <span className="ml-1 font-medium">{sp.date_of_transfer.slice(0, 4)}</span></div>
              <div><span className="text-gray-500">Type:</span> <span className="ml-1 font-medium">{formatDuration(sp.duration)}</span></div>
              <div className="col-span-2"><span className="text-gray-500">Property Type:</span> <span className="ml-1 font-medium bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-medium">{formatPropertyType(sp.property_type)}</span></div>
              <div><span className="text-gray-500">Town:</span> <span className="ml-1 font-medium">{sp.town_city}</span></div>
              <div><span className="text-gray-500">County:</span> <span className="ml-1 font-medium">{sp.county}</span></div>
            </div>
             <button
              type="button"
              className="w-full text-center focus:outline-none focus:ring-2 focus:ring-blue-400 rounded text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
              onClick={() => handleShowHistory(sp.id)}
              disabled={!getHasHistory(sp)}
             >
              {getHasHistory(sp) ? 'View History' : 'No History Found'}
            </button>
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