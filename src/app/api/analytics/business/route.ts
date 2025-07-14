import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rateLimiter';
import { esClient } from '@/lib/esClient';

// Get business metrics
export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const detailed = searchParams.get('detailed') === 'true';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get user metrics
    const userMetrics = await getUserMetrics(startDate, now);
    
    // Get search metrics
    const searchMetrics = await getSearchMetrics(startDate, now);
    
    // Get prediction metrics
    const predictionMetrics = await getPredictionMetrics(startDate, now);
    
    // Get revenue metrics (mock data for now)
    const revenueMetrics = await getRevenueMetrics(startDate, now);
    
    // Get market insights
    const marketInsights = await getMarketInsights();

    const response: any = {
      timestamp: new Date().toISOString(),
      timeRange,
      users: userMetrics,
      searches: searchMetrics,
      predictions: predictionMetrics,
      revenue: revenueMetrics,
      market: marketInsights
    };

    // Add detailed breakdown if requested
    if (detailed) {
      response.detailed = {
        userGrowth: await getUserGrowthData(startDate, now),
        searchTrends: await getSearchTrends(startDate, now),
        predictionAccuracy: await getPredictionAccuracyData(startDate, now),
        marketPerformance: await getMarketPerformanceData(startDate, now)
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching business metrics:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

// Track business event
export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { event, data, userId, timestamp } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Log business event
    await logBusinessEvent({
      event,
      data,
      userId,
      timestamp: timestamp || new Date().toISOString(),
      userAgent: req.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Event logged successfully',
      eventId: Date.now().toString()
    });

  } catch (error) {
    console.error('Error logging business event:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

// Helper functions
async function getUserMetrics(startDate: Date, endDate: Date) {
  try {
    // Mock user metrics - replace with real database queries
    const totalUsers = 1247;
    const activeUsers = 892;
    const newUsers = 156;
    const growthRate = 12.5;

    return {
      total: totalUsers,
      active: activeUsers,
      newThisMonth: newUsers,
      growthRate
    };
  } catch (error) {
    console.error('Error getting user metrics:', error);
    return {
      total: 0,
      active: 0,
      newThisMonth: 0,
      growthRate: 0
    };
  }
}

async function getSearchMetrics(startDate: Date, endDate: Date) {
  try {
    // Mock search metrics - replace with real Elasticsearch queries
    const totalSearches = 45678;
    const thisMonthSearches = 3421;
    const averagePerUser = 36.7;
    const growthRate = 8.3;

    return {
      total: totalSearches,
      thisMonth: thisMonthSearches,
      averagePerUser,
      growthRate
    };
  } catch (error) {
    console.error('Error getting search metrics:', error);
    return {
      total: 0,
      thisMonth: 0,
      averagePerUser: 0,
      growthRate: 0
    };
  }
}

async function getPredictionMetrics(startDate: Date, endDate: Date) {
  try {
    // Mock prediction metrics - replace with real data
    const totalPredictions = 12345;
    const thisMonthPredictions = 987;
    const accuracy = 94.2;
    const averageConfidence = 87.5;

    return {
      total: totalPredictions,
      thisMonth: thisMonthPredictions,
      accuracy,
      averageConfidence
    };
  } catch (error) {
    console.error('Error getting prediction metrics:', error);
    return {
      total: 0,
      thisMonth: 0,
      accuracy: 0,
      averageConfidence: 0
    };
  }
}

async function getRevenueMetrics(startDate: Date, endDate: Date) {
  try {
    // Mock revenue metrics - replace with real payment data
    const monthlyRevenue = 45600;
    const growth = 15.8;
    const averagePerUser = 36.5;
    const projections = 520000;

    return {
      monthly: monthlyRevenue,
      growth,
      averagePerUser,
      projections
    };
  } catch (error) {
    console.error('Error getting revenue metrics:', error);
    return {
      monthly: 0,
      growth: 0,
      averagePerUser: 0,
      projections: 0
    };
  }
}

async function getMarketInsights() {
  try {
    // Get real market data from Elasticsearch
    const propertyCount = await esClient.count({
      index: 'property_sales'
    });

    // Mock hot markets - replace with real analysis
    const hotMarkets = [
      { area: 'Manchester', growth: 12.5, volume: 2345 },
      { area: 'Birmingham', growth: 9.8, volume: 1890 },
      { area: 'Leeds', growth: 8.4, volume: 1567 },
      { area: 'Liverpool', growth: 7.2, volume: 1234 }
    ];

    return {
      totalProperties: propertyCount.count,
      averagePrice: 285000,
      priceGrowth: 6.2,
      hotMarkets
    };
  } catch (error) {
    console.error('Error getting market insights:', error);
    return {
      totalProperties: 0,
      averagePrice: 0,
      priceGrowth: 0,
      hotMarkets: []
    };
  }
}

async function getUserGrowthData(startDate: Date, endDate: Date) {
  // Mock time series data
  return [
    { date: '2024-01-01', value: 45, label: 'Jan 1' },
    { date: '2024-01-02', value: 52, label: 'Jan 2' },
    { date: '2024-01-03', value: 48, label: 'Jan 3' },
    { date: '2024-01-04', value: 61, label: 'Jan 4' },
    { date: '2024-01-05', value: 67, label: 'Jan 5' },
    { date: '2024-01-06', value: 58, label: 'Jan 6' },
    { date: '2024-01-07', value: 63, label: 'Jan 7' }
  ];
}

async function getSearchTrends(startDate: Date, endDate: Date) {
  // Mock time series data
  return [
    { date: '2024-01-01', value: 120, label: 'Jan 1' },
    { date: '2024-01-02', value: 145, label: 'Jan 2' },
    { date: '2024-01-03', value: 132, label: 'Jan 3' },
    { date: '2024-01-04', value: 167, label: 'Jan 4' },
    { date: '2024-01-05', value: 189, label: 'Jan 5' },
    { date: '2024-01-06', value: 156, label: 'Jan 6' },
    { date: '2024-01-07', value: 178, label: 'Jan 7' }
  ];
}

async function getPredictionAccuracyData(startDate: Date, endDate: Date) {
  // Mock time series data
  return [
    { date: '2024-01-01', value: 23, label: 'Jan 1' },
    { date: '2024-01-02', value: 28, label: 'Jan 2' },
    { date: '2024-01-03', value: 25, label: 'Jan 3' },
    { date: '2024-01-04', value: 32, label: 'Jan 4' },
    { date: '2024-01-05', value: 35, label: 'Jan 5' },
    { date: '2024-01-06', value: 29, label: 'Jan 6' },
    { date: '2024-01-07', value: 31, label: 'Jan 7' }
  ];
}

async function getMarketPerformanceData(startDate: Date, endDate: Date) {
  // Mock market performance data
  return {
    topAreas: [
      { area: 'Manchester', growth: 12.5, volume: 2345 },
      { area: 'Birmingham', growth: 9.8, volume: 1890 },
      { area: 'Leeds', growth: 8.4, volume: 1567 }
    ],
    priceTrends: [
      { date: '2024-01-01', averagePrice: 280000 },
      { date: '2024-01-02', averagePrice: 282000 },
      { date: '2024-01-03', averagePrice: 281500 },
      { date: '2024-01-04', averagePrice: 283000 },
      { date: '2024-01-05', averagePrice: 285000 },
      { date: '2024-01-06', averagePrice: 284500 },
      { date: '2024-01-07', averagePrice: 286000 }
    ]
  };
}

async function logBusinessEvent(eventData: {
  event: string;
  data: any;
  userId?: string;
  timestamp: string;
  userAgent: string;
}) {
  try {
    // Log to Elasticsearch for analytics
    await esClient.index({
      index: 'business_events',
      body: {
        ...eventData,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error logging business event:', error);
  }
} 