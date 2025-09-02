'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Wifi } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      // Check if running in standalone mode
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsStandalone(standalone);
      
      // Check if app is installed (for iOS)
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(isIOSDevice);
      
      if (isIOSDevice) {
        // Check if already added to home screen
        const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
        setIsInstalled(isInStandaloneMode);
      } else {
        setIsInstalled(standalone);
      }
    };

    checkInstallStatus();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay (not immediately)
      setTimeout(() => {
        if (!isInstalled && !localStorage.getItem('pwa-install-dismissed')) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA install accepted');
      } else {
        console.log('PWA install dismissed');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleIOSInstall = () => {
    // For iOS, we show instructions instead of triggering install
    setShowPrompt(false);
    // You could show a modal with iOS-specific instructions here
  };

  // Don't show if already installed or in standalone mode
  if (isInstalled || isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              {isIOS ? (
                <Smartphone className="w-5 h-5 text-white" />
              ) : (
                <Download className="w-5 h-5 text-white" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {isIOS ? 'Add to Home Screen' : 'Install App'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isIOS 
                ? 'Get quick access to BMV Finder from your home screen'
                : 'Install BMV Finder for a better experience'
              }
            </p>

            {/* iOS Instructions */}
            {isIOS && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                    How to install:
                  </span>
                </div>
                <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                  <li>1. Tap the Share button</li>
                  <li>2. Scroll down and tap "Add to Home Screen"</li>
                  <li>3. Tap "Add" to confirm</li>
                </ol>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 mt-3">
              {isIOS ? (
                <button
                  onClick={handleIOSInstall}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Got it
                </button>
              ) : (
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Install
                </button>
              )}
              
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for PWA install status
export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      return outcome === 'accepted';
    }
    return false;
  };

  return {
    isInstallable,
    isInstalled,
    install,
  };
}