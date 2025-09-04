import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { backupManager } from '@/lib/backup/backupManager';

// POST /api/backup/execute - Execute backup
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { configId } = await request.json();

    if (!configId) {
      return NextResponse.json(
        { error: 'configId is required' },
        { status: 400 }
      );
    }

    const backup = await backupManager.createBackup(configId, user.id);

    return NextResponse.json({
      success: true,
      backup
    });
  } catch (error) {
    console.error('Error executing backup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
