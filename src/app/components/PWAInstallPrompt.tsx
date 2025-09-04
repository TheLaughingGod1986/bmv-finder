'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  X, 
  Smartphone, 
  Monitor, 
  Tablet,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { mobileOptimizer } from '@/lib/mobile/mobileOptimizer';

interface PWAInstallPromptProps {
  className?: string;
}

export default function PWAInstallPrompt({ className = '' }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    // Get device information
    const info = mobileOptimizer.getDeviceInfo();
    setDeviceInfo(info);

    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check for iOS standalone mode
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after a delay (not immediately)
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 5000);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleManualInstall = () => {
    // Show manual install instructions
    setShowPrompt(false);
    // You could show a modal with manual install instructions here
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  const getDeviceIcon = () => {
    if (!deviceInfo) return <Monitor className="w-6 h-6" />;
    
    switch (deviceInfo.type) {
      case 'mobile':
        return <Smartphone className="w-6 h-6" />;
      case 'tablet':
        return <Tablet className="w-6 h-6" />;
      default:
        return <Monitor className="w-6 h-6" />;
    }
  };

  const getInstallText = () => {
    if (!deviceInfo) return 'Install BMV Finder';
    
    switch (deviceInfo.type) {
      case 'mobile':
        return 'Install BMV Finder App';
      case 'tablet':
        return 'Install BMV Finder';
      default:
        return 'Install BMV Finder';
    }
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-sm mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  {getDeviceIcon()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Install App</h3>
                  <p className="text-sm text-gray-600">Get the full experience</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Benefits */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Faster loading and offline access</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Push notifications for property alerts</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Native app-like experience</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleInstall}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>{getInstallText()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleManualInstall}
                className="w-full text-gray-600 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
              >
                Show installation instructions
              </button>
            </div>

            {/* Device-specific info */}
            {deviceInfo && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Optimized for {deviceInfo.type} • {deviceInfo.os} • {deviceInfo.browser}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}