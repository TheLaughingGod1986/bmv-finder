import { NextRequest, NextResponse } from 'next/server';
import { mobileOptimizer } from '@/lib/mobile/mobileOptimizer';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get mobile metrics
    const metrics = mobileOptimizer.getMobileMetrics(limit);
    const touchGestures = mobileOptimizer.getTouchGestures(limit);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        touchGestures,
        total: metrics.length,
      }
    });

  } catch (error) {
    console.error('Error fetching mobile metrics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch mobile metrics'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { type, name, value, unit, metadata } = body;

    if (!type || !name || value === undefined || !unit) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type, name, value, unit'
      }, { status: 400 });
    }

    // Record mobile metric
    const metric = await mobileOptimizer.recordMetric({
      type,
      name,
      value,
      unit,
      metadata,
    });

    return NextResponse.json({
      success: true,
      data: metric,
      message: 'Mobile metric recorded successfully'
    });

  } catch (error) {
    console.error('Error recording mobile metric:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to record mobile metric'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });
