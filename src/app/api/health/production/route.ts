import { NextRequest, NextResponse } from 'next/server';
import { getHealthMonitor } from '@/lib/monitoring/productionHealth';
import { getMetricsCollector } from '@/lib/monitoring/metricsCollector';
import { getAlertManager } from '@/lib/monitoring/performanceAlerting';
import { requireAuth } from '@/lib/auth/middleware';

// GET /api/health/production - Get comprehensive production health status
export async function GET(request: NextRequest) {
  try {
    // Check authentication (admin only for detailed health info)
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse;
    }

    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    const includeHistory = searchParams.get('history') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    const healthMonitor = getHealthMonitor();
    const metricsCollector = getMetricsCollector();
    const alertManager = getAlertManager();

    // Perform health check
    const healthSummary = await healthMonitor.performHealthCheck();
    
    // Get additional data if detailed
    let additionalData: any = {};
    
    if (detailed) {
      additionalData = {
        metrics: {
          current: metricsCollector.getCurrentMetrics(),
          apiEndpoints: metricsCollector.getAPIEndpointStats()
        },
        alerts: {
          active: alertManager.getActiveAlerts(),
          stats: alertManager.getAlertStats()
        },
        trends: healthMonitor.getHealthTrends()
      };
    }

    if (includeHistory) {
      additionalData.healthHistory = healthMonitor.getHealthHistory(limit);
    }

    return NextResponse.json({
      success: true,
      health: healthSummary,
      ...additionalData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Production health check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST /api/health/production - Manage health monitoring
export async function POST(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse;
    }

    const body = await request.json();
    const { action } = body;

    const healthMonitor = getHealthMonitor();

    switch (action) {
      case 'start-monitoring':
        const { interval = 60000 } = body;
        healthMonitor.startMonitoring(interval);
        return NextResponse.json({
          success: true,
          message: 'Health monitoring started'
        });

      case 'stop-monitoring':
        healthMonitor.stopMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Health monitoring stopped'
        });

      case 'force-check':
        const healthSummary = await healthMonitor.performHealthCheck();
        return NextResponse.json({
          success: true,
          health: healthSummary
        });

      case 'export-data':
        const data = healthMonitor.exportHealthData();
        return NextResponse.json({
          success: true,
          data
        });

      case 'get-trends':
        const trends = healthMonitor.getHealthTrends();
        return NextResponse.json({
          success: true,
          trends
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Health monitoring action failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Action failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
