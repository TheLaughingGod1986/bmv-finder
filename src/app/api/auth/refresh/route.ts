import { NextRequest, NextResponse } from 'next/server';
import { productionAuth } from '@/lib/auth/productionAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token is required'
      }, { status: 400 });
    }

    // Refresh token
    const result = await productionAuth.refreshToken(token);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
        tier: result.user!.tier,
        role: result.user!.role,
        preferences: result.user!.preferences
      },
      token: result.token
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({
      success: false,
      error: 'Token refresh failed'
    }, { status: 500 });
  }
}
