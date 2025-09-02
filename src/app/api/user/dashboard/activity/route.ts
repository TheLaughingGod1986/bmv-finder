import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserFromRequest } from '@/lib/auth/middleware';

// GET /api/user/dashboard/activity - Get user recent activity
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse;
    }

    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Mock recent activity - in production, these would come from the database
    const activities = [
      {
        id: '1',
        type: 'property_viewed',
        title: 'Viewed Property',
        description: '3-bedroom house in Manchester',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        metadata: {
          propertyId: 'prop_123',
          price: 250000,
          location: 'Manchester'
        }
      },
      {
        id: '2',
        type: 'search_performed',
        title: 'Property Search',
        description: 'Searched for properties in Birmingham under £300k',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        metadata: {
          searchQuery: 'Birmingham properties under £300k',
          resultsCount: 45
        }
      },
      {
        id: '3',
        type: 'watchlist_added',
        title: 'Added to Watchlist',
        description: '2-bedroom flat in Leeds',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        metadata: {
          propertyId: 'prop_456',
          price: 180000,
          location: 'Leeds'
        }
      },
      {
        id: '4',
        type: 'alert_triggered',
        title: 'Price Alert',
        description: 'Property in your watchlist dropped by £5,000',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        metadata: {
          propertyId: 'prop_789',
          oldPrice: 220000,
          newPrice: 215000,
          change: -5000
        }
      },
      {
        id: '5',
        type: 'property_viewed',
        title: 'Viewed Property',
        description: '4-bedroom house in Liverpool',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        metadata: {
          propertyId: 'prop_101',
          price: 320000,
          location: 'Liverpool'
        }
      }
    ];

    return NextResponse.json({
      success: true,
      activity: activities
    });
  } catch (error) {
    console.error('Failed to get dashboard activity:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get dashboard activity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
