'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Eye, 
  Keyboard, 
  Volume2, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  TestTube,
  Settings,
  FileText,
  Users
} from 'lucide-react';
import AccessibilitySettings from '@/app/components/accessibility/AccessibilitySettings';
import AccessibleForm from '@/app/components/accessibility/AccessibleForm';
import { useAccessibility } from '@/lib/accessibility/accessibilityManager';

export default function AccessibilityTestingPage() {
  const router = useRouter();
  const { config, runAudit, announce } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'overview' | 'testing' | 'form' | 'settings'>('overview');
  const [auditResults, setAuditResults] = useState<{
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } | null>(null);

  const runAccessibilityAudit = () => {
    const results = runAudit();
    setAuditResults(results);
    announce(`Accessibility audit completed. Found ${results.errors.length} errors and ${results.warnings.length} warnings.`, 'polite');
  };

  const handleFormSubmit = (data: Record<string, string>) => {
    console.log('Form submitted:', data);
    announce('Form submitted successfully', 'polite');
  };

  const formFields = [
    {
      id: 'name',
      label: 'Full Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter your full name',
      description: 'Your first and last name',
      validation: {
        minLength: 2,
        maxLength: 50,
      },
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email' as const,
      required: true,
      placeholder: 'Enter your email address',
      description: 'We will use this to contact you',
    },
    {
      id: 'phone',
      label: 'Phone Number',
      type: 'tel' as const,
      required: false,
      placeholder: 'Enter your phone number',
      description: 'Optional contact number',
    },
    {
      id: 'password',
      label: 'Password',
      type: 'password' as const,
      required: true,
      placeholder: 'Enter your password',
      description: 'Must be at least 8 characters long',
      validation: {
        minLength: 8,
      },
    },
    {
      id: 'role',
      label: 'Role',
      type: 'select' as const,
      required: true,
      description: 'Select your primary role',
      options: [
        { value: 'investor', label: 'Property Investor' },
        { value: 'agent', label: 'Real Estate Agent' },
        { value: 'developer', label: 'Property Developer' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      id: 'message',
      label: 'Message',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Tell us about your needs...',
      description: 'Optional message about your requirements',
      validation: {
        maxLength: 500,
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  Accessibility Testing
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Test and improve accessibility features
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'testing', label: 'Testing', icon: TestTube },
              { id: 'form', label: 'Form Demo', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings },
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Current Accessibility Settings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${config.enableHighContrast ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">High Contrast</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${config.enableReducedMotion ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Reduced Motion</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${config.enableScreenReader ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Screen Reader</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${config.enableKeyboardNavigation ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Keyboard Navigation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${config.enableFocusIndicators ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Focus Indicators</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Font Size: {config.fontSize}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={runAccessibilityAudit}
                  className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  aria-label="Run accessibility audit"
                >
                  <TestTube className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Run Audit</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('form')}
                  className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  aria-label="Test accessible form"
                >
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Test Form</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  aria-label="Open accessibility settings"
                >
                  <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Settings</span>
                </button>
                
                <button
                  onClick={() => announce('This is a test announcement for screen readers', 'polite')}
                  className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  aria-label="Test screen reader announcement"
                >
                  <Volume2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Test Audio</span>
                </button>
              </div>
            </div>

            {/* Accessibility Guidelines */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Accessibility Guidelines
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    WCAG 2.1 AA Standards
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Perceivable - Information must be presentable in ways users can perceive</li>
                    <li>• Operable - Interface components must be operable by all users</li>
                    <li>• Understandable - Information and UI operation must be understandable</li>
                    <li>• Robust - Content must be robust enough for various assistive technologies</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Key Features
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Keyboard navigation support</li>
                    <li>• Screen reader compatibility</li>
                    <li>• High contrast mode</li>
                    <li>• Reduced motion preferences</li>
                    <li>• Focus indicators</li>
                    <li>• ARIA labels and descriptions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Accessibility Testing Tools
              </h2>
              
              <div className="space-y-4">
                <button
                  onClick={runAccessibilityAudit}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  aria-label="Run comprehensive accessibility audit"
                >
                  Run Full Accessibility Audit
                </button>
                
                {auditResults && (
                  <div className="mt-6 space-y-4">
                    {auditResults.errors.length > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                          <h3 className="font-medium text-red-800 dark:text-red-200">
                            Errors ({auditResults.errors.length})
                          </h3>
                        </div>
                        <ul className="space-y-1">
                          {auditResults.errors.map((error, index) => (
                            <li key={index} className="text-sm text-red-700 dark:text-red-300">
                              • {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {auditResults.warnings.length > 0 && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                          <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                            Warnings ({auditResults.warnings.length})
                          </h3>
                        </div>
                        <ul className="space-y-1">
                          {auditResults.warnings.map((warning, index) => (
                            <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                              • {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {auditResults.suggestions.length > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h3 className="font-medium text-blue-800 dark:text-blue-200">
                            Suggestions ({auditResults.suggestions.length})
                          </h3>
                        </div>
                        <ul className="space-y-1">
                          {auditResults.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-blue-700 dark:text-blue-300">
                              • {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {auditResults.errors.length === 0 && auditResults.warnings.length === 0 && auditResults.suggestions.length === 0 && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <p className="text-green-800 dark:text-green-200 font-medium">
                          No accessibility issues found!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'form' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Accessible Form Demo
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This form demonstrates accessibility features including proper labeling, validation, and screen reader support.
              </p>
              
              <AccessibleForm
                fields={formFields}
                onSubmit={handleFormSubmit}
                submitLabel="Submit Form"
              />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Accessibility Settings
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Configure accessibility features to match your needs and preferences.
              </p>
              
              <AccessibilitySettings />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
