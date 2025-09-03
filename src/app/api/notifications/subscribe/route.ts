import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { auditLogger } from '@/lib/audit/auditLogger';

// POST /api/notifications/subscribe - Subscribe to push notifications
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { subscription, userId } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Store subscription in database (mock implementation)
    const subscriptionData = {
      id: crypto.randomUUID(),
      userId: userId || user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: subscription.userAgent || request.headers.get('user-agent'),
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // In a real implementation, you would store this in your database
    console.log('Storing push subscription:', subscriptionData);

    // Log subscription
    await auditLogger.logUserAction('push_notification_subscribed', {
      subscriptionId: subscriptionData.id,
      endpoint: subscription.endpoint
    }, user.id);

    return NextResponse.json({
      success: true,
      subscriptionId: subscriptionData.id,
      message: 'Successfully subscribed to push notifications'
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
