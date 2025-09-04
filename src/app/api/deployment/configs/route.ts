import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { deploymentManager } from '@/lib/deployment/deploymentManager';

// GET /api/deployment/configs - Get deployment configurations
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const configs = deploymentManager.getAllDeploymentConfigs();

    return NextResponse.json({
      success: true,
      configs
    });
  } catch (error) {
    console.error('Error fetching deployment configurations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/deployment/configs - Create deployment configuration
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const configData = await request.json();
    const config = await deploymentManager.createDeploymentConfig(configData);

    return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error creating deployment configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
