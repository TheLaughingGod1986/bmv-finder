'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, MapPin, Building, PoundSterling, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HpiRecord {
  region: string;
  date: string;
  year: number;
  month: number;
  index: number;
  postcode: string;
  regionType: string;
  source: string;
  lastUpdated: string;
  transactionId?: string;
  propertyType?: string;
  pricePaid?: number;
  monthOverMonth?: number;
  yearOverYear?: number;
}

interface HpiDataDisplayProps {
  query: { type: 'postcode' | 'region' | 'region_fallback'; value: string };
  isVisible: boolean;
  onClose: () => void;
}

// Mini SVG line chart for HPI trend
function MiniTrendChart({ data }: { data: HpiRecord[] }) {
  if (!data || data.length < 2) return null;
  // Sort by date ascending
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const values = sorted.map(d => d.index);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((v - min) / (max - min || 1)) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" width={120} height={40} className="block mx-auto">
      <polyline
        fill="none"
        stroke="#3A7CA5"
        strokeWidth="3"
        points={points}
      />
      <circle cx="100" cy={100 - ((values[values.length-1] - min) / (max - min || 1)) * 100} r="2.5" fill="#3A7CA5" />
    </svg>
  );
}

const HpiDataDisplay: React.FC<HpiDataDisplayProps> = ({ query, isVisible, onClose }) => {
  const [data, setData] = useState<HpiRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible || !query.value) return;
    const fetchHpiData = async () => {
      setLoading(true);
      setError(null);
      setRegion(null);
      try {
        let url = '/api/hpi/postcode?';
        if (query.type === 'postcode') {
          url += `postcode=${encodeURIComponent(query.value)}`;
        } else if (query.type === 'region' || query.type === 'region_fallback') {
          url += `region=${encodeURIComponent(query.value)}`;
        }
        const response = await fetch(url);
        const result = await response.json();
        if (response.ok && result.results && result.results.length > 0) {
          setData(result.results);
          setSource(result.source);
          if (result.region) setRegion(result.region);
        } else {
          setData([]);
          setSource(result.source || null);
          setRegion(result.region || null);
          setError(result.error || 'No HPI data found');
        }
      } catch (err) {
        setError('Failed to fetch HPI data');
        setData([]);
        setSource(null);
        setRegion(null);
        console.error('Error fetching HPI data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHpiData();
  }, [query, isVisible]);

  if (!isVisible) return null;

  // Determine label
  let label = '';
  if (query.type === 'postcode') label = `HPI Data for ${query.value}`;
  else if (query.type === 'region') label = `HPI Data for region: ${query.value}`;
  else if (query.type === 'region_fallback') label = `HPI Data for region (fallback): ${query.value}`;
  if (source === 'elasticsearch_region_fallback' && region) label = `HPI Data for region (fallback): ${region}`;
  if (source === 'elasticsearch_region' && query.value) label = `HPI Data for region: ${query.value}`;

  const latestData = data[0];
  const hasGrowthData = latestData?.monthOverMonth !== undefined || latestData?.yearOverYear !== undefined;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-xl border border-gray-200 shadow-medium p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-text-primary">
              {label}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-400 rounded-full px-2 py-1 text-xl transition-colors"
            aria-label="Close HPI panel"
          >
            ×
          </button>
        </div>
        {source === 'elasticsearch_region_fallback' && region && (
          <div className="mb-2 text-blue-700 text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            No postcode-level HPI data found. Showing region-level HPI for <b>{region}</b> instead.
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-text-secondary">Loading HPI data...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-text-secondary mb-2">{error}</div>
            <div className="text-sm text-text-tertiary mb-2">
              Try searching for a different postcode or area.<br/>
              <span className="inline-flex items-center gap-1 text-blue-700"><Info className="w-4 h-4" />
                Tip: Try a nearby postcode, or check for typos.</span>
            </div>
            <div className="text-xs text-text-tertiary">If you believe this is an error, <a href="mailto:support@bmvfinder.com" className="underline">let us know</a>.</div>
          </div>
        )}

        {!loading && !error && latestData && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">Region</span>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-primary-400" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      The official region this postcode belongs to.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-text-primary">
                  {latestData.region}
                </div>
              </div>

              <div className="bg-secondary-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-secondary-600" />
                  <span className="text-sm font-medium text-gray-700">Date</span>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-secondary-400" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      The most recent month for which HPI data is available.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-text-primary">
                  {latestData.date}
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PoundSterling className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">HPI Index</span>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-yellow-400" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      The House Price Index (HPI) is a measure of average property price changes over time. 100 = Jan 1995 prices.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-text-primary">
                  {latestData.index.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Mini Trend Chart */}
            {data.length > 1 && (
              <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">Trend Chart</span>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-primary-400" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Shows the HPI index trend for this postcode over time.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <MiniTrendChart data={data.slice(0, 12).reverse()} />
              </div>
            )}

            {/* Growth Indicators */}
            {hasGrowthData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestData.monthOverMonth !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {latestData.monthOverMonth >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">Month-over-Month</span>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-gray-400" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Percentage change in HPI from the previous month.
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      latestData.monthOverMonth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {latestData.monthOverMonth >= 0 ? '+' : ''}{latestData.monthOverMonth.toFixed(2)}%
                    </div>
                  </div>
                )}

                {latestData.yearOverYear !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {latestData.yearOverYear >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">Year-over-Year</span>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-gray-400" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Percentage change in HPI from the same month last year.
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      latestData.yearOverYear >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {latestData.yearOverYear >= 0 ? '+' : ''}{latestData.yearOverYear.toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Data Source */}
            <div className="text-xs text-text-tertiary border-t pt-4">
              Data source: {source === 'elasticsearch' ? 'Local HPI Database' : 'Land Registry API'} • 
              Last updated: {new Date(latestData.lastUpdated).toLocaleDateString()}
            </div>

            {/* Historical Data Preview */}
            {data.length > 1 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-text-secondary mb-2">Recent History</h4>
                <div className="space-y-2">
                  {data.slice(0, 5).map((record, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">{record.date}</span>
                      <span className="font-medium text-text-primary">{record.index.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Feedback Button */}
        <div className="flex justify-end mt-4">
          <a
            href={`mailto:support@bmvfinder.com?subject=HPI%20Panel%20Feedback%20for%20${encodeURIComponent(query.value)}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg shadow-sm hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors text-sm font-medium"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Send feedback about HPI panel"
          >
            <Info className="w-4 h-4" /> Feedback
          </a>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HpiDataDisplay; 