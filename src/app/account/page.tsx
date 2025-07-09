"use client";
import UserProfile from '../components/UserProfile';
import Link from 'next/link';
import { useUser } from '@supabase/auth-helpers-react';
import { useUserTier } from '@/hooks/useUserTier';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

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
  const { tier, loading: tierLoading } = useUserTier(user?.id);
  const currentPlan = PLANS.find((p) => p.tier === tier) || PLANS[0];
  const router = useRouter();

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

  // Manage Subscription handler
  const handleManageSubscription = async () => {
    try {
      const res = await fetch('/api/create-customer-portal-session', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to open Stripe Customer Portal');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to open Stripe Customer Portal');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <Toaster position="top-center" />
      <h1 className="text-2xl font-bold mb-6">Account</h1>
      {/* Plan summary card */}
      <div className="mb-8">
        <div className={
          'rounded-xl border shadow p-6 flex flex-col items-center ' +
          (currentPlan.tier !== 'free' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white')
        }>
          <div className="text-lg font-bold mb-1">Current Plan</div>
          <div className="text-xl font-extrabold mb-1">{tierLoading ? 'Loading...' : currentPlan.name}</div>
          <div className="mb-2 text-gray-600 text-center">{currentPlan.description}</div>
          <ul className="mb-4 text-sm text-gray-700 list-disc list-inside text-left w-full">
            {currentPlan.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <div className="text-blue-700 font-bold text-lg">{currentPlan.price}</div>
        </div>
      </div>
      <UserProfile />
      <div className="mt-8 flex flex-col items-center gap-4">
        <Link href="/account/upgrade">
          <span className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors">Change Plan</span>
        </Link>
        <button
          onClick={handleManageSubscription}
          className="inline-block bg-gray-700 hover:bg-gray-900 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors mt-2"
        >
          Manage Subscription
        </button>
      </div>
    </div>
  );
} 