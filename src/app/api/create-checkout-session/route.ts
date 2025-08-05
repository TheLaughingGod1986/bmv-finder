import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Force dynamic rendering to prevent build-time issues
export const dynamic = 'force-dynamic';

// Initialize Stripe client only when environment variable is available
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});
};

const ALLOWED_PRICE_IDS = [
  process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
  process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
  process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
  process.env.NEXT_PUBLIC_STRIPE_ELITE_MONTHLY_PRICE_ID,
  process.env.NEXT_PUBLIC_STRIPE_ELITE_YEARLY_PRICE_ID,
].filter(Boolean);

export async function POST(req: NextRequest) {
  const { userId, priceId, email } = await req.json();

  // Debug logs

  if (!userId || !priceId) {
    return NextResponse.json({ error: 'Missing userId or priceId' }, { status: 400 });
  }
  if (!ALLOWED_PRICE_IDS.includes(priceId)) {
    return NextResponse.json({ error: 'Invalid priceId' }, { status: 400 });
  }

  // Use NEXT_PUBLIC_BASE_URL or fallback to NEXT_PUBLIC_APP_URL or current deployment URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  process.env.NEXT_PUBLIC_APP_URL || 
                  'https://bmv-finder-oe3jeqmh2-bens-projects-11c93b15.vercel.app';
  
  if (!baseUrl || (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://'))) {
    return NextResponse.json({ error: 'Base URL must be set in your environment and start with http:// or https://' }, { status: 500 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email || undefined, // Optionally pass user's email
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
      success_url: `${baseUrl}/account?success=1`,
      cancel_url: `${baseUrl}/account?canceled=1`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 