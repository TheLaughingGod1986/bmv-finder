import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { securityManager } from '@/lib/security/securityManager';

// GET /api/security/threats - Get threat detections
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const severity = searchParams.get('severity') as any;

    const threats = securityManager.getThreatDetections(limit, severity);

    return NextResponse.json({
      success: true,
      threats,
      total: threats.length
    });
  } catch (error) {
    console.error('Error fetching threat detections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
