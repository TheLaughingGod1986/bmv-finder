import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  // Get the current user from Supabase session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Look up the Stripe customer ID from the user's profile (if you store it), or by email
  let customerId = null;
  // Option 1: If you store customer_id in your profiles table, fetch it here
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();
  if (profile && profile.stripe_customer_id) {
    customerId = profile.stripe_customer_id;
  } else {
    // Option 2: Fallback to searching by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
  }
  if (!customerId) {
    return NextResponse.json({ error: 'Stripe customer not found for user' }, { status: 404 });
  }

  // Create the portal session
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/account`,
  });
  return NextResponse.json({ url: session.url });
} 