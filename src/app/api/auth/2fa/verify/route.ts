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

    // Verify the 2FA token
    const verification = await twoFactorAuth.verifyToken(user.id, token);

    if (!verification.success) {
      return NextResponse.json({
        success: false,
        error: verification.error
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: '2FA verification successful',
      backupCodeUsed: verification.backupCodeUsed
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json({
      success: false,
      error: '2FA verification failed. Please try again.'
    }, { status: 500 });
  }
});
