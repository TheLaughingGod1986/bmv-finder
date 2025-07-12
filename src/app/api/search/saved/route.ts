import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rateLimiter';
import AdvancedSearch from '@/lib/advancedSearch';
import { esClient } from '@/lib/esClient';

const advancedSearch = new AdvancedSearch(esClient);

// Get all saved searches
export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const savedSearches = advancedSearch.getSavedSearches();
    
    return NextResponse.json({
      searches: savedSearches,
      count: savedSearches.length
    });

  } catch (error) {
    console.error('Error getting saved searches:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

// Save a new search
export const POST = withRateLimit(async (req: NextRequest) => {
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

    return NextResponse.json({
      message: 'Search saved successfully',
      savedSearch
    });

  } catch (error) {
    console.error('Error saving search:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

// Execute a saved search
export const PUT = withRateLimit(async (req: NextRequest) => {
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

    return NextResponse.json({
      message: 'Saved search executed successfully',
      ...result
    });

  } catch (error) {
    console.error('Error executing saved search:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

// Delete a saved search
export const DELETE = withRateLimit(async (req: NextRequest) => {
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
}); 