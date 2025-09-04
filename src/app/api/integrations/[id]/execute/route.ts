import { NextRequest, NextResponse } from 'next/server';
import { integrationManager } from '@/lib/integrations/integrationManager';
import { requireAuth } from '@/middleware/auth';

export const POST = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    const parameters = body.parameters || {};

    const execution = await integrationManager.executeIntegration(params.id, parameters);

    if (execution) {
      return NextResponse.json({
        success: true,
        data: execution,
        message: 'Integration executed successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to execute integration'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error executing integration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute integration'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });