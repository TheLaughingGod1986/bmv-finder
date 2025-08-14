import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@elastic/elasticsearch';

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  requestTimeout: 60000,
  maxRetries: 3,
  retryOnTimeout: true
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || 'user_123'; // Default for demo
    
    const response = await esClient.count({
      index: 'watchlist',
      body: {
        query: {
          match: {
            user_id: userId
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      count: response.count
    });
    
  } catch (error) {
    console.error('Error counting watchlist:', error);
    return NextResponse.json({ 
      error: 'Failed to count watchlist',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
