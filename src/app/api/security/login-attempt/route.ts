import { NextRequest, NextResponse } from 'next/server';
import { securityManager } from '@/lib/security/securityManager';

// POST /api/security/login-attempt - Track login attempt
export const POST = async (request: NextRequest) => {
  try {
    const { email, success } = await request.json();

    if (!email || typeof success !== 'boolean') {
      return NextResponse.json(
        { error: 'Email and success status are required' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const result = await securityManager.trackLoginAttempt(
      email,
      ipAddress,
      userAgent,
      success
    );

    return NextResponse.json({
      success: true,
      allowed: result.allowed,
      reason: result.reason,
      lockoutTime: result.lockoutTime
    });
  } catch (error) {
    console.error('Error tracking login attempt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
