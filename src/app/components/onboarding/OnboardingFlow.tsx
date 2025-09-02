'use client';

import { useState, useEffect } from 'react';
import { User, UserPreferences } from '@/lib/auth/productionAuth';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<OnboardingStepProps>;
  required: boolean;
  completed: boolean;
}

interface OnboardingStepProps {
  user: User;
  onComplete: (data: any) => void;
  onSkip: () => void;
  onBack: () => void;
}

interface OnboardingFlowProps {
  user: User;
  onComplete: (user: User) => void;
  onSkip: () => void;
}

// Step 1: Welcome
function WelcomeStep({ user, onComplete, onSkip }: OnboardingStepProps) {
  return (
    <div className="text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to BMV Finder, {user.name}!
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Let's get you set up with the perfect property investment experience. 
        This quick setup will help us personalize your dashboard and show you the most relevant properties.
      </p>
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => onComplete({})}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Get Started
        </button>
        <button
          onClick={onSkip}
          className="px-8 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Skip Setup
        </button>
      </div>
    </div>
  );
}

// Step 2: Investment Goals
function InvestmentGoalsStep({ user, onComplete, onBack }: OnboardingStepProps) {
  const [goals, setGoals] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [experience, setExperience] = useState('');

  const goalOptions = [
    { id: 'first-time', label: 'First-time investor', description: 'Looking to start building a property portfolio' },
    { id: 'portfolio-growth', label: 'Portfolio growth', description: 'Expanding existing property investments' },
    { id: 'passive-income', label: 'Passive income', description: 'Generating rental income from properties' },
    { id: 'flipping', label: 'Property flipping', description: 'Buying, renovating, and selling properties' },
    { id: 'retirement', label: 'Retirement planning', description: 'Long-term wealth building for retirement' }
  ];

  const budgetOptions = [
    { value: 'under-100k', label: 'Under £100,000' },
    { value: '100k-250k', label: '£100,000 - £250,000' },
    { value: '250k-500k', label: '£250,000 - £500,000' },
    { value: '500k-1m', label: '£500,000 - £1,000,000' },
    { value: 'over-1m', label: 'Over £1,000,000' }
  ];

  const experienceOptions = [
    { value: 'beginner', label: 'Beginner', description: 'New to property investment' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some experience with property investment' },
    { value: 'advanced', label: 'Advanced', description: 'Experienced property investor' },
    { value: 'expert', label: 'Expert', description: 'Professional property investor' }
  ];

  const handleGoalToggle = (goalId: string) => {
    setGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleComplete = () => {
    onComplete({
      investmentGoals: goals,
      budget,
      experience
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Investment Goals</h2>
        <p className="text-gray-600">Tell us about your property investment objectives</p>
      </div>

      <div className="space-y-8">
        {/* Investment Goals */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What are your main investment goals?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goalOptions.map((goal) => (
              <label
                key={goal.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  goals.includes(goal.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={goals.includes(goal.id)}
                  onChange={() => handleGoalToggle(goal.id)}
                  className="sr-only"
                />
                <div className="font-medium text-gray-900">{goal.label}</div>
                <div className="text-sm text-gray-600">{goal.description}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What's your typical investment budget?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {budgetOptions.map((option) => (
              <label
                key={option.value}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  budget === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="budget"
                  value={option.value}
                  checked={budget === option.value}
                  onChange={(e) => setBudget(e.target.value)}
                  className="sr-only"
                />
                <div className="font-medium text-gray-900">{option.label}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What's your investment experience level?</h3>
          <div className="space-y-3">
            {experienceOptions.map((option) => (
              <label
                key={option.value}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  experience === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="experience"
                  value={option.value}
                  checked={experience === option.value}
                  onChange={(e) => setExperience(e.target.value)}
                  className="sr-only"
                />
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleComplete}
          disabled={goals.length === 0 || !budget || !experience}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// Step 3: Location Preferences
function LocationPreferencesStep({ user, onComplete, onBack }: OnboardingStepProps) {
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);
  const [searchRadius, setSearchRadius] = useState(5);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

  const areaOptions = [
    'London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Sheffield',
    'Bristol', 'Nottingham', 'Leicester', 'Coventry', 'Bradford', 'Cardiff',
    'Belfast', 'Newcastle', 'Brighton', 'Hull', 'Plymouth', 'Stoke-on-Trent',
    'Wolverhampton', 'Derby', 'Southampton', 'Swansea', 'Southend-on-Sea',
    'Salford', 'Aberdeen', 'Westminster', 'Portsmouth', 'York', 'Peterborough'
  ];

  const propertyTypeOptions = [
    { id: 'house', label: 'House', description: 'Detached, semi-detached, terraced' },
    { id: 'flat', label: 'Flat/Apartment', description: 'Purpose-built or converted' },
    { id: 'bungalow', label: 'Bungalow', description: 'Single-story properties' },
    { id: 'commercial', label: 'Commercial', description: 'Office, retail, industrial' },
    { id: 'mixed-use', label: 'Mixed Use', description: 'Residential and commercial' }
  ];

  const handleAreaToggle = (area: string) => {
    setPreferredAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handlePropertyTypeToggle = (typeId: string) => {
    setPropertyTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const handleComplete = () => {
    onComplete({
      preferredAreas,
      searchRadius,
      propertyTypes
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Preferences</h2>
        <p className="text-gray-600">Help us find properties in your preferred areas</p>
      </div>

      <div className="space-y-8">
        {/* Preferred Areas */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Which areas are you interested in?</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {areaOptions.map((area) => (
              <label
                key={area}
                className={`p-2 text-sm border rounded cursor-pointer transition-colors ${
                  preferredAreas.includes(area)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={preferredAreas.includes(area)}
                  onChange={() => handleAreaToggle(area)}
                  className="sr-only"
                />
                {area}
              </label>
            ))}
          </div>
        </div>

        {/* Search Radius */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Default search radius: {searchRadius} miles
          </h3>
          <input
            type="range"
            min="1"
            max="50"
            value={searchRadius}
            onChange={(e) => setSearchRadius(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>1 mile</span>
            <span>50 miles</span>
          </div>
        </div>

        {/* Property Types */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What property types interest you?</h3>
          <div className="space-y-3">
            {propertyTypeOptions.map((type) => (
              <label
                key={type.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  propertyTypes.includes(type.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={propertyTypes.includes(type.id)}
                  onChange={() => handlePropertyTypeToggle(type.id)}
                  className="sr-only"
                />
                <div className="font-medium text-gray-900">{type.label}</div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleComplete}
          disabled={preferredAreas.length === 0 || propertyTypes.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// Step 4: Notification Preferences
function NotificationPreferencesStep({ user, onComplete, onBack }: OnboardingStepProps) {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    priceAlerts: true,
    newProperties: true,
    marketUpdates: true,
    weeklyDigest: true
  });

  const handleNotificationToggle = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleComplete = () => {
    onComplete({
      notifications
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
        <p className="text-gray-600">Choose how you'd like to stay updated</p>
      </div>

      <div className="space-y-6">
        {/* Notification Channels */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h3>
          <div className="space-y-4">
            {[
              { key: 'email', label: 'Email Notifications', description: 'Receive updates via email' },
              { key: 'push', label: 'Push Notifications', description: 'Browser push notifications' },
              { key: 'sms', label: 'SMS Notifications', description: 'Text message alerts' }
            ].map((channel) => (
              <div key={channel.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{channel.label}</div>
                  <div className="text-sm text-gray-600">{channel.description}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications[channel.key as keyof typeof notifications] as boolean}
                    onChange={() => handleNotificationToggle(channel.key)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    notifications[channel.key as keyof typeof notifications] ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      notifications[channel.key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`} />
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What would you like to be notified about?</h3>
          <div className="space-y-4">
            {[
              { key: 'priceAlerts', label: 'Price Alerts', description: 'When properties in your watchlist change price' },
              { key: 'newProperties', label: 'New Properties', description: 'New properties matching your criteria' },
              { key: 'marketUpdates', label: 'Market Updates', description: 'Important market trends and insights' },
              { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Weekly summary of your portfolio and market activity' }
            ].map((type) => (
              <div key={type.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications[type.key as keyof typeof notifications] as boolean}
                    onChange={() => handleNotificationToggle(type.key)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    notifications[type.key as keyof typeof notifications] ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      notifications[type.key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`} />
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleComplete}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// Step 5: Complete
function CompleteStep({ user, onComplete }: OnboardingStepProps) {
  return (
    <div className="text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Setup Complete!
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Perfect! We've personalized your BMV Finder experience based on your preferences. 
        You're now ready to discover amazing property investment opportunities.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">What's Next?</h3>
        <ul className="text-left text-blue-800 space-y-2">
          <li>• Explore properties in your preferred areas</li>
          <li>• Set up your first watchlist</li>
          <li>• Get personalized investment recommendations</li>
          <li>• Track market trends in your areas of interest</li>
        </ul>
      </div>
      <button
        onClick={() => onComplete({})}
        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Start Exploring Properties
      </button>
    </div>
  );
}

// Main Onboarding Flow Component
export default function OnboardingFlow({ user, onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [onboardingData, setOnboardingData] = useState<any>({});

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Get started with BMV Finder',
      component: WelcomeStep,
      required: false,
      completed: false
    },
    {
      id: 'investment-goals',
      title: 'Investment Goals',
      description: 'Tell us about your investment objectives',
      component: InvestmentGoalsStep,
      required: true,
      completed: false
    },
    {
      id: 'location-preferences',
      title: 'Location Preferences',
      description: 'Set your preferred areas and property types',
      component: LocationPreferencesStep,
      required: true,
      completed: false
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Choose your notification preferences',
      component: NotificationPreferencesStep,
      required: false,
      completed: false
    },
    {
      id: 'complete',
      title: 'Complete',
      description: 'You\'re all set!',
      component: CompleteStep,
      required: false,
      completed: false
    }
  ];

  const handleStepComplete = (stepData: any) => {
    const newData = { ...onboardingData, ...stepData };
    setOnboardingData(newData);
    
    const newCompletedSteps = new Set(completedSteps);
    newCompletedSteps.add(currentStep);
    setCompletedSteps(newCompletedSteps);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding complete
      onComplete(user);
    }
  };

  const handleStepSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSkip();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    index < currentStep 
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{step.title}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip Setup
            </button>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <StepComponent
            user={user}
            onComplete={handleStepComplete}
            onSkip={handleStepSkip}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  );
}
