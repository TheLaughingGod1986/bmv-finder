import { NextRequest, NextResponse } from 'next/server';
// Helper functions for sending notifications (moved inline to avoid circular imports)
let notificationStreams: Map<string, any> = new Map();

function sendNotificationToUser(userId: string, notification: any) {
  const userStream = notificationStreams.get(userId);
  if (!userStream) return;

  try {
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify(notification)}\n\n`;
    userStream.controller.enqueue(encoder.encode(message));
    userStream.lastActivity = Date.now();
  } catch (error) {
    console.error('Failed to send notification to user:', error);
    notificationStreams.delete(userId);
  }
}

function broadcastNotification(notification: any) {
  notificationStreams.forEach((userStream, userId) => {
    try {
      const encoder = new TextEncoder();
      const message = `data: ${JSON.stringify(notification)}\n\n`;
      userStream.controller.enqueue(encoder.encode(message));
      userStream.lastActivity = Date.now();
    } catch (error) {
      console.error(`Failed to send notification to user ${userId}:`, error);
      notificationStreams.delete(userId);
    }
  });
}

interface NotificationPayload {
  id: string;
  type: 'property_alert' | 'market_update' | 'system_alert' | 'portfolio_update' | 'price_drop' | 'new_listing';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: number;
  read: boolean;
  userId?: string;
  channels: Array<{
    type: 'push' | 'email' | 'sms' | 'in_app' | 'webhook';
    enabled: boolean;
    config?: any;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const notification: NotificationPayload = await request.json();

    // Validate notification payload
    if (!notification.id || !notification.type || !notification.title || !notification.message) {
      return NextResponse.json(
        { error: 'Invalid notification payload' },
        { status: 400 }
      );
    }

    // Log notification
    console.log(`📢 Sending notification: ${notification.type} - ${notification.title}`);

    // Send to specific user if userId provided
    if (notification.userId) {
      sendNotificationToUser(notification.userId, notification);
    } else {
      // Broadcast to all connected users
      broadcastNotification(notification);
    }

    // Handle different notification channels
    await handleNotificationChannels(notification);

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// Handle different notification channels
async function handleNotificationChannels(notification: NotificationPayload) {
  for (const channel of notification.channels) {
    if (!channel.enabled) continue;

    try {
      switch (channel.type) {
        case 'email':
          await sendEmailNotification(notification, channel.config);
          break;
        case 'sms':
          await sendSMSNotification(notification, channel.config);
          break;
        case 'webhook':
          await sendWebhookNotification(notification, channel.config);
          break;
        case 'push':
          // Push notifications are handled by the service worker
          await sendPushNotification(notification, channel.config);
          break;
        case 'in_app':
          // In-app notifications are handled by the SSE stream
          break;
      }
    } catch (error) {
      console.error(`Failed to send ${channel.type} notification:`, error);
    }
  }
}

// Send email notification
async function sendEmailNotification(notification: NotificationPayload, config?: any) {
  // This would integrate with an email service like SendGrid, AWS SES, etc.
  console.log(`📧 Email notification: ${notification.title}`);
  
  // Example implementation:
  // await emailService.send({
  //   to: config?.email || notification.userId,
  //   subject: notification.title,
  //   body: notification.message,
  //   template: notification.type
  // });
}

// Send SMS notification
async function sendSMSNotification(notification: NotificationPayload, config?: any) {
  // This would integrate with an SMS service like Twilio, AWS SNS, etc.
  console.log(`📱 SMS notification: ${notification.title}`);
  
  // Example implementation:
  // await smsService.send({
  //   to: config?.phone,
  //   message: `${notification.title}: ${notification.message}`
  // });
}

// Send webhook notification
async function sendWebhookNotification(notification: NotificationPayload, config?: any) {
  if (!config?.url) return;

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify({
        notification,
        timestamp: new Date().toISOString(),
        source: 'bmv-finder'
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    console.log(`🔗 Webhook notification sent to ${config.url}`);
  } catch (error) {
    console.error('Webhook notification failed:', error);
  }
}

// Send push notification
async function sendPushNotification(notification: NotificationPayload, config?: any) {
  // This would integrate with a push notification service like Firebase, OneSignal, etc.
  console.log(`🔔 Push notification: ${notification.title}`);
  
  // Example implementation:
  // await pushService.send({
  //   to: notification.userId,
  //   title: notification.title,
  //   body: notification.message,
  //   data: notification.data,
  //   priority: notification.priority
  // });
}

// Get notification statistics
export async function GET() {
  try {
    const stats = {
      activeConnections: global.notificationStreams?.size || 0,
      totalNotifications: 0, // This would come from a database
      notificationsByType: {
        property_alert: 0,
        market_update: 0,
        system_alert: 0,
        portfolio_update: 0,
        price_drop: 0,
        new_listing: 0
      }
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return NextResponse.json(
      { error: 'Failed to get notification stats' },
      { status: 500 }
    );
  }
}
