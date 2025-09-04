import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

// GET /api/user/dashboard/stats - Get user dashboard statistics
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {

    // Mock dashboard stats - in production, these would come from the database
    const stats = {
      watchlistCount: Math.floor(Math.random() * 20) + 5,
      portfolioValue: Math.floor(Math.random() * 2000000) + 500000,
      savedSearches: Math.floor(Math.random() * 10) + 2,
      alertsActive: Math.floor(Math.random() * 8) + 1,
      propertiesViewed: Math.floor(Math.random() * 50) + 10,
      searchesPerformed: Math.floor(Math.random() * 30) + 5,
      lastLogin: new Date().toISOString(),
      accountAge: Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24))
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get dashboard statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});
