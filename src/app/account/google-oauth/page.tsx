'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Settings, 
  User, 
  Shield, 
  Key, 
  Globe,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import GoogleOAuthSettings from '@/app/components/auth/GoogleOAuthSettings';
import { useGoogleOAuth } from '@/lib/auth/googleOAuth';

export default function GoogleOAuthAccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isConfigured } = useGoogleOAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'info'>('settings');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Google OAuth Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your Google account integration
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                isConfigured 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                <Settings className={`w-6 h-6 ${
                  isConfigured 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Configuration</p>
                <p className={`text-lg font-bold ${
                  isConfigured 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {isConfigured ? 'Configured' : 'Not Configured'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                isAuthenticated 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : 'bg-gray-100 dark:bg-gray-900/20'
              }`}>
                <User className={`w-6 h-6 ${
                  isAuthenticated 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Authentication</p>
                <p className={`text-lg font-bold ${
                  isAuthenticated 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {isAuthenticated ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Security</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  OAuth 2.0
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'info', label: 'Information', icon: Info },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  aria-label={`Switch to ${tab.label} tab`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'settings' && (
          <GoogleOAuthSettings />
        )}

        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* OAuth Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Google OAuth Information
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Learn about Google OAuth integration
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    What is Google OAuth?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Google OAuth 2.0 allows you to sign in to BMV Finder using your Google account, 
                    providing a secure and convenient authentication method without creating a separate password.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Benefits of Google OAuth
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Secure authentication using Google's infrastructure</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>No need to remember another password</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Automatic profile information sync</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Two-factor authentication support</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Data Privacy
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    When you sign in with Google, we only access your basic profile information 
                    (name, email, and profile picture). We do not access your Google Drive, 
                    Gmail, or any other Google services.
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Technical Details
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    OAuth 2.0 implementation details
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      OAuth Flow
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Authorization Code Flow with PKCE
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Scopes
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      openid, email, profile
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Token Type
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      JWT (JSON Web Token)
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Provider
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Google Identity Platform
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Troubleshooting
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Common issues and solutions
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Sign-in Issues
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Make sure you're using a supported browser</li>
                    <li>• Check that pop-ups are not blocked</li>
                    <li>• Clear your browser cache and cookies</li>
                    <li>• Try signing out and signing back in</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Profile Issues
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Profile information is synced from your Google account</li>
                    <li>• Changes to your Google profile may take time to reflect</li>
                    <li>• Contact support if profile information is incorrect</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
