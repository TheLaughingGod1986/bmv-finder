'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileSearch from './MobileSearch';
import MobilePropertyCard from './MobilePropertyCard';
import { offlineApiClient } from '@/lib/offlineApiClient';
import { offlineStorage } from '@/lib/offlineStorage';
import { 
  MagnifyingGlassIcon, 
  ChartBarIcon, 
  BuildingOfficeIcon,
  HeartIcon,
  ClockIcon,
  WifiIcon,
  WifiSlashIcon
} from '@heroicons/react/24/outline';

interface MobileHomePageProps {
  className?: string;
}

export default function MobileHomePage({ className = "" }: MobileHomePageProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [favoriteProperties, setFavoriteProperties] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline data
  useEffect(() => {
    loadOfflineData();
    if (isOnline) {
      loadSystemHealth();
    }
  }, [isOnline]);

  const loadOfflineData = () => {
    // Load recent searches
    const searches = offlineStorage.getRecentSearches(5);
    setRecentSearches(searches);

    // Load favorite properties
    const favorites = offlineStorage.getFavoriteProperties();
    setFavoriteProperties(favorites);
  };

  const loadSystemHealth = async () => {
    try {
      const response = await offlineApiClient.getSystemHealth();
      if (response.success) {
        setSystemHealth(response.data);
      }
    } catch (error) {
      console.error('Failed to load system health:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const response = await offlineApiClient.searchProperties(query);
      if (response.success) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
      } else {
        // Handle offline search
        const cachedSearch = offlineStorage.getSearches().find(s => 
          s.query.toLowerCase().includes(query.toLowerCase())
        );
        if (cachedSearch) {
          router.push(`/search?q=${encodeURIComponent(query)}&offline=true`);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'BMV Properties',
      description: 'Find below market value deals',
      icon: MagnifyingGlassIcon,
      href: '/search?type=bmv',
      color: 'bg-blue-500'
    },
    {
      title: 'Market Trends',
      description: 'View HPI and market data',
      icon: ChartBarIcon,
      href: '/tools/market-trends',
      color: 'bg-green-500'
    },
    {
      title: 'My Portfolio',
      description: 'Manage your properties',
      icon: BuildingOfficeIcon,
      href: '/tools/portfolio',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Property Intelligence
              </h1>
              <p className="text-sm text-gray-500">
                {isOnline ? 'Online' : 'Offline'} • {favoriteProperties.length} favorites
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <WifiIcon className="w-5 h-5 text-green-500" />
              ) : (
                <WifiSlashIcon className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>

          {/* Search */}
          <MobileSearch
            onSearch={handleSearch}
            placeholder="Search by postcode or address..."
            className="w-full"
          />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => router.push(action.href)}
                  className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mr-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Searches</h2>
              <button
                onClick={() => router.push('/search/history')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentSearches.slice(0, 3).map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(search.query)}
                  className="w-full flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ClockIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{search.query}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(search.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Favorite Properties */}
        {favoriteProperties.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Favorite Properties</h2>
              <button
                onClick={() => router.push('/favorites')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {favoriteProperties.slice(0, 2).map((property, index) => (
                <MobilePropertyCard
                  key={index}
                  property={property.data}
                  isFavorite={true}
                  onViewDetails={(prop) => router.push(`/property/${prop.id}`)}
                  className="w-full"
                />
              ))}
            </div>
          </div>
        )}

        {/* System Status */}
        {systemHealth && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">System Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Health</span>
                <span className={`text-sm font-medium ${
                  systemHealth.overall?.status === 'healthy' ? 'text-green-600' :
                  systemHealth.overall?.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {systemHealth.overall?.status || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Data Quality</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemHealth.services?.dataQuality?.completeness || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Performance</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemHealth.services?.apiPerformance?.score || 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Offline Notice */}
        {!isOnline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center">
              <WifiSlashIcon className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <h3 className="font-medium text-yellow-800">You're Offline</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Some features are limited. Your saved data is still available.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
