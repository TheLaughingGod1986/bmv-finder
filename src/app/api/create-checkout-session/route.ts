import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

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
  console.log('Using Stripe secret key:', process.env.STRIPE_SECRET_KEY);
  console.log('Allowed price IDs:', ALLOWED_PRICE_IDS);
  console.log('Requested priceId:', priceId);
  console.log('Elite yearly price ID:', process.env.NEXT_PUBLIC_STRIPE_ELITE_YEARLY_PRICE_ID);
  console.log('All env:', JSON.stringify(process.env, null, 2));

  if (!userId || !priceId) {
    return NextResponse.json({ error: 'Missing userId or priceId' }, { status: 400 });
  }
  if (!ALLOWED_PRICE_IDS.includes(priceId)) {
    return NextResponse.json({ error: 'Invalid priceId' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl || (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://'))) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_BASE_URL must be set in your environment and start with http:// or https://' }, { status: 500 });
  }

  try {
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