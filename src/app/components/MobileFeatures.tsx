'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  BarChart3, 
  Calculator, 
  Search, 
  Home as HomeIcon, 
  Target, 
  Award, 
  Shield, 
  Zap, 
  Clock, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  Star, 
  MapPin, 
  PoundSterling, 
  ChartBar, 
  FileText, 
  Building, 
  Eye,
  Smartphone,
  Monitor,
  Download,
  AlertCircle
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
  }
}

const features = [
  {
    icon: Search,
    title: "Smart Property Search",
    description: "Find properties by address, postcode, or area with instant results",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: TrendingUp,
    title: "BMV Analysis",
    description: "AI-powered below market value scoring for investment opportunities",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: BarChart3,
    title: "Market Trends",
    description: "Real-time market analysis and price trend predictions",
    color: "from-orange-500 to-orange-600"
  },
  {
    icon: Calculator,
    title: "Deal Calculator",
    description: "Calculate ROI, yields, and investment returns instantly",
    color: "from-emerald-500 to-green-600"
  },
  {
    icon: Eye,
    title: "Property Watchlist",
    description: "Save and track properties of interest with Chrome extension",
    color: "from-teal-500 to-teal-600"
  },
  {
    icon: Building,
    title: "Portfolio Tracker",
    description: "Track your property investments and performance",
    color: "from-red-500 to-red-600"
  },
  {
    icon: FileText,
    title: "Professional Reports",
    description: "Generate detailed property analysis reports",
    color: "from-indigo-500 to-indigo-600"
  }
];

const mobileFeatures = [
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Fully responsive design works perfectly on all devices",
    color: "from-blue-500 to-purple-600"
  },
  {
    icon: Download,
    title: "Install as App",
    description: "Add to home screen for app-like experience",
    color: "from-green-500 to-teal-600"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed with instant search results",
    color: "from-orange-500 to-red-600"
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is protected with enterprise-grade security",
    color: "from-indigo-500 to-blue-600"
  }
];

export default function MobileFeatures() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
      } else {
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Professional Property Tools
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to make informed property investment decisions
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Mobile Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
              Available as a Web App
            </h3>
            <p className="text-blue-100 text-lg">
                              Install Property Intelligence Platform on your device for the best experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mobileFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-2 text-white">
                  {feature.title}
                </h4>
                <p className="text-blue-100 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Install CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            {showInstallButton ? (
              <button 
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5 inline mr-2" />
                {isInstalling ? 'Installing...' : 'Install Web App'}
              </button>
            ) : (
              <div className="text-center">
                <p className="text-blue-100 text-sm mb-2">
                  Use &ldquo;Add to Home Screen&rdquo; in your browser menu
                </p>
                <div className="flex items-center justify-center gap-2 text-blue-100 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>Native iOS & Android apps coming soon!</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
} 