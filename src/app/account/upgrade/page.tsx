'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useSession } from '@supabase/auth-helpers-react';
import { getUserProfile } from '@/utils/getUserProfile';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in environment');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type UserTier = 'free' | 'pro' | 'elite' | 'unknown';
type BillingInterval = 'monthly' | 'yearly';

interface PricingOption {
  price: string;
  priceId: string | undefined;
  savings?: string;
}

interface Plan {
  name: string;
  description: string;
  tier: UserTier;
  features: string[];
  pricing: {
    monthly: PricingOption;
    yearly?: PricingOption;
  };
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    description: 'Basic access, limited features',
    tier: 'free',
    features: [
      'Basic search',
      'Limited lookups',
      'No export',
    ],
    pricing: {
      monthly: {
        price: '£0',
        priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
      },
    },
  },
  {
    name: 'Pro',
    description: 'Unlimited lookups, alerts, export, full data access',
    tier: 'pro',
    features: [
      'Unlimited lookups',
      'Alerts & notifications',
      'Export data',
      'Full analytics',
    ],
    pricing: {
      monthly: {
        price: '£19/mo',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
      },
      yearly: {
        price: '£190/yr',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
        savings: 'Save 17%',
      },
    },
  },
  {
    name: 'Elite',
    description: 'All Pro features + PDF reports, bulk analysis, CRM export',
    tier: 'elite',
    features: [
      'All Pro features',
      'PDF reports',
      'Bulk analysis',
      'CRM export',
    ],
    pricing: {
      monthly: {
        price: '£49/mo',
        priceId: process.env.NEXT_PUBLIC_STRIPE_ELITE_MONTHLY_PRICE_ID,
      },
      yearly: {
        price: '£490/yr',
        priceId: process.env.NEXT_PUBLIC_STRIPE_ELITE_YEARLY_PRICE_ID,
        savings: 'Save 17%',
      },
    },
  },
];

const UpgradePage = () => {
  const session = useSession();
  const userId = session?.user?.id;
  const [userTier, setUserTier] = useState<UserTier>('unknown');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const [buttonError, setButtonError] = useState<{ [key: string]: string | null }>({});

  useEffect(() => {
    if (!userId) return;
    setProfileLoading(true);
    setProfileError(null);
    getUserProfile(userId)
      .then((profile) => {
        setUserTier(profile?.tier || 'free');
      })
      .catch((err) => {
        setProfileError('Failed to load profile');
        setUserTier('free');
      })
      .finally(() => setProfileLoading(false));
  }, [userId]);

  const handleUpgrade = async (planPriceId: string) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    setButtonError((prev) => ({ ...prev, [planPriceId]: null }));
    console.log({ userId, priceId: planPriceId, email: session?.user?.email });
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, priceId: planPriceId, email: session?.user?.email }),
      });
      const data = await res.json();
      console.log('Checkout session response:', data);
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session');
      const stripe = await stripePromise;
      if (stripe && data.url) {
        window.location.href = data.url;
      } else {
        console.error('Stripe.js failed to load or missing session URL', { stripe, data });
        throw new Error('Stripe.js failed to load or missing session URL');
      }
    } catch (err: any) {
      setError(err.message);
      setButtonError((prev) => ({ ...prev, [planPriceId]: err.message }));
      console.error('Upgrade error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debug logging
  PLANS.forEach((plan) => {
    console.log('Plan:', plan.name);
    Object.entries(plan.pricing).forEach(([interval, pricing]) => {
      console.log(`  ${interval}:`, pricing.price, 'priceId:', pricing.priceId);
    });
  });
  console.log('userId:', userId);

  if (!session) {
    return <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem' }}><h1>Upgrade Your Account</h1><p>Loading...</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Upgrade Your Account</h1>
      {profileLoading ? (
        <p className="text-center">Loading your profile...</p>
      ) : profileError ? (
        <p className="text-center text-red-600">{profileError}</p>
      ) : (
        <p className="text-center mb-6">Your current tier: <strong>{userTier}</strong></p>
      )}
      
      {/* Billing Interval Toggle - Only show for Pro and Elite */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {PLANS.map((plan) => {
          const isCurrent = userTier === plan.tier;
          const currentPricing = billingInterval === 'yearly' && plan.pricing.yearly 
            ? plan.pricing.yearly 
            : plan.pricing.monthly;
          const isStarter = plan.tier === 'free';
          
          return (
            <div
              key={plan.tier}
              className={
                'rounded-xl border shadow-lg p-6 flex flex-col items-center ' +
                (isCurrent ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white')
              }
              style={{ minHeight: 420, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div className="flex-1 w-full flex flex-col items-center justify-start" style={{ minHeight: 220 }}>
                <div className="text-xl font-bold mb-2">{plan.name}</div>
                <div className="text-2xl font-extrabold mb-2">{currentPricing.price}</div>
                {currentPricing.savings && (
                  <div className="text-sm text-green-600 font-medium mb-2">{currentPricing.savings}</div>
                )}
                <div className="mb-4 text-gray-600 text-center">{plan.description}</div>
                <ul className="mb-6 text-sm text-gray-700 list-disc list-inside text-left w-full">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
              <button
                className={
                  'w-full py-2 rounded-lg font-semibold transition mt-4 ' +
                  (isCurrent
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white')
                }
                style={{ minHeight: 44 }}
                disabled={isCurrent || loading || profileLoading || !userId || !currentPricing.priceId}
                onClick={() => handleUpgrade(currentPricing.priceId!)}
              >
                {loading ? 'Processing...' : isCurrent ? 'Current Plan' : `Choose ${plan.name}`}
              </button>
              {buttonError[currentPricing.priceId!] && (
                <div className="text-red-600 text-sm mt-2">{buttonError[currentPricing.priceId!]}</div>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="text-center text-red-600 mb-4">{error}</p>}
      <p className="text-center text-gray-500">Unlock advanced features and support the project by upgrading your plan.</p>
    </div>
  );
};

export default UpgradePage; 