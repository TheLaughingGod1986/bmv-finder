import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { webhookManager } from '@/lib/integrations/webhookManager';

// GET /api/webhooks - Get webhook handlers and statistics
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'handlers') {
      const handlers = webhookManager.getHandlerStats();
      return NextResponse.json({
        success: true,
        handlers
      });
    } else if (type === 'requests') {
      const limit = parseInt(searchParams.get('limit') || '100');
      const requests = webhookManager.getWebhookRequests(limit);
      return NextResponse.json({
        success: true,
        requests
      });
    } else if (type === 'metrics') {
      const metrics = webhookManager.getWebhookMetrics();
      return NextResponse.json({
        success: true,
        metrics
      });
    } else if (type === 'event-types') {
      const eventTypes = webhookManager.getSupportedEventTypes();
      return NextResponse.json({
        success: true,
        eventTypes
      });
    } else {
      // Return all webhook data
      const handlers = webhookManager.getHandlerStats();
      const requests = webhookManager.getWebhookRequests(50);
      const metrics = webhookManager.getWebhookMetrics();
      const eventTypes = webhookManager.getSupportedEventTypes();

      return NextResponse.json({
        success: true,
        handlers,
        requests,
        metrics,
        eventTypes
      });
    }
  } catch (error) {
    console.error('Error fetching webhook data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/webhooks - Register new webhook handler
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { name, eventTypes, handler } = await request.json();

    if (!name || !eventTypes || !Array.isArray(eventTypes)) {
      return NextResponse.json(
        { error: 'Name and eventTypes are required' },
        { status: 400 }
      );
    }

    // Note: In a real implementation, you would need to handle the handler function
    // This is a simplified version for demonstration
    const handlerId = await webhookManager.registerHandler(
      name,
      eventTypes,
      async (payload, headers) => {
        // Default handler implementation
        console.log('Processing webhook:', { name, eventTypes, payload, headers });
        return { success: true, response: { message: 'Webhook processed' } };
      }
    );

    return NextResponse.json({
      success: true,
      handlerId
    });
  } catch (error) {
    console.error('Error registering webhook handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});