'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import { UserProfile, UserPreferences } from '@/lib/auth/userManager';
import { auditLogger } from '@/lib/audit/auditLogger';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Eye, 
  Download, 
  Upload,
  Save,
  Edit3,
  X,
  Check,
  AlertCircle,
  Info
} from 'lucide-react';

interface UserProfileManagerProps {
  className?: string;
}

export default function UserProfileManager({ className = '' }: UserProfileManagerProps) {
  const { user, updateProfile, updatePreferences, error } = useAuth();
  const { isAdmin, isElite, isMidTier, isFree } = usePermissions();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: ''
  });
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false
    },
    privacy: {
      profileVisibility: 'private',
      dataSharing: false,
      analytics: true
    },
    display: {
      currency: 'GBP',
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Europe/London'
    }
  });

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        avatar: user.avatar || ''
      });
      setPreferences(user.preferences);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    setSaveMessage(null);

    try {
      await updateProfile(formData);
      await auditLogger.logDataModification(
        user.id,
        'user_profile',
        user.id,
        'update',
        formData,
        { section: 'profile' }
      );
      
      setSaveMessage('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    setIsLoading(true);
    setSaveMessage(null);

    try {
      await updatePreferences(preferences);
      await auditLogger.logDataModification(
        user.id,
        'user_preferences',
        user.id,
        'update',
        preferences,
        { section: 'preferences' }
      );
      
      setSaveMessage('Preferences updated successfully');
      setIsEditingPreferences(false);
    } catch (error) {
      console.error('Error updating preferences:', error);
      setSaveMessage('Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      // This would typically call an API endpoint to generate and download user data
      await auditLogger.logDataExport(user.id, 'user_data', 1, { type: 'full_export' });
      setSaveMessage('Data export initiated. You will receive an email when ready.');
    } catch (error) {
      console.error('Error exporting data:', error);
      setSaveMessage('Failed to initiate data export');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No user profile found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Management</h2>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            user.tier === 'admin' ? 'bg-red-100 text-red-800' :
            user.tier === 'elite' ? 'bg-purple-100 text-purple-800' :
            user.tier === 'mid' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
          </span>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {saveMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="text-green-800 font-medium">Success</h3>
            <p className="text-green-700">{saveMessage}</p>
          </div>
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user.name,
                      email: user.email,
                      avatar: user.avatar || ''
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                <p className="text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
                <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Login</label>
                <p className="text-gray-900">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
            </div>
            {!isEditingPreferences && (
              <button
                onClick={() => setIsEditingPreferences(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {isEditingPreferences ? (
            <div className="space-y-6">
              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={preferences.theme}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    theme: e.target.value as 'light' | 'dark' | 'system'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              {/* Notifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Notifications
                </label>
                <div className="space-y-3">
                  {Object.entries(preferences.notifications).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          notifications: {
                            ...preferences.notifications,
                            [key]: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Privacy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Privacy
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Profile Visibility</label>
                    <select
                      value={preferences.privacy.profileVisibility}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        privacy: {
                          ...preferences.privacy,
                          profileVisibility: e.target.value as 'public' | 'private' | 'friends'
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="private">Private</option>
                      <option value="friends">Friends Only</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferences.privacy.dataSharing}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        privacy: {
                          ...preferences.privacy,
                          dataSharing: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Allow data sharing for research</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSavePreferences}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </button>
                <button
                  onClick={() => {
                    setIsEditingPreferences(false);
                    setPreferences(user.preferences);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Theme</label>
                <p className="text-gray-900 capitalize">{preferences.theme}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Currency</label>
                <p className="text-gray-900">{preferences.display.currency}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Profile Visibility</label>
                <p className="text-gray-900 capitalize">{preferences.privacy.profileVisibility}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Notifications</label>
                <p className="text-gray-900">
                  {Object.entries(preferences.notifications)
                    .filter(([_, enabled]) => enabled)
                    .map(([key, _]) => key)
                    .join(', ') || 'None'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Export Your Data</h4>
                <p className="text-sm text-gray-600">Download a copy of all your data</p>
              </div>
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {isAdmin() && (
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <h4 className="font-medium text-red-900">Admin Actions</h4>
                  <p className="text-sm text-red-700">Advanced administrative functions</p>
                </div>
                <button
                  onClick={() => window.location.href = '/admin'}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
