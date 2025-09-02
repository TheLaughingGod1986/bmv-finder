'use client';

import { useState, useEffect } from 'react';

interface ChromeExtensionStats {
  total: number;
  byWebsite: Record<string, number>;
  totalValue: number;
  averagePrice: number;
  recentCaptures: Array<{
    id: string;
    title: string;
    price: number;
    website: string;
    addedAt: string;
  }>;
}

interface ChromeExtensionIntegrationProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function ChromeExtensionIntegration({ user }: ChromeExtensionIntegrationProps) {
  const [stats, setStats] = useState<ChromeExtensionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);

  useEffect(() => {
    loadChromeExtensionStats();
    checkExtensionInstallation();
  }, []);

  const loadChromeExtensionStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/watchlist/chrome-extension');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load Chrome extension stats');
      }
    } catch (err) {
      setError('Network error loading Chrome extension stats');
    } finally {
      setIsLoading(false);
    }
  };

  const checkExtensionInstallation = () => {
    // Check if Chrome extension is installed by looking for a specific message
    const checkExtension = () => {
      if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) {
        // Try to communicate with the extension
        window.chrome.runtime.sendMessage(
          'bmv-finder-extension-id', // This would be the actual extension ID
          { action: 'ping' },
          (response) => {
            if (response && response.success) {
              setIsExtensionInstalled(true);
            }
          }
        );
      }
    };

    // Check immediately and then periodically
    checkExtension();
    const interval = setInterval(checkExtension, 5000);
    
    return () => clearInterval(interval);
  };

  const handleInstallExtension = () => {
    // Open Chrome Web Store or installation page
    window.open('https://chrome.google.com/webstore/detail/bmv-finder-extension', '_blank');
  };

  const handleTestCapture = async () => {
    // Simulate a property capture for testing
    const testProperty = {
      propertyId: `test_${Date.now()}`,
      title: 'Test Property - 3 Bedroom House',
      address: '123 Test Street, Test City',
      postcode: 'TE1 1ST',
      price: 250000,
      bedrooms: 3,
      bathrooms: 2,
      propertyType: 'House',
      listingType: 'sale' as const,
      imageUrl: 'https://via.placeholder.com/400x300?text=Test+Property',
      description: 'This is a test property captured from the Chrome extension.',
      sourceUrl: 'https://example.com/property/test',
      website: 'rightmove.co.uk',
      notes: 'Test capture from Chrome extension integration',
      tags: ['test', 'chrome-extension'],
      metadata: {
        capturedAt: new Date().toISOString(),
        pageTitle: 'Test Property - Rightmove',
        pageDescription: 'Test property description'
      }
    };

    try {
      const response = await fetch('/api/watchlist/chrome-extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testProperty)
      });

      const data = await response.json();
      if (data.success) {
        alert('Test property captured successfully!');
        loadChromeExtensionStats();
      } else {
        alert('Failed to capture test property: ' + data.error);
      }
    } catch (err) {
      alert('Network error capturing test property');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Extension Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Chrome Extension</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isExtensionInstalled 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isExtensionInstalled ? '✅ Installed' : '⚠️ Not Installed'}
          </div>
        </div>

        {!isExtensionInstalled ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔌</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Install Chrome Extension
            </h3>
            <p className="text-gray-600 mb-6">
              Install our Chrome extension to easily capture properties from Rightmove, Zoopla, and other property websites with just one click.
            </p>
            <button
              onClick={handleInstallExtension}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Install Extension
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-green-600 text-2xl mr-3">✅</span>
                <div>
                  <h4 className="font-medium text-green-900">Extension Active</h4>
                  <p className="text-green-800 text-sm">
                    The BMV Finder Chrome extension is installed and ready to capture properties.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How to Use</h4>
                <ol className="text-blue-800 text-sm space-y-1">
                  <li>1. Visit any property website (Rightmove, Zoopla, etc.)</li>
                  <li>2. Click the BMV Finder extension icon</li>
                  <li>3. Click "Capture Property" to save it to your watchlist</li>
                  <li>4. Add notes and tags before saving</li>
                </ol>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">Supported Websites</h4>
                <ul className="text-purple-800 text-sm space-y-1">
                  <li>• Rightmove.co.uk</li>
                  <li>• Zoopla.co.uk</li>
                  <li>• OnTheMarket.com</li>
                  <li>• PrimeLocation.com</li>
                  <li>• And more...</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleTestCapture}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Test Property Capture
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Extension Stats */}
      {stats && stats.total > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Extension Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Properties Captured</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                £{stats.totalValue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                £{Math.round(stats.averagePrice).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Average Price</div>
            </div>
          </div>

          {/* By Website */}
          {Object.keys(stats.byWebsite).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Properties by Website</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.byWebsite).map(([website, count]) => (
                  <div key={website} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600">{website}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Captures */}
          {stats.recentCaptures.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Captures</h3>
              <div className="space-y-2">
                {stats.recentCaptures.map((capture) => (
                  <div key={capture.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{capture.title}</div>
                      <div className="text-sm text-gray-600">
                        {capture.website} • {new Date(capture.addedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        £{capture.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
