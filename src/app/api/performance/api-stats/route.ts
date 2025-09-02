import { NextRequest, NextResponse } from 'next/server';
import { apiPerformanceMonitor } from '@/lib/apiPerformanceMonitor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange');
    const detailed = searchParams.get('detailed') === 'true';

    let timeFilter: { start: number; end: number } | undefined;

    if (timeRange) {
      const now = Date.now();
      switch (timeRange) {
        case '1h':
          timeFilter = { start: now - (60 * 60 * 1000), end: now };
          break;
        case '24h':
          timeFilter = { start: now - (24 * 60 * 60 * 1000), end: now };
          break;
        case '7d':
          timeFilter = { start: now - (7 * 24 * 60 * 60 * 1000), end: now };
          break;
        case '30d':
          timeFilter = { start: now - (30 * 24 * 60 * 60 * 1000), end: now };
          break;
      }
    }

    const stats = apiPerformanceMonitor.getPerformanceStats(timeFilter);
    const health = apiPerformanceMonitor.getHealthStatus();

    const response: any = {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        timeRange: timeRange || 'all',
        health,
        stats
      }
    };

    if (detailed) {
      response.data.detailed = {
        recommendations: generatePerformanceRecommendations(stats, health),
        alerts: generatePerformanceAlerts(stats, health),
        trends: await getPerformanceTrends(timeFilter)
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('API performance stats failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generatePerformanceRecommendations(stats: any, health: any): string[] {
  const recommendations: string[] = [];

  if (stats.avgResponseTime > 1000) {
    recommendations.push('⚡ High response times detected - consider implementing caching or optimizing database queries');
  }

  if (stats.successRate < 98) {
    recommendations.push('🛡️ Low success rate - review error handling and input validation');
  }

  if (stats.slowestEndpoints.length > 0 && stats.slowestEndpoints[0].avgResponseTime > 2000) {
    recommendations.push(`🐌 Slow endpoint detected: ${stats.slowestEndpoints[0].endpoint} - consider optimization`);
  }

  if (stats.recentErrors.length > 10) {
    recommendations.push('🚨 High error frequency - investigate and fix recurring issues');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ API performance is excellent - no immediate optimizations needed');
  }

  return recommendations;
}

function generatePerformanceAlerts(stats: any, health: any): Array<{type: string, message: string, severity: string}> {
  const alerts: Array<{type: string, message: string, severity: string}> = [];

  if (health.score < 50) {
    alerts.push({
      type: 'critical',
      message: `Critical performance issues detected (score: ${health.score})`,
      severity: 'critical'
    });
  } else if (health.score < 80) {
    alerts.push({
      type: 'warning',
      message: `Performance degradation detected (score: ${health.score})`,
      severity: 'warning'
    });
  }

  if (stats.avgResponseTime > 3000) {
    alerts.push({
      type: 'response_time',
      message: `Average response time is ${stats.avgResponseTime}ms`,
      severity: 'critical'
    });
  }

  if (stats.successRate < 90) {
    alerts.push({
      type: 'success_rate',
      message: `Success rate is ${stats.successRate}%`,
      severity: 'critical'
    });
  }

  return alerts;
}

async function getPerformanceTrends(timeFilter?: any): Promise<any> {
  // Placeholder for trend analysis
  return {
    responseTime: { trend: 'stable', change: 0 },
    successRate: { trend: 'improving', change: 2.5 },
    errorRate: { trend: 'stable', change: 0 }
  };
}
