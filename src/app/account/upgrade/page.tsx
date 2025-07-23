'use client';

import { useState, useEffect, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../../../lib/supabaseClient';
import { getUserProfile } from '@/utils/getUserProfile';
import { useToast } from '@/app/components/ToastProvider';
import { format } from 'date-fns';
import { parseSubscriptionMetadata } from '@/utils/subscriptionUtils';
import { ShieldCheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Button from '../../components/Button';

// Client-side only Stripe initialization
function getStripePromise() {
  if (typeof window === 'undefined') {
    return null;
  }

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in environment');
}

  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

// Custom hook for session management
function useClientSession() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  return { session, loading };
}

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

function getPlans(): Plan[] {
  return [
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
}

const UpgradePage = () => {
  const { session, loading: sessionLoading } = useClientSession();
  const userId = session?.user?.id;
  const { showToast } = useToast();
  const [userTier, setUserTier] = useState<UserTier>('unknown');
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const [buttonError, setButtonError] = useState<{ [key: string]: string | null }>({});

  const [pendingDowngrade, setPendingDowngrade] = useState<{
    planName: string;
    priceId: string;
    renewalDate: string;
  } | null>(null);

  const [managingSubscription, setManagingSubscription] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<UserTier | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [upgradedPlan, setUpgradedPlan] = useState<string | null>(null);

  // Helper to get renewal date and interval from billing_metadata
  let renewalDate: string | null = null;
  let renewalInterval: string | null = null;
  if (profile?.billing_metadata) {
    const meta = profile.billing_metadata;
    // DEBUG meta logged
    // Use current_period_end if available, otherwise use canceled_at if cancel_at_period_end is true
    const periodEnd = meta.current_period_end || (meta.cancel_at_period_end && meta.canceled_at);
    if (periodEnd) {
      renewalDate = format(new Date(periodEnd * 1000), 'PPP');
      // Parsed renewalDate logged
    }
    if (meta.plan?.interval) {
      renewalInterval = meta.plan.interval;
      // Parsed renewalInterval logged
    }
  }

  // Parse subscription info from profile
  const subscriptionInfo = profile ? parseSubscriptionMetadata(profile.billing_metadata) : null;

  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;
    setProfileLoading(true);
    setProfileError(null);
    getUserProfile(userId)
      .then((profile) => {
        setUserTier(profile?.tier || 'free');
        setProfile(profile || null);
      })
      .catch((err) => {
        setProfileError('Failed to load profile');
        setUserTier('free');
        setProfile(null);
      })
      .finally(() => setProfileLoading(false));
  }, [userId]);

  useEffect(() => {
    if (profile) {
      // Loaded profile.billing_metadata logged
    }
  }, [profile]);

  const handleUpgrade = async (planPriceId: string) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    setButtonError((prev) => ({ ...prev, [planPriceId]: null }));
    // User data logged
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, priceId: planPriceId, email: session?.user?.email }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
        showToast({
          type: 'error',
          title: 'Upgrade failed',
          message: errorData.error || `HTTP ${res.status}: ${res.statusText}`,
        });
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      // Checkout session response logged
      
      if (!data.url) {
        showToast({
          type: 'error',
          title: 'Upgrade failed',
          message: 'No checkout URL received from server',
        });
        throw new Error('No checkout URL received from server');
      }
      
      const stripePromise = getStripePromise();
      if (!stripePromise) {
        throw new Error('Stripe not available on server side');
      }
      const stripe = await stripePromise;
      if (stripe) {
        // Enhanced success notification with next steps
        showToast({
          type: 'success',
          title: 'Redirecting to secure checkout...',
          message: 'Complete your payment to unlock your new features. You\'ll be redirected back here after payment.',
        });
        
        // Store upgrade intent in sessionStorage for post-payment success message
        sessionStorage.setItem('upgradeIntent', JSON.stringify({
          planPriceId,
          timestamp: Date.now(),
          userId
        }));
        
        window.location.href = data.url;
      } else {
        showToast({
          type: 'error',
          title: 'Stripe.js failed to load',
          message: 'Please refresh the page and try again.',
        });
        throw new Error('Stripe.js failed to load. Please refresh the page and try again.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setButtonError((prev) => ({ ...prev, [planPriceId]: err instanceof Error ? err.message : 'Unknown error occurred' }));
      // showToast already called above for errors
      console.error('Upgrade error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check for successful upgrade on page load
  useEffect(() => {
    const upgradeIntent = sessionStorage.getItem('upgradeIntent');
    if (upgradeIntent) {
      try {
        const intent = JSON.parse(upgradeIntent);
        const timeSinceUpgrade = Date.now() - intent.timestamp;
        
        // Show success message if upgrade was recent (within last 5 minutes)
        if (timeSinceUpgrade < 5 * 60 * 1000) {
          showToast({
            type: 'success',
            title: '🎉 Upgrade successful!',
            message: 'Your new plan is now active. Explore your enhanced features below.',
          });
          
          // Show success banner with next steps
          setShowSuccessBanner(true);
          setUpgradedPlan(intent.planPriceId.includes('PRO') ? 'Pro' : intent.planPriceId.includes('ELITE') ? 'Elite' : 'Starter');
          
          // Clear the upgrade intent
          sessionStorage.removeItem('upgradeIntent');
        }
      } catch (error) {
        console.error('Error parsing upgrade intent:', error);
        sessionStorage.removeItem('upgradeIntent');
      }
    }
  }, [showToast]);

  // Manage Subscription handler (copied from account page)
  const handleManageSubscription = async () => {
    if (managingSubscription) return;
    setManagingSubscription(true);
    try {
      const res = await fetch('/api/create-customer-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.url) {
        showToast({
          type: 'info',
          title: 'Opening account management...',
          message: 'You can update billing info, view invoices, and manage your subscription.',
        });
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'No portal URL received');
      }
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Failed to open account management',
        message: err instanceof Error ? err.message : 'Please try again later.',
      });
    } finally {
      setManagingSubscription(false);
    }
  };

  // Add back downgrade confirmation modal logic
  const handleDowngradeClick = (planName: string, priceId: string, renewalDate: string) => {
    setPendingDowngrade({ planName, priceId, renewalDate });
  };

  // Handle successful downgrade
  const handleConfirmDowngrade = async () => {
    if (!pendingDowngrade) return;
    
    try {
      await handleUpgrade(pendingDowngrade.priceId);
      setPendingDowngrade(null);
      
      showToast({
        type: 'success',
        title: 'Downgrade confirmed',
        message: `Your plan will change to ${pendingDowngrade.planName} on ${pendingDowngrade.renewalDate}. You'll keep all current features until then.`,
      });
    } catch (error) {
      // Error handling is already done in handleUpgrade
    }
  };

  // Debug logging
  const plans = getPlans();
  plans.forEach((plan) => {
          // Plan logged
    Object.entries(plan.pricing).forEach(([interval, pricing]) => {
              // Pricing details logged
    });
  });
      // userId logged

  if (sessionLoading) {
    return <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem' }}><h1>Upgrade Your Account</h1><p>Loading...</p></div>;
  }

  if (!session) {
    return <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem' }}><h1>Upgrade Your Account</h1><p>Please sign in to upgrade your account.</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="mb-8 bg-gradient-to-r from-[#5DA271] to-[#3B755D] text-white rounded-xl p-6 shadow-soft">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold">Welcome to {upgradedPlan}!</h2>
              </div>
              <p className="text-white text-opacity-90 mb-4 leading-relaxed">
                Your upgrade is complete and your new features are now active. Here&apos;s what you can do next:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white bg-opacity-10 rounded-lg p-3 border border-neutral-200 shadow-soft">
                  <h3 className="font-semibold mb-2">🚀 Explore New Features</h3>
                  <ul className="text-sm space-y-1">
                    {upgradedPlan === 'Pro' && (
                      <>
                        <li>• Unlimited property lookups</li>
                        <li>• Advanced analytics & insights</li>
                        <li>• Export data to CSV</li>
                      </>
                    )}
                    {upgradedPlan === 'Elite' && (
                      <>
                        <li>• Everything in Pro</li>
                        <li>• API access</li>
                        <li>• Custom reports</li>
                      </>
                    )}
                  </ul>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-3 border border-neutral-200 shadow-soft">
                  <h3 className="font-semibold mb-2">📋 Next Steps</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Start searching for properties</li>
                    <li>• Set up alerts & notifications</li>
                    <li>• Explore your dashboard</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary-green-dark rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Start Searching
                </Link>
                <Link
                  href="/account"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-green-dark transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Account
                </Link>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="ml-4 text-white text-opacity-70 hover:text-opacity-100 transition-opacity"
              aria-label="Close success banner"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Modal for downgrade confirmation */}
      {pendingDowngrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Confirm Downgrade</h2>
            <p className="mb-6 text-gray-700">
              Your current plan will remain active until {pendingDowngrade.renewalDate}. After that, you will be switched to the {pendingDowngrade.planName} plan and billed at the new rate.
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                onClick={() => setPendingDowngrade(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                onClick={handleConfirmDowngrade}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Current Plan Card */}
      {subscriptionInfo && (
        <section className={`rounded-2xl border-4 shadow-soft p-6 flex flex-col items-center mb-8 relative ${subscriptionInfo.tier !== 'free' ? 'border-blue-600 bg-blue-50' : 'border-neutral-200 bg-gray-50'}`}>
          <span className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white">Current Plan</span>
          <div className="text-lg font-bold mb-1">Current Plan: {subscriptionInfo.tier.charAt(0).toUpperCase() + subscriptionInfo.tier.slice(1)}</div>
          <div className="mb-2 text-gray-600 text-center">{subscriptionInfo.tier === 'free' ? 'Basic access, limited features' : subscriptionInfo.tier === 'pro' ? 'Unlimited lookups, alerts, export, full data access' : 'All Pro features + PDF reports, bulk analysis, CRM export'}</div>
          <div className="flex items-center gap-2 text-blue-700 font-bold text-lg mb-2">
            {subscriptionInfo.price && subscriptionInfo.billingInterval ? (
              <>
                {subscriptionInfo.price}
                <span className="text-base font-normal text-gray-600">/ {subscriptionInfo.billingInterval}</span>
              </>
            ) : (
              <>{subscriptionInfo.tier === 'free' ? '£0' : ''}</>
            )}
          </div>
          {/* Renewal/Expiration Date */}
          {subscriptionInfo.renewalDate && (
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>Renewal date: <strong>{subscriptionInfo.renewalDate}</strong></span>
            </div>
          )}
          {/* Scheduled Downgrade Message */}
          {subscriptionInfo.cancelAtPeriodEnd && (
            <div className="text-xs text-red-600 text-center mb-2">
              Your plan will change to Free on {subscriptionInfo.renewalDate}.
            </div>
          )}
          {/* Manage Subscription Button for paid users */}
          {(subscriptionInfo.tier === 'pro' || subscriptionInfo.tier === 'elite') && (
            <button
              onClick={handleManageSubscription}
              disabled={managingSubscription}
              aria-label="Manage your subscription in Stripe Customer Portal"
              className={`mt-4 flex items-center gap-2 px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 font-semibold shadow hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${managingSubscription ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <InformationCircleIcon className="h-5 w-5 text-blue-600" title="Opens the Stripe Customer Portal where you can update payment details, change billing interval, or cancel your subscription." />
              {managingSubscription ? 'Opening Portal…' : 'Manage Subscription'}
            </button>
          )}
        </section>
      )}
      <h1 className="text-3xl font-bold mb-6 text-center">Upgrade Your Account</h1>
      {profileLoading ? (
        <p className="text-center">Loading your profile...</p>
      ) : profileError ? (
        <p className="text-center text-red-600">{profileError}</p>
      ) : (
        <>
          <p className="text-center mb-2">Your current tier: <strong>{userTier}</strong></p>
          {/* Renewal date and expiration message */}
          {userTier !== 'free' && renewalDate && renewalInterval ? (
            <>
              <p className="text-center text-sm text-gray-600 mb-2">
                Renewal date: <strong>{renewalDate}</strong> ({renewalInterval.charAt(0).toUpperCase() + renewalInterval.slice(1)})
              </p>
              {profile?.billing_metadata?.cancel_at_period_end && (
                <p className="text-center text-sm text-red-600 mb-4">
                  Your plan will expire on: <strong>{renewalDate}</strong>
                </p>
              )}
            </>
          ) : userTier !== 'free' ? (
            <p className="text-center text-sm text-gray-600 mb-6">Renewal date: <em>Unknown</em></p>
          ) : (
            <p className="text-center text-sm text-gray-600 mb-6">No renewal date – you&apos;re on the free plan.</p>
          )}
        </>
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
        {plans.map((plan) => {
          if (!subscriptionInfo) return null;
          const currentPlanPricing = plan.pricing[billingInterval];
          if (!currentPlanPricing) return null;

          // Determine user's current tier and interval
          const userTier = subscriptionInfo.tier;
          const userInterval = subscriptionInfo.billingInterval ? String(subscriptionInfo.billingInterval) : '';
          const currentBillingInterval = billingInterval === 'yearly' ? 'year' : billingInterval === 'monthly' ? 'month' : '';
          const isCurrentTier = userTier === plan.tier;
          const isCurrentInterval = isCurrentTier && userInterval === currentBillingInterval;
          const isHigherTier =
            (userTier === 'elite' && plan.tier !== 'elite') ||
            (userTier === 'pro' && plan.tier === 'free');
          const isLowerTier =
            (userTier === 'free' && plan.tier !== 'free') ||
            (userTier === 'pro' && plan.tier === 'elite');
          const isSwitchInterval = isCurrentTier && userInterval !== currentBillingInterval;

          // Button logic
          let buttonLabel = '';
          let buttonDisabled = false;
          let buttonAction: (() => void) | undefined = undefined;

          if (isCurrentTier && isCurrentInterval) {
            buttonLabel = 'Current Plan';
            buttonDisabled = true;
          } else if (isCurrentTier && isSwitchInterval) {
            buttonLabel = billingInterval === 'yearly' ? 'Switch to Yearly' : 'Switch to Monthly';
            buttonAction = () => currentPlanPricing?.priceId && handleUpgrade(currentPlanPricing.priceId);
          } else if (isLowerTier) {
            buttonLabel = `Upgrade to ${plan.name}`;
            buttonAction = () => currentPlanPricing?.priceId && handleUpgrade(currentPlanPricing.priceId);
          } else if (isHigherTier) {
            buttonLabel = `Downgrade to ${plan.name}`;
            buttonAction = () => {
              if (renewalDate && currentPlanPricing?.priceId) {
                handleDowngradeClick(plan.name, currentPlanPricing.priceId, renewalDate);
              } else if (currentPlanPricing?.priceId) {
                handleUpgrade(currentPlanPricing.priceId);
              }
            };
          } else {
            buttonLabel = plan.tier === 'free' ? 'Choose Starter' : `Choose ${plan.name}`;
            buttonAction = () => currentPlanPricing?.priceId && handleUpgrade(currentPlanPricing.priceId);
          }

          return (
            <div
              key={plan.tier + billingInterval}
              className={`flex flex-col justify-between items-center rounded-2xl border shadow-lg p-8 bg-white transition-all duration-200 min-h-[480px] ${isCurrentTier && isCurrentInterval ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-200'}`}
              style={{ minWidth: 260, maxWidth: 340 }}
            >
              {/* Card content (flex-1) */}
              <div className="flex-1 w-full flex flex-col">
                <div className="text-xl font-bold mb-2 text-center">{plan.name}</div>
                <div className="text-2xl font-extrabold mb-2 text-center">{currentPlanPricing.price}</div>
                {currentPlanPricing.savings && (
                  <div className="text-sm text-green-600 font-medium mb-2">{currentPlanPricing.savings}</div>
                )}
                <div className="mb-4 text-gray-600 text-center">{plan.description}</div>
                <ul className="mb-6 text-gray-700 text-sm space-y-1 text-center">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center justify-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Button and message always at the bottom */}
              <div className="w-full flex flex-col items-center mt-auto">
                <Button variant="primary" size="md" className="w-full" onClick={buttonAction} disabled={buttonDisabled || loading || !currentPlanPricing?.priceId}>
                  {buttonLabel}
                  <span className="ml-2 align-middle inline-block">
                    <InformationCircleIcon className="w-5 h-5 text-blue-200 hover:text-white inline" title={
                      isCurrentTier && isCurrentInterval ? 'This is your current plan.' :
                      isCurrentTier && isSwitchInterval ? `Switch your billing interval to ${billingInterval}.` :
                      isLowerTier ? `Upgrade to ${plan.name}: Unlock more features and higher limits.` :
                      isHigherTier ? `Downgrade to ${plan.name}: Your plan will change at renewal.` :
                      plan.tier === 'free' ? 'Choose the free Starter plan.' :
                      `Choose the ${plan.name} plan.`
                    } />
                  </span>
                  {/* Tooltip */}
                  {hoveredPlan === plan.tier && (
                    <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 bg-white border border-blue-200 text-blue-900 text-xs rounded shadow-lg px-3 py-2 whitespace-nowrap">
                      {
                        isCurrentTier && isCurrentInterval ? 'This is your current plan.' :
                        isCurrentTier && isSwitchInterval ? `Switch your billing interval to ${billingInterval}.` :
                        isLowerTier ? `Upgrade to ${plan.name}: Unlock more features and higher limits.` :
                        isHigherTier ? `Downgrade to ${plan.name}: Your plan will change at renewal.` :
                        plan.tier === 'free' ? 'Choose the free Starter plan.' :
                        `Choose the ${plan.name} plan.`
                      }
                    </span>
                  )}
                </Button>
                {buttonError[currentPlanPricing?.priceId || ''] && (
                  <div className="text-red-600 text-sm mt-2">{buttonError[currentPlanPricing?.priceId || '']}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpgradePage;