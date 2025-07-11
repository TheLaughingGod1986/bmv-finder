'use client';
import React, { useState, useEffect, useMemo } from "react";
import { createClient } from '@supabase/supabase-js';
import { useUserTier } from '@/hooks/useUserTier';

// Client-side only Supabase client
function getSupabase() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are not set');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Custom hook for user management
function useClientUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = useMemo(() => getSupabase(), []);
  
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    
    return () => subscription.unsubscribe();
  }, [supabase]);
  
  return { user, loading };
}

// Client-side only Stripe Price IDs
function getStripePriceIds() {
  if (typeof window === 'undefined') {
    return {
      PRO_YEARLY_PRICE_ID: null,
      ELITE_YEARLY_PRICE_ID: null,
      ELITE_MONTHLY_PRICE_ID: null,
      PRO_MONTHLY_PRICE_ID: null,
      PDF_REPORT_PRICE_ID: null,
    };
  }
  
  const PRO_YEARLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID;
  const ELITE_YEARLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_ELITE_YEARLY_PRICE_ID;
  const ELITE_MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_ELITE_MONTHLY_PRICE_ID;
  const PRO_MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID;
  const PDF_REPORT_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PDF_REPORT_PRICE_ID;

if (!PRO_YEARLY_PRICE_ID || !ELITE_YEARLY_PRICE_ID || !ELITE_MONTHLY_PRICE_ID || !PRO_MONTHLY_PRICE_ID || !PDF_REPORT_PRICE_ID) {
    console.warn('One or more Stripe Price IDs are missing from your environment variables.');
  }

  return {
    PRO_YEARLY_PRICE_ID,
    ELITE_YEARLY_PRICE_ID,
    ELITE_MONTHLY_PRICE_ID,
    PRO_MONTHLY_PRICE_ID,
    PDF_REPORT_PRICE_ID,
  };
}

const UpgradeButton = ({ userId, priceId, children }: { userId: string; priceId: string; children: React.ReactNode }) => {
  if (!userId || !priceId) return null;
  const handleUpgrade = async () => {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, priceId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || "Failed to start checkout.");
    }
  };

  return (
    <button className="btn btn-primary" onClick={handleUpgrade}>
      {children}
    </button>
  );
};

