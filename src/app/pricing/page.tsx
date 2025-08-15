'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, XIcon, StarIcon } from 'lucide-react';
import { USER_TIERS } from '@/contexts/UserTierContext';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const getPrice = (tier: typeof USER_TIERS[0]) => {
    if (tier.price === 0) return 'Free';
    const multiplier = billingCycle === 'yearly' ? 10 : 1; // 2 months free for yearly
    return `£${(tier.price * multiplier).toFixed(2)}`;
  };

  const getBillingText = (tier: typeof USER_TIERS[0]) => {
    if (tier.price === 0) return '';
    return billingCycle === 'yearly' ? '/year (save 17%)' : '/month';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Select the perfect plan for your property investment needs. Start free and upgrade as you grow.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg shadow p-1">
              <div className="flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-md transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-md transition-colors ${
                    billingCycle === 'yearly'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Yearly
                  <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Save 17%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {USER_TIERS.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${
                  tier.id === 'elite' ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
              >
                {/* Popular Badge */}
                {tier.id === 'elite' && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm font-medium">
                    <StarIcon className="inline h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                )}

                <div className="p-8">
                  {/* Tier Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-blue-600">{getPrice(tier)}</span>
                      <span className="text-gray-600 ml-2">{getBillingText(tier)}</span>
                    </div>
                    {tier.id === 'free' && (
                      <p className="text-sm text-gray-500">No credit card required</p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations for Free Tier */}
                  {tier.id === 'free' && (
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Limitations:</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-start">
                          <XIcon className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>No property comparison</span>
                        </div>
                        <div className="flex items-start">
                          <XIcon className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>No investment analysis</span>
                        </div>
                        <div className="flex items-start">
                          <XIcon className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>No data export</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CTA Button */}
                  <button
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                      tier.id === 'free'
                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        : tier.id === 'elite'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {tier.id === 'free' ? 'Get Started Free' : `Start ${tier.name} Plan`}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Can I upgrade or downgrade my plan?
                </h3>
                <p className="text-gray-600">
                  Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, changes take effect at the next billing cycle.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600">
                  Yes! Start with our free plan to explore basic features. You can upgrade to a paid plan anytime to unlock advanced features and higher limits.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  What happens to my data if I cancel?
                </h3>
                <p className="text-gray-600">
                  Your data is safe. You can export your property data before canceling, and we'll keep it for 30 days in case you want to reactivate your account.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Do you offer refunds?
                </h3>
                <p className="text-gray-600">
                  We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us within 30 days for a full refund.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mt-16 text-center">
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Need Help Choosing?
              </h2>
              <p className="text-gray-600 mb-6">
                Our team is here to help you find the perfect plan for your needs.
              </p>
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 