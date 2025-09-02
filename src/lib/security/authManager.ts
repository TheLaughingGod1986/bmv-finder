// Comprehensive authentication and authorization system

import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { advancedCache } from '../advancedCache';

interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: 'user' | 'admin' | 'moderator';
  permissions: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
  requiresVerification?: boolean;
  requiresMFA?: boolean;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'permission_denied' | 'suspicious_activity';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class AuthManager {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private failedAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();

  constructor() {
    this.initializePermissions();
    this.initializeRoles();
    this.startCleanupTasks();
  }

  // Initialize system permissions
  private initializePermissions(): void {
    const systemPermissions: Permission[] = [
      { id: 'read_properties', name: 'Read Properties', description: 'View property listings', resource: 'properties', action: 'read' },
      { id: 'write_properties', name: 'Write Properties', description: 'Create and edit properties', resource: 'properties', action: 'write' },
      { id: 'delete_properties', name: 'Delete Properties', description: 'Delete properties', resource: 'properties', action: 'delete' },
      { id: 'read_portfolio', name: 'Read Portfolio', description: 'View portfolio data', resource: 'portfolio', action: 'read' },
      { id: 'write_portfolio', name: 'Write Portfolio', description: 'Manage portfolio', resource: 'portfolio', action: 'write' },
      { id: 'read_analytics', name: 'Read Analytics', description: 'View analytics data', resource: 'analytics', action: 'read' },
      { id: 'write_analytics', name: 'Write Analytics', description: 'Manage analytics', resource: 'analytics', action: 'write' },
      { id: 'read_users', name: 'Read Users', description: 'View user data', resource: 'users', action: 'read' },
      { id: 'write_users', name: 'Write Users', description: 'Manage users', resource: 'users', action: 'write' },
      { id: 'admin_access', name: 'Admin Access', description: 'Full administrative access', resource: 'system', action: 'admin' }
    ];

    systemPermissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }

  // Initialize system roles
  private initializeRoles(): void {
    const systemRoles: Role[] = [
      {
        id: 'user',
        name: 'User',
        description: 'Standard user with basic permissions',
        permissions: ['read_properties', 'read_portfolio', 'write_portfolio', 'read_analytics'],
        isSystem: true
      },
      {
        id: 'moderator',
        name: 'Moderator',
        description: 'Moderator with additional permissions',
        permissions: ['read_properties', 'write_properties', 'read_portfolio', 'write_portfolio', 'read_analytics', 'write_analytics', 'read_users'],
        isSystem: true
      },
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full administrative access',
        permissions: ['read_properties', 'write_properties', 'delete_properties', 'read_portfolio', 'write_portfolio', 'read_analytics', 'write_analytics', 'read_users', 'write_users', 'admin_access'],
        isSystem: true
      }
    ];

    systemRoles.forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  // User registration
  async registerUser(userData: {
    email: string;
    password: string;
    role?: string;
    metadata?: Record<string, any>;
  }): Promise<AuthResult> {
    try {
      // Validate email format
      if (!this.isValidEmail(userData.email)) {
        return { success: false, error: 'Invalid email format' };
      }

      // Check if user already exists
      const existingUser = Array.from(this.users.values()).find(u => u.email === userData.email);
      if (existingUser) {
        return { success: false, error: 'User already exists' };
      }

      // Validate password strength
      const passwordValidation = this.validatePassword(userData.password);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error };
      }

      // Generate salt and hash password
      const salt = randomBytes(32).toString('hex');
      const passwordHash = this.hashPassword(userData.password, salt);

      // Create user
      const user: User = {
        id: this.generateUserId(),
        email: userData.email,
        passwordHash,
        salt,
        role: (userData.role as any) || 'user',
        permissions: this.getRolePermissions(userData.role || 'user'),
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: userData.metadata
      };

      this.users.set(user.id, user);

      // Log security event
      this.logSecurityEvent({
        type: 'login',
        userId: user.id,
        details: { action: 'user_registration' },
        severity: 'medium'
      });

      return { success: true, user };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // User authentication
  async authenticateUser(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // Check for brute force attempts
      const bruteForceCheck = this.checkBruteForce(email, ipAddress);
      if (!bruteForceCheck.allowed) {
        this.logSecurityEvent({
          type: 'suspicious_activity',
          ipAddress,
          userAgent,
          details: { reason: 'brute_force_attempt', email },
          severity: 'high'
        });
        return { success: false, error: 'Too many failed attempts. Please try again later.' };
      }

      // Find user
      const user = Array.from(this.users.values()).find(u => u.email === email);
      if (!user) {
        this.recordFailedAttempt(email, ipAddress);
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if user is active
      if (!user.isActive) {
        return { success: false, error: 'Account is deactivated' };
      }

      // Verify password
      const isValidPassword = this.verifyPassword(password, user.passwordHash, user.salt);
      if (!isValidPassword) {
        this.recordFailedAttempt(email, ipAddress);
        this.logSecurityEvent({
          type: 'failed_login',
          userId: user.id,
          ipAddress,
          userAgent,
          details: { email },
          severity: 'medium'
        });
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if email verification is required
      if (!user.isEmailVerified) {
        return { success: false, error: 'Email verification required', requiresVerification: true };
      }

      // Create session
      const session = await this.createSession(user.id, ipAddress, userAgent);

      // Update last login
      user.lastLogin = new Date().toISOString();
      user.updatedAt = new Date().toISOString();
      this.users.set(user.id, user);

      // Clear failed attempts
      this.clearFailedAttempts(email, ipAddress);

      // Log successful login
      this.logSecurityEvent({
        type: 'login',
        userId: user.id,
        ipAddress,
        userAgent,
        details: { email },
        severity: 'low'
      });

      return { success: true, user, session };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Create session
  private async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<Session> {
    const session: Session = {
      id: this.generateSessionId(),
      userId,
      token: this.generateToken(),
      refreshToken: this.generateRefreshToken(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      createdAt: new Date().toISOString(),
      ipAddress,
      userAgent,
      isActive: true
    };

    this.sessions.set(session.id, session);

    // Cache session for quick lookup
    await advancedCache.set(`session:${session.token}`, session, 24 * 60 * 60); // 24 hours

    return session;
  }

  // Validate session
  async validateSession(token: string): Promise<{ valid: boolean; user?: User; session?: Session }> {
    try {
      // Check cache first
      const cachedSession = await advancedCache.get<Session>(`session:${token}`);
      if (cachedSession && cachedSession.isActive && new Date(cachedSession.expiresAt) > new Date()) {
        const user = this.users.get(cachedSession.userId);
        if (user && user.isActive) {
          return { valid: true, user, session: cachedSession };
        }
      }

      // Find session in memory
      const session = Array.from(this.sessions.values()).find(s => s.token === token);
      if (!session || !session.isActive || new Date(session.expiresAt) <= new Date()) {
        return { valid: false };
      }

      const user = this.users.get(session.userId);
      if (!user || !user.isActive) {
        return { valid: false };
      }

      return { valid: true, user, session };

    } catch (error) {
      return { valid: false };
    }
  }

  // Refresh session
  async refreshSession(refreshToken: string): Promise<{ success: boolean; session?: Session; error?: string }> {
    try {
      const session = Array.from(this.sessions.values()).find(s => s.refreshToken === refreshToken);
      if (!session || !session.isActive) {
        return { success: false, error: 'Invalid refresh token' };
      }

      // Create new session
      const newSession = await this.createSession(session.userId, session.ipAddress, session.userAgent);

      // Deactivate old session
      session.isActive = false;
      this.sessions.set(session.id, session);

      return { success: true, session: newSession };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Logout
  async logout(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const session = Array.from(this.sessions.values()).find(s => s.token === token);
      if (session) {
        session.isActive = false;
        this.sessions.set(session.id, session);
        await advancedCache.delete(`session:${token}`);

        this.logSecurityEvent({
          type: 'logout',
          userId: session.userId,
          details: { sessionId: session.id },
          severity: 'low'
        });
      }

      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Check permissions
  hasPermission(user: User, permission: string, resource?: any): boolean {
    // Check if user has the permission
    if (!user.permissions.includes(permission)) {
      return false;
    }

    // Get permission details for additional checks
    const permissionDetails = this.permissions.get(permission);
    if (!permissionDetails) {
      return false;
    }

    // Check conditions if any
    if (permissionDetails.conditions && resource) {
      return this.evaluateConditions(permissionDetails.conditions, resource, user);
    }

    return true;
  }

  // Evaluate permission conditions
  private evaluateConditions(conditions: Record<string, any>, resource: any, user: User): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (key === 'owner' && resource.userId !== user.id) {
        return false;
      }
      if (key === 'role' && !value.includes(user.role)) {
        return false;
      }
      // Add more condition types as needed
    }
    return true;
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Verify current password
      const isValidPassword = this.verifyPassword(currentPassword, user.passwordHash, user.salt);
      if (!isValidPassword) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error };
      }

      // Generate new salt and hash
      const newSalt = randomBytes(32).toString('hex');
      const newPasswordHash = this.hashPassword(newPassword, newSalt);

      // Update user
      user.passwordHash = newPasswordHash;
      user.salt = newSalt;
      user.updatedAt = new Date().toISOString();
      this.users.set(userId, user);

      // Log security event
      this.logSecurityEvent({
        type: 'password_change',
        userId,
        details: { action: 'password_changed' },
        severity: 'medium'
      });

      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Security utilities
  private hashPassword(password: string, salt: string): string {
    return createHash('sha256').update(password + salt).digest('hex');
  }

  private verifyPassword(password: string, hash: string, salt: string): boolean {
    const testHash = this.hashPassword(password, salt);
    return timingSafeEqual(Buffer.from(hash), Buffer.from(testHash));
  }

  private validatePassword(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one number' };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one special character' };
    }
    return { valid: true };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private checkBruteForce(email: string, ipAddress?: string): { allowed: boolean; attempts: number } {
    const key = ipAddress || email;
    const attempts = this.failedAttempts.get(key);
    
    if (!attempts) {
      return { allowed: true, attempts: 0 };
    }

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    const maxAttempts = 5;
    const lockoutTime = 15 * 60 * 1000; // 15 minutes

    if (attempts.count >= maxAttempts && timeSinceLastAttempt < lockoutTime) {
      return { allowed: false, attempts: attempts.count };
    }

    return { allowed: true, attempts: attempts.count };
  }

  private recordFailedAttempt(email: string, ipAddress?: string): void {
    const key = ipAddress || email;
    const attempts = this.failedAttempts.get(key) || { count: 0, lastAttempt: 0 };
    
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.failedAttempts.set(key, attempts);
  }

  private clearFailedAttempts(email: string, ipAddress?: string): void {
    const key = ipAddress || email;
    this.failedAttempts.delete(key);
  }

  private getRolePermissions(roleId: string): string[] {
    const role = this.roles.get(roleId);
    return role ? role.permissions : [];
  }

  private logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date().toISOString()
    };

    this.securityEvents.push(securityEvent);

    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private startCleanupTasks(): void {
    // Clean up expired sessions every hour
    setInterval(() => {
      const now = new Date();
      for (const [id, session] of this.sessions.entries()) {
        if (new Date(session.expiresAt) <= now) {
          session.isActive = false;
          this.sessions.set(id, session);
        }
      }
    }, 60 * 60 * 1000);

    // Clean up old failed attempts every hour
    setInterval(() => {
      const now = Date.now();
      for (const [key, attempts] of this.failedAttempts.entries()) {
        if (now - attempts.lastAttempt > 24 * 60 * 60 * 1000) { // 24 hours
          this.failedAttempts.delete(key);
        }
      }
    }, 60 * 60 * 1000);
  }

  // Public methods
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  updateUser(userId: string, updates: Partial<User>): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
    this.users.set(userId, updatedUser);
    return true;
  }

  deleteUser(userId: string): boolean {
    return this.users.delete(userId);
  }
}

// Singleton instance
export const authManager = new AuthManager();

// Export types
export type { User, Session, Permission, Role, AuthResult, SecurityEvent };
