// User Role and Permission System

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'authentication' | 'data_access' | 'admin' | 'billing' | 'analytics' | 'system';
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  tier: 'free' | 'premium' | 'elite' | 'admin';
  maxProperties: number;
  maxSearches: number;
  features: string[];
  pricing?: {
    monthly?: number;
    yearly?: number;
  };
}

// Define all available permissions
export const PERMISSIONS: Record<string, Permission> = {
  // Authentication permissions
  'auth.login': {
    id: 'auth.login',
    name: 'Login',
    description: 'Ability to log into the system',
    category: 'authentication'
  },
  'auth.register': {
    id: 'auth.register',
    name: 'Register',
    description: 'Ability to create new accounts',
    category: 'authentication'
  },
  'auth.2fa': {
    id: 'auth.2fa',
    name: 'Two-Factor Authentication',
    description: 'Ability to use 2FA for enhanced security',
    category: 'authentication'
  },

  // Data access permissions
  'data.search': {
    id: 'data.search',
    name: 'Property Search',
    description: 'Ability to search for properties',
    category: 'data_access'
  },
  'data.advanced_search': {
    id: 'data.advanced_search',
    name: 'Advanced Search',
    description: 'Access to advanced search filters and features',
    category: 'data_access'
  },
  'data.export': {
    id: 'data.export',
    name: 'Data Export',
    description: 'Ability to export search results and data',
    category: 'data_access'
  },
  'data.watchlist': {
    id: 'data.watchlist',
    name: 'Watchlist',
    description: 'Ability to create and manage property watchlists',
    category: 'data_access'
  },
  'data.portfolio': {
    id: 'data.portfolio',
    name: 'Portfolio Management',
    description: 'Ability to manage property portfolios',
    category: 'data_access'
  },
  'data.analytics': {
    id: 'data.analytics',
    name: 'Analytics Access',
    description: 'Access to property analytics and insights',
    category: 'data_access'
  },
  'data.predictions': {
    id: 'data.predictions',
    name: 'Predictions',
    description: 'Access to AI-powered property predictions',
    category: 'data_access'
  },

  // Admin permissions
  'admin.users': {
    id: 'admin.users',
    name: 'User Management',
    description: 'Ability to manage user accounts and roles',
    category: 'admin'
  },
  'admin.system': {
    id: 'admin.system',
    name: 'System Administration',
    description: 'Access to system administration features',
    category: 'admin'
  },
  'admin.analytics': {
    id: 'admin.analytics',
    name: 'System Analytics',
    description: 'Access to system-wide analytics and reports',
    category: 'admin'
  },
  'admin.audit': {
    id: 'admin.audit',
    name: 'Audit Logs',
    description: 'Access to system audit logs and security events',
    category: 'admin'
  },

  // Billing permissions
  'billing.view': {
    id: 'billing.view',
    name: 'View Billing',
    description: 'Ability to view billing information',
    category: 'billing'
  },
  'billing.manage': {
    id: 'billing.manage',
    name: 'Manage Billing',
    description: 'Ability to manage billing and subscriptions',
    category: 'billing'
  },

  // Analytics permissions
  'analytics.basic': {
    id: 'analytics.basic',
    name: 'Basic Analytics',
    description: 'Access to basic analytics and reports',
    category: 'analytics'
  },
  'analytics.advanced': {
    id: 'analytics.advanced',
    name: 'Advanced Analytics',
    description: 'Access to advanced analytics and insights',
    category: 'analytics'
  },
  'analytics.export': {
    id: 'analytics.export',
    name: 'Analytics Export',
    description: 'Ability to export analytics data',
    category: 'analytics'
  },

  // System permissions
  'system.api': {
    id: 'system.api',
    name: 'API Access',
    description: 'Access to system APIs',
    category: 'system'
  },
  'system.webhooks': {
    id: 'system.webhooks',
    name: 'Webhook Management',
    description: 'Ability to manage webhooks and integrations',
    category: 'system'
  }
};

// Define user roles with their permissions
export const USER_ROLES: Record<string, UserRole> = {
  free: {
    id: 'free',
    name: 'Free User',
    description: 'Basic access with limited features',
    tier: 'free',
    permissions: [
      PERMISSIONS['auth.login'],
      PERMISSIONS['auth.register'],
      PERMISSIONS['data.search'],
      PERMISSIONS['data.watchlist'],
      PERMISSIONS['analytics.basic']
    ],
    maxProperties: 5,
    maxSearches: 10,
    features: [
      'Basic property search',
      'Limited watchlist (5 properties)',
      'Basic analytics',
      'Email support'
    ]
  },

  premium: {
    id: 'premium',
    name: 'Premium User',
    description: 'Enhanced features with increased limits',
    tier: 'premium',
    permissions: [
      PERMISSIONS['auth.login'],
      PERMISSIONS['auth.register'],
      PERMISSIONS['auth.2fa'],
      PERMISSIONS['data.search'],
      PERMISSIONS['data.advanced_search'],
      PERMISSIONS['data.export'],
      PERMISSIONS['data.watchlist'],
      PERMISSIONS['data.portfolio'],
      PERMISSIONS['data.analytics'],
      PERMISSIONS['data.predictions'],
      PERMISSIONS['billing.view'],
      PERMISSIONS['analytics.advanced'],
      PERMISSIONS['analytics.export'],
      PERMISSIONS['system.api']
    ],
    maxProperties: 50,
    maxSearches: 100,
    features: [
      'Advanced property search',
      'Extended watchlist (50 properties)',
      'Portfolio management',
      'Advanced analytics',
      'AI predictions',
      'Data export',
      'API access',
      'Priority support'
    ],
    pricing: {
      monthly: 29,
      yearly: 290
    }
  },

  elite: {
    id: 'elite',
    name: 'Elite User',
    description: 'Full access with premium features',
    tier: 'elite',
    permissions: [
      PERMISSIONS['auth.login'],
      PERMISSIONS['auth.register'],
      PERMISSIONS['auth.2fa'],
      PERMISSIONS['data.search'],
      PERMISSIONS['data.advanced_search'],
      PERMISSIONS['data.export'],
      PERMISSIONS['data.watchlist'],
      PERMISSIONS['data.portfolio'],
      PERMISSIONS['data.analytics'],
      PERMISSIONS['data.predictions'],
      PERMISSIONS['billing.view'],
      PERMISSIONS['billing.manage'],
      PERMISSIONS['analytics.advanced'],
      PERMISSIONS['analytics.export'],
      PERMISSIONS['system.api'],
      PERMISSIONS['system.webhooks']
    ],
    maxProperties: 200,
    maxSearches: 500,
    features: [
      'Unlimited property search',
      'Large watchlist (200 properties)',
      'Advanced portfolio management',
      'Premium analytics',
      'AI predictions',
      'Bulk data export',
      'API access',
      'Webhook integrations',
      'Dedicated support'
    ],
    pricing: {
      monthly: 79,
      yearly: 790
    }
  },

  admin: {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access and administration',
    tier: 'admin',
    permissions: Object.values(PERMISSIONS),
    maxProperties: -1, // Unlimited
    maxSearches: -1, // Unlimited
    features: [
      'Full system access',
      'User management',
      'System administration',
      'Audit logs access',
      'System analytics',
      'All premium features'
    ]
  }
};

// Helper functions
export function getRoleById(roleId: string): UserRole | null {
  return USER_ROLES[roleId] || null;
}

export function getPermissionById(permissionId: string): Permission | null {
  return PERMISSIONS[permissionId] || null;
}

export function hasPermission(userRole: UserRole, permissionId: string): boolean {
  return userRole.permissions.some(permission => permission.id === permissionId);
}

export function hasAnyPermission(userRole: UserRole, permissionIds: string[]): boolean {
  return permissionIds.some(permissionId => hasPermission(userRole, permissionId));
}

export function hasAllPermissions(userRole: UserRole, permissionIds: string[]): boolean {
  return permissionIds.every(permissionId => hasPermission(userRole, permissionId));
}

export function getPermissionsByCategory(category: Permission['category']): Permission[] {
  return Object.values(PERMISSIONS).filter(permission => permission.category === category);
}

export function getRolesByTier(tier: UserRole['tier']): UserRole[] {
  return Object.values(USER_ROLES).filter(role => role.tier === tier);
}

export function canUpgrade(fromRole: UserRole, toRole: UserRole): boolean {
  const tierOrder = ['free', 'premium', 'elite', 'admin'];
  const fromIndex = tierOrder.indexOf(fromRole.tier);
  const toIndex = tierOrder.indexOf(toRole.tier);
  
  return toIndex > fromIndex;
}

export function getUpgradeOptions(currentRole: UserRole): UserRole[] {
  return Object.values(USER_ROLES).filter(role => canUpgrade(currentRole, role));
}

// Role validation
export function validateUserRole(roleId: string): boolean {
  return roleId in USER_ROLES;
}

export function validatePermission(permissionId: string): boolean {
  return permissionId in PERMISSIONS;
}
