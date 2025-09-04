'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Settings, 
  Bell, 
  Eye, 
  Save,
  Edit,
  X,
  Check,
  AlertCircle,
  Crown,
  Star,
  Users
} from 'lucide-react';
import { useProductionAuth } from '@/lib/auth/productionAuthProvider';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: {
    id: string;
    name: string;
    tier: string;
  };
  tier: string;
  preferences: {
    theme: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      marketing: boolean;
    };
    privacy: {
      profileVisibility: string;
      dataSharing: boolean;
      analytics: boolean;
    };
    display: {
      currency: string;
      dateFormat: string;
      timezone: string;
    };
  };
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

interface UsageStats {
  searchesUsed: number;
  searchesLimit: number;
  propertiesInWatchlist: number;
  propertiesLimit: number;
  lastSearchAt?: string;
  lastLoginAt?: string;
}

export default function UserProfileManager() {
  const { user: authUser } = useProductionAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    if (authUser) {
      fetchProfile();
    }
  }, [authUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setProfile(result.data.user);
        setUsageStats(result.data.usageStats);
        setEditData(result.data.user);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
        setEditing(false);
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profile);
    setEditing(false);
    setError(null);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'admin':
        return <Shield className="w-5 h-5 text-red-500" />;
      case 'elite':
        return <Crown className="w-5 h-5 text-purple-500" />;
      case 'premium':
        return <Star className="w-5 h-5 text-yellow-500" />;
      default:
        return <Users className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'elite':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'premium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          {getTierIcon(profile.tier)}
          <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getTierColor(profile.tier)}`}>
            {profile.role.name}
          </span>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2"
        >
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2"
        >
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Basic Information
              </h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-gray-900">{profile.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-gray-900">{new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {profile.lastLoginAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Login</label>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">{new Date(profile.lastLoginAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Preferences
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                {editing ? (
                  <select
                    value={editData.preferences?.theme || 'system'}
                    onChange={(e) => setEditData({
                      ...editData,
                      preferences: {
                        ...editData.preferences,
                        theme: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                ) : (
                  <p className="text-gray-900 capitalize">{profile.preferences.theme}</p>
                )}
              </div>

              {/* Notifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Notifications</label>
                <div className="space-y-3">
                  {Object.entries(profile.preferences.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      {editing ? (
                        <input
                          type="checkbox"
                          checked={editData.preferences?.notifications?.[key] || false}
                          onChange={(e) => setEditData({
                            ...editData,
                            preferences: {
                              ...editData.preferences,
                              notifications: {
                                ...editData.preferences?.notifications,
                                [key]: e.target.checked
                              }
                            }
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      ) : (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {value ? 'Enabled' : 'Disabled'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Privacy</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Profile Visibility</span>
                    {editing ? (
                      <select
                        value={editData.preferences?.privacy?.profileVisibility || 'private'}
                        onChange={(e) => setEditData({
                          ...editData,
                          preferences: {
                            ...editData.preferences,
                            privacy: {
                              ...editData.preferences?.privacy,
                              profileVisibility: e.target.value
                            }
                          }
                        })}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                      </select>
                    ) : (
                      <span className="text-sm text-gray-900 capitalize">{profile.preferences.privacy.profileVisibility}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Data Sharing</span>
                    {editing ? (
                      <input
                        type="checkbox"
                        checked={editData.preferences?.privacy?.dataSharing || false}
                        onChange={(e) => setEditData({
                          ...editData,
                          preferences: {
                            ...editData.preferences,
                            privacy: {
                              ...editData.preferences?.privacy,
                              dataSharing: e.target.checked
                            }
                          }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    ) : (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        profile.preferences.privacy.dataSharing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {profile.preferences.privacy.dataSharing ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Usage Statistics</h2>
            </div>
            <div className="p-6 space-y-4">
              {usageStats && (
                <>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Searches</span>
                      <span className="text-gray-900">
                        {usageStats.searchesUsed} / {usageStats.searchesLimit === Infinity ? '∞' : usageStats.searchesLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((usageStats.searchesUsed / (usageStats.searchesLimit === Infinity ? 1 : usageStats.searchesLimit)) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Watchlist</span>
                      <span className="text-gray-900">
                        {usageStats.propertiesInWatchlist} / {usageStats.propertiesLimit === Infinity ? '∞' : usageStats.propertiesLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((usageStats.propertiesInWatchlist / (usageStats.propertiesLimit === Infinity ? 1 : usageStats.propertiesLimit)) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {editing && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}