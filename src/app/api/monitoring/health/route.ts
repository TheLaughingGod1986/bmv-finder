import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { monitoringManager } from '@/lib/monitoring/monitoringManager';

// GET /api/monitoring/health - Get system health
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const systemHealth = await monitoringManager.getSystemHealth();

    return NextResponse.json({
      success: true,
      health: systemHealth
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
