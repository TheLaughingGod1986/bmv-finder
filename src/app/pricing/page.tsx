'use client';
import React from "react";
import { useUser } from "@supabase/auth-helpers-react";

const PRO_YEARLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID!;
const ELITE_YEARLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_ELITE_YEARLY_PRICE_ID!;
const ELITE_MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_ELITE_MONTHLY_PRICE_ID!;
const PRO_MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!;
const PDF_REPORT_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PDF_REPORT_PRICE_ID!;

if (!PRO_YEARLY_PRICE_ID || !ELITE_YEARLY_PRICE_ID || !ELITE_MONTHLY_PRICE_ID || !PRO_MONTHLY_PRICE_ID || !PDF_REPORT_PRICE_ID) {
  throw new Error('One or more Stripe Price IDs are missing from your environment variables.');
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
  const user = useUser();

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Pricing</h1>
      <div className="space-y-6">
        <div>
          <h2 className="font-semibold">PDF Report</h2>
          <p>One-off PDF property report</p>
          <UpgradeButton userId={user?.id as string} priceId={PDF_REPORT_PRICE_ID}>Buy PDF Report (£4.99)</UpgradeButton>
        </div>
        <div>
          <h2 className="font-semibold">Pro Membership</h2>
          <p>Unlimited lookups, alerts, export, full data access</p>
          <UpgradeButton userId={user?.id as string} priceId={PRO_MONTHLY_PRICE_ID}>Pro Monthly (£19/mo)</UpgradeButton>
          <UpgradeButton userId={user?.id as string} priceId={PRO_YEARLY_PRICE_ID}>Pro Yearly (£190/yr)</UpgradeButton>
        </div>
        <div>
          <h2 className="font-semibold">Elite Membership</h2>
          <p>All Pro features + PDF reports, bulk analysis, CRM export</p>
          <UpgradeButton userId={user?.id as string} priceId={ELITE_MONTHLY_PRICE_ID}>Elite Monthly (£49/mo)</UpgradeButton>
          <UpgradeButton userId={user?.id as string} priceId={ELITE_YEARLY_PRICE_ID}>Elite Yearly (£490/yr)</UpgradeButton>
        </div>
      </div>
    </div>
  );
} 