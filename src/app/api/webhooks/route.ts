import { NextRequest, NextResponse } from 'next/server';
import { webhookManager } from '@/lib/integrations/webhookManager';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const event = searchParams.get('event');

    let webhooks = webhookManager.getAllWebhooks();

    // Apply filters
    if (status) {
      webhooks = webhooks.filter(webhook => webhook.status === status);
    }
    if (event) {
      webhooks = webhooks.filter(webhook => webhook.events.includes(event));
    }

    return NextResponse.json({
      success: true,
      data: webhooks,
      count: webhooks.length
    });

  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch webhooks'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { name, url, method, events, headers, authentication, retryPolicy, rateLimit } = body;

    if (!name || !url || !method || !events) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, url, method, events'
      }, { status: 400 });
    }

    const webhookConfig = {
      id: `webhook-${Date.now()}`,
      name,
      url,
      method,
      events,
      headers: headers || {},
      authentication: authentication || { type: 'NONE', credentials: {} },
      retryPolicy: retryPolicy || {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      rateLimit: rateLimit || {
        requests: 100,
        period: 'MINUTE',
      },
      status: 'INACTIVE' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const success = webhookManager.addWebhook(webhookConfig);

    if (success) {
      return NextResponse.json({
        success: true,
        data: webhookConfig,
        message: 'Webhook created successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to create webhook'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create webhook'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });