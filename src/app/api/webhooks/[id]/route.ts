import { NextRequest, NextResponse } from 'next/server';
import { webhookManager } from '@/lib/integrations/webhookManager';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const webhook = webhookManager.getWebhook(params.id);

    if (!webhook) {
      return NextResponse.json({
        success: false,
        error: 'Webhook not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: webhook
    });

  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch webhook'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const PUT = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    const updates = body;

    const success = webhookManager.updateWebhook(params.id, updates);

    if (success) {
      const updatedWebhook = webhookManager.getWebhook(params.id);
      return NextResponse.json({
        success: true,
        data: updatedWebhook,
        message: 'Webhook updated successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to update webhook'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update webhook'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });

export const DELETE = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const success = webhookManager.removeWebhook(params.id);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Webhook deleted successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Webhook not found'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete webhook'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });