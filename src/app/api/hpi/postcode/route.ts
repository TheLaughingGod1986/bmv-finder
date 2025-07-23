import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';

const INDEX_NAME = 'house_price_index';

// Map postcodes to regions (simplified mapping)
function getRegionFromPostcode(postcode: string): string {
  const upperPostcode = postcode.toUpperCase();
  
  // London
  if (
    upperPostcode.startsWith('E') || upperPostcode.startsWith('EC') ||
    (upperPostcode.startsWith('N') && !upperPostcode.startsWith('NE') && !upperPostcode.startsWith('NW') && /^N[0-9]/.test(upperPostcode)) ||
    upperPostcode.startsWith('NW') ||
    upperPostcode.startsWith('SE') || upperPostcode.startsWith('SW') ||
    upperPostcode.startsWith('W') || upperPostcode.startsWith('WC')
  ) {
    return 'london';
  }
  // East of England (move above Yorkshire)
  if (upperPostcode.startsWith('AL') || upperPostcode.startsWith('CB') || upperPostcode.startsWith('CM') || upperPostcode.startsWith('CO') || upperPostcode.startsWith('IP') || upperPostcode.startsWith('LU') || upperPostcode.startsWith('MK') || upperPostcode.startsWith('NN') || upperPostcode.startsWith('NR') || upperPostcode.startsWith('PE') || upperPostcode.startsWith('SG') || upperPostcode.startsWith('SS')) {
    return 'east-of-england';
  }
  // North East
  if (upperPostcode.startsWith('NE') || upperPostcode.startsWith('SR') || upperPostcode.startsWith('DL') || upperPostcode.startsWith('TS')) {
    return 'north-east';
  }
  // North West
  if (upperPostcode.startsWith('L') || upperPostcode.startsWith('M') || upperPostcode.startsWith('PR') || upperPostcode.startsWith('BB') || upperPostcode.startsWith('OL') || upperPostcode.startsWith('SK') || upperPostcode.startsWith('WA') || upperPostcode.startsWith('WN') || upperPostcode.startsWith('BL') || upperPostcode.startsWith('CA') || upperPostcode.startsWith('LA')) {
    return 'north-west';
  }
  // Yorkshire and the Humber
  if (upperPostcode.startsWith('BD') || upperPostcode.startsWith('HD') || upperPostcode.startsWith('HG') || upperPostcode.startsWith('HX') || upperPostcode.startsWith('LS') || upperPostcode.startsWith('S') || upperPostcode.startsWith('WF') || upperPostcode.startsWith('YO')) {
    return 'yorkshire-and-the-humber';
  }
  // East Midlands
  if (upperPostcode.startsWith('DE') || upperPostcode.startsWith('LE') || upperPostcode.startsWith('NG') || upperPostcode.startsWith('LN') || upperPostcode.startsWith('PE')) {
    return 'east-midlands';
  }
  // West Midlands
  if (upperPostcode.startsWith('B') || upperPostcode.startsWith('CV') || upperPostcode.startsWith('DY') || upperPostcode.startsWith('HR') || upperPostcode.startsWith('TF') || upperPostcode.startsWith('WS') || upperPostcode.startsWith('WV')) {
    return 'west-midlands-region';
  }
  
  // Default to England if no match
  return 'england';
}

// HPI search by region
async function searchHpiByRegion(region: string) {
  try {
    const result = await esClient.search({
      index: INDEX_NAME,
      size: 100,
      query: {
        term: { region: region }
      },
      sort: [
        { date: { order: 'desc' } }
      ]
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

    // If postcode is provided, map to region and search
    if (postcode) {
      const region = getRegionFromPostcode(postcode);
      const results = await searchHpiByRegion(region);
      if (results.length > 0) {
        return NextResponse.json({ 
          source: 'elasticsearch_region', 
          region: region,
          postcode: postcode,
          results 
        });
      } else {
        return NextResponse.json({ error: 'No HPI data found for postcode region', results: [] }, { status: 404 });
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