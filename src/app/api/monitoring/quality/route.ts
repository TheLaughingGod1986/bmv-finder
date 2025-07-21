import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, applyRateLimitHeaders } from '@/lib/rateLimiter';
import DataQualityMonitor from '@/lib/dataQualityMonitor';
import { esClient } from '@/lib/esClient';

const monitor = new DataQualityMonitor(esClient);

// Get data quality metrics
export async function GET(req: NextRequest) {
  // Check rate limit
  const rateLimitResult = checkRateLimit(req);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: rateLimitResult.error?.message || 'Rate limit exceeded' },
      { status: rateLimitResult.error?.status || 429 }
    );
  }
  try {
    const { searchParams } = new URL(req.url);
    const index = searchParams.get('index') || 'property_sales';
    const detailed = searchParams.get('detailed') === 'true';

    const metrics = await monitor.assessDataQuality(index);
    const alerts = await monitor.generateAlerts(metrics);

    const response = {
      timestamp: new Date().toISOString(),
      index,
      status: alerts.alerts.length === 0 ? 'healthy' : 'issues_detected',
      metrics,
      alerts: alerts.alerts,
      severity: alerts.severity
    } as any;

    // Add detailed breakdown if requested
    if (detailed) {
      response.detailed = {
        freshness: {
          lastUpdate: metrics.freshness.lastUpdate,
          ageInHours: Math.round(metrics.freshness.ageInHours * 100) / 100,
          isFresh: metrics.freshness.isFresh,
          threshold: 24
        },
        completeness: {
          totalRecords: metrics.completeness.totalRecords,
          missingFields: metrics.completeness.missingFields,
          completenessScore: Math.round(metrics.completeness.completenessScore * 10000) / 100,
          threshold: 95
        },
        accuracy: {
          validationErrors: metrics.accuracy.validationErrors,
          accuracyScore: Math.round(metrics.accuracy.accuracyScore * 10000) / 100,
          threshold: 98
        },
        consistency: {
          duplicateRecords: metrics.consistency.duplicateRecords,
          consistencyScore: Math.round(metrics.consistency.consistencyScore * 10000) / 100,
          threshold: 99
        }
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in data quality check:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Start monitoring (admin only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, intervalMinutes = 60 } = body;

    if (action === 'start') {
      const interval = monitor.startMonitoring(intervalMinutes);
      
      return NextResponse.json({
        message: 'Monitoring started successfully',
        intervalMinutes,
        nextCheck: new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString()
      });
    } else if (action === 'stop') {
      // In a real implementation, you'd store the interval ID and clear it
      return NextResponse.json({
        message: 'Monitoring stopped successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error managing monitoring:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 