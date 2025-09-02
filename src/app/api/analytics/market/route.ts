import { NextRequest, NextResponse } from 'next/server';
import { analyticsEngine } from '@/lib/analyticsEngine';
import { apiPerformanceMonitor } from '@/lib/apiPerformanceMonitor';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area') || undefined;
    const timeframe = searchParams.get('timeframe') || '30d';
    const propertyId = searchParams.get('propertyId');

    // Track API call
    apiPerformanceMonitor.trackAPICall(
      '/api/analytics/market',
      'GET',
      Date.now() - startTime,
      200
    );

    let result;

    if (propertyId) {
      // Get property-specific analytics
      result = await analyticsEngine.analyzeProperty(propertyId);
    } else {
      // Get market-wide analytics
      result = await analyticsEngine.analyzeMarket(area, timeframe);
    }

    const executionTime = Date.now() - startTime;
    
    // Track performance
    apiPerformanceMonitor.trackAPICall(
      '/api/analytics/market',
      'GET',
      executionTime,
      200
    );

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        area: area || 'all',
        timeframe,
        executionTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    
    // Track error
    apiPerformanceMonitor.trackAPICall(
      '/api/analytics/market',
      'GET',
      executionTime,
      500,
      undefined,
      undefined,
      error.message
    );

    console.error('Analytics API error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to process market analytics',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { area, timeframe, analysisType, filters } = body;

    // Track API call
    apiPerformanceMonitor.trackAPICall(
      '/api/analytics/market',
      'POST',
      Date.now() - startTime,
      200
    );

    let result;

    switch (analysisType) {
      case 'trends':
        result = await analyticsEngine.analyzeMarket(area, timeframe);
        break;
      case 'property':
        if (!body.propertyId) {
          throw new Error('Property ID is required for property analysis');
        }
        result = await analyticsEngine.analyzeProperty(body.propertyId);
        break;
      case 'custom':
        // Custom analysis with filters
        result = await analyticsEngine.analyzeMarket(area, timeframe);
        // Apply custom filters here
        break;
      default:
        result = await analyticsEngine.analyzeMarket(area, timeframe);
    }

    const executionTime = Date.now() - startTime;
    
    // Track performance
    apiPerformanceMonitor.trackAPICall(
      '/api/analytics/market',
      'POST',
      executionTime,
      200
    );

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        area: area || 'all',
        timeframe: timeframe || '30d',
        analysisType: analysisType || 'custom',
        executionTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    
    // Track error
    apiPerformanceMonitor.trackAPICall(
      '/api/analytics/market',
      'POST',
      executionTime,
      500,
      undefined,
      undefined,
      error.message
    );

    console.error('Analytics API error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to process analytics request',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
