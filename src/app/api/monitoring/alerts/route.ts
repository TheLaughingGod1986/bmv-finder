import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { monitoringManager } from '@/lib/monitoring/monitoringManager';

// GET /api/monitoring/alerts - Get alerts
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    let alerts = monitoringManager.getAllAlerts();

    if (status) {
      alerts = alerts.filter(alert => alert.status === status);
    }

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    return NextResponse.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/monitoring/alerts - Acknowledge or resolve alert
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { alertId, action, acknowledgedBy } = await request.json();

    if (!alertId || !action) {
      return NextResponse.json(
        { error: 'alertId and action are required' },
        { status: 400 }
      );
    }

    let success = false;

    switch (action) {
      case 'acknowledge':
        if (!acknowledgedBy) {
          return NextResponse.json(
            { error: 'acknowledgedBy is required for acknowledge action' },
            { status: 400 }
          );
        }
        success = await monitoringManager.acknowledgeAlert(alertId, acknowledgedBy);
        break;
      case 'resolve':
        success = await monitoringManager.resolveAlert(alertId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be acknowledge or resolve' },
          { status: 400 }
        );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Alert ${action}d successfully`
    });
  } catch (error) {
    console.error('Error processing alert action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});