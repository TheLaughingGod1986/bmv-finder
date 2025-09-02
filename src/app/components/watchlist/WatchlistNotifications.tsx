'use client';

import { useState, useEffect } from 'react';

interface WatchlistAlert {
  id: string;
  propertyId: string;
  propertyTitle: string;
  type: 'price_drop' | 'price_increase' | 'new_listing' | 'status_change' | 'market_update';
  title: string;
  message: string;
  value?: number;
  previousValue?: number;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    website?: string;
    agent?: string;
    changePercentage?: number;
  };
}

interface WatchlistNotificationsProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function WatchlistNotifications({ user }: WatchlistNotificationsProps) {
  const [alerts, setAlerts] = useState<WatchlistAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'price' | 'market'>('all');
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock alerts data - in production, this would come from the API
      const mockAlerts: WatchlistAlert[] = [
        {
          id: '1',
          propertyId: 'prop_1',
          propertyTitle: '3 Bedroom House in Manchester',
          type: 'price_drop',
          title: 'Price Drop Alert',
          message: 'Property price has dropped by £5,000 (2.0%)',
          value: 245000,
          previousValue: 250000,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          priority: 'high',
          metadata: {
            website: 'rightmove.co.uk',
            changePercentage: -2.0
          }
        },
        {
          id: '2',
          propertyId: 'prop_2',
          propertyTitle: '2 Bedroom Flat in Birmingham',
          type: 'market_update',
          title: 'Market Update',
          message: 'Similar properties in this area have increased by 3.2% this month',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          priority: 'medium',
          metadata: {
            changePercentage: 3.2
          }
        },
        {
          id: '3',
          propertyId: 'prop_3',
          propertyTitle: '4 Bedroom House in Liverpool',
          type: 'status_change',
          title: 'Status Change',
          message: 'Property status changed from "For Sale" to "Under Offer"',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          priority: 'medium'
        },
        {
          id: '4',
          propertyId: 'prop_4',
          propertyTitle: '1 Bedroom Flat in London',
          type: 'price_increase',
          title: 'Price Increase Alert',
          message: 'Property price has increased by £10,000 (4.0%)',
          value: 260000,
          previousValue: 250000,
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          priority: 'low',
          metadata: {
            website: 'zoopla.co.uk',
            changePercentage: 4.0
          }
        }
      ];

      // Apply filter
      let filteredAlerts = mockAlerts;
      switch (filter) {
        case 'unread':
          filteredAlerts = mockAlerts.filter(alert => !alert.isRead);
          break;
        case 'price':
          filteredAlerts = mockAlerts.filter(alert => 
            alert.type === 'price_drop' || alert.type === 'price_increase'
          );
          break;
        case 'market':
          filteredAlerts = mockAlerts.filter(alert => 
            alert.type === 'market_update'
          );
          break;
      }

      setAlerts(filteredAlerts);
    } catch (err) {
      setError('Network error loading alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      // In production, this would call the API
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
    } catch (err) {
      setError('Failed to mark alert as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // In production, this would call the API
      setAlerts(alerts.map(alert => ({ ...alert, isRead: true })));
    } catch (err) {
      setError('Failed to mark all alerts as read');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      // In production, this would call the API
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (err) {
      setError('Failed to delete alert');
    }
  };

  const handleBulkAction = async (action: 'mark_read' | 'delete') => {
    if (selectedAlerts.size === 0) return;

    try {
      switch (action) {
        case 'mark_read':
          setAlerts(alerts.map(alert => 
            selectedAlerts.has(alert.id) ? { ...alert, isRead: true } : alert
          ));
          break;
        case 'delete':
          setAlerts(alerts.filter(alert => !selectedAlerts.has(alert.id)));
          break;
      }
      setSelectedAlerts(new Set());
    } catch (err) {
      setError('Failed to perform bulk action');
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'price_drop': return '📉';
      case 'price_increase': return '📈';
      case 'new_listing': return '🆕';
      case 'status_change': return '🔄';
      case 'market_update': return '📊';
      default: return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Watchlist Alerts</h2>
          <p className="text-gray-600">
            Stay updated on your saved properties with real-time notifications
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {unreadCount > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {unreadCount} unread
            </span>
          )}
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark All Read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          {[
            { value: 'all', label: 'All Alerts' },
            { value: 'unread', label: 'Unread' },
            { value: 'price', label: 'Price Changes' },
            { value: 'market', label: 'Market Updates' }
          ].map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value as any)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === filterOption.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedAlerts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedAlerts.size} alerts selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('mark_read')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Mark as Read
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedAlerts(new Set())}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Alerts</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? "You don't have any alerts yet. Alerts will appear here when properties in your watchlist change."
              : `No ${filter} alerts found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-lg shadow border-l-4 ${getPriorityColor(alert.priority)} ${
                !alert.isRead ? 'ring-2 ring-blue-200' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedAlerts.has(alert.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedAlerts);
                      if (e.target.checked) {
                        newSelected.add(alert.id);
                      } else {
                        newSelected.delete(alert.id);
                      }
                      setSelectedAlerts(newSelected);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />

                  {/* Alert Icon */}
                  <div className="text-2xl">{getAlertIcon(alert.type)}</div>

                  {/* Alert Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {alert.title}
                          </h3>
                          {!alert.isRead && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{alert.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{alert.propertyTitle}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(alert.timestamp)}</span>
                          {alert.metadata?.website && (
                            <>
                              <span>•</span>
                              <span>{alert.metadata.website}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Alert Actions */}
                      <div className="flex items-center space-x-2">
                        {!alert.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(alert.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Price Change Details */}
                    {alert.value && alert.previousValue && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-600">Previous Price:</span>
                            <span className="ml-2 font-medium">
                              £{alert.previousValue.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Current Price:</span>
                            <span className="ml-2 font-medium">
                              £{alert.value.toLocaleString()}
                            </span>
                          </div>
                          {alert.metadata?.changePercentage && (
                            <div>
                              <span className="text-sm text-gray-600">Change:</span>
                              <span className={`ml-2 font-medium ${
                                alert.metadata.changePercentage > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {alert.metadata.changePercentage > 0 ? '+' : ''}
                                {alert.metadata.changePercentage}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Price Change Alerts</div>
              <div className="text-sm text-gray-600">Get notified when property prices change</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Market Updates</div>
              <div className="text-sm text-gray-600">Receive market trend notifications</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Status Changes</div>
              <div className="text-sm text-gray-600">Alert when property status changes</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
