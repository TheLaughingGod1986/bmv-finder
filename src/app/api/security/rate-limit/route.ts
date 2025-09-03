import { NextRequest, NextResponse } from 'next/server';
import { securityManager } from '@/lib/security/securityManager';

// POST /api/security/rate-limit - Check rate limit
export const POST = async (request: NextRequest) => {
  try {
    const { identifier, limit, windowMs } = await request.json();

    if (!identifier) {
      return NextResponse.json(
        { error: 'Identifier is required' },
        { status: 400 }
      );
    }

    const result = await securityManager.checkRateLimit(
      identifier,
      limit,
      windowMs
    );

    return NextResponse.json({
      success: true,
      allowed: result.allowed,
      remaining: result.remaining,
      resetTime: result.resetTime
    });
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
