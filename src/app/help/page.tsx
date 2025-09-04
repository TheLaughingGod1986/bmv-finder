'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  BookOpen, 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  HelpCircle,
  FileText,
  Video,
  Download,
  ExternalLink
} from 'lucide-react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');

  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
    { id: 'features', label: 'Features', icon: CheckCircle },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: HelpCircle },
    { id: 'account', label: 'Account & Billing', icon: FileText },
    { id: 'api', label: 'API & Integration', icon: ExternalLink }
  ];

  const faqs = {
    'getting-started': [
      {
        question: 'How do I get started with the platform?',
        answer: 'Start by creating an account and completing the onboarding process. You can then begin searching for properties and building your watchlist.'
      },
      {
        question: 'What is a BMV score?',
        answer: 'BMV (Below Market Value) score is our proprietary algorithm that calculates how much below market value a property is, helping you identify investment opportunities.'
      },
      {
        question: 'How accurate are the property valuations?',
        answer: 'Our valuations are based on comprehensive market data and machine learning algorithms, providing accuracy within 5-10% of actual market values.'
      }
    ],
    'features': [
      {
        question: 'How does the Chrome extension work?',
        answer: 'Install our Chrome extension to capture properties directly from property websites like Rightmove and Zoopla. Properties are automatically added to your watchlist.'
      },
      {
        question: 'Can I track multiple properties in my portfolio?',
        answer: 'Yes, you can add properties to your portfolio and track their performance, rental yields, and market changes over time.'
      },
      {
        question: 'What market analysis features are available?',
        answer: 'We provide comprehensive market analysis including HPI data, local market trends, comparable sales, and investment recommendations.'
      }
    ],
    'troubleshooting': [
      {
        question: 'Why can\'t I see properties in my watchlist?',
        answer: 'Make sure you\'re logged in and check if the properties were captured successfully. Try refreshing the page or clearing your browser cache.'
      },
      {
        question: 'The Chrome extension isn\'t working, what should I do?',
        answer: 'Try refreshing the page, checking if you\'re logged in, and ensuring the extension is enabled. Contact support if the issue persists.'
      },
      {
        question: 'Why are some property details missing?',
        answer: 'Some properties may have incomplete data from the source websites. We continuously work to improve data quality and coverage.'
      }
    ],
    'account': [
      {
        question: 'How do I upgrade my account?',
        answer: 'Go to your account settings and click on the upgrade option. You can choose from our Free, Premium, or Elite plans.'
      },
      {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel your subscription at any time from your account settings. You\'ll continue to have access until the end of your billing period.'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, PayPal, and bank transfers for annual subscriptions.'
      }
    ],
    'api': [
      {
        question: 'Do you have an API?',
        answer: 'Yes, we provide a RESTful API for developers. Check our API documentation for details on endpoints and authentication.'
      },
      {
        question: 'How do I get an API key?',
        answer: 'API keys are available for Premium and Elite subscribers. You can generate one from your account settings.'
      },
      {
        question: 'What are the API rate limits?',
        answer: 'Rate limits vary by subscription tier. Free tier allows 100 requests/hour, Premium allows 1,000 requests/hour.'
      }
    ]
  };

  const helpResources = [
    {
      title: 'User Guide',
      description: 'Complete guide to using all platform features',
      icon: BookOpen,
      type: 'document',
      href: '/docs/user-guide'
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video guides for key features',
      icon: Video,
      type: 'video',
      href: '/docs/videos'
    },
    {
      title: 'API Documentation',
      description: 'Developer resources and API reference',
      icon: ExternalLink,
      type: 'api',
      href: '/api-docs'
    },
    {
      title: 'Chrome Extension Guide',
      description: 'How to install and use our browser extension',
      icon: Download,
      type: 'extension',
      href: '/extension-welcome'
    }
  ];

  const contactMethods = [
    {
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      icon: Mail,
      contact: 'support@bmvfinder.com',
      href: 'mailto:support@bmvfinder.com'
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      icon: MessageCircle,
      contact: 'Available 9 AM - 6 PM GMT',
      href: '/chat'
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with our support team',
      icon: Phone,
      contact: '+44 20 7946 0958',
      href: 'tel:+442079460958'
    }
  ];

  const filteredFAQs = faqs[activeCategory as keyof typeof faqs].filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Help Center
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
          >
            Find answers to common questions and get the support you need
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                  <nav className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeCategory === category.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <category.icon className="w-4 h-4" />
                        <span>{category.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* FAQ Section */}
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Frequently Asked Questions
                </h2>
                
                <div className="space-y-4">
                  {filteredFAQs.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600">
                        {faq.answer}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {filteredFAQs.length === 0 && (
                  <div className="text-center py-8">
                    <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No results found for your search.</p>
                  </div>
                )}
              </div>

              {/* Help Resources */}
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Help Resources
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {helpResources.map((resource, index) => (
                    <motion.a
                      key={index}
                      href={resource.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
                    >
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <resource.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {resource.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {resource.description}
                        </p>
                        <div className="flex items-center text-blue-600 text-sm font-medium">
                          <span>Learn more</span>
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Contact Support */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Contact Support
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {contactMethods.map((method, index) => (
                    <motion.a
                      key={index}
                      href={method.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
                    >
                      <div className="p-3 bg-blue-100 rounded-full mb-4 group-hover:bg-blue-200 transition-colors">
                        <method.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {method.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {method.description}
                      </p>
                      <p className="text-blue-600 font-medium">
                        {method.contact}
                      </p>
                    </motion.a>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Support Hours</h3>
                  </div>
                  <p className="text-blue-700">
                    Monday - Friday: 9:00 AM - 6:00 PM GMT<br />
                    Saturday: 10:00 AM - 4:00 PM GMT<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
