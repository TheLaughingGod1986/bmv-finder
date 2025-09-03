import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { webhookManager } from '@/lib/integrations/webhookManager';

// GET /api/webhooks/[id] - Get specific webhook request
export const GET = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const webhookRequest = webhookManager.getWebhookRequest(params.id);

    if (!webhookRequest) {
      return NextResponse.json(
        { error: 'Webhook request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: webhookRequest
    });
  } catch (error) {
    console.error('Error fetching webhook request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// DELETE /api/webhooks/[id] - Unregister webhook handler
export const DELETE = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const success = await webhookManager.unregisterHandler(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Webhook handler not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook handler unregistered successfully'
    });
  } catch (error) {
    console.error('Error unregistering webhook handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
