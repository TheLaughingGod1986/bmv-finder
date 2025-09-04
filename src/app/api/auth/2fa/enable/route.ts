import { NextRequest, NextResponse } from 'next/server';
import { twoFactorAuth } from '@/lib/auth/twoFactorAuth';
import { requireAuth } from '@/middleware/auth';

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Verification token is required'
      }, { status: 400 });
    }

    // Enable 2FA after verification
    const result = await twoFactorAuth.enableTwoFactor(user.id, token);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: '2FA has been enabled successfully'
    });

  } catch (error) {
    console.error('2FA enable error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to enable 2FA. Please try again.'
    }, { status: 500 });
  }
});
