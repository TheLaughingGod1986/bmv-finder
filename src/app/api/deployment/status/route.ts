import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { deploymentManager } from '@/lib/deployment/deploymentManager';

// GET /api/deployment/status - Get deployment status
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const deployments = deploymentManager.getAllDeployments();
    const stats = deploymentManager.getDeploymentStats();

    return NextResponse.json({
      success: true,
      deployments,
      stats
    });
  } catch (error) {
    console.error('Error fetching deployment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
