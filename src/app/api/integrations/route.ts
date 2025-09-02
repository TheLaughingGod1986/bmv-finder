import { NextRequest, NextResponse } from 'next/server';
import { integrationManager } from '@/lib/integrationManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const integration = searchParams.get('integration');

    switch (action) {
      case 'status':
        const status = integrationManager.getIntegrationStatus();
        return NextResponse.json({
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        });

      case 'metrics':
        const metrics = integrationManager.getMetrics(integration || undefined);
        return NextResponse.json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString()
        });

      case 'test':
        if (!integration) {
          return NextResponse.json({
            success: false,
            error: 'Integration name required for test action'
          }, { status: 400 });
        }

        const testResult = await integrationManager.testIntegration(integration);
        return NextResponse.json({
          success: true,
          data: testResult,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: status, metrics, test'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Integration API error:', error);
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
    const { integration, endpoint, params, options } = body;

    if (!integration || !endpoint) {
      return NextResponse.json({
        success: false,
        error: 'Integration name and endpoint are required'
      }, { status: 400 });
    }

    const result = await integrationManager.makeRequest(integration, endpoint, {
      params,
      ...options
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Integration request error:', error);
    return NextResponse.json({
      success: false,
      error: 'Request failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integration = searchParams.get('integration');
    const action = searchParams.get('action');

    if (action === 'cache' && integration) {
      await integrationManager.clearCache(integration);
      return NextResponse.json({
        success: true,
        message: `Cache cleared for ${integration}`,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action for DELETE request'
    }, { status: 400 });

  } catch (error: any) {
    console.error('Integration delete error:', error);
    return NextResponse.json({
      success: false,
      error: 'Operation failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
