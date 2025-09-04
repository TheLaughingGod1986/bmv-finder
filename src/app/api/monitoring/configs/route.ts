import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { monitoringManager } from '@/lib/monitoring/monitoringManager';

// GET /api/monitoring/configs - Get monitoring configurations
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const configs = monitoringManager.getAllMonitoringConfigs();

    return NextResponse.json({
      success: true,
      configs
    });
  } catch (error) {
    console.error('Error fetching monitoring configurations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/monitoring/configs - Create monitoring configuration
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const configData = await request.json();
    const config = await monitoringManager.createMonitoringConfig(configData);

    return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error creating monitoring configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
