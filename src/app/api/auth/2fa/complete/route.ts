import { NextRequest, NextResponse } from 'next/server';
import { productionAuth } from '@/lib/auth/productionAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tempToken, twoFactorCode } = body;

    if (!tempToken || !twoFactorCode) {
      return NextResponse.json({
        success: false,
        error: 'Temporary token and 2FA code are required'
      }, { status: 400 });
    }

    // Complete 2FA verification
    const result = await productionAuth.complete2FAVerification(tempToken, twoFactorCode);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: '2FA verification completed successfully',
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
        tier: result.user!.tier,
        role: result.user!.role,
        preferences: result.user!.preferences,
        lastLoginAt: result.user!.lastLoginAt
      },
      token: result.token
    });

  } catch (error) {
    console.error('2FA completion error:', error);
    return NextResponse.json({
      success: false,
      error: '2FA verification failed. Please try again.'
    }, { status: 500 });
  }
}
