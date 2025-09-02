'use client';

import { useState, useEffect } from 'react';
import { User, UserPreferences, UserRole, Permission } from '@/lib/auth/productionAuth';

interface UserProfileProps {
  user: User;
  onUpdate: (updates: Partial<User>) => Promise<void>;
  onPasswordChange: (currentPassword: string, newPassword: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export default function UserProfile({ user, onUpdate, onPasswordChange, onLogout }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'subscription'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email
  });

  const [preferencesForm, setPreferencesForm] = useState({
    theme: user.preferences?.theme || 'auto',
    notifications: {
      email: user.preferences?.notifications?.email || true,
      push: user.preferences?.notifications?.push || false,
      sms: user.preferences?.notifications?.sms || false
    },
    privacy: {
      profileVisibility: user.preferences?.privacy?.profileVisibility || 'private',
      dataSharing: user.preferences?.privacy?.dataSharing || false
    },
    search: {
      defaultRadius: user.preferences?.search?.defaultRadius || 1,
      savedSearches: user.preferences?.search?.savedSearches || true
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onUpdate({
        name: profileForm.name,
        preferences: preferencesForm
      });
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onPasswordChange(passwordForm.currentPassword, passwordForm.newPassword);
      setSuccess('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800';
      case UserRole.PREMIUM:
        return 'bg-purple-100 text-purple-800';
      case UserRole.BASIC:
        return 'bg-blue-100 text-blue-800';
      case UserRole.TRIAL:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                  {user.role.toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubscriptionBadgeColor(user.subscriptionStatus)}`}>
                  {user.subscriptionStatus.toUpperCase()}
                </span>
                {user.isEmailVerified ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    VERIFIED
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    UNVERIFIED
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'preferences', label: 'Preferences', icon: '⚙️' },
              { id: 'security', label: 'Security', icon: '🔒' },
              { id: 'subscription', label: 'Subscription', icon: '💳' }
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
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setProfileForm({ name: user.name, email: user.email });
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProfileUpdate}
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Member since:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last login:</span>
                    <span className="ml-2 text-gray-900">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Role:</span>
                    <span className="ml-2 text-gray-900">{user.role}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 text-gray-900">{user.subscriptionStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Preferences</h2>
              
              <div className="space-y-6">
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Theme
                  </label>
                  <div className="flex space-x-4">
                    {[
                      { value: 'light', label: 'Light', icon: '☀️' },
                      { value: 'dark', label: 'Dark', icon: '🌙' },
                      { value: 'auto', label: 'Auto', icon: '🔄' }
                    ].map((theme) => (
                      <label key={theme.value} className="flex items-center">
                        <input
                          type="radio"
                          name="theme"
                          value={theme.value}
                          checked={preferencesForm.theme === theme.value}
                          onChange={(e) => setPreferencesForm({
                            ...preferencesForm,
                            theme: e.target.value as 'light' | 'dark' | 'auto'
                          })}
                          className="sr-only"
                        />
                        <div className={`px-4 py-2 border rounded-md cursor-pointer transition-colors ${
                          preferencesForm.theme === theme.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          <span className="mr-2">{theme.icon}</span>
                          {theme.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Notifications
                  </label>
                  <div className="space-y-3">
                    {[
                      { key: 'email', label: 'Email notifications', description: 'Receive updates via email' },
                      { key: 'push', label: 'Push notifications', description: 'Receive browser push notifications' },
                      { key: 'sms', label: 'SMS notifications', description: 'Receive text message alerts' }
                    ].map((notification) => (
                      <div key={notification.key} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{notification.label}</div>
                          <div className="text-sm text-gray-500">{notification.description}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferencesForm.notifications[notification.key as keyof typeof preferencesForm.notifications]}
                            onChange={(e) => setPreferencesForm({
                              ...preferencesForm,
                              notifications: {
                                ...preferencesForm.notifications,
                                [notification.key]: e.target.checked
                              }
                            })}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            preferencesForm.notifications[notification.key as keyof typeof preferencesForm.notifications]
                              ? 'bg-blue-600'
                              : 'bg-gray-200'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              preferencesForm.notifications[notification.key as keyof typeof preferencesForm.notifications]
                                ? 'translate-x-5'
                                : 'translate-x-0.5'
                            } mt-0.5`} />
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Privacy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Privacy Settings
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Profile Visibility</div>
                        <div className="text-sm text-gray-500">Control who can see your profile</div>
                      </div>
                      <select
                        value={preferencesForm.privacy.profileVisibility}
                        onChange={(e) => setPreferencesForm({
                          ...preferencesForm,
                          privacy: {
                            ...preferencesForm.privacy,
                            profileVisibility: e.target.value as 'public' | 'private'
                          }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Data Sharing</div>
                        <div className="text-sm text-gray-500">Allow anonymous usage data collection</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferencesForm.privacy.dataSharing}
                          onChange={(e) => setPreferencesForm({
                            ...preferencesForm,
                            privacy: {
                              ...preferencesForm.privacy,
                              dataSharing: e.target.checked
                            }
                          })}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${
                          preferencesForm.privacy.dataSharing ? 'bg-blue-600' : 'bg-gray-200'
                        }`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            preferencesForm.privacy.dataSharing ? 'translate-x-5' : 'translate-x-0.5'
                          } mt-0.5`} />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Search Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Search Preferences
                  </label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Default Search Radius: {preferencesForm.search.defaultRadius} miles
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={preferencesForm.search.defaultRadius}
                        onChange={(e) => setPreferencesForm({
                          ...preferencesForm,
                          search: {
                            ...preferencesForm.search,
                            defaultRadius: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Save Search History</div>
                        <div className="text-sm text-gray-500">Remember your previous searches</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferencesForm.search.savedSearches}
                          onChange={(e) => setPreferencesForm({
                            ...preferencesForm,
                            search: {
                              ...preferencesForm.search,
                              savedSearches: e.target.checked
                            }
                          })}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${
                          preferencesForm.search.savedSearches ? 'bg-blue-600' : 'bg-gray-200'
                        }`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            preferencesForm.search.savedSearches ? 'translate-x-5' : 'translate-x-0.5'
                          } mt-0.5`} />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Security</h2>
              
              <div className="space-y-6">
                {/* Change Password */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handlePasswordChange}
                      disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                {/* Security Information */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Security Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Email Verification:</span>
                      <span className={`font-medium ${user.isEmailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                        {user.isEmailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Two-Factor Authentication:</span>
                      <span className="text-gray-900">Not enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Last Password Change:</span>
                      <span className="text-gray-900">Never</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Subscription</h2>
              
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.role === UserRole.ADMIN ? 'Admin Plan' :
                         user.role === UserRole.PREMIUM ? 'Premium Plan' :
                         user.role === UserRole.BASIC ? 'Basic Plan' : 'Trial Plan'}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {user.role === UserRole.ADMIN ? 'Full access to all features' :
                         user.role === UserRole.PREMIUM ? 'Advanced features and analytics' :
                         user.role === UserRole.BASIC ? 'Standard features' : 'Limited trial access'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {user.role === UserRole.ADMIN ? 'Free' :
                         user.role === UserRole.PREMIUM ? '£29.99' :
                         user.role === UserRole.BASIC ? '£9.99' : 'Free'}
                      </div>
                      <div className="text-sm text-gray-500">per month</div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Plan Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.permissions.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">
                          {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscription Status */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Subscription Status</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`font-medium ${
                        user.subscriptionStatus === 'active' ? 'text-green-600' :
                        user.subscriptionStatus === 'trial' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1)}
                      </span>
                    </div>
                    {user.subscriptionExpiresAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Expires:</span>
                        <span className="text-gray-900">
                          {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200">
                  {user.role === UserRole.TRIAL && (
                    <button className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                      Upgrade to Premium
                    </button>
                  )}
                  {user.role === UserRole.BASIC && (
                    <button className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors">
                      Upgrade to Premium
                    </button>
                  )}
                  {user.role === UserRole.PREMIUM && (
                    <button className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors">
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
