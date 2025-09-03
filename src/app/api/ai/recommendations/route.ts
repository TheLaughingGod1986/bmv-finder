import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { aiRecommendationEngine } from '@/lib/ai/recommendationEngine';

// POST /api/ai/recommendations - Generate AI-powered recommendations
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const recommendationRequest = await request.json();

    // Validate request
    if (!recommendationRequest.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Ensure user can only request recommendations for themselves
    if (recommendationRequest.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to request recommendations for other users' },
        { status: 403 }
      );
    }

    const recommendations = await aiRecommendationEngine.generateRecommendations(recommendationRequest);

    return NextResponse.json({
      success: true,
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET /api/ai/recommendations - Get user's recommendations
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Ensure user can only access their own recommendations
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access other users\' recommendations' },
        { status: 403 }
      );
    }

    const recommendations = aiRecommendationEngine.getRecommendations(userId);

    return NextResponse.json({
      success: true,
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
