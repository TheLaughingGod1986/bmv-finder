import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

// Stripe secret key and webhook secret from env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const STARTER_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID!;
const PRO_MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!;
const PRO_YEARLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID!;
const ELITE_MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_ELITE_MONTHLY_PRICE_ID!;
const ELITE_YEARLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_ELITE_YEARLY_PRICE_ID!;
const PDF_REPORT_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PDF_REPORT_PRICE_ID!;

if (!STARTER_PRICE_ID || !PRO_MONTHLY_PRICE_ID || !PRO_YEARLY_PRICE_ID || !ELITE_MONTHLY_PRICE_ID || !ELITE_YEARLY_PRICE_ID || !PDF_REPORT_PRICE_ID) {
  throw new Error('One or more Stripe Price IDs are missing from your environment variables.');
}

const priceIdToTier: Record<string, string> = {
  [STARTER_PRICE_ID]: 'free',
  [PRO_MONTHLY_PRICE_ID]: 'pro',
  [PRO_YEARLY_PRICE_ID]: 'pro',
  [ELITE_MONTHLY_PRICE_ID]: 'elite',
  [ELITE_YEARLY_PRICE_ID]: 'elite',
};

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const buf = await req.arrayBuffer();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig!, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Log the incoming event for debugging
  console.log('Received Stripe event:', event.type, JSON.stringify(event, null, 2));

  // Handle Stripe events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const priceId = session.line_items?.data?.[0]?.price?.id || session.metadata?.priceId;
      // Log userId and priceId for debugging
      console.log('checkout.session.completed:', { userId, priceId, metadata: session.metadata });
      // Fallback: try to get priceId from line_items if expanded in webhook config
      // Determine if this is a subscription or one-off PDF purchase
      if (!userId) break;
      if (session.mode === 'subscription') {
        // Map priceId to tier
        const tier = priceIdToTier[priceId as string] as 'free' | 'pro' | 'elite' | undefined;
        if (tier) {
          await supabaseAdmin.from('profiles').update({ tier, billing_metadata: session }).eq('id', userId);
        }
      } else if (session.mode === 'payment' && priceIdToTier[priceId as string]) {
        // Treat one-time payment for any plan as an upgrade (for testing or special cases)
        await supabaseAdmin.from('profiles').update({ tier: priceIdToTier[priceId as string], billing_metadata: session }).eq('id', userId);
      } else if (priceId === PDF_REPORT_PRICE_ID) {
        // PDF one-off purchase: grant entitlement (e.g., increment pdf_count or set flag)
        await supabaseAdmin.from('profiles').update({ pdf_entitlement: true }).eq('id', userId);
      }
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      const priceId = subscription.items.data[0]?.price.id;
      const tier = priceIdToTier[priceId as string] as 'free' | 'pro' | 'elite' | undefined;
      if (userId && tier) {
        await supabaseAdmin.from('profiles').update({ tier, billing_metadata: subscription }).eq('id', userId);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        await supabaseAdmin.from('profiles').update({ tier: 'free', billing_metadata: subscription }).eq('id', userId);
      }
      break;
    }
    case 'invoice.payment_failed': {
      // Optionally handle payment failures
      break;
    }
    default: {
      console.log(`Unhandled event type: ${event.type}`);
    }
  }

  return NextResponse.json({ received: true });
} 