'use client';

import { motion } from 'framer-motion';
import { 
  FileText, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Users,
  Lock,
  Zap,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  const lastUpdated = 'January 15, 2025';

  const keyTerms = [
    {
      title: 'Acceptance of Terms',
      description: 'By accessing or using Property Intelligence Platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.'
    },
    {
      title: 'Service Description',
      description: 'Property Intelligence Platform provides property search, analysis, and investment tools using UK Land Registry data and AI-powered insights.'
    },
    {
      title: 'User Accounts',
      description: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.'
    },
    {
      title: 'Data Accuracy',
      description: 'While we strive for accuracy, property data is provided "as is" and should not be the sole basis for investment decisions.'
    }
  ];

  const userObligations = [
    {
      obligation: 'Lawful Use',
      description: 'Use the service only for lawful purposes and in compliance with all applicable laws and regulations.'
    },
    {
      obligation: 'Account Security',
      description: 'Maintain the security of your account and notify us immediately of any unauthorized access.'
    },
    {
      obligation: 'Data Integrity',
      description: 'Provide accurate information and do not attempt to manipulate or falsify data.'
    },
    {
      obligation: 'Respectful Conduct',
      description: 'Use the service respectfully and do not engage in harassment, abuse, or disruptive behavior.'
    }
  ];

  const prohibitedActivities = [
    'Attempting to gain unauthorized access to our systems or data',
    'Using automated tools to scrape or extract data without permission',
    'Sharing account credentials with others',
    'Attempting to reverse engineer or copy our proprietary technology',
    'Using the service for illegal property transactions or money laundering',
    'Interfering with the service or other users\' experience'
  ];

  const serviceLimitations = [
    {
      limitation: 'Data Availability',
      description: 'Property data may not be available for all areas or time periods.'
    },
    {
      limitation: 'Analysis Accuracy',
      description: 'BMV scores and market analysis are estimates based on available data and should not be considered financial advice.'
    },
    {
      limitation: 'Service Availability',
      description: 'We strive for 99.9% uptime but cannot guarantee uninterrupted service.'
    },
    {
      limitation: 'Third-Party Data',
      description: 'We rely on third-party data sources and cannot guarantee their accuracy or availability.'
    }
  ];

  const subscriptionTerms = [
    {
      plan: 'Free Plan',
      features: ['Limited searches per month', 'Basic property data', 'Standard support'],
      limitations: ['No advanced features', 'No priority support', 'No data export']
    },
    {
      plan: 'Pro Plan',
      features: ['Unlimited searches', 'Advanced analysis tools', 'Priority support', 'Data export'],
      limitations: ['No API access', 'No white-label options']
    },
    {
      plan: 'Elite Plan',
      features: ['All Pro features', 'API access', 'White-label options', 'Dedicated support'],
      limitations: ['Subject to fair use policy']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-8">
              <FileText className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Terms of Service
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              The terms and conditions governing your use of Property Intelligence Platform
            </p>
            <div className="mt-8 flex items-center justify-center gap-4 text-blue-100">
              <Calendar className="w-5 h-5" />
              <span>Last updated: {lastUpdated}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Important Information
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              These Terms of Service govern your use of Property Intelligence Platform and outline your rights and responsibilities as a user. 
              Please read them carefully before using our platform.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 mb-12"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Important Notice</h3>
                <p className="text-gray-600 leading-relaxed">
                  Property Intelligence Platform provides property data and analysis tools for informational purposes only. 
                  We do not provide financial advice, and all investment decisions should be made in consultation 
                  with qualified professionals. Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Terms Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Key Terms
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Essential terms that govern your use of our platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {keyTerms.map((term, index) => (
              <motion.div
                key={term.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">{term.title}</h3>
                <p className="text-gray-600 leading-relaxed">{term.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Obligations Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Your Obligations
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              As a user of Property Intelligence Platform, you agree to the following responsibilities
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {userObligations.map((obligation, index) => (
              <motion.div
                key={obligation.obligation}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-6 rounded-xl"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3">{obligation.obligation}</h3>
                <p className="text-gray-600">{obligation.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Prohibited Activities Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Prohibited Activities
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The following activities are strictly prohibited and may result in account termination
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-red-50 border border-red-200 rounded-2xl p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prohibitedActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{activity}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Service Limitations Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Service Limitations
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Important limitations and disclaimers regarding our service
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {serviceLimitations.map((limitation, index) => (
              <motion.div
                key={limitation.limitation}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-6 rounded-xl"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3">{limitation.limitation}</h3>
                <p className="text-gray-600">{limitation.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Terms Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Subscription Terms
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Terms specific to our subscription plans and billing
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subscriptionTerms.map((plan, index) => (
              <motion.div
                key={plan.plan}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">{plan.plan}</h3>
                
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Features:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Limitations:</h4>
                  <ul className="space-y-2">
                    {plan.limitations.map((limitation) => (
                      <li key={limitation} className="flex items-center gap-2 text-gray-600">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Questions About Terms?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              If you have any questions about these terms or need clarification, please contact our legal team.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center justify-center gap-3">
                <Mail className="w-5 h-5" />
                <a href="mailto:legal@bmvfinder.com" className="hover:underline">
                  legal@bmvfinder.com
                </a>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Phone className="w-5 h-5" />
                <span>+44 (0) 20 1234 5678</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <MapPin className="w-5 h-5" />
                <span>United Kingdom</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/privacy"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Shield className="w-5 h-5" />
                Privacy Policy
              </Link>
              <Link
                href="/cookies"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                <Lock className="w-5 h-5" />
                Cookie Policy
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 