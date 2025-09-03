import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { personalizationManager } from '@/lib/personalization/personalizationManager';

// POST /api/personalization/behavior - Track user behavior
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const behavior = await request.json();

    if (!behavior.type || !behavior.action) {
      return NextResponse.json(
        { error: 'Type and action are required' },
        { status: 400 }
      );
    }

    await personalizationManager.trackUserBehavior(user.id, {
      type: behavior.type,
      action: behavior.action,
      target: behavior.target,
      metadata: behavior.metadata,
      timestamp: behavior.timestamp ? new Date(behavior.timestamp) : undefined
    });

    return NextResponse.json({
      success: true,
      message: 'Behavior tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking user behavior:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
