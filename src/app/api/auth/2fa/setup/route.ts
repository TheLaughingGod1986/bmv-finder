import { NextRequest, NextResponse } from 'next/server';
import { twoFactorAuth } from '@/lib/auth/twoFactorAuth';
import { requireAuth } from '@/middleware/auth';

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if 2FA is already enabled
    const isEnabled = await twoFactorAuth.isTwoFactorEnabled(user.id);
    if (isEnabled) {
      return NextResponse.json({
        success: false,
        error: '2FA is already enabled for this account'
      }, { status: 400 });
    }

    // Generate 2FA setup
    const setup = await twoFactorAuth.generateSecret(user.id, user.email);

    return NextResponse.json({
      success: true,
      data: {
        qrCodeUrl: setup.qrCodeUrl,
        manualEntryKey: setup.manualEntryKey,
        backupCodes: setup.backupCodes,
      }
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to set up 2FA. Please try again.'
    }, { status: 500 });
  }
});
