import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { deploymentManager } from '@/lib/deployment/deploymentManager';

// POST /api/deployment/deploy - Deploy application
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { configId, version, commitHash, branch } = await request.json();

    if (!configId || !version) {
      return NextResponse.json(
        { error: 'configId and version are required' },
        { status: 400 }
      );
    }

    const deployment = await deploymentManager.deploy(
      configId,
      version,
      user.id,
      commitHash || 'unknown',
      branch || 'main'
    );

    return NextResponse.json({
      success: true,
      deployment
    });
  } catch (error) {
    console.error('Error deploying application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
