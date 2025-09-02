import { NextRequest, NextResponse } from 'next/server';
import { 
  getDatabaseManager, 
  getDatabasePerformanceMonitor, 
  getDatabaseHealthChecker 
} from '@/lib/database/connectionPool';
import { requireAuth } from '@/lib/auth/middleware';

// GET /api/health/database - Get database health status
export async function GET(request: NextRequest) {
  try {
    // Check authentication (admin only for detailed health info)
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse;
    }

    const dbManager = getDatabaseManager();
    const performanceMonitor = getDatabasePerformanceMonitor();
    const healthChecker = getDatabaseHealthChecker();

    // Perform comprehensive health check
    const healthCheck = await healthChecker.performHealthCheck();
    const performanceReport = performanceMonitor.getPerformanceReport();
    const poolStats = dbManager.getPoolStats();

    return NextResponse.json({
      success: true,
      health: {
        status: healthCheck.status,
        score: healthCheck.score,
        timestamp: new Date().toISOString()
      },
      connectionPool: {
        totalConnections: poolStats.totalCount,
        idleConnections: poolStats.idleCount,
        waitingConnections: poolStats.waitingCount,
        isConnected: poolStats.isConnected
      },
      performance: {
        queryCount: performanceReport.summary.queryCount,
        averageQueryTime: performanceReport.summary.averageQueryTime,
        slowQueries: performanceReport.summary.slowQueries,
        errorCount: performanceReport.summary.errorCount,
        healthScore: performanceReport.healthScore
      },
      checks: healthCheck.checks,
      recommendations: healthCheck.recommendations,
      slowQueries: performanceReport.slowQueries.map(q => ({
        query: q.query.substring(0, 100) + '...',
        duration: q.duration,
        timestamp: q.timestamp,
        error: q.error
      }))
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Database health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/health/database - Perform detailed database analysis
export async function POST(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse;
    }

    const body = await request.json();
    const { action } = body;

    const performanceMonitor = getDatabasePerformanceMonitor();

    switch (action) {
      case 'performance-report':
        const report = performanceMonitor.getPerformanceReport();
        return NextResponse.json({
          success: true,
          report
        });

      case 'slow-queries':
        const { limit = 10 } = body;
        const slowQueries = performanceMonitor.getSlowQueries(limit);
        return NextResponse.json({
          success: true,
          slowQueries: slowQueries.map(q => ({
            query: q.query,
            duration: q.duration,
            timestamp: q.timestamp,
            params: q.params,
            error: q.error
          }))
        });

      case 'query-stats':
        const { pattern } = body;
        const stats = performanceMonitor.getQueryStats(pattern);
        return NextResponse.json({
          success: true,
          stats
        });

      case 'export-data':
        const data = performanceMonitor.exportPerformanceData();
        return NextResponse.json({
          success: true,
          data
        });

      case 'clear-history':
        performanceMonitor.clearHistory();
        return NextResponse.json({
          success: true,
          message: 'Performance history cleared'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Database analysis failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Database analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}