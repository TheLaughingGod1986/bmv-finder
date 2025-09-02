import { NextRequest, NextResponse } from 'next/server';
import { checkElasticsearchHealth } from '@/lib/esClient';
import { dataQualityMonitor } from '@/lib/dataQualityMonitor';
import { apiPerformanceMonitor } from '@/lib/apiPerformanceMonitor';
import { errorHandlingMiddleware } from '@/lib/errorHandlingMiddleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    // Get all health metrics in parallel
    const [
      elasticsearchHealth,
      dataQuality,
      apiPerformance,
      errorStats
    ] = await Promise.allSettled([
      checkElasticsearchHealth(),
      dataQualityMonitor.assessDataQuality('recent_sales'),
      Promise.resolve(apiPerformanceMonitor.getHealthStatus()),
      Promise.resolve(errorHandlingMiddleware.getErrorStats())
    ]);

    // Process results
    const esHealth = elasticsearchHealth.status === 'fulfilled' ? elasticsearchHealth.value : {
      status: 'unhealthy',
      error: 'Failed to check Elasticsearch health'
    };

    const dqHealth = dataQuality.status === 'fulfilled' ? dataQuality.value : {
      freshness: { isFresh: false, ageInHours: 999 },
      completeness: { completenessScore: 0 },
      accuracy: { accuracyScore: 0 },
      consistency: { consistencyScore: 0 }
    };

    const apiHealth = apiPerformance.status === 'fulfilled' ? apiPerformance.value : {
      status: 'unknown',
      score: 0,
      issues: ['Failed to get API performance data']
    };

    const errors = errorStats.status === 'fulfilled' ? errorStats.value : {};

    // Calculate overall system health
    const overallHealth = calculateOverallHealth(esHealth, dqHealth, apiHealth, errors);

    const response: any = {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        overall: overallHealth,
        services: {
          elasticsearch: {
            status: esHealth.status,
            clusterHealth: esHealth.clusterHealth,
            totalDocuments: esHealth.totalDocuments || 0,
            totalIndices: esHealth.totalIndices || 0,
            numberOfNodes: esHealth.numberOfNodes || 0
          },
          dataQuality: {
            freshness: dqHealth.freshness?.isFresh ? 'fresh' : 'stale',
            completeness: Math.round((dqHealth.completeness?.completenessScore || 0) * 100),
            accuracy: Math.round((dqHealth.accuracy?.accuracyScore || 0) * 100),
            consistency: Math.round((dqHealth.consistency?.consistencyScore || 0) * 100)
          },
          apiPerformance: {
            status: apiHealth.status,
            score: apiHealth.score,
            issues: apiHealth.issues || []
          },
          errorHandling: {
            totalErrors: Object.values(errors).reduce((sum: number, count: any) => sum + count, 0),
            errorEndpoints: Object.keys(errors).length
          }
        }
      }
    };

    if (detailed) {
      response.data.detailed = {
        elasticsearch: esHealth,
        dataQuality: dqHealth,
        apiPerformance: apiPerformance.status === 'fulfilled' ? apiPerformance.value : null,
        errorStats: errors,
        recommendations: generateSystemRecommendations(esHealth, dqHealth, apiHealth, errors),
        alerts: generateSystemAlerts(esHealth, dqHealth, apiHealth, errors)
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('System health check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function calculateOverallHealth(esHealth: any, dqHealth: any, apiHealth: any, errors: any): {
  status: string;
  score: number;
  summary: string;
} {
  let score = 100;
  const issues: string[] = [];

  // Elasticsearch health
  if (esHealth.status !== 'healthy') {
    score -= 30;
    issues.push('Elasticsearch is unhealthy');
  }

  // Data quality
  if (!dqHealth.freshness?.isFresh) {
    score -= 15;
    issues.push('Data is stale');
  }

  if ((dqHealth.completeness?.completenessScore || 0) < 0.9) {
    score -= 10;
    issues.push('Data completeness is low');
  }

  // API performance
  if (apiHealth.score < 80) {
    score -= 20;
    issues.push('API performance is degraded');
  }

  // Error handling
  const totalErrors = Object.values(errors).reduce((sum: number, count: any) => sum + count, 0);
  if (totalErrors > 50) {
    score -= 15;
    issues.push('High error rate detected');
  }

  let status = 'healthy';
  if (score < 50) status = 'critical';
  else if (score < 80) status = 'warning';

  let summary = 'All systems operational';
  if (issues.length > 0) {
    summary = `Issues detected: ${issues.join(', ')}`;
  }

  return {
    status,
    score: Math.max(0, score),
    summary
  };
}

function generateSystemRecommendations(esHealth: any, dqHealth: any, apiHealth: any, errors: any): string[] {
  const recommendations: string[] = [];

  if (esHealth.status !== 'healthy') {
    recommendations.push('🔧 Fix Elasticsearch connectivity issues');
  }

  if (!dqHealth.freshness?.isFresh) {
    recommendations.push('🕒 Update data sources to improve freshness');
  }

  if ((dqHealth.completeness?.completenessScore || 0) < 0.9) {
    recommendations.push('📊 Improve data collection processes');
  }

  if (apiHealth.score < 80) {
    recommendations.push('⚡ Optimize API performance and response times');
  }

  const totalErrors = Object.values(errors).reduce((sum: number, count: any) => sum + count, 0);
  if (totalErrors > 50) {
    recommendations.push('🛡️ Review and fix recurring errors');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ System is operating optimally');
  }

  return recommendations;
}

function generateSystemAlerts(esHealth: any, dqHealth: any, apiHealth: any, errors: any): Array<{
  type: string;
  message: string;
  severity: string;
}> {
  const alerts: Array<{type: string, message: string, severity: string}> = [];

  if (esHealth.status !== 'healthy') {
    alerts.push({
      type: 'elasticsearch',
      message: 'Elasticsearch is unhealthy',
      severity: 'critical'
    });
  }

  if (!dqHealth.freshness?.isFresh) {
    alerts.push({
      type: 'data_freshness',
      message: `Data is ${dqHealth.freshness?.ageInHours || 0} hours old`,
      severity: dqHealth.freshness?.ageInHours > 48 ? 'critical' : 'warning'
    });
  }

  if (apiHealth.score < 50) {
    alerts.push({
      type: 'api_performance',
      message: `API performance score: ${apiHealth.score}`,
      severity: 'critical'
    });
  }

  return alerts;
}
