import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { personalizationManager } from '@/lib/personalization/personalizationManager';

// GET /api/personalization/profile - Get user profile
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const profile = await personalizationManager.getUserProfile(user.id);

    return NextResponse.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/personalization/profile - Update user profile
export const PUT = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const updates = await request.json();
    const profile = await personalizationManager.updateUserProfile(user.id, updates);

    return NextResponse.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
