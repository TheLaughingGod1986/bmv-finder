import { NextRequest, NextResponse } from 'next/server';
import { twoFactorAuth } from '@/lib/auth/twoFactorAuth';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Get 2FA status
    const status = await twoFactorAuth.getTwoFactorStatus(user.id);

    return NextResponse.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get 2FA status'
    }, { status: 500 });
  }
});
