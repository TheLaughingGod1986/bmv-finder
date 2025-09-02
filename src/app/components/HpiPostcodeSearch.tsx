'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Calendar, Building, PoundSterling, Info, BarChart3, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import PostcodeInput from './PostcodeInput';
import { apiClient } from '../../lib/apiClient';

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
  monthOverMonth?: number;
  yearOverYear?: number;
}

interface HpiApiResponse {
  results: Array<{
    hpiIndex?: number;
    index?: number;
    region: string;
    date: string;
    year: number;
    month: number;
    postcode: string;
    regionType: string;
    source: string;
    lastUpdated: string;
    monthOverMonth?: number;
    yearOverYear?: number;
  }>;
  source?: string;
  region?: string;
  error?: string;
}

interface HpiPostcodeSearchProps {
  className?: string;
  onClose?: () => void;
}

// UK postcode regex
const POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][0-9A-Z]? ?[0-9][A-Z]{2}$/i;

function formatIfPostcode(input: string) {
  const upper = input.toUpperCase();
  const cleaned = upper.replace(/[^A-Z0-9 ]/g, '');
  const noSpace = cleaned.replace(/\s+/g, '');
  if (noSpace.length >= 5 && noSpace.length <= 8) {
    return noSpace.slice(0, -3) + ' ' + noSpace.slice(-3);
  }
  return cleaned;
}

// Mini SVG line chart for HPI trend
function MiniTrendChart({ data }: { data: HpiRecord[] }) {
  if (!data || data.length < 2) return null;
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const values = sorted.map(d => d.index);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 800;
    const y = 100 - ((v - min) / (max - min || 1)) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 800 100" width="100%" height="60" className="block">
      <polyline
        fill="none"
        stroke="#3A7CA5"
        strokeWidth="3"
        points={points}
      />
      <circle cx="800" cy={100 - ((values[values.length-1] - min) / (max - min || 1)) * 100} r="3" fill="#3A7CA5" />
    </svg>
  );
}

const HpiPostcodeSearch: React.FC<HpiPostcodeSearchProps> = ({ className, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<HpiRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    
    if (!trimmed) {
      setError('Please enter a postcode');
      return;
    }

    if (!POSTCODE_REGEX.test(trimmed.toUpperCase())) {
      setError('Please enter a valid UK postcode format (e.g., SW1A 1AA)');
      return;
    }

    setLoading(true);
    setError(null);
    setData([]);
    setHasSearched(true);

    try {
      const response = await apiClient.getHpiData(trimmed);
      if (!response.error && response.data && typeof response.data === 'object' && 'results' in response.data && Array.isArray((response.data as HpiApiResponse).results) && (response.data as HpiApiResponse).results.length > 0) {
        setData((response.data as HpiApiResponse).results.map((r) => ({
          ...r,
          index: r.hpiIndex !== undefined ? r.hpiIndex : r.index // Map hpiIndex to index for frontend compatibility
        })) as HpiRecord[]);
        setSource((response.data as HpiApiResponse).source);
        if ((response.data as HpiApiResponse).region) setRegion((response.data as HpiApiResponse).region);
      } else {
        setData([]);
        setSource((response.data as HpiApiResponse).source || null);
        setRegion((response.data as HpiApiResponse).region || null);
        setError((response.data as HpiApiResponse).error || 'No HPI data found for this postcode');
      }
    } catch (err) {
      setError('Failed to fetch HPI data. Please try again.');
      setData([]);
      setSource(null);
      setRegion(null);
      console.error('Error fetching HPI data:', err);
    } finally {
      setLoading(false);
    }
  };



  const latestData = data[0];
  const hasGrowthData = latestData?.monthOverMonth !== undefined || latestData?.yearOverYear !== undefined;

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-medium p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">House Price Index Search</h2>
            <p className="text-sm text-text-secondary">Get current HPI data for any UK postcode</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-400 rounded-full p-2 transition-colors"
            aria-label="Close HPI search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Form */}
      <div className="mb-6">
        <PostcodeInput
          value={searchTerm}
          onChange={setSearchTerm}
          onSubmit={handleSearch}
          placeholder="Enter UK postcode (e.g., SW1A 1AA)"
          isLoading={loading}
          aria-label="Enter UK postcode for HPI search"
        />
      </div>

      {/* Results */}
      <AnimatePresence>
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                <span className="ml-2 text-text-secondary">Loading HPI data...</span>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <div className="text-text-secondary mb-2">{error}</div>
                <div className="text-sm text-text-tertiary">
                  Try searching for a different postcode or check for typos.
                </div>
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
                    </div>
                    <div className="text-lg font-semibold text-text-primary">
                      {latestData.region}
                    </div>
                  </div>

                  <div className="bg-secondary-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-secondary-600" />
                      <span className="text-sm font-medium text-gray-700">Latest Data</span>
                    </div>
                    <div className="text-lg font-semibold text-text-primary">
                      {latestData.date}
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <PoundSterling className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-gray-700">HPI Index</span>
                    </div>
                    <div className="text-lg font-semibold text-text-primary">
                      {latestData && typeof latestData.index === 'number' ? latestData.index.toFixed(1) : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Mini Trend Chart */}
                {data.length > 1 && (
                  <div className="bg-gray-50 rounded-lg p-4 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-primary-600" />
                      <span className="text-sm font-medium text-gray-700">12-Month Trend</span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      This chart shows how the House Price Index has changed over the past 12 months for this region.
                    </div>
                    <MiniTrendChart data={data.slice(0, 12).reverse()} />
                    <div className="flex justify-between text-xs text-gray-500 mt-2 w-full">
                      <span>
                        {data.length > 1 ? new Date(data[Math.min(11, data.length-1)].date + '-01').toLocaleString('default', { month: 'short', year: 'numeric' }) : ''}
                      </span>
                      <span>
                        {data.length > 0 ? new Date(data[0].date + '-01').toLocaleString('default', { month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>
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
                          <span className="font-medium text-text-primary">{typeof record.index === 'number' && !isNaN(record.index) ? record.index.toFixed(1) : 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Text */}
      {!hasSearched && (
        <div className="text-center py-8 text-text-tertiary">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">How to use</span>
          </div>
          <p className="text-sm">
            Enter any UK postcode to see the latest House Price Index data for that area.
            <br />
            The HPI shows how property prices have changed over time in your chosen location.
          </p>
        </div>
      )}
    </div>
  );
};

export default HpiPostcodeSearch; 