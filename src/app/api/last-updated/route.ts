import { NextResponse } from 'next/server';
import { esClient } from '../../../lib/esClient';

export const dynamic = 'force-dynamic';

async function fetchLatestTransactionDateFromElasticsearch(): Promise<{ date: string; count: number } | null> {
  try {
    // Get the latest transaction date from Elasticsearch
    const response = await esClient.search({
      index: 'properties',
      body: {
        size: 1,
        sort: [{ dateOfTransfer: { order: 'desc' } }],
        _source: ['dateOfTransfer']
      }
    });

    if (response.hits.hits.length > 0) {
      const latestDate = (response.hits.hits[0]._source as { dateOfTransfer: string }).dateOfTransfer;
      
      // Also get the total count of records
      const countResponse = await esClient.count({
        index: 'properties'
      });
      
      return {
        date: latestDate,
        count: countResponse.count
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching latest transaction date from Elasticsearch:', error);
    return null;
  }
}

async function getIndexStats(): Promise<{ totalRecords: number; indexSize: string; lastUpdated: string } | null> {
  try {
    // Get index statistics
    const statsResponse = await esClient.indices.stats({
      index: 'properties'
    });
    
    const indexStats = statsResponse.indices?.properties;
    if (!indexStats) return null;
    
    // Get the latest transaction date
    const latestData = await fetchLatestTransactionDateFromElasticsearch();
    if (!latestData) return null;
    
    // Calculate index size in GB
    const sizeInBytes = indexStats.total?.store?.size_in_bytes || 0;
    const sizeInGB = (sizeInBytes / (1024 * 1024 * 1024)).toFixed(2);
    
    return {
      totalRecords: latestData.count,
      indexSize: `${sizeInGB} GB`,
      lastUpdated: latestData.date
    };
  } catch (error) {
    console.error('Error getting index stats:', error);
    return null;
  }
}

export async function GET() {
  try {
    const stats = await getIndexStats();
    
    if (stats) {
      return NextResponse.json({ 
        lastUpdated: stats.lastUpdated,
        totalRecords: stats.totalRecords,
        indexSize: stats.indexSize,
        source: 'Elasticsearch',
        note: 'Data from UK Land Registry CSV import'
      });
    } else {
      // Fallback if Elasticsearch is not available
      return NextResponse.json({ 
        lastUpdated: new Date().toISOString(),
        source: 'fallback',
        note: 'Elasticsearch not available or no data indexed'
      });
    }
  } catch (error) {
    console.error('Error in last-updated API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch last updated timestamp',
        lastUpdated: new Date().toISOString(),
        source: 'error-fallback'
      },
      { status: 500 }
    );
  }
} 