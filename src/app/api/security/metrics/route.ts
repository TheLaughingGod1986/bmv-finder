import { NextRequest, NextResponse } from 'next/server';
import { securityManager } from '@/lib/security/securityManager';
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

    // Get security metrics
    const metrics = await securityManager.getSecurityMetrics();

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching security metrics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch security metrics'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });