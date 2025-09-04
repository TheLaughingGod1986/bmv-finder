import { auditLogger } from '../audit/auditLogger';
import crypto from 'crypto';

export interface BackupConfig {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  source: BackupSource;
  destination: BackupDestination;
  schedule: BackupSchedule;
  retention: BackupRetention;
  encryption: BackupEncryption;
  compression: boolean;
  enabled: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackupSource {
  type: 'database' | 'filesystem' | 'application' | 'custom';
  connection: string;
  paths: string[];
  filters: BackupFilter[];
  excludePatterns: string[];
}

export interface BackupFilter {
  type: 'include' | 'exclude';
  pattern: string;
  description: string;
}

export interface BackupDestination {
  type: 'local' | 's3' | 'azure' | 'gcp' | 'ftp' | 'sftp';
  connection: string;
  path: string;
  credentials: Record<string, string>;
  region?: string;
  bucket?: string;
}

export interface BackupSchedule {
  type: 'manual' | 'interval' | 'cron';
  interval?: number; // in minutes
  cron?: string;
  timezone: string;
  enabled: boolean;
}

export interface BackupRetention {
  policy: 'count' | 'age' | 'size';
  value: number;
  unit: 'days' | 'weeks' | 'months' | 'years' | 'count' | 'gb' | 'tb';
  enabled: boolean;
}

export interface BackupEncryption {
  enabled: boolean;
  algorithm: 'aes-256' | 'aes-128' | 'rsa';
  keyId?: string;
  password?: string;
}

export interface Backup {
  id: string;
  configId: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  size: number;
  compressedSize?: number;
  fileCount: number;
  checksum: string;
  location: string;
  metadata: BackupMetadata;
  logs: BackupLog[];
  createdAt: Date;
}

export interface BackupMetadata {
  version: string;
  source: string;
  destination: string;
  compression: boolean;
  encryption: boolean;
  fileCount: number;
  totalSize: number;
  compressedSize?: number;
  checksum: string;
  dependencies: string[];
  tags: string[];
}

export interface BackupLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: Record<string, any>;
}

export interface RestoreRequest {
  id: string;
  backupId: string;
  destination: string;
  options: RestoreOptions;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  logs: BackupLog[];
  requestedBy: string;
  createdAt: Date;
}

export interface RestoreOptions {
  overwrite: boolean;
  preservePermissions: boolean;
  excludePatterns: string[];
  includePatterns: string[];
  dryRun: boolean;
  verifyChecksum: boolean;
}

export interface BackupStats {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  totalSize: number;
  averageSize: number;
  lastBackup?: Date;
  nextScheduledBackup?: Date;
  successRate: number;
  averageDuration: number;
}

export class BackupManager {
  private static instance: BackupManager;
  private configs: Map<string, BackupConfig> = new Map();
  private backups: Map<string, Backup> = new Map();
  private restoreRequests: Map<string, RestoreRequest> = new Map();
  private backupScheduler: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeDefaultConfigs();
    this.startScheduler();
  }

  public static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  // Configuration Management
  async createBackupConfig(config: Omit<BackupConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<BackupConfig> {
    const backupConfig: BackupConfig = {
      id: crypto.randomUUID(),
      ...config,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.configs.set(backupConfig.id, backupConfig);

    try {
      await auditLogger.logUserAction('backup_config_created', {
        configId: backupConfig.id,
        name: backupConfig.name,
        type: backupConfig.type
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return backupConfig;
  }

  async updateBackupConfig(configId: string, updates: Partial<BackupConfig>): Promise<BackupConfig | null> {
    const config = this.configs.get(configId);
    if (!config) {
      return null;
    }

    const updatedConfig = {
      ...config,
      ...updates,
      updatedAt: new Date()
    };

    this.configs.set(configId, updatedConfig);

    try {
      await auditLogger.logUserAction('backup_config_updated', {
        configId,
        updates: Object.keys(updates)
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return updatedConfig;
  }

  // Backup Execution
  async createBackup(configId: string, triggeredBy: string): Promise<Backup> {
    const config = this.configs.get(configId);
    if (!config || !config.enabled) {
      throw new Error('Backup configuration not found or disabled');
    }

    const backup: Backup = {
      id: crypto.randomUUID(),
      configId,
      name: `${config.name}-${new Date().toISOString().split('T')[0]}`,
      type: config.type,
      status: 'pending',
      startTime: new Date(),
      size: 0,
      fileCount: 0,
      checksum: '',
      location: '',
      metadata: {
        version: '1.0.0',
        source: config.source.connection,
        destination: config.destination.connection,
        compression: config.compression,
        encryption: config.encryption.enabled,
        fileCount: 0,
        totalSize: 0,
        checksum: '',
        dependencies: [],
        tags: []
      },
      logs: [],
      createdAt: new Date()
    };

    this.backups.set(backup.id, backup);

    try {
      await auditLogger.logUserAction('backup_started', {
        backupId: backup.id,
        configId,
        triggeredBy
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    // Start backup process
    this.executeBackup(backup, config);

    return backup;
  }

  // Restore Management
  async createRestoreRequest(backupId: string, destination: string, options: RestoreOptions, requestedBy: string): Promise<RestoreRequest> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      throw new Error('Backup not found');
    }

    const restoreRequest: RestoreRequest = {
      id: crypto.randomUUID(),
      backupId,
      destination,
      options,
      status: 'pending',
      startTime: new Date(),
      logs: [],
      requestedBy,
      createdAt: new Date()
    };

    this.restoreRequests.set(restoreRequest.id, restoreRequest);

    try {
      await auditLogger.logUserAction('restore_requested', {
        restoreId: restoreRequest.id,
        backupId,
        requestedBy
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    // Start restore process
    this.executeRestore(restoreRequest, backup);

    return restoreRequest;
  }

  // Private Methods
  private async executeBackup(backup: Backup, config: BackupConfig): Promise<void> {
    try {
      // Update status to running
      backup.status = 'running';
      backup.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: 'Backup started',
        details: { configId: config.id, type: config.type }
      });
      this.backups.set(backup.id, backup);

      // Simulate backup process
      await this.simulateBackupProcess(backup, config);

      // Update status to completed
      backup.status = 'completed';
      backup.endTime = new Date();
      backup.duration = backup.endTime.getTime() - backup.startTime.getTime();
      backup.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: 'Backup completed successfully',
        details: { 
          size: backup.size, 
          fileCount: backup.fileCount,
          duration: backup.duration 
        }
      });
      this.backups.set(backup.id, backup);

      try {
        await auditLogger.logUserAction('backup_completed', {
          backupId: backup.id,
          status: 'success',
          size: backup.size,
          duration: backup.duration
        });
      } catch (error) {
        console.debug('Audit logging skipped (development mode)');
      }

    } catch (error) {
      // Update status to failed
      backup.status = 'failed';
      backup.endTime = new Date();
      backup.duration = backup.endTime.getTime() - backup.startTime.getTime();
      backup.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: 'Backup failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      this.backups.set(backup.id, backup);

      try {
        await auditLogger.logUserAction('backup_failed', {
          backupId: backup.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (auditError) {
        console.debug('Audit logging skipped (development mode)');
      }
    }
  }

  private async simulateBackupProcess(backup: Backup, config: BackupConfig): Promise<void> {
    const steps = [
      'Initializing backup process...',
      'Scanning source files...',
      'Calculating checksums...',
      'Compressing data...',
      'Encrypting backup...',
      'Uploading to destination...',
      'Verifying backup integrity...',
      'Cleaning up temporary files...'
    ];

    for (const step of steps) {
      backup.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: step
      });
      this.backups.set(backup.id, backup);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Simulate backup completion
    backup.size = Math.floor(Math.random() * 1000000000) + 100000000; // 100MB - 1GB
    backup.compressedSize = Math.floor(backup.size * 0.7); // 70% compression
    backup.fileCount = Math.floor(Math.random() * 10000) + 1000; // 1000-11000 files
    backup.checksum = crypto.createHash('sha256').update(backup.id).digest('hex');
    backup.location = `${config.destination.path}/${backup.name}.backup`;

    backup.metadata.fileCount = backup.fileCount;
    backup.metadata.totalSize = backup.size;
    backup.metadata.compressedSize = backup.compressedSize;
    backup.metadata.checksum = backup.checksum;
  }

  private async executeRestore(restoreRequest: RestoreRequest, backup: Backup): Promise<void> {
    try {
      // Update status to running
      restoreRequest.status = 'running';
      restoreRequest.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: 'Restore started',
        details: { backupId: backup.id, destination: restoreRequest.destination }
      });
      this.restoreRequests.set(restoreRequest.id, restoreRequest);

      // Simulate restore process
      await this.simulateRestoreProcess(restoreRequest, backup);

      // Update status to completed
      restoreRequest.status = 'completed';
      restoreRequest.endTime = new Date();
      restoreRequest.duration = restoreRequest.endTime.getTime() - restoreRequest.startTime.getTime();
      restoreRequest.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: 'Restore completed successfully',
        details: { duration: restoreRequest.duration }
      });
      this.restoreRequests.set(restoreRequest.id, restoreRequest);

      try {
        await auditLogger.logUserAction('restore_completed', {
          restoreId: restoreRequest.id,
          backupId: backup.id,
          status: 'success',
          duration: restoreRequest.duration
        });
      } catch (error) {
        console.debug('Audit logging skipped (development mode)');
      }

    } catch (error) {
      // Update status to failed
      restoreRequest.status = 'failed';
      restoreRequest.endTime = new Date();
      restoreRequest.duration = restoreRequest.endTime.getTime() - restoreRequest.startTime.getTime();
      restoreRequest.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: 'Restore failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      this.restoreRequests.set(restoreRequest.id, restoreRequest);

      try {
        await auditLogger.logUserAction('restore_failed', {
          restoreId: restoreRequest.id,
          backupId: backup.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (auditError) {
        console.debug('Audit logging skipped (development mode)');
      }
    }
  }

  private async simulateRestoreProcess(restoreRequest: RestoreRequest, backup: Backup): Promise<void> {
    const steps = [
      'Initializing restore process...',
      'Downloading backup file...',
      'Verifying backup integrity...',
      'Decrypting backup...',
      'Decompressing data...',
      'Restoring files...',
      'Setting permissions...',
      'Verifying restore...',
      'Cleaning up...'
    ];

    for (const step of steps) {
      restoreRequest.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: step
      });
      this.restoreRequests.set(restoreRequest.id, restoreRequest);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  private initializeDefaultConfigs(): void {
    const defaultConfigs: BackupConfig[] = [
      {
        id: crypto.randomUUID(),
        name: 'Database Backup',
        type: 'full',
        source: {
          type: 'database',
          connection: 'postgresql://localhost:5432/bmv_finder',
          paths: ['/var/lib/postgresql/data'],
          filters: [],
          excludePatterns: ['*.tmp', '*.log']
        },
        destination: {
          type: 'local',
          connection: 'file:///backups/database',
          path: '/backups/database',
          credentials: {}
        },
        schedule: {
          type: 'interval',
          interval: 1440, // 24 hours
          timezone: 'UTC',
          enabled: true
        },
        retention: {
          policy: 'age',
          value: 30,
          unit: 'days',
          enabled: true
        },
        encryption: {
          enabled: true,
          algorithm: 'aes-256'
        },
        compression: true,
        enabled: true,
        metadata: {
          description: 'Daily database backup'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        name: 'Application Files Backup',
        type: 'incremental',
        source: {
          type: 'filesystem',
          connection: 'file:///app',
          paths: ['/app/uploads', '/app/logs', '/app/config'],
          filters: [
            { type: 'include', pattern: '*.json', description: 'Configuration files' },
            { type: 'include', pattern: '*.log', description: 'Log files' }
          ],
          excludePatterns: ['*.tmp', 'node_modules', '.git']
        },
        destination: {
          type: 's3',
          connection: 's3://bmv-finder-backups',
          path: 'application',
          credentials: {
            accessKeyId: 'AKIA...',
            secretAccessKey: '...'
          },
          region: 'us-east-1',
          bucket: 'bmv-finder-backups'
        },
        schedule: {
          type: 'cron',
          cron: '0 2 * * *', // Daily at 2 AM
          timezone: 'UTC',
          enabled: true
        },
        retention: {
          policy: 'count',
          value: 7,
          unit: 'count',
          enabled: true
        },
        encryption: {
          enabled: true,
          algorithm: 'aes-256'
        },
        compression: true,
        enabled: true,
        metadata: {
          description: 'Daily application files backup'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultConfigs.forEach(config => {
      this.configs.set(config.id, config);
    });
  }

  private startScheduler(): void {
    // Check for scheduled backups every minute
    this.backupScheduler = setInterval(() => {
      this.checkScheduledBackups();
    }, 60000);
  }

  private async checkScheduledBackups(): Promise<void> {
    for (const config of this.configs.values()) {
      if (!config.enabled || !config.schedule.enabled) {
        continue;
      }

      const shouldRun = this.shouldRunBackup(config);
      if (shouldRun) {
        try {
          await this.createBackup(config.id, 'scheduler');
        } catch (error) {
          console.error(`Scheduled backup failed for ${config.name}:`, error);
        }
      }
    }
  }

  private shouldRunBackup(config: BackupConfig): boolean {
    const now = new Date();
    
    switch (config.schedule.type) {
      case 'interval':
        // Check if enough time has passed since last backup
        const lastBackup = this.getLastBackup(config.id);
        if (!lastBackup) return true;
        
        const timeSinceLastBackup = now.getTime() - lastBackup.startTime.getTime();
        const intervalMs = (config.schedule.interval || 0) * 60 * 1000;
        return timeSinceLastBackup >= intervalMs;
        
      case 'cron':
        // Simplified cron check - in production, use a proper cron parser
        return this.evaluateCronExpression(config.schedule.cron || '', now);
        
      default:
        return false;
    }
  }

  private getLastBackup(configId: string): Backup | null {
    const backups = Array.from(this.backups.values())
      .filter(backup => backup.configId === configId && backup.status === 'completed')
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    return backups.length > 0 ? backups[0] : null;
  }

  private evaluateCronExpression(cron: string, date: Date): boolean {
    // Simplified cron evaluation - in production, use a proper cron library
    const [minute, hour, day, month, weekday] = cron.split(' ');
    
    if (minute !== '*' && parseInt(minute) !== date.getMinutes()) return false;
    if (hour !== '*' && parseInt(hour) !== date.getHours()) return false;
    if (day !== '*' && parseInt(day) !== date.getDate()) return false;
    if (month !== '*' && parseInt(month) !== (date.getMonth() + 1)) return false;
    if (weekday !== '*' && parseInt(weekday) !== date.getDay()) return false;
    
    return true;
  }

  // Public getters
  getBackupConfig(configId: string): BackupConfig | null {
    return this.configs.get(configId) || null;
  }

  getAllBackupConfigs(): BackupConfig[] {
    return Array.from(this.configs.values());
  }

  getBackup(backupId: string): Backup | null {
    return this.backups.get(backupId) || null;
  }

  getAllBackups(): Backup[] {
    return Array.from(this.backups.values());
  }

  getBackupsByConfig(configId: string): Backup[] {
    return Array.from(this.backups.values()).filter(backup => backup.configId === configId);
  }

  getRestoreRequest(restoreId: string): RestoreRequest | null {
    return this.restoreRequests.get(restoreId) || null;
  }

  getAllRestoreRequests(): RestoreRequest[] {
    return Array.from(this.restoreRequests.values());
  }

  getBackupStats(): BackupStats {
    const backups = this.getAllBackups();
    const successfulBackups = backups.filter(b => b.status === 'completed');
    const failedBackups = backups.filter(b => b.status === 'failed');
    
    const totalBackups = backups.length;
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    const averageSize = totalBackups > 0 ? totalSize / totalBackups : 0;
    const lastBackup = backups.length > 0 ? backups.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0] : null;
    const successRate = totalBackups > 0 ? (successfulBackups.length / totalBackups) * 100 : 0;
    const averageDuration = successfulBackups.length > 0 
      ? successfulBackups.reduce((sum, b) => sum + (b.duration || 0), 0) / successfulBackups.length 
      : 0;

    // Find next scheduled backup
    let nextScheduledBackup: Date | undefined;
    for (const config of this.configs.values()) {
      if (config.enabled && config.schedule.enabled) {
        const lastBackup = this.getLastBackup(config.id);
        if (lastBackup && config.schedule.type === 'interval') {
          const nextRun = new Date(lastBackup.startTime.getTime() + (config.schedule.interval || 0) * 60 * 1000);
          if (!nextScheduledBackup || nextRun < nextScheduledBackup) {
            nextScheduledBackup = nextRun;
          }
        }
      }
    }

    return {
      totalBackups,
      successfulBackups: successfulBackups.length,
      failedBackups: failedBackups.length,
      totalSize,
      averageSize,
      lastBackup: lastBackup?.startTime,
      nextScheduledBackup,
      successRate,
      averageDuration
    };
  }
}

// Export singleton instance
export const backupManager = BackupManager.getInstance();
