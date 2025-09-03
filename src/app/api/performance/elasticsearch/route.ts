import { NextRequest, NextResponse } from 'next/server';
import { elasticsearchOptimizer } from '@/lib/performance/elasticsearchOptimizer';
import { requireAuth } from '@/middleware/auth';

// GET /api/performance/elasticsearch - Get Elasticsearch performance metrics
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const metrics = await elasticsearchOptimizer.getMetrics();
    const recommendations = elasticsearchOptimizer.getIndexRecommendations();

    return NextResponse.json({
      ...metrics,
      recommendations: recommendations.map(rec => ({
        index: rec.index,
        improvements: rec.improvements,
        estimatedImpact: rec.estimatedImpact
      }))
    });
  } catch (error) {
    console.error('Error fetching Elasticsearch metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/performance/elasticsearch/optimize - Apply Elasticsearch optimizations
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { action } = await request.json();

    if (action === 'apply_index_optimizations') {
      const result = await elasticsearchOptimizer.applyIndexOptimizations();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error applying Elasticsearch optimizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
