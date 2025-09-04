import { NextRequest, NextResponse } from 'next/server';
import { getMetricsCollector } from '@/lib/monitoring/metricsCollector';
import { getAlertManager } from '@/lib/monitoring/performanceAlerting';
import { requireAuth } from '@/middleware/auth';

// GET /api/monitoring/metrics - Get metrics
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'system' | 'cache' | 'api' | 'all';
    const limit = parseInt(searchParams.get('limit') || '100');
    const timeframe = searchParams.get('timeframe') || '1h';

    const metricsCollector = getMetricsCollector();
    const alertManager = getAlertManager();

    let response: any = {
      success: true,
      timestamp: new Date().toISOString(),
      timeframe
    };

    switch (type) {
      case 'system':
        response.system = metricsCollector.getMetricsHistory('system', limit);
        break;
      case 'cache':
        response.cache = metricsCollector.getMetricsHistory('cache', limit);
        break;
      case 'api':
        response.api = metricsCollector.getMetricsHistory('api', limit);
        response.apiEndpoints = metricsCollector.getAPIEndpointStats();
        break;
      case 'all':
      default:
        response.current = metricsCollector.getCurrentMetrics();
        response.system = metricsCollector.getMetricsHistory('system', limit);
        response.cache = metricsCollector.getMetricsHistory('cache', limit);
        response.api = metricsCollector.getMetricsHistory('api', limit);
        response.apiEndpoints = metricsCollector.getAPIEndpointStats();
        response.alerts = {
          active: alertManager.getActiveAlerts(),
          stats: alertManager.getAlertStats()
        };
        break;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});

// POST /api/monitoring/metrics - Manage metrics
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {

    const body = await request.json();
    const { action } = body;

    const metricsCollector = getMetricsCollector();

    switch (action) {
      case 'clear-history':
        metricsCollector.clearHistory();
        return NextResponse.json({
          success: true,
          message: 'Metrics history cleared'
        });

      case 'export':
        const data = metricsCollector.exportMetricsData();
        return NextResponse.json({
          success: true,
          data
        });

      case 'start-collection':
        const { interval = 30000 } = body;
        metricsCollector.startCollection(interval);
        return NextResponse.json({
          success: true,
          message: 'Metrics collection started'
        });

      case 'stop-collection':
        metricsCollector.stopCollection();
        return NextResponse.json({
          success: true,
          message: 'Metrics collection stopped'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Failed to manage metrics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to manage metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});
