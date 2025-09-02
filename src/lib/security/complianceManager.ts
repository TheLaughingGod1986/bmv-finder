// Comprehensive compliance and audit logging system

import { createHash, randomBytes } from 'crypto';
import { advancedCache } from '../advancedCache';

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  regulation: 'GDPR' | 'CCPA' | 'SOX' | 'HIPAA' | 'PCI-DSS' | 'ISO27001';
  category: 'data_protection' | 'access_control' | 'data_retention' | 'privacy' | 'security';
  requirements: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  endpoint: string;
  ipAddress?: string;
  userAgent?: string;
  requestData?: any;
  responseData?: any;
  statusCode?: number;
  duration?: number;
  complianceFlags: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

interface DataSubject {
  id: string;
  type: 'user' | 'customer' | 'employee' | 'vendor';
  identifier: string; // email, ID, etc.
  dataCategories: string[];
  consentGiven: boolean;
  consentDate?: string;
  dataRetentionPeriod: number; // days
  createdAt: string;
  updatedAt: string;
}

interface DataProcessingActivity {
  id: string;
  name: string;
  description: string;
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  dataCategories: string[];
  recipients: string[];
  transfers: string[];
  retentionPeriod: number; // days
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PrivacyImpactAssessment {
  id: string;
  activityId: string;
  riskLevel: 'low' | 'medium' | 'high';
  risks: string[];
  mitigations: string[];
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ComplianceReport {
  id: string;
  type: 'audit' | 'privacy' | 'security' | 'data_retention';
  period: {
    start: string;
    end: string;
  };
  findings: ComplianceFinding[];
  recommendations: string[];
  status: 'draft' | 'review' | 'approved' | 'rejected';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ComplianceFinding {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  assignedTo?: string;
  dueDate?: string;
  resolvedAt?: string;
}

class ComplianceManager {
  private complianceRules: Map<string, ComplianceRule> = new Map();
  private auditLogs: AuditLog[] = [];
  private dataSubjects: Map<string, DataSubject> = new Map();
  private dataProcessingActivities: Map<string, DataProcessingActivity> = new Map();
  private privacyImpactAssessments: Map<string, PrivacyImpactAssessment> = new Map();
  private complianceReports: Map<string, ComplianceReport> = new Map();

  constructor() {
    this.initializeComplianceRules();
    this.startAuditLogging();
  }

  // Initialize compliance rules
  private initializeComplianceRules(): void {
    const rules: ComplianceRule[] = [
      {
        id: 'gdpr-data-minimization',
        name: 'Data Minimization',
        description: 'Collect only necessary personal data',
        regulation: 'GDPR',
        category: 'data_protection',
        requirements: ['collect_minimal_data', 'purpose_limitation'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'gdpr-consent',
        name: 'Consent Management',
        description: 'Obtain valid consent for data processing',
        regulation: 'GDPR',
        category: 'privacy',
        requirements: ['explicit_consent', 'consent_withdrawal', 'consent_records'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'gdpr-data-retention',
        name: 'Data Retention',
        description: 'Retain data only as long as necessary',
        regulation: 'GDPR',
        category: 'data_retention',
        requirements: ['retention_policy', 'data_deletion', 'retention_records'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'gdpr-access-control',
        name: 'Access Control',
        description: 'Control access to personal data',
        regulation: 'GDPR',
        category: 'access_control',
        requirements: ['access_logs', 'role_based_access', 'access_reviews'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ccpa-privacy-rights',
        name: 'Privacy Rights',
        description: 'Respect consumer privacy rights',
        regulation: 'CCPA',
        category: 'privacy',
        requirements: ['right_to_know', 'right_to_delete', 'right_to_opt_out'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    rules.forEach(rule => {
      this.complianceRules.set(rule.id, rule);
    });
  }

  // Log audit event
  logAuditEvent(event: Omit<AuditLog, 'id' | 'timestamp' | 'complianceFlags'>): void {
    const auditLog: AuditLog = {
      ...event,
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      complianceFlags: this.checkComplianceFlags(event)
    };

    this.auditLogs.push(auditLog);

    // Store in cache for quick access
    advancedCache.set(`audit:${auditLog.id}`, auditLog, 30 * 24 * 60 * 60); // 30 days

    // Keep only last 10000 events in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  // Check compliance flags
  private checkComplianceFlags(event: Omit<AuditLog, 'id' | 'timestamp' | 'complianceFlags'>): string[] {
    const flags: string[] = [];

    // Check GDPR compliance
    if (this.isPersonalData(event.resource, event.requestData)) {
      flags.push('GDPR_PERSONAL_DATA');
    }

    if (event.action === 'delete' && this.isPersonalData(event.resource, event.requestData)) {
      flags.push('GDPR_DATA_DELETION');
    }

    if (event.action === 'access' && this.isPersonalData(event.resource, event.requestData)) {
      flags.push('GDPR_DATA_ACCESS');
    }

    // Check CCPA compliance
    if (event.action === 'collect' && this.isConsumerData(event.resource, event.requestData)) {
      flags.push('CCPA_DATA_COLLECTION');
    }

    // Check access control
    if (event.action === 'access' && !event.userId) {
      flags.push('ACCESS_CONTROL_VIOLATION');
    }

    return flags;
  }

  // Check if data is personal data
  private isPersonalData(resource: string, data: any): boolean {
    const personalDataFields = ['email', 'name', 'address', 'phone', 'ssn', 'passport', 'id'];
    
    if (typeof data === 'object' && data !== null) {
      return personalDataFields.some(field => 
        Object.keys(data).some(key => key.toLowerCase().includes(field))
      );
    }

    return personalDataFields.some(field => 
      resource.toLowerCase().includes(field)
    );
  }

  // Check if data is consumer data (CCPA)
  private isConsumerData(resource: string, data: any): boolean {
    const consumerDataFields = ['email', 'name', 'address', 'phone', 'purchase_history', 'browsing_history'];
    
    if (typeof data === 'object' && data !== null) {
      return consumerDataFields.some(field => 
        Object.keys(data).some(key => key.toLowerCase().includes(field))
      );
    }

    return consumerDataFields.some(field => 
      resource.toLowerCase().includes(field)
    );
  }

  // Register data subject
  registerDataSubject(subject: Omit<DataSubject, 'id' | 'createdAt' | 'updatedAt'>): string {
    const dataSubject: DataSubject = {
      ...subject,
      id: this.generateSubjectId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.dataSubjects.set(dataSubject.id, dataSubject);

    // Log registration
    this.logAuditEvent({
      action: 'register_data_subject',
      resource: 'data_subject',
      resourceId: dataSubject.id,
      method: 'POST',
      endpoint: '/api/compliance/data-subjects',
      complianceFlags: ['GDPR_DATA_SUBJECT_REGISTRATION'],
      severity: 'medium',
      metadata: { dataCategories: dataSubject.dataCategories }
    });

    return dataSubject.id;
  }

  // Register data processing activity
  registerDataProcessingActivity(activity: Omit<DataProcessingActivity, 'id' | 'createdAt' | 'updatedAt'>): string {
    const processingActivity: DataProcessingActivity = {
      ...activity,
      id: this.generateActivityId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.dataProcessingActivities.set(processingActivity.id, processingActivity);

    // Log registration
    this.logAuditEvent({
      action: 'register_processing_activity',
      resource: 'data_processing_activity',
      resourceId: processingActivity.id,
      method: 'POST',
      endpoint: '/api/compliance/processing-activities',
      complianceFlags: ['GDPR_PROCESSING_ACTIVITY_REGISTRATION'],
      severity: 'medium',
      metadata: { 
        purpose: processingActivity.purpose,
        legalBasis: processingActivity.legalBasis,
        dataCategories: processingActivity.dataCategories
      }
    });

    return processingActivity.id;
  }

  // Conduct privacy impact assessment
  conductPrivacyImpactAssessment(assessment: Omit<PrivacyImpactAssessment, 'id' | 'createdAt' | 'updatedAt'>): string {
    const pia: PrivacyImpactAssessment = {
      ...assessment,
      id: this.generatePIAId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.privacyImpactAssessments.set(pia.id, pia);

    // Log assessment
    this.logAuditEvent({
      action: 'conduct_privacy_impact_assessment',
      resource: 'privacy_impact_assessment',
      resourceId: pia.id,
      method: 'POST',
      endpoint: '/api/compliance/privacy-impact-assessments',
      complianceFlags: ['GDPR_PRIVACY_IMPACT_ASSESSMENT'],
      severity: 'high',
      metadata: { 
        activityId: pia.activityId,
        riskLevel: pia.riskLevel,
        risks: pia.risks
      }
    });

    return pia.id;
  }

  // Generate compliance report
  generateComplianceReport(report: Omit<ComplianceReport, 'id' | 'createdAt' | 'updatedAt'>): string {
    const complianceReport: ComplianceReport = {
      ...report,
      id: this.generateReportId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.complianceReports.set(complianceReport.id, complianceReport);

    // Log report generation
    this.logAuditEvent({
      action: 'generate_compliance_report',
      resource: 'compliance_report',
      resourceId: complianceReport.id,
      method: 'POST',
      endpoint: '/api/compliance/reports',
      complianceFlags: ['COMPLIANCE_REPORTING'],
      severity: 'medium',
      metadata: { 
        type: complianceReport.type,
        period: complianceReport.period,
        findingsCount: complianceReport.findings.length
      }
    });

    return complianceReport.id;
  }

  // Get audit logs
  getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    severity?: string;
    limit?: number;
  }): AuditLog[] {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.resource) {
        logs = logs.filter(log => log.resource === filters.resource);
      }
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
      if (filters.severity) {
        logs = logs.filter(log => log.severity === filters.severity);
      }
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  }

  // Get compliance statistics
  getComplianceStats(): {
    totalAuditLogs: number;
    complianceFlags: Record<string, number>;
    dataSubjects: number;
    processingActivities: number;
    privacyImpactAssessments: number;
    complianceReports: number;
    activeRules: number;
  } {
    const complianceFlags: Record<string, number> = {};

    this.auditLogs.forEach(log => {
      log.complianceFlags.forEach(flag => {
        complianceFlags[flag] = (complianceFlags[flag] || 0) + 1;
      });
    });

    return {
      totalAuditLogs: this.auditLogs.length,
      complianceFlags,
      dataSubjects: this.dataSubjects.size,
      processingActivities: this.dataProcessingActivities.size,
      privacyImpactAssessments: this.privacyImpactAssessments.size,
      complianceReports: this.complianceReports.size,
      activeRules: Array.from(this.complianceRules.values()).filter(rule => rule.isActive).length
    };
  }

  // Check data retention compliance
  checkDataRetentionCompliance(): {
    compliant: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check data subjects
    this.dataSubjects.forEach(subject => {
      const retentionPeriod = subject.dataRetentionPeriod;
      const createdAt = new Date(subject.createdAt);
      const now = new Date();
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceCreation > retentionPeriod) {
        violations.push(`Data subject ${subject.identifier} has exceeded retention period`);
        recommendations.push(`Delete data for subject ${subject.identifier}`);
      }
    });

    // Check processing activities
    this.dataProcessingActivities.forEach(activity => {
      if (!activity.isActive) {
        const updatedAt = new Date(activity.updatedAt);
        const now = new Date();
        const daysSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceUpdate > activity.retentionPeriod) {
          violations.push(`Processing activity ${activity.name} data should be deleted`);
          recommendations.push(`Delete data for activity ${activity.name}`);
        }
      }
    });

    return {
      compliant: violations.length === 0,
      violations,
      recommendations
    };
  }

  // Start audit logging
  private startAuditLogging(): void {
    // Log system startup
    this.logAuditEvent({
      action: 'system_startup',
      resource: 'system',
      method: 'SYSTEM',
      endpoint: '/system/startup',
      complianceFlags: ['SYSTEM_AUDIT'],
      severity: 'low',
      metadata: { component: 'compliance_manager' }
    });
  }

  // Utility methods
  private generateAuditId(): string {
    return `audit_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private generateSubjectId(): string {
    return `subject_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private generateActivityId(): string {
    return `activity_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private generatePIAId(): string {
    return `pia_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  // Public methods
  getComplianceRule(ruleId: string): ComplianceRule | undefined {
    return this.complianceRules.get(ruleId);
  }

  getDataSubject(subjectId: string): DataSubject | undefined {
    return this.dataSubjects.get(subjectId);
  }

  getDataProcessingActivity(activityId: string): DataProcessingActivity | undefined {
    return this.dataProcessingActivities.get(activityId);
  }

  getPrivacyImpactAssessment(piaId: string): PrivacyImpactAssessment | undefined {
    return this.privacyImpactAssessments.get(piaId);
  }

  getComplianceReport(reportId: string): ComplianceReport | undefined {
    return this.complianceReports.get(reportId);
  }

  updateDataSubject(subjectId: string, updates: Partial<DataSubject>): boolean {
    const subject = this.dataSubjects.get(subjectId);
    if (!subject) return false;

    const updatedSubject = { ...subject, ...updates, updatedAt: new Date().toISOString() };
    this.dataSubjects.set(subjectId, updatedSubject);

    // Log update
    this.logAuditEvent({
      action: 'update_data_subject',
      resource: 'data_subject',
      resourceId: subjectId,
      method: 'PUT',
      endpoint: `/api/compliance/data-subjects/${subjectId}`,
      complianceFlags: ['GDPR_DATA_SUBJECT_UPDATE'],
      severity: 'medium',
      metadata: { updates: Object.keys(updates) }
    });

    return true;
  }

  deleteDataSubject(subjectId: string): boolean {
    const subject = this.dataSubjects.get(subjectId);
    if (!subject) return false;

    this.dataSubjects.delete(subjectId);

    // Log deletion
    this.logAuditEvent({
      action: 'delete_data_subject',
      resource: 'data_subject',
      resourceId: subjectId,
      method: 'DELETE',
      endpoint: `/api/compliance/data-subjects/${subjectId}`,
      complianceFlags: ['GDPR_DATA_SUBJECT_DELETION'],
      severity: 'high',
      metadata: { identifier: subject.identifier }
    });

    return true;
  }
}

// Singleton instance
export const complianceManager = new ComplianceManager();

// Export types
export type { ComplianceRule, AuditLog, DataSubject, DataProcessingActivity, PrivacyImpactAssessment, ComplianceReport, ComplianceFinding };
