"use client";

import { useEffect, useState } from 'react';
import { useUserTier } from '@/hooks/useUserTier';
import { useRouter } from 'next/navigation';
import { parseSubscriptionMetadata, getSubscriptionStatusText, canManageSubscription } from '@/utils/subscriptionUtils';
import { CalendarIcon, ArrowUpRightIcon, ShieldCheckIcon, UserIcon, CreditCardIcon, CogIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// UI Components
import { LoadingSpinner, ErrorMessage } from '../components/ui';

// Existing Components
import UserProfile from '../components/UserProfile';
import { useToast } from '../components/ToastProvider';

const PLANS = [
  {
    name: 'Starter',
    price: '£0',
    description: 'Basic access, limited features',
    tier: 'free',
    features: [
      'Basic search',
      'Limited lookups',
      'No export',
    ],
  },
  {
    name: 'Pro',
    price: '£19/mo',
    description: 'Unlimited lookups, alerts, export, full data access',
    tier: 'pro',
    features: [
      'Unlimited lookups',
      'Alerts & notifications',
      'Export data',
      'Full analytics',
    ],
  },
  {
    name: 'Elite',
    price: '£49/mo',
    description: 'All Pro features + PDF reports, bulk analysis, CRM export',
    tier: 'elite',
    features: [
      'All Pro features',
      'PDF reports',
      'Bulk analysis',
      'CRM export',
    ],
  },
];

export default function AccountPageNew() {
  // Mock user data for development
  const user = { id: 'mock-user-id' };
  const session = { user: user };
  const { tier, loading: tierLoading } = useUserTier(user?.id || null);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const [managingSubscription, setManagingSubscription] = useState(false);
  const { showToast } = useToast();
  
  // Parse subscription info from profile
  const subscriptionInfo = profile ? parseSubscriptionMetadata(profile.billing_metadata) : null;
  const canManage = subscriptionInfo ? canManageSubscription(subscriptionInfo) : false;

  const derivedTier = profile?.billing_metadata?.plan?.name?.toLowerCase() || tier;
  const currentPlan = PLANS.find((p) => p.tier === derivedTier) || PLANS[0];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
      showToast({
        type: 'success',
        title: 'Success!',
        message: 'Your subscription was updated successfully!'
      });
      router.replace('/account', { scroll: false });
    } else if (params.get('canceled') === '1') {
      showToast({
        type: 'warning',
        title: 'Checkout Canceled',
        message: 'Your subscription update was canceled.'
      });
      router.replace('/account', { scroll: false });
    }
  }, [router, showToast]);

  // Load user profile to get subscription details
  useEffect(() => {
    if (!user?.id) return;
    
    const loadProfile = async () => {
      try {
        const supabaseUser = session?.user;
        if (!supabaseUser) return;
        
        const profileData = await fetch('/api/profile-usage?userId=' + user.id)
          .then(res => res.json())
          .catch(() => null);
        
        if (profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    
    loadProfile();
  }, [user?.id, session]);

  // Manage Subscription handler - now handled by ManageSubscriptionButton component

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-100">
        {/* Header placeholder */}
        <div className="bg-white p-8">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-primary-blue-dark mb-4">Please Log In</h1>
            <p className="text-primary-green-dark mb-6">You need to be logged in to access your account.</p>
            <Link href="/">
              <button className="inline-flex items-center px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors">
                Go to Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
              {/* Header placeholder */}
      
      {/* Account Header */}
      <div className="bg-white p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-blue-dark mb-2">Your Account</h1>
          <p className="text-lg text-primary-green-dark">Manage your subscription and profile settings</p>
        </div>
      </div>

      {/* Current Plan Section */}
      {subscriptionInfo && (
        <div className="bg-neutral-100 p-8">
          <div className="max-w-4xl mx-auto">
            <div className={`rounded-2xl border-4 shadow-lg p-8 flex flex-col items-center relative ${
              subscriptionInfo.tier !== 'free' 
                ? 'border-primary-blue bg-gradient-to-br from-[#3A7CA5]/10 to-[#2C6E91]/10' 
                : 'border-neutral-200 bg-white'
            }`}>
              <span className={`absolute top-4 right-4 text-xs font-bold px-4 py-2 rounded-full shadow-lg border-2 border-white ${
                subscriptionInfo.tier !== 'free' 
                  ? 'bg-primary-blue text-white' 
                  : 'bg-neutral-200 text-primary-blue-dark'
              }`}>
                Current Plan
              </span>
              
              <div className="text-2xl font-bold mb-2 text-primary-blue-dark">
                {subscriptionInfo.tier.charAt(0).toUpperCase() + subscriptionInfo.tier.slice(1)} Plan
              </div>
              
              <div className="mb-4 text-primary-green-dark text-center max-w-md">
                {subscriptionInfo.tier === 'free' 
                  ? 'Basic access with limited features' 
                  : subscriptionInfo.tier === 'pro' 
                    ? 'Unlimited lookups, alerts, export, and full data access' 
                    : 'All Pro features plus PDF reports, bulk analysis, and CRM export'
                }
              </div>
              
              <div className="flex items-center gap-2 text-primary-blue font-bold text-2xl mb-4">
                {subscriptionInfo.price && subscriptionInfo.billingInterval ? (
                  <>
                    {subscriptionInfo.price}
                    <span className="text-lg font-normal text-primary-green-dark">/ {subscriptionInfo.billingInterval}</span>
                  </>
                ) : (
                  <>{subscriptionInfo.tier === 'free' ? '£0' : ''}</>
                )}
              </div>
              
              {/* Renewal/Expiration Date */}
              {subscriptionInfo.renewalDate && (
                <div className="flex items-center gap-2 text-primary-green-dark mb-4">
                  <CalendarIcon className="h-5 w-5 text-primary-blue" aria-hidden="true" />
                  <span>Renewal date: <strong>{subscriptionInfo.renewalDate}</strong></span>
                </div>
              )}
              
              {/* Scheduled Downgrade Message */}
              {subscriptionInfo.cancelAtPeriodEnd && (
                <div className="text-sm text-red-600 text-center mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  ⚠️ Your plan will change to Free on {subscriptionInfo.renewalDate}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/account/upgrade">
              <button 
                className="min-w-[200px] inline-flex items-center px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors text-lg"
              >
                {derivedTier === 'free' ? 'Upgrade Plan' : 'Change Plan'}
              </button>
            </Link>
            
            {canManage && (
              <button
                className="min-w-[200px] inline-flex items-center px-6 py-3 border border-primary-blue text-primary-blue rounded-lg hover:bg-primary-blue hover:text-white transition-colors text-lg"
              >
                Manage Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account Features */}
      <div className="bg-neutral-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-blue-dark mb-4">Account Features</h2>
            <p className="text-lg text-primary-green-dark">Everything you need to manage your property research</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md border border-neutral-200">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-xl font-semibold text-primary-blue-dark mb-2">Profile Management</h3>
              <p className="text-primary-green-dark">Update your personal information and preferences</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-neutral-200">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold text-primary-blue-dark mb-2">Billing & Subscriptions</h3>
              <p className="text-primary-green-dark">Manage your subscription, billing, and payment methods</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-neutral-200">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold text-primary-blue-dark mb-2">Account Settings</h3>
              <p className="text-primary-green-dark">Configure notifications, privacy, and security settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Component */}
      <div className="bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <UserProfile />
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-neutral-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-primary-blue-dark mb-6">Quick Actions</h2>
            <p className="text-primary-green-dark">Access your most used features</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/">
              <button
                className="flex flex-col items-center p-6 h-auto space-y-3 border border-primary-blue text-primary-blue rounded-lg hover:bg-primary-blue hover:text-white transition-colors"
              >
                <UserIcon className="w-8 h-8 text-primary-blue" />
                <span className="font-semibold">Search Properties</span>
              </button>
            </Link>
            
            <Link href="/what-should-i-pay">
              <button
                className="flex flex-col items-center p-6 h-auto space-y-3 border border-primary-blue text-primary-blue rounded-lg hover:bg-primary-blue hover:text-white transition-colors"
              >
                <ShieldCheckIcon className="w-8 h-8 text-primary-blue" />
                <span className="font-semibold">Property Valuations</span>
              </button>
            </Link>
            
            <Link href="/deal-calculator">
              <button
                className="flex flex-col items-center p-6 h-auto space-y-3 border border-primary-blue text-primary-blue rounded-lg hover:bg-primary-blue hover:text-white transition-colors"
              >
                <CogIcon className="w-8 h-8 text-primary-blue" />
                <span className="font-semibold">Deal Calculator</span>
              </button>
            </Link>
            
            <Link href="/hpi-dashboard">
              <button
                className="flex flex-col items-center p-6 h-auto space-y-3 border border-primary-blue text-primary-blue rounded-lg hover:bg-primary-blue hover:text-white transition-colors"
              >
                <ArrowUpRightIcon className="w-8 h-8 text-primary-blue" />
                <span className="font-semibold">Market Trends</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 