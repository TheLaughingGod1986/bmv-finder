import { auditLogger } from '../audit/auditLogger';
import crypto from 'crypto';

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  sessionTimeout: number; // in minutes
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireUppercase: boolean;
  enableTwoFactor: boolean;
  enableRateLimiting: boolean;
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  allowedOrigins: string[];
  trustedProxies: string[];
}

export interface SecurityEvent {
  id: string;
  type: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'ACCOUNT_LOCKED' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED' | 'CSRF_ATTEMPT' | 'XSS_ATTEMPT' | 'UNAUTHORIZED_ACCESS';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolved: boolean;
}

export interface ThreatDetection {
  id: string;
  type: 'BRUTE_FORCE' | 'SQL_INJECTION' | 'XSS_ATTEMPT' | 'CSRF_ATTEMPT' | 'DDoS' | 'SUSPICIOUS_PATTERN' | 'UNAUTHORIZED_ACCESS';
  source: string;
  target: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0-100
  timestamp: Date;
  details: any;
  action: 'BLOCK' | 'MONITOR' | 'ALERT' | 'IGNORE';
  resolved: boolean;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  threatsDetected: number;
  blockedRequests: number;
  successfulLogins: number;
  failedLogins: number;
  averageResponseTime: number;
  uptime: number;
  lastUpdated: Date;
}

export class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig;
  private securityEvents: Map<string, SecurityEvent> = new Map();
  private threatDetections: Map<string, ThreatDetection> = new Map();
  private loginAttempts: Map<string, { count: number; lastAttempt: Date; locked: boolean }> = new Map();
  private rateLimitTracker: Map<string, { count: number; windowStart: Date }> = new Map();
  private blockedIPs: Set<string> = new Set();
  private suspiciousPatterns: Map<string, number> = new Map();

  private constructor() {
    this.config = {
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      sessionTimeout: 60,
      passwordMinLength: 8,
      passwordRequireSpecialChars: true,
      passwordRequireNumbers: true,
      passwordRequireUppercase: true,
      enableTwoFactor: true,
      enableRateLimiting: true,
      enableCSP: true,
      enableHSTS: true,
      enableXSSProtection: true,
      enableCSRFProtection: true,
      allowedOrigins: ['https://bmv-finder.vercel.app', 'http://localhost:3000'],
      trustedProxies: ['127.0.0.1', '::1']
    };

    this.startSecurityMonitoring();
    this.startCleanupTasks();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Security event logging
  async logSecurityEvent(
    type: SecurityEvent['type'],
    ipAddress: string,
    userAgent: string,
    details: any,
    severity: SecurityEvent['severity'] = 'MEDIUM',
    userId?: string
  ): Promise<void> {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      type,
      userId,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      details,
      severity,
      resolved: false
    };

    this.securityEvents.set(event.id, event);

    // Log to audit system
    await auditLogger.logUserAction(`security_${type.toLowerCase()}`, {
      eventId: event.id,
      ipAddress,
      userAgent,
      severity,
      details
    }, userId);

    // Check for suspicious patterns
    this.analyzeSecurityPatterns(event);

    // Trigger threat detection if needed
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      await this.detectThreats(event);
    }
  }

  // Login attempt tracking
  async trackLoginAttempt(
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean
  ): Promise<{ allowed: boolean; reason?: string; lockoutTime?: Date }> {
    const key = `${email}:${ipAddress}`;
    const now = new Date();

    // Get current attempt data
    let attempts = this.loginAttempts.get(key) || { count: 0, lastAttempt: now, locked: false };

    if (success) {
      // Reset attempts on successful login
      attempts.count = 0;
      attempts.locked = false;
      this.loginAttempts.set(key, attempts);

      await this.logSecurityEvent('LOGIN_SUCCESS', ipAddress, userAgent, { email }, 'LOW');
      return { allowed: true };
    } else {
      // Increment failed attempts
      attempts.count++;
      attempts.lastAttempt = now;

      // Check if account should be locked
      if (attempts.count >= this.config.maxLoginAttempts) {
        attempts.locked = true;
        const lockoutTime = new Date(now.getTime() + this.config.lockoutDuration * 60 * 1000);

        await this.logSecurityEvent('ACCOUNT_LOCKED', ipAddress, userAgent, {
          email,
          attempts: attempts.count,
          lockoutTime
        }, 'HIGH');

        this.loginAttempts.set(key, attempts);
        return { allowed: false, reason: 'Account locked due to too many failed attempts', lockoutTime };
      }

      this.loginAttempts.set(key, attempts);

      await this.logSecurityEvent('LOGIN_FAILURE', ipAddress, userAgent, {
        email,
        attempts: attempts.count
      }, 'MEDIUM');

      return { allowed: true };
    }
  }

  // Check if account is locked
  isAccountLocked(email: string, ipAddress: string): boolean {
    const key = `${email}:${ipAddress}`;
    const attempts = this.loginAttempts.get(key);

    if (!attempts || !attempts.locked) {
      return false;
    }

    // Check if lockout period has expired
    const lockoutExpiry = new Date(attempts.lastAttempt.getTime() + this.config.lockoutDuration * 60 * 1000);
    if (new Date() > lockoutExpiry) {
      attempts.locked = false;
      attempts.count = 0;
      this.loginAttempts.set(key, attempts);
      return false;
    }

    return true;
  }

  // Rate limiting
  async checkRateLimit(
    identifier: string,
    limit: number = 100,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    if (!this.config.enableRateLimiting) {
      return { allowed: true, remaining: limit, resetTime: new Date() };
    }

    const now = new Date();
    const key = `rate_limit:${identifier}`;
    const tracker = this.rateLimitTracker.get(key);

    if (!tracker || now.getTime() - tracker.windowStart.getTime() > windowMs) {
      // New window or expired window
      this.rateLimitTracker.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: limit - 1, resetTime: new Date(now.getTime() + windowMs) };
    }

    if (tracker.count >= limit) {
      // Rate limit exceeded
      await this.logSecurityEvent('RATE_LIMIT_EXCEEDED', identifier, '', {
        limit,
        windowMs,
        count: tracker.count
      }, 'MEDIUM');

      return { allowed: false, remaining: 0, resetTime: new Date(tracker.windowStart.getTime() + windowMs) };
    }

    // Increment counter
    tracker.count++;
    this.rateLimitTracker.set(key, tracker);

    return { allowed: true, remaining: limit - tracker.count, resetTime: new Date(tracker.windowStart.getTime() + windowMs) };
  }

  // Password validation
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.config.passwordMinLength) {
      errors.push(`Password must be at least ${this.config.passwordMinLength} characters long`);
    }

    if (this.config.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.config.passwordRequireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.config.passwordRequireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Generate secure password
  generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';

    // Ensure at least one character from each required category
    if (this.config.passwordRequireUppercase) {
      password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    }
    if (this.config.passwordRequireNumbers) {
      password += '0123456789'[Math.floor(Math.random() * 10)];
    }
    if (this.config.passwordRequireSpecialChars) {
      password += '!@#$%^&*()'[Math.floor(Math.random() * 10)];
    }

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // IP blocking
  async blockIP(ipAddress: string, reason: string, duration: number = 24 * 60 * 60 * 1000): Promise<void> {
    this.blockedIPs.add(ipAddress);

    await this.logSecurityEvent('UNAUTHORIZED_ACCESS', ipAddress, '', {
      action: 'IP_BLOCKED',
      reason,
      duration
    }, 'HIGH');

    // Auto-unblock after duration
    setTimeout(() => {
      this.blockedIPs.delete(ipAddress);
    }, duration);
  }

  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  // Threat detection
  async detectThreats(event: SecurityEvent): Promise<void> {
    const threats: ThreatDetection[] = [];

    // Detect brute force attacks
    if (event.type === 'LOGIN_FAILURE') {
      const recentFailures = Array.from(this.securityEvents.values())
        .filter(e => e.type === 'LOGIN_FAILURE' && 
                    e.ipAddress === event.ipAddress && 
                    e.timestamp.getTime() > Date.now() - 5 * 60 * 1000); // Last 5 minutes

      if (recentFailures.length >= 10) {
        threats.push({
          id: crypto.randomUUID(),
          type: 'BRUTE_FORCE',
          source: event.ipAddress,
          target: 'LOGIN_SYSTEM',
          severity: 'HIGH',
          confidence: 90,
          timestamp: new Date(),
          details: { failures: recentFailures.length, timeWindow: '5 minutes' },
          action: 'BLOCK',
          resolved: false
        });
      }
    }

    // Detect XSS attempts
    if (event.details?.payload && this.detectXSSPattern(event.details.payload)) {
      threats.push({
        id: crypto.randomUUID(),
        type: 'XSS_ATTEMPT',
        source: event.ipAddress,
        target: 'INPUT_VALIDATION',
        severity: 'HIGH',
        confidence: 85,
        timestamp: new Date(),
        details: { payload: event.details.payload },
        action: 'BLOCK',
        resolved: false
      });
    }

    // Detect SQL injection attempts
    if (event.details?.query && this.detectSQLInjectionPattern(event.details.query)) {
      threats.push({
        id: crypto.randomUUID(),
        type: 'SQL_INJECTION',
        source: event.ipAddress,
        target: 'DATABASE',
        severity: 'CRITICAL',
        confidence: 95,
        timestamp: new Date(),
        details: { query: event.details.query },
        action: 'BLOCK',
        resolved: false
      });
    }

    // Store and act on threats
    for (const threat of threats) {
      this.threatDetections.set(threat.id, threat);

      if (threat.action === 'BLOCK') {
        await this.blockIP(threat.source, `Threat detected: ${threat.type}`, 24 * 60 * 60 * 1000);
      }

      // Send alert for high severity threats
      if (threat.severity === 'HIGH' || threat.severity === 'CRITICAL') {
        await this.sendSecurityAlert(threat);
      }
    }
  }

  // Security pattern analysis
  private analyzeSecurityPatterns(event: SecurityEvent): void {
    const key = `${event.type}:${event.ipAddress}`;
    const count = this.suspiciousPatterns.get(key) || 0;
    this.suspiciousPatterns.set(key, count + 1);

    // If pattern count exceeds threshold, mark as suspicious
    if (count + 1 >= 5) {
      this.logSecurityEvent('SUSPICIOUS_ACTIVITY', event.ipAddress, event.userAgent, {
        pattern: event.type,
        count: count + 1,
        timeWindow: '1 hour'
      }, 'MEDIUM');
    }
  }

  // XSS pattern detection
  private detectXSSPattern(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /<style[^>]*>.*?<\/style>/gi,
      /expression\s*\(/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  // SQL injection pattern detection
  private detectSQLInjectionPattern(input: string): boolean {
    const sqlPatterns = [
      /('|(\\')|(;)|(\-\-)|(\s+or\s+)|(\s+and\s+)|(\s+union\s+)|(\s+select\s+)|(\s+insert\s+)|(\s+update\s+)|(\s+delete\s+)|(\s+drop\s+)|(\s+create\s+)|(\s+alter\s+)|(\s+exec\s+)|(\s+execute\s+))/gi,
      /(\bunion\b.*\bselect\b)/gi,
      /(\bselect\b.*\bfrom\b)/gi,
      /(\binsert\b.*\binto\b)/gi,
      /(\bupdate\b.*\bset\b)/gi,
      /(\bdelete\b.*\bfrom\b)/gi,
      /(\bdrop\b.*\btable\b)/gi,
      /(\bcreate\b.*\btable\b)/gi,
      /(\balter\b.*\btable\b)/gi
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // Security alert system
  private async sendSecurityAlert(threat: ThreatDetection): Promise<void> {
    // In a real implementation, this would send alerts via email, SMS, or webhook
    console.warn('SECURITY ALERT:', {
      type: threat.type,
      severity: threat.severity,
      source: threat.source,
      target: threat.target,
      confidence: threat.confidence,
      timestamp: threat.timestamp
    });

    // Log the alert
    await this.logSecurityEvent('SUSPICIOUS_ACTIVITY', threat.source, '', {
      threatType: threat.type,
      severity: threat.severity,
      confidence: threat.confidence,
      action: threat.action
    }, threat.severity);
  }

  // Security metrics
  getSecurityMetrics(): SecurityMetrics {
    const events = Array.from(this.securityEvents.values());
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentEvents = events.filter(e => e.timestamp > oneHourAgo);

    return {
      totalEvents: events.length,
      eventsByType: this.groupBy(events, 'type'),
      eventsBySeverity: this.groupBy(events, 'severity'),
      threatsDetected: this.threatDetections.size,
      blockedRequests: this.blockedIPs.size,
      successfulLogins: events.filter(e => e.type === 'LOGIN_SUCCESS').length,
      failedLogins: events.filter(e => e.type === 'LOGIN_FAILURE').length,
      averageResponseTime: 0, // Would be calculated from actual response times
      uptime: process.uptime(),
      lastUpdated: now
    };
  }

  // Get security events
  getSecurityEvents(limit: number = 100, severity?: SecurityEvent['severity']): SecurityEvent[] {
    let events = Array.from(this.securityEvents.values());

    if (severity) {
      events = events.filter(e => e.severity === severity);
    }

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get threat detections
  getThreatDetections(limit: number = 100, severity?: ThreatDetection['severity']): ThreatDetection[] {
    let threats = Array.from(this.threatDetections.values());

    if (severity) {
      threats = threats.filter(t => t.severity === severity);
    }

    return threats
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Update security configuration
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Security monitoring
  private startSecurityMonitoring(): void {
    // Monitor for suspicious patterns every minute
    setInterval(() => {
      this.monitorSuspiciousPatterns();
    }, 60 * 1000);

    // Clean up old events every hour
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60 * 60 * 1000);
  }

  private startCleanupTasks(): void {
    // Clean up old rate limit data every 15 minutes
    setInterval(() => {
      this.cleanupRateLimitData();
    }, 15 * 60 * 1000);

    // Clean up old login attempts every hour
    setInterval(() => {
      this.cleanupLoginAttempts();
    }, 60 * 60 * 1000);
  }

  private monitorSuspiciousPatterns(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check for patterns that might indicate an attack
    for (const [key, count] of this.suspiciousPatterns) {
      if (count >= 10) {
        const [type, ipAddress] = key.split(':');
        this.logSecurityEvent('SUSPICIOUS_ACTIVITY', ipAddress, '', {
          pattern: type,
          count,
          timeWindow: '1 hour'
        }, 'HIGH');
      }
    }
  }

  private cleanupOldEvents(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const [id, event] of this.securityEvents) {
      if (event.timestamp < oneWeekAgo) {
        this.securityEvents.delete(id);
      }
    }

    for (const [id, threat] of this.threatDetections) {
      if (threat.timestamp < oneWeekAgo) {
        this.threatDetections.delete(id);
      }
    }
  }

  private cleanupRateLimitData(): void {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    for (const [key, tracker] of this.rateLimitTracker) {
      if (tracker.windowStart < fifteenMinutesAgo) {
        this.rateLimitTracker.delete(key);
      }
    }
  }

  private cleanupLoginAttempts(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const [key, attempts] of this.loginAttempts) {
      if (attempts.lastAttempt < oneHourAgo && !attempts.locked) {
        this.loginAttempts.delete(key);
      }
    }
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((groups, item) => {
      const value = String(item[key]);
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();
