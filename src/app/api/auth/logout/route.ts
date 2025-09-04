import { NextRequest, NextResponse } from 'next/server';
import { productionAuth } from '@/lib/auth/productionAuth';
import { requireAuth } from '@/middleware/auth';

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Logout user
    const success = await productionAuth.logoutUser(user.id);

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Logout failed'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({
      success: false,
      error: 'Logout failed. Please try again.'
    }, { status: 500 });
  }
});
