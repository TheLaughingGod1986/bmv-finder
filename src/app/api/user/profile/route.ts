import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/lib/auth/userManager';
import { auditLogger } from '@/lib/audit/auditLogger';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

// GET /api/user/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await userManager.getUserProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Log data access
    await auditLogger.logDataAccess(user.id, 'user_profile', user.id, 'read');

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    
    // Validate updates
    const allowedFields = ['name', 'avatar', 'preferences'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedProfile = await userManager.updateUserProfile(user.id, filteredUpdates);

    // Log data modification
    await auditLogger.logDataModification(
      user.id,
      'user_profile',
      user.id,
      'update',
      filteredUpdates
    );

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/profile - Delete user profile
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete their own profile
    const hasPermission = await userManager.hasPermission(user.id, 'user_profile', 'delete');
    if (!hasPermission) {
      await auditLogger.logPermissionDenied(user.id, 'user_profile', 'delete');
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await userManager.deleteUserProfile(user.id);

    // Log data deletion
    await auditLogger.logDataDeletion(user.id, 'user_profile', user.id);

    return NextResponse.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
