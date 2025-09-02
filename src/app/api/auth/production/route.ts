import { NextRequest, NextResponse } from 'next/server';
import { 
  authService, 
  JWTManager, 
  CookieManager, 
  UserRole,
  Permission 
} from '@/lib/auth/productionAuth';
import { z } from 'zod';

// Request validation schemas
const LoginRequestSchema = z.object({
  action: z.literal('login'),
  email: z.string().email(),
  password: z.string().min(1)
});

const RegisterRequestSchema = z.object({
  action: z.literal('register'),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  acceptTerms: z.boolean().refine(val => val === true)
});

const RefreshRequestSchema = z.object({
  action: z.literal('refresh')
});

const LogoutRequestSchema = z.object({
  action: z.literal('logout')
});

const ValidateRequestSchema = z.object({
  action: z.literal('validate')
});

const UpdatePasswordRequestSchema = z.object({
  action: z.literal('updatePassword'),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const UpdateProfileRequestSchema = z.object({
  action: z.literal('updateProfile'),
  name: z.string().min(2).optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional()
    }).optional(),
    privacy: z.object({
      profileVisibility: z.enum(['public', 'private']).optional(),
      dataSharing: z.boolean().optional()
    }).optional(),
    search: z.object({
      defaultRadius: z.number().min(0.5).max(10).optional(),
      savedSearches: z.boolean().optional()
    }).optional()
  }).optional()
});

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Route based on action
    switch (body.action) {
      case 'login':
        return await handleLogin(body);
      case 'register':
        return await handleRegister(body);
      case 'refresh':
        return await handleRefresh(body);
      case 'logout':
        return await handleLogout(body);
      case 'updatePassword':
        return await handleUpdatePassword(request, body);
      case 'updateProfile':
        return await handleUpdateProfile(request, body);
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'validate':
        return await handleValidate(request);
      case 'profile':
        return await handleGetProfile(request);
      case 'permissions':
        return await handleGetPermissions(request);
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Login handler
async function handleLogin(body: any) {
  try {
    const { email, password } = LoginRequestSchema.parse(body);
    
    const result = await authService.login(email, password);
    
    if (!result.success || !result.user) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Login failed'
      }, { status: 401 });
    }

    // Create tokens
    const accessToken = await JWTManager.createAccessToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      permissions: result.user.permissions
    });

    const refreshToken = await JWTManager.createRefreshToken(result.user.id);

    // Set cookies
    await CookieManager.setAccessToken(accessToken);
    await CookieManager.setRefreshToken(refreshToken);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        permissions: result.user.permissions,
        isEmailVerified: result.user.isEmailVerified,
        subscriptionStatus: result.user.subscriptionStatus,
        preferences: result.user.preferences
      },
      session: {
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: error.errors[0].message
      }, { status: 400 });
    }
    throw error;
  }
}

// Register handler
async function handleRegister(body: any) {
  try {
    const { email, password, name, acceptTerms } = RegisterRequestSchema.parse(body);
    
    const result = await authService.register({
      email,
      password,
      name,
      acceptTerms
    });
    
    if (!result.success || !result.user) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Registration failed'
      }, { status: 400 });
    }

    // Create tokens for new user
    const accessToken = await JWTManager.createAccessToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      permissions: result.user.permissions
    });

    const refreshToken = await JWTManager.createRefreshToken(result.user.id);

    // Set cookies
    await CookieManager.setAccessToken(accessToken);
    await CookieManager.setRefreshToken(refreshToken);

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        permissions: result.user.permissions,
        isEmailVerified: result.user.isEmailVerified,
        subscriptionStatus: result.user.subscriptionStatus,
        preferences: result.user.preferences
      },
      session: {
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: error.errors[0].message
      }, { status: 400 });
    }
    throw error;
  }
}

// Refresh token handler
async function handleRefresh(body: any) {
  try {
    RefreshRequestSchema.parse(body);
    
    const refreshToken = await CookieManager.getRefreshToken();
    if (!refreshToken) {
      return NextResponse.json({
        success: false,
        error: 'No refresh token found'
      }, { status: 401 });
    }

    const result = await authService.refreshToken(refreshToken);
    
    if (!result.success || !result.accessToken) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Token refresh failed'
      }, { status: 401 });
    }

    // Set new access token
    await CookieManager.setAccessToken(result.accessToken);

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: result.accessToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: error.errors[0].message
      }, { status: 400 });
    }
    throw error;
  }
}

// Logout handler
async function handleLogout(body: any) {
  try {
    LogoutRequestSchema.parse(body);
    
    await authService.logout();

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: error.errors[0].message
      }, { status: 400 });
    }
    throw error;
  }
}

// Validate session handler
async function handleValidate(request: NextRequest) {
  try {
    const user = await authService.getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired session'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        isEmailVerified: user.isEmailVerified,
        subscriptionStatus: user.subscriptionStatus,
        preferences: user.preferences
      },
      session: {
        id: user.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Session validation failed'
    }, { status: 500 });
  }
}

// Get profile handler
async function handleGetProfile(request: NextRequest) {
  try {
    const user = await authService.requireAuth(request);
    
    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        profileImage: user.profileImage,
        preferences: user.preferences
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Authentication required'
    }, { status: 401 });
  }
}

// Get permissions handler
async function handleGetPermissions(request: NextRequest) {
  try {
    const user = await authService.requireAuth(request);
    
    return NextResponse.json({
      success: true,
      permissions: user.permissions,
      role: user.role
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Authentication required'
    }, { status: 401 });
  }
}

// Update password handler
async function handleUpdatePassword(request: NextRequest, body: any) {
  try {
    const user = await authService.requireAuth(request);
    const { currentPassword, newPassword, confirmPassword } = UpdatePasswordRequestSchema.parse(body);
    
    // Verify current password
    const userService = (authService as any).userService;
    const userWithPassword = await userService.getUserWithPassword(user.email);
    
    if (!userWithPassword) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const isCurrentPasswordValid = await userService.verifyPassword(currentPassword, userWithPassword.passwordHash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Current password is incorrect'
      }, { status: 400 });
    }

    // Update password
    const success = await userService.updateUserPassword(user.id, newPassword);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update password'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: error.errors[0].message
      }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    throw error;
  }
}

// Update profile handler
async function handleUpdateProfile(request: NextRequest, body: any) {
  try {
    const user = await authService.requireAuth(request);
    const { name, preferences } = UpdateProfileRequestSchema.parse(body);
    
    const updates: any = {};
    if (name) updates.name = name;
    if (preferences) {
      updates.preferences = {
        ...user.preferences,
        ...preferences
      };
    }

    const updatedUser = await (authService as any).userService.updateUser(user.id, updates);
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        permissions: updatedUser.permissions,
        isEmailVerified: updatedUser.isEmailVerified,
        subscriptionStatus: updatedUser.subscriptionStatus,
        preferences: updatedUser.preferences
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: error.errors[0].message
      }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    throw error;
  }
}
