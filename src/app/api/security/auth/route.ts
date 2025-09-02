import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '@/lib/security/authManager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, userId, currentPassword, newPassword } = body;
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    switch (action) {
      case 'register':
        if (!email || !password) {
          return NextResponse.json({
            success: false,
            error: 'Email and password are required'
          }, { status: 400 });
        }

        const registerResult = await authManager.registerUser({
          email,
          password,
          metadata: { ipAddress, userAgent }
        });

        if (registerResult.success) {
          return NextResponse.json({
            success: true,
            message: 'User registered successfully',
            user: {
              id: registerResult.user!.id,
              email: registerResult.user!.email,
              role: registerResult.user!.role,
              isEmailVerified: registerResult.user!.isEmailVerified
            }
          });
        } else {
          return NextResponse.json({
            success: false,
            error: registerResult.error
          }, { status: 400 });
        }

      case 'login':
        if (!email || !password) {
          return NextResponse.json({
            success: false,
            error: 'Email and password are required'
          }, { status: 400 });
        }

        const loginResult = await authManager.authenticateUser(email, password, ipAddress, userAgent);

        if (loginResult.success) {
          return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: {
              id: loginResult.user!.id,
              email: loginResult.user!.email,
              role: loginResult.user!.role,
              permissions: loginResult.user!.permissions
            },
            session: {
              token: loginResult.session!.token,
              refreshToken: loginResult.session!.refreshToken,
              expiresAt: loginResult.session!.expiresAt
            }
          });
        } else {
          return NextResponse.json({
            success: false,
            error: loginResult.error,
            requiresVerification: loginResult.requiresVerification
          }, { status: 401 });
        }

      case 'refresh':
        const { refreshToken } = body;
        if (!refreshToken) {
          return NextResponse.json({
            success: false,
            error: 'Refresh token is required'
          }, { status: 400 });
        }

        const refreshResult = await authManager.refreshSession(refreshToken);

        if (refreshResult.success) {
          return NextResponse.json({
            success: true,
            message: 'Session refreshed successfully',
            session: {
              token: refreshResult.session!.token,
              refreshToken: refreshResult.session!.refreshToken,
              expiresAt: refreshResult.session!.expiresAt
            }
          });
        } else {
          return NextResponse.json({
            success: false,
            error: refreshResult.error
          }, { status: 401 });
        }

      case 'logout':
        const { token } = body;
        if (!token) {
          return NextResponse.json({
            success: false,
            error: 'Token is required'
          }, { status: 400 });
        }

        const logoutResult = await authManager.logout(token);

        if (logoutResult.success) {
          return NextResponse.json({
            success: true,
            message: 'Logout successful'
          });
        } else {
          return NextResponse.json({
            success: false,
            error: logoutResult.error
          }, { status: 400 });
        }

      case 'change-password':
        if (!userId || !currentPassword || !newPassword) {
          return NextResponse.json({
            success: false,
            error: 'User ID, current password, and new password are required'
          }, { status: 400 });
        }

        const changePasswordResult = await authManager.changePassword(userId, currentPassword, newPassword);

        if (changePasswordResult.success) {
          return NextResponse.json({
            success: true,
            message: 'Password changed successfully'
          });
        } else {
          return NextResponse.json({
            success: false,
            error: changePasswordResult.error
          }, { status: 400 });
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: register, login, refresh, logout, change-password'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Auth API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    switch (action) {
      case 'validate':
        if (!token) {
          return NextResponse.json({
            success: false,
            error: 'Token is required'
          }, { status: 400 });
        }

        const validationResult = await authManager.validateSession(token);

        if (validationResult.valid) {
          return NextResponse.json({
            success: true,
            valid: true,
            user: {
              id: validationResult.user!.id,
              email: validationResult.user!.email,
              role: validationResult.user!.role,
              permissions: validationResult.user!.permissions
            },
            session: {
              id: validationResult.session!.id,
              expiresAt: validationResult.session!.expiresAt
            }
          });
        } else {
          return NextResponse.json({
            success: true,
            valid: false
          });
        }

      case 'security-events':
        const limit = parseInt(searchParams.get('limit') || '100');
        const events = authManager.getSecurityEvents(limit);
        
        return NextResponse.json({
          success: true,
          events,
          count: events.length
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: validate, security-events'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Auth API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
