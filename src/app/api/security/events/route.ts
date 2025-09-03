import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { securityManager } from '@/lib/security/securityManager';

// GET /api/security/events - Get security events
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const severity = searchParams.get('severity') as any;

    const events = securityManager.getSecurityEvents(limit, severity);

    return NextResponse.json({
      success: true,
      events,
      total: events.length
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/security/events - Log security event
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { type, ipAddress, userAgent, details, severity } = await request.json();

    if (!type || !ipAddress || !userAgent) {
      return NextResponse.json(
        { error: 'Type, IP address, and user agent are required' },
        { status: 400 }
      );
    }

    await securityManager.logSecurityEvent(
      type,
      ipAddress,
      userAgent,
      details,
      severity,
      user.id
    );

    return NextResponse.json({
      success: true,
      message: 'Security event logged successfully'
    });
  } catch (error) {
    console.error('Error logging security event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
