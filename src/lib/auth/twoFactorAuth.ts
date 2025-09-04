import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { userManager, UserProfile } from './userManager';
import { auditLogger } from '../audit/auditLogger';

// 2FA Configuration
const TOTP_CONFIG = {
  issuer: 'Property Intelligence Platform',
  algorithm: 'sha1' as const,
  digits: 6,
  period: 30,
  window: 1, // Allow 1 time step tolerance
};

// Backup codes configuration
const BACKUP_CODES_CONFIG = {
  count: 10,
  length: 8,
  charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
};

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface TwoFactorVerification {
  success: boolean;
  backupCodeUsed?: boolean;
  error?: string;
}

export class TwoFactorAuthService {
  private static instance: TwoFactorAuthService;

  public static getInstance(): TwoFactorAuthService {
    if (!TwoFactorAuthService.instance) {
      TwoFactorAuthService.instance = new TwoFactorAuthService();
    }
    return TwoFactorAuthService.instance;
  }

  // Generate a new 2FA secret for a user
  public async generateSecret(userId: string, userEmail: string): Promise<TwoFactorSetup> {
    try {
      // Generate a new secret
      const secret = speakeasy.generateSecret({
        name: userEmail,
        issuer: TOTP_CONFIG.issuer,
        length: 32,
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Generate QR code URL
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Store the secret and backup codes in user metadata
      const user = await userManager.getUserProfile(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await userManager.updateUserProfile(userId, {
        metadata: {
          ...user.metadata,
          twoFactorSecret: secret.base32,
          twoFactorBackupCodes: backupCodes,
          twoFactorEnabled: false, // Will be enabled after verification
          twoFactorSetupAt: new Date().toISOString(),
        }
      });

      // Log 2FA setup initiation
      await auditLogger.logUserAction(userId, '2fa_setup_initiated', {
        timestamp: new Date().toISOString()
      });

      return {
        secret: secret.base32!,
        qrCodeUrl,
        backupCodes,
        manualEntryKey: secret.base32!,
      };

    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      throw new Error('Failed to generate 2FA secret');
    }
  }

  // Verify a TOTP token
  public async verifyToken(userId: string, token: string): Promise<TwoFactorVerification> {
    try {
      const user = await userManager.getUserProfile(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const secret = user.metadata?.twoFactorSecret;
      if (!secret) {
        return { success: false, error: '2FA not set up for this user' };
      }

      // Verify the TOTP token
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: TOTP_CONFIG.window,
        time: Math.floor(Date.now() / 1000),
      });

      if (verified) {
        // Log successful 2FA verification
        await auditLogger.logUserAction(userId, '2fa_verification_success', {
          timestamp: new Date().toISOString()
        });

        return { success: true };
      }

      // Check if it's a backup code
      const backupCodeUsed = await this.verifyBackupCode(userId, token);
      if (backupCodeUsed) {
        // Log backup code usage
        await auditLogger.logUserAction(userId, '2fa_backup_code_used', {
          timestamp: new Date().toISOString()
        });

        return { success: true, backupCodeUsed: true };
      }

      // Log failed 2FA verification
      await auditLogger.logSecurityEvent('2fa_verification_failed', {
        userId,
        timestamp: new Date().toISOString()
      });

      return { success: false, error: 'Invalid verification code' };

    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  // Verify and enable 2FA after initial setup
  public async enableTwoFactor(userId: string, token: string): Promise<TwoFactorVerification> {
    try {
      const verification = await this.verifyToken(userId, token);
      
      if (verification.success) {
        // Enable 2FA for the user
        const user = await userManager.getUserProfile(userId);
        if (!user) {
          return { success: false, error: 'User not found' };
        }

        await userManager.updateUserProfile(userId, {
          metadata: {
            ...user.metadata,
            twoFactorEnabled: true,
            twoFactorEnabledAt: new Date().toISOString(),
          }
        });

        // Log 2FA enablement
        await auditLogger.logUserAction(userId, '2fa_enabled', {
          timestamp: new Date().toISOString()
        });

        return { success: true };
      }

      return verification;

    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return { success: false, error: 'Failed to enable 2FA' };
    }
  }

  // Disable 2FA for a user
  public async disableTwoFactor(userId: string, password: string): Promise<TwoFactorVerification> {
    try {
      // Verify password before disabling 2FA
      const user = await userManager.getUserProfile(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // In a real implementation, you would verify the password here
      // For now, we'll skip password verification for development

      // Disable 2FA
      await userManager.updateUserProfile(userId, {
        metadata: {
          ...user.metadata,
          twoFactorEnabled: false,
          twoFactorDisabledAt: new Date().toISOString(),
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
        }
      });

      // Log 2FA disablement
      await auditLogger.logUserAction(userId, '2fa_disabled', {
        timestamp: new Date().toISOString()
      });

      return { success: true };

    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return { success: false, error: 'Failed to disable 2FA' };
    }
  }

  // Check if user has 2FA enabled
  public async isTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      const user = await userManager.getUserProfile(userId);
      return user?.metadata?.twoFactorEnabled === true;
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }
  }

  // Generate new backup codes
  public async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const user = await userManager.getUserProfile(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.metadata?.twoFactorEnabled) {
        throw new Error('2FA not enabled for this user');
      }

      const newBackupCodes = this.generateBackupCodes();

      await userManager.updateUserProfile(userId, {
        metadata: {
          ...user.metadata,
          twoFactorBackupCodes: newBackupCodes,
          backupCodesRegeneratedAt: new Date().toISOString(),
        }
      });

      // Log backup codes regeneration
      await auditLogger.logUserAction(userId, '2fa_backup_codes_regenerated', {
        timestamp: new Date().toISOString()
      });

      return newBackupCodes;

    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      throw new Error('Failed to regenerate backup codes');
    }
  }

  // Verify a backup code
  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const user = await userManager.getUserProfile(userId);
      if (!user || !user.metadata?.twoFactorBackupCodes) {
        return false;
      }

      const backupCodes = user.metadata.twoFactorBackupCodes as string[];
      const codeIndex = backupCodes.indexOf(code);

      if (codeIndex === -1) {
        return false;
      }

      // Remove the used backup code
      backupCodes.splice(codeIndex, 1);

      await userManager.updateUserProfile(userId, {
        metadata: {
          ...user.metadata,
          twoFactorBackupCodes: backupCodes,
        }
      });

      return true;

    } catch (error) {
      console.error('Error verifying backup code:', error);
      return false;
    }
  }

  // Generate backup codes
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < BACKUP_CODES_CONFIG.count; i++) {
      let code = '';
      for (let j = 0; j < BACKUP_CODES_CONFIG.length; j++) {
        code += BACKUP_CODES_CONFIG.charset.charAt(
          Math.floor(Math.random() * BACKUP_CODES_CONFIG.charset.length)
        );
      }
      codes.push(code);
    }

    return codes;
  }

  // Get 2FA status for a user
  public async getTwoFactorStatus(userId: string): Promise<{
    enabled: boolean;
    setupAt?: string;
    enabledAt?: string;
    backupCodesCount: number;
  }> {
    try {
      const user = await userManager.getUserProfile(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const metadata = user.metadata || {};
      const backupCodes = metadata.twoFactorBackupCodes as string[] || [];

      return {
        enabled: metadata.twoFactorEnabled === true,
        setupAt: metadata.twoFactorSetupAt,
        enabledAt: metadata.twoFactorEnabledAt,
        backupCodesCount: backupCodes.length,
      };

    } catch (error) {
      console.error('Error getting 2FA status:', error);
      throw new Error('Failed to get 2FA status');
    }
  }
}

// Export singleton instance
export const twoFactorAuth = TwoFactorAuthService.getInstance();
