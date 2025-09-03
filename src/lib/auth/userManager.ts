import { supabase } from '../supabaseClient';

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
  description: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  tier: 'free' | 'mid' | 'elite' | 'admin';
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    dataSharing: boolean;
    analytics: boolean;
  };
  display: {
    currency: 'GBP' | 'USD' | 'EUR';
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    timezone: string;
  };
}

// Define system roles
export const SYSTEM_ROLES: UserRole[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access and management capabilities',
    permissions: [
      { id: 'user:read', name: 'Read Users', resource: 'users', action: 'read', description: 'View user information' },
      { id: 'user:write', name: 'Manage Users', resource: 'users', action: 'write', description: 'Create, update, delete users' },
      { id: 'system:admin', name: 'System Administration', resource: 'system', action: 'admin', description: 'Full system administration' },
      { id: 'data:export', name: 'Export Data', resource: 'data', action: 'export', description: 'Export system data' },
      { id: 'analytics:admin', name: 'Analytics Admin', resource: 'analytics', action: 'admin', description: 'Access to all analytics' }
    ]
  },
  {
    id: 'elite',
    name: 'Elite User',
    description: 'Premium user with full feature access',
    permissions: [
      { id: 'property:unlimited', name: 'Unlimited Properties', resource: 'properties', action: 'unlimited', description: 'Unlimited property access' },
      { id: 'analysis:full', name: 'Full Analysis', resource: 'analysis', action: 'full', description: 'Access to all analysis features' },
      { id: 'export:data', name: 'Data Export', resource: 'export', action: 'data', description: 'Export user data' },
      { id: 'api:access', name: 'API Access', resource: 'api', action: 'access', description: 'Access to API endpoints' }
    ]
  },
  {
    id: 'mid',
    name: 'Mid-Tier User',
    description: 'Standard user with enhanced features',
    permissions: [
      { id: 'property:limited', name: 'Limited Properties', resource: 'properties', action: 'limited', description: 'Access to limited properties' },
      { id: 'analysis:basic', name: 'Basic Analysis', resource: 'analysis', action: 'basic', description: 'Basic analysis features' },
      { id: 'export:basic', name: 'Basic Export', resource: 'export', action: 'basic', description: 'Basic data export' }
    ]
  },
  {
    id: 'free',
    name: 'Free User',
    description: 'Basic user with limited features',
    permissions: [
      { id: 'property:basic', name: 'Basic Properties', resource: 'properties', action: 'basic', description: 'Basic property access' },
      { id: 'analysis:demo', name: 'Demo Analysis', resource: 'analysis', action: 'demo', description: 'Demo analysis features' }
    ]
  }
];

export class UserManager {
  private static instance: UserManager;
  private currentUser: UserProfile | null = null;
  private permissions: Map<string, Permission> = new Map();

  private constructor() {
    this.initializePermissions();
  }

  public static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  private initializePermissions(): void {
    SYSTEM_ROLES.forEach(role => {
      role.permissions.forEach(permission => {
        this.permissions.set(permission.id, permission);
      });
    });
  }

  // User Profile Management
  async createUserProfile(userData: Partial<UserProfile>): Promise<UserProfile> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const profile: UserProfile = {
      id: userData.id || '',
      email: userData.email || '',
      name: userData.name || '',
      role: userData.role || SYSTEM_ROLES.find(r => r.id === 'free')!,
      tier: userData.tier || 'free',
      preferences: userData.preferences || this.getDefaultPreferences(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      ...userData
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .insert([profile])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteUserProfile(userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }

  // Role and Permission Management
  async assignRole(userId: string, roleId: string): Promise<void> {
    const role = SYSTEM_ROLES.find(r => r.id === roleId);
    if (!role) {
      throw new Error(`Role ${roleId} not found`);
    }

    await this.updateUserProfile(userId, { role });
  }

  async checkPermission(userId: string, permissionId: string): Promise<boolean> {
    const user = await this.getUserProfile(userId);
    if (!user) return false;

    return user.role.permissions.some(p => p.id === permissionId);
  }

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const user = await this.getUserProfile(userId);
    if (!user) return false;

    return user.role.permissions.some(p => p.resource === resource && p.action === action);
  }

  // User Preferences
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const user = await this.getUserProfile(userId);
    if (!user) throw new Error('User not found');

    const updatedPreferences = { ...user.preferences, ...preferences };
    await this.updateUserProfile(userId, { preferences: updatedPreferences });
  }

  // Session Management
  async updateLastLogin(userId: string): Promise<void> {
    await this.updateUserProfile(userId, { lastLoginAt: new Date().toISOString() });
  }

  async deactivateUser(userId: string): Promise<void> {
    await this.updateUserProfile(userId, { isActive: false });
  }

  async activateUser(userId: string): Promise<void> {
    await this.updateUserProfile(userId, { isActive: true });
  }

  // Utility Methods
  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'system',
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketing: false
      },
      privacy: {
        profileVisibility: 'private',
        dataSharing: false,
        analytics: true
      },
      display: {
        currency: 'GBP',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Europe/London'
      }
    };
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  setCurrentUser(user: UserProfile | null): void {
    this.currentUser = user;
  }

  // Admin Functions
  async getAllUsers(limit = 50, offset = 0): Promise<UserProfile[]> {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data || [];
  }

  async searchUsers(query: string, limit = 20): Promise<UserProfile[]> {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data || [];
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    byTier: Record<string, number>;
    byRole: Record<string, number>;
  }> {
    if (!supabase) {
      return { total: 0, active: 0, byTier: {}, byRole: {} };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('tier, role, isActive');

    if (error) {
      console.error('Error fetching user stats:', error);
      return { total: 0, active: 0, byTier: {}, byRole: {} };
    }

    const stats = {
      total: data.length,
      active: data.filter(u => u.isActive).length,
      byTier: {} as Record<string, number>,
      byRole: {} as Record<string, number>
    };

    data.forEach(user => {
      stats.byTier[user.tier] = (stats.byTier[user.tier] || 0) + 1;
      stats.byRole[user.role.id] = (stats.byRole[user.role.id] || 0) + 1;
    });

    return stats;
  }
}

// Export singleton instance
export const userManager = UserManager.getInstance();
