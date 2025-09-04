import { NextRequest, NextResponse } from 'next/server';
import { performanceOptimizer } from '@/lib/performance/performanceOptimizer';
import { requireAuth } from '@/middleware/auth';
import { userManagement } from '@/lib/auth/userManagement';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    const hasAdminPermission = await userManagement.userHasPermission(user.id, 'admin.system');
    if (!hasAdminPermission) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      type: searchParams.get('type') || undefined,
      name: searchParams.get('name') || undefined,
      startTime: searchParams.get('startTime') || undefined,
      endTime: searchParams.get('endTime') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
    };

    // Get performance metrics
    const metrics = await performanceOptimizer.getMetrics(filters);

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch performance metrics'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    const hasAdminPermission = await userManagement.userHasPermission(user.id, 'admin.system');
    if (!hasAdminPermission) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    const body = await request.json();
    const { type, name, value, unit, metadata } = body;

    if (!type || !name || value === undefined || !unit) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type, name, value, unit'
      }, { status: 400 });
    }

    // Record performance metric
    const metric = await performanceOptimizer.recordMetric({
      type,
      name,
      value,
      unit,
      metadata,
    });

    return NextResponse.json({
      success: true,
      data: metric,
      message: 'Performance metric recorded successfully'
    });

  } catch (error) {
    console.error('Error recording performance metric:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to record performance metric'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });
