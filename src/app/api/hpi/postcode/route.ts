import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';

const INDEX_NAME = 'house_price_index';

// Simple HPI search by postcode
async function searchHpiByPostcode(postcode: string) {
  try {
    const result = await esClient.search({
      index: INDEX_NAME,
      size: 100,
      body: {
        query: {
          term: { postcode: postcode.toUpperCase() }
        },
        sort: [
          { date: { order: 'desc' } }
        ]
      }
    });
    
    const hits = result.hits.hits;
    return hits.map((hit: any) => hit._source);
  } catch (error) {
    console.error('Error searching HPI by postcode:', error);
    return [];
  }
}

// Simple HPI search by region
async function searchHpiByRegion(region: string) {
  try {
    const result = await esClient.search({
      index: INDEX_NAME,
      size: 100,
      body: {
        query: {
          term: { region: region }
        },
        sort: [
          { date: { order: 'desc' } }
        ]
      }
    });
    
    const hits = result.hits.hits;
    return hits.map((hit: any) => hit._source);
  } catch (error) {
    console.error('Error searching HPI by region:', error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postcode = searchParams.get('postcode');
    const regionParam = searchParams.get('region');

    // If region is provided, search by region
    if (regionParam) {
      const regionResults = await searchHpiByRegion(regionParam);
      if (regionResults.length > 0) {
        return NextResponse.json({ source: 'elasticsearch_region', results: regionResults });
      } else {
        return NextResponse.json({ error: 'No HPI data found for region', results: [] }, { status: 404 });
      }
    }

    // If postcode is provided, search by postcode
    if (postcode) {
      const results = await searchHpiByPostcode(postcode);
      if (results.length > 0) {
        return NextResponse.json({ source: 'elasticsearch_postcode', results });
      } else {
        return NextResponse.json({ error: 'No HPI data found for postcode', results: [] }, { status: 404 });
      }
    }

    // If neither provided
    return NextResponse.json({ error: 'Missing postcode or region parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error in HPI search:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}