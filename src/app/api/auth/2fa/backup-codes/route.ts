import { NextRequest, NextResponse } from 'next/server';
import { twoFactorAuth } from '@/lib/auth/twoFactorAuth';
import { requireAuth } from '@/middleware/auth';

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Regenerate backup codes
    const newBackupCodes = await twoFactorAuth.regenerateBackupCodes(user.id);

    return NextResponse.json({
      success: true,
      data: {
        backupCodes: newBackupCodes
      },
      message: 'New backup codes generated successfully'
    });

  } catch (error) {
    console.error('Backup codes regeneration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to regenerate backup codes. Please try again.'
    }, { status: 500 });
  }
});
