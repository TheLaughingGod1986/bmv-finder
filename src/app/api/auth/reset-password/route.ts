import { NextRequest, NextResponse } from 'next/server';
import { productionAuth } from '@/lib/auth/productionAuth';
import { auditLogger } from '@/lib/audit/auditLogger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Request password reset
    const result = await productionAuth.resetPassword(email.toLowerCase().trim());

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    // Log password reset request
    await auditLogger.logSecurityEvent('password_reset_requested', {
      email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    
    // Log error
    await auditLogger.logSecurityEvent('password_reset_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: false,
      error: 'Password reset failed. Please try again.'
    }, { status: 500 });
  }
}
