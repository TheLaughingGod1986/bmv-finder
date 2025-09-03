import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/audit/auditLogger';
import { userManager } from '@/lib/auth/userManager';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

// GET /api/admin/audit-logs - Get audit logs (Admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const hasPermission = await userManager.hasPermission(user.id, 'system', 'admin');
    if (!hasPermission) {
      await auditLogger.logPermissionDenied(user.id, 'audit_logs', 'read');
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      resource: searchParams.get('resource') || undefined,
      category: searchParams.get('category') || undefined,
      severity: searchParams.get('severity') || undefined,
      outcome: searchParams.get('outcome') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    const logs = await auditLogger.getAuditLogs(query);

    // Log admin access to audit logs
    await auditLogger.logDataAccess(user.id, 'audit_logs', 'all', 'read', {
      query: Object.keys(query).filter(key => query[key as keyof typeof query] !== undefined)
    });

    return NextResponse.json({
      logs,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: logs.length
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/audit-logs/stats - Get audit statistics
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const hasPermission = await userManager.hasPermission(user.id, 'system', 'admin');
    if (!hasPermission) {
      await auditLogger.logPermissionDenied(user.id, 'audit_stats', 'read');
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { timeframe = 'day' } = await request.json();
    const stats = await auditLogger.getAuditStats(timeframe);

    // Log admin access to audit stats
    await auditLogger.logDataAccess(user.id, 'audit_stats', 'all', 'read', { timeframe });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
