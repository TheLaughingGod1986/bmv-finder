import { NextRequest, NextResponse } from 'next/server';
import { userManagement } from '@/lib/auth/userManagement';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any, { params }: { params: { userId: string } }) => {
  try {
    // Check if user has admin permissions
    const hasAdminPermission = await userManagement.userHasPermission(user.id, 'admin.users');
    if (!hasAdminPermission) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    const { userId } = params;
    const userProfile = await userManagement.getUserWithRole(userId);

    if (!userProfile) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Get usage statistics
    const usageStats = await userManagement.getUserUsageStats(userId);

    return NextResponse.json({
      success: true,
      data: {
        user: userProfile,
        usageStats
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });

export const PUT = requireAuth(async (request: NextRequest, user: any, { params }: { params: { userId: string } }) => {
  try {
    // Check if user has admin permissions
    const hasAdminPermission = await userManagement.userHasPermission(user.id, 'admin.users');
    if (!hasAdminPermission) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    const { userId } = params;
    const body = await request.json();
    const { role, isActive } = body;

    let result;

    if (role !== undefined) {
      result = await userManagement.updateUserRole(userId, role, user.id);
    } else if (isActive !== undefined) {
      result = await userManagement.toggleUserStatus(userId, isActive, user.id);
    } else {
      return NextResponse.json({
        success: false,
        error: 'No valid update fields provided'
      }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.user,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update user'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });
