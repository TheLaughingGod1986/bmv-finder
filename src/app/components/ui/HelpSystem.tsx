'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  QuestionMarkCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  LightBulbIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlayIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: string;
  views: number;
  helpful: number;
  videoUrl?: string;
  relatedArticles?: string[];
}

interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  articles: HelpArticle[];
}

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string;
  searchQuery?: string;
}

export default function HelpSystem({
  isOpen,
  onClose,
  currentPage = 'dashboard',
  searchQuery = ''
}: HelpSystemProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'categories' | 'contact'>('search');
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const helpCategories: HelpCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Learn the basics of using Property Intelligence',
      icon: <BookOpenIcon className="w-5 h-5" />,
      articles: [
        {
          id: 'welcome-guide',
          title: 'Welcome to Property Intelligence',
          content: 'Property Intelligence is a comprehensive platform for property investment analysis...',
          category: 'getting-started',
          tags: ['welcome', 'introduction', 'basics'],
          lastUpdated: '2024-01-15',
          views: 1250,
          helpful: 89,
          videoUrl: 'https://example.com/welcome-video'
        },
        {
          id: 'first-search',
          title: 'Your First Property Search',
          content: 'Learn how to search for properties and understand the results...',
          category: 'getting-started',
          tags: ['search', 'tutorial', 'beginner'],
          lastUpdated: '2024-01-10',
          views: 980,
          helpful: 76
        }
      ]
    },
    {
      id: 'search-analysis',
      name: 'Search & Analysis',
      description: 'Master property search and analysis features',
      icon: <MagnifyingGlassIcon className="w-5 h-5" />,
      articles: [
        {
          id: 'bmv-scores',
          title: 'Understanding BMV Scores',
          content: 'BMV (Below Market Value) scores help you identify investment opportunities...',
          category: 'search-analysis',
          tags: ['bmv', 'scoring', 'analysis'],
          lastUpdated: '2024-01-12',
          views: 2100,
          helpful: 156
        },
        {
          id: 'market-data',
          title: 'Interpreting Market Data',
          content: 'Learn how to read and understand market trends and data...',
          category: 'search-analysis',
          tags: ['market', 'data', 'trends'],
          lastUpdated: '2024-01-08',
          views: 1450,
          helpful: 98
        }
      ]
    },
    {
      id: 'alerts-notifications',
      name: 'Alerts & Notifications',
      description: 'Set up and manage your property alerts',
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
      articles: [
        {
          id: 'setting-alerts',
          title: 'Setting Up Property Alerts',
          content: 'Create custom alerts for properties that match your criteria...',
          category: 'alerts-notifications',
          tags: ['alerts', 'notifications', 'setup'],
          lastUpdated: '2024-01-14',
          views: 890,
          helpful: 67
        }
      ]
    },
    {
      id: 'portfolio',
      name: 'Portfolio Management',
      description: 'Track and manage your property investments',
      icon: <DocumentTextIcon className="w-5 h-5" />,
      articles: [
        {
          id: 'portfolio-basics',
          title: 'Portfolio Management Basics',
          content: 'Learn how to add properties to your portfolio and track performance...',
          category: 'portfolio',
          tags: ['portfolio', 'management', 'tracking'],
          lastUpdated: '2024-01-11',
          views: 1200,
          helpful: 84
        }
      ]
    }
  ];

  const allArticles = helpCategories.flatMap(category => category.articles);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      performSearch(searchTerm);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const results = allArticles.filter(article =>
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.content.toLowerCase().includes(query.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    
    setSearchResults(results);
    setIsSearching(false);
  };

  const getContextualHelp = () => {
    const contextualArticles: Record<string, string[]> = {
      'dashboard': ['welcome-guide', 'portfolio-basics'],
      'search': ['first-search', 'bmv-scores', 'market-data'],
      'alerts': ['setting-alerts'],
      'portfolio': ['portfolio-basics']
    };

    return contextualArticles[currentPage] || [];
  };

  const handleArticleSelect = (article: HelpArticle) => {
    setSelectedArticle(article);
    // Track article view
    console.log(`Article viewed: ${article.id}`);
  };

  const handleHelpfulVote = (articleId: string, helpful: boolean) => {
    console.log(`Article ${articleId} marked as ${helpful ? 'helpful' : 'not helpful'}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <QuestionMarkCircleIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Help Center</h2>
              <p className="text-sm text-gray-600">Find answers and get support</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-96">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {[
                { id: 'search', label: 'Search', icon: <MagnifyingGlassIcon className="w-4 h-4" /> },
                { id: 'categories', label: 'Categories', icon: <BookOpenIcon className="w-4 h-4" /> },
                { id: 'contact', label: 'Contact', icon: <ChatBubbleLeftRightIcon className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto h-full">
              {activeTab === 'search' && (
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search help articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Search Results</h3>
                      <div className="space-y-2">
                        {searchResults.map(article => (
                          <button
                            key={article.id}
                            onClick={() => handleArticleSelect(article)}
                            className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                          >
                            <div className="font-medium text-gray-900 text-sm">{article.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {article.views} views • {article.helpful} helpful
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contextual Help */}
                  {!searchTerm && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Helpful for this page</h3>
                      <div className="space-y-2">
                        {getContextualHelp().map(articleId => {
                          const article = allArticles.find(a => a.id === articleId);
                          if (!article) return null;
                          
                          return (
                            <button
                              key={article.id}
                              onClick={() => handleArticleSelect(article)}
                              className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                            >
                              <div className="font-medium text-gray-900 text-sm">{article.title}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {article.views} views • {article.helpful} helpful
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="space-y-4">
                  {helpCategories.map(category => (
                    <div key={category.id}>
                      <button
                        onClick={() => setSelectedCategory(
                          selectedCategory === category.id ? null : category.id
                        )}
                        className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          {category.icon}
                          <div className="text-left">
                            <div className="font-medium text-gray-900 text-sm">{category.name}</div>
                            <div className="text-xs text-gray-500">{category.description}</div>
                          </div>
                        </div>
                        {selectedCategory === category.id ? (
                          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      
                      {selectedCategory === category.id && (
                        <div className="mt-2 ml-6 space-y-1">
                          {category.articles.map(article => (
                            <button
                              key={article.id}
                              onClick={() => handleArticleSelect(article)}
                              className="w-full text-left p-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              {article.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Need More Help?</h3>
                    <p className="text-sm text-blue-800">
                      Our support team is here to help you get the most out of Property Intelligence.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <button className="w-full flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 text-sm">Live Chat</div>
                        <div className="text-xs text-gray-500">Get instant help from our team</div>
                      </div>
                    </button>
                    
                    <button className="w-full flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
                      <EnvelopeIcon className="w-5 h-5 text-green-600" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 text-sm">Email Support</div>
                        <div className="text-xs text-gray-500">support@propertyintelligence.com</div>
                      </div>
                    </button>
                    
                    <button className="w-full flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
                      <PhoneIcon className="w-5 h-5 text-purple-600" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 text-sm">Phone Support</div>
                        <div className="text-xs text-gray-500">+44 20 7946 0958</div>
                      </div>
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 text-sm mb-2">Support Hours</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Monday - Friday: 9:00 AM - 6:00 PM GMT</div>
                      <div>Saturday: 10:00 AM - 4:00 PM GMT</div>
                      <div>Sunday: Closed</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedArticle ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedArticle.title}</h2>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Last updated: {new Date(selectedArticle.lastUpdated).toLocaleDateString()}</span>
                      <span>{selectedArticle.views} views</span>
                      <span>{selectedArticle.helpful} found helpful</span>
                    </div>
                  </div>
                  
                  {selectedArticle.videoUrl && (
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <PlayIcon className="w-4 h-4" />
                      <span>Watch Video</span>
                    </button>
                  )}
                </div>
                
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">{selectedArticle.content}</p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Was this helpful?</span>
                    <button
                      onClick={() => handleHelpfulVote(selectedArticle.id, true)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleHelpfulVote(selectedArticle.id, false)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                    >
                      No
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Back to help
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <QuestionMarkCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Help Center</h3>
                  <p className="text-gray-600">
                    Search for help articles or browse by category to find the information you need.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
