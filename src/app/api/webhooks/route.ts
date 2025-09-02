import { NextRequest, NextResponse } from 'next/server';
import { webhookManager } from '@/lib/webhookManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = webhookManager.getWebhookStatus();
        return NextResponse.json({
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        });

      case 'stats':
        const stats = webhookManager.getDeliveryStats();
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: status, stats'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Webhook API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, webhookId, event } = body;

    switch (action) {
      case 'emit':
        if (!event) {
          return NextResponse.json({
            success: false,
            error: 'Event data is required'
          }, { status: 400 });
        }

        await webhookManager.emitEvent(event);
        return NextResponse.json({
          success: true,
          message: 'Event emitted successfully',
          timestamp: new Date().toISOString()
        });

      case 'test':
        if (!webhookId) {
          return NextResponse.json({
            success: false,
            error: 'Webhook ID is required'
          }, { status: 400 });
        }

        const testResult = await webhookManager.testWebhook(webhookId);
        return NextResponse.json({
          success: true,
          data: testResult,
          timestamp: new Date().toISOString()
        });

      case 'retry':
        const retried = await webhookManager.retryFailedDeliveries();
        return NextResponse.json({
          success: true,
          message: `Retried ${retried} failed deliveries`,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: emit, test, retry'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Webhook API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Operation failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
