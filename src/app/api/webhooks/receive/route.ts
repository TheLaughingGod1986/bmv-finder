import { NextRequest, NextResponse } from 'next/server';
import { webhookManager } from '@/lib/integrations/webhookManager';

// POST /api/webhooks/receive - Receive incoming webhooks
export const POST = async (request: NextRequest) => {
  try {
    const source = request.headers.get('x-webhook-source') || 'unknown';
    const eventType = request.headers.get('x-webhook-event') || 'unknown';
    const signature = request.headers.get('x-webhook-signature');
    
    const payload = await request.json();
    const headers: Record<string, string> = {};
    
    // Extract relevant headers
    request.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('x-') || key.toLowerCase() === 'user-agent') {
        headers[key] = value;
      }
    });

    const result = await webhookManager.processWebhook(
      source,
      eventType,
      payload,
      headers,
      signature || undefined
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully',
        responses: result.responses
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Webhook processing failed',
        errors: result.errors
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
