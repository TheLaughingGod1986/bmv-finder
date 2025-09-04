'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Eye, 
  Download, 
  Trash2, 
  Edit, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Database,
  User,
  Mail,
  Phone,
  Calendar,
  Key
} from 'lucide-react';

export default function GDPRPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'rights', label: 'Your Rights', icon: User },
    { id: 'data-collection', label: 'Data Collection', icon: Database },
    { id: 'data-processing', label: 'Data Processing', icon: FileText },
    { id: 'data-retention', label: 'Data Retention', icon: Calendar },
    { id: 'data-security', label: 'Data Security', icon: Lock },
    { id: 'contact', label: 'Contact DPO', icon: Mail }
  ];

  const dataRights = [
    {
      id: 'access',
      title: 'Right of Access',
      description: 'You have the right to request access to your personal data and information about how it is processed.',
      icon: Eye,
      action: 'Request Data Access'
    },
    {
      id: 'rectification',
      title: 'Right to Rectification',
      description: 'You can request correction of inaccurate or incomplete personal data.',
      icon: Edit,
      action: 'Request Correction'
    },
    {
      id: 'erasure',
      title: 'Right to Erasure',
      description: 'You can request deletion of your personal data in certain circumstances.',
      icon: Trash2,
      action: 'Request Deletion'
    },
    {
      id: 'portability',
      title: 'Right to Data Portability',
      description: 'You can request a copy of your data in a structured, machine-readable format.',
      icon: Download,
      action: 'Request Data Export'
    },
    {
      id: 'restriction',
      title: 'Right to Restrict Processing',
      description: 'You can request limitation of how your personal data is processed.',
      icon: Lock,
      action: 'Request Restriction'
    },
    {
      id: 'objection',
      title: 'Right to Object',
      description: 'You can object to processing of your personal data for certain purposes.',
      icon: AlertCircle,
      action: 'Submit Objection'
    }
  ];

  const dataTypes = [
    {
      category: 'Identity Data',
      examples: ['Name', 'Email address', 'Phone number', 'Date of birth'],
      purpose: 'Account creation, authentication, communication'
    },
    {
      category: 'Property Data',
      examples: ['Property addresses', 'Search history', 'Watchlist properties', 'Portfolio data'],
      purpose: 'Service provision, property analysis, recommendations'
    },
    {
      category: 'Usage Data',
      examples: ['Website interactions', 'Feature usage', 'Session data', 'Device information'],
      purpose: 'Service improvement, analytics, personalization'
    },
    {
      category: 'Marketing Data',
      examples: ['Communication preferences', 'Marketing consent', 'Campaign interactions'],
      purpose: 'Marketing communications, service updates'
    }
  ];

  const processingBases = [
    {
      basis: 'Consent',
      description: 'You have given clear consent for us to process your personal data for specific purposes.',
      examples: ['Marketing communications', 'Analytics cookies', 'Optional features']
    },
    {
      basis: 'Contract',
      description: 'Processing is necessary for the performance of a contract with you.',
      examples: ['Account management', 'Service delivery', 'Customer support']
    },
    {
      basis: 'Legitimate Interest',
      description: 'Processing is necessary for our legitimate interests or those of a third party.',
      examples: ['Service improvement', 'Security monitoring', 'Fraud prevention']
    },
    {
      basis: 'Legal Obligation',
      description: 'Processing is necessary to comply with a legal obligation.',
      examples: ['Tax reporting', 'Regulatory compliance', 'Legal requests']
    }
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
            GDPR Compliance
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Your data protection rights and how we comply with GDPR regulations
          </motion.p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">GDPR Information</h3>
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
                    <h2 className="text-2xl font-bold text-gray-900">GDPR Overview</h2>
                    <p className="text-gray-600">
                      The General Data Protection Regulation (GDPR) is a comprehensive data protection law 
                      that gives you control over your personal data. We are committed to protecting your 
                      privacy and ensuring full compliance with GDPR requirements.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">Data Protection</h3>
                        </div>
                        <p className="text-gray-600 text-sm">
                          We implement robust security measures to protect your personal data from 
                          unauthorized access, alteration, or disclosure.
                        </p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-gray-900">Your Rights</h3>
                        </div>
                        <p className="text-gray-600 text-sm">
                          You have comprehensive rights over your personal data, including access, 
                          rectification, erasure, and portability.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h3 className="font-semibold text-yellow-900 mb-2">Data Protection Officer</h3>
                      <p className="text-yellow-800 text-sm">
                        We have appointed a Data Protection Officer (DPO) to oversee our GDPR compliance 
                        and handle your data protection requests. Contact: dpo@bmvfinder.com
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeSection === 'rights' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900">Your Data Protection Rights</h2>
                    <p className="text-gray-600">
                      Under GDPR, you have specific rights regarding your personal data. 
                      You can exercise these rights at any time by contacting us.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {dataRights.map((right, index) => (
                        <div key={right.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-start space-x-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <right.icon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{right.title}</h3>
                              <p className="text-gray-600 text-sm">{right.description}</p>
                            </div>
                          </div>
                          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            {right.action}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">How to Exercise Your Rights</h3>
                      <p className="text-blue-800 text-sm mb-2">
                        To exercise any of your rights, please contact us at privacy@bmvfinder.com with:
                      </p>
                      <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
                        <li>Your full name and email address</li>
                        <li>Description of the right you wish to exercise</li>
                        <li>Any relevant details to help us process your request</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeSection === 'data-collection' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900">Data We Collect</h2>
                    <p className="text-gray-600">
                      We collect and process personal data necessary to provide our services. 
                      Here's what we collect and why:
                    </p>
                    
                    <div className="space-y-6">
                      {dataTypes.map((dataType, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">{dataType.category}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Examples:</h4>
                              <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                                {dataType.examples.map((example, exampleIndex) => (
                                  <li key={exampleIndex}>{example}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Purpose:</h4>
                              <p className="text-gray-600 text-sm">{dataType.purpose}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeSection === 'data-processing' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900">Legal Basis for Processing</h2>
                    <p className="text-gray-600">
                      We process your personal data based on specific legal grounds under GDPR. 
                      Here are the legal bases we rely on:
                    </p>
                    
                    <div className="space-y-4">
                      {processingBases.map((basis, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{basis.basis}</h3>
                          <p className="text-gray-600 mb-3">{basis.description}</p>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Examples:</h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                              {basis.examples.map((example, exampleIndex) => (
                                <li key={exampleIndex}>{example}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeSection === 'data-retention' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900">Data Retention</h2>
                    <p className="text-gray-600">
                      We retain your personal data only for as long as necessary to fulfill the purposes 
                      for which it was collected, comply with legal obligations, or resolve disputes.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Account Data</h3>
                        <p className="text-gray-600 text-sm mb-2">Retained while your account is active</p>
                        <p className="text-gray-500 text-xs">Deleted 30 days after account closure</p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Usage Data</h3>
                        <p className="text-gray-600 text-sm mb-2">Retained for 2 years for analytics</p>
                        <p className="text-gray-500 text-xs">Anonymized after 1 year</p>
                      </div>
                      
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Marketing Data</h3>
                        <p className="text-gray-600 text-sm mb-2">Retained until consent withdrawn</p>
                        <p className="text-gray-500 text-xs">Deleted immediately upon opt-out</p>
                      </div>
                      
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Legal Data</h3>
                        <p className="text-gray-600 text-sm mb-2">Retained as required by law</p>
                        <p className="text-gray-500 text-xs">Typically 7 years for tax records</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSection === 'data-security' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
                    <p className="text-gray-600">
                      We implement comprehensive security measures to protect your personal data 
                      against unauthorized access, alteration, disclosure, or destruction.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lock className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">Encryption</h3>
                        </div>
                        <p className="text-gray-600 text-sm">
                          All data is encrypted in transit and at rest using industry-standard encryption protocols.
                        </p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-gray-900">Access Controls</h3>
                        </div>
                        <p className="text-gray-600 text-sm">
                          Strict access controls ensure only authorized personnel can access your data.
                        </p>
                      </div>
                      
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Key className="w-5 h-5 text-yellow-600" />
                          <h3 className="font-semibold text-gray-900">Authentication</h3>
                        </div>
                        <p className="text-gray-600 text-sm">
                          Multi-factor authentication and secure password policies protect user accounts.
                        </p>
                      </div>
                      
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Database className="w-5 h-5 text-purple-600" />
                          <h3 className="font-semibold text-gray-900">Secure Infrastructure</h3>
                        </div>
                        <p className="text-gray-600 text-sm">
                          Our infrastructure is regularly audited and monitored for security vulnerabilities.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSection === 'contact' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900">Contact Our Data Protection Officer</h2>
                    <p className="text-gray-600">
                      If you have any questions about our GDPR compliance or wish to exercise your data protection rights, 
                      please contact our Data Protection Officer.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3 mb-4">
                          <Mail className="w-6 h-6 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                        </div>
                        <p className="text-gray-600 mb-2">dpo@bmvfinder.com</p>
                        <p className="text-gray-500 text-sm">Response within 72 hours</p>
                      </div>
                      
                      <div className="p-6 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3 mb-4">
                          <Phone className="w-6 h-6 text-green-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Phone</h3>
                        </div>
                        <p className="text-gray-600 mb-2">+44 20 7946 0958</p>
                        <p className="text-gray-500 text-sm">Mon-Fri 9AM-6PM GMT</p>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h3 className="font-semibold text-yellow-900 mb-2">Supervisory Authority</h3>
                      <p className="text-yellow-800 text-sm">
                        You have the right to lodge a complaint with the Information Commissioner's Office (ICO) 
                        if you believe we have not handled your personal data in accordance with GDPR.
                      </p>
                      <a href="https://ico.org.uk" className="text-yellow-800 text-sm underline hover:no-underline">
                        Visit ICO website →
                      </a>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
