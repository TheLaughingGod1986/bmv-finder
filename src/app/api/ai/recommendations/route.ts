import { NextRequest, NextResponse } from 'next/server';
import { aiRecommendationEngine } from '@/lib/ai/recommendationEngine';
import { requireAuth } from '@/middleware/auth';

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { userProfile, marketContext, propertyFilters, limit } = body;

    if (!userProfile || !marketContext) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userProfile, marketContext'
      }, { status: 400 });
    }

    // Generate AI recommendations
    const recommendations = await aiRecommendationEngine.generateRecommendations({
      userId: user.id,
      userProfile,
      marketContext,
      propertyFilters,
      limit: limit || 10,
    });

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      message: 'AI recommendations generated successfully'
    });

  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate AI recommendations'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Get user's existing recommendations
    const recommendations = await aiRecommendationEngine.getUserRecommendations(user.id);

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });

  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch AI recommendations'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });