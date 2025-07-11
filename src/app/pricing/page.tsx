'use client';
import React, { useState, useEffect, useMemo } from "react";
import { createClient } from '@supabase/supabase-js';
import { useUserTier } from '@/hooks/useUserTier';
import Head from 'next/head';

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
  const [isMobile, setIsMobile] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  // Pricing data for both intervals
  const plans = [
    {
      title: 'Starter',
      price: '0',
      priceYear: '0',
      period: 'month',
      periodYear: 'year',
      description: 'Perfect for getting started with property research',
      features: [
        '5 free property lookups per month',
        'Basic market insights',
        'Recent sales data',
        'Email support',
      ],
      buttonText: 'Get Started Free',
      href: '/register',
      isPopular: false,
      className: 'w-full lg:w-1/3',
      savings: null,
    },
    {
      title: 'Pro',
      price: '19',
      priceYear: '190', // 2 months free (19*10)
      period: 'month',
      periodYear: 'year',
      description: 'For serious property investors and buyers',
      features: [
        'Unlimited property lookups',
        'Advanced analytics & insights',
        'BMV scoring system',
        'Property history & trends',
        'Priority support',
        'Export data to CSV',
      ],
      buttonText: 'Upgrade to Pro',
      href: '/account/upgrade',
      isPopular: true,
      className: 'w-full lg:w-1/3',
      savings: 'Save £38/year',
    },
    {
      title: 'Elite',
      price: '49',
      priceYear: '490', // 2 months free (49*10)
      period: 'month',
      periodYear: 'year',
      description: 'For professional property businesses',
      features: [
        'Everything in Pro',
        'API access',
        'Bulk data exports',
        'Custom reports',
        'Dedicated account manager',
        'White-label options',
      ],
      buttonText: 'Upgrade to Elite',
      href: '/account/upgrade',
      isPopular: false,
      className: 'w-full lg:w-1/3',
      savings: 'Save £98/year',
    },
  ];

  // Detect mobile and handle sticky CTA visibility
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowStickyCTA(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { user, loading: userLoading } = useClientUser();
  const { tier: userTier } = useUserTier(user?.id || null);
  const stripePriceIds = getStripePriceIds();

  // Personalized greeting and plan reference
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const planName = userTier ? userTier.charAt(0).toUpperCase() + userTier.slice(1) : '';

  // JSON-LD for detailed pricing plans
  const pricingJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "BMV Finder Pricing Plans",
    "itemListElement": [
      {
        "@type": "Offer",
        "name": "Starter Plan",
        "price": "0",
        "priceCurrency": "GBP",
        "availability": "https://schema.org/InStock",
        "description": "Perfect for getting started with property research. 5 free property lookups per month, basic market insights, recent sales data, email support."
      },
      {
        "@type": "Offer",
        "name": "Pro Plan",
        "price": billingInterval === 'year' ? "190" : "19",
        "priceCurrency": "GBP",
        "availability": "https://schema.org/InStock",
        "description": "For serious property investors and buyers. Unlimited property lookups, advanced analytics, BMV scoring, property history, priority support, export to CSV."
      },
      {
        "@type": "Offer",
        "name": "Elite Plan",
        "price": billingInterval === 'year' ? "490" : "49",
        "priceCurrency": "GBP",
        "availability": "https://schema.org/InStock",
        "description": "For professional property businesses. Everything in Pro, API access, bulk exports, custom reports, dedicated account manager, white-label options."
      }
    ]
  };

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
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }} />
      </Head>
      <main className="max-w-5xl mx-auto mt-10 p-4 md:p-8 bg-white rounded shadow relative">
        {/* Sticky Mobile CTA Banner */}
        {showStickyCTA && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#3A7CA5] shadow-lg z-50 md:hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-[#2C6E91] leading-tight">Ready to upgrade?</p>
                <p className="text-xs text-[#3B755D] mt-1 leading-tight">Get unlimited access to property insights</p>
              </div>
              <button
                onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                className="ml-4 px-6 py-3 bg-[#3A7CA5] text-white rounded-lg font-bold text-sm hover:bg-[#2C6E91] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3A7CA5] focus:ring-offset-2 min-h-[44px] min-w-[120px]"
                aria-label="View pricing plans"
              >
                View Plans
              </button>
            </div>
          </div>
        )}

        {/* Personalized Greeting */}
        {user && (
          <div className="mb-8 text-center bg-gradient-to-r from-[#F5F5DC] to-[#E5E5E5] rounded-xl p-6 border border-[#D2B48C]">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2C6E91] mb-2 leading-tight">
              Welcome back{userName ? `, ${userName}` : ''}!
            </h1>
            <p className="text-lg md:text-xl text-[#3B755D] font-medium leading-relaxed">
              You're currently on the <span className="font-bold text-[#2C6E91]">{planName}</span> plan
            </p>
          </div>
        )}
        {/* Hero Section */}
        <section className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold mb-4">Find the Right Plan for Your Property Journey</h1>
          <p className="text-lg text-gray-600 mb-6">Compare features, see what's included, and choose the perfect plan for you. Upgrade anytime.</p>
          <a href="#plans" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow transition-colors text-lg">See Plans</a>
        </section>

        {/* Billing Interval Toggle */}
        <section id="plans" className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-[#2C6E91] leading-tight">Choose Your Plan</h2>
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-full bg-[#F5F5DC] border-2 border-[#D2B48C] shadow-sm overflow-hidden">
              <button
                className={`px-6 py-2 font-semibold text-sm md:text-base focus:outline-none transition-colors ${billingInterval === 'month' ? 'bg-[#3A7CA5] text-white' : 'text-[#2C6E91] hover:bg-[#E5E5E5]'}`}
                onClick={() => setBillingInterval('month')}
                aria-pressed={billingInterval === 'month'}
              >
                Monthly
              </button>
              <button
                className={`px-6 py-2 font-semibold text-sm md:text-base focus:outline-none transition-colors ${billingInterval === 'year' ? 'bg-[#3A7CA5] text-white' : 'text-[#2C6E91] hover:bg-[#E5E5E5]'}`}
                onClick={() => setBillingInterval('year')}
                aria-pressed={billingInterval === 'year'}
              >
                Yearly <span className="ml-2 text-xs font-bold text-[#D4AF37]">(Save 2 months)</span>
              </button>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row justify-center items-stretch gap-6 md:gap-8">
            {plans.map((plan, idx) => (
              <PricingCard
                key={plan.title}
                title={plan.title}
                price={billingInterval === 'year' ? plan.priceYear : plan.price}
                period={billingInterval === 'year' ? plan.periodYear : plan.period}
                description={plan.description}
                features={plan.features}
                buttonText={plan.buttonText}
                href={plan.href}
                isPopular={plan.isPopular}
                className={plan.className}
                savings={billingInterval === 'year' ? plan.savings : null}
              />
            ))}
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

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-[#2C6E91] leading-tight">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            <details className="bg-white border-2 border-[#E5E5E5] rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <summary className="px-6 py-5 cursor-pointer font-bold text-[#2C6E91] hover:bg-[#F5F5DC] transition-colors flex items-center justify-between">
                <span>How does billing work?</span>
                <svg className="w-5 h-5 text-[#3A7CA5] transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-[#3B755D] leading-relaxed">
                <p>We offer both monthly and yearly billing. Yearly plans come with a discount. You can upgrade, downgrade, or cancel at any time. Changes take effect immediately, and we'll prorate any adjustments to your next billing cycle.</p>
              </div>
            </details>

            <details className="bg-white border-2 border-[#E5E5E5] rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <summary className="px-6 py-5 cursor-pointer font-bold text-[#2C6E91] hover:bg-[#F5F5DC] transition-colors flex items-center justify-between">
                <span>Can I upgrade or downgrade my plan?</span>
                <svg className="w-5 h-5 text-[#3A7CA5] transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-[#3B755D] leading-relaxed">
                <p>Yes! You can upgrade or downgrade at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at your next billing cycle. You'll always keep access to your current plan until the change takes effect.</p>
              </div>
            </details>

            <details className="bg-white border-2 border-[#E5E5E5] rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <summary className="px-6 py-5 cursor-pointer font-bold text-[#2C6E91] hover:bg-[#F5F5DC] transition-colors flex items-center justify-between">
                <span>What happens if I cancel?</span>
                <svg className="w-5 h-5 text-[#3A7CA5] transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-[#3B755D] leading-relaxed">
                <p>You can cancel anytime from your account settings. You'll keep access to your plan until the end of your current billing period. No hidden fees or penalties - we want you to be happy with our service.</p>
              </div>
            </details>

            <details className="bg-white border-2 border-[#E5E5E5] rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <summary className="px-6 py-5 cursor-pointer font-bold text-[#2C6E91] hover:bg-[#F5F5DC] transition-colors flex items-center justify-between">
                <span>Is my data secure?</span>
                <svg className="w-5 h-5 text-[#3A7CA5] transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-[#3B755D] leading-relaxed">
                <p>Absolutely. We use bank-level security and encryption. All payments are processed securely through Stripe. Your data is protected and we never share your information with third parties.</p>
              </div>
            </details>
          </div>

          {/* Support Links */}
          <div className="text-center mt-12">
            <h3 className="text-xl font-bold text-[#2C6E91] mb-4">Still have questions? We're here to help!</h3>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href="/contact" 
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#3A7CA5] text-white rounded-lg font-bold text-base hover:bg-[#2C6E91] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3A7CA5] focus:ring-offset-2 min-h-[48px]"
                aria-label="Contact our support team"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Contact Support
              </a>
              <a 
                href="/help" 
                className="inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-[#3A7CA5] text-[#3A7CA5] rounded-lg font-bold text-base hover:bg-[#3A7CA5] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#3A7CA5] focus:ring-offset-2 min-h-[48px]"
                aria-label="Visit our help center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help Center
              </a>
            </div>
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

        {/* Trust Badges Section */}
        <section className="mb-12 flex flex-wrap justify-center gap-4 items-center">
          <span className="flex items-center gap-2 bg-[#E5E5E5] text-[#2C6E91] px-4 py-3 rounded-full font-bold text-sm shadow-sm border border-[#D2B48C]">
            <svg className="w-5 h-5 text-[#5DA271]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Trusted by 1,000+ investors
          </span>
          <span className="flex items-center gap-2 bg-[#E5E5E5] text-[#2C6E91] px-4 py-3 rounded-full font-bold text-sm shadow-sm border border-[#D2B48C]">
            <svg className="w-5 h-5 text-[#5DA271]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure Payments by Stripe
          </span>
          <span className="flex items-center gap-2 bg-[#E5E5E5] text-[#2C6E91] px-4 py-3 rounded-full font-bold text-sm shadow-sm border border-[#D2B48C]">
            <svg className="w-5 h-5 text-[#5DA271]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Data from UK Land Registry
          </span>
        </section>

        {/* Partner/Press Logos */}
        <section className="mb-12 text-center">
          <h2 className="text-lg font-semibold text-[#3B755D] mb-6">As featured in</h2>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="h-8 w-24 bg-[#E5E5E5] rounded flex items-center justify-center text-[#2C6E91] font-bold text-sm">Rightmove</div>
            <div className="h-8 w-20 bg-[#E5E5E5] rounded flex items-center justify-center text-[#2C6E91] font-bold text-sm">Zoopla</div>
            <div className="h-8 w-16 bg-[#E5E5E5] rounded flex items-center justify-center text-[#2C6E91] font-bold text-sm">BBC</div>
            <div className="h-8 w-20 bg-[#E5E5E5] rounded flex items-center justify-center text-[#2C6E91] font-bold text-sm">Property Week</div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-8 text-center text-[#2C6E91]">What our users say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#F5F5DC] p-6 rounded-xl border border-[#D2B48C]">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#3A7CA5] rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">S</div>
                <div>
                  <p className="font-bold text-[#2C6E91]">Sarah M.</p>
                  <p className="text-sm text-[#3B755D]">Property Investor</p>
                </div>
              </div>
              <p className="text-[#3B755D] leading-relaxed">"Found my dream investment property using their BMV scoring. Saved me hours of research!"</p>
            </div>
            <div className="bg-[#F5F5DC] p-6 rounded-xl border border-[#D2B48C]">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#5DA271] rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">M</div>
                <div>
                  <p className="font-bold text-[#2C6E91]">Mike R.</p>
                  <p className="text-sm text-[#3B755D]">First-time Buyer</p>
                </div>
              </div>
              <p className="text-[#3B755D] leading-relaxed">"The property history feature helped me understand the market value perfectly."</p>
            </div>
            <div className="bg-[#F5F5DC] p-6 rounded-xl border border-[#D2B48C]">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">L</div>
                <div>
                  <p className="font-bold text-[#2C6E91]">Lisa K.</p>
                  <p className="text-sm text-[#3B755D]">Estate Agent</p>
                </div>
              </div>
              <p className="text-[#3B755D] leading-relaxed">"Professional tool that gives my clients the insights they need to make informed decisions."</p>
            </div>
          </div>
        </section>

        {/* Sticky CTA */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none">
          <a href="#plans" className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow transition-colors text-lg">Compare Plans</a>
        </div>
      </main>
    </>
  );
} 