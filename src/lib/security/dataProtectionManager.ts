import { auditLogger } from '../audit/auditLogger';
import crypto from 'crypto';

export interface DataSubject {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  nationality?: string;
  createdAt: Date;
  lastUpdated: Date;
  dataRetentionPeriod: number; // in days
  consentGiven: boolean;
  consentDate?: Date;
  consentWithdrawn?: Date;
  dataCategories: DataCategory[];
}

export interface DataCategory {
  id: string;
  name: string;
  description: string;
  legalBasis: 'CONSENT' | 'CONTRACT' | 'LEGAL_OBLIGATION' | 'VITAL_INTERESTS' | 'PUBLIC_TASK' | 'LEGITIMATE_INTERESTS';
  retentionPeriod: number; // in days
  isPersonalData: boolean;
  isSensitiveData: boolean;
  processingPurposes: string[];
}

export interface DataProcessingRecord {
  id: string;
  dataSubjectId: string;
  dataCategoryId: string;
  processingPurpose: string;
  legalBasis: string;
  processorId: string;
  processorName: string;
  processingDate: Date;
  dataVolume: number;
  retentionPeriod: number;
  isAutomated: boolean;
  hasProfiling: boolean;
  thirdPartySharing: boolean;
  thirdParties: string[];
  securityMeasures: string[];
  createdAt: Date;
}

export interface DataBreach {
  id: string;
  type: 'CONFIDENTIALITY' | 'INTEGRITY' | 'AVAILABILITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedDataSubjects: number;
  affectedDataCategories: string[];
  discoveredDate: Date;
  reportedDate?: Date;
  containedDate?: Date;
  resolvedDate?: Date;
  cause: string;
  impact: string;
  measures: string[];
  notificationRequired: boolean;
  notificationDate?: Date;
  supervisoryAuthorityNotified: boolean;
  dataSubjectsNotified: boolean;
  status: 'DISCOVERED' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
}

export interface ConsentRecord {
  id: string;
  dataSubjectId: string;
  purpose: string;
  dataCategories: string[];
  givenDate: Date;
  withdrawnDate?: Date;
  method: 'EXPLICIT' | 'IMPLICIT' | 'OPT_IN' | 'OPT_OUT';
  version: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface DataSubjectRequest {
  id: string;
  dataSubjectId: string;
  type: 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'RESTRICTION' | 'PORTABILITY' | 'OBJECTION';
  description: string;
  submittedDate: Date;
  dueDate: Date;
  status: 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  response?: string;
  completedDate?: Date;
  verified: boolean;
  verificationMethod?: string;
}

export class DataProtectionManager {
  private static instance: DataProtectionManager;
  private dataSubjects: Map<string, DataSubject> = new Map();
  private dataCategories: Map<string, DataCategory> = new Map();
  private processingRecords: Map<string, DataProcessingRecord> = new Map();
  private dataBreaches: Map<string, DataBreach> = new Map();
  private consentRecords: Map<string, ConsentRecord> = new Map();
  private dataSubjectRequests: Map<string, DataSubjectRequest> = new Map();

  private constructor() {
    this.initializeDataCategories();
    this.startDataRetentionMonitoring();
    this.startConsentMonitoring();
  }

  public static getInstance(): DataProtectionManager {
    if (!DataProtectionManager.instance) {
      DataProtectionManager.instance = new DataProtectionManager();
    }
    return DataProtectionManager.instance;
  }

  // Data Subject Management
  async createDataSubject(data: Omit<DataSubject, 'id' | 'createdAt' | 'lastUpdated'>): Promise<DataSubject> {
    const dataSubject: DataSubject = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    this.dataSubjects.set(dataSubject.id, dataSubject);

    await auditLogger.logUserAction('data_subject_created', {
      dataSubjectId: dataSubject.id,
      email: dataSubject.email,
      dataCategories: dataSubject.dataCategories.map(c => c.id)
    });

    return dataSubject;
  }

  async updateDataSubject(id: string, updates: Partial<DataSubject>): Promise<DataSubject | null> {
    const dataSubject = this.dataSubjects.get(id);
    if (!dataSubject) {
      return null;
    }

    const updatedDataSubject = {
      ...dataSubject,
      ...updates,
      lastUpdated: new Date()
    };

    this.dataSubjects.set(id, updatedDataSubject);

    await auditLogger.logUserAction('data_subject_updated', {
      dataSubjectId: id,
      updates: Object.keys(updates)
    });

    return updatedDataSubject;
  }

  async deleteDataSubject(id: string): Promise<boolean> {
    const dataSubject = this.dataSubjects.get(id);
    if (!dataSubject) {
      return false;
    }

    // Check if data can be deleted (no legal obligation to retain)
    const canDelete = await this.canDeleteDataSubject(id);
    if (!canDelete) {
      throw new Error('Cannot delete data subject due to legal obligations');
    }

    this.dataSubjects.delete(id);

    // Delete related records
    for (const [recordId, record] of this.processingRecords) {
      if (record.dataSubjectId === id) {
        this.processingRecords.delete(recordId);
      }
    }

    for (const [consentId, consent] of this.consentRecords) {
      if (consent.dataSubjectId === id) {
        this.consentRecords.delete(consentId);
      }
    }

    await auditLogger.logUserAction('data_subject_deleted', {
      dataSubjectId: id,
      email: dataSubject.email
    });

    return true;
  }

  getDataSubject(id: string): DataSubject | null {
    return this.dataSubjects.get(id) || null;
  }

  getDataSubjectByEmail(email: string): DataSubject | null {
    for (const dataSubject of this.dataSubjects.values()) {
      if (dataSubject.email === email) {
        return dataSubject;
      }
    }
    return null;
  }

  // Consent Management
  async recordConsent(
    dataSubjectId: string,
    purpose: string,
    dataCategories: string[],
    method: ConsentRecord['method'],
    ipAddress: string,
    userAgent: string
  ): Promise<ConsentRecord> {
    const consent: ConsentRecord = {
      id: crypto.randomUUID(),
      dataSubjectId,
      purpose,
      dataCategories,
      givenDate: new Date(),
      method,
      version: '1.0',
      ipAddress,
      userAgent,
      isActive: true
    };

    this.consentRecords.set(consent.id, consent);

    // Update data subject consent status
    const dataSubject = this.dataSubjects.get(dataSubjectId);
    if (dataSubject) {
      dataSubject.consentGiven = true;
      dataSubject.consentDate = new Date();
      this.dataSubjects.set(dataSubjectId, dataSubject);
    }

    await auditLogger.logUserAction('consent_recorded', {
      consentId: consent.id,
      dataSubjectId,
      purpose,
      dataCategories,
      method
    });

    return consent;
  }

  async withdrawConsent(consentId: string, reason?: string): Promise<boolean> {
    const consent = this.consentRecords.get(consentId);
    if (!consent || !consent.isActive) {
      return false;
    }

    consent.withdrawnDate = new Date();
    consent.isActive = false;
    this.consentRecords.set(consentId, consent);

    // Update data subject consent status
    const dataSubject = this.dataSubjects.get(consent.dataSubjectId);
    if (dataSubject) {
      dataSubject.consentWithdrawn = new Date();
      this.dataSubjects.set(consent.dataSubjectId, dataSubject);
    }

    await auditLogger.logUserAction('consent_withdrawn', {
      consentId,
      dataSubjectId: consent.dataSubjectId,
      reason
    });

    return true;
  }

  hasValidConsent(dataSubjectId: string, purpose: string, dataCategories: string[]): boolean {
    const activeConsents = Array.from(this.consentRecords.values())
      .filter(c => c.dataSubjectId === dataSubjectId && c.isActive);

    return activeConsents.some(consent => 
      consent.purpose === purpose && 
      dataCategories.every(category => consent.dataCategories.includes(category))
    );
  }

  // Data Processing Records
  async recordDataProcessing(
    dataSubjectId: string,
    dataCategoryId: string,
    processingPurpose: string,
    legalBasis: string,
    processorId: string,
    processorName: string,
    dataVolume: number,
    isAutomated: boolean = false,
    hasProfiling: boolean = false,
    thirdPartySharing: boolean = false,
    thirdParties: string[] = [],
    securityMeasures: string[] = []
  ): Promise<DataProcessingRecord> {
    const dataCategory = this.dataCategories.get(dataCategoryId);
    if (!dataCategory) {
      throw new Error('Data category not found');
    }

    const record: DataProcessingRecord = {
      id: crypto.randomUUID(),
      dataSubjectId,
      dataCategoryId,
      processingPurpose,
      legalBasis,
      processorId,
      processorName,
      processingDate: new Date(),
      dataVolume,
      retentionPeriod: dataCategory.retentionPeriod,
      isAutomated,
      hasProfiling,
      thirdPartySharing,
      thirdParties,
      securityMeasures,
      createdAt: new Date()
    };

    this.processingRecords.set(record.id, record);

    await auditLogger.logUserAction('data_processing_recorded', {
      recordId: record.id,
      dataSubjectId,
      dataCategoryId,
      processingPurpose,
      legalBasis
    });

    return record;
  }

  // Data Subject Requests (GDPR Rights)
  async createDataSubjectRequest(
    dataSubjectId: string,
    type: DataSubjectRequest['type'],
    description: string,
    verificationMethod?: string
  ): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: crypto.randomUUID(),
      dataSubjectId,
      type,
      description,
      submittedDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'RECEIVED',
      verified: false,
      verificationMethod
    };

    this.dataSubjectRequests.set(request.id, request);

    await auditLogger.logUserAction('data_subject_request_created', {
      requestId: request.id,
      dataSubjectId,
      type,
      description
    });

    return request;
  }

  async processDataSubjectRequest(
    requestId: string,
    status: DataSubjectRequest['status'],
    response?: string
  ): Promise<boolean> {
    const request = this.dataSubjectRequests.get(requestId);
    if (!request) {
      return false;
    }

    request.status = status;
    if (response) {
      request.response = response;
    }
    if (status === 'COMPLETED') {
      request.completedDate = new Date();
    }

    this.dataSubjectRequests.set(requestId, request);

    await auditLogger.logUserAction('data_subject_request_processed', {
      requestId,
      status,
      response: response ? 'provided' : 'not_provided'
    });

    return true;
  }

  // Data Breach Management
  async reportDataBreach(
    type: DataBreach['type'],
    severity: DataBreach['severity'],
    description: string,
    affectedDataSubjects: number,
    affectedDataCategories: string[],
    cause: string,
    impact: string
  ): Promise<DataBreach> {
    const breach: DataBreach = {
      id: crypto.randomUUID(),
      type,
      severity,
      description,
      affectedDataSubjects,
      affectedDataCategories,
      discoveredDate: new Date(),
      cause,
      impact,
      measures: [],
      notificationRequired: severity === 'HIGH' || severity === 'CRITICAL',
      status: 'DISCOVERED'
    };

    this.dataBreaches.set(breach.id, breach);

    await auditLogger.logUserAction('data_breach_reported', {
      breachId: breach.id,
      type,
      severity,
      affectedDataSubjects,
      notificationRequired: breach.notificationRequired
    });

    // Auto-notify if required
    if (breach.notificationRequired) {
      await this.notifyDataBreach(breach);
    }

    return breach;
  }

  async updateDataBreach(
    breachId: string,
    updates: Partial<DataBreach>
  ): Promise<DataBreach | null> {
    const breach = this.dataBreaches.get(breachId);
    if (!breach) {
      return null;
    }

    const updatedBreach = { ...breach, ...updates };
    this.dataBreaches.set(breachId, updatedBreach);

    await auditLogger.logUserAction('data_breach_updated', {
      breachId,
      updates: Object.keys(updates)
    });

    return updatedBreach;
  }

  // Data Retention
  async checkDataRetention(): Promise<{ expired: DataSubject[]; expiring: DataSubject[] }> {
    const now = new Date();
    const expired: DataSubject[] = [];
    const expiring: DataSubject[] = [];

    for (const dataSubject of this.dataSubjects.values()) {
      const retentionExpiry = new Date(
        dataSubject.lastUpdated.getTime() + dataSubject.dataRetentionPeriod * 24 * 60 * 60 * 1000
      );

      if (now > retentionExpiry) {
        expired.push(dataSubject);
      } else if (now.getTime() - retentionExpiry.getTime() < 30 * 24 * 60 * 60 * 1000) { // 30 days warning
        expiring.push(dataSubject);
      }
    }

    return { expired, expiring };
  }

  async deleteExpiredData(): Promise<number> {
    const { expired } = await this.checkDataRetention();
    let deletedCount = 0;

    for (const dataSubject of expired) {
      const canDelete = await this.canDeleteDataSubject(dataSubject.id);
      if (canDelete) {
        await this.deleteDataSubject(dataSubject.id);
        deletedCount++;
      }
    }

    await auditLogger.logUserAction('expired_data_deleted', {
      deletedCount,
      totalExpired: expired.length
    });

    return deletedCount;
  }

  // Privacy Impact Assessment
  async conductPrivacyImpactAssessment(
    processingPurpose: string,
    dataCategories: string[],
    dataVolume: number,
    isAutomated: boolean,
    hasProfiling: boolean,
    thirdPartySharing: boolean
  ): Promise<{
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendations: string[];
    requiresDPIA: boolean;
  }> {
    let riskScore = 0;
    const recommendations: string[] = [];

    // Assess risk factors
    if (dataCategories.some(cat => this.dataCategories.get(cat)?.isSensitiveData)) {
      riskScore += 3;
      recommendations.push('Implement additional security measures for sensitive data');
    }

    if (isAutomated) {
      riskScore += 2;
      recommendations.push('Ensure human oversight for automated processing');
    }

    if (hasProfiling) {
      riskScore += 3;
      recommendations.push('Implement profiling safeguards and human review');
    }

    if (thirdPartySharing) {
      riskScore += 2;
      recommendations.push('Ensure adequate data protection agreements with third parties');
    }

    if (dataVolume > 10000) {
      riskScore += 1;
      recommendations.push('Consider data minimization principles');
    }

    const riskLevel = riskScore >= 6 ? 'HIGH' : riskScore >= 3 ? 'MEDIUM' : 'LOW';
    const requiresDPIA = riskLevel === 'HIGH' || (isAutomated && hasProfiling);

    return {
      riskLevel,
      recommendations,
      requiresDPIA
    };
  }

  // Reporting and Analytics
  getDataProtectionMetrics(): {
    totalDataSubjects: number;
    activeConsents: number;
    withdrawnConsents: number;
    pendingRequests: number;
    dataBreaches: number;
    processingRecords: number;
    retentionAlerts: number;
  } {
    const activeConsents = Array.from(this.consentRecords.values()).filter(c => c.isActive).length;
    const withdrawnConsents = Array.from(this.consentRecords.values()).filter(c => !c.isActive).length;
    const pendingRequests = Array.from(this.dataSubjectRequests.values()).filter(r => r.status === 'RECEIVED' || r.status === 'IN_PROGRESS').length;
    const { expiring } = this.checkDataRetention();

    return {
      totalDataSubjects: this.dataSubjects.size,
      activeConsents,
      withdrawnConsents,
      pendingRequests,
      dataBreaches: this.dataBreaches.size,
      processingRecords: this.processingRecords.size,
      retentionAlerts: expiring.length
    };
  }

  // Private helper methods
  private async canDeleteDataSubject(id: string): Promise<boolean> {
    // Check if there are any legal obligations to retain data
    const dataSubject = this.dataSubjects.get(id);
    if (!dataSubject) {
      return false;
    }

    // Check for active legal obligations
    for (const category of dataSubject.dataCategories) {
      if (category.legalBasis === 'LEGAL_OBLIGATION') {
        return false;
      }
    }

    // Check for pending data subject requests
    const pendingRequests = Array.from(this.dataSubjectRequests.values())
      .filter(r => r.dataSubjectId === id && (r.status === 'RECEIVED' || r.status === 'IN_PROGRESS'));

    return pendingRequests.length === 0;
  }

  private async notifyDataBreach(breach: DataBreach): Promise<void> {
    // In a real implementation, this would send notifications to:
    // - Supervisory authority (within 72 hours)
    // - Data subjects (if high risk)
    // - Internal stakeholders

    console.warn('DATA BREACH NOTIFICATION REQUIRED:', {
      breachId: breach.id,
      severity: breach.severity,
      affectedDataSubjects: breach.affectedDataSubjects,
      notificationDeadline: new Date(breach.discoveredDate.getTime() + 72 * 60 * 60 * 1000)
    });

    await auditLogger.logUserAction('data_breach_notification_sent', {
      breachId: breach.id,
      severity: breach.severity
    });
  }

  private initializeDataCategories(): void {
    const categories: DataCategory[] = [
      {
        id: 'personal_info',
        name: 'Personal Information',
        description: 'Basic personal details such as name, email, phone number',
        legalBasis: 'CONSENT',
        retentionPeriod: 365,
        isPersonalData: true,
        isSensitiveData: false,
        processingPurposes: ['User account management', 'Communication', 'Service delivery']
      },
      {
        id: 'financial_data',
        name: 'Financial Data',
        description: 'Financial information including payment details and transaction history',
        legalBasis: 'CONTRACT',
        retentionPeriod: 2555, // 7 years for financial records
        isPersonalData: true,
        isSensitiveData: true,
        processingPurposes: ['Payment processing', 'Financial reporting', 'Compliance']
      },
      {
        id: 'property_data',
        name: 'Property Data',
        description: 'Property-related information and search history',
        legalBasis: 'LEGITIMATE_INTERESTS',
        retentionPeriod: 1095, // 3 years
        isPersonalData: true,
        isSensitiveData: false,
        processingPurposes: ['Property search', 'Market analysis', 'Recommendations']
      },
      {
        id: 'usage_analytics',
        name: 'Usage Analytics',
        description: 'Website usage data and analytics',
        legalBasis: 'LEGITIMATE_INTERESTS',
        retentionPeriod: 730, // 2 years
        isPersonalData: true,
        isSensitiveData: false,
        processingPurposes: ['Service improvement', 'Analytics', 'Performance monitoring']
      }
    ];

    for (const category of categories) {
      this.dataCategories.set(category.id, category);
    }
  }

  private startDataRetentionMonitoring(): void {
    // Check data retention daily
    setInterval(async () => {
      await this.deleteExpiredData();
    }, 24 * 60 * 60 * 1000);
  }

  private startConsentMonitoring(): void {
    // Monitor consent validity every hour
    setInterval(() => {
      this.monitorConsentValidity();
    }, 60 * 60 * 1000);
  }

  private monitorConsentValidity(): void {
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    for (const [consentId, consent] of this.consentRecords) {
      if (consent.givenDate < oneYearAgo && consent.isActive) {
        // Consent is older than 1 year, consider re-consent
        console.warn('Consent may need renewal:', {
          consentId,
          dataSubjectId: consent.dataSubjectId,
          givenDate: consent.givenDate
        });
      }
    }
  }
}

// Export singleton instance
export const dataProtectionManager = DataProtectionManager.getInstance();
