import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { advancedAnalyticsEngine } from '@/lib/analytics/advancedAnalytics';

// POST /api/analytics/predict - Make prediction
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { modelId, inputData, options } = await request.json();

    if (!modelId || !inputData) {
      return NextResponse.json(
        { error: 'modelId and inputData are required' },
        { status: 400 }
      );
    }

    const prediction = await advancedAnalyticsEngine.makePrediction({
      modelId,
      inputData,
      options: options || {},
      requestedBy: user.id
    });

    return NextResponse.json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('Error making prediction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
