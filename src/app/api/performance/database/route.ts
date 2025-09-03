import { NextRequest, NextResponse } from 'next/server';
import { databaseOptimizer } from '@/lib/performance/databaseOptimizer';
import { requireAuth } from '@/middleware/auth';

// GET /api/performance/database - Get database performance metrics
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const metrics = await databaseOptimizer.getDatabaseMetrics();
    const recommendations = databaseOptimizer.getIndexRecommendations();

    return NextResponse.json({
      ...metrics,
      recommendations: recommendations.map(rec => ({
        table: rec.table,
        columns: rec.columns,
        reason: rec.reason,
        estimatedImpact: rec.estimatedImpact
      }))
    });
  } catch (error) {
    console.error('Error fetching database metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/performance/database/optimize - Apply database optimizations
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { action } = await request.json();

    if (action === 'create_indexes') {
      const result = await databaseOptimizer.createRecommendedIndexes();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error applying database optimizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
