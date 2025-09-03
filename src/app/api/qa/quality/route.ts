import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { qualityAssuranceManager } from '@/lib/qa/qualityAssuranceManager';

// GET /api/qa/quality - Get quality reports
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const reports = qualityAssuranceManager.getQualityReports();
    const stats = qualityAssuranceManager.getQualityStats();

    return NextResponse.json({
      success: true,
      reports,
      stats
    });
  } catch (error) {
    console.error('Error fetching quality reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/qa/quality - Analyze code quality
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const report = await qualityAssuranceManager.analyzeCodeQuality();

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error analyzing code quality:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
