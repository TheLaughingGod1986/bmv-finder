import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { aiRecommendationEngine } from '@/lib/ai/recommendationEngine';

// GET /api/ai/recommendations/[id] - Get specific recommendation
export const GET = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const recommendation = aiRecommendationEngine.getRecommendation(params.id);

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }

    // Ensure user can only access their own recommendations
    if (recommendation.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this recommendation' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      recommendation
    });
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
