import { NextRequest, NextResponse } from 'next/server';
import { userManagement } from '@/lib/auth/userManagement';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    const hasAdminPermission = await userManagement.userHasPermission(user.id, 'admin.users');
    if (!hasAdminPermission) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    // Get user statistics
    const stats = await userManagement.getUserStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user statistics'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });
