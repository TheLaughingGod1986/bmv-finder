import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { qualityAssuranceManager } from '@/lib/qa/qualityAssuranceManager';

// GET /api/qa/security - Get security scans
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const scans = qualityAssuranceManager.getSecurityScans();

    return NextResponse.json({
      success: true,
      scans
    });
  } catch (error) {
    console.error('Error fetching security scans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/qa/security - Perform security scan
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const scan = await qualityAssuranceManager.performSecurityScan();

    return NextResponse.json({
      success: true,
      scan
    });
  } catch (error) {
    console.error('Error performing security scan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
