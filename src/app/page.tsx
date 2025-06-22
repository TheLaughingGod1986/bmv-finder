'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
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
import { SoldPrice } from '../../types/sold-price';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type PropertyType = 'D' | 'S' | 'T' | 'F' | 'O';

interface TrendDataEntry {
  year: string;
  avgPrice: number;
  pctChange: number | null;
}

const AreaPriceTrendChart = dynamic(() => import('./components/AreaPriceTrendChart'), { ssr: false, loading: () => <div className="mb-8 bg-white rounded-xl shadow p-4 text-center text-gray-400">Loading chart…</div> });
const PropertyHistoryModal = dynamic(() => import('./components/PropertyHistoryModal'), { ssr: false, loading: () => null });

export default function Home() {
  const [postcode, setPostcode] = useState('');
  const [soldPrices, setSoldPrices] = useState<SoldPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedPostcode, setSearchedPostcode] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showPostcodeHint, setShowPostcodeHint] = useState(false);
  const [historyModal, setHistoryModal] = useState<{ open: boolean; property: SoldPrice | null; history: SoldPrice[] }>({ open: false, property: null, history: [] });
  const [filterDuration, setFilterDuration] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [nationalTrendData, setNationalTrendData] = useState<TrendDataEntry[]>([]);

  useEffect(() => {
    const fetchNationalSummary = async () => {
      try {
        const response = await fetch('/api/summary');
        const data = await response.json();
        if (response.ok) {
          setNationalTrendData(data);
        }
      } catch (err) {
        console.error('Failed to fetch national summary', err);
      }
    };
    fetchNationalSummary();
  }, []);

  useEffect(() => {
    const fetchLastUpdated = async () => {
      try {
        const response = await fetch('/api/last-updated');
        const data = await response.json();
        if (data.lastUpdated) {
          const formattedDate = new Date(data.lastUpdated).toLocaleString(
            'en-GB',
            {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }
          );
          setLastUpdated(formattedDate);
        }
      } catch (err) {
        console.error('Failed to fetch last updated timestamp', err);
      }
    };
    fetchLastUpdated();
  }, []);

  // Compute filtered and sorted soldPrices
  const filteredSoldPrices = useMemo(() => {
    let filtered = [...soldPrices];
    if (filterDuration.length > 0) {
      filtered = filtered.filter(sp => filterDuration.includes(sp.duration));
    }
    if (filterType.length > 0) {
      filtered = filtered.filter(sp => filterType.includes(sp.property_type));
    }
    // Sort newest to oldest
    return filtered.slice().sort((a, b) => b.date_of_transfer.localeCompare(a.date_of_transfer));
  }, [soldPrices, filterDuration, filterType]);

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

  const trendDataForChart = useMemo(() => {
    return searchedPostcode ? filteredTrendData : nationalTrendData;
  }, [searchedPostcode, filteredTrendData, nationalTrendData]);

  console.log('filteredTrendData', filteredTrendData);

  const handleSearch = async (searchPostcode: string) => {
    if (!searchPostcode.trim()) {
      setError('Please enter a postcode.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSoldPrices([]);
    setShowPostcodeHint(false);
    try {
      // Construct the URL with query parameters
      const params = new URLSearchParams();
      params.append('postcode', searchPostcode);
      // Add other params like limit/offset if needed in the future
      // params.append('limit', '1000'); 

      const response = await fetch(`/api/property-kv?${params.toString()}`);

      let data: any = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          throw new Error('Received invalid JSON from server.');
        }
      } else {
        throw new Error('Server returned a non-JSON response.');
      }

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to fetch sold prices');
      }

      const results = data.data || [];
      setSoldPrices(results);
      if (results.length === 0 && searchPostcode.trim().length > 4) {
        setShowPostcodeHint(true);
      }
      // The trend data calculation is now done on the client-side,
      // so we don't need to set it from the API response.
      // setTrendData(data.data.trendData || []); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = useCallback((duration: string) => {
    return duration === 'F' ? 'Freehold' : duration === 'L' ? 'Leasehold' : duration;
  }, []);

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

  const formatAddress = useCallback((property: SoldPrice) => {
    const parts = [property.paon, property.saon, property.street].filter(Boolean);
    return parts.join(' ');
  }, []);

  const formatPrice = useCallback((price: number) => {
    return price ? `£${price.toLocaleString()}` : 'N/A';
  }, []);

  const handleShowHistory = (id: string) => {
    const selectedProperty = soldPrices.find(p => p.id === id);
    if (!selectedProperty) return;

    const propertyHistory = soldPrices
      .filter(p =>
        p.postcode === selectedProperty.postcode &&
        p.street?.trim().toLowerCase() === selectedProperty.street?.trim().toLowerCase() &&
        p.paon?.trim().toLowerCase() === selectedProperty.paon?.trim().toLowerCase() &&
        p.saon?.trim().toLowerCase() === selectedProperty.saon?.trim().toLowerCase()
      )
      .sort((a, b) => new Date(a.date_of_transfer).getTime() - new Date(b.date_of_transfer).getTime());
      
    setHistoryModal({
      open: true,
      property: selectedProperty,
      history: propertyHistory,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            {lastUpdated && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">Database Last Updated</p>
                <p className="text-xs text-gray-500">{lastUpdated}</p>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SEO-friendly introduction */}
        <section className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold mb-2 text-gray-800 tracking-tight">
            The Ultimate Tool for UK Property Price Research
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Instantly search and analyze millions of sold house prices from the official HM Land Registry. Whether you're buying, selling, or just curious, our tool provides detailed property data, market trends, and regional analysis to help you make informed decisions.
          </p>
        </section>
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <Filters
            isLoading={isLoading}
            filterDuration={filterDuration}
            setFilterDuration={setFilterDuration}
            filterType={filterType}
            setFilterType={setFilterType}
          />
          <div className="mb-4 pt-6 border-t">
            <label htmlFor="postcode" className="block text-sm font-semibold text-gray-700 mb-2">
              Search by postcode, address, street, or town
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="postcode"
                type="text"
                value={postcode}
                onChange={e => setPostcode(e.target.value)}
                placeholder="e.g., SW1A 1AA, Downing Street, Manchester"
                className="flex-1 px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 border-gray-300 text-gray-900 bg-white shadow-sm transition-all duration-200 placeholder-gray-400"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSearch(postcode)}
                disabled={!postcode || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 sm:w-auto w-full"
              >
                {isLoading ? 'Loading...' : 'Get Sold Prices'}
              </button>
            </div>
          </div>
          {showPostcodeHint && (
            <div className="text-blue-800 bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="font-semibold">No results for the full postcode?</p>
              <p>Try searching for just the first part of the postcode (e.g., "SW1A") to see a wider area.</p>
            </div>
          )}
          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              {error}
            </div>
          )}
        </div>
        {/* Main content area: charts and table */}
        {filteredSoldPrices.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-8">
            {/* Left side: charts */}
            <div className="lg:col-span-1 space-y-8">
              <ChartsPanel soldPrices={filteredSoldPrices} />
            </div>
            {/* Right side: table and trend chart */}
            <div className="lg:col-span-2 space-y-8">
              <AreaPriceTrendChart
                title={searchedPostcode ? `Price Trend for ${searchedPostcode}` : 'National Price Trend'}
                filteredTrendData={trendDataForChart}
              />
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-2 text-gray-800">Recent Sold Prices for {postcode}</h2>
                <p className="text-gray-600 text-sm mb-6">This table lists all sold properties matching your search and filters. Click a row for more details and price history. Use the filters above to refine your results by tenure, or property type.</p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-4">
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
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold shadow"
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
                  </button>
                </div>
                <SoldPricesTable
                  soldPrices={filteredSoldPrices}
                  postcode={postcode}
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
            </div>
          </div>
        )}
        <Analytics />
        <SpeedInsights />
      </main>
    </div>
  );
}
