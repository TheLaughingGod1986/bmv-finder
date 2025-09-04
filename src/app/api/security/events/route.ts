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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      type: searchParams.get('type') || undefined,
      severity: searchParams.get('severity') || undefined,
      resolved: searchParams.get('resolved') ? searchParams.get('resolved') === 'true' : undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Get security events
    const result = await securityManager.getSecurityEvents(filters);

    return NextResponse.json({
      success: true,
      data: {
        events: result.events,
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + filters.limit < result.total
      }
    });

  } catch (error) {
    console.error('Error fetching security events:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch security events'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });