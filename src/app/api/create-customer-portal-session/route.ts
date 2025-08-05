import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabaseClient';

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

export async function POST(req: NextRequest) {
  try {
    // Get the access token from the Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Use the token to get the user
    const { data: { user } } = await supabase.auth.getUser(token);
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
      const stripe = getStripe();
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }
    if (!customerId) {
      return NextResponse.json({ error: 'Stripe customer not found for user' }, { status: 404 });
    }

    // Create the portal session
    // Use NEXT_PUBLIC_BASE_URL or fallback to NEXT_PUBLIC_APP_URL or current deployment URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.NEXT_PUBLIC_APP_URL || 
                    'https://bmv-finder-git-main-bens-projects-11c93b15.vercel.app';
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/account`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error in create-customer-portal-session:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
} 