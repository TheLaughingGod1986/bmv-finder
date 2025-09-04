import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { advancedAnalyticsEngine } from '@/lib/analytics/advancedAnalytics';

// POST /api/analytics/execute - Execute analytics query
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { queryId, parameters } = await request.json();

    if (!queryId) {
      return NextResponse.json(
        { error: 'queryId is required' },
        { status: 400 }
      );
    }

    const result = await advancedAnalyticsEngine.executeQuery(queryId, parameters);

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error executing analytics query:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
