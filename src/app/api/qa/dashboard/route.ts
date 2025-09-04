import { NextRequest, NextResponse } from 'next/server';
import { qualityAssuranceManager } from '@/lib/testing/qualityAssurance';
import { testFramework } from '@/lib/testing/testFramework';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Get quality dashboard data
    const qualityDashboard = qualityAssuranceManager.getQualityDashboard();
    
    // Get test framework data
    const testSuites = testFramework.getAllTestSuites();
    const qualityMetrics = testFramework.getQualityMetrics();

    // Combine data for comprehensive dashboard
    const dashboardData = {
      quality: qualityDashboard,
      testing: {
        testSuites: testSuites.map(suite => ({
          id: suite.id,
          name: suite.name,
          status: suite.status,
          summary: suite.summary,
          duration: suite.duration,
        })),
        qualityMetrics,
        isRunning: testFramework.isTestRunning(),
      },
      summary: {
        totalIssues: qualityDashboard.summary.totalIssues,
        openIssues: qualityDashboard.summary.openIssues,
        criticalIssues: qualityDashboard.summary.criticalIssues,
        qualityScore: qualityDashboard.summary.qualityScore,
        testCoverage: qualityMetrics?.testCoverage || 0,
        overallScore: qualityMetrics?.overallScore || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching QA dashboard data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch QA dashboard data'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });
