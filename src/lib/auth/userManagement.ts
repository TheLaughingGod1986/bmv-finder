import { userManager, UserProfile } from './userManager';
import { USER_ROLES, UserRole, hasPermission, getRoleById } from './userRoles';
import { auditLogger } from '../audit/auditLogger';

export interface UserManagementResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

export interface UserSearchFilters {
  role?: string;
  tier?: string;
  isActive?: boolean;
  searchTerm?: string;
  createdAfter?: string;
  createdBefore?: string;
  lastLoginAfter?: string;
  lastLoginBefore?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
  usersByTier: Record<string, number>;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  averageSessionDuration: number;
  topActiveUsers: Array<{
    userId: string;
    email: string;
    name: string;
    lastLoginAt: string;
    sessionCount: number;
  }>;
}

export class UserManagementService {
  private static instance: UserManagementService;

  public static getInstance(): UserManagementService {
    if (!UserManagementService.instance) {
      UserManagementService.instance = new UserManagementService();
    }
    return UserManagementService.instance;
  }

  // Get user with role information
  public async getUserWithRole(userId: string): Promise<UserProfile | null> {
    try {
      const user = await userManager.getUserProfile(userId);
      if (!user) return null;

      // Ensure user has a valid role
      if (!user.role || !getRoleById(user.role.id)) {
        // Assign default free role if invalid
        await this.updateUserRole(userId, 'free');
        user.role = USER_ROLES.free;
      }

      return user;
    } catch (error) {
      console.error('Error getting user with role:', error);
      return null;
    }
  }

  // Update user role
  public async updateUserRole(userId: string, newRoleId: string, adminUserId?: string): Promise<UserManagementResult> {
    try {
      const user = await userManager.getUserProfile(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const newRole = getRoleById(newRoleId);
      if (!newRole) {
        return { success: false, error: 'Invalid role' };
      }

      const oldRole = user.role;

      // Update user profile with new role
      const updatedUser = await userManager.updateUserProfile(userId, {
        role: newRole,
        tier: newRole.tier,
        updatedAt: new Date().toISOString(),
        metadata: {
          ...user.metadata,
          roleChangedAt: new Date().toISOString(),
          roleChangedBy: adminUserId || 'system'
        }
      });

      // Log role change
      await auditLogger.logUserAction(adminUserId || userId, 'user_role_changed', {
        targetUserId: userId,
        oldRole: oldRole.id,
        newRole: newRole.id,
        timestamp: new Date().toISOString()
      });

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { success: false, error: 'Failed to update user role' };
    }
  }

  // Search users with filters
  public async searchUsers(filters: UserSearchFilters, limit: number = 50, offset: number = 0): Promise<{
    users: UserProfile[];
    total: number;
  }> {
    try {
      // In a real implementation, this would query the database with proper filters
      // For now, we'll simulate the search
      const allUsers = await this.getAllUsers();
      
      let filteredUsers = allUsers;

      // Apply filters
      if (filters.role) {
        filteredUsers = filteredUsers.filter(user => user.role.id === filters.role);
      }

      if (filters.tier) {
        filteredUsers = filteredUsers.filter(user => user.tier === filters.tier);
      }

      if (filters.isActive !== undefined) {
        filteredUsers = filteredUsers.filter(user => user.isActive === filters.isActive);
      }

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.email.toLowerCase().includes(searchLower) ||
          user.name.toLowerCase().includes(searchLower)
        );
      }

      if (filters.createdAfter) {
        const afterDate = new Date(filters.createdAfter);
        filteredUsers = filteredUsers.filter(user => 
          new Date(user.createdAt) >= afterDate
        );
      }

      if (filters.createdBefore) {
        const beforeDate = new Date(filters.createdBefore);
        filteredUsers = filteredUsers.filter(user => 
          new Date(user.createdAt) <= beforeDate
        );
      }

      if (filters.lastLoginAfter) {
        const afterDate = new Date(filters.lastLoginAfter);
        filteredUsers = filteredUsers.filter(user => 
          user.lastLoginAt && new Date(user.lastLoginAt) >= afterDate
        );
      }

      if (filters.lastLoginBefore) {
        const beforeDate = new Date(filters.lastLoginBefore);
        filteredUsers = filteredUsers.filter(user => 
          user.lastLoginAt && new Date(user.lastLoginAt) <= beforeDate
        );
      }

      // Apply pagination
      const total = filteredUsers.length;
      const users = filteredUsers.slice(offset, offset + limit);

      return { users, total };
    } catch (error) {
      console.error('Error searching users:', error);
      return { users: [], total: 0 };
    }
  }

  // Get all users (admin only)
  public async getAllUsers(): Promise<UserProfile[]> {
    try {
      // In a real implementation, this would query the database
      // For now, we'll return an empty array as we don't have a real user database
      return [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Get user statistics
  public async getUserStats(): Promise<UserStats> {
    try {
      const allUsers = await this.getAllUsers();
      
      const stats: UserStats = {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(user => user.isActive).length,
        usersByRole: {},
        usersByTier: {},
        newUsersThisMonth: 0,
        newUsersThisWeek: 0,
        averageSessionDuration: 0,
        topActiveUsers: []
      };

      // Calculate role and tier distributions
      allUsers.forEach(user => {
        stats.usersByRole[user.role.id] = (stats.usersByRole[user.role.id] || 0) + 1;
        stats.usersByTier[user.tier] = (stats.usersByTier[user.tier] || 0) + 1;
      });

      // Calculate new users
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      stats.newUsersThisMonth = allUsers.filter(user => 
        new Date(user.createdAt) >= monthAgo
      ).length;

      stats.newUsersThisWeek = allUsers.filter(user => 
        new Date(user.createdAt) >= weekAgo
      ).length;

      // Get top active users
      stats.topActiveUsers = allUsers
        .filter(user => user.lastLoginAt)
        .sort((a, b) => new Date(b.lastLoginAt!).getTime() - new Date(a.lastLoginAt!).getTime())
        .slice(0, 10)
        .map(user => ({
          userId: user.id,
          email: user.email,
          name: user.name,
          lastLoginAt: user.lastLoginAt!,
          sessionCount: user.metadata?.sessionCount || 0
        }));

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        usersByRole: {},
        usersByTier: {},
        newUsersThisMonth: 0,
        newUsersThisWeek: 0,
        averageSessionDuration: 0,
        topActiveUsers: []
      };
    }
  }

  // Activate/deactivate user
  public async toggleUserStatus(userId: string, isActive: boolean, adminUserId?: string): Promise<UserManagementResult> {
    try {
      const user = await userManager.getUserProfile(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const updatedUser = await userManager.updateUserProfile(userId, {
        isActive,
        updatedAt: new Date().toISOString(),
        metadata: {
          ...user.metadata,
          statusChangedAt: new Date().toISOString(),
          statusChangedBy: adminUserId || 'system'
        }
      });

      // Log status change
      await auditLogger.logUserAction(adminUserId || userId, 'user_status_changed', {
        targetUserId: userId,
        newStatus: isActive ? 'active' : 'inactive',
        timestamp: new Date().toISOString()
      });

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Error toggling user status:', error);
      return { success: false, error: 'Failed to update user status' };
    }
  }

  // Check if user has permission
  public async userHasPermission(userId: string, permissionId: string): Promise<boolean> {
    try {
      const user = await this.getUserWithRole(userId);
      if (!user) return false;

      return hasPermission(user.role, permissionId);
    } catch (error) {
      console.error('Error checking user permission:', error);
      return false;
    }
  }

  // Get user's usage statistics
  public async getUserUsageStats(userId: string): Promise<{
    searchesUsed: number;
    searchesLimit: number;
    propertiesInWatchlist: number;
    propertiesLimit: number;
    lastSearchAt?: string;
    lastLoginAt?: string;
  }> {
    try {
      const user = await this.getUserWithRole(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const role = user.role;
      const metadata = user.metadata || {};

      return {
        searchesUsed: metadata.searchesUsed || 0,
        searchesLimit: role.maxSearches === -1 ? Infinity : role.maxSearches,
        propertiesInWatchlist: metadata.watchlistCount || 0,
        propertiesLimit: role.maxProperties === -1 ? Infinity : role.maxProperties,
        lastSearchAt: metadata.lastSearchAt,
        lastLoginAt: user.lastLoginAt
      };
    } catch (error) {
      console.error('Error getting user usage stats:', error);
      return {
        searchesUsed: 0,
        searchesLimit: 0,
        propertiesInWatchlist: 0,
        propertiesLimit: 0
      };
    }
  }

  // Update user usage
  public async updateUserUsage(userId: string, usageType: 'search' | 'watchlist', increment: number = 1): Promise<void> {
    try {
      const user = await userManager.getUserProfile(userId);
      if (!user) return;

      const metadata = user.metadata || {};
      const now = new Date().toISOString();

      if (usageType === 'search') {
        metadata.searchesUsed = (metadata.searchesUsed || 0) + increment;
        metadata.lastSearchAt = now;
      } else if (usageType === 'watchlist') {
        metadata.watchlistCount = (metadata.watchlistCount || 0) + increment;
      }

      await userManager.updateUserProfile(userId, {
        metadata,
        updatedAt: now
      });
    } catch (error) {
      console.error('Error updating user usage:', error);
    }
  }

  // Check if user can perform action based on limits
  public async canUserPerformAction(userId: string, actionType: 'search' | 'watchlist'): Promise<boolean> {
    try {
      const usage = await this.getUserUsageStats(userId);
      
      if (actionType === 'search') {
        return usage.searchesUsed < usage.searchesLimit;
      } else if (actionType === 'watchlist') {
        return usage.propertiesInWatchlist < usage.propertiesLimit;
      }

      return false;
    } catch (error) {
      console.error('Error checking user action limits:', error);
      return false;
    }
  }
}

// Export singleton instance
export const userManagement = UserManagementService.getInstance();

