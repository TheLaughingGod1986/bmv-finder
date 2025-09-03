import { NextRequest, NextResponse } from 'next/server';
import { databaseOptimizer } from '@/lib/performance/databaseOptimizer';
import { apiOptimizer } from '@/lib/performance/apiOptimizer';
import { elasticsearchOptimizer } from '@/lib/performance/elasticsearchOptimizer';
import { requireAuth } from '@/middleware/auth';

// GET /api/performance/recommendations - Get all performance recommendations
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const [dbRecommendations, apiRecommendations, esRecommendations] = await Promise.all([
      Promise.resolve(databaseOptimizer.getIndexRecommendations()),
      Promise.resolve(apiOptimizer.getRecommendations()),
      Promise.resolve(elasticsearchOptimizer.getIndexRecommendations())
    ]);

    return NextResponse.json({
      database: dbRecommendations.map(rec => ({
        issue: `Missing index on ${rec.table}(${rec.columns.join(', ')})`,
        recommendation: rec.reason,
        priority: rec.estimatedImpact === 'high' ? 'high' : 
                 rec.estimatedImpact === 'medium' ? 'medium' : 'low'
      })),
      api: apiRecommendations,
      elasticsearch: esRecommendations.map(rec => ({
        index: rec.index,
        issue: 'Index optimization needed',
        recommendation: rec.improvements.join('; '),
        priority: rec.estimatedImpact === 'high' ? 'high' : 
                 rec.estimatedImpact === 'medium' ? 'medium' : 'low'
      }))
    });
  } catch (error) {
    console.error('Error fetching performance recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
