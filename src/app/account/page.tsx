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
import { motion } from 'framer-motion';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden"
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3A7CA5]/20 to-[#2C6E91]/20"></div>
        
        <main className="max-w-2xl mx-auto pt-10 p-4 md:p-8 relative z-10">
          <Toaster position="top-center" />
          
          {/* Personalized Greeting */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 text-center bg-gradient-to-r from-[#F5F5DC] to-[#D2B48C] rounded-xl p-6 border border-[#D2B48C] shadow-soft"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 mb-2 leading-tight drop-shadow-lg">
                Hi{userName ? `, ${userName}` : ''}!
              </h1>
              <p className="text-lg md:text-xl text-white font-medium leading-relaxed drop-shadow-md">
                You&apos;re currently on the <span className="font-bold text-white">{planName}</span> plan
              </p>
            </motion.div>
          )}

      {/* Usage Progress Section */}
      {derivedTier === 'free' && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 bg-[#F5F5DC] rounded-xl p-6 border border-[#D2B48C] shadow-soft"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#2C6E91] flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6" />
              Your Usage This Month
            </h2>
            <span className="text-sm font-semibold text-[#3A7CA5]">
              {usageData.lookupsUsed}/{usageData.lookupsLimit} lookups
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-[#E5E5E5] rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  usagePercentage >= 80 ? 'bg-red-500' : 
                  usagePercentage >= 60 ? 'bg-[#D4AF37]' : 'bg-[#5DA271]'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-[#3A7CA5] mt-2">
              <span>{usagePercentage}% used</span>
              {usagePercentage >= 80 && (
                <span className="text-red-600 font-semibold">Almost at limit!</span>
              )}
            </div>
          </div>
          
          {/* Usage Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white bg-opacity-50 rounded-lg p-3 border border-[#D2B48C] shadow-soft">
              <div className="font-semibold text-[#2C6E91]">{usageData.searchesThisMonth}</div>
              <div className="text-[#3A7CA5]">Searches this month</div>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-3 border border-[#D2B48C] shadow-soft">
              <div className="font-semibold text-[#2C6E91]">{usageData.propertiesSaved}</div>
              <div className="text-[#3A7CA5]">Properties saved</div>
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
                  className="px-4 py-2 bg-white text-[#2C6E91] rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Upgrade Now
                </a>
              </div>
            </div>
          )}
        </motion.section>
      )}

      {/* Achievements Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#2C6E91] flex items-center gap-2">
            <TrophyIcon className="w-6 h-6" />
            Achievements
          </h2>
          <span className="text-sm font-semibold text-[#3A7CA5]">
            {earnedAchievements.length}/{totalAchievements} earned
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                achievement.earned
                  ? 'bg-gradient-to-br from-[#D4AF37] to-[#C0C0C0] border-[#D4AF37] text-white shadow-lg'
                  : 'bg-[#F5F5DC] border-[#D2B48C] text-[#3A7CA5] opacity-60'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{achievement.icon}</div>
                <h3 className={`font-bold text-sm mb-1 ${
                  achievement.earned ? 'text-white' : 'text-[#2C6E91]'
                }`}>
                  {achievement.name}
                </h3>
                <p className={`text-xs ${
                  achievement.earned ? 'text-white text-opacity-90' : 'text-[#3A7CA5]'
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
        <div className="mt-4 bg-[#F5F5DC] rounded-lg p-4 border border-[#D2B48C]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#2C6E91]">Achievement Progress</span>
            <span className="text-sm text-[#3A7CA5]">
              {Math.round((earnedAchievements.length / totalAchievements) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-[#E5E5E5] rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#D4AF37] to-[#C0C0C0] h-2 rounded-full transition-all duration-500"
              style={{ width: `${(earnedAchievements.length / totalAchievements) * 100}%` }}
            />
          </div>
        </div>
      </motion.section>

      {/* Referral Rewards */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8 bg-gradient-to-r from-[#5DA271] to-[#3B755D] rounded-xl p-6 text-white shadow-soft"
      >
        <div className="flex items-center gap-3 mb-4">
          <GiftIcon className="w-6 h-6" />
          <h2 className="text-xl font-bold">Refer Friends & Earn Rewards</h2>
        </div>
        <p className="mb-4 text-white text-opacity-90">
          Share BMV Finder with friends and earn exclusive rewards. Both you and your friends get benefits!
        </p>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white bg-opacity-10 rounded-lg p-3 border border-white/20">
            <div className="text-2xl mb-2">🎁</div>
            <h3 className="font-semibold mb-1">Free Month</h3>
            <p className="text-sm text-white text-opacity-80">Get 1 month free for each friend who upgrades</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3 border border-white/20">
            <div className="text-2xl mb-2">⭐</div>
            <h3 className="font-semibold mb-1">Exclusive Features</h3>
            <p className="text-sm text-white text-opacity-80">Unlock premium features for referring 5+ friends</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3 border border-white/20">
            <div className="text-2xl mb-2">🏆</div>
            <h3 className="font-semibold mb-1">VIP Status</h3>
            <p className="text-sm text-white text-opacity-80">Become a VIP member with 10+ referrals</p>
          </div>
        </div>
        <button className="bg-white text-[#2C6E91] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-soft">
          Get Referral Link
        </button>
      </motion.section>

      {/* Current Plan Card */}
      {subscriptionInfo && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`rounded-2xl border-4 shadow-soft p-6 flex flex-col items-center mb-8 relative ${subscriptionInfo.tier !== 'free' ? 'border-[#3A7CA5] bg-[#F5F5DC]' : 'border-[#D2B48C] bg-[#F5F5DC]'}`}
        >
          {/* Recommended for you badge */}
          {user && derivedTier !== 'elite' && (
            <span className="absolute top-4 left-4 bg-[#D4AF37] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white">Recommended for you</span>
          )}
          <span className="absolute top-4 right-4 bg-[#3A7CA5] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white">Current Plan</span>
          <div className="text-lg font-bold mb-1 text-[#2C6E91]">Current Plan: {subscriptionInfo.tier.charAt(0).toUpperCase() + subscriptionInfo.tier.slice(1)}</div>
          <div className="mb-2 text-[#3B755D] text-center">{subscriptionInfo.tier === 'free' ? 'Basic access, limited features' : subscriptionInfo.tier === 'pro' ? 'Unlimited lookups, alerts, export, full data access' : 'All Pro features + PDF reports, bulk analysis, CRM export'}</div>
          <div className="flex items-center gap-2 text-[#3A7CA5] font-bold text-lg mb-2">
            {subscriptionInfo.price && subscriptionInfo.billingInterval ? (
              <>
                {subscriptionInfo.price}
                <span className="text-base font-normal text-[#3B755D]">/ {subscriptionInfo.billingInterval}</span>
              </>
            ) : (
              <>{subscriptionInfo.tier === 'free' ? '£0' : ''}</>
            )}
          </div>
          {/* Renewal/Expiration Date */}
          {subscriptionInfo.renewalDate && (
            <div className="flex items-center gap-2 text-[#2C6E91] mb-2">
              <CalendarIcon className="h-5 w-5 text-[#3A7CA5]" aria-hidden="true" />
              <span>Renewal date: <strong>{subscriptionInfo.renewalDate}</strong></span>
            </div>
          )}
          {/* Scheduled Downgrade Message */}
          {subscriptionInfo.cancelAtPeriodEnd && (
            <div className="text-xs text-red-600 text-center mb-2">
              Your plan will change to Free on {subscriptionInfo.renewalDate}.
            </div>
          )}
        </motion.section>
      )}

      {/* Primary CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col md:flex-row gap-4 mb-6 justify-center items-center"
      >
        <Link href="/account/upgrade">
          <span className="inline-block bg-[#3A7CA5] hover:bg-[#2C6E91] text-white font-semibold py-2 px-6 rounded-lg shadow-soft transition-colors text-lg">
            {derivedTier === 'free' ? 'Upgrade' : 'Change Plan'}
          </span>
        </Link>
        {/* Secondary CTA: Manage Subscription */}
        {canManage && (
          <button
            onClick={handleManageSubscription}
            disabled={managingSubscription}
            className={`inline-block font-semibold py-2 px-6 rounded-lg shadow-soft transition-colors text-lg ${
              managingSubscription 
                ? 'bg-[#E5E5E5] text-[#3B755D] cursor-not-allowed' 
                : 'bg-[#2C6E91] hover:bg-[#3A7CA5] text-white'
            }`}
          >
            {managingSubscription ? 'Opening Portal...' : 'Manage Subscription'}
          </button>
        )}
      </motion.div>

      {/* Upsell Section */}
      {derivedTier === 'free' && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-8 bg-[#F5F5DC] border border-[#D2B48C] rounded-lg p-4 text-center shadow-soft"
        >
          <h2 className="text-lg font-bold mb-2 flex items-center justify-center gap-2 text-[#2C6E91]"><ArrowUpRightIcon className="h-5 w-5 text-[#3A7CA5]" /> Why upgrade?</h2>
          <ul className="text-[#3B755D] text-sm space-y-1 mb-2">
            <li>Unlock unlimited lookups and full analytics</li>
            <li>Export data and receive alerts</li>
            <li>Access PDF reports and bulk analysis (Elite)</li>
          </ul>
          <Link href="/pricing">
            <span className="inline-block bg-[#3A7CA5] hover:bg-[#2C6E91] text-white font-semibold py-2 px-6 rounded-lg shadow-soft transition-colors mt-2">See All Packages</span>
          </Link>
        </motion.section>
      )}
      {derivedTier === 'pro' && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-8 bg-[#F5F5DC] border border-[#D2B48C] rounded-lg p-4 text-center shadow-soft"
        >
          <h2 className="text-lg font-bold mb-2 flex items-center justify-center gap-2 text-[#2C6E91]"><ArrowUpRightIcon className="h-5 w-5 text-[#5DA271]" /> Unlock Elite Features</h2>
          <ul className="text-[#3B755D] text-sm space-y-1 mb-2">
            <li>PDF reports for every property</li>
            <li>Bulk analysis and CRM export</li>
            <li>Priority support</li>
          </ul>
          <Link href="/pricing">
            <span className="inline-block bg-[#5DA271] hover:bg-[#3B755D] text-white font-semibold py-2 px-6 rounded-lg shadow-soft transition-colors mt-2">See Elite Plan</span>
          </Link>
        </motion.section>
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
        <a href="mailto:support@yourdomain.com" className="text-[#3A7CA5] hover:underline font-semibold">Need help? Contact support</a>
      </div>

      {/* User Profile Section */}
      <UserProfile />
        </main>
      </motion.section>
    </div>
  );
} 