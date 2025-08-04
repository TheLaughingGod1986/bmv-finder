import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, applyRateLimitHeaders } from '@/lib/rateLimiter';
import AdvancedSearch from '@/lib/advancedSearch';
import { esClient } from '@/lib/esClient';

const advancedSearch = new AdvancedSearch(esClient);

// Get all saved searches
export const GET = async (req: NextRequest) => {
  const rateLimitResult = checkRateLimit(req);
  if (!rateLimitResult.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: rateLimitResult.error?.message || 'Rate limit exceeded' }, { status: rateLimitResult.error?.status || 429 }),
      rateLimitResult.headers
    );
  }
  try {
    const savedSearches = advancedSearch.getSavedSearches();
    
    const response = NextResponse.json({
      searches: savedSearches,
      count: savedSearches.length
    });
    return applyRateLimitHeaders(response, rateLimitResult.headers);

  } catch (error) {
    console.error('Error getting saved searches:', error);
    const errorResponse = NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return applyRateLimitHeaders(errorResponse, rateLimitResult.headers);
  }
};

// Save a new search
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
    const { name, query, filters } = body;

    if (!name || !query) {
      return NextResponse.json(
        { error: 'Name and query are required' },
        { status: 400 }
      );
    }

    const savedSearch = await advancedSearch.saveSearch(name, query, filters);

    const response = NextResponse.json({
      message: 'Search saved successfully',
      savedSearch
    });
    return applyRateLimitHeaders(response, rateLimitResult.headers);

  } catch (error) {
    console.error('Error saving search:', error);
    const errorResponse = NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return applyRateLimitHeaders(errorResponse, rateLimitResult.headers);
  }
};

// Execute a saved search
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
    const { searchId } = body;

    if (!searchId) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      );
    }

    const result = await advancedSearch.executeSavedSearch(searchId);

    if (!result) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      message: 'Saved search executed successfully',
      ...result
    });
    return applyRateLimitHeaders(response, rateLimitResult.headers);

  } catch (error) {
    console.error('Error executing saved search:', error);
    const errorResponse = NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return applyRateLimitHeaders(errorResponse, rateLimitResult.headers);
  }
};

// Delete a saved search
export const DELETE = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { searchId } = body;

    if (!searchId) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      );
    }

    const deleted = advancedSearch.deleteSavedSearch(searchId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Saved search deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting saved search:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}; 