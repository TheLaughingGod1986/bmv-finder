'use client';
import { useEffect, useState } from 'react';
import { BarChart3, HelpCircle, Info, MapPin, Calendar } from 'lucide-react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';

const LineChart = dynamic(() => import('../components/ChartClientOnly').then(mod => mod.LineChart), { ssr: false });

const REGIONS = [
  'United Kingdom', 'London', 'South East', 'South West', 'East of England',
  'West Midlands', 'East Midlands', 'Yorkshire and The Humber', 'North West',
  'North East', 'Wales', 'Scotland', 'Northern Ireland'
];

export default function HpiDashboard() {
  const [region, setRegion] = useState('United Kingdom');
  const [dateRange, setDateRange] = useState({ start: '2020-01', end: '2024-12' });
  const [dateLimits, setDateLimits] = useState({ min: '2020-01', max: '2024-12' });
  const [hpiData, setHpiData] = useState([]);
  const [timeSeries, setTimeSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Fetch date limits
    fetch('/api/hpi/date-range')
      .then(res => res.json())
      .then(data => {
        // date-range logged
        if (data.minDate && data.maxDate) {
          setDateLimits({ min: data.minDate.slice(0,7), max: data.maxDate.slice(0,7) });
          setDateRange({ start: data.minDate.slice(0,7), end: data.maxDate.slice(0,7) });
        }
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Fetch regional HPI data
    fetch(`/api/hpi?region=${encodeURIComponent(region)}`)
      .then(res => res.json())
      .then(data => {
        // hpiData logged
        if (data.error) {
          setError('Failed to load HPI data.');
        } else {
          setHpiData(Array.isArray(data) ? data : []);
        }
      })
      .catch(e => setError('Failed to load HPI data.'));
    // Fetch time series for chart
    fetch(`/api/hpi?region=${encodeURIComponent(region)}&startDate=${dateRange.start}&endDate=${dateRange.end}&groupBy=month`)
      .then(res => res.json())
      .then(data => {
        // timeSeries logged
        setTimeSeries(Array.isArray(data) ? data : []);
      })
      .catch(e => setError('Failed to load time series.'))
      .finally(() => setLoading(false));
  }, [region, dateRange.start, dateRange.end]);

  const formatMonthYear = (ym) => {
    if (!ym) return '';
    const [year, month] = ym.split('-');
    if (!year || !month) return ym;
    return format(new Date(Number(year), Number(month) - 1), 'MMM yyyy');
  };

  // Chart data
  const safeTimeSeries = Array.isArray(timeSeries) ? timeSeries : [];
  const chartData = {
    labels: safeTimeSeries.map(d => d.date),
    datasets: [
      {
        label: 'HPI Index',
        data: safeTimeSeries.map(d => d.avgIndex),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Summary cards (placeholder logic)
  const latest = Array.isArray(hpiData) && hpiData.length > 0 ? hpiData[0] : null;

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="text-center mb-10 max-w-3xl mx-auto pt-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-0">House Price Index Dashboard</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">UK property market trends and analysis</p>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Understanding House Price Index (HPI) Data
            </h2>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showHelp ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          {showHelp && (
            <div className="text-sm text-blue-800">
              <p>The House Price Index (HPI) measures changes in house prices over time. It’s calculated using data from property sales and provides a standardized way to track market trends.</p>
              <ul className="list-disc ml-6 mt-2">
                <li>Base year: 2015 = 100. An index of 120 means prices are 20% higher than in 2015.</li>
                <li>YoY Growth: Year-over-Year change</li>
                <li>MoM Growth: Month-over-Month change</li>
              </ul>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />Select region
            </label>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />Start Date
            </label>
            <input
              type="month"
              value={dateRange.start}
              min={dateLimits.min}
              max={dateLimits.max}
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />End Date
            </label>
            <input
              type="month"
              value={dateRange.end}
              min={dateLimits.min}
              max={dateLimits.max}
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-gray-600">Current HPI</p>
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {latest && typeof latest.index === 'number' ? latest.index.toFixed(1) : 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-gray-600">YoY Growth</p>
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {latest && typeof latest.yoyGrowth === 'number' ? `${latest.yoyGrowth.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-gray-600">MoM Growth</p>
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {latest && typeof latest.monthOverMonth === 'number' ? `${latest.monthOverMonth.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">HPI Trend - {region}</h3>
          <div className="min-h-[300px]">
            {loading ? <div>Loading chart...</div> : <LineChart data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: false } }, scales: { y: { beginAtZero: false } } }} />}
          </div>
        </div>

        {/* Regional HPI Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Regional HPI Data</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Index</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">YoY Growth</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MoM Growth</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(hpiData) && hpiData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.region}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{typeof item.index === 'number' ? item.index.toFixed(1) : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="text-green-600">{typeof item.yoyGrowth === 'number' ? `${item.yoyGrowth.toFixed(1)}%` : 'N/A'}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="text-blue-600">{typeof item.monthOverMonth === 'number' ? `${item.monthOverMonth.toFixed(1)}%` : 'N/A'}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date ? formatMonthYear(item.date) : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TODOs for further enhancements */}
        {/*
          - Add postcode search and mapping to region
          - Add upgrade prompt for free users
          - Add error boundary and more robust error handling
          - Add tooltips and info icons for all metrics
          - Add export/download options
          - Add more advanced chart options (comparison, bar, etc.)
        */}

        {error && <div className="text-red-600 mt-4">{error}</div>}
      </div>
    </div>
  );
} 