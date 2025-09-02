'use client';

import { useState, useEffect } from 'react';
import { propertyAlertService, PropertyAlert } from '@/lib/propertyAlertService';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  BellIcon,
  BellSlashIcon,
  MapPinIcon,
  CurrencyPoundIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

interface PropertyAlertManagerProps {
  userId: string;
  className?: string;
}

export default function PropertyAlertManager({ userId, className = "" }: PropertyAlertManagerProps) {
  const [alerts, setAlerts] = useState<PropertyAlert[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PropertyAlert | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [userId]);

  const loadAlerts = () => {
    const userAlerts = propertyAlertService.getUserAlerts(userId);
    setAlerts(userAlerts);
  };

  const createAlert = async (alertData: Omit<PropertyAlert, 'id' | 'createdAt' | 'triggerCount'>) => {
    setIsLoading(true);
    try {
      const alertId = propertyAlertService.createAlert(alertData);
      loadAlerts();
      setIsCreating(false);
      return alertId;
    } catch (error) {
      console.error('Failed to create alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAlert = async (id: string, updates: Partial<PropertyAlert>) => {
    setIsLoading(true);
    try {
      propertyAlertService.updateAlert(id, updates);
      loadAlerts();
      setEditingAlert(null);
    } catch (error) {
      console.error('Failed to update alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAlert = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    
    setIsLoading(true);
    try {
      propertyAlertService.deleteAlert(id);
      loadAlerts();
    } catch (error) {
      console.error('Failed to delete alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAlert = async (id: string, enabled: boolean) => {
    updateAlert(id, { enabled });
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'price_drop':
        return <CurrencyPoundIcon className="w-5 h-5 text-green-600" />;
      case 'new_listing':
        return <HomeIcon className="w-5 h-5 text-blue-600" />;
      case 'bmv_opportunity':
        return <BellIcon className="w-5 h-5 text-purple-600" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'price_drop': return 'Price Drop';
      case 'price_increase': return 'Price Increase';
      case 'new_listing': return 'New Listing';
      case 'bmv_opportunity': return 'BMV Opportunity';
      case 'market_change': return 'Market Change';
      default: return type;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Alerts</h2>
          <p className="text-gray-600">Get notified when properties match your criteria</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Create Alert</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <BellIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <BellIcon className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">
                {alerts.filter(a => a.enabled).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <BellIcon className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Triggers</p>
              <p className="text-2xl font-bold text-gray-900">
                {alerts.reduce((sum, a) => sum + a.triggerCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <BellIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts yet</h3>
          <p className="text-gray-600 mb-6">Create your first property alert to get started</p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Alert
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-lg border border-gray-200 p-6 ${
                !alert.enabled ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getAlertTypeIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {alert.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {alert.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {getAlertTypeLabel(alert.type)} • {alert.postcodes.length} postcode(s) • 
                      BMV threshold: {alert.bmvThreshold}%
                    </p>
                    
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{alert.postcodes.join(', ')}</span>
                      </div>
                      
                      {alert.priceRange.min && (
                        <div className="flex items-center space-x-1">
                          <CurrencyPoundIcon className="w-4 h-4" />
                          <span>
                            {alert.priceRange.min.toLocaleString()} - {alert.priceRange.max?.toLocaleString() || '∞'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Created: {formatDate(alert.createdAt)}</span>
                      {alert.lastTriggered && (
                        <span>Last triggered: {formatDate(alert.lastTriggered)}</span>
                      )}
                      <span>Triggers: {alert.triggerCount}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleAlert(alert.id, !alert.enabled)}
                    className={`p-2 rounded-lg transition-colors ${
                      alert.enabled 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {alert.enabled ? (
                      <BellIcon className="w-5 h-5" />
                    ) : (
                      <BellSlashIcon className="w-5 h-5" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => setEditingAlert(alert)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Alert Modal */}
      {(isCreating || editingAlert) && (
        <PropertyAlertForm
          alert={editingAlert}
          userId={userId}
          onSave={(alertData) => {
            if (editingAlert) {
              updateAlert(editingAlert.id, alertData);
            } else {
              createAlert(alertData);
            }
          }}
          onCancel={() => {
            setIsCreating(false);
            setEditingAlert(null);
          }}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

// Property Alert Form Component
interface PropertyAlertFormProps {
  alert?: PropertyAlert | null;
  userId: string;
  onSave: (alertData: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function PropertyAlertForm({ alert, userId, onSave, onCancel, isLoading }: PropertyAlertFormProps) {
  const [formData, setFormData] = useState({
    name: alert?.name || '',
    type: alert?.type || 'price_drop',
    postcodes: alert?.postcodes || [],
    propertyTypes: alert?.propertyTypes || [],
    priceRange: {
      min: alert?.priceRange.min || '',
      max: alert?.priceRange.max || ''
    },
    bmvThreshold: alert?.bmvThreshold || 70,
    enabled: alert?.enabled ?? true
  });

  const [newPostcode, setNewPostcode] = useState('');

  const addPostcode = () => {
    if (newPostcode.trim() && !formData.postcodes.includes(newPostcode.trim())) {
      setFormData(prev => ({
        ...prev,
        postcodes: [...prev.postcodes, newPostcode.trim()]
      }));
      setNewPostcode('');
    }
  };

  const removePostcode = (postcode: string) => {
    setFormData(prev => ({
      ...prev,
      postcodes: prev.postcodes.filter(p => p !== postcode)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const alertData = {
      ...formData,
      userId,
      conditions: [], // TODO: Add condition builder
      priceRange: {
        min: formData.priceRange.min ? Number(formData.priceRange.min) : undefined,
        max: formData.priceRange.max ? Number(formData.priceRange.max) : undefined
      }
    };

    onSave(alertData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {alert ? 'Edit Alert' : 'Create New Alert'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alert Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., London BMV Properties"
                required
              />
            </div>

            {/* Alert Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="price_drop">Price Drop</option>
                <option value="new_listing">New Listing</option>
                <option value="bmv_opportunity">BMV Opportunity</option>
                <option value="market_change">Market Change</option>
              </select>
            </div>

            {/* Postcodes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postcodes
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newPostcode}
                  onChange={(e) => setNewPostcode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., SW1A1AA"
                />
                <button
                  type="button"
                  onClick={addPostcode}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.postcodes.map((postcode) => (
                  <span
                    key={postcode}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {postcode}
                    <button
                      type="button"
                      onClick={() => removePostcode(postcode)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Price (£)
                </label>
                <input
                  type="number"
                  value={formData.priceRange.min}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    priceRange: { ...prev.priceRange, min: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price (£)
                </label>
                <input
                  type="number"
                  value={formData.priceRange.max}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    priceRange: { ...prev.priceRange, max: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="No limit"
                />
              </div>
            </div>

            {/* BMV Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BMV Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.bmvThreshold}
                onChange={(e) => setFormData(prev => ({ ...prev, bmvThreshold: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Only properties with BMV scores above this threshold will trigger alerts
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || formData.postcodes.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : (alert ? 'Update Alert' : 'Create Alert')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