export default function PricingPage() {
  const { user, loading: userLoading } = useClientUser();
  const { tier: userTier } = useUserTier(user?.id || null);
  const stripePriceIds = getStripePriceIds();

  // Personalized greeting and plan reference
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const planName = userTier ? userTier.charAt(0).toUpperCase() + userTier.slice(1) : '';

  // Don't render the component if we're on the server side
  if (typeof window === 'undefined') {
    return null;
  }

  if (userLoading) {
    return <div className="max-w-5xl mx-auto mt-10 p-4 md:p-8 bg-white rounded shadow">
      <div className="text-center">Loading...</div>
    </div>;
  }

  return (
    <main className="max-w-5xl mx-auto mt-10 p-4 md:p-8 bg-white rounded shadow">
      {/* Personalized Greeting */}
      {user && (
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#2C6E91]">Welcome back{userName ? `, ${userName}` : ''}!</h2>
          <p className="text-lg text-[#3B755D] mt-1">You’re currently on the <span className="font-semibold text-[#3A7CA5]">{planName} plan</span>.</p>
        </div>
      )}
      {/* Hero Section */}
      <section className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-4">Find the Right Plan for Your Property Journey</h1>
        <p className="text-lg text-gray-600 mb-6">Compare features, see what's included, and choose the perfect plan for you. Upgrade anytime.</p>
        <a href="#plans" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow transition-colors text-lg">See Plans</a>
      </section>

      {/* Feature Comparison Table */}
      <section id="plans" className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Compare Plans</h2>
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8">
          {/* Starter Plan Card */}
          <div className="flex flex-col items-center bg-white rounded-2xl shadow-lg p-8 w-80 mb-0 relative">
            {/* Recommended for you badge */}
            {user && userTier === 'free' && (
              <span className="absolute top-4 left-4 bg-[#D4AF37] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white">Recommended for you</span>
            )}
            <h3 className="text-xl font-bold mb-2">Starter</h3>
            <div className="text-2xl font-extrabold mb-2">£0</div>
            <div className="mb-4 text-gray-600 text-center">Basic access, limited features</div>
            <ul className="mb-6 text-gray-700 text-sm space-y-1 text-center">
              <li className="flex items-center justify-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />Basic search</li>
              <li className="flex items-center justify-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />Limited lookups</li>
              <li className="flex items-center justify-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />No export</li>
            </ul>
            <a
              href={user ? "/dashboard" : "/signup"}
              className="w-full py-3 rounded-lg font-semibold text-base bg-blue-600 hover:bg-blue-700 text-white text-center transition mt-auto"
            >
              Get Started Free
            </a>
          </div>
          {/* Pro Plan Card */}
          <div className={`flex flex-col items-center rounded-2xl shadow-lg p-8 w-80 mb-0 relative ${user && userTier === 'pro' ? 'border-4 border-blue-600 bg-blue-50' : 'border border-gray-200 bg-white'}`}>
            {/* Recommended for you badge */}
            {user && userTier === 'pro' && (
              <span className="absolute top-4 left-4 bg-[#D4AF37] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white">Recommended for you</span>
            )}
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <div className="text-2xl font-extrabold mb-2">£19/mo or £190/yr</div>
            <div className="mb-4 text-gray-600 text-center">Everything you need for property analysis</div>
            <ul className="mb-6 text-gray-700 text-sm space-y-1 text-center">
              <li className="flex items-center justify-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />Unlimited Lookups</li>
              <li className="flex items-center justify-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />Alerts & Notifications</li>
              <li className="flex items-center justify-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />Export Data</li>
              <li className="flex items-center justify-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />Full Analytics</li>
            </ul>
            {!user ? (
              <a href="/account" className="w-full py-3 rounded-lg font-semibold text-base bg-blue-600 hover:bg-blue-700 text-white text-center transition mt-auto">Get Pro</a>
            ) : userTier === 'pro' ? (
              <button className="w-full py-3 rounded-lg font-semibold text-base bg-gray-200 text-gray-500 cursor-not-allowed" disabled>Current Plan</button>
            ) : userTier === 'elite' ? (
              <button className="w-full py-3 rounded-lg font-semibold text-base bg-blue-600 hover:bg-blue-700 text-white" onClick={() => alert('Downgrade via Account page')}>Downgrade to Pro</button>
            ) : (
              <UpgradeButton userId={user?.id || ""} priceId={stripePriceIds.PRO_MONTHLY_PRICE_ID || ""}>
                Upgrade to Pro
              </UpgradeButton>
            )}
          </div>
          {/* Elite Plan Card */}
          <div className={`flex flex-col items-center rounded-2xl shadow-lg p-8 w-80 mb-0 relative ${user && userTier === 'elite' ? 'border-4 border-blue-600 bg-blue-50' : 'border border-gray-200 bg-white'}`}>
            {/* Recommended for you badge */}
            {user && userTier === 'elite' && (
              <span className="absolute top-4 left-4 bg-[#D4AF37] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white">Recommended for you</span>
            )}
            <h3 className="text-xl font-bold mb-2">Elite</h3>
            <div className="text-2xl font-extrabold mb-2">£49/mo or £490/yr</div>
            <div className="mb-4 text-gray-600 text-center">Everything you need for property investment</div>
            <ul className="mb-6 text-gray-700 text-sm space-y-1 text-center">
              <li className="flex items-center justify-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />Everything in Pro</li>
              <li className="flex items-center justify-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />PDF Reports</li>
              <li className="flex items-center justify-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />Bulk Analysis</li>
              <li className="flex items-center justify-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />CRM Export</li>
            </ul>
            {!user ? (
              <a href="/account" className="w-full py-3 rounded-lg font-semibold text-base bg-blue-600 hover:bg-blue-700 text-white text-center transition mt-auto">Get Elite</a>
            ) : userTier === 'elite' ? (
              <button className="w-full py-3 rounded-lg font-semibold text-base bg-gray-200 text-gray-500 cursor-not-allowed" disabled>Current Plan</button>
            ) : (
              <UpgradeButton userId={user?.id || ""} priceId={stripePriceIds.ELITE_MONTHLY_PRICE_ID || ""}>
                Upgrade to Elite
              </UpgradeButton>
            )}
          </div>
        </div>
        {/* Feature Comparison Table */}
        <div className="overflow-x-auto mt-10">
          <table className="min-w-full border rounded-xl overflow-hidden bg-white shadow">
            <thead>
              <tr className="bg-[#F5F5DC] text-[#2C6E91]">
                <th className="py-3 px-4 text-left font-semibold text-lg">Feature</th>
                <th className="py-3 px-4 font-semibold text-lg">Starter</th>
                <th className="py-3 px-4 font-semibold text-lg">Pro</th>
                <th className="py-3 px-4 font-semibold text-lg">Elite</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {/* Example features, update as needed */}
              <tr className="border-t">
                <td className="py-3 px-4">Basic Search & Analytics</td>
                <td className="text-center"><span className="text-green-600 font-bold">✔️</span></td>
                <td className="text-center"><span className="text-green-600 font-bold">✔️</span></td>
                <td className="text-center"><span className="text-green-600 font-bold">✔️</span></td>
              </tr>
              <tr className="border-t">
                <td className="py-3 px-4">Unlimited Lookups</td>
                <td className="text-center text-gray-400">—</td>
                <td className="text-center"><span className="text-green-600 font-bold">✔️</span></td>
                <td className="text-center"><span className="text-green-600 font-bold">✔️</span></td>
              </tr>
              <tr className="border-t">
                <td className="py-3 px-4">Export Data (CSV)</td>
                <td className="text-center text-gray-400">—</td>
                <td className="text-center"><span className="text-green-600 font-bold">✔️</span></td>
                <td className="text-center"><span className="text-green-600 font-bold">✔️</span></td>
              </tr>
              <tr className="border-t">
                <td className="py-3 px-4">Email Alerts & Notifications</td>
                <td className="text-center text-gray-400">—</td>
                <td className="text-center"><span className="text-green-600 font-bold">✔️</span></td>
                <td className="text-center"><span className="text-green-600 font-bold">✔️</span></td>
              </tr>
              <tr className="border-t">
                <td className="py-3 px-4">Full Analytics Dashboard</td>
                <td className="text-center text-gray-400">—</td>
                <td className="text-center"><span className="text-green-600 font-bold">✔️</span></td>
                <td className="text-center"><span className="text-green-600 font-bold">✔️</span></td>
              </tr>
              <tr className="border-t">
                <td className="py-3 px-4">PDF Reports</td>
                <td className="text-center text-gray-400">—</td>
                <td className="text-center text-gray-400">—</td>
                <td className="text-center"><span className="text-[#D4AF37] font-bold">✔️</span></td>
              </tr>
              <tr className="border-t">
                <td className="py-3 px-4">Bulk Analysis</td>
                <td className="text-center text-gray-400">—</td>
                <td className="text-center text-gray-400">—</td>
                <td className="text-center"><span className="text-[#D4AF37] font-bold">✔️</span></td>
              </tr>
              <tr className="border-t">
                <td className="py-3 px-4">CRM Export</td>
                <td className="text-center text-gray-400">—</td>
                <td className="text-center text-gray-400">—</td>
                <td className="text-center"><span className="text-[#D4AF37] font-bold">✔️</span></td>
              </tr>
              <tr className="border-t">
                <td className="py-3 px-4">Priority Support</td>
                <td className="text-center text-gray-400">—</td>
                <td className="text-center"><span className="text-green-600 font-bold">✔️</span></td>
                <td className="text-center"><span className="text-green-600 font-bold">✔️</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Screenshots/Visuals */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">See It in Action</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {/* Dashboard SVG */}
          <div className="rounded-lg shadow w-72 h-44 flex items-center justify-center bg-gray-100">
            <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Dashboard illustration">
              <rect x="8" y="20" width="80" height="56" rx="8" fill="#3A7CA5"/>
              <rect x="16" y="28" width="24" height="32" rx="4" fill="#E5E5E5"/>
              <rect x="44" y="28" width="36" height="12" rx="3" fill="#5DA271"/>
              <rect x="44" y="44" width="36" height="16" rx="3" fill="#D4AF37"/>
            </svg>
          </div>
          {/* PDF Report SVG */}
          <div className="rounded-lg shadow w-72 h-44 flex items-center justify-center bg-gray-100">
            <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="PDF report illustration">
              <rect x="20" y="16" width="56" height="64" rx="6" fill="#5DA271"/>
              <rect x="28" y="28" width="40" height="8" rx="2" fill="#F5F5DC"/>
              <rect x="28" y="40" width="40" height="4" rx="2" fill="#E5E5E5"/>
              <rect x="28" y="48" width="24" height="4" rx="2" fill="#D4AF37"/>
              <rect x="28" y="56" width="16" height="4" rx="2" fill="#C0C0C0"/>
            </svg>
          </div>
          {/* Analytics SVG */}
          <div className="rounded-lg shadow w-72 h-44 flex items-center justify-center bg-gray-100">
            <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Analytics illustration">
              <rect x="16" y="64" width="12" height="16" rx="3" fill="#3A7CA5"/>
              <rect x="36" y="48" width="12" height="32" rx="3" fill="#5DA271"/>
              <rect x="56" y="36" width="12" height="44" rx="3" fill="#D4AF37"/>
              <rect x="76" y="24" width="12" height="56" rx="3" fill="#C0C0C0"/>
            </svg>
          </div>
        </div>
      </section>

      {/* Benefits & Trust Signals */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Why Choose Us?</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <span className="text-4xl">🚀</span>
            <h3 className="font-semibold mt-2 mb-1">Fast & Reliable</h3>
            <p className="text-gray-600">Instant access to the latest property data and analytics.</p>
          </div>
          <div>
            <span className="text-4xl">🔒</span>
            <h3 className="font-semibold mt-2 mb-1">Secure & Private</h3>
            <p className="text-gray-600">Your data is protected with industry-leading security.</p>
          </div>
          <div>
            <span className="text-4xl">💡</span>
            <h3 className="font-semibold mt-2 mb-1">Expert Insights</h3>
            <p className="text-gray-600">Get actionable insights and recommendations for every property.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">What Our Users Say</h2>
        <div className="flex flex-wrap justify-center gap-8">
          <div className="max-w-xs bg-gray-50 rounded-lg p-6 shadow text-center">
            <p className="italic mb-2">“This platform helped me find the best deals and made my property search so much easier!”</p>
            <span className="font-semibold">— Alex P.</span>
          </div>
          <div className="max-w-xs bg-gray-50 rounded-lg p-6 shadow text-center">
            <p className="italic mb-2">“The analytics and PDF reports are a game changer for my investment strategy.”</p>
            <span className="font-semibold">— Priya S.</span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="max-w-2xl mx-auto space-y-4">
          <details className="bg-gray-50 rounded p-4">
            <summary className="font-semibold cursor-pointer">Can I upgrade or downgrade at any time?</summary>
            <p className="mt-2 text-gray-600">Yes! You can change your plan at any time from your account page. Downgrades take effect at the end of your current billing period.</p>
          </details>
          <details className="bg-gray-50 rounded p-4">
            <summary className="font-semibold cursor-pointer">Is my data secure?</summary>
            <p className="mt-2 text-gray-600">Absolutely. We use industry-standard security and never share your data with third parties.</p>
          </details>
          <details className="bg-gray-50 rounded p-4">
            <summary className="font-semibold cursor-pointer">Do you offer a free trial?</summary>
            <p className="mt-2 text-gray-600">Yes, you can start with the Starter plan for free and upgrade when you’re ready.</p>
          </details>
        </div>
      </section>

      {/* Sticky CTA */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <a href="#plans" className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow transition-colors text-lg">Compare Plans</a>
      </div>
    </main>
  );
} 