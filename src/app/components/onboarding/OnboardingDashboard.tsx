'use client';

import { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  Star, 
  ArrowRight, 
  Settings, 
  RotateCcw,
  BookOpen,
  Zap,
  Target,
  Users,
  Award,
  TrendingUp,
  BarChart3,
  Calculator,
  Search,
  Home,
  Briefcase
} from 'lucide-react';
import { useOnboarding } from '@/lib/onboarding/onboardingManager';

interface OnboardingDashboardProps {
  className?: string;
}

export default function OnboardingDashboard({ className = '' }: OnboardingDashboardProps) {
  const {
    tours,
    progress,
    startTour,
    isTourCompleted,
    getTourProgress,
    updatePreferences,
    resetProgress,
  } = useOnboarding();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);

  const categories = [
    { id: 'all', label: 'All Tours', icon: BookOpen },
    { id: 'getting-started', label: 'Getting Started', icon: Home },
    { id: 'features', label: 'Features', icon: Zap },
    { id: 'advanced', label: 'Advanced', icon: Target },
  ];

  const filteredTours = selectedCategory === 'all' 
    ? tours 
    : tours.filter(tour => tour.category === selectedCategory);

  const getTourIcon = (category: string) => {
    switch (category) {
      case 'getting-started': return Home;
      case 'features': return Zap;
      case 'advanced': return Target;
      default: return BookOpen;
    }
  };

  const getTourColor = (category: string) => {
    switch (category) {
      case 'getting-started': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'features': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'advanced': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPrerequisiteStatus = (tour: any) => {
    if (!tour.prerequisites || tour.prerequisites.length === 0) {
      return { status: 'ready', message: 'Ready to start' };
    }

    const missingPrereqs = tour.prerequisites.filter((prereq: string) => 
      !progress.completedTours.includes(prereq)
    );

    if (missingPrereqs.length === 0) {
      return { status: 'ready', message: 'Ready to start' };
    }

    return { 
      status: 'locked', 
      message: `Complete ${missingPrereqs.length} prerequisite tour${missingPrereqs.length > 1 ? 's' : ''} first` 
    };
  };

  const handleStartTour = (tourId: string) => {
    const success = startTour(tourId);
    if (success) {
      // Close dashboard or show tour
      setShowSettings(false);
    }
  };

  const handleResetProgress = () => {
    if (confirm('Are you sure you want to reset all onboarding progress? This action cannot be undone.')) {
      resetProgress();
    }
  };

  return (
    <div className={`onboarding-dashboard ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to BMV Finder
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Take a guided tour to discover all the features and get the most out of your property investment platform.
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open settings"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {progress.completedTours.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {tours.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(progress.totalTimeSpent)}m
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round((progress.completedTours.length / tours.length) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTours.map((tour) => {
          const Icon = getTourIcon(tour.category);
          const isCompleted = isTourCompleted(tour.id);
          const progressPercent = getTourProgress(tour.id);
          const prereqStatus = getPrerequisiteStatus(tour);
          const canStart = prereqStatus.status === 'ready';

          return (
            <div
              key={tour.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 ${
                canStart ? 'hover:shadow-lg hover:scale-105' : 'opacity-60'
              }`}
            >
              {/* Tour Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getTourColor(tour.category)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {isCompleted && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {tour.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {tour.description}
                </p>

                {/* Progress Bar */}
                {progressPercent > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Tour Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{tour.estimatedTime} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>{tour.steps.length} steps</span>
                  </div>
                </div>

                {/* Prerequisites */}
                {tour.prerequisites && tour.prerequisites.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Prerequisites:</p>
                    <div className="flex flex-wrap gap-1">
                      {tour.prerequisites.map((prereq) => {
                        const prereqTour = tours.find(t => t.id === prereq);
                        const isPrereqCompleted = isTourCompleted(prereq);
                        return (
                          <span
                            key={prereq}
                            className={`px-2 py-1 rounded text-xs ${
                              isPrereqCompleted
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {prereqTour?.name || prereq}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleStartTour(tour.id)}
                  disabled={!canStart}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    canStart
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed</span>
                    </>
                  ) : progressPercent > 0 ? (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Continue</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Start Tour</span>
                    </>
                  )}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Status Message */}
                {!canStart && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    {prereqStatus.message}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Onboarding Settings
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto-start tours
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Automatically start tours when available
                    </p>
                  </div>
                  <button
                    onClick={() => updatePreferences({ autoStart: !progress.preferences.autoStart })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      progress.preferences.autoStart ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        progress.preferences.autoStart ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show hints
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Display helpful hints during tours
                    </p>
                  </div>
                  <button
                    onClick={() => updatePreferences({ showHints: !progress.preferences.showHints })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      progress.preferences.showHints ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        progress.preferences.showHints ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Skip animations
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Disable animations for faster tours
                    </p>
                  </div>
                  <button
                    onClick={() => updatePreferences({ skipAnimations: !progress.preferences.skipAnimations })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      progress.preferences.skipAnimations ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        progress.preferences.skipAnimations ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Voice guidance
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enable audio narration for tours
                    </p>
                  </div>
                  <button
                    onClick={() => updatePreferences({ voiceGuidance: !progress.preferences.voiceGuidance })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      progress.preferences.voiceGuidance ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        progress.preferences.voiceGuidance ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleResetProgress}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All Progress</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
