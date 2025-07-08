'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useSession } from '@supabase/auth-helpers-react';
import { getUserProfile } from '@/utils/getUserProfile';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in environment');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const UPGRADE_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!;
if (!UPGRADE_PRICE_ID) {
  throw new Error('Missing NEXT_PUBLIC_STRIPE_PRO_PRICE_ID in environment');
}

type UserTier = 'free' | 'pro' | 'unknown';

const UpgradePage = () => {
  const session = useSession();
  const userId = session?.user?.id;
  const [userTier, setUserTier] = useState<UserTier>('unknown');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const isPro = userTier === 'pro';

  const handleUpgrade = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, priceId: UPGRADE_PRICE_ID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session');
      const stripe = await stripePromise;
      if (stripe && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Stripe.js failed to load or missing session URL');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem' }}><h1>Upgrade Your Account</h1><p>Loading...</p></div>;
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem' }}>
      <h1>Upgrade Your Account</h1>
      {profileLoading ? (
        <p>Loading your profile...</p>
      ) : profileError ? (
        <p style={{ color: 'red' }}>{profileError}</p>
      ) : (
        <p>Your current tier: <strong>{userTier}</strong></p>
      )}
      <div style={{ margin: '2rem 0' }}>
        <button
          style={{
            background: '#3A7CA5',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            cursor: isPro || loading || profileLoading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            opacity: loading || profileLoading ? 0.7 : 1,
          }}
          disabled={isPro || loading || !userId || profileLoading}
          onClick={handleUpgrade}
        >
          {isPro ? 'You are Pro!' : loading ? 'Redirecting...' : 'Upgrade to Pro'}
        </button>
        {error && <p style={{ color: 'red', marginTop: 16 }}>{error}</p>}
      </div>
      <p>Unlock advanced features and support the project by upgrading to Pro.</p>
    </div>
  );
};

export default UpgradePage; 