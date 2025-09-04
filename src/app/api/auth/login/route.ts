import { NextRequest, NextResponse } from 'next/server';
import { productionAuth } from '@/lib/auth/productionAuth';
import { auditLogger } from '@/lib/audit/auditLogger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
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

    // Attempt login
    const result = await productionAuth.loginUser(
      email.toLowerCase().trim(),
      password
    );

    if (!result.success) {
      // Log failed login attempt
      await auditLogger.logSecurityEvent('login_attempt_failed', {
        email,
        error: result.error,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 401 });
    }

    // Log successful login
    await auditLogger.logUserAction(result.user!.id, 'user_login_success', {
      email,
      timestamp: new Date().toISOString()
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Login successful',
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
    console.error('Login error:', error);
    
    // Log error
    await auditLogger.logSecurityEvent('login_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: false,
      error: 'Login failed. Please try again.'
    }, { status: 500 });
  }
}