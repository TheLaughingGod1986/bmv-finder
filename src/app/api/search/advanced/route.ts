import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rateLimiter';
import AdvancedSearch from '@/lib/advancedSearch';
import { esClient } from '@/lib/esClient';

const advancedSearch = new AdvancedSearch(esClient);

// Radius search endpoint
export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { centerPostcode, radius, filters } = body;

    if (!centerPostcode || !radius) {
      return NextResponse.json(
        { error: 'Center postcode and radius are required' },
        { status: 400 }
      );
    }

    if (radius > 50) {
      return NextResponse.json(
        { error: 'Maximum radius allowed is 50 miles' },
        { status: 400 }
      );
    }

    const result = await advancedSearch.radiusSearch(centerPostcode, radius, filters);

    return NextResponse.json({
      type: 'radius_search',
      centerPostcode,
      radius,
      ...result
    });

  } catch (error) {
    console.error('Error in radius search:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

// Area comparison endpoint
export const PUT = withRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { areas, dateRange } = body;

    if (!areas || !Array.isArray(areas) || areas.length === 0) {
      return NextResponse.json(
        { error: 'Areas array is required' },
        { status: 400 }
      );
    }

    if (areas.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 areas allowed for comparison' },
        { status: 400 }
      );
    }

    const result = await advancedSearch.areaComparison(areas, dateRange);

    return NextResponse.json({
      type: 'area_comparison',
      ...result
    });

  } catch (error) {
    console.error('Error in area comparison:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}); 