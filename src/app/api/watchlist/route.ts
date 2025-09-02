import { NextRequest, NextResponse } from 'next/server';
import { 
  GenericPropertyDocument,
  ElasticsearchResponse,
  extractSource,
  mapElasticsearchHits
} from '@/types/elasticsearch';
import { esClient } from '@/lib/esClient';

// GET - Fetch watchlist for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || 'user_123'; // Default for demo
    
    const response = await esClient.search({
      index: 'watchlist',
      body: {
        query: {
          match: {
            user_id: userId
          }
        },
        sort: [
          { date_added: { order: 'desc' } }
        ],
        size: 100
      }
    });
    
    const watchlist = response.hits.hits.map(hit => ({
      ...(hit._source as GenericPropertyDocument),
      _id: hit._id
    }));
    
    return NextResponse.json({
      success: true,
      data: watchlist,
      total: typeof response.hits.total === 'number' ? response.hits.total : response.hits.total.value
    });
    
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch watchlist',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Add property to watchlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id = 'user_123',
      property_id,
      postcode,
      address,
      house_number,
      street,
      town,
      county,
      property_type,
      price,
      notes = '',
      status = 'watching',
      source = 'chrome_extension'
    } = body;
    
    if (!postcode || !address || !price) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'postcode, address, and price are required'
      }, { status: 400 });
    }
    
    const watchlistItem = {
      id: `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id,
      property_id: property_id || `prop_${Date.now()}`,
      postcode,
      address,
      house_number,
      street,
      town,
      county,
      property_type,
      price: parseFloat(price),
      date_added: new Date().toISOString(),
      notes,
      status,
      source,
      last_updated: new Date().toISOString()
    };
    
    const response = await esClient.index({
      index: 'watchlist',
      body: watchlistItem
    });
    
    // Refresh index
    await esClient.indices.refresh({ index: 'watchlist' });
    
    return NextResponse.json({
      success: true,
      data: watchlistItem,
      id: response._id
    });
    
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json({ 
      error: 'Failed to add to watchlist',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update watchlist item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Missing ID',
        message: 'ID is required for updates'
      }, { status: 400 });
    }
    
    const updateBody = {
      doc: {
        ...updates,
        last_updated: new Date().toISOString()
      }
    };
    
    await esClient.update({
      index: 'watchlist',
      id,
      body: updateBody
    });
    
    // Refresh index
    await esClient.indices.refresh({ index: 'watchlist' });
    
    return NextResponse.json({
      success: true,
      message: 'Watchlist item updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating watchlist:', error);
    return NextResponse.json({ 
      error: 'Failed to update watchlist',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Remove property from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Missing ID',
        message: 'ID is required for deletion'
      }, { status: 400 });
    }
    
    await esClient.delete({
      index: 'watchlist',
      id
    });
    
    // Refresh index
    await esClient.indices.refresh({ index: 'watchlist' });
    
    return NextResponse.json({
      success: true,
      message: 'Watchlist item removed successfully'
    });
    
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json({ 
      error: 'Failed to remove from watchlist',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
