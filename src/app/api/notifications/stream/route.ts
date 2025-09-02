import { NextRequest } from 'next/server';

// Server-Sent Events endpoint for real-time notifications
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Set up SSE headers
      const encoder = new TextEncoder();
      
      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({
        type: 'connected',
        message: 'Notification stream connected',
        timestamp: Date.now()
      })}\n\n`;
      
      controller.enqueue(encoder.encode(initialMessage));

      // Set up interval to send periodic heartbeats
      const heartbeatInterval = setInterval(() => {
        const heartbeat = `data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now()
        })}\n\n`;
        
        try {
          controller.enqueue(encoder.encode(heartbeat));
        } catch (error) {
          clearInterval(heartbeatInterval);
        }
      }, 30000); // 30 seconds

      // Store the controller for this connection
      if (userId) {
        if (!global.notificationStreams) {
          global.notificationStreams = new Map();
        }
        global.notificationStreams.set(userId, {
          controller,
          heartbeatInterval,
          lastActivity: Date.now()
        });
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        if (userId && global.notificationStreams) {
          global.notificationStreams.delete(userId);
        }
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Helper function to send notification to specific user
export function sendNotificationToUser(userId: string, notification: any) {
  if (!global.notificationStreams) return;

  const userStream = global.notificationStreams.get(userId);
  if (!userStream) return;

  try {
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify(notification)}\n\n`;
    userStream.controller.enqueue(encoder.encode(message));
    userStream.lastActivity = Date.now();
  } catch (error) {
    console.error('Failed to send notification to user:', error);
    // Clean up broken connection
    global.notificationStreams.delete(userId);
  }
}

// Helper function to broadcast notification to all connected users
export function broadcastNotification(notification: any) {
  if (!global.notificationStreams) return;

  global.notificationStreams.forEach((userStream, userId) => {
    try {
      const encoder = new TextEncoder();
      const message = `data: ${JSON.stringify(notification)}\n\n`;
      userStream.controller.enqueue(encoder.encode(message));
      userStream.lastActivity = Date.now();
    } catch (error) {
      console.error(`Failed to send notification to user ${userId}:`, error);
      // Clean up broken connection
      global.notificationStreams.delete(userId);
    }
  });
}

// Clean up inactive connections
setInterval(() => {
  if (!global.notificationStreams) return;

  const now = Date.now();
  const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

  global.notificationStreams.forEach((userStream, userId) => {
    if (now - userStream.lastActivity > inactiveThreshold) {
      console.log(`Cleaning up inactive connection for user ${userId}`);
      clearInterval(userStream.heartbeatInterval);
      global.notificationStreams.delete(userId);
    }
  });
}, 60000); // Check every minute
