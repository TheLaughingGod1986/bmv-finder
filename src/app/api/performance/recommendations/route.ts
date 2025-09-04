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
      priority: searchParams.get('priority') || undefined,
      status: searchParams.get('status') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    // Get performance recommendations
    const recommendations = await performanceOptimizer.getRecommendations(filters);

    return NextResponse.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Error fetching performance recommendations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch performance recommendations'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });

export const PUT = requireAuth(async (request: NextRequest, user: any) => {
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
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: id, status'
      }, { status: 400 });
    }

    // Update recommendation status
    const success = await performanceOptimizer.updateRecommendationStatus(id, status);

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Recommendation not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Recommendation status updated successfully'
    });

  } catch (error) {
    console.error('Error updating recommendation status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update recommendation status'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });