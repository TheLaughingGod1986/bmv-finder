import { NextRequest, NextResponse } from 'next/server';
import { enhancedCache } from '@/lib/performance/enhancedCache';
import { requireAuth } from '@/middleware/auth';

// GET /api/performance/cache - Get cache performance metrics
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const metrics = enhancedCache.getMetrics();

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching cache metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/performance/cache/clear - Clear cache
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { action } = await request.json();

    if (action === 'clear_cache') {
      await enhancedCache.clear();
      return NextResponse.json({ success: true, message: 'Cache cleared successfully' });
    }

    if (action === 'warmup') {
      const { data } = await request.json();
      await enhancedCache.warmup(data);
      return NextResponse.json({ success: true, message: 'Cache warmed up successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing cache:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
