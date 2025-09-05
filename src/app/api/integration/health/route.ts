import { NextRequest, NextResponse } from 'next/server';
import { systemIntegrationTester } from '@/lib/integration/systemIntegrationTester';
import { productionReadinessAssessor } from '@/lib/integration/productionReadinessAssessor';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Generate system health report
    const healthReport = systemIntegrationTester.generateSystemHealthReport();
    
    // Get performance metrics
    const performanceMetrics = await productionReadinessAssessor.generatePerformanceMetrics();
    
    // Get security assessment
    const securityAssessment = await productionReadinessAssessor.generateSecurityAssessment();
    
    // Get compliance check
    const complianceCheck = await productionReadinessAssessor.generateComplianceCheck();

    const systemHealth = {
      healthReport,
      performanceMetrics,
      securityAssessment,
      complianceCheck,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: systemHealth
    });

  } catch (error) {
    console.error('Error generating system health report:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate system health report'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });
