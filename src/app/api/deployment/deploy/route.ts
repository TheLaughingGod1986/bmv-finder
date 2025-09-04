import { NextRequest, NextResponse } from 'next/server';
import { deploymentManager } from '@/lib/documentation/deploymentManager';
import { requireAuth } from '@/middleware/auth';

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { pipelineId, commitHash, commitMessage } = body;

    if (!pipelineId) {
      return NextResponse.json({
        success: false,
        error: 'pipelineId is required'
      }, { status: 400 });
    }

    const deployment = await deploymentManager.executePipeline(
      pipelineId,
      user.id,
      commitHash || 'latest',
      commitMessage || 'Manual deployment'
    );

    if (!deployment) {
      return NextResponse.json({
        success: false,
        error: 'Failed to execute deployment pipeline'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: deployment,
      message: 'Deployment started successfully'
    });

  } catch (error) {
    console.error('Error executing deployment:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute deployment'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');
    const deploymentId = searchParams.get('deploymentId');

    if (pipelineId) {
      // Get deployment history for pipeline
      const history = deploymentManager.getDeploymentHistory(pipelineId);
      return NextResponse.json({
        success: true,
        data: history,
        count: history.length
      });
    } else if (deploymentId) {
      // Get specific deployment (would need to search through all pipelines)
      // For now, return error as we need pipelineId to find deployment
      return NextResponse.json({
        success: false,
        error: 'pipelineId is required to find specific deployment'
      }, { status: 400 });
    } else {
      return NextResponse.json({
        success: false,
        error: 'pipelineId or deploymentId is required'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fetching deployment data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch deployment data'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });