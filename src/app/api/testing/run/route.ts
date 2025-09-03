import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { testFramework } from '@/lib/testing/testFramework';

// POST /api/testing/run - Run tests
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { config } = await request.json();

    const results = await testFramework.runTests(config);

    return NextResponse.json({
      success: true,
      results,
      stats: testFramework.getTestStats()
    });
  } catch (error) {
    console.error('Error running tests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET /api/testing/run - Get test results
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const results = testFramework.getResults();
    const stats = testFramework.getTestStats();

    return NextResponse.json({
      success: true,
      results,
      stats
    });
  } catch (error) {
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
