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
import { CalendarIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { useToast } from '../components/ToastProvider';
import { getUserProfile } from '@/utils/getUserProfile';
import { format } from 'date-fns';
import { 
  ShieldCheckIcon, 
  InformationCircleIcon,
  TrophyIcon,
  StarIcon,
  GiftIcon,
  ChartBarIcon,
  UserGroupIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import TrustBadges from '../components/TrustBadges';
import PartnerLogos from '../components/PartnerLogos';
import Testimonials from '../components/Testimonials';

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

  // Personalized greeting and plan reference
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const planName = derivedTier ? derivedTier.charAt(0).toUpperCase() + derivedTier.slice(1) : '';
  
  // Mock usage data - replace with real data from your backend
  const usageData = {
    lookupsUsed: 3,
    lookupsLimit: 5,
    searchesThisMonth: 12,
    propertiesSaved: 8,
    daysActive: 15
  };
  
  const usagePercentage = Math.round((usageData.lookupsUsed / usageData.lookupsLimit) * 100);
  
  // Achievement badges
  const achievements = [
    { id: 'first_search', name: 'First Search', description: 'Completed your first property search', earned: true, icon: '🔍' },
    { id: 'saved_property', name: 'Property Saver', description: 'Saved your first property', earned: true, icon: '💾' },
    { id: 'upgrade', name: 'Upgrader', description: 'Upgraded to a paid plan', earned: derivedTier !== 'free', icon: '⭐' },
    { id: 'power_user', name: 'Power User', description: 'Used the platform for 30+ days', earned: usageData.daysActive >= 30, icon: '⚡' },
    { id: 'referral', name: 'Referral Master', description: 'Referred 3 friends', earned: false, icon: '👥' },
    { id: 'data_expert', name: 'Data Expert', description: 'Exported data 10+ times', earned: false, icon: '📊' }
  ];
  
  const earnedAchievements = achievements.filter(a => a.earned);
  const totalAchievements = achievements.length;

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
  }, [router, toast]);

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
      // Access token logged
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
    } catch (err: unknown) {
      console.error('Manage subscription error:', err);
      toast.error((err as any).message || 'Failed to open Stripe Customer Portal');
    } finally {
      setManagingSubscription(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto mt-10 p-4 md:p-8 bg-white rounded-xl shadow-soft border border-neutral-200">
      <Toaster position="top-center" />
      
      {/* Personalized Greeting */}
      {user && (
        <div className="mb-8 text-center bg-gradient-to-r from-[#F5F5DC] to-[#E5E5E5] rounded-xl p-6 border border-neutral-200 shadow-soft">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-blue-dark mb-2 leading-tight">
            Hi{userName ? `, ${userName}` : ''}!
          </h1>
          <p className="text-lg md:text-xl text-primary-600 font-medium leading-relaxed">
            You&apos;re currently on the <span className="font-bold text-primary-blue-dark">{planName}</span> plan
          </p>
        </div>
      )}

      {/* Usage Progress Section */}
      {derivedTier === 'free' && (
        <section className="mb-8 bg-neutral-100 rounded-xl p-6 border border-neutral-200 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-primary-blue-dark flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6" />
              Your Usage This Month
            </h2>
            <span className="text-sm font-semibold text-primary-600">
              {usageData.lookupsUsed}/{usageData.lookupsLimit} lookups
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-neutral-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  usagePercentage >= 80 ? 'bg-red-500' : 
                  usagePercentage >= 60 ? 'bg-yellow-500' : 'bg-secondary-600'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-primary-600 mt-2">
              <span>{usagePercentage}% used</span>
              {usagePercentage >= 80 && (
                <span className="text-red-600 font-semibold">Almost at limit!</span>
              )}
            </div>
          </div>
          
          {/* Usage Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white bg-opacity-50 rounded-lg p-3 border border-neutral-200 shadow-soft">
              <div className="font-semibold text-primary-blue-dark">{usageData.searchesThisMonth}</div>
              <div className="text-primary-600">Searches this month</div>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-3 border border-neutral-200 shadow-soft">
              <div className="font-semibold text-primary-blue-dark">{usageData.propertiesSaved}</div>
              <div className="text-primary-600">Properties saved</div>
            </div>
          </div>
          
          {/* Upgrade CTA */}
          {usagePercentage >= 60 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-[#3A7CA5] to-[#2C6E91] rounded-lg text-white shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold mb-1">Ready for unlimited access?</h3>
                  <p className="text-sm opacity-90">Upgrade to Pro for unlimited lookups and advanced features</p>
                </div>
                <a
                  href="/account/upgrade"
                  className="px-4 py-2 bg-white text-primary-blue-dark rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Upgrade Now
                </a>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Achievements Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary-blue-dark flex items-center gap-2">
            <TrophyIcon className="w-6 h-6" />
            Achievements
          </h2>
          <span className="text-sm font-semibold text-primary-600">
            {earnedAchievements.length}/{totalAchievements} earned
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                achievement.earned
                  ? 'bg-gradient-to-br from-yellow-500 to-gray-400 border-yellow-500 text-white shadow-lg'
                  : 'bg-neutral-100 border-neutral-200 text-primary-600 opacity-60'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{achievement.icon}</div>
                <h3 className={`font-bold text-sm mb-1 ${
                  achievement.earned ? 'text-white' : 'text-primary-blue-dark'
                }`}>
                  {achievement.name}
                </h3>
                <p className={`text-xs ${
                  achievement.earned ? 'text-white text-opacity-90' : 'text-primary-600'
                }`}>
                  {achievement.description}
                </p>
                {achievement.earned && (
                  <div className="mt-2">
                    <SparklesIcon className="w-4 h-4 mx-auto text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Achievement Progress */}
        <div className="mt-4 bg-neutral-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-primary-blue-dark">Achievement Progress</span>
            <span className="text-sm text-primary-600">
              {Math.round((earnedAchievements.length / totalAchievements) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-500 to-gray-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(earnedAchievements.length / totalAchievements) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* Referral Rewards */}
      <section className="mb-8 bg-gradient-to-r from-[#5DA271] to-[#3B755D] rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <GiftIcon className="w-6 h-6" />
          <h2 className="text-xl font-bold">Refer Friends & Earn Rewards</h2>
        </div>
        <p className="mb-4 text-white text-opacity-90">
          Share BMV Finder with friends and earn exclusive rewards. Both you and your friends get benefits!
        </p>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <div className="text-2xl mb-2">🎁</div>
            <h3 className="font-semibold mb-1">Free Month</h3>
            <p className="text-sm text-white text-opacity-80">Get 1 month free for each friend who upgrades</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <div className="text-2xl mb-2">⭐</div>
            <h3 className="font-semibold mb-1">Exclusive Features</h3>
            <p className="text-sm text-white text-opacity-80">Unlock premium features for referring 5+ friends</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <div className="text-2xl mb-2">🏆</div>
            <h3 className="font-semibold mb-1">VIP Status</h3>
            <p className="text-sm text-white text-opacity-80">Become a VIP member with 10+ referrals</p>
          </div>
        </div>
        <button className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          Get Referral Link
        </button>
      </section>

      {/* Current Plan Card */}
      {subscriptionInfo && (
        <section className={`rounded-2xl border-4 shadow-soft p-6 flex flex-col items-center mb-8 relative ${subscriptionInfo.tier !== 'free' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
          {/* Recommended for you badge */}
          {user && derivedTier !== 'elite' && (
            <span className="absolute top-4 left-4 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white">Recommended for you</span>
          )}
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

      {/* Trust and Social Proof */}
      <TrustBadges />
      <PartnerLogos />
      <Testimonials />

      {/* Support/Help Link */}
      <div className="text-center mb-2">
        <a href="mailto:support@yourdomain.com" className="text-blue-600 hover:underline font-semibold">Need help? Contact support</a>
      </div>

      {/* User Profile Section */}
      <UserProfile />
    </main>
  );
} 