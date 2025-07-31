import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';
import { getOptimizedPriceIndicator, HpiData } from '@/utils/enhancedPriceIndicator';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postcode = searchParams.get('postcode');
    const propertyType = searchParams.get('propertyType');
    const bedrooms = searchParams.get('bedrooms');
    const price = searchParams.get('price');

    if (!postcode || !propertyType || !price) {
      return NextResponse.json({ 
        error: 'Missing required parameters: postcode, propertyType, price' 
      }, { status: 400 });
    }

    const priceNum = parseFloat(price);
    const bedroomsNum = bedrooms ? parseInt(bedrooms) : undefined;

    if (isNaN(priceNum)) {
      return NextResponse.json({ 
        error: 'Invalid price parameter' 
      }, { status: 400 });
    }

    // Map postcode to region for HPI data
    const region = getRegionFromPostcode(postcode);

    // Fetch HPI data for the region
    const hpiData = await fetchHpiData(region);

    // Fetch comparable properties
    const comparables = await fetchComparableProperties(postcode, propertyType, bedroomsNum);

    // Get enhanced price indicator
    const indicator = getOptimizedPriceIndicator(
      priceNum,
      comparables,
      propertyType,
      bedroomsNum,
      hpiData
    );

    return NextResponse.json({
      success: true,
      indicator,
      region,
      hpiDataAvailable: hpiData.length > 0,
      comparablesCount: comparables.length
    });

  } catch (error) {
    console.error('Enhanced price indicator error:', error);
    return NextResponse.json({ 
      error: 'Failed to calculate enhanced price indicator' 
    }, { status: 500 });
  }
}

// Helper function to map postcode to region
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
    return 'London';
  }
  // North East
  if (upperPostcode.startsWith('NE') || upperPostcode.startsWith('SR') || upperPostcode.startsWith('DL') || upperPostcode.startsWith('TS')) {
    return 'North East';
  }
  // North West
  if (upperPostcode.startsWith('L') || upperPostcode.startsWith('M') || upperPostcode.startsWith('PR') || upperPostcode.startsWith('BB') || upperPostcode.startsWith('OL') || upperPostcode.startsWith('SK') || upperPostcode.startsWith('WA') || upperPostcode.startsWith('WN') || upperPostcode.startsWith('BL') || upperPostcode.startsWith('CA') || upperPostcode.startsWith('LA')) {
    return 'North West';
  }
  // Yorkshire and the Humber
  if (upperPostcode.startsWith('BD') || upperPostcode.startsWith('HD') || upperPostcode.startsWith('HG') || upperPostcode.startsWith('HX') || upperPostcode.startsWith('LS') || upperPostcode.startsWith('S') || upperPostcode.startsWith('WF') || upperPostcode.startsWith('YO')) {
    return 'Yorkshire and The Humber';
  }
  // East Midlands
  if (upperPostcode.startsWith('DE') || upperPostcode.startsWith('LE') || upperPostcode.startsWith('NG') || upperPostcode.startsWith('LN') || upperPostcode.startsWith('PE')) {
    return 'East Midlands';
  }
  // West Midlands
  if (upperPostcode.startsWith('B') || upperPostcode.startsWith('CV') || upperPostcode.startsWith('DY') || upperPostcode.startsWith('HR') || upperPostcode.startsWith('TF') || upperPostcode.startsWith('WS') || upperPostcode.startsWith('WV')) {
    return 'West Midlands Region';
  }
  // East of England
  if (upperPostcode.startsWith('AL') || upperPostcode.startsWith('CB') || upperPostcode.startsWith('CM') || upperPostcode.startsWith('CO') || upperPostcode.startsWith('IP') || upperPostcode.startsWith('LU') || upperPostcode.startsWith('MK') || upperPostcode.startsWith('NN') || upperPostcode.startsWith('NR') || upperPostcode.startsWith('PE') || upperPostcode.startsWith('SG') || upperPostcode.startsWith('SS')) {
    return 'East of England';
  }
  
  // Default to England if no match
  return 'England';
}

// Fetch HPI data for a region
async function fetchHpiData(region: string): Promise<HpiData[]> {
  try {
    const result = await esClient.search({
      index: 'house_price_index',
      size: 12, // Get last 12 months
      query: {
        term: { region: region }
      },
      sort: [
        { date: { order: 'desc' } }
      ]
    });
    
    const hits = result.hits.hits;
    return hits.map((hit: any) => ({
      region: hit._source.region,
      date: hit._source.date,
      index: hit._source.index,
      change: hit._source.change || 0
    }));
  } catch (error) {
    console.error('Error fetching HPI data:', error);
    return [];
  }
}

// Fetch comparable properties
async function fetchComparableProperties(
  postcode: string, 
  propertyType: string, 
  bedrooms?: number
): Promise<any[]> {
  try {
    // Fetching comparables logging removed
    
    const must: any[] = [
      { match_phrase: { postcode: postcode } },
      { match: { property_type: propertyType } }
    ];

    // Add bedroom filter if available
    if (bedrooms) {
      must.push({ match: { epc_bedrooms: bedrooms } });
    }

    // Elasticsearch query logging removed

    const result = await esClient.search({
      index: 'properties-enhanced',
      size: 20, // Get more to filter by date
      query: {
        bool: { must }
      },
      sort: [
        { date: { order: 'desc' } }
      ]
    });

    // Elasticsearch response hits logging removed

    const hits = result.hits.hits;
    let properties = hits.map((hit: any) => {
      const source = hit._source;
      return {
        ...source,
        dateOfTransfer: source.date, // Map date to dateOfTransfer
        bedrooms: source.epc_bedrooms, // Map epc_bedrooms to bedrooms
        propertyType: source.property_type // Map property_type to propertyType
      };
    });

    // Properties before date filter logging removed

    // Filter to last 24 months (more inclusive)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    properties = properties.filter((property: any) => {
      const saleDate = new Date(property.date);
      return saleDate >= twoYearsAgo && property.price > 0;
    });

    // Properties after date filter logging removed

    return properties.slice(0, 10); // Return top 10 most recent
  } catch (error) {
    console.error('Error fetching comparable properties:', error);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { properties } = body;

    if (!properties || !Array.isArray(properties)) {
      return NextResponse.json({ 
        error: 'Missing or invalid properties array' 
      }, { status: 400 });
    }

    const results = [];

    for (const property of properties) {
      try {
        const { postcode, propertyType, price, bedrooms } = property;
        
        if (!postcode || !propertyType || !price) {
          results.push({
            propertyId: property.id || property.paon,
            error: 'Missing required parameters'
          });
          continue;
        }

        const priceNum = parseFloat(price);
        const bedroomsNum = bedrooms ? parseInt(bedrooms) : undefined;

        if (isNaN(priceNum)) {
          results.push({
            propertyId: property.id || property.paon,
            error: 'Invalid price'
          });
          continue;
        }

        // Map postcode to region for HPI data
        const region = getRegionFromPostcode(postcode);

        // Fetch HPI data for the region
        const hpiData = await fetchHpiData(region);

        // Fetch comparable properties
        const comparables = await fetchComparableProperties(postcode, propertyType, bedroomsNum);

        // Get enhanced price indicator
        const indicator = getOptimizedPriceIndicator(
          priceNum,
          comparables,
          propertyType,
          bedroomsNum,
          hpiData
        );

        results.push({
          propertyId: property.id || property.paon,
          percentage: indicator.priceDifference * 100, // Convert to percentage
          category: indicator.label,
          description: indicator.description,
          comparablesCount: comparables.length,
          hpiDataAvailable: hpiData.length > 0,
          // BMV information
          bmvCategory: indicator.bmvCategory,
          bmvLabel: indicator.bmvLabel,
          bmvScore: indicator.bmvScore,
          // Market trend information
          marketTrend: indicator.marketTrend
        });

      } catch (error) {
        console.error('Error processing property:', property, error);
        results.push({
          propertyId: property.id || property.paon,
          error: 'Failed to process property'
        });
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Enhanced price indicator batch error:', error);
    return NextResponse.json({ 
      error: 'Failed to calculate enhanced price indicators' 
    }, { status: 500 });
  }
}