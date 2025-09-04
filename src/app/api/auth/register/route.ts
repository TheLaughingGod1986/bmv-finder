import { NextRequest, NextResponse } from 'next/server';
import { productionAuth } from '@/lib/auth/productionAuth';
import { auditLogger } from '@/lib/audit/auditLogger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, metadata } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json({
        success: false,
        error: 'Email, password, and name are required'
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 8 characters long'
      }, { status: 400 });
    }

    // Validate name
    if (name.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Name must be at least 2 characters long'
      }, { status: 400 });
    }

    // Register user
    const result = await productionAuth.registerUser({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      metadata
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    // Log successful registration
    await auditLogger.logUserAction(result.user!.id, 'user_registration_success', {
      email,
      name,
      timestamp: new Date().toISOString()
    });

    // Return success response (don't include sensitive data)
    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
        tier: result.user!.tier,
        createdAt: result.user!.createdAt
      },
      token: result.token
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Log error
    await auditLogger.logSecurityEvent('registration_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: false,
      error: 'Registration failed. Please try again.'
    }, { status: 500 });
  }
}
