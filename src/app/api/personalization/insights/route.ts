import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { personalizationManager } from '@/lib/personalization/personalizationManager';

// GET /api/personalization/insights - Get personalization insights
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const insights = await personalizationManager.getPersonalizationInsights(user.id);
    const recommendations = await personalizationManager.generatePersonalizationRecommendations(user.id);

    return NextResponse.json({
      success: true,
      insights,
      recommendations
    });
  } catch (error) {
    console.error('Error fetching personalization insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
