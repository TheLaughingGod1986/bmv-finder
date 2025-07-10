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
  try {
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
        try {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const priceId = (session as any)?.items?.data?.[0]?.price?.id || session?.metadata?.priceId;
          if (!userId) break;
          if (session.mode === 'subscription') {
            // Fetch the subscription from Stripe
            const subscriptionId = session.subscription;
            let subscription = null;
            if (subscriptionId) {
              subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
            }
            // Map priceId to tier
            const tier = priceIdToTier[priceId as string] as 'free' | 'pro' | 'elite' | undefined;
            if (tier && subscription) {
              // Extract price info from the active subscription item
              const item = subscription.items.data[0];
              const price = item.price;
              const billing_metadata = {
                id: subscription.id,
                plan: {
                  id: price.id,
                  interval: price.recurring?.interval,
                  amount: price.unit_amount,
                  currency: price.currency,
                },
                current_period_end: subscription.current_period_end,
                cancel_at_period_end: subscription.cancel_at_period_end,
                canceled_at: subscription.canceled_at,
                userId: userId,
              };
              console.log('DEBUG: Saving billing_metadata for checkout.session.completed:', JSON.stringify(billing_metadata, null, 2));
              await supabaseAdmin.from('profiles').update({ tier, billing_metadata }).eq('id', userId);
            }
          } else if (session.mode === 'payment' && priceIdToTier[priceId as string]) {
            await supabaseAdmin.from('profiles').update({ tier: priceIdToTier[priceId as string], billing_metadata: session }).eq('id', userId);
          } else if (priceId === PDF_REPORT_PRICE_ID) {
            await supabaseAdmin.from('profiles').update({ pdf_entitlement: true }).eq('id', userId);
          }
        } catch (error: any) {
          console.error('Error handling checkout.session.completed:', error);
        }
        break;
      }
      case 'customer.subscription.updated': {
        try {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          const priceId = subscription.items.data[0]?.price.id;
          const tier = priceIdToTier[priceId as string] as 'free' | 'pro' | 'elite' | undefined;
          if (userId && tier) {
            // Extract price info from the active subscription item
            const item = subscription.items.data[0];
            const price = item.price;
            const billing_metadata = {
              id: subscription.id,
              plan: {
                id: price.id,
                interval: price.recurring?.interval,
                amount: price.unit_amount,
                currency: price.currency,
              },
              current_period_end: subscription.current_period_end,
              cancel_at_period_end: subscription.cancel_at_period_end,
              canceled_at: subscription.canceled_at,
              userId: userId,
            };
            console.log('DEBUG: Saving billing_metadata for customer.subscription.updated:', JSON.stringify(billing_metadata, null, 2));
            await supabaseAdmin.from('profiles').update({ tier, billing_metadata }).eq('id', userId);
          }
        } catch (error: any) {
          console.error('Error handling customer.subscription.updated:', error);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        try {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          if (userId) {
            await supabaseAdmin.from('profiles').update({ tier: 'free', billing_metadata: subscription }).eq('id', userId);
          }
        } catch (error: any) {
          console.error('Error handling customer.subscription.deleted:', error);
        }
        break;
      }
      case 'invoice.payment_failed': {
        try {
          // Optionally handle payment failures
          console.log('Payment failed event received');
        } catch (error: any) {
          console.error('Error handling invoice.payment_failed:', error);
        }
        break;
      }
      default: {
        console.log(`Unhandled event type: ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error in stripe-webhook:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
} 