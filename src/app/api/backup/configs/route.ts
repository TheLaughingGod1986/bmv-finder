import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { backupManager } from '@/lib/backup/backupManager';

// GET /api/backup/configs - Get backup configurations
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const configs = backupManager.getAllBackupConfigs();

    return NextResponse.json({
      success: true,
      configs
    });
  } catch (error) {
    console.error('Error fetching backup configurations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/backup/configs - Create backup configuration
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const configData = await request.json();
    const config = await backupManager.createBackupConfig(configData);

    return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error creating backup configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
