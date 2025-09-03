import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { qualityAssuranceManager } from '@/lib/qa/qualityAssuranceManager';

// GET /api/qa/accessibility - Get accessibility audits
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const audits = qualityAssuranceManager.getAccessibilityAudits();

    return NextResponse.json({
      success: true,
      audits
    });
  } catch (error) {
    console.error('Error fetching accessibility audits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/qa/accessibility - Perform accessibility audit
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const audit = await qualityAssuranceManager.performAccessibilityAudit();

    return NextResponse.json({
      success: true,
      audit
    });
  } catch (error) {
    console.error('Error performing accessibility audit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
