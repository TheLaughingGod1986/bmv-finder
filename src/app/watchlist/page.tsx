'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/auth/productionAuth';
import WatchlistPage from '../components/watchlist/WatchlistPage';
import ChromeExtensionIntegration from '../components/watchlist/ChromeExtensionIntegration';
import PropertyComparison from '../components/watchlist/PropertyComparison';
import WatchlistNotifications from '../components/watchlist/WatchlistNotifications';

interface WatchlistMainPageProps {
  user?: User;
}

export default function WatchlistMainPage({ user }: WatchlistMainPageProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(user || null);
  const [activeTab, setActiveTab] = useState<'properties' | 'extension' | 'notifications'>('properties');
  const [selectedProperties, setSelectedProperties] = useState<any[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (!currentUser) {
      checkAuthentication();
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/production?action=validate');
      const data = await response.json();
      
      if (data.success && data.user) {
        setCurrentUser(data.user);
      } else {
        // Redirect to login page
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      window.location.href = '/login';
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertySelection = (properties: any[]) => {
    setSelectedProperties(properties);
  };

  const handleShowComparison = () => {
    if (selectedProperties.length >= 2) {
      setShowComparison(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access your watchlist.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Welcome back, {currentUser.name}!
                </h1>
                <p className="text-sm text-gray-600">Manage your property watchlist</p>
              </div>
            </div>
            
            {/* Comparison Button */}
            {selectedProperties.length >= 2 && (
              <button
                onClick={handleShowComparison}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Compare Properties ({selectedProperties.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'properties', label: 'Properties', icon: '🏠', count: null },
              { id: 'extension', label: 'Chrome Extension', icon: '🔌', count: null },
              { id: 'notifications', label: 'Alerts', icon: '🔔', count: null }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'properties' && (
          <WatchlistPage 
            user={currentUser} 
            onPropertySelection={handlePropertySelection}
          />
        )}
        
        {activeTab === 'extension' && (
          <ChromeExtensionIntegration user={currentUser} />
        )}
        
        {activeTab === 'notifications' && (
          <WatchlistNotifications user={currentUser} />
        )}
      </div>

      {/* Property Comparison Modal */}
      {showComparison && (
        <PropertyComparison
          selectedProperties={selectedProperties}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}