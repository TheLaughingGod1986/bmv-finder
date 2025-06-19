'use client';

import { useState, useMemo, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Filters from './components/Filters';
import SoldPricesTable from './components/SoldPricesTable';
import dynamic from 'next/dynamic';
import ChartsPanel from './components/ChartsPanel';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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

interface TrendDataEntry {
  year: string;
  avgPrice: number;
  pctChange: number | null;
}

const AreaPriceTrendChart = dynamic(() => import('./components/AreaPriceTrendChart'), { ssr: false, loading: () => <div className="mb-8 bg-white rounded-xl shadow p-4 text-center text-gray-400">Loading chart…</div> });
const PropertyHistoryModal = dynamic(() => import('./components/PropertyHistoryModal'), { ssr: false, loading: () => null });

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [soldPrices, setSoldPrices] = useState<SoldPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendDataEntry[]>([]);
  const [historyModal, setHistoryModal] = useState<{ open: boolean; property: SoldPrice | null; history: SoldPrice[] }>({ open: false, property: null, history: [] });
  const [filterDuration, setFilterDuration] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');

  // Compute min and max price from loaded data
  const priceBounds = useMemo(() => {
    if (!soldPrices.length) return { min: 0, max: 1000000 };
    let min = Math.min(...soldPrices.map(sp => sp.price));
    let max = Math.max(...soldPrices.map(sp => sp.price));
    return { min, max };
  }, [soldPrices]);

  // Compute filtered and sorted soldPrices
  const filteredSoldPrices = useMemo(() => {
    let filtered = [...soldPrices];
    if (minPrice !== '' && !isNaN(Number(minPrice))) {
      filtered = filtered.filter(sp => sp.price >= Number(minPrice));
    }
    if (maxPrice !== '' && !isNaN(Number(maxPrice))) {
      filtered = filtered.filter(sp => sp.price <= Number(maxPrice));
    }
    if (filterDuration.length > 0) {
      filtered = filtered.filter(sp => filterDuration.includes(sp.duration));
    }
    if (filterType.length > 0) {
      filtered = filtered.filter(sp => filterType.includes(sp.property_type));
    }
    // Sort newest to oldest
    return filtered.slice().sort((a, b) => b.date_of_transfer.localeCompare(a.date_of_transfer));
  }, [soldPrices, minPrice, maxPrice, filterDuration, filterType]);

  // Compute trend data for the filteredSoldPrices
  const filteredTrendData = useMemo(() => {
    const yearMap: { [year: string]: { sum: number, count: number } } = {};
    for (const row of filteredSoldPrices) {
      const year = row.date_of_transfer?.slice(0, 4);
      if (!year) continue;
      if (!yearMap[year]) yearMap[year] = { sum: 0, count: 0 };
      yearMap[year].sum += row.price;
      yearMap[year].count += 1;
    }
    const sortedYears = Object.keys(yearMap).sort();
    let prevAvg: number | null = null;
    return sortedYears.map((year) => {
      const avgPrice = Math.round(yearMap[year].sum / yearMap[year].count);
      let pctChange: number | null = null;
      if (prevAvg !== null) {
        pctChange = Number(((avgPrice / prevAvg - 1) * 100).toFixed(1));
      }
      prevAvg = avgPrice;
      return { year, avgPrice, pctChange };
    });
  }, [filteredSoldPrices]);

  const handleScan = async () => {
    setIsLoading(true);
    setError(null);
    setSoldPrices([]);
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcode: searchTerm, trend: true }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch sold prices');
      }
      setSoldPrices(data.data.soldPrices || []);
      setTrendData(data.data.trendData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPropertyType = useCallback((type: string) => {
    const types: { [key: string]: string } = {
      'D': 'Detached',
      'S': 'Semi-detached', 
      'T': 'Terraced',
      'F': 'Flat/Maisonette',
      'O': 'Other'
    };
    return types[type] || type;
  }, []);

  const formatDuration = useCallback((duration: string) => {
    return duration === 'F' ? 'Freehold' : duration === 'L' ? 'Leasehold' : duration;
  }, []);

  const formatOldNew = useCallback((oldNew: string) => {
    return oldNew === 'Y' ? 'New Build' : oldNew === 'N' ? 'Existing' : oldNew;
  }, []);

  const formatAddress = useCallback((property: SoldPrice) => {
    const parts = [property.paon, property.saon, property.street].filter(Boolean);
    return parts.join(' ');
  }, []);

  const formatPrice = useCallback((price: number) => {
    return price ? `£${price.toLocaleString()}` : 'N/A';
  }, []);

  // Add helpers for PPD Category and Record Status
  const formatPPDCategory = (cat: string) => cat === 'A' ? 'Standard' : cat === 'B' ? 'Additional' : cat;
  const formatRecordStatus = (status: string) => {
    if (status === 'A') return 'Addition';
    if (status === 'C') return 'Change';
    if (status === 'D') return 'Deletion';
    return status;
  };

  const handleShowHistory = async (id: string) => {
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch property history');
      }
      setHistoryModal({ open: true, property: data.data.property, history: data.data.history });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error fetching property history:', errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Sold Property Prices
                </h1>
                <p className="text-sm text-gray-600">UK Land Registry Data</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SEO-friendly introduction */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-gray-800">Discover UK Sold Property Prices</h2>
          <p className="text-gray-700 text-base">
            Instantly search and analyze UK Land Registry sold property prices. Filter by property type, tenure, and price range. Visualize price trends and compare recent sales in your area. All data is sourced from the official UK Land Registry and updated monthly for accuracy.
          </p>
        </section>
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <Filters
            minPrice={minPrice}
            maxPrice={maxPrice}
            setMinPrice={setMinPrice}
            setMaxPrice={setMaxPrice}
            priceBounds={priceBounds}
            filterDuration={filterDuration}
            setFilterDuration={setFilterDuration}
            filterType={filterType}
            setFilterType={setFilterType}
          />
          <div className="mb-4">
            <label htmlFor="searchTerm" className="block text-sm font-semibold text-gray-700 mb-2">
              Search by postcode, address, street, or town
            </label>
            <div className="flex gap-2">
              <input
                id="searchTerm"
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="e.g., SW1A 1AA, Downing Street, Manchester"
                className="flex-1 px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 border-gray-300 text-gray-900 bg-white shadow-sm transition-all duration-200 placeholder-gray-400"
                disabled={isLoading}
              />
              <button
                onClick={handleScan}
                disabled={!searchTerm || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                {isLoading ? 'Loading...' : 'Get Sold Prices'}
              </button>
            </div>
          </div>
          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              {error}
            </div>
          )}
        </div>
        <ChartsPanel soldPrices={filteredSoldPrices} />
        <AreaPriceTrendChart filteredTrendData={filteredTrendData} />
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-2 text-gray-800">Recent Sold Prices for {searchTerm}</h2>
          <p className="text-gray-600 text-sm mb-6">This table lists all sold properties matching your search and filters. Click a row for more details and price history. Use the filters above to refine your results by price, type, or property type.</p>
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold shadow"
              onClick={() => {
                const csvRows = [
                  [
                    'Address', 'Postcode', 'Date', 'Price', 'Type', 'Property Type', 'Town/City', 'District', 'County'
                  ],
                  ...filteredSoldPrices.map(sp => [
                    `${sp.paon} ${sp.saon} ${sp.street}`.trim(),
                    sp.postcode,
                    sp.date_of_transfer,
                    sp.price,
                    sp.duration,
                    sp.property_type,
                    sp.town_city,
                    sp.district,
                    sp.county
                  ])
                ];
                const csvContent = csvRows.map(row => row.map(String).map(v => '"' + v.replace(/"/g, '""') + '"').join(',')).join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sold_prices.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </button>
            <a
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold shadow"
              href={`https://docs.google.com/spreadsheets/u/0/d/1/export?format=csv`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => {
                // Instead, open a new Google Sheet and import the CSV
                const csvRows = [
                  [
                    'Address', 'Postcode', 'Date', 'Price', 'Type', 'Property Type', 'Town/City', 'District', 'County'
                  ],
                  ...filteredSoldPrices.map(sp => [
                    `${sp.paon} ${sp.saon} ${sp.street}`.trim(),
                    sp.postcode,
                    sp.date_of_transfer,
                    sp.price,
                    sp.duration,
                    sp.property_type,
                    sp.town_city,
                    sp.district,
                    sp.county
                  ])
                ];
                const csvContent = csvRows.map(row => row.map(String).map(v => '"' + v.replace(/"/g, '""') + '"').join(',')).join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                window.open(`https://docs.google.com/spreadsheets/u/0/`, '_blank');
                setTimeout(() => {
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sold_prices.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }, 1000);
                e.preventDefault();
              }}
            >
              Export to Google Sheets
            </a>
          </div>
          <SoldPricesTable
            soldPrices={filteredSoldPrices}
            postcode={searchTerm}
            formatAddress={formatAddress}
            formatPrice={formatPrice}
            formatDuration={formatDuration}
            formatPropertyType={formatPropertyType}
            handleShowHistory={handleShowHistory}
          />
        </div>
        <PropertyHistoryModal
          open={historyModal.open}
          property={historyModal.property}
          history={historyModal.history}
          formatAddress={formatAddress}
          onClose={() => setHistoryModal({ open: false, property: null, history: [] })}
        />
      </main>
    </div>
  );
}
