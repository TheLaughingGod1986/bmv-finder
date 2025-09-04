import { auditLogger } from '../audit/auditLogger';

export interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'suspicious_activity' | 'rate_limit_exceeded' | 'ip_blocked' | 'account_locked' | 'data_breach' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ThreatDetection {
  id: string;
  type: 'brute_force' | 'credential_stuffing' | 'suspicious_pattern' | 'geolocation_anomaly' | 'device_fingerprint' | 'behavioral_anomaly';
  confidence: number; // 0-100
  riskScore: number; // 0-100
  description: string;
  indicators: string[];
  mitigation: string[];
  detectedAt: string;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
}

export interface IPRule {
  id: string;
  ipAddress: string;
  type: 'whitelist' | 'blacklist' | 'rate_limit';
  reason: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  activeThreats: number;
  blockedIPs: number;
  whitelistedIPs: number;
  averageRiskScore: number;
  topThreatTypes: Array<{
    type: string;
    count: number;
    riskScore: number;
  }>;
  recentEvents: SecurityEvent[];
  securityScore: number; // 0-100
}

export interface LoginAttempt {
  id: string;
  userId?: string;
  email?: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  timestamp: string;
  location?: {
    country: string;
    region: string;
    city: string;
    coordinates: [number, number];
  };
  deviceFingerprint?: string;
}

export class SecurityManager {
  private static instance: SecurityManager;
  private loginAttempts: Map<string, LoginAttempt[]> = new Map();
  private ipRules: Map<string, IPRule> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private threatDetections: ThreatDetection[] = [];
  private rateLimitCounters: Map<string, { count: number; resetTime: number }> = new Map();

  // Rate limiting configuration
  private readonly RATE_LIMITS = {
    login: { requests: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    api: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
    search: { requests: 20, window: 60 * 1000 }, // 20 searches per minute
    admin: { requests: 50, window: 60 * 1000 }, // 50 admin requests per minute
  };

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Login attempt tracking
  public async recordLoginAttempt(attempt: Omit<LoginAttempt, 'id' | 'timestamp'>): Promise<LoginAttempt> {
    const loginAttempt: LoginAttempt = {
      id: this.generateId(),
      ...attempt,
      timestamp: new Date().toISOString(),
    };

    // Store attempt
    const key = attempt.ipAddress;
    if (!this.loginAttempts.has(key)) {
      this.loginAttempts.set(key, []);
    }
    this.loginAttempts.get(key)!.push(loginAttempt);

    // Check for threats
    await this.analyzeLoginAttempt(loginAttempt);

    // Log security event if failed
    if (!attempt.success) {
      await this.logSecurityEvent({
        type: 'login_attempt',
        severity: 'medium',
        userId: attempt.userId,
        ipAddress: attempt.ipAddress,
        userAgent: attempt.userAgent,
        details: {
          email: attempt.email,
          failureReason: attempt.failureReason,
          location: attempt.location,
        },
      });
    }

    return loginAttempt;
  }

  // Rate limiting
  public async checkRateLimit(identifier: string, type: keyof typeof SecurityManager.prototype.RATE_LIMITS): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const limit = this.RATE_LIMITS[type];
    const key = `${identifier}:${type}`;
    const now = Date.now();

    // Get or create counter
    let counter = this.rateLimitCounters.get(key);
    if (!counter || now > counter.resetTime) {
      counter = { count: 0, resetTime: now + limit.window };
      this.rateLimitCounters.set(key, counter);
    }

    // Check limit
    if (counter.count >= limit.requests) {
      // Log rate limit exceeded
      await this.logSecurityEvent({
        type: 'rate_limit_exceeded',
        severity: 'high',
        ipAddress: identifier,
        details: {
          type,
          limit: limit.requests,
          window: limit.window,
        },
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: counter.resetTime,
      };
    }

    // Increment counter
    counter.count++;
    this.rateLimitCounters.set(key, counter);

    return {
      allowed: true,
      remaining: limit.requests - counter.count,
      resetTime: counter.resetTime,
    };
  }

  // IP management
  public async addIPRule(rule: Omit<IPRule, 'id' | 'createdAt'>): Promise<IPRule> {
    const ipRule: IPRule = {
      id: this.generateId(),
      ...rule,
      createdAt: new Date().toISOString(),
    };

    this.ipRules.set(rule.ipAddress, ipRule);

    // Log security event
    await this.logSecurityEvent({
      type: 'ip_blocked',
      severity: rule.type === 'blacklist' ? 'high' : 'medium',
      ipAddress: rule.ipAddress,
      details: {
        ruleType: rule.type,
        reason: rule.reason,
        createdBy: rule.createdBy,
      },
    });

    return ipRule;
  }

  public async checkIPAccess(ipAddress: string): Promise<{
    allowed: boolean;
    reason?: string;
    rule?: IPRule;
  }> {
    const rule = this.ipRules.get(ipAddress);
    
    if (!rule || !rule.isActive) {
      return { allowed: true };
    }

    // Check expiration
    if (rule.expiresAt && new Date(rule.expiresAt) < new Date()) {
      rule.isActive = false;
      return { allowed: true };
    }

    if (rule.type === 'blacklist') {
      return {
        allowed: false,
        reason: `IP blocked: ${rule.reason}`,
        rule,
      };
    }

    if (rule.type === 'whitelist') {
      return { allowed: true, rule };
    }

    return { allowed: true };
  }

  // Threat detection
  private async analyzeLoginAttempt(attempt: LoginAttempt): Promise<void> {
    const ipAddress = attempt.ipAddress;
    const attempts = this.loginAttempts.get(ipAddress) || [];
    const recentAttempts = attempts.filter(
      a => Date.now() - new Date(a.timestamp).getTime() < 15 * 60 * 1000 // 15 minutes
    );

    // Brute force detection
    if (recentAttempts.length >= 5) {
      const failedAttempts = recentAttempts.filter(a => !a.success);
      if (failedAttempts.length >= 5) {
        await this.detectThreat({
          type: 'brute_force',
          confidence: 90,
          riskScore: 85,
          description: `Brute force attack detected from IP ${ipAddress}`,
          indicators: [
            `Multiple failed login attempts (${failedAttempts.length})`,
            `Time window: 15 minutes`,
          ],
          mitigation: [
            'Block IP address',
            'Increase rate limiting',
            'Monitor for credential stuffing',
          ],
        });
      }
    }
  }

  // Threat detection
  public async detectThreat(threat: Omit<ThreatDetection, 'id' | 'detectedAt' | 'status'>): Promise<ThreatDetection> {
    const threatDetection: ThreatDetection = {
      id: this.generateId(),
      ...threat,
      detectedAt: new Date().toISOString(),
      status: 'active',
    };

    this.threatDetections.push(threatDetection);

    // Log security event
    await this.logSecurityEvent({
      type: 'suspicious_activity',
      severity: threat.riskScore > 80 ? 'critical' : threat.riskScore > 60 ? 'high' : 'medium',
      ipAddress: 'unknown',
      details: {
        threatType: threat.type,
        confidence: threat.confidence,
        riskScore: threat.riskScore,
        description: threat.description,
        indicators: threat.indicators,
      },
    });

    return threatDetection;
  }

  // Security event logging
  public async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<SecurityEvent> {
    const securityEvent: SecurityEvent = {
      id: this.generateId(),
      ...event,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    this.securityEvents.push(securityEvent);

    // Log to audit system
    await auditLogger.logSecurityEvent(event.type, {
      severity: event.severity,
      userId: event.userId,
      ipAddress: event.ipAddress,
      details: event.details,
    });

    return securityEvent;
  }

  // Get security metrics
  public async getSecurityMetrics(): Promise<SecurityMetrics> {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;

    const recentEvents = this.securityEvents.filter(
      event => new Date(event.timestamp).getTime() > last24Hours
    );

    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsBySeverity = recentEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const activeThreats = this.threatDetections.filter(t => t.status === 'active').length;
    const blockedIPs = Array.from(this.ipRules.values()).filter(r => r.type === 'blacklist' && r.isActive).length;
    const whitelistedIPs = Array.from(this.ipRules.values()).filter(r => r.type === 'whitelist' && r.isActive).length;

    const averageRiskScore = this.threatDetections.length > 0
      ? this.threatDetections.reduce((sum, t) => sum + t.riskScore, 0) / this.threatDetections.length
      : 0;

    const topThreatTypes = Object.entries(
      this.threatDetections.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || { count: 0, totalRisk: 0 });
        acc[t.type].count++;
        acc[t.type].totalRisk += t.riskScore;
        return acc;
      }, {} as Record<string, { count: number; totalRisk: number }>)
    ).map(([type, data]) => ({
      type,
      count: data.count,
      riskScore: data.totalRisk / data.count,
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Calculate security score (0-100)
    const securityScore = Math.max(0, 100 - (recentEvents.length * 2) - (activeThreats * 5) - (blockedIPs * 1));

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      activeThreats,
      blockedIPs,
      whitelistedIPs,
      averageRiskScore,
      topThreatTypes,
      recentEvents: recentEvents.slice(-10),
      securityScore,
    };
  }

  // Get all security events
  public async getSecurityEvents(filters?: {
    type?: string;
    severity?: string;
    resolved?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ events: SecurityEvent[]; total: number }> {
    let filteredEvents = [...this.securityEvents];

    if (filters) {
      if (filters.type) {
        filteredEvents = filteredEvents.filter(e => e.type === filters.type);
      }
      if (filters.severity) {
        filteredEvents = filteredEvents.filter(e => e.severity === filters.severity);
      }
      if (filters.resolved !== undefined) {
        filteredEvents = filteredEvents.filter(e => e.resolved === filters.resolved);
      }
    }

    const total = filteredEvents.length;
    const events = filteredEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 50));

    return { events, total };
  }

  // Get all threat detections
  public async getThreatDetections(filters?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ threats: ThreatDetection[]; total: number }> {
    let filteredThreats = [...this.threatDetections];

    if (filters) {
      if (filters.type) {
        filteredThreats = filteredThreats.filter(t => t.type === filters.type);
      }
      if (filters.status) {
        filteredThreats = filteredThreats.filter(t => t.status === filters.status);
      }
    }

    const total = filteredThreats.length;
    const threats = filteredThreats
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
      .slice(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 50));

    return { threats, total };
  }

  // Resolve security event
  public async resolveSecurityEvent(eventId: string, resolvedBy: string): Promise<boolean> {
    const event = this.securityEvents.find(e => e.id === eventId);
    if (!event) return false;

    event.resolved = true;
    event.resolvedAt = new Date().toISOString();
    event.resolvedBy = resolvedBy;

    return true;
  }

  // Resolve threat detection
  public async resolveThreatDetection(threatId: string, status: ThreatDetection['status']): Promise<boolean> {
    const threat = this.threatDetections.find(t => t.id === threatId);
    if (!threat) return false;

    threat.status = status;
    return true;
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Get login attempts for IP
  public async getLoginAttempts(ipAddress: string, limit: number = 50): Promise<LoginAttempt[]> {
    const attempts = this.loginAttempts.get(ipAddress) || [];
    return attempts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Get IP rules
  public async getIPRules(): Promise<IPRule[]> {
    return Array.from(this.ipRules.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();