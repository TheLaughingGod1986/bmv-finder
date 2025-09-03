import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { userJourneyOptimizer } from '@/lib/ux/userJourneyOptimizer';

// POST /api/ux/journey/start - Start a new user journey
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { sessionId, goal } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const journeyId = await userJourneyOptimizer.startJourney(user.id, sessionId, goal);

    return NextResponse.json({
      success: true,
      journeyId
    });
  } catch (error) {
    console.error('Error starting user journey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET /api/ux/journey - Get user journeys
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const journeys = userJourneyOptimizer.getUserJourneys(user.id);

    return NextResponse.json({
      success: true,
      journeys
    });
  } catch (error) {
    console.error('Error fetching user journeys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
