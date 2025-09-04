import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { reportBuilder } from '@/lib/reporting/reportBuilder';

// POST /api/reports/export - Export report
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { reportId, options } = await request.json();

    if (!reportId || !options) {
      return NextResponse.json(
        { error: 'reportId and options are required' },
        { status: 400 }
      );
    }

    const exportJob = await reportBuilder.exportReport(reportId, options, user.id);

    return NextResponse.json({
      success: true,
      exportJob
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
