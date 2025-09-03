import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { userJourneyOptimizer } from '@/lib/ux/userJourneyOptimizer';

// GET /api/ux/journey/[id] - Get specific journey
export const GET = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const journey = userJourneyOptimizer.getJourney(params.id);

    if (!journey) {
      return NextResponse.json(
        { error: 'Journey not found' },
        { status: 404 }
      );
    }

    // Ensure user can only access their own journeys
    if (journey.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this journey' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      journey
    });
  } catch (error) {
    console.error('Error fetching journey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/ux/journey/[id]/step - Add step to journey
export const POST = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const step = await request.json();

    if (!step.stepType || !step.page) {
      return NextResponse.json(
        { error: 'Step type and page are required' },
        { status: 400 }
      );
    }

    const journey = userJourneyOptimizer.getJourney(params.id);
    if (!journey) {
      return NextResponse.json(
        { error: 'Journey not found' },
        { status: 404 }
      );
    }

    // Ensure user can only modify their own journeys
    if (journey.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this journey' },
        { status: 403 }
      );
    }

    await userJourneyOptimizer.addJourneyStep(params.id, step);

    return NextResponse.json({
      success: true,
      message: 'Step added successfully'
    });
  } catch (error) {
    console.error('Error adding journey step:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/ux/journey/[id]/complete - Complete journey
export const PUT = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const { success } = await request.json();

    const journey = userJourneyOptimizer.getJourney(params.id);
    if (!journey) {
      return NextResponse.json(
        { error: 'Journey not found' },
        { status: 404 }
      );
    }

    // Ensure user can only complete their own journeys
    if (journey.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to complete this journey' },
        { status: 403 }
      );
    }

    await userJourneyOptimizer.completeJourney(params.id, success);

    return NextResponse.json({
      success: true,
      message: 'Journey completed successfully'
    });
  } catch (error) {
    console.error('Error completing journey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
