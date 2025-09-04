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

    // Get performance summary
    const summary = await performanceOptimizer.getPerformanceSummary();

    return NextResponse.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching performance summary:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch performance summary'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });
