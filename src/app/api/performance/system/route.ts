import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';

// GET /api/performance/system - Get system performance metrics
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Mock system metrics - in production, you'd use actual system monitoring
    const metrics = {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100,
      networkLatency: Math.floor(Math.random() * 100) + 10
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
