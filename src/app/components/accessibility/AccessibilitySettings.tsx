'use client';

import { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Type, 
  Palette, 
  MousePointer, 
  Keyboard,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  RotateCcw
} from 'lucide-react';
import { useAccessibility } from '@/lib/accessibility/accessibilityManager';

interface AccessibilitySettingsProps {
  className?: string;
}

export default function AccessibilitySettings({ className = '' }: AccessibilitySettingsProps) {
  const { config, updateConfig, runAudit, announce } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [auditResults, setAuditResults] = useState<{
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } | null>(null);
  const [showAuditResults, setShowAuditResults] = useState(false);

  const handleConfigChange = (key: keyof typeof config, value: any) => {
    updateConfig({ [key]: value });
    announce(`Accessibility setting changed: ${key}`, 'polite');
  };

  const runAccessibilityAudit = () => {
    const results = runAudit();
    setAuditResults(results);
    setShowAuditResults(true);
    announce(`Accessibility audit completed. Found ${results.errors.length} errors and ${results.warnings.length} warnings.`, 'polite');
  };

  const resetToDefaults = () => {
    updateConfig({
      enableHighContrast: false,
      enableReducedMotion: false,
      enableScreenReader: true,
      enableKeyboardNavigation: true,
      enableFocusIndicators: true,
      fontSize: 'medium',
      colorScheme: 'light',
    });
    announce('Accessibility settings reset to defaults', 'polite');
  };

  return (
    <div className={`accessibility-settings ${className}`}>
      {/* Accessibility Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Open accessibility settings"
        title="Accessibility Settings"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Accessibility Settings
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close accessibility settings"
              >
                <EyeOff className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-6 max-h-96 overflow-y-auto">
            {/* Visual Settings */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Visual Settings
              </h3>
              
              <div className="space-y-3">
                {/* High Contrast */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                      High Contrast
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Increase contrast for better visibility
                    </p>
                  </div>
                  <button
                    onClick={() => handleConfigChange('enableHighContrast', !config.enableHighContrast)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.enableHighContrast ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                    aria-label={`${config.enableHighContrast ? 'Disable' : 'Enable'} high contrast`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.enableHighContrast ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Font Size
                  </label>
                  <select
                    value={config.fontSize}
                    onChange={(e) => handleConfigChange('fontSize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    aria-label="Select font size"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra-large">Extra Large</option>
                  </select>
                </div>

                {/* Color Scheme */}
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Color Scheme
                  </label>
                  <select
                    value={config.colorScheme}
                    onChange={(e) => handleConfigChange('colorScheme', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    aria-label="Select color scheme"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="high-contrast">High Contrast</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Motion Settings */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <MousePointer className="w-4 h-4 mr-2" />
                Motion Settings
              </h3>
              
              <div className="space-y-3">
                {/* Reduced Motion */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                      Reduced Motion
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Minimize animations and transitions
                    </p>
                  </div>
                  <button
                    onClick={() => handleConfigChange('enableReducedMotion', !config.enableReducedMotion)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.enableReducedMotion ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                    aria-label={`${config.enableReducedMotion ? 'Disable' : 'Enable'} reduced motion`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.enableReducedMotion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Settings */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <Keyboard className="w-4 h-4 mr-2" />
                Navigation Settings
              </h3>
              
              <div className="space-y-3">
                {/* Keyboard Navigation */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                      Keyboard Navigation
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enable keyboard shortcuts and navigation
                    </p>
                  </div>
                  <button
                    onClick={() => handleConfigChange('enableKeyboardNavigation', !config.enableKeyboardNavigation)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.enableKeyboardNavigation ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                    aria-label={`${config.enableKeyboardNavigation ? 'Disable' : 'Enable'} keyboard navigation`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.enableKeyboardNavigation ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Focus Indicators */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                      Focus Indicators
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Show visual focus indicators
                    </p>
                  </div>
                  <button
                    onClick={() => handleConfigChange('enableFocusIndicators', !config.enableFocusIndicators)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.enableFocusIndicators ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                    aria-label={`${config.enableFocusIndicators ? 'Disable' : 'Enable'} focus indicators`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.enableFocusIndicators ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Screen Reader Settings */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <Volume2 className="w-4 h-4 mr-2" />
                Screen Reader Settings
              </h3>
              
              <div className="space-y-3">
                {/* Screen Reader Support */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                      Screen Reader Support
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enable ARIA labels and announcements
                    </p>
                  </div>
                  <button
                    onClick={() => handleConfigChange('enableScreenReader', !config.enableScreenReader)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.enableScreenReader ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                    aria-label={`${config.enableScreenReader ? 'Disable' : 'Enable'} screen reader support`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.enableScreenReader ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <button
                  onClick={runAccessibilityAudit}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  aria-label="Run accessibility audit"
                >
                  Run Audit
                </button>
                <button
                  onClick={resetToDefaults}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  aria-label="Reset to default settings"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Results Modal */}
      {showAuditResults && auditResults && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Accessibility Audit Results
                </h3>
                <button
                  onClick={() => setShowAuditResults(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Close audit results"
                >
                  <EyeOff className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Errors */}
              {auditResults.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Errors ({auditResults.errors.length})
                  </h4>
                  <ul className="space-y-1">
                    {auditResults.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-600 dark:text-red-400">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {auditResults.warnings.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Warnings ({auditResults.warnings.length})
                  </h4>
                  <ul className="space-y-1">
                    {auditResults.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-600 dark:text-yellow-400">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {auditResults.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Suggestions ({auditResults.suggestions.length})
                  </h4>
                  <ul className="space-y-1">
                    {auditResults.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-blue-600 dark:text-blue-400">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* No Issues */}
              {auditResults.errors.length === 0 && auditResults.warnings.length === 0 && auditResults.suggestions.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    No accessibility issues found!
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                    Your page meets accessibility standards.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowAuditResults(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
