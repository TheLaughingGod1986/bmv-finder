'use client';

import { useState, useEffect } from 'react';
import { getPWAManager, BeforeInstallPromptEvent } from '@/lib/pwa/pwaManager';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export default function PWAInstallPrompt({ onInstall, onDismiss }: PWAInstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [pwaStatus, setPwaStatus] = useState<any>(null);

  useEffect(() => {
    const pwaManager = getPWAManager();
    
    // Get initial status
    setPwaStatus(pwaManager.getStatus());

    // Listen for install prompt availability
    const handleInstallPromptAvailable = () => {
      setShowPrompt(true);
    };

    // Listen for installation
    const handleInstalled = () => {
      setShowPrompt(false);
      setPwaStatus(pwaManager.getStatus());
    };

    // Listen for install acceptance
    const handleInstallAccepted = () => {
      setIsInstalling(false);
      onInstall?.();
    };

    // Listen for install dismissal
    const handleInstallDismissed = () => {
      setShowPrompt(false);
      onDismiss?.();
    };

    // Add event listeners
    pwaManager.on('install-prompt-available', handleInstallPromptAvailable);
    pwaManager.on('installed', handleInstalled);
    pwaManager.on('install-accepted', handleInstallAccepted);
    pwaManager.on('install-dismissed', handleInstallDismissed);

    // Cleanup
    return () => {
      pwaManager.off('install-prompt-available', handleInstallPromptAvailable);
      pwaManager.off('installed', handleInstalled);
      pwaManager.off('install-accepted', handleInstallAccepted);
      pwaManager.off('install-dismissed', handleInstallDismissed);
    };
  }, [onInstall, onDismiss]);

  const handleInstall = async () => {
    setIsInstalling(true);
    const pwaManager = getPWAManager();
    await pwaManager.showInstallPrompt();
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onDismiss?.();
  };

  // Don't show if already installed or prompt not available
  if (!showPrompt || pwaStatus?.isInstalled || !pwaStatus?.canInstall) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">📱</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              Install BMV Finder
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Get quick access to property investments with our app. Install now for a better experience.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInstalling ? 'Installing...' : 'Install'}
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
