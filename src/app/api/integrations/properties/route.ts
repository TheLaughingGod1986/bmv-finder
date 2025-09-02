import { NextRequest, NextResponse } from 'next/server';
import { integrationManager } from '@/lib/integrationManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'rightmove';
    const location = searchParams.get('location');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const propertyType = searchParams.get('propertyType');
    const bedrooms = searchParams.get('bedrooms');
    const radius = searchParams.get('radius');

    if (!location) {
      return NextResponse.json({
        success: false,
        error: 'Location parameter is required'
      }, { status: 400 });
    }

    const params: any = { location };
    if (minPrice) params.minPrice = parseInt(minPrice);
    if (maxPrice) params.maxPrice = parseInt(maxPrice);
    if (propertyType) params.propertyType = propertyType;
    if (bedrooms) params.bedrooms = parseInt(bedrooms);
    if (radius) params.radius = parseInt(radius);

    let result;

    switch (source.toLowerCase()) {
      case 'rightmove':
        result = await integrationManager.getRightmoveProperties(params);
        break;
      case 'zoopla':
        result = await integrationManager.getZooplaProperties(params);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported source: ${source}. Supported sources: rightmove, zoopla`
        }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Properties API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch properties',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
