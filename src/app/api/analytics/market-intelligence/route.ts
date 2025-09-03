import { NextRequest, NextResponse } from 'next/server';
import { propertyAnalyticsEngine } from '@/lib/analytics/propertyAnalytics';
import { requireAuth } from '@/middleware/auth';

// POST /api/analytics/market-intelligence - Generate market intelligence data
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { postcode, region } = await request.json();

    if (!postcode || !region) {
      return NextResponse.json(
        { error: 'Postcode and region are required' },
        { status: 400 }
      );
    }

    const intelligence = await propertyAnalyticsEngine.generateMarketIntelligence(
      postcode,
      region,
      user.id
    );

    return NextResponse.json({
      success: true,
      intelligence
    });
  } catch (error) {
    console.error('Error generating market intelligence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET /api/analytics/market-intelligence - Get market intelligence for a region
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const region = searchParams.get('region');

    if (!postcode || !region) {
      return NextResponse.json(
        { error: 'Postcode and region are required' },
        { status: 400 }
      );
    }

    const intelligence = await propertyAnalyticsEngine.generateMarketIntelligence(
      postcode,
      region,
      user.id
    );

    return NextResponse.json({
      success: true,
      intelligence
    });
  } catch (error) {
    console.error('Error fetching market intelligence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
