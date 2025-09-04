import { NextRequest, NextResponse } from 'next/server';
import { pushNotificationService } from '@/lib/mobile/pushNotificationService';
import { requireAuth } from '@/middleware/auth';

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { subscription, payload, userId } = body;

    if (!subscription || !payload || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: subscription, payload, userId'
      }, { status: 400 });
    }

    // Send notification
    const success = await pushNotificationService.sendNotification(userId, payload);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send notification'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send notification'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });