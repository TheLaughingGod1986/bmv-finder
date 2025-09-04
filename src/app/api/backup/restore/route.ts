import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { backupManager } from '@/lib/backup/backupManager';

// POST /api/backup/restore - Create restore request
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { backupId, destination, options } = await request.json();

    if (!backupId || !destination) {
      return NextResponse.json(
        { error: 'backupId and destination are required' },
        { status: 400 }
      );
    }

    const restoreRequest = await backupManager.createRestoreRequest(
      backupId,
      destination,
      options || {},
      user.id
    );

    return NextResponse.json({
      success: true,
      restoreRequest
    });
  } catch (error) {
    console.error('Error creating restore request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
