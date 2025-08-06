'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState('terms');

  const tabs = [
    { id: 'terms', label: 'Terms & Conditions' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'disclaimer', label: 'Financial Disclaimer' },
    { id: 'cookies', label: 'Cookie Policy' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Legal Information</h1>
            <p className="text-gray-600">
              Important legal information about using Property Intelligence Platform
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow p-8"
          >
            {activeTab === 'terms' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Terms & Conditions</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>Last updated:</strong> August 1, 2025</p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">1. Acceptance of Terms</h3>
                  <p>
                    By accessing and using Property Intelligence Platform, you accept and agree to be bound by the terms and provision of this agreement.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2. Use License</h3>
                  <p>
                    Permission is granted to temporarily download one copy of Property Intelligence Platform for personal, non-commercial transitory viewing only.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3. Disclaimer</h3>
                  <p>
                    The materials on Property Intelligence Platform are provided on an 'as is' basis. Property Intelligence Platform makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4. Limitations</h3>
                  <p>
                    In no event shall Property Intelligence Platform or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Property Intelligence Platform.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5. Revisions and Errata</h3>
                  <p>
                    The materials appearing on Property Intelligence Platform could include technical, typographical, or photographic errors. Property Intelligence Platform does not warrant that any of the materials on its website are accurate, complete or current.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>Last updated:</strong> August 1, 2025</p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">1. Information We Collect</h3>
                  <p>
                    We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2. How We Use Your Information</h3>
                  <p>
                    We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to develop new features.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3. Information Sharing</h3>
                  <p>
                    We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4. Data Security</h3>
                  <p>
                    We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5. Your Rights (GDPR)</h3>
                  <p>
                    Under GDPR, you have the right to access, rectify, erase, and restrict processing of your personal data. You also have the right to data portability and to object to processing.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'disclaimer' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Disclaimer</h2>
                <div className="space-y-4 text-gray-700">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-800 font-semibold">
                      ⚠️ IMPORTANT: This is not investment advice. Always consult with qualified professionals before making investment decisions.
                    </p>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">1. No Investment Advice</h3>
                  <p>
                    The information provided by Property Intelligence Platform is for educational and informational purposes only. It is not intended to be and should not be construed as investment advice, financial advice, or any other type of advice.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2. Risk Disclosure</h3>
                  <p>
                    Property investment involves substantial risk and is not suitable for all investors. The value of investments can go down as well as up, and you may lose some or all of your investment.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3. Past Performance</h3>
                  <p>
                    Past performance is not indicative of future results. Historical data and analysis should not be relied upon as a guarantee of future performance.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4. Professional Consultation</h3>
                  <p>
                    We strongly recommend consulting with qualified professionals including financial advisors, property surveyors, and legal professionals before making any investment decisions.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5. Data Accuracy</h3>
                  <p>
                    While we strive to provide accurate and up-to-date information, we cannot guarantee the accuracy, completeness, or timeliness of any data or analysis provided.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'cookies' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Cookie Policy</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>Last updated:</strong> August 1, 2025</p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">1. What Are Cookies</h3>
                  <p>
                    Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience and understand how you use our site.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2. How We Use Cookies</h3>
                  <p>
                    We use cookies to remember your preferences, analyze site traffic, and provide personalized content. We also use cookies for security purposes and to improve our services.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3. Types of Cookies We Use</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Essential cookies:</strong> Required for basic site functionality</li>
                    <li><strong>Analytics cookies:</strong> Help us understand how visitors use our site</li>
                    <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
                    <li><strong>Marketing cookies:</strong> Used for advertising and marketing purposes</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4. Managing Cookies</h3>
                  <p>
                    You can control and manage cookies through your browser settings. However, disabling certain cookies may affect the functionality of our website.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5. Third-Party Cookies</h3>
                  <p>
                    We may use third-party services that also place cookies on your device. These services have their own privacy policies and cookie policies.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 