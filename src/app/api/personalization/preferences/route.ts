import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { personalizationManager } from '@/lib/personalization/personalizationManager';

// GET /api/personalization/preferences - Get user preferences
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const preferences = await personalizationManager.getUserPreferences(user.id);

    return NextResponse.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/personalization/preferences - Update user preferences
export const PUT = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const updates = await request.json();
    const preferences = await personalizationManager.updateUserPreferences(user.id, updates);

    return NextResponse.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/personalization/preferences/reset - Reset user preferences
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const preferences = await personalizationManager.resetUserPreferences(user.id);

    return NextResponse.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error resetting user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
