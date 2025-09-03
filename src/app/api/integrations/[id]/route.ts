import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { integrationManager } from '@/lib/integrations/integrationManager';

// GET /api/integrations/[id] - Get specific integration
export const GET = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const integration = integrationManager.getIntegration(params.id);

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      integration
    });
  } catch (error) {
    console.error('Error fetching integration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/integrations/[id] - Update integration
export const PUT = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const updates = await request.json();
    const integration = await integrationManager.updateIntegration(params.id, updates);

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      integration
    });
  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// DELETE /api/integrations/[id] - Delete integration
export const DELETE = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const success = await integrationManager.deleteIntegration(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Integration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting integration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
