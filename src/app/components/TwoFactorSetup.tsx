'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Smartphone, Key, Download, Copy, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useProductionAuth } from '@/lib/auth/productionAuthProvider';

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface SetupData {
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
}

export default function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const { user } = useProductionAuth();

  // Initialize 2FA setup
  useEffect(() => {
    if (step === 'setup' && !setupData) {
      initializeSetup();
    }
  }, [step, setupData]);

  const initializeSetup = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setSetupData(result.data);
      } else {
        setError(result.error || 'Failed to initialize 2FA setup');
      }
    } catch (error) {
      setError('Failed to initialize 2FA setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      const result = await response.json();

      if (result.success) {
        setStep('complete');
        setSuccess('2FA has been enabled successfully!');
      } else {
        setError(result.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    if (setupData?.backupCodes) {
      const codesText = setupData.backupCodes.join('\n');
      await navigator.clipboard.writeText(codesText);
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  const downloadBackupCodes = () => {
    if (setupData?.backupCodes) {
      const codesText = setupData.backupCodes.join('\n');
      const blob = new Blob([codesText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '2fa-backup-codes.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (loading && !setupData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up 2FA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Set Up Two-Factor Authentication</h2>
              <p className="text-gray-600">Add an extra layer of security to your account</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'setup' && setupData && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Step 1: Install Authenticator App */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    Step 1: Install an Authenticator App
                  </h3>
                  <p className="text-blue-800 mb-3">
                    Download and install an authenticator app on your mobile device:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <a
                      href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-white rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">G</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Google Authenticator</p>
                        <p className="text-sm text-gray-600">Android & iOS</p>
                      </div>
                    </a>
                    <a
                      href="https://authy.com/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-white rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">A</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Authy</p>
                        <p className="text-sm text-gray-600">Android & iOS</p>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Step 2: Scan QR Code */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center">
                    <Key className="w-5 h-5 mr-2" />
                    Step 2: Scan QR Code
                  </h3>
                  <p className="text-green-800 mb-4">
                    Open your authenticator app and scan this QR code:
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={setupData.qrCodeUrl}
                      alt="2FA QR Code"
                      className="w-48 h-48 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-green-700 mt-3 text-center">
                    Can't scan? Enter this key manually: <code className="bg-white px-2 py-1 rounded border">{setupData.manualEntryKey}</code>
                  </p>
                </div>

                {/* Step 3: Enter Verification Code */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    Step 3: Enter Verification Code
                  </h3>
                  <p className="text-yellow-800 mb-4">
                    Enter the 6-digit code from your authenticator app:
                  </p>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                    />
                    <button
                      onClick={handleVerification}
                      disabled={loading || verificationCode.length !== 6}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {/* Backup Codes */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center">
                    <Key className="w-5 h-5 mr-2" />
                    Step 4: Save Backup Codes
                  </h3>
                  <p className="text-red-800 mb-4">
                    Save these backup codes in a safe place. You can use them to access your account if you lose your phone:
                  </p>
                  
                  <div className="bg-white border border-red-300 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Backup Codes</h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowBackupCodes(!showBackupCodes)}
                          className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          {showBackupCodes ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                          {showBackupCodes ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={copyBackupCodes}
                          className="flex items-center px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          {copiedCodes ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={downloadBackupCodes}
                          className="flex items-center px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                    
                    {showBackupCodes ? (
                      <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                        {setupData.backupCodes.map((code, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded border text-center">
                            {code}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        Click "Show" to reveal backup codes
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-red-700">
                    ⚠️ Each backup code can only be used once. Store them securely!
                  </p>
                </div>
              </motion.div>
            )}

            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">2FA Enabled Successfully!</h3>
                  <p className="text-gray-600">
                    Your account is now protected with two-factor authentication. You'll need to enter a code from your authenticator app each time you sign in.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">Important Reminders:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1 text-left">
                    <li>• Keep your backup codes in a safe place</li>
                    <li>• Don't share your authenticator app or backup codes</li>
                    <li>• You can regenerate backup codes anytime in your account settings</li>
                  </ul>
                </div>

                <button
                  onClick={onComplete}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Continue to Account
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
            >
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2"
            >
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-700">{success}</span>
            </motion.div>
          )}

          {/* Actions */}
          {step === 'setup' && (
            <div className="flex justify-between mt-6">
              <button
                onClick={onCancel}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <div className="text-sm text-gray-500">
                Step 1 of 3
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
