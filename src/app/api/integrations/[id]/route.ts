import { NextRequest, NextResponse } from 'next/server';
import { integrationManager } from '@/lib/integrations/integrationManager';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const integration = integrationManager.getIntegration(params.id);

    if (!integration) {
      return NextResponse.json({
        success: false,
        error: 'Integration not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: integration
    });

  } catch (error) {
    console.error('Error fetching integration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch integration'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const PUT = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    const updates = body;

    const success = integrationManager.updateIntegration(params.id, updates);

    if (success) {
      const updatedIntegration = integrationManager.getIntegration(params.id);
      return NextResponse.json({
        success: true,
        data: updatedIntegration,
        message: 'Integration updated successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to update integration'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update integration'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });

export const DELETE = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const success = integrationManager.removeIntegration(params.id);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Integration deleted successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Integration not found'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error deleting integration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete integration'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });