import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Environment variables
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');

// User roles
export enum UserRole {
  ADMIN = 'admin',
  PREMIUM = 'premium',
  BASIC = 'basic',
  TRIAL = 'trial'
}

// User permissions
export enum Permission {
  READ_PROPERTIES = 'read_properties',
  WRITE_PROPERTIES = 'write_properties',
  READ_PORTFOLIO = 'read_portfolio',
  WRITE_PORTFOLIO = 'write_portfolio',
  READ_ANALYTICS = 'read_analytics',
  WRITE_ANALYTICS = 'write_analytics',
  ADMIN_ACCESS = 'admin_access',
  API_ACCESS = 'api_access'
}

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  isEmailVerified: boolean;
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled';
  subscriptionExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  profileImage?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    dataSharing: boolean;
  };
  search: {
    defaultRadius: number;
    savedSearches: boolean;
  };
}

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
}

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
});

const PasswordResetSchema = z.object({
  email: z.string().email('Invalid email address')
});

const PasswordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.READ_PROPERTIES,
    Permission.WRITE_PROPERTIES,
    Permission.READ_PORTFOLIO,
    Permission.WRITE_PORTFOLIO,
    Permission.READ_ANALYTICS,
    Permission.WRITE_ANALYTICS,
    Permission.ADMIN_ACCESS,
    Permission.API_ACCESS
  ],
  [UserRole.PREMIUM]: [
    Permission.READ_PROPERTIES,
    Permission.WRITE_PROPERTIES,
    Permission.READ_PORTFOLIO,
    Permission.WRITE_PORTFOLIO,
    Permission.READ_ANALYTICS,
    Permission.API_ACCESS
  ],
  [UserRole.BASIC]: [
    Permission.READ_PROPERTIES,
    Permission.READ_PORTFOLIO,
    Permission.READ_ANALYTICS
  ],
  [UserRole.TRIAL]: [
    Permission.READ_PROPERTIES,
    Permission.READ_PORTFOLIO
  ]
};

// Password hashing utilities
import bcrypt from 'bcryptjs';

export class PasswordManager {
  private static readonly SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// JWT utilities
export class JWTManager {
  static async createAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(JWT_SECRET);
  }

  static async createRefreshToken(userId: string): Promise<string> {
    return new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_REFRESH_SECRET);
  }

  static async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  static async verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
      return payload as { userId: string };
    } catch (error) {
      return null;
    }
  }
}

// Cookie utilities
export class CookieManager {
  private static readonly COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/'
  };

  static async setAccessToken(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set('access_token', token, {
      ...this.COOKIE_OPTIONS,
      maxAge: 15 * 60 // 15 minutes
    });
  }

  static async setRefreshToken(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set('refresh_token', token, {
      ...this.COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
  }

  static async getAccessToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('access_token')?.value || null;
  }

  static async getRefreshToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('refresh_token')?.value || null;
  }

  static async clearTokens(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');
  }
}

// User service interface
export interface UserService {
  createUser(userData: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
  }): Promise<User>;
  
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  verifyUserEmail(id: string): Promise<boolean>;
  updateUserPassword(id: string, newPassword: string): Promise<boolean>;
  getUserPermissions(userId: string): Promise<Permission[]>;
}

// Mock user service (replace with real database implementation)
export class MockUserService implements UserService {
  private users: Map<string, User & { passwordHash: string }> = new Map();

  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
  }): Promise<User> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const passwordHash = await PasswordManager.hashPassword(userData.password);
    
    const user: User = {
      id,
      email: userData.email,
      name: userData.name,
      role: userData.role || UserRole.TRIAL,
      permissions: ROLE_PERMISSIONS[userData.role || UserRole.TRIAL],
      isEmailVerified: false,
      subscriptionStatus: 'trial',
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        theme: 'auto',
        notifications: {
          email: true,
          push: false,
          sms: false
        },
        privacy: {
          profileVisibility: 'private',
          dataSharing: false
        },
        search: {
          defaultRadius: 1,
          savedSearches: true
        }
      }
    };

    this.users.set(id, { ...user, passwordHash });
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async verifyUserEmail(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    user.isEmailVerified = true;
    user.updatedAt = new Date();
    return true;
  }

  async updateUserPassword(id: string, newPassword: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    user.passwordHash = await PasswordManager.hashPassword(newPassword);
    user.updatedAt = new Date();
    return true;
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = this.users.get(userId);
    if (!user) return [];

    return ROLE_PERMISSIONS[user.role];
  }

  // Helper method to get user with password for authentication
  async getUserWithPassword(email: string): Promise<(User & { passwordHash: string }) | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }
}

// Authentication service
export class ProductionAuthService {
  private userService: UserService;

  constructor(userService: UserService = new MockUserService()) {
    this.userService = userService;
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    acceptTerms: boolean;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Validate input
      const validatedData = RegisterSchema.parse(userData);

      // Check if user already exists
      const existingUser = await this.userService.getUserByEmail(validatedData.email);
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Validate password strength
      const passwordValidation = PasswordManager.validatePasswordStrength(validatedData.password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.errors.join(', ') };
      }

      // Create user
      const user = await this.userService.createUser({
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.name,
        role: UserRole.TRIAL
      });

      return { success: true, user };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Registration failed' };
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Validate input
      const validatedData = LoginSchema.parse({ email, password });

      // Get user with password
      const userService = this.userService as MockUserService;
      const userWithPassword = await userService.getUserWithPassword(validatedData.email);
      
      if (!userWithPassword) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Verify password
      const isPasswordValid = await PasswordManager.verifyPassword(
        validatedData.password,
        userWithPassword.passwordHash
      );

      if (!isPasswordValid) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Update last login
      const { passwordHash, ...user } = userWithPassword;
      await this.userService.updateUser(user.id, { lastLoginAt: new Date() });

      return { success: true, user };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Login failed' };
    }
  }

  async refreshToken(refreshToken: string): Promise<{ success: boolean; accessToken?: string; error?: string }> {
    try {
      const payload = await JWTManager.verifyRefreshToken(refreshToken);
      if (!payload) {
        return { success: false, error: 'Invalid refresh token' };
      }

      const user = await this.userService.getUserById(payload.userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const accessToken = await JWTManager.createAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      });

      return { success: true, accessToken };
    } catch (error) {
      return { success: false, error: 'Token refresh failed' };
    }
  }

  async logout(): Promise<{ success: boolean }> {
    await CookieManager.clearTokens();
    return { success: true };
  }

  async getCurrentUser(request: NextRequest): Promise<User | null> {
    try {
      const accessToken = await CookieManager.getAccessToken();
      if (!accessToken) return null;

      const payload = await JWTManager.verifyAccessToken(accessToken);
      if (!payload) return null;

      const user = await this.userService.getUserById(payload.userId);
      return user;
    } catch (error) {
      return null;
    }
  }

  async hasPermission(user: User, permission: Permission): Promise<boolean> {
    return user.permissions.includes(permission);
  }

  async requireAuth(request: NextRequest): Promise<User> {
    const user = await this.getCurrentUser(request);
    if (!user) {
      throw new Error('Authentication required');
    }
    return user;
  }

  async requirePermission(user: User, permission: Permission): Promise<void> {
    if (!await this.hasPermission(user, permission)) {
      throw new Error(`Permission '${permission}' required`);
    }
  }
}

// Export singleton instance
export const authService = new ProductionAuthService();
