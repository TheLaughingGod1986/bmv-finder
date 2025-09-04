import { NextRequest, NextResponse } from 'next/server';
import { mobileOptimizer } from '@/lib/mobile/mobileOptimizer';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Get device information
    const deviceInfo = mobileOptimizer.getDeviceInfo();
    const coreWebVitals = mobileOptimizer.getCoreWebVitals();

    return NextResponse.json({
      success: true,
      data: {
        deviceInfo,
        coreWebVitals,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error fetching device info:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch device information'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });
