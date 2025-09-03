import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';

// GET /api/notifications/preferences - Get user notification preferences
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Mock preferences - in a real implementation, fetch from database
    const preferences = {
      userId: user.id,
      propertyAlerts: true,
      marketUpdates: true,
      priceChanges: true,
      newListings: true,
      investmentOpportunities: true,
      systemNotifications: true,
      emailNotifications: false,
      smsNotifications: false,
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };

    return NextResponse.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/notifications/preferences - Update user notification preferences
export const PUT = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { preferences } = await request.json();

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences data is required' },
        { status: 400 }
      );
    }

    // In a real implementation, update preferences in database
    console.log('Updating notification preferences for user:', user.id, preferences);

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
