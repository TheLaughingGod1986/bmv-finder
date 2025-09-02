// Comprehensive API security and rate limiting system

import { createHash, randomBytes } from 'crypto';
import { advancedCache } from '../advancedCache';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
  onLimitReached?: (req: any, res: any) => void;
}

interface SecurityRule {
  id: string;
  name: string;
  type: 'rate_limit' | 'ip_whitelist' | 'ip_blacklist' | 'user_agent' | 'referer' | 'content_type';
  condition: string;
  action: 'allow' | 'deny' | 'throttle';
  parameters: Record<string, any>;
  priority: number;
  isActive: boolean;
}

interface SecurityEvent {
  id: string;
  type: 'rate_limit_exceeded' | 'ip_blocked' | 'suspicious_request' | 'authentication_failed';
  ipAddress: string;
  userAgent?: string;
  endpoint: string;
  method: string;
  details: Record<string, any>;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface APISecurityConfig {
  enableRateLimiting: boolean;
  enableIPFiltering: boolean;
  enableRequestValidation: boolean;
  enableResponseSanitization: boolean;
  maxRequestSize: number; // bytes
  allowedContentTypes: string[];
  blockedUserAgents: string[];
  trustedProxies: string[];
}

class APISecurityManager {
  private config: APISecurityConfig;
  private rateLimitConfigs: Map<string, RateLimitConfig> = new Map();
  private securityRules: Map<string, SecurityRule> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private ipBlacklist: Set<string> = new Set();
  private ipWhitelist: Set<string> = new Set();
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.config = {
      enableRateLimiting: true,
      enableIPFiltering: true,
      enableRequestValidation: true,
      enableResponseSanitization: true,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      allowedContentTypes: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'],
      blockedUserAgents: ['bot', 'crawler', 'spider', 'scraper'],
      trustedProxies: ['127.0.0.1', '::1']
    };

    this.initializeSecurityRules();
    this.startCleanupTasks();
  }

  // Initialize security rules
  private initializeSecurityRules(): void {
    const rules: SecurityRule[] = [
      {
        id: 'rate-limit-api',
        name: 'API Rate Limiting',
        type: 'rate_limit',
        condition: 'endpoint.startsWith("/api/")',
        action: 'throttle',
        parameters: { windowMs: 60000, maxRequests: 100 },
        priority: 1,
        isActive: true
      },
      {
        id: 'rate-limit-auth',
        name: 'Authentication Rate Limiting',
        type: 'rate_limit',
        condition: 'endpoint.includes("/auth/")',
        action: 'throttle',
        parameters: { windowMs: 60000, maxRequests: 10 },
        priority: 1,
        isActive: true
      },
      {
        id: 'block-suspicious-ua',
        name: 'Block Suspicious User Agents',
        type: 'user_agent',
        condition: 'userAgent.includes("bot") || userAgent.includes("crawler")',
        action: 'deny',
        parameters: {},
        priority: 2,
        isActive: true
      },
      {
        id: 'validate-content-type',
        name: 'Validate Content Type',
        type: 'content_type',
        condition: 'method === "POST" || method === "PUT"',
        action: 'deny',
        parameters: { allowedTypes: ['application/json'] },
        priority: 3,
        isActive: true
      }
    ];

    rules.forEach(rule => {
      this.securityRules.set(rule.id, rule);
    });
  }

