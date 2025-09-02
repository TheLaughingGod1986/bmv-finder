// Comprehensive data encryption and security management

import { createCipher, createDecipher, createHash, randomBytes, timingSafeEqual } from 'crypto';
import { advancedCache } from '../advancedCache';

interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  saltLength: number;
  iterations: number;
}

interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  algorithm: string;
  timestamp: string;
}

interface KeyPair {
  publicKey: string;
  privateKey: string;
  algorithm: string;
  keyId: string;
  createdAt: string;
  expiresAt?: string;
}

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SecurityRule {
  id: string;
  type: 'encryption' | 'access_control' | 'data_retention' | 'audit';
  condition: string;
  action: string;
  parameters: Record<string, any>;
  priority: number;
}

interface DataClassification {
  id: string;
  name: string;
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  description: string;
  encryptionRequired: boolean;
  retentionPeriod: number; // days
  accessControls: string[];
}

class EncryptionManager {
  private config: EncryptionConfig;
  private keyPairs: Map<string, KeyPair> = new Map();
  private securityPolicies: Map<string, SecurityPolicy> = new Map();
  private dataClassifications: Map<string, DataClassification> = new Map();
  private encryptionKeys: Map<string, Buffer> = new Map();

  constructor() {
    this.config = {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      saltLength: 32,
      iterations: 100000
    };

    this.initializeSecurityPolicies();
    this.initializeDataClassifications();
    this.generateMasterKey();
  }

  // Initialize security policies
  private initializeSecurityPolicies(): void {
    const policies: SecurityPolicy[] = [
      {
        id: 'data-encryption-policy',
        name: 'Data Encryption Policy',
        description: 'Enforce encryption for sensitive data',
        rules: [
          {
            id: 'encrypt-pii',
            type: 'encryption',
            condition: 'dataType === "pii"',
            action: 'encrypt',
            parameters: { algorithm: 'aes-256-gcm', keyRotation: 90 },
            priority: 1
          },
          {
            id: 'encrypt-financial',
            type: 'encryption',
            condition: 'dataType === "financial"',
            action: 'encrypt',
            parameters: { algorithm: 'aes-256-gcm', keyRotation: 30 },
            priority: 1
          }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'access-control-policy',
        name: 'Access Control Policy',
        description: 'Control access to sensitive data',
        rules: [
          {
            id: 'restrict-admin-access',
            type: 'access_control',
            condition: 'userRole !== "admin"',
            action: 'deny',
            parameters: { resource: 'admin_data' },
            priority: 1
          }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    policies.forEach(policy => {
      this.securityPolicies.set(policy.id, policy);
    });
  }

  // Initialize data classifications
  private initializeDataClassifications(): void {
    const classifications: DataClassification[] = [
      {
        id: 'public',
        name: 'Public',
        level: 'public',
        description: 'Publicly accessible data',
        encryptionRequired: false,
        retentionPeriod: 365,
        accessControls: ['read']
      },
      {
        id: 'internal',
        name: 'Internal',
        level: 'internal',
        description: 'Internal company data',
        encryptionRequired: false,
        retentionPeriod: 2555, // 7 years
        accessControls: ['read', 'write']
      },
      {
        id: 'confidential',
        name: 'Confidential',
        level: 'confidential',
        description: 'Confidential business data',
        encryptionRequired: true,
        retentionPeriod: 2555,
        accessControls: ['read', 'write']
      },
      {
        id: 'restricted',
        name: 'Restricted',
        level: 'restricted',
        description: 'Highly sensitive data',
        encryptionRequired: true,
        retentionPeriod: 2555,
        accessControls: ['read']
      }
    ];

    classifications.forEach(classification => {
      this.dataClassifications.set(classification.id, classification);
    });
  }

  // Generate master encryption key
  private generateMasterKey(): void {
    const masterKey = randomBytes(this.config.keyLength);
    this.encryptionKeys.set('master', masterKey);
  }

  // Encrypt data
  async encryptData(data: any, classification: string = 'confidential', keyId?: string): Promise<EncryptedData> {
    try {
      const dataClassification = this.dataClassifications.get(classification);
      if (!dataClassification) {
        throw new Error(`Unknown data classification: ${classification}`);
      }

      // Check if encryption is required
      if (!dataClassification.encryptionRequired) {
        return {
          data: JSON.stringify(data),
          iv: '',
          salt: '',
          algorithm: 'none',
          timestamp: new Date().toISOString()
        };
      }

      // Get encryption key
      const key = keyId ? this.encryptionKeys.get(keyId) : this.encryptionKeys.get('master');
      if (!key) {
        throw new Error('Encryption key not found');
      }

      // Generate IV and salt
      const iv = randomBytes(this.config.ivLength);
      const salt = randomBytes(this.config.saltLength);

      // Convert data to string
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);

      // Encrypt data
      const cipher = createCipher(this.config.algorithm, key);
      cipher.setAAD(Buffer.from(classification));
      
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();

      return {
        data: encrypted + ':' + authTag.toString('hex'),
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        algorithm: this.config.algorithm,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  // Decrypt data
  async decryptData(encryptedData: EncryptedData, classification: string = 'confidential', keyId?: string): Promise<any> {
    try {
      // Check if data is encrypted
      if (encryptedData.algorithm === 'none') {
        return JSON.parse(encryptedData.data);
      }

      // Get decryption key
      const key = keyId ? this.encryptionKeys.get(keyId) : this.encryptionKeys.get('master');
      if (!key) {
        throw new Error('Decryption key not found');
      }

      // Parse encrypted data
      const [encrypted, authTagHex] = encryptedData.data.split(':');
      const authTag = Buffer.from(authTagHex, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');

      // Decrypt data
      const decipher = createDecipher(this.config.algorithm, key);
      decipher.setAAD(Buffer.from(classification));
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }

    } catch (error: any) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  // Hash sensitive data
  hashData(data: string, salt?: string): { hash: string; salt: string } {
    const dataSalt = salt || randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(data + dataSalt).digest('hex');
    return { hash, salt: dataSalt };
  }

  // Verify hashed data
  verifyHash(data: string, hash: string, salt: string): boolean {
    const testHash = createHash('sha256').update(data + salt).digest('hex');
    return timingSafeEqual(Buffer.from(hash), Buffer.from(testHash));
  }

  // Generate key pair
  generateKeyPair(algorithm: string = 'rsa', keySize: number = 2048): KeyPair {
    const crypto = require('crypto');
    const { publicKey, privateKey } = crypto.generateKeyPairSync(algorithm, {
      modulusLength: keySize,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    const keyPair: KeyPair = {
      publicKey,
      privateKey,
      algorithm,
      keyId: this.generateKeyId(),
      createdAt: new Date().toISOString()
    };

    this.keyPairs.set(keyPair.keyId, keyPair);
    return keyPair;
  }

  // Encrypt with public key
  encryptWithPublicKey(data: string, publicKey: string): string {
    const crypto = require('crypto');
    const buffer = Buffer.from(data, 'utf8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
  }

  // Decrypt with private key
  decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
    const crypto = require('crypto');
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf8');
  }

  // Sign data
  signData(data: string, privateKey: string): string {
    const crypto = require('crypto');
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'hex');
  }

  // Verify signature
  verifySignature(data: string, signature: string, publicKey: string): boolean {
    const crypto = require('crypto');
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    return verify.verify(publicKey, signature, 'hex');
  }

  // Apply security policy
  async applySecurityPolicy(data: any, context: Record<string, any>): Promise<any> {
    for (const policy of this.securityPolicies.values()) {
      if (!policy.isActive) continue;

      for (const rule of policy.rules) {
        if (this.evaluateRule(rule, context)) {
          data = await this.executeRule(rule, data, context);
        }
      }
    }

    return data;
  }

  // Evaluate security rule
  private evaluateRule(rule: SecurityRule, context: Record<string, any>): boolean {
    try {
      // Simple condition evaluation (in production, use a proper expression evaluator)
      const condition = rule.condition.replace(/(\w+)/g, (match) => {
        return context[match] !== undefined ? JSON.stringify(context[match]) : match;
      });
      
      return eval(condition);
    } catch {
      return false;
    }
  }

  // Execute security rule
  private async executeRule(rule: SecurityRule, data: any, context: Record<string, any>): Promise<any> {
    switch (rule.type) {
      case 'encryption':
        if (rule.action === 'encrypt') {
          const classification = context.dataType || 'confidential';
          return await this.encryptData(data, classification);
        }
        break;
      
      case 'access_control':
        if (rule.action === 'deny') {
          throw new Error('Access denied by security policy');
        }
        break;
      
      case 'data_retention':
        // Implement data retention logic
        break;
      
      case 'audit':
        // Log audit event
        console.log(`Audit: ${rule.id} applied to data`);
        break;
    }

    return data;
  }

  // Secure data storage
  async storeSecureData(key: string, data: any, classification: string = 'confidential'): Promise<void> {
    const encryptedData = await this.encryptData(data, classification);
    await advancedCache.set(`secure:${key}`, encryptedData, 24 * 60 * 60); // 24 hours
  }

  // Retrieve secure data
  async retrieveSecureData(key: string, classification: string = 'confidential'): Promise<any> {
    const encryptedData = await advancedCache.get<EncryptedData>(`secure:${key}`);
    if (!encryptedData) {
      throw new Error('Secure data not found');
    }

    return await this.decryptData(encryptedData, classification);
  }

  // Data masking
  maskData(data: any, fields: string[], maskChar: string = '*'): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const masked = { ...data };
    
    for (const field of fields) {
      if (masked[field]) {
        const value = String(masked[field]);
        const maskedValue = value.length > 4 
          ? value.substring(0, 2) + maskChar.repeat(value.length - 4) + value.substring(value.length - 2)
          : maskChar.repeat(value.length);
        masked[field] = maskedValue;
      }
    }

    return masked;
  }

  // Data anonymization
  anonymizeData(data: any, fields: string[]): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const anonymized = { ...data };
    
    for (const field of fields) {
      if (anonymized[field]) {
        const hash = createHash('sha256').update(String(anonymized[field])).digest('hex');
        anonymized[field] = hash.substring(0, 8);
      }
    }

    return anonymized;
  }

  // Key rotation
  async rotateEncryptionKey(keyId: string): Promise<boolean> {
    try {
      const newKey = randomBytes(this.config.keyLength);
      this.encryptionKeys.set(keyId, newKey);
      
      // In production, you would re-encrypt all data with the new key
      console.log(`Encryption key ${keyId} rotated successfully`);
      return true;
    } catch (error) {
      console.error(`Key rotation failed for ${keyId}:`, error);
      return false;
    }
  }

  // Security audit
  getSecurityAudit(): {
    keyCount: number;
    policyCount: number;
    classificationCount: number;
    lastKeyRotation: string;
    securityScore: number;
  } {
    const keyCount = this.encryptionKeys.size;
    const policyCount = this.securityPolicies.size;
    const classificationCount = this.dataClassifications.size;
    
    // Calculate security score based on various factors
    let securityScore = 0;
    if (keyCount > 0) securityScore += 25;
    if (policyCount > 0) securityScore += 25;
    if (classificationCount > 0) securityScore += 25;
    
    // Check if encryption is enforced for sensitive data
    const confidentialClassification = this.dataClassifications.get('confidential');
    if (confidentialClassification?.encryptionRequired) {
      securityScore += 25;
    }

    return {
      keyCount,
      policyCount,
      classificationCount,
      lastKeyRotation: new Date().toISOString(),
      securityScore
    };
  }

  // Utility methods
  private generateKeyId(): string {
    return `key_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  // Public methods
  getDataClassification(classificationId: string): DataClassification | undefined {
    return this.dataClassifications.get(classificationId);
  }

  getSecurityPolicy(policyId: string): SecurityPolicy | undefined {
    return this.securityPolicies.get(policyId);
  }

  addSecurityPolicy(policy: SecurityPolicy): void {
    this.securityPolicies.set(policy.id, policy);
  }

  updateSecurityPolicy(policyId: string, updates: Partial<SecurityPolicy>): boolean {
    const policy = this.securityPolicies.get(policyId);
    if (!policy) return false;

    const updatedPolicy = { ...policy, ...updates, updatedAt: new Date().toISOString() };
    this.securityPolicies.set(policyId, updatedPolicy);
    return true;
  }
}

// Singleton instance
export const encryptionManager = new EncryptionManager();

// Export types
export type { EncryptionConfig, EncryptedData, KeyPair, SecurityPolicy, SecurityRule, DataClassification };
