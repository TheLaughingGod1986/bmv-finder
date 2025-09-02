'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Share2, RefreshCw } from 'lucide-react';
import PortfolioAnalyticsDashboard from '@/app/components/analytics/PortfolioAnalyticsDashboard';
import { Portfolio, PortfolioProperty } from '@/types/portfolio';

export default function PortfolioAnalyticsPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [properties, setProperties] = useState<PortfolioProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real app, you would fetch from your API
      // For now, we'll use mock data
      const mockPortfolio: Portfolio = {
        id: 'portfolio-1',
        name: 'Investment Portfolio',
        description: 'Main property investment portfolio',
        userId: 'user-123',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockProperties: PortfolioProperty[] = [
        {
          id: 'prop-1',
          portfolioId: 'portfolio-1',
          address: '123 Main Street, London, SW1A 1AA',
          postcode: 'SW1A 1AA',
          propertyType: 'Flat',
          bedrooms: 2,
          purchasePrice: 450000,
          currentValue: 520000,
          purchaseDate: '2023-01-15',
          monthlyRent: 2200,
          bmvScore: 85,
          addedAt: '2023-01-15T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'prop-2',
          portfolioId: 'portfolio-1',
          address: '456 Oak Avenue, Manchester, M1 1AA',
          postcode: 'M1 1AA',
          propertyType: 'Terraced',
          bedrooms: 3,
          purchasePrice: 180000,
          currentValue: 195000,
          purchaseDate: '2023-06-01',
          monthlyRent: 950,
          bmvScore: 72,
          addedAt: '2023-06-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'prop-3',
          portfolioId: 'portfolio-1',
          address: '789 Pine Road, Birmingham, B1 1AA',
          postcode: 'B1 1AA',
          propertyType: 'Semi-Detached',
          bedrooms: 4,
          purchasePrice: 220000,
          currentValue: 240000,
          purchaseDate: '2023-03-10',
          monthlyRent: 1200,
          bmvScore: 78,
          addedAt: '2023-03-10T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'prop-4',
          portfolioId: 'portfolio-1',
          address: '321 Elm Street, Liverpool, L1 1AA',
          postcode: 'L1 1AA',
          propertyType: 'Detached',
          bedrooms: 5,
          purchasePrice: 280000,
          currentValue: 295000,
          purchaseDate: '2023-09-05',
          monthlyRent: 1400,
          bmvScore: 82,
          addedAt: '2023-09-05T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'prop-5',
          portfolioId: 'portfolio-1',
          address: '654 Maple Drive, Leeds, LS1 1AA',
          postcode: 'LS1 1AA',
          propertyType: 'Flat',
          bedrooms: 1,
          purchasePrice: 120000,
          currentValue: 125000,
          purchaseDate: '2023-11-20',
          monthlyRent: 650,
          bmvScore: 68,
          addedAt: '2023-11-20T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      setPortfolio(mockPortfolio);
      setProperties(mockProperties);
    } catch (err) {
      setError('Failed to load portfolio data');
      console.error('Error loading portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPortfolioData();
    setRefreshing(false);
  };

  const handleExport = () => {
    // In a real app, this would generate and download a report
    console.log('Exporting portfolio analytics...');
    // You could implement PDF generation, CSV export, etc.
  };

  const handleShare = () => {
    // In a real app, this would share the analytics
    console.log('Sharing portfolio analytics...');
    // You could implement sharing via email, social media, etc.
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading portfolio analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Analytics</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={loadPortfolioData}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio || properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Portfolio Data</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You need to add properties to your portfolio to view analytics.
              </p>
              <button
                onClick={() => router.push('/tools/portfolio')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Portfolio Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Comprehensive performance analysis and insights
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <PortfolioAnalyticsDashboard 
          portfolio={portfolio} 
          properties={properties} 
        />

        {/* Additional Information */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">ℹ️</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                About Portfolio Analytics
              </h3>
              <div className="text-blue-800 dark:text-blue-200 space-y-2">
                <p>
                  This analytics dashboard provides comprehensive insights into your property portfolio performance, 
                  including risk analysis, benchmark comparisons, and actionable recommendations.
                </p>
                <p>
                  <strong>Key Features:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Real-time performance metrics and calculations</li>
                  <li>Risk assessment and diversification analysis</li>
                  <li>Benchmark comparisons against market indices</li>
                  <li>Individual property performance tracking</li>
                  <li>AI-powered investment recommendations</li>
                </ul>
                <p className="text-sm mt-3">
                  <em>Note: This is a demonstration with sample data. In production, analytics would be calculated 
                  from your actual portfolio data and updated in real-time.</em>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
