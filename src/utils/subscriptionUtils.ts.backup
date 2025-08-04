import { format } from 'date-fns';

export interface SubscriptionInfo {
  tier: 'free' | 'pro' | 'elite';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';
  renewalDate: string | null;
  billingInterval: 'month' | 'year' | null;
  cancelAtPeriodEnd: boolean;
  price: string | null;
}

export function parseSubscriptionMetadata(billingMetadata: any): SubscriptionInfo {
  if (!billingMetadata) {
    return {
      tier: 'free',
      status: 'active',
      renewalDate: null,
      billingInterval: null,
      cancelAtPeriodEnd: false,
      price: null,
    };
  }

  // Handle both subscription and checkout session metadata
  const meta = billingMetadata;
  
  // Extract tier from price ID mapping
  let tier: 'free' | 'pro' | 'elite' = 'free';
  const priceId = meta.items?.data?.[0]?.price?.id || meta.plan?.id;

  const planName = meta.plan?.nickname || meta.plan?.name || '';
  // Fallback: try to infer from plan name if priceId is missing or doesn't match
  const starterPriceId = process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID;
  const proMonthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID;
  const proYearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID;
  const eliteMonthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_ELITE_MONTHLY_PRICE_ID;
  const eliteYearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_ELITE_YEARLY_PRICE_ID;

  if (priceId) {
    if ([proMonthlyPriceId, proYearlyPriceId].includes(priceId)) {
      tier = 'pro';
    } else if ([eliteMonthlyPriceId, eliteYearlyPriceId].includes(priceId)) {
      tier = 'elite';
    } else if (starterPriceId === priceId) {
      tier = 'free';
    }
  } else if (planName) {
    if (planName.toLowerCase().includes('elite')) {
      tier = 'elite';
    } else if (planName.toLowerCase().includes('pro')) {
      tier = 'pro';
    }
  } else if (meta.plan?.interval) {
    // Fallback: if interval is present, assume pro/elite based on amount
    if (meta.plan?.amount >= 4900) {
      tier = 'elite';
    } else if (meta.plan?.amount >= 1900) {
      tier = 'pro';
    }
  }

  // Extract status
  const status = meta.status || 'active';
  
  // Extract renewal date
  let renewalDate: string | null = null;
  if (meta.current_period_end) {
    renewalDate = format(new Date(meta.current_period_end * 1000), 'PPP');
  }
  
  // Extract billing interval
  const billingInterval = meta.plan?.interval || meta.items?.data?.[0]?.plan?.interval || null;
  
  // Extract cancel at period end
  const cancelAtPeriodEnd = meta.cancel_at_period_end || false;
  
  // Extract price
  const price = meta.plan?.amount 
    ? `£${(meta.plan.amount / 100).toFixed(2)}`
    : meta.items?.data?.[0]?.price?.unit_amount 
    ? `£${(meta.items.data[0].price.unit_amount / 100).toFixed(2)}`
    : null;

  return {
    tier,
    status,
    renewalDate,
    billingInterval,
    cancelAtPeriodEnd,
    price,
  };
}

export function getSubscriptionStatusText(info: SubscriptionInfo): string {
  if (info.tier === 'free') {
    return 'Free Plan';
  }
  
  if (info.cancelAtPeriodEnd) {
    return `Canceled (ends ${info.renewalDate})`;
  }
  
  switch (info.status) {
    case 'active':
      return `Active (renews ${info.renewalDate})`;
    case 'canceled':
      return 'Canceled';
    case 'past_due':
      return 'Payment Past Due';
    case 'incomplete':
      return 'Payment Incomplete';
    case 'incomplete_expired':
      return 'Payment Expired';
    case 'trialing':
      return 'Trial Period';
    case 'unpaid':
      return 'Payment Failed';
    default:
      return 'Unknown Status';
  }
}

export function canManageSubscription(info: SubscriptionInfo): boolean {
  return info.tier !== 'free' && info.status === 'active';
} 