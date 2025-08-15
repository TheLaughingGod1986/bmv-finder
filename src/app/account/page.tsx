"use client";
import UserProfile from '../components/UserProfile';
import Link from 'next/link';
import { useUserTier } from '@/hooks/useUserTier';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
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
  SparklesIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  CalculatorIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  BellIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  ClockIcon,
  ArrowRightIcon
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
  // Mock user data for development
  const user = { id: 'mock-user-id', email: 'user@example.com', user_metadata: { full_name: 'Demo User' } };
  const session = { user: user, access_token: 'mock-token' };
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
    <div className="min-h-screen bg-neutral-beige">
      <Toaster position="top-center" />
      
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative bg-gradient-to-br from-primary-blue to-primary-blue-dark text-white py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {user ? (
              <>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-5xl font-bold mb-4"
                >
                  Welcome back{userName ? `, ${userName}` : ''}!
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl md:text-2xl text-blue-100 mb-6"
                >
                  You're on the <span className="font-semibold text-accent-gold">{planName}</span> plan
                </motion.p>
              </>
            ) : (
              <>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-5xl font-bold mb-4"
                >
                  Welcome to Property Intelligence Platform!
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl md:text-2xl text-blue-100 mb-6"
                >
                  Demo Mode - Sign in to access your full account
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 max-w-2xl mx-auto"
                >
                  <h3 className="text-lg font-semibold mb-3">Demo Features Available:</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MagnifyingGlassIcon className="w-5 h-5 text-accent-gold" />
                      <span>Sample usage data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrophyIcon className="w-5 h-5 text-accent-gold" />
                      <span>Achievement system</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cog6ToothIcon className="w-5 h-5 text-accent-gold" />
                      <span>Interface testing</span>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </motion.section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Quick Stats Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <div className="bg-white rounded-xl shadow-soft p-6 border border-neutral-grey hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Searches This Month</p>
                <p className="text-2xl font-bold text-primary-blue">{usageData.searchesThisMonth}</p>
              </div>
                              <MagnifyingGlassIcon className="w-8 h-8 text-primary-blue" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-soft p-6 border border-neutral-grey hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Properties Saved</p>
                <p className="text-2xl font-bold text-primary-green">{usageData.propertiesSaved}</p>
              </div>
              <HomeIcon className="w-8 h-8 text-primary-green" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-soft p-6 border border-neutral-grey hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Days Active</p>
                <p className="text-2xl font-bold text-accent-gold">{usageData.daysActive}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-accent-gold" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-soft p-6 border border-neutral-grey hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Achievements</p>
                <p className="text-2xl font-bold text-primary-blue">{earnedAchievements.length}/{totalAchievements}</p>
              </div>
              <TrophyIcon className="w-8 h-8 text-primary-blue" />
            </div>
          </div>
        </motion.section>

        {/* Usage Progress Section */}
        {(derivedTier === 'free' || !user) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-soft p-8 border border-neutral-grey mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <ChartBarIcon className="w-8 h-8 text-primary-blue" />
                {user ? 'Your Usage This Month' : 'Sample Usage Data'}
              </h2>
              <span className="text-lg font-semibold text-gray-600">
                {usageData.lookupsUsed}/{usageData.lookupsLimit} lookups
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${
                    usagePercentage >= 80 ? 'bg-red-500' : 
                    usagePercentage >= 60 ? 'bg-yellow-500' : 'bg-primary-green'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>{usagePercentage}% used</span>
                {usagePercentage >= 80 && (
                  <span className="text-red-600 font-semibold">Almost at limit!</span>
                )}
              </div>
            </div>
            
            {/* Upgrade CTA */}
            {usagePercentage >= 60 && (
              <div className="bg-gradient-to-r from-primary-blue to-primary-blue-dark rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Ready for unlimited access?</h3>
                    <p className="text-blue-100">Upgrade to Pro for unlimited lookups and advanced features</p>
                  </div>
                  <Link href="/account/upgrade">
                    <span className="inline-flex items-center gap-2 bg-white text-primary-blue px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                      Upgrade Now
                      <ArrowRightIcon className="w-5 h-5" />
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* Achievements Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-soft p-8 border border-neutral-grey mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <TrophyIcon className="w-8 h-8 text-accent-gold" />
              Achievements
            </h2>
            <span className="text-lg font-semibold text-gray-600">
              {earnedAchievements.length}/{totalAchievements} earned
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-xl border transition-all duration-300 hover-lift ${
                  achievement.earned
                    ? 'bg-gradient-to-br from-accent-gold/10 to-yellow-100 border-accent-gold/30 text-gray-900'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">{achievement.icon}</div>
                  <h3 className="font-bold text-sm mb-2">
                    {achievement.name}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {achievement.description}
                  </p>
                  {achievement.earned && (
                    <div className="mt-3">
                      <SparklesIcon className="w-5 h-5 mx-auto text-accent-gold" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Achievement Progress */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-gray-900">Achievement Progress</span>
              <span className="text-lg text-gray-600">
                {Math.round((earnedAchievements.length / totalAchievements) * 100)}% complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-accent-gold to-yellow-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(earnedAchievements.length / totalAchievements) * 100}%` }}
              />
            </div>
          </div>
        </motion.section>

        {/* Current Plan & Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
        >
          {/* Current Plan Card */}
          <div className="bg-white rounded-xl shadow-soft p-8 border border-neutral-grey relative">
            <div className="absolute top-4 right-4 bg-primary-blue text-white text-sm font-bold px-3 py-1 rounded-full">
              Current Plan
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Subscription</h2>
            
            {subscriptionInfo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    {subscriptionInfo.tier.charAt(0).toUpperCase() + subscriptionInfo.tier.slice(1)} Plan
                  </span>
                  <span className="text-2xl font-bold text-primary-blue">
                    {subscriptionInfo.price || '£0'}
                  </span>
                </div>
                
                {subscriptionInfo.renewalDate && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="w-5 h-5" />
                    <span>Renewal: <strong>{subscriptionInfo.renewalDate}</strong></span>
                  </div>
                )}
                
                {subscriptionInfo.cancelAtPeriodEnd && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">
                      Your plan will change to Free on {subscriptionInfo.renewalDate}.
                    </p>
                  </div>
                )}
                
                {canManage && (
                  <button
                    onClick={handleManageSubscription}
                    disabled={managingSubscription}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-colors ${
                      managingSubscription 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-primary-blue hover:bg-primary-blue-dark text-white'
                    }`}
                  >
                    <CreditCardIcon className="w-5 h-5" />
                    {managingSubscription ? 'Opening Portal...' : 'Manage Subscription'}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No active subscription found</p>
                <Link href="/account/upgrade">
                  <span className="inline-flex items-center gap-2 bg-primary-blue hover:bg-primary-blue-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    Choose a Plan
                    <ArrowRightIcon className="w-5 h-5" />
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-soft p-8 border border-neutral-grey">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <Link href="/search">
                <span className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <MagnifyingGlassIcon className="w-6 h-6 text-primary-blue" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Search Properties</h3>
                    <p className="text-sm text-gray-600">Find your next investment</p>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-gray-400 ml-auto" />
                </span>
              </Link>
              
              <Link href="/watchlist">
                <span className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <HomeIcon className="w-6 h-6 text-primary-green" />
                  <div>
                    <h3 className="font-semibold text-gray-900">View Watchlist</h3>
                    <p className="text-sm text-gray-600">Check saved properties</p>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-gray-400 ml-auto" />
                </span>
              </Link>
              
              <Link href="/deal-calculator">
                <span className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <CalculatorIcon className="w-6 h-6 text-accent-gold" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Deal Calculator</h3>
                    <p className="text-sm text-gray-600">Calculate ROI & yields</p>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-gray-400 ml-auto" />
                </span>
              </Link>
              
              <Link href="/market-analysis">
                <span className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <ChartBarIcon className="w-6 h-6 text-primary-blue" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Market Analysis</h3>
                    <p className="text-sm text-gray-600">View market trends</p>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-gray-400 ml-auto" />
                </span>
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Referral Rewards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-primary-green to-primary-green-dark rounded-xl p-8 text-white mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <GiftIcon className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold">Refer Friends & Earn Rewards</h2>
          </div>
          <p className="mb-6 text-green-100">
            Share Property Intelligence Platform with friends and earn exclusive rewards. Both you and your friends get benefits!
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl mb-3">🎁</div>
              <h3 className="font-semibold mb-2">Free Month</h3>
              <p className="text-sm text-green-100">Get 1 month free for each friend who upgrades</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl mb-3">⭐</div>
              <h3 className="font-semibold mb-2">Exclusive Features</h3>
              <p className="text-sm text-green-100">Unlock premium features for referring 5+ friends</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="font-semibold mb-2">VIP Status</h3>
              <p className="text-sm text-green-100">Become a VIP member with 10+ referrals</p>
            </div>
          </div>
          <button className="bg-white text-primary-green px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Get Referral Link
          </button>
        </motion.section>

        {/* Trust and Social Proof */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-soft border border-neutral-grey mb-4">
            <ShieldCheckIcon className="w-6 h-6 text-primary-blue" />
            <span className="font-semibold text-gray-900">Trusted by 50,000+ property professionals</span>
          </div>
          <blockquote className="italic text-gray-600 max-w-2xl mx-auto text-lg">
            &ldquo;This platform is a game changer for property research and investment.&rdquo;
          </blockquote>
        </motion.section>

        {/* Trust Badges and Testimonials */}
        <TrustBadges />
        <PartnerLogos />
        <Testimonials />

        {/* Support Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-white rounded-xl shadow-soft p-8 border border-neutral-grey text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you get the most out of Property Intelligence Platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:support@bmvfinder.com" 
              className="inline-flex items-center gap-2 bg-primary-blue hover:bg-primary-blue-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <InformationCircleIcon className="w-5 h-5" />
              Contact Support
            </a>
            <Link href="/help">
              <span className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors">
                <DocumentTextIcon className="w-5 h-5" />
                Help Center
              </span>
            </Link>
          </div>
        </motion.section>

        {/* User Profile Section */}
        <UserProfile />
      </main>
    </div>
  );
} 