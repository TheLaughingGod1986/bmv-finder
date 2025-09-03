import { NextRequest, NextResponse } from 'next/server';
import { apiOptimizer } from '@/lib/performance/apiOptimizer';
import { requireAuth } from '@/middleware/auth';

// GET /api/performance/api - Get API performance metrics
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const metrics = apiOptimizer.getMetrics();
    const recommendations = apiOptimizer.getRecommendations();

    // Convert Map to object for JSON serialization
    const metricsObject: Record<string, any> = {};
    for (const [endpoint, metric] of metrics as Map<string, any>) {
      metricsObject[endpoint] = metric;
    }

    return NextResponse.json({
      metrics: metricsObject,
      recommendations
    });
  } catch (error) {
    console.error('Error fetching API metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/performance/api/config - Update API optimization configuration
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const config = await request.json();
    apiOptimizer.updateConfig(config);

    return NextResponse.json({ success: true, message: 'Configuration updated' });
  } catch (error) {
    console.error('Error updating API configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
