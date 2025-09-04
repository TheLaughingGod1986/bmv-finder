'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Code, 
  Key, 
  Globe, 
  Shield, 
  Zap, 
  BookOpen, 
  Copy, 
  Check,
  ExternalLink,
  Terminal,
  Database,
  BarChart3
} from 'lucide-react';

export default function APIDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/property-search',
      description: 'Search for properties with advanced filters',
      parameters: [
        { name: 'query', type: 'string', required: true, description: 'Search query or postcode' },
        { name: 'limit', type: 'number', required: false, description: 'Number of results (default: 20)' },
        { name: 'filters', type: 'object', required: false, description: 'Advanced search filters' }
      ]
    },
    {
      method: 'POST',
      path: '/api/valuation',
      description: 'Get property valuation and BMV score',
      parameters: [
        { name: 'address', type: 'string', required: true, description: 'Property address' },
        { name: 'bedrooms', type: 'number', required: true, description: 'Number of bedrooms' },
        { name: 'propertyType', type: 'string', required: true, description: 'Type of property' }
      ]
    },
    {
      method: 'GET',
      path: '/api/market-analysis',
      description: 'Get market analysis for a specific area',
      parameters: [
        { name: 'postcode', type: 'string', required: true, description: 'Postcode to analyze' },
        { name: 'radius', type: 'number', required: false, description: 'Search radius in miles (default: 1)' }
      ]
    },
    {
      method: 'POST',
      path: '/api/watchlist/add',
      description: 'Add property to user watchlist',
      parameters: [
        { name: 'propertyId', type: 'string', required: true, description: 'Unique property identifier' },
        { name: 'notes', type: 'string', required: false, description: 'User notes about the property' }
      ]
    }
  ];

  const codeExamples = {
    search: `curl -X GET "https://bmvfinder.com/api/property-search?query=SW1A1AA&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    
    valuation: `curl -X POST "https://bmvfinder.com/api/valuation" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "address": "123 Main Street, London",
    "bedrooms": 3,
    "propertyType": "house"
  }'`,
    
    watchlist: `curl -X POST "https://bmvfinder.com/api/watchlist/add" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "propertyId": "prop_123456",
    "notes": "Great investment opportunity"
  }'`
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'authentication', label: 'Authentication', icon: Key },
    { id: 'endpoints', label: 'Endpoints', icon: Globe },
    { id: 'examples', label: 'Examples', icon: Code },
    { id: 'rate-limits', label: 'Rate Limits', icon: Zap },
    { id: 'errors', label: 'Errors', icon: Shield }
  ];

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
            API Documentation
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Integrate with our property intelligence platform using our RESTful API
          </motion.p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h3>
                  <nav className="space-y-2">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <section.icon className="w-4 h-4" />
                        <span>{section.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg p-8">
                {activeSection === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900">API Overview</h2>
                    <p className="text-gray-600">
                      Our RESTful API provides access to comprehensive property data, market analysis, 
                      and investment intelligence. All endpoints return JSON responses and use standard HTTP status codes.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Globe className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">Base URL</h3>
                        </div>
                        <code className="text-sm text-gray-700">https://bmvfinder.com/api</code>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-gray-900">Authentication</h3>
                        </div>
                        <code className="text-sm text-gray-700">Bearer Token</code>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>Sign up for an account and get your API key</li>
                        <li>Include your API key in the Authorization header</li>
                        <li>Make requests to our endpoints</li>
                        <li>Handle responses and errors appropriately</li>
                      </ol>
                    </div>
                  </motion.div>
                )}

                {activeSection === 'authentication' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900">Authentication</h2>
                    <p className="text-gray-600">
                      All API requests require authentication using a Bearer token in the Authorization header.
                    </p>
                    
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Authorization Header</span>
                        <button
                          onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_KEY', 'auth-header')}
                          className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300"
                        >
                          {copiedCode === 'auth-header' ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <code className="text-green-400">Authorization: Bearer YOUR_API_KEY</code>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg">
                      <h3 className="font-semibold text-red-900 mb-2">Important Security Notes</h3>
                      <ul className="list-disc list-inside space-y-1 text-red-700">
                        <li>Keep your API key secure and never expose it in client-side code</li>
                        <li>Use HTTPS for all API requests</li>
                        <li>Rotate your API keys regularly</li>
                        <li>Monitor your API usage for any suspicious activity</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeSection === 'endpoints' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900">API Endpoints</h2>
                    
                    <div className="space-y-4">
                      {apiEndpoints.map((endpoint, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              endpoint.method === 'GET' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {endpoint.method}
                            </span>
                            <code className="text-lg font-mono text-gray-900">{endpoint.path}</code>
                          </div>
                          
                          <p className="text-gray-600 mb-4">{endpoint.description}</p>
                          
                          <h4 className="font-semibold text-gray-900 mb-2">Parameters</h4>
                          <div className="space-y-2">
                            {endpoint.parameters.map((param, paramIndex) => (
                              <div key={paramIndex} className="flex items-start space-x-3">
                                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                  {param.name}
                                </code>
                                <span className={`text-sm px-2 py-1 rounded ${
                                  param.required 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {param.type}
                                </span>
                                <span className="text-sm text-gray-600">{param.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeSection === 'examples' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900">Code Examples</h2>
                    
                    <div className="space-y-6">
                      {Object.entries(codeExamples).map(([key, code]) => (
                        <div key={key} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 capitalize">
                              {key} Example
                            </h3>
                            <button
                              onClick={() => copyToClipboard(code, key)}
                              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                            >
                              {copiedCode === key ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                            <code>{code}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeSection === 'rate-limits' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900">Rate Limits</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Free Tier</h3>
                        <ul className="space-y-1 text-gray-600">
                          <li>• 100 requests per hour</li>
                          <li>• 1,000 requests per day</li>
                          <li>• Basic endpoints only</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Premium Tier</h3>
                        <ul className="space-y-1 text-gray-600">
                          <li>• 1,000 requests per hour</li>
                          <li>• 10,000 requests per day</li>
                          <li>• All endpoints available</li>
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Rate Limit Headers</h3>
                      <p className="text-gray-600 mb-2">
                        All responses include rate limit information in the headers:
                      </p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• <code>X-RateLimit-Limit</code>: Maximum requests allowed</li>
                        <li>• <code>X-RateLimit-Remaining</code>: Requests remaining in current window</li>
                        <li>• <code>X-RateLimit-Reset</code>: Time when the rate limit resets</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeSection === 'errors' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900">Error Handling</h2>
                    
                    <p className="text-gray-600">
                      Our API uses standard HTTP status codes and returns detailed error information in JSON format.
                    </p>

                    <div className="space-y-4">
                      {[
                        { code: 400, name: 'Bad Request', description: 'Invalid request parameters or malformed JSON' },
                        { code: 401, name: 'Unauthorized', description: 'Missing or invalid API key' },
                        { code: 403, name: 'Forbidden', description: 'API key lacks required permissions' },
                        { code: 404, name: 'Not Found', description: 'Requested resource does not exist' },
                        { code: 429, name: 'Too Many Requests', description: 'Rate limit exceeded' },
                        { code: 500, name: 'Internal Server Error', description: 'Server error occurred' }
                      ].map((error) => (
                        <div key={error.code} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                              {error.code}
                            </span>
                            <h3 className="font-semibold text-gray-900">{error.name}</h3>
                          </div>
                          <p className="text-gray-600">{error.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-900 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-2">Error Response Format</h3>
                      <pre className="text-red-400">
                        <code>{`{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request parameters are invalid",
    "details": {
      "field": "postcode",
      "reason": "Invalid postcode format"
    }
  }
}`}</code>
                      </pre>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-6">
              Sign up for an API key and start integrating with our property intelligence platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/account"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get API Key
              </a>
              <a
                href="/contact"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
