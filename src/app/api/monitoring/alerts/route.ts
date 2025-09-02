import { NextRequest, NextResponse } from 'next/server';
import { 
  getAlertManager, 
  AlertType, 
  AlertSeverity 
} from '@/lib/monitoring/performanceAlerting';
import { requireAuth } from '@/lib/auth/middleware';

// GET /api/monitoring/alerts - Get alerts
export async function GET(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse;
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as AlertType;
    const severity = searchParams.get('severity') as AlertSeverity;
    const limit = parseInt(searchParams.get('limit') || '50');
    const active = searchParams.get('active') === 'true';

    const alertManager = getAlertManager();
    let alerts = alertManager.getAllAlerts(limit);

    // Filter by type
    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }

    // Filter by severity
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    // Filter by active status
    if (active) {
      alerts = alerts.filter(alert => !alert.resolved);
    }

    return NextResponse.json({
      success: true,
      alerts,
      total: alerts.length
    });
  } catch (error) {
    console.error('Failed to get alerts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/monitoring/alerts - Manage alerts
export async function POST(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse;
    }

    const body = await request.json();
    const { action, alertId, acknowledgedBy } = body;

    const alertManager = getAlertManager();

    switch (action) {
      case 'acknowledge':
        if (!alertId || !acknowledgedBy) {
          return NextResponse.json({
            success: false,
            error: 'Alert ID and acknowledgedBy are required'
          }, { status: 400 });
        }

        const acknowledged = alertManager.acknowledgeAlert(alertId, acknowledgedBy);
        if (!acknowledged) {
          return NextResponse.json({
            success: false,
            error: 'Alert not found'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          message: 'Alert acknowledged successfully'
        });

      case 'resolve':
        if (!alertId) {
          return NextResponse.json({
            success: false,
            error: 'Alert ID is required'
          }, { status: 400 });
        }

        const resolved = alertManager.resolveAlert(alertId);
        if (!resolved) {
          return NextResponse.json({
            success: false,
            error: 'Alert not found'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          message: 'Alert resolved successfully'
        });

      case 'clear-old':
        const { olderThanDays = 30 } = body;
        const cleared = alertManager.clearOldAlerts(olderThanDays);
        
        return NextResponse.json({
          success: true,
          message: `${cleared} old alerts cleared`,
          cleared
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Failed to manage alerts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to manage alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
