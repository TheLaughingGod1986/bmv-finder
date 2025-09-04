import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { advancedAnalyticsEngine } from '@/lib/analytics/advancedAnalytics';

// GET /api/analytics/queries - Get analytics queries
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const queries = advancedAnalyticsEngine.getAllQueries();

    return NextResponse.json({
      success: true,
      queries
    });
  } catch (error) {
    console.error('Error fetching analytics queries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/analytics/queries - Create analytics query
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const queryData = await request.json();
    const query = await advancedAnalyticsEngine.createQuery(queryData);

    return NextResponse.json({
      success: true,
      query
    });
  } catch (error) {
    console.error('Error creating analytics query:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
