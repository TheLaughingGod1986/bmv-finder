'use client';
import { useState, useEffect, useMemo } from "react";
import { supabase } from '../../lib/supabaseClient';
import { useUserTier } from '@/hooks/useUserTier';
import Head from 'next/head';
import TrustBadges from "../components/TrustBadges";
import PartnerLogos from "../components/PartnerLogos";
import Testimonials from "../components/Testimonials";
import PricingCard from "../components/PricingCard";
import { Button } from "../components/ui";
import { useToast } from "../components/ToastProvider";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

// Custom hook for user management
function useClientUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
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
  }, []);
  
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
  const { showToast } = useToast();
  
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
      showToast({ type: 'error', title: data.error || "Failed to start checkout." });
    }
  };

  return (
    <Button variant="primary" size="md" onClick={handleUpgrade}>
      {children}
    </Button>
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
    return <div className="max-w-5xl mx-auto mt-10 p-4 md:p-8 bg-white rounded-xl shadow-soft border border-neutral-200">
      <div className="text-center">Loading...</div>
    </div>;
  }

  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }} />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <main>
          {/* Hero Section */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-10"></div>
            <div className="relative max-w-screen-2xl w-[90vw] mx-auto pt-20 pb-16">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-6"
                >
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                    <Star className="w-4 h-4 mr-2" />
                    Choose Your Property Research Plan
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight"
                >
                  Find the Right Plan for Your
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Property Journey
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
                >
                  Choose the perfect plan to unlock powerful property insights, market analysis, and professional tools for your investment strategy.
                </motion.p>
              </div>
            </div>
          </section>

          {/* Main Content Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Trust Badges and Partner Logos */}
            <TrustBadges />
            <PartnerLogos />
            
            {/* Sticky Mobile CTA Banner */}
            {showStickyCTA && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary-700 shadow-soft z-50 md:hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-primary-700 leading-tight">Ready to upgrade?</p>
                    <p className="text-xs text-primary-600 mt-1 leading-tight">Get unlimited access to property insights</p>
                  </div>
                  <button
                    onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                    className="ml-4 px-6 py-3 bg-primary-700 text-white rounded-lg font-bold text-sm hover:bg-primary-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 min-h-[44px] min-w-[120px]"
                    aria-label="View pricing plans"
                  >
                    View Plans
                  </button>
                </div>
              </div>
            )}

            {/* Personalized Greeting */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-8 text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200 shadow-xl"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
                  Welcome back{userName ? `, ${userName}` : ''}!
                </h2>
                <p className="text-lg md:text-xl text-gray-700 font-medium leading-relaxed">
                  You&apos;re currently on the <span className="font-bold text-blue-600">{planName}</span> plan
                </p>
              </motion.div>
            )}

            {/* Pricing Plans Section */}
            <section id="plans" className="mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
              >
                <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 leading-tight">Choose Your Plan</h2>
                
                {/* Billing Interval Toggle */}
                <div className="flex justify-center mb-8">
                  <div className="inline-flex rounded-full bg-gray-100 border-2 border-gray-200 shadow-lg overflow-hidden">
                    <button
                      className={`px-6 py-2 font-semibold text-sm md:text-base focus:outline-none transition-colors ${billingInterval === 'month' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                      onClick={() => setBillingInterval('month')}
                      aria-pressed={billingInterval === 'month'}
                    >
                      Monthly
                    </button>
                    <button
                      className={`px-6 py-2 font-semibold text-sm md:text-base focus:outline-none transition-colors ${billingInterval === 'year' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                      onClick={() => setBillingInterval('year')}
                      aria-pressed={billingInterval === 'year'}
                    >
                      Yearly <span className="ml-2 text-xs font-bold text-yellow-500">(Save 2 months)</span>
                    </button>
                  </div>
                </div>
                
                {/* Pricing Cards */}
                <div className="flex flex-col lg:flex-row justify-center items-stretch gap-6 md:gap-8">
                  {plans.map((plan, idx) => (
                    <PricingCard
                      key={plan.title}
                      title={plan.title}
                      price={billingInterval === 'year' ? plan.priceYear : plan.price}
                      period={billingInterval === 'year' ? plan.periodYear : plan.period}
                      description={plan.description}
                      features={plan.features}
                      ctaText={plan.buttonText}
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
                  <table className="min-w-full border rounded-xl overflow-hidden bg-white shadow-lg">
                    <thead>
                      <tr className="bg-gray-100 text-gray-900">
                        <th className="py-3 px-4 text-left font-semibold text-lg">Feature</th>
                        <th className="py-3 px-4 font-semibold text-lg">Starter</th>
                        <th className="py-3 px-4 font-semibold text-lg">Pro</th>
                        <th className="py-3 px-4 font-semibold text-lg">Elite</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-800">
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
                        <td className="text-center"><span className="text-yellow-500 font-bold">✔️</span></td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-3 px-4">Bulk Analysis</td>
                        <td className="text-center text-gray-400">—</td>
                        <td className="text-center text-gray-400">—</td>
                        <td className="text-center"><span className="text-yellow-500 font-bold">✔️</span></td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-3 px-4">CRM Export</td>
                        <td className="text-center text-gray-400">—</td>
                        <td className="text-center text-gray-400">—</td>
                        <td className="text-center"><span className="text-yellow-500 font-bold">✔️</span></td>
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
              </motion.div>
            </section>

            {/* Testimonials Section */}
            <section className="mb-16">
              <Testimonials />
            </section>

            {/* FAQ Section */}
            <section className="mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
              >
                <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 leading-tight">Frequently Asked Questions</h2>
                <div className="max-w-4xl mx-auto space-y-6">
                  <details className="bg-gray-50 border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                    <summary className="px-6 py-5 cursor-pointer font-bold text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-between">
                      <span>How does billing work?</span>
                      <svg className="w-5 h-5 text-blue-600 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                      <p>We offer both monthly and yearly billing. Yearly plans come with a discount. You can upgrade, downgrade, or cancel at any time. Changes take effect immediately, and we&apos;ll prorate any adjustments to your next billing cycle.</p>
                    </div>
                  </details>

                  <details className="bg-gray-50 border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                    <summary className="px-6 py-5 cursor-pointer font-bold text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-between">
                      <span>Can I upgrade or downgrade my plan?</span>
                      <svg className="w-5 h-5 text-blue-600 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                      <p>Yes! You can upgrade or downgrade at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at your next billing cycle. You&apos;ll always keep access to your current plan until the change takes effect.</p>
                    </div>
                  </details>

                  <details className="bg-gray-50 border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                    <summary className="px-6 py-5 cursor-pointer font-bold text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-between">
                      <span>What happens if I cancel?</span>
                      <svg className="w-5 h-5 text-blue-600 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                      <p>You can cancel anytime from your account settings. You&apos;ll keep access to your plan until the end of your current billing period. No hidden fees or penalties - we want you to be happy with our service.</p>
                    </div>
                  </details>

                  <details className="bg-gray-50 border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                    <summary className="px-6 py-5 cursor-pointer font-bold text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-between">
                      <span>Is my data secure?</span>
                      <svg className="w-5 h-5 text-blue-600 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                      <p>Absolutely. We use bank-level security and encryption. All payments are processed securely through Stripe. Your data is protected and we never share your information with third parties.</p>
                    </div>
                  </details>
                </div>

                {/* Support Links */}
                <div className="text-center mt-12">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Still have questions? We&apos;re here to help!</h3>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <a 
                      href="/contact" 
                      className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-base hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 min-h-[48px]"
                      aria-label="Contact our support team"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Contact Support
                    </a>
                    <a 
                      href="/help" 
                      className="inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-bold text-base hover:bg-blue-600 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 min-h-[48px]"
                      aria-label="Visit our help center"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Help Center
                    </a>
                  </div>
                </div>
              </motion.div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
} 