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

export async function POST(req: NextRequest) {
  try {
    const { userId, email, propertyData } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const PDF_REPORT_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PDF_REPORT_PRICE_ID;
    if (!PDF_REPORT_PRICE_ID) {
      return NextResponse.json({ error: 'PDF report price ID not configured' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl || (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://'))) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_BASE_URL must be set in your environment and start with http:// or https://' }, { status: 500 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: PDF_REPORT_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      metadata: {
        userId,
        propertyData: JSON.stringify(propertyData),
        type: 'pdf_report'
      },
      success_url: `${baseUrl}/api/generate-pdf-report?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/what-should-i-pay?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating PDF report checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 