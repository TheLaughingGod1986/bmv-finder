import { NextRequest, NextResponse } from 'next/server';
import { twoFactorAuth } from '@/lib/auth/twoFactorAuth';
import { requireAuth } from '@/middleware/auth';

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({
        success: false,
        error: 'Password is required to disable 2FA'
      }, { status: 400 });
    }

    // Disable 2FA
    const result = await twoFactorAuth.disableTwoFactor(user.id, password);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: '2FA has been disabled successfully'
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to disable 2FA. Please try again.'
    }, { status: 500 });
  }
});
