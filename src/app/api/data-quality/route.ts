import { NextRequest, NextResponse } from 'next/server';
import { dataQualityMonitor } from '@/lib/dataQualityMonitor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const index = searchParams.get('index') || 'all';
    const detailed = searchParams.get('detailed') === 'true';

    if (index === 'all') {
      // Check all major indices
      const indices = ['recent_sales', 'epc_data', 'properties-enhanced', 'house_price_index', 'rental_prices'];
      const results: Record<string, any> = {};

      for (const idx of indices) {
        try {
          const quality = await dataQualityMonitor.assessDataQuality(idx);
          results[idx] = {
            status: 'healthy',
            quality,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          results[idx] = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          };
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          overall: 'healthy',
          indices: results,
          summary: {
            totalIndices: indices.length,
            healthyIndices: Object.values(results).filter((r: any) => r.status === 'healthy').length,
            errorIndices: Object.values(results).filter((r: any) => r.status === 'error').length
          }
        }
      });
    } else {
      // Check specific index
      const quality = await dataQualityMonitor.assessDataQuality(index);
      
      const response: any = {
        success: true,
        data: {
          index,
          quality,
          timestamp: new Date().toISOString()
        }
      };

      if (detailed) {
        // Add detailed analysis
        response.data.detailed = {
          recommendations: generateQualityRecommendations(quality),
          alerts: generateQualityAlerts(quality),
          trends: await getQualityTrends(index)
        };
      }

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('Data quality check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateQualityRecommendations(quality: any): string[] {
  const recommendations: string[] = [];

  if (!quality.freshness.isFresh) {
    recommendations.push('🕒 Data freshness issue - consider updating data sources or increasing update frequency');
  }

  if (quality.completeness.completenessScore < 0.95) {
    recommendations.push('📊 Data completeness low - review data collection processes and required fields');
  }

  if (quality.accuracy.accuracyScore < 0.98) {
    recommendations.push('✅ Data accuracy concerns - implement additional validation rules');
  }

  if (quality.consistency.consistencyScore < 0.99) {
    recommendations.push('🔄 Data consistency issues - review for duplicate records and data normalization');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Data quality is excellent - no immediate actions required');
  }

  return recommendations;
}

function generateQualityAlerts(quality: any): Array<{type: string, message: string, severity: string}> {
  const alerts: Array<{type: string, message: string, severity: string}> = [];

  if (!quality.freshness.isFresh) {
    alerts.push({
      type: 'freshness',
      message: `Data is ${quality.freshness.ageInHours} hours old`,
      severity: quality.freshness.ageInHours > 48 ? 'critical' : 'warning'
    });
  }

  if (quality.completeness.completenessScore < 0.9) {
    alerts.push({
      type: 'completeness',
      message: `Completeness score: ${(quality.completeness.completenessScore * 100).toFixed(1)}%`,
      severity: 'critical'
    });
  }

  if (quality.accuracy.accuracyScore < 0.95) {
    alerts.push({
      type: 'accuracy',
      message: `Accuracy score: ${(quality.accuracy.accuracyScore * 100).toFixed(1)}%`,
      severity: 'warning'
    });
  }

  return alerts;
}

async function getQualityTrends(index: string): Promise<any> {
  // Placeholder for trend analysis
  return {
    trend: 'stable',
    lastWeek: { score: 0.95, trend: 'improving' },
    lastMonth: { score: 0.93, trend: 'stable' }
  };
}
