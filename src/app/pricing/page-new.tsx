'use client';

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from '@supabase/supabase-js';
import { useUserTier } from '@/hooks/useUserTier';
import { CheckIcon, StarIcon, ShieldCheckIcon, ChartBarIcon, DownloadIcon, BellIcon } from '@heroicons/react/24/outline';

// New UI Components
import { 
  Header, 
  Section, 
  Button, 
  PricingCard,
  FeatureCard,
  StripeCheckoutButton 
} from '../components/ui';

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

const UpgradeButton = ({ userId, priceId, children, variant = 'primary' }: { 
  userId: string; 
  priceId: string; 
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}) => {
  if (!userId || !priceId) return null;
  
  return (
    <StripeCheckoutButton 
      userId={userId} 
      priceId={priceId} 
      variant={variant}
      className="w-full"
    >
      {children}
    </StripeCheckoutButton>
  );
};

export default function PricingPageNew() {
  const { user, loading: userLoading } = useClientUser();
  const { tier: userTier } = useUserTier(user?.id || null);
  const stripePriceIds = getStripePriceIds();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  // Don't render the component if we're on the server side
  if (typeof window === 'undefined') {
    return null;
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5DC]">
        <Header />
        <Section background="white">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3A7CA5] mx-auto mb-4"></div>
            <p className="text-[#3B755D]">Loading...</p>
          </div>
        </Section>
      </div>
    );
  }

  const getPriceId = (plan: string, interval: 'monthly' | 'yearly') => {
    if (plan === 'pro') {
      return interval === 'monthly' ? stripePriceIds.PRO_MONTHLY_PRICE_ID : stripePriceIds.PRO_YEARLY_PRICE_ID;
    } else if (plan === 'elite') {
      return interval === 'monthly' ? stripePriceIds.ELITE_MONTHLY_PRICE_ID : stripePriceIds.ELITE_YEARLY_PRICE_ID;
    }
    return null;
  };

  const getPrice = (plan: string, interval: 'monthly' | 'yearly') => {
    if (plan === 'pro') {
      return interval === 'monthly' ? '£19' : '£190';
    } else if (plan === 'elite') {
      return interval === 'monthly' ? '£49' : '£490';
    }
    return '£0';
  };

  const getPeriod = (interval: 'monthly' | 'yearly') => {
    return interval === 'monthly' ? '/mo' : '/yr';
  };

  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      <Header />
      
      {/* Hero Section */}
      <Section background="white">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#2C6E91] mb-4">
            Find the Right Plan for Your Property Journey
          </h1>
          <p className="text-lg md:text-xl text-[#3B755D] mb-8 max-w-3xl mx-auto">
            Compare features, see what's included, and choose the perfect plan for you. Upgrade anytime.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${billingInterval === 'monthly' ? 'text-[#2C6E91]' : 'text-[#3B755D]'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingInterval === 'yearly' ? 'bg-[#3A7CA5]' : 'bg-[#E5E5E5]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingInterval === 'yearly' ? 'text-[#2C6E91]' : 'text-[#3B755D]'}`}>
              Yearly
              <span className="ml-1 text-xs bg-[#5DA271] text-white px-2 py-1 rounded-full">Save 17%</span>
            </span>
          </div>
        </div>
      </Section>

      {/* Pricing Plans */}
      <Section id="plans" background="light">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <PricingCard
              title="Starter"
              price="Free"
              period=""
              features={[
                "✔️ Basic search & analytics",
                "✔️ Access to public data",
                "✔️ Limited saved searches",
                "✔️ Community support"
              ]}
              ctaText={user ? "Current Plan" : "Get Started Free"}
              ctaHref={user ? "#" : "/account"}
              className={user && userTier === 'free' ? 'ring-4 ring-[#3A7CA5] bg-gradient-to-br from-[#3A7CA5]/10 to-[#2C6E91]/10' : ''}
            />
            
            {/* Pro Plan */}
            <PricingCard
              title="Pro"
              price={getPrice('pro', billingInterval)}
              period={getPeriod(billingInterval)}
              features={[
                "✔️ All Starter features",
                "✔️ Unlimited searches",
                "✔️ Download CSV",
                "✔️ Priority support",
                "✔️ Advanced analytics",
                "✔️ Email alerts"
              ]}
              ctaText={
                !user ? "Get Pro" :
                userTier === 'pro' ? "Current Plan" :
                userTier === 'elite' ? "Downgrade to Pro" :
                "Upgrade to Pro"
              }
              ctaHref={
                !user ? "/account" :
                userTier === 'pro' ? "#" :
                userTier === 'elite' ? "#" :
                "#"
              }
              isPopular={true}
              className={user && userTier === 'pro' ? 'ring-4 ring-[#3A7CA5] bg-gradient-to-br from-[#3A7CA5]/10 to-[#2C6E91]/10' : ''}
            />
            
            {/* Elite Plan */}
            <PricingCard
              title="Elite"
              price={getPrice('elite', billingInterval)}
              period={getPeriod(billingInterval)}
              features={[
                "✔️ All Pro features",
                "✔️ API access",
                "✔️ Advanced analytics",
                "✔️ Early feature access",
                "✔️ PDF reports",
                "✔️ Bulk analysis",
                "✔️ CRM export"
              ]}
              ctaText={
                !user ? "Get Elite" :
                userTier === 'elite' ? "Current Plan" :
                "Upgrade to Elite"
              }
              ctaHref={
                !user ? "/account" :
                userTier === 'elite' ? "#" :
                "#"
              }
              className={user && userTier === 'elite' ? 'ring-4 ring-[#3A7CA5] bg-gradient-to-br from-[#3A7CA5]/10 to-[#2C6E91]/10' : ''}
            />
          </div>
        </div>
      </Section>

      {/* Features Comparison */}
      <Section background="white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2C6E91] mb-4">Detailed Feature Comparison</h2>
            <p className="text-lg text-[#3B755D]">See exactly what's included in each plan</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[#E5E5E5]">
                  <th className="text-left py-4 px-6 font-semibold text-[#2C6E91]">Feature</th>
                  <th className="text-center py-4 px-6 font-semibold text-[#2C6E91]">Starter</th>
                  <th className="text-center py-4 px-6 font-semibold text-[#2C6E91]">Pro</th>
                  <th className="text-center py-4 px-6 font-semibold text-[#2C6E91]">Elite</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#E5E5E5]">
                  <td className="py-4 px-6 font-medium text-[#3B755D]">Property Searches</td>
                  <td className="text-center py-4 px-6">10/day</td>
                  <td className="text-center py-4 px-6">Unlimited</td>
                  <td className="text-center py-4 px-6">Unlimited</td>
                </tr>
                <tr className="border-b border-[#E5E5E5]">
                  <td className="py-4 px-6 font-medium text-[#3B755D]">Data Export</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">CSV</td>
                  <td className="text-center py-4 px-6">CSV + PDF</td>
                </tr>
                <tr className="border-b border-[#E5E5E5]">
                  <td className="py-4 px-6 font-medium text-[#3B755D]">Email Alerts</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">✅</td>
                  <td className="text-center py-4 px-6">✅</td>
                </tr>
                <tr className="border-b border-[#E5E5E5]">
                  <td className="py-4 px-6 font-medium text-[#3B755D]">API Access</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">✅</td>
                </tr>
                <tr className="border-b border-[#E5E5E5]">
                  <td className="py-4 px-6 font-medium text-[#3B755D]">Priority Support</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">✅</td>
                  <td className="text-center py-4 px-6">✅</td>
                </tr>
                <tr className="border-b border-[#E5E5E5]">
                  <td className="py-4 px-6 font-medium text-[#3B755D]">Bulk Analysis</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Why Choose Us */}
      <Section background="light">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2C6E91] mb-4">Why Choose UK Property Insights?</h2>
            <p className="text-lg text-[#3B755D]">Join thousands of property professionals who trust our platform</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📊"
              title="Comprehensive Data"
              description="Access to the latest Land Registry data with over 2.5 million properties"
            />
            <FeatureCard
              icon="🔒"
              title="Secure & Reliable"
              description="Bank-level security with 99.9% uptime and regular data updates"
            />
            <FeatureCard
              icon="💡"
              title="Smart Insights"
              description="AI-powered BMV scores and investment ratings for every property"
            />
          </div>
        </div>
      </Section>

      {/* FAQ Section */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2C6E91] mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-[#3B755D]">Everything you need to know about our plans</p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-[#F5F5DC] rounded-lg p-6">
              <h3 className="font-semibold text-[#2C6E91] mb-2">Can I change my plan anytime?</h3>
              <p className="text-[#3B755D]">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            
            <div className="bg-[#F5F5DC] rounded-lg p-6">
              <h3 className="font-semibold text-[#2C6E91] mb-2">Is there a free trial?</h3>
              <p className="text-[#3B755D]">Yes, all paid plans come with a 7-day free trial. No credit card required to start.</p>
            </div>
            
            <div className="bg-[#F5F5DC] rounded-lg p-6">
              <h3 className="font-semibold text-[#2C6E91] mb-2">What payment methods do you accept?</h3>
              <p className="text-[#3B755D]">We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through Stripe.</p>
            </div>
            
            <div className="bg-[#F5F5DC] rounded-lg p-6">
              <h3 className="font-semibold text-[#2C6E91] mb-2">Can I cancel my subscription?</h3>
              <p className="text-[#3B755D]">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section background="light">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#2C6E91] mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-[#3B755D] mb-8">Join thousands of property professionals using our platform</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/account" variant="primary" size="lg">
              Start Free Trial
            </Button>
            <Button href="/" variant="outline" size="lg">
              Explore Features
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
} 