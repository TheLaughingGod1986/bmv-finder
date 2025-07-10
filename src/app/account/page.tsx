"use client";
import UserProfile from '../components/UserProfile';
import Link from 'next/link';
import { useUser } from '@supabase/auth-helpers-react';
import { useUserTier } from '@/hooks/useUserTier';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { useSession } from '@supabase/auth-helpers-react';
import { parseSubscriptionMetadata, getSubscriptionStatusText, canManageSubscription } from '@/utils/subscriptionUtils';
import { CalendarIcon, ArrowUpRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

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

export default function AccountPage() {
  const user = useUser();
  const session = useSession();
  const { tier, loading: tierLoading } = useUserTier(user?.id || null);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const [managingSubscription, setManagingSubscription] = useState(false);
  
  // Parse subscription info from profile
  const subscriptionInfo = profile ? parseSubscriptionMetadata(profile.billing_metadata) : null;
  const canManage = subscriptionInfo ? canManageSubscription(subscriptionInfo) : false;

  const derivedTier = profile?.billing_metadata?.plan?.name?.toLowerCase() || tier;
  const currentPlan = PLANS.find((p) => p.tier === derivedTier) || PLANS[0];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
      toast.success('Your subscription was updated successfully!');
      // Remove query param from URL
      router.replace('/account', { scroll: false });
    } else if (params.get('canceled') === '1') {
      toast('Checkout was canceled.', { icon: '⚠️' });
      router.replace('/account', { scroll: false });
    }
  }, [router]);

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

  // Manage Subscription handler
  const handleManageSubscription = async () => {
    if (managingSubscription) return; // Prevent double-clicks
    
    setManagingSubscription(true);
    try {
      console.log('Access token:', session?.access_token);
      const res = await fetch('/api/create-customer-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (data.url) {
        toast.success('Opening Stripe Customer Portal...');
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'No portal URL received');
      }
    } catch (err: any) {
      console.error('Manage subscription error:', err);
      toast.error(err.message || 'Failed to open Stripe Customer Portal');
    } finally {
      setManagingSubscription(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto mt-10 p-4 md:p-8 bg-white rounded shadow">
      <Toaster position="top-center" />
      {/* Logo/Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="font-bold text-xl text-blue-700">UK Property Insights</span>
        <h1 className="text-2xl font-bold">Account</h1>
      </div>

      {/* Current Plan Card */}
      {subscriptionInfo && (
        <section className={`rounded-2xl border-4 shadow p-6 flex flex-col items-center mb-8 relative ${subscriptionInfo.tier !== 'free' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
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
              <CalendarIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <span>Renewal date: <strong>{subscriptionInfo.renewalDate}</strong></span>
            </div>
          )}
          {/* Scheduled Downgrade Message */}
          {subscriptionInfo.cancelAtPeriodEnd && (
            <div className="text-xs text-red-600 text-center mb-2">
              Your plan will change to Free on {subscriptionInfo.renewalDate}.
            </div>
          )}
        </section>
      )}

      {/* Primary CTA */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-center items-center">
        <Link href="/account/upgrade">
          <span className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors text-lg">
            {derivedTier === 'free' ? 'Upgrade' : 'Change Plan'}
          </span>
        </Link>
        {/* Secondary CTA: Manage Subscription */}
        {canManage && (
          <button
            onClick={handleManageSubscription}
            disabled={managingSubscription}
            className={`inline-block font-semibold py-2 px-6 rounded-lg shadow transition-colors text-lg ${
              managingSubscription 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-gray-700 hover:bg-gray-900 text-white'
            }`}
          >
            {managingSubscription ? 'Opening Portal...' : 'Manage Subscription'}
          </button>
        )}
      </div>

      {/* Upsell Section */}
      {derivedTier === 'free' && (
        <section className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <h2 className="text-lg font-bold mb-2 flex items-center justify-center gap-2"><ArrowUpRightIcon className="h-5 w-5 text-blue-600" /> Why upgrade?</h2>
          <ul className="text-gray-700 text-sm space-y-1 mb-2">
            <li>Unlock unlimited lookups and full analytics</li>
            <li>Export data and receive alerts</li>
            <li>Access PDF reports and bulk analysis (Elite)</li>
          </ul>
          <Link href="/pricing">
            <span className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors mt-2">See All Packages</span>
          </Link>
        </section>
      )}
      {derivedTier === 'pro' && (
        <section className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <h2 className="text-lg font-bold mb-2 flex items-center justify-center gap-2"><ArrowUpRightIcon className="h-5 w-5 text-green-600" /> Unlock Elite Features</h2>
          <ul className="text-gray-700 text-sm space-y-1 mb-2">
            <li>PDF reports for every property</li>
            <li>Bulk analysis and CRM export</li>
            <li>Priority support</li>
          </ul>
          <Link href="/pricing">
            <span className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors mt-2">See Elite Plan</span>
          </Link>
        </section>
      )}

      {/* Testimonial/Trust Badge */}
      <section className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 mb-2">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-700">Trusted by 1,000+ property investors</span>
        </div>
        <blockquote className="italic text-gray-600 max-w-md mx-auto mt-2">“This platform is a game changer for property research and investment.”</blockquote>
      </section>

      {/* Support/Help Link */}
      <div className="text-center mb-2">
        <a href="mailto:support@yourdomain.com" className="text-blue-600 hover:underline font-semibold">Need help? Contact support</a>
      </div>

      {/* User Profile Section */}
      <UserProfile />
    </main>
  );
} 