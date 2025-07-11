"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useUserTier } from '@/hooks/useUserTier';
import { useRouter } from 'next/navigation';
import { useSession } from '@supabase/auth-helpers-react';
import { parseSubscriptionMetadata, getSubscriptionStatusText, canManageSubscription } from '@/utils/subscriptionUtils';
import { CalendarIcon, ArrowUpRightIcon, ShieldCheckIcon, UserIcon, CreditCardIcon, CogIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// New UI Components
import { 
  Header, 
  Section, 
  Button, 
  FeatureCard,
  ManageSubscriptionButton 
} from '../components/ui';

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
  const user = useUser();
  const session = useSession();
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
      <div className="min-h-screen bg-[#F5F5DC]">
        <Header />
        <Section background="white">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-[#2C6E91] mb-4">Please Log In</h1>
            <p className="text-[#3B755D] mb-6">You need to be logged in to access your account.</p>
            <Link href="/">
              <Button variant="primary">
                Go to Home
              </Button>
            </Link>
          </div>
        </Section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      <Header />
      
      {/* Account Header */}
      <Section background="white">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#2C6E91] mb-2">Your Account</h1>
          <p className="text-lg text-[#3B755D]">Manage your subscription and profile settings</p>
        </div>
      </Section>

      {/* Current Plan Section */}
      {subscriptionInfo && (
        <Section background="light">
          <div className="max-w-4xl mx-auto">
            <div className={`rounded-2xl border-4 shadow-lg p-8 flex flex-col items-center relative ${
              subscriptionInfo.tier !== 'free' 
                ? 'border-[#3A7CA5] bg-gradient-to-br from-[#3A7CA5]/10 to-[#2C6E91]/10' 
                : 'border-[#E5E5E5] bg-white'
            }`}>
              <span className={`absolute top-4 right-4 text-xs font-bold px-4 py-2 rounded-full shadow-lg border-2 border-white ${
                subscriptionInfo.tier !== 'free' 
                  ? 'bg-[#3A7CA5] text-white' 
                  : 'bg-[#E5E5E5] text-[#2C6E91]'
              }`}>
                Current Plan
              </span>
              
              <div className="text-2xl font-bold mb-2 text-[#2C6E91]">
                {subscriptionInfo.tier.charAt(0).toUpperCase() + subscriptionInfo.tier.slice(1)} Plan
              </div>
              
              <div className="mb-4 text-[#3B755D] text-center max-w-md">
                {subscriptionInfo.tier === 'free' 
                  ? 'Basic access with limited features' 
                  : subscriptionInfo.tier === 'pro' 
                    ? 'Unlimited lookups, alerts, export, and full data access' 
                    : 'All Pro features plus PDF reports, bulk analysis, and CRM export'
                }
              </div>
              
              <div className="flex items-center gap-2 text-[#3A7CA5] font-bold text-2xl mb-4">
                {subscriptionInfo.price && subscriptionInfo.billingInterval ? (
                  <>
                    {subscriptionInfo.price}
                    <span className="text-lg font-normal text-[#3B755D]">/ {subscriptionInfo.billingInterval}</span>
                  </>
                ) : (
                  <>{subscriptionInfo.tier === 'free' ? '£0' : ''}</>
                )}
              </div>
              
              {/* Renewal/Expiration Date */}
              {subscriptionInfo.renewalDate && (
                <div className="flex items-center gap-2 text-[#3B755D] mb-4">
                  <CalendarIcon className="h-5 w-5 text-[#3A7CA5]" aria-hidden="true" />
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
        </Section>
      )}

      {/* Action Buttons */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/account/upgrade">
              <Button 
                variant="primary" 
                size="lg"
                className="min-w-[200px]"
              >
                {derivedTier === 'free' ? 'Upgrade Plan' : 'Change Plan'}
              </Button>
            </Link>
            
            {canManage && (
              <ManageSubscriptionButton
                variant="outline"
                size="lg"
                className="min-w-[200px]"
              >
                Manage Subscription
              </ManageSubscriptionButton>
            )}
          </div>
        </div>
      </Section>

      {/* Account Features */}
      <Section background="light">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2C6E91] mb-4">Account Features</h2>
            <p className="text-lg text-[#3B755D]">Everything you need to manage your property research</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="👤"
              title="Profile Management"
              description="Update your personal information and preferences"
            />
            <FeatureCard
              icon="💳"
              title="Billing & Subscriptions"
              description="Manage your subscription, billing, and payment methods"
            />
            <FeatureCard
              icon="⚙️"
              title="Account Settings"
              description="Configure notifications, privacy, and security settings"
            />
          </div>
        </div>
      </Section>

      {/* User Profile Component */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <UserProfile />
        </div>
      </Section>

      {/* Quick Links */}
      <Section background="light">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#2C6E91] mb-4">Quick Actions</h2>
            <p className="text-[#3B755D]">Access your most used features</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/">
              <Button
                variant="outline"
                className="flex flex-col items-center p-6 h-auto space-y-3 hover-lift"
              >
                <UserIcon className="w-8 h-8 text-[#3A7CA5]" />
                <span className="font-semibold">Search Properties</span>
              </Button>
            </Link>
            
            <Link href="/what-should-i-pay">
              <Button
                variant="outline"
                className="flex flex-col items-center p-6 h-auto space-y-3 hover-lift"
              >
                <ShieldCheckIcon className="w-8 h-8 text-[#3A7CA5]" />
                <span className="font-semibold">Property Valuations</span>
              </Button>
            </Link>
            
            <Link href="/deal-calculator">
              <Button
                variant="outline"
                className="flex flex-col items-center p-6 h-auto space-y-3 hover-lift"
              >
                <CogIcon className="w-8 h-8 text-[#3A7CA5]" />
                <span className="font-semibold">Deal Calculator</span>
              </Button>
            </Link>
            
            <Link href="/hpi-dashboard">
              <Button
                variant="outline"
                className="flex flex-col items-center p-6 h-auto space-y-3 hover-lift"
              >
                <ArrowUpRightIcon className="w-8 h-8 text-[#3A7CA5]" />
                <span className="font-semibold">Market Trends</span>
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
} 