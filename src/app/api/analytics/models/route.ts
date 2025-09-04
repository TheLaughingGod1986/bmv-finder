import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { advancedAnalyticsEngine } from '@/lib/analytics/advancedAnalytics';

// GET /api/analytics/models - Get predictive models
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const models = advancedAnalyticsEngine.getAllModels();

    return NextResponse.json({
      success: true,
      models
    });
  } catch (error) {
    console.error('Error fetching predictive models:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/analytics/models - Create predictive model
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const modelData = await request.json();
    const model = await advancedAnalyticsEngine.createModel(modelData);

    return NextResponse.json({
      success: true,
      model
    });
  } catch (error) {
    console.error('Error creating predictive model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
