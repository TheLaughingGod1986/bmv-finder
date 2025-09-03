import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { auditLogger } from '@/lib/audit/auditLogger';

// POST /api/notifications/unsubscribe - Unsubscribe from push notifications
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Remove subscription from database (mock implementation)
    console.log('Removing push subscription:', endpoint);

    // Log unsubscription
    await auditLogger.logUserAction('push_notification_unsubscribed', {
      endpoint
    }, user.id);

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
