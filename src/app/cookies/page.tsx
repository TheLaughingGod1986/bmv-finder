'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Cookie, 
  Shield, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Info,
  Eye,
  Database,
  Globe,
  Target
} from 'lucide-react';

export default function CookiesPage() {
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });

  const cookieTypes = [
    {
      id: 'necessary',
      name: 'Necessary Cookies',
      description: 'Essential for the website to function properly. These cannot be disabled.',
      icon: Shield,
      required: true,
      examples: ['Authentication', 'Security', 'Basic functionality']
    },
    {
      id: 'analytics',
      name: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website.',
      icon: Database,
      required: false,
      examples: ['Page views', 'User behavior', 'Performance metrics']
    },
    {
      id: 'marketing',
      name: 'Marketing Cookies',
      description: 'Used to deliver relevant advertisements and track campaign performance.',
      icon: Target,
      required: false,
      examples: ['Ad targeting', 'Campaign tracking', 'Social media integration']
    },
    {
      id: 'preferences',
      name: 'Preference Cookies',
      description: 'Remember your settings and preferences for a better experience.',
      icon: Settings,
      required: false,
      examples: ['Language settings', 'Theme preferences', 'Customized content']
    }
  ];

  const handleCookieToggle = (cookieType: string) => {
    if (cookieType === 'necessary') return; // Cannot disable necessary cookies
    
    setCookiePreferences(prev => ({
      ...prev,
      [cookieType]: !prev[cookieType]
    }));
  };

  const savePreferences = () => {
    // Save preferences to localStorage
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences));
    // Show success message
    alert('Cookie preferences saved successfully!');
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    setCookiePreferences(allAccepted);
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
  };

  const rejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    setCookiePreferences(onlyNecessary);
    localStorage.setItem('cookiePreferences', JSON.stringify(onlyNecessary));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Cookie Policy
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Learn about how we use cookies and manage your preferences
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* What are Cookies */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Cookie className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">What are Cookies?</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Cookies are small text files that are stored on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and 
              understanding how you use our site.
            </p>
            <p className="text-gray-600">
              We use cookies to improve functionality, analyze usage patterns, and personalize content. 
              You can control which cookies you accept through the settings below.
            </p>
          </div>

          {/* Cookie Types */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Types of Cookies We Use</h2>
            
            <div className="space-y-6">
              {cookieTypes.map((cookieType, index) => (
                <motion.div
                  key={cookieType.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <cookieType.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cookieType.name}
                        </h3>
                        <p className="text-gray-600">{cookieType.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {cookieType.required ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Required
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCookieToggle(cookieType.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            cookiePreferences[cookieType.id as keyof typeof cookiePreferences]
                              ? 'bg-blue-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              cookiePreferences[cookieType.id as keyof typeof cookiePreferences]
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-12">
                    <h4 className="font-medium text-gray-900 mb-2">Examples:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {cookieType.examples.map((example, exampleIndex) => (
                        <li key={exampleIndex}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Cookie Management */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Your Cookie Preferences</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={acceptAll}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Accept All</span>
              </button>
              
              <button
                onClick={rejectAll}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                <XCircle className="w-5 h-5" />
                <span>Reject All</span>
              </button>
              
              <button
                onClick={savePreferences}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Save Preferences</span>
              </button>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Important Note</h3>
                  <p className="text-blue-800 text-sm">
                    Necessary cookies are required for the website to function properly and cannot be disabled. 
                    You can change your preferences at any time by visiting this page again.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Third Party Cookies */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Third-Party Cookies</h2>
            
            <p className="text-gray-600 mb-4">
              We may use third-party services that set their own cookies. These include:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Google Analytics</h3>
                <p className="text-gray-600 text-sm mb-2">
                  Helps us understand website usage and improve user experience.
                </p>
                <a href="https://policies.google.com/privacy" className="text-blue-600 text-sm hover:underline">
                  Google Privacy Policy →
                </a>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Google Maps</h3>
                <p className="text-gray-600 text-sm mb-2">
                  Provides interactive maps for property locations and market analysis.
                </p>
                <a href="https://policies.google.com/privacy" className="text-blue-600 text-sm hover:underline">
                  Google Privacy Policy →
                </a>
              </div>
            </div>
          </div>

          {/* Browser Settings */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browser Cookie Settings</h2>
            
            <p className="text-gray-600 mb-4">
              You can also control cookies through your browser settings. Here's how to manage cookies 
              in popular browsers:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Chrome</h3>
                <p className="text-gray-600 text-sm">
                  Settings → Privacy and security → Cookies and other site data
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Firefox</h3>
                <p className="text-gray-600 text-sm">
                  Options → Privacy & Security → Cookies and Site Data
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Safari</h3>
                <p className="text-gray-600 text-sm">
                  Preferences → Privacy → Manage Website Data
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Edge</h3>
                <p className="text-gray-600 text-sm">
                  Settings → Cookies and site permissions → Cookies and site data
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Questions About Cookies?
            </h3>
            <p className="text-gray-600 mb-6">
              If you have any questions about our cookie policy or how we use cookies, 
              please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:privacy@bmvfinder.com"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Contact Us
              </a>
              <a
                href="/privacy"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
