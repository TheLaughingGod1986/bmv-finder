import { NextRequest, NextResponse } from 'next/server';
import { propertyAnalyticsEngine } from '@/lib/analytics/propertyAnalytics';
import { requireAuth } from '@/middleware/auth';

// POST /api/analytics/property - Generate comprehensive property analytics
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { propertyData, postcode } = await request.json();

    if (!propertyData || !postcode) {
      return NextResponse.json(
        { error: 'Property data and postcode are required' },
        { status: 400 }
      );
    }

    const analytics = await propertyAnalyticsEngine.generatePropertyAnalytics(
      propertyData,
      postcode,
      user.id
    );

    return NextResponse.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error generating property analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET /api/analytics/property - Get cached property analytics
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const postcode = searchParams.get('postcode');

    if (!propertyId && !postcode) {
      return NextResponse.json(
        { error: 'Property ID or postcode is required' },
        { status: 400 }
      );
    }

    // This would typically fetch from cache or database
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      message: 'Property analytics endpoint ready',
      propertyId,
      postcode
    });
  } catch (error) {
    console.error('Error fetching property analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
