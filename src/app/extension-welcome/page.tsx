'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DownloadIcon, 
  HomeIcon, 
  ShieldIcon, 
  ZapIcon,
  CheckCircleIcon,
  StarIcon,
  ChromeIcon,
  ArrowRightIcon,
  PlayIcon,
  UsersIcon,
  LockIcon,
  GlobeIcon,
  XCircleIcon
} from 'lucide-react';

export default function ExtensionWelcomePage() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: 'Download Extension',
      description: 'Get our Chrome extension from the Chrome Web Store',
      icon: DownloadIcon
    },
    {
      id: 2,
      title: 'Sign In',
      description: 'Connect your Property Intelligence Platform account to the extension',
      icon: ShieldIcon
    },
    {
      id: 3,
      title: 'Start Capturing',
      description: 'Browse property websites and capture properties with one click',
      icon: HomeIcon
    }
  ];

  const features = [
    {
      icon: ZapIcon,
      title: 'One-Click Capture',
      description: 'Capture property details from Rightmove, Zoopla, OnTheMarket, and PrimeLocation with a single click.'
    },
    {
      icon: LockIcon,
      title: 'Secure & Private',
      description: 'Your data is encrypted and stored securely. We never share your captured properties with third parties.'
    },
    {
      icon: UsersIcon,
      title: 'Personal Watchlist',
      description: 'Build your own personal watchlist of properties you\'re interested in, all in one place.'
    },
    {
      icon: GlobeIcon,
      title: 'Cross-Platform',
      description: 'Access your watchlist from anywhere - web, mobile, or desktop. Your data syncs across all devices.'
    }
  ];

  const benefits = [
    'Save time by capturing properties instantly',
    'Never lose track of interesting properties',
    'Compare properties side by side',
    'Track price changes over time',
    'Organize properties by status and location',
    'Export data for further analysis'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
              <ChromeIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Property Intelligence Platform Chrome Extension
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Capture properties from your favorite real estate websites and build your personal watchlist. 
              Never miss a potential investment opportunity again.
            </p>
          </motion.div>
        </div>

        {/* Installation Steps */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Get Started in 3 Simple Steps</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="bg-white rounded-lg shadow-lg p-8 text-center h-full">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                      <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ArrowRightIcon className="h-8 w-8 text-blue-400" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Download Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
              <p className="text-lg text-gray-600 mb-8">
                Download our Chrome extension and start capturing properties today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="#"
                  className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <DownloadIcon className="h-5 w-5 mr-2" />
                  Download for Chrome
                </a>
                
                <button
                  onClick={() => document.getElementById('demo-video')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Watch Demo
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                Free to install • Works with Chrome, Edge, and other Chromium-based browsers
              </p>
            </motion.div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Choose Our Extension?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-lg p-8"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Benefits */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
            <h2 className="text-3xl font-bold text-center mb-8">Key Benefits</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <CheckCircleIcon className="h-5 w-5 text-green-300 flex-shrink-0" />
                  <span>{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo Video Section */}
        <div id="demo-video" className="max-w-4xl mx-auto mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">See It In Action</h2>
            
            <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PlayIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Demo video coming soon</p>
                <p className="text-sm text-gray-500">Watch how easy it is to capture properties</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Choose Your Plan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <p className="text-gray-600 mb-6">Perfect for getting started</p>
                
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span>Install extension</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span>Basic property analysis</span>
                  </li>
                  <li className="flex items-center">
                    <XCircleIcon className="h-5 w-5 text-red-500 mr-3" />
                    <span className="text-gray-500">Property capture</span>
                  </li>
                  <li className="flex items-center">
                    <XCircleIcon className="h-5 w-5 text-red-500 mr-3" />
                    <span className="text-gray-500">Watchlist access</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Mid-Tier */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500 relative"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Mid-Tier</h3>
                <p className="text-gray-600 mb-6">For active property investors</p>
                
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span>Capture up to 50 properties</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span>Full watchlist access</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span>Property status tracking</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Premium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white rounded-lg shadow-lg p-8 border-2 border-yellow-500"
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <h3 className="text-2xl font-bold text-gray-900">Premium</h3>
                </div>
                <p className="text-gray-600 mb-6">For professional investors</p>
                
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span>Everything in Mid-Tier</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span>Unlimited property captures</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span>Data export capabilities</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Transform Your Property Search?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of property investors who are already using our extension to find their next investment.
            </p>
            
            <a
              href="#"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              <DownloadIcon className="h-6 w-6 mr-2" />
              Get Started Now
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 