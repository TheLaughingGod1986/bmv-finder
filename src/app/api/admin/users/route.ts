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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      role: searchParams.get('role') || undefined,
      tier: searchParams.get('tier') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      searchTerm: searchParams.get('search') || undefined,
      createdAfter: searchParams.get('createdAfter') || undefined,
      createdBefore: searchParams.get('createdBefore') || undefined,
      lastLoginAfter: searchParams.get('lastLoginAfter') || undefined,
      lastLoginBefore: searchParams.get('lastLoginBefore') || undefined,
    };

    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Search users
    const result = await userManagement.searchUsers(filters, limit, offset);

    return NextResponse.json({
      success: true,
      data: {
        users: result.users,
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });
