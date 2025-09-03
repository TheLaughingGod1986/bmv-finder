import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { userJourneyOptimizer } from '@/lib/ux/userJourneyOptimizer';

// GET /api/ux/optimizations - Get UX optimizations
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const optimizations = userJourneyOptimizer.getOptimizations();
    const flows = userJourneyOptimizer.getAllFlows();
    const stats = userJourneyOptimizer.getUXStats();

    return NextResponse.json({
      success: true,
      optimizations,
      flows,
      stats
    });
  } catch (error) {
    console.error('Error fetching UX optimizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/ux/optimizations - Generate new optimizations
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const optimizations = await userJourneyOptimizer.generateOptimizations();

    return NextResponse.json({
      success: true,
      optimizations
    });
  } catch (error) {
    console.error('Error generating UX optimizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
