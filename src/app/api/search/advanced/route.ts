import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, applyRateLimitHeaders } from '@/lib/rateLimiter';
import AdvancedSearch from '@/lib/advancedSearch';
import { esClient } from '@/lib/esClient';

const advancedSearch = new AdvancedSearch(esClient);

// Radius search endpoint
export const POST = async (req: NextRequest) => {
  const rateLimitResult = checkRateLimit(req);
  if (!rateLimitResult.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: rateLimitResult.error?.message || 'Rate limit exceeded' }, { status: rateLimitResult.error?.status || 429 }),
      rateLimitResult.headers
    );
  }
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

    const response = NextResponse.json({
      type: 'radius_search',
      centerPostcode,
      radius,
      ...result
    });
    return applyRateLimitHeaders(response, rateLimitResult.headers);

  } catch (error) {
    console.error('Error in radius search:', error);
    const errorResponse = NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
    return applyRateLimitHeaders(errorResponse, rateLimitResult.headers);
  }
};

// Area comparison endpoint
export const PUT = async (req: NextRequest) => {
  const rateLimitResult = checkRateLimit(req);
  if (!rateLimitResult.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: rateLimitResult.error?.message || 'Rate limit exceeded' }, { status: rateLimitResult.error?.status || 429 }),
      rateLimitResult.headers
    );
  }
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

    const response = NextResponse.json({
      type: 'area_comparison',
      ...result
    });
    return applyRateLimitHeaders(response, rateLimitResult.headers);

  } catch (error) {
    console.error('Error in area comparison:', error);
    const errorResponse = NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
    return applyRateLimitHeaders(errorResponse, rateLimitResult.headers);
  }
}; 