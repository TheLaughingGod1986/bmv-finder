import { NextRequest, NextResponse } from 'next/server';
import { userManagement } from '@/lib/auth/userManagement';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Get user profile with role information
    const userProfile = await userManagement.getUserWithRole(user.id);

    if (!userProfile) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Get usage statistics
    const usageStats = await userManagement.getUserUsageStats(user.id);

    return NextResponse.json({
      success: true,
      data: {
        user: userProfile,
        usageStats
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user profile'
    }, { status: 500 });
  }
});

export const PUT = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { name, preferences } = body;

    // Update user profile
    const updatedUser = await userManagement.getUserWithRole(user.id);
    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Update allowed fields
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (preferences !== undefined) {
      updateData.preferences = {
        ...updatedUser.preferences,
        ...preferences
      };
    }

    // In a real implementation, you would update the user profile here
    // For now, we'll return the current user data

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update user profile'
    }, { status: 500 });
  }
});