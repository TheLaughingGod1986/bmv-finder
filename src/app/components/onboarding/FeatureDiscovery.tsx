'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Lightbulb, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Star, 
  Bookmark,
  ExternalLink,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  Calculator,
  Search,
  Home,
  Briefcase,
  Zap,
  Target,
  Award,
  Eye,
  MousePointer,
  Keyboard,
  Volume2
} from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  category: 'search' | 'analysis' | 'portfolio' | 'tools' | 'integration' | 'accessibility';
  icon: any;
  url?: string;
  isNew?: boolean;
  isPopular?: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  prerequisites?: string[];
  benefits: string[];
  tips: string[];
}

interface FeatureDiscoveryProps {
  className?: string;
}

export default function FeatureDiscovery({ className = '' }: FeatureDiscoveryProps) {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [discoveredFeatures, setDiscoveredFeatures] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const hintRef = useRef<HTMLDivElement>(null);

  const features: Feature[] = [
    {
      id: 'property-search',
      title: 'Advanced Property Search',
      description: 'Find properties with powerful filters and search criteria',
      category: 'search',
      icon: Search,
      url: '/search/properties',
      isPopular: true,
      difficulty: 'beginner',
      estimatedTime: 3,
      benefits: [
        'Find properties by postcode, area, or property type',
        'Filter by price range, bedrooms, and property features',
        'Save search criteria for future use',
        'Get instant results with detailed property information'
      ],
      tips: [
        'Use wildcards (*) in postcode searches for broader results',
        'Save your favorite searches to quickly find similar properties',
        'Set up alerts to be notified of new properties matching your criteria'
      ]
    },
    {
      id: 'bmv-analysis',
      title: 'BMV Score Analysis',
      description: 'Identify below market value properties with our proprietary scoring system',
      category: 'analysis',
      icon: Target,
      url: '/analysis/valuation',
      isNew: true,
      difficulty: 'intermediate',
      estimatedTime: 5,
      benefits: [
        'Get instant BMV scores for any property',
        'Understand market value vs asking price',
        'Identify the best investment opportunities',
        'Compare properties side by side'
      ],
      tips: [
        'Look for properties with BMV scores above 70 for best opportunities',
        'Consider local market conditions when interpreting scores',
        'Use historical data to validate BMV calculations'
      ]
    },
    {
      id: 'portfolio-tracking',
      title: 'Portfolio Management',
      description: 'Track and analyze your property investment portfolio',
      category: 'portfolio',
      icon: Briefcase,
      url: '/tools/portfolio',
      isPopular: true,
      difficulty: 'intermediate',
      estimatedTime: 8,
      benefits: [
        'Track all your property investments in one place',
        'Monitor portfolio performance and returns',
        'Generate detailed reports and analytics',
        'Set investment goals and track progress'
      ],
      tips: [
        'Add properties as soon as you acquire them for accurate tracking',
        'Regularly update property values for current portfolio worth',
        'Use the analytics dashboard to identify top performers'
      ]
    },
    {
      id: 'market-analysis',
      title: 'Market Intelligence',
      description: 'Get comprehensive market analysis and trends',
      category: 'analysis',
      icon: TrendingUp,
      url: '/market/analysis',
      difficulty: 'advanced',
      estimatedTime: 10,
      benefits: [
        'Access to HPI (House Price Index) data',
        'Local market trends and analysis',
        'Price predictions and forecasts',
        'Economic indicators and insights'
      ],
      tips: [
        'Check market trends before making investment decisions',
        'Use HPI data to understand long-term price movements',
        'Compare different areas using the market comparison tool'
      ]
    },
    {
      id: 'deal-calculator',
      title: 'Deal Analysis Calculator',
      description: 'Calculate ROI, cash flow, and investment metrics',
      category: 'tools',
      icon: Calculator,
      url: '/analysis/deal-analysis',
      isNew: true,
      difficulty: 'intermediate',
      estimatedTime: 6,
      benefits: [
        'Calculate potential ROI and cash flow',
        'Factor in all costs and expenses',
        'Compare different investment scenarios',
        'Generate professional investment reports'
      ],
      tips: [
        'Include all costs: purchase, renovation, maintenance, and management',
        'Use conservative estimates for more realistic projections',
        'Save calculations for future reference and comparison'
      ]
    },
    {
      id: 'chrome-extension',
      title: 'Chrome Extension',
      description: 'Capture properties directly from Rightmove, Zoopla, and other sites',
      category: 'integration',
      icon: ExternalLink,
      url: '/extension-welcome',
      isPopular: true,
      difficulty: 'beginner',
      estimatedTime: 4,
      benefits: [
        'One-click property capture from major property sites',
        'Automatic BMV score calculation',
        'Save properties to your watchlist instantly',
        'Access property data without leaving the site'
      ],
      tips: [
        'Install the extension for seamless property research',
        'Use the extension to quickly compare properties',
        'Save interesting properties for later analysis'
      ]
    },
    {
      id: 'watchlist',
      title: 'Property Watchlist',
      description: 'Save and track properties you\'re interested in',
      category: 'portfolio',
      icon: Bookmark,
      url: '/watchlist',
      difficulty: 'beginner',
      estimatedTime: 2,
      benefits: [
        'Save properties for later review',
        'Track price changes over time',
        'Get notifications for price updates',
        'Organize properties by interest level'
      ],
      tips: [
        'Add properties to watchlist for easy comparison',
        'Use tags to organize properties by criteria',
        'Set up alerts for price changes on watched properties'
      ]
    },
    {
      id: 'accessibility-features',
      title: 'Accessibility Features',
      description: 'Customize the platform for your accessibility needs',
      category: 'accessibility',
      icon: Eye,
      url: '/tools/accessibility',
      difficulty: 'beginner',
      estimatedTime: 3,
      benefits: [
        'High contrast mode for better visibility',
        'Keyboard navigation support',
        'Screen reader compatibility',
        'Customizable font sizes and colors'
      ],
      tips: [
        'Enable high contrast mode for better visibility',
        'Use keyboard shortcuts for faster navigation',
        'Customize settings to match your preferences'
      ]
    },
    {
      id: 'performance-monitoring',
      title: 'Performance Dashboard',
      description: 'Monitor system performance and optimize your workflow',
      category: 'tools',
      icon: BarChart3,
      url: '/tools/performance',
      difficulty: 'advanced',
      estimatedTime: 5,
      benefits: [
        'Real-time performance metrics',
        'API response time monitoring',
        'Cache hit rate analysis',
        'System health indicators'
      ],
      tips: [
        'Monitor performance metrics for optimal experience',
        'Check system health regularly',
        'Use performance data to optimize your workflow'
      ]
    }
  ];

  const categories = [
    { id: 'all', label: 'All Features', icon: Star },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'tools', label: 'Tools', icon: Calculator },
    { id: 'integration', label: 'Integration', icon: ExternalLink },
    { id: 'accessibility', label: 'Accessibility', icon: Eye },
  ];

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(feature => feature.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.id === category);
    return categoryData?.icon || Star;
  };

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature);
    setShowModal(true);
    
    // Mark as discovered
    if (!discoveredFeatures.includes(feature.id)) {
      setDiscoveredFeatures(prev => [...prev, feature.id]);
      localStorage.setItem('discovered-features', JSON.stringify([...discoveredFeatures, feature.id]));
    }
  };

  const handleExploreFeature = (feature: Feature) => {
    if (feature.url) {
      window.location.href = feature.url;
    }
    setShowModal(false);
  };

  useEffect(() => {
    // Load discovered features
    const saved = localStorage.getItem('discovered-features');
    if (saved) {
      try {
        setDiscoveredFeatures(JSON.parse(saved));
      } catch {
        // Fallback to empty array
      }
    }

    // Show hint after 3 seconds
    const timer = setTimeout(() => {
      setShowHint(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-hide hint after 5 seconds
    if (showHint) {
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showHint]);

  return (
    <div className={`feature-discovery ${className}`}>
      {/* Hint */}
      {showHint && (
        <div
          ref={hintRef}
          className="fixed top-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm"
        >
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Discover New Features!</p>
              <p className="text-xs opacity-90 mt-1">
                Click on any feature card to learn more and explore its capabilities.
              </p>
            </div>
            <button
              onClick={() => setShowHint(false)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Feature Discovery
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Explore powerful features to maximize your property investment success
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Features</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{features.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Discovered</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{discoveredFeatures.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round((discoveredFeatures.length / features.length) * 100)}%
            </p>
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

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map((feature) => {
          const Icon = feature.icon;
          const isDiscovered = discoveredFeatures.includes(feature.id);

          return (
            <div
              key={feature.id}
              onClick={() => handleFeatureClick(feature)}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                isDiscovered ? 'ring-2 ring-green-500 ring-opacity-50' : ''
              }`}
            >
              {/* Feature Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex items-center space-x-2">
                    {feature.isNew && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs font-medium rounded-full">
                        New
                      </span>
                    )}
                    {feature.isPopular && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 text-xs font-medium rounded-full">
                        Popular
                      </span>
                    )}
                    {isDiscovered && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {feature.description}
                </p>

                {/* Feature Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{feature.estimatedTime} min</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(feature.difficulty)}`}>
                    {feature.difficulty}
                  </span>
                </div>

                {/* Benefits Preview */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Key Benefits:</p>
                  <ul className="space-y-1">
                    {feature.benefits.slice(0, 2).map((benefit, index) => (
                      <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start space-x-1">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                    {feature.benefits.length > 2 && (
                      <li className="text-xs text-blue-600 dark:text-blue-400">
                        +{feature.benefits.length - 2} more benefits
                      </li>
                    )}
                  </ul>
                </div>

                {/* Action Button */}
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Detail Modal */}
      {showModal && selectedFeature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <selectedFeature.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedFeature.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedFeature.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Feature Details */}
              <div className="space-y-6">
                {/* Feature Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time to Learn</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedFeature.estimatedTime} minutes
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                      {selectedFeature.difficulty}
                    </p>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    What You'll Get
                  </h3>
                  <ul className="space-y-2">
                    {selectedFeature.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tips */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Pro Tips
                  </h3>
                  <ul className="space-y-2">
                    {selectedFeature.tips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {selectedFeature.url && (
                    <button
                      onClick={() => handleExploreFeature(selectedFeature)}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <span>Explore Feature</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
