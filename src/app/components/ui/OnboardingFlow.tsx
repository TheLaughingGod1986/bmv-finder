'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XMarkIcon, 
  ArrowRightIcon, 
  ArrowLeftIcon,
  HomeIcon,
  ChartBarIcon,
  BellIcon,
  CogIcon,
  UserIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  skipable?: boolean;
}

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userId?: string;
}

export default function OnboardingFlow({
  isOpen,
  onClose,
  onComplete,
  userId = 'user-123'
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Property Intelligence',
      description: 'Your comprehensive property investment platform',
      icon: <HomeIcon className="w-8 h-8 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HomeIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
            <p className="text-gray-600">
              Let's get you started with your property investment journey. 
              This quick tour will show you the key features and how to make the most of the platform.
            </p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <LightBulbIcon className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">What you'll learn:</h4>
                <ul className="text-sm text-blue-800 mt-1 space-y-1">
                  <li>• How to search and analyze properties</li>
                  <li>• Understanding BMV scores and market data</li>
                  <li>• Setting up alerts and notifications</li>
                  <li>• Managing your portfolio</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'Get Started',
        onClick: () => nextStep()
      }
    },
    {
      id: 'property-search',
      title: 'Property Search & Analysis',
      description: 'Learn how to find and analyze investment opportunities',
      icon: <ChartBarIcon className="w-8 h-8 text-green-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Property Search Features:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Search by postcode, area, or property type</li>
              <li>• Filter by price range, bedrooms, and property features</li>
              <li>• View detailed property information and market data</li>
              <li>• Compare properties side by side</li>
            </ul>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">BMV Score Explained:</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">90-100%</span>
                <div className="w-20 h-2 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Excellent</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">80-89%</span>
                <div className="w-20 h-2 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-600">Very Good</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">70-79%</span>
                <div className="w-20 h-2 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-600">Good</span>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'Try Search',
        onClick: () => {
          // Navigate to search page
          window.location.href = '/search';
        }
      }
    },
    {
      id: 'alerts',
      title: 'Smart Alerts & Notifications',
      description: 'Stay informed about market opportunities',
      icon: <BellIcon className="w-8 h-8 text-purple-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Alert Types:</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• <strong>BMV Alerts:</strong> Properties below market value</li>
              <li>• <strong>Price Drops:</strong> Properties with reduced prices</li>
              <li>• <strong>New Listings:</strong> Fresh properties in your areas</li>
              <li>• <strong>Market Updates:</strong> Regional market trends</li>
            </ul>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">Notification Preferences:</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Notifications</span>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Push Notifications</span>
                <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'Set Up Alerts',
        onClick: () => {
          // Navigate to alerts page
          window.location.href = '/alerts';
        }
      }
    },
    {
      id: 'portfolio',
      title: 'Portfolio Management',
      description: 'Track and analyze your property investments',
      icon: <ChartBarIcon className="w-8 h-8 text-indigo-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <h4 className="font-medium text-indigo-900 mb-2">Portfolio Features:</h4>
            <ul className="text-sm text-indigo-800 space-y-1">
              <li>• Add properties to your portfolio</li>
              <li>• Track performance and returns</li>
              <li>• Generate detailed reports</li>
              <li>• Monitor market value changes</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">£2.4M</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">+12.5%</div>
              <div className="text-sm text-gray-600">Annual Return</div>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'View Portfolio',
        onClick: () => {
          // Navigate to portfolio page
          window.location.href = '/portfolio';
        }
      }
    },
    {
      id: 'settings',
      title: 'Customize Your Experience',
      description: 'Personalize your dashboard and preferences',
      icon: <CogIcon className="w-8 h-8 text-gray-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Customization Options:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Choose your preferred areas and property types</li>
              <li>• Set investment criteria and budget ranges</li>
              <li>• Customize dashboard layout and widgets</li>
              <li>• Configure notification preferences</li>
            </ul>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">Quick Setup:</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Investment areas selected</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Budget range configured</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">Notification preferences</span>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'Open Settings',
        onClick: () => {
          // Navigate to settings page
          window.location.href = '/settings';
        }
      }
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Start exploring your property investment opportunities',
      icon: <CheckCircleIcon className="w-8 h-8 text-green-600" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
            <p className="text-gray-600">
              You've completed the onboarding process. You now have access to all the powerful 
              features of Property Intelligence.
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">What's Next?</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Start searching for properties in your target areas</li>
              <li>• Set up alerts for new opportunities</li>
              <li>• Explore market trends and data</li>
              <li>• Build your property portfolio</li>
            </ul>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Need help? Check out our <a href="/help" className="text-blue-600 hover:underline">help center</a> 
              or contact our support team.
            </p>
          </div>
        </div>
      ),
      action: {
        label: 'Start Exploring',
        onClick: () => {
          onComplete();
          window.location.href = '/dashboard';
        }
      }
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setCompletedSteps(prev => new Set([...prev, steps[currentStep].id]));
        setIsAnimating(false);
      }, 300);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const skipStep = () => {
    if (steps[currentStep].skipable) {
      nextStep();
    }
  };

  const skipAll = () => {
    onComplete();
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {currentStepData.icon}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{currentStepData.title}</h2>
              <p className="text-sm text-gray-600">{currentStepData.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={skipAll}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip Tour
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className={`transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            {currentStepData.content}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className="flex items-center space-x-3">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Previous</span>
              </button>
            )}
            
            {currentStepData.action && (
              <button
                onClick={currentStepData.action.onClick}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>{currentStepData.action.label}</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            )}
            
            {!currentStepData.action && currentStep < steps.length - 1 && (
              <button
                onClick={nextStep}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Next</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