  // Middleware for API security
  async secureRequest(req: any, res: any, next: any): Promise<void> {
    try {
      const requestInfo = this.extractRequestInfo(req);
      
      // Check IP filtering
      if (this.config.enableIPFiltering) {
        const ipCheck = this.checkIPFiltering(requestInfo.ipAddress);
        if (!ipCheck.allowed) {
          this.logSecurityEvent({
            type: 'ip_blocked',
            ipAddress: requestInfo.ipAddress,
            endpoint: requestInfo.endpoint,
            method: requestInfo.method,
            details: { reason: ipCheck.reason },
            severity: 'high'
          });
          res.status(403).json({ error: 'Access denied' });
          return;
        }
      }

      // Check rate limiting
      if (this.config.enableRateLimiting) {
        const rateLimitCheck = await this.checkRateLimit(requestInfo);
        if (!rateLimitCheck.allowed) {
          this.logSecurityEvent({
            type: 'rate_limit_exceeded',
            ipAddress: requestInfo.ipAddress,
            userAgent: requestInfo.userAgent,
            endpoint: requestInfo.endpoint,
            method: requestInfo.method,
            details: { 
              limit: rateLimitCheck.limit,
              remaining: rateLimitCheck.remaining,
              resetTime: rateLimitCheck.resetTime
            },
            severity: 'medium'
          });
          res.status(429).json({ 
            error: 'Rate limit exceeded',
            limit: rateLimitCheck.limit,
            remaining: rateLimitCheck.remaining,
            resetTime: rateLimitCheck.resetTime
          });
          return;
        }
      }

      // Validate request
      if (this.config.enableRequestValidation) {
        const validationResult = this.validateRequest(req, requestInfo);
        if (!validationResult.valid) {
          this.logSecurityEvent({
            type: 'suspicious_request',
            ipAddress: requestInfo.ipAddress,
            userAgent: requestInfo.userAgent,
            endpoint: requestInfo.endpoint,
            method: requestInfo.method,
            details: { reason: validationResult.reason },
            severity: 'medium'
          });
          res.status(400).json({ error: validationResult.reason });
          return;
        }
      }

      // Apply security rules
      const ruleResult = this.applySecurityRules(requestInfo);
      if (!ruleResult.allowed) {
        this.logSecurityEvent({
          type: 'suspicious_request',
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent,
          endpoint: requestInfo.endpoint,
          method: requestInfo.method,
          details: { rule: ruleResult.rule, reason: ruleResult.reason },
          severity: 'high'
        });
        res.status(403).json({ error: ruleResult.reason });
        return;
      }

      // Add security headers
      this.addSecurityHeaders(res);

      next();

    } catch (error: any) {
      console.error('API security middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Extract request information
  private extractRequestInfo(req: any): any {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const endpoint = req.url || '';
    const method = req.method || 'GET';
    const contentType = req.headers['content-type'] || '';
    const contentLength = parseInt(req.headers['content-length'] || '0');

    return {
      ipAddress,
      userAgent,
      endpoint,
      method,
      contentType,
      contentLength,
      headers: req.headers,
      query: req.query,
      body: req.body
    };
  }

  // Get client IP address
  private getClientIP(req: any): string {
    const forwarded = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    return remoteAddress || 'unknown';
  }

  // Check IP filtering
  private checkIPFiltering(ipAddress: string): { allowed: boolean; reason?: string } {
    // Check blacklist
    if (this.ipBlacklist.has(ipAddress)) {
      return { allowed: false, reason: 'IP address is blacklisted' };
    }

    // Check whitelist (if not empty, only whitelisted IPs are allowed)
    if (this.ipWhitelist.size > 0 && !this.ipWhitelist.has(ipAddress)) {
      return { allowed: false, reason: 'IP address is not whitelisted' };
    }

    return { allowed: true };
  }

  // Check rate limiting
  private async checkRateLimit(requestInfo: any): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  }> {
    const key = this.generateRateLimitKey(requestInfo);
    const now = Date.now();

    // Get rate limit config for this endpoint
    const rateLimitConfig = this.getRateLimitConfig(requestInfo.endpoint);
    if (!rateLimitConfig) {
      return { allowed: true, limit: 0, remaining: 0, resetTime: 0 };
    }

    // Check cache first
    const cached = await advancedCache.get<{ count: number; resetTime: number }>(`rate_limit:${key}`);
    let rateLimitData = cached || { count: 0, resetTime: now + rateLimitConfig.windowMs };

    // Reset if window has passed
    if (now >= rateLimitData.resetTime) {
      rateLimitData = { count: 0, resetTime: now + rateLimitConfig.windowMs };
    }

    // Check if limit exceeded
    if (rateLimitData.count >= rateLimitConfig.maxRequests) {
      return {
        allowed: false,
        limit: rateLimitConfig.maxRequests,
        remaining: 0,
        resetTime: rateLimitData.resetTime
      };
    }

    // Increment counter
    rateLimitData.count++;
    await advancedCache.set(`rate_limit:${key}`, rateLimitData, Math.ceil(rateLimitConfig.windowMs / 1000));

    return {
      allowed: true,
      limit: rateLimitConfig.maxRequests,
      remaining: rateLimitConfig.maxRequests - rateLimitData.count,
      resetTime: rateLimitData.resetTime
    };
  }

  // Get rate limit configuration for endpoint
  private getRateLimitConfig(endpoint: string): RateLimitConfig | null {
    // Check for specific endpoint configs
    for (const [key, config] of this.rateLimitConfigs.entries()) {
      if (endpoint.includes(key)) {
        return config;
      }
    }

    // Default rate limit config
    return {
      windowMs: 60000, // 1 minute
      maxRequests: 100
    };
  }

  // Generate rate limit key
  private generateRateLimitKey(requestInfo: any): string {
    const key = `${requestInfo.ipAddress}:${requestInfo.endpoint}`;
    return createHash('sha256').update(key).digest('hex');
  }

  // Validate request
  private validateRequest(req: any, requestInfo: any): { valid: boolean; reason?: string } {
    // Check content length
    if (requestInfo.contentLength > this.config.maxRequestSize) {
      return { valid: false, reason: 'Request too large' };
    }

    // Check content type for POST/PUT requests
    if ((requestInfo.method === 'POST' || requestInfo.method === 'PUT') && requestInfo.contentLength > 0) {
      if (!this.config.allowedContentTypes.some(type => requestInfo.contentType.includes(type))) {
        return { valid: false, reason: 'Invalid content type' };
      }
    }

    // Check for blocked user agents
    const userAgent = requestInfo.userAgent.toLowerCase();
    if (this.config.blockedUserAgents.some(blocked => userAgent.includes(blocked))) {
      return { valid: false, reason: 'Blocked user agent' };
    }

    // Check for suspicious patterns
    if (this.detectSuspiciousPatterns(requestInfo)) {
      return { valid: false, reason: 'Suspicious request pattern' };
    }

    return { valid: true };
  }

  // Detect suspicious patterns
  private detectSuspiciousPatterns(requestInfo: any): boolean {
    const endpoint = requestInfo.endpoint.toLowerCase();
    const userAgent = requestInfo.userAgent.toLowerCase();

    // Check for SQL injection patterns
    const sqlPatterns = ['union', 'select', 'insert', 'update', 'delete', 'drop', 'create', 'alter'];
    if (sqlPatterns.some(pattern => endpoint.includes(pattern) || userAgent.includes(pattern))) {
      return true;
    }

    // Check for XSS patterns
    const xssPatterns = ['<script', 'javascript:', 'onload=', 'onerror='];
    if (xssPatterns.some(pattern => endpoint.includes(pattern) || userAgent.includes(pattern))) {
      return true;
    }

    // Check for path traversal
    if (endpoint.includes('../') || endpoint.includes('..\\')) {
      return true;
    }

    return false;
  }

  // Apply security rules
  private applySecurityRules(requestInfo: any): { allowed: boolean; rule?: string; reason?: string } {
    const sortedRules = Array.from(this.securityRules.values())
      .filter(rule => rule.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      if (this.evaluateRule(rule, requestInfo)) {
        if (rule.action === 'deny') {
          return { allowed: false, rule: rule.id, reason: `Blocked by rule: ${rule.name}` };
        }
        if (rule.action === 'throttle') {
          // Throttling is handled by rate limiting
          continue;
        }
      }
    }

    return { allowed: true };
  }

  // Evaluate security rule
  private evaluateRule(rule: SecurityRule, requestInfo: any): boolean {
    try {
      // Simple condition evaluation (in production, use a proper expression evaluator)
      const condition = rule.condition.replace(/(\w+)/g, (match) => {
        return requestInfo[match] !== undefined ? JSON.stringify(requestInfo[match]) : match;
      });
      
      return eval(condition);
    } catch {
      return false;
    }
  }

  // Add security headers
  private addSecurityHeaders(res: any): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Log security event
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

  // Add IP to blacklist
  addToBlacklist(ipAddress: string): void {
    this.ipBlacklist.add(ipAddress);
  }

  // Remove IP from blacklist
  removeFromBlacklist(ipAddress: string): void {
    this.ipBlacklist.delete(ipAddress);
  }

  // Add IP to whitelist
  addToWhitelist(ipAddress: string): void {
    this.ipWhitelist.add(ipAddress);
  }

  // Remove IP from whitelist
  removeFromWhitelist(ipAddress: string): void {
    this.ipWhitelist.delete(ipAddress);
  }

  // Add rate limit configuration
  addRateLimitConfig(key: string, config: RateLimitConfig): void {
    this.rateLimitConfigs.set(key, config);
  }

  // Get security events
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  // Get security statistics
  getSecurityStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    blockedIPs: number;
    whitelistedIPs: number;
    activeRules: number;
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    this.securityEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    return {
      totalEvents: this.securityEvents.length,
      eventsByType,
      eventsBySeverity,
      blockedIPs: this.ipBlacklist.size,
      whitelistedIPs: this.ipWhitelist.size,
      activeRules: Array.from(this.securityRules.values()).filter(rule => rule.isActive).length
    };
  }

  // Start cleanup tasks
  private startCleanupTasks(): void {
    // Clean up old security events every hour
    setInterval(() => {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      this.securityEvents = this.securityEvents.filter(event => 
        new Date(event.timestamp).getTime() > cutoff
      );
    }, 60 * 60 * 1000);
  }

  // Utility methods
  private generateEventId(): string {
    return `event_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }
}

// Singleton instance
export const apiSecurityManager = new APISecurityManager();

// Export types
export type { RateLimitConfig, SecurityRule, SecurityEvent, APISecurityConfig };
