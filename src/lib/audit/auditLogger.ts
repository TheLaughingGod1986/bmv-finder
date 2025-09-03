import { supabase } from '../supabaseClient';

export interface AuditLog {
  id?: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security';
  outcome: 'success' | 'failure' | 'error';
  metadata?: Record<string, any>;
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  resource?: string;
  category?: string;
  severity?: string;
  outcome?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditLog[] = [];
  private isEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  // Core logging methods
  async log(logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    if (!this.isEnabled) return;

    const auditLog: AuditLog = {
      ...logData,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };

    // Store locally for immediate access
    this.logs.push(auditLog);

    // Store in database if available
    if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
      try {
        await supabase
          .from('audit_logs')
          .insert([auditLog]);
      } catch (error) {
        console.error('Failed to store audit log in database:', error);
      }
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Audit Log:', auditLog);
    }
  }

  // Authentication events
  async logLogin(userId: string, method: string, success: boolean, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'login',
      resource: 'authentication',
      details: { method, ...details },
      severity: success ? 'low' : 'medium',
      category: 'authentication',
      outcome: success ? 'success' : 'failure'
    });
  }

  async logLogout(userId: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'logout',
      resource: 'authentication',
      details,
      severity: 'low',
      category: 'authentication',
      outcome: 'success'
    });
  }

  async logPasswordChange(userId: string, success: boolean, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'password_change',
      resource: 'authentication',
      details,
      severity: 'medium',
      category: 'authentication',
      outcome: success ? 'success' : 'failure'
    });
  }

  // Authorization events
  async logPermissionDenied(userId: string, resource: string, action: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'permission_denied',
      resource,
      details: { attemptedAction: action, ...details },
      severity: 'medium',
      category: 'authorization',
      outcome: 'failure'
    });
  }

  async logRoleChange(userId: string, oldRole: string, newRole: string, changedBy: string): Promise<void> {
    await this.log({
      userId,
      action: 'role_change',
      resource: 'user_profile',
      resourceId: userId,
      details: { oldRole, newRole, changedBy },
      severity: 'high',
      category: 'authorization',
      outcome: 'success'
    });
  }

  // Data access events
  async logDataAccess(userId: string, resource: string, resourceId: string, action: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: `data_${action}`,
      resource,
      resourceId,
      details,
      severity: 'low',
      category: 'data_access',
      outcome: 'success'
    });
  }

  async logDataExport(userId: string, resource: string, recordCount: number, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'data_export',
      resource,
      details: { recordCount, ...details },
      severity: 'medium',
      category: 'data_access',
      outcome: 'success'
    });
  }

  // Data modification events
  async logDataModification(userId: string, resource: string, resourceId: string, action: string, changes: Record<string, any>, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: `data_${action}`,
      resource,
      resourceId,
      details: { changes, ...details },
      severity: 'medium',
      category: 'data_modification',
      outcome: 'success'
    });
  }

  async logDataDeletion(userId: string, resource: string, resourceId: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'data_delete',
      resource,
      resourceId,
      details,
      severity: 'high',
      category: 'data_modification',
      outcome: 'success'
    });
  }

  // System events
  async logSystemEvent(event: string, details: Record<string, any>, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
    await this.log({
      userId: 'system',
      action: event,
      resource: 'system',
      details,
      severity,
      category: 'system',
      outcome: 'success'
    });
  }

  // Security events
  async logSecurityEvent(userId: string, event: string, details: Record<string, any>, severity: 'medium' | 'high' | 'critical' = 'high'): Promise<void> {
    await this.log({
      userId,
      action: event,
      resource: 'security',
      details,
      severity,
      category: 'security',
      outcome: 'success'
    });
  }

  async logSuspiciousActivity(userId: string, activity: string, details: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'suspicious_activity',
      resource: 'security',
      details: { activity, ...details },
      severity: 'critical',
      category: 'security',
      outcome: 'failure'
    });
  }

  // Query methods
  async getAuditLogs(query: AuditQuery = {}): Promise<AuditLog[]> {
    const {
      userId,
      action,
      resource,
      category,
      severity,
      outcome,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = query;

    // Filter local logs first
    let filteredLogs = this.logs.filter(log => {
      if (userId && log.userId !== userId) return false;
      if (action && log.action !== action) return false;
      if (resource && log.resource !== resource) return false;
      if (category && log.category !== category) return false;
      if (severity && log.severity !== severity) return false;
      if (outcome && log.outcome !== outcome) return false;
      if (startDate && log.timestamp < startDate) return false;
      if (endDate && log.timestamp > endDate) return false;
      return true;
    });

    // Sort by timestamp descending
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    return filteredLogs.slice(offset, offset + limit);
  }

  async getAuditLogsByUser(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.getAuditLogs({ userId, limit });
  }

  async getSecurityEvents(limit = 50): Promise<AuditLog[]> {
    return this.getAuditLogs({ category: 'security', limit });
  }

  async getFailedLogins(limit = 50): Promise<AuditLog[]> {
    return this.getAuditLogs({ action: 'login', outcome: 'failure', limit });
  }

  // Analytics methods
  async getAuditStats(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<{
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    byOutcome: Record<string, number>;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }

    const logs = await this.getAuditLogs({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 10000
    });

    const stats = {
      total: logs.length,
      byCategory: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byOutcome: {} as Record<string, number>,
      topActions: [] as Array<{ action: string; count: number }>,
      topUsers: [] as Array<{ userId: string; count: number }>
    };

    const actionCounts = new Map<string, number>();
    const userCounts = new Map<string, number>();

    logs.forEach(log => {
      // Category counts
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
      
      // Severity counts
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
      
      // Outcome counts
      stats.byOutcome[log.outcome] = (stats.byOutcome[log.outcome] || 0) + 1;
      
      // Action counts
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
      
      // User counts
      userCounts.set(log.userId, (userCounts.get(log.userId) || 0) + 1);
    });

    // Convert maps to arrays and sort
    stats.topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    stats.topUsers = Array.from(userCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  // Utility methods
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  clear(): void {
    this.logs = [];
  }

  getLogCount(): number {
    return this.logs.length;
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Helper function to get client info
export function getClientInfo(): { ipAddress?: string; userAgent?: string } {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    userAgent: navigator.userAgent
    // IP address would need to be obtained from server-side
  };
}
