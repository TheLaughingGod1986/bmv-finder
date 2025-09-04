'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface TwoFactorVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
  userEmail: string;
}

export default function TwoFactorVerification({ onSuccess, onCancel, userEmail }: TwoFactorVerificationProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackupCode, setIsBackupCode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length < 6) {
      setError('Please enter a valid verification code');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: code }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Remove non-numeric characters and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
    setError(null);
    
    // Auto-submit when 6 digits are entered
    if (numericValue.length === 6) {
      handleSubmit(new Event('submit') as any);
    }
  };

  const toggleBackupCode = () => {
    setIsBackupCode(!isBackupCode);
    setCode('');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the verification code for <span className="font-medium">{userEmail}</span>
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                {isBackupCode ? 'Backup Code' : 'Verification Code'}
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="code"
                  name="code"
                  type="text"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-center text-2xl font-mono tracking-widest"
                  placeholder={isBackupCode ? "Enter backup code" : "000000"}
                  maxLength={isBackupCode ? 8 : 6}
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {isBackupCode 
                  ? "Enter one of your backup codes (8 characters)"
                  : "Enter the 6-digit code from your authenticator app"
                }
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </motion.div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || code.length < (isBackupCode ? 8 : 6)}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  'Verify Code'
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={toggleBackupCode}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                {isBackupCode ? 'Use authenticator app instead' : 'Use backup code instead'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <button
                onClick={onCancel}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                ← Back to login
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Need help?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Make sure your device's time is synchronized</li>
            <li>• Check that you're using the correct authenticator app</li>
            <li>• If you've lost your phone, use a backup code</li>
            <li>• Contact support if you're still having trouble</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
