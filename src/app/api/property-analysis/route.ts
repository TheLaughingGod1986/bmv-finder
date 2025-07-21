import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';

// Helper to normalize postcodes (remove spaces, uppercase)
function normalizePostcode(postcode: string) {
  return postcode.replace(/\s+/g, ' ').toUpperCase().trim();
}

// Helper to format comparable output
function formatComparable(hit: any) {
  return {
    address: hit._source.full_address || hit._source.address || '',
    postcode: hit._source.postcode || '',
    price: hit._source.price || hit._source.pricePaid || null,
    date: hit._source.date || hit._source.dateOfTransfer || null,
    propertyType: hit._source.propertyType || hit._source.propertyTypeLabel || '',
    bedrooms: hit._source.bedrooms || null,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postcode = searchParams.get('postcode');
  const number = searchParams.get('number');

  if (!postcode || !number) {
    return NextResponse.json({ success: false, error: 'Missing postcode or number' }, { status: 400 });
  }

  const normalizedPostcode = normalizePostcode(postcode);
  console.log('🔍 Property Analysis Debug:', { postcode, normalizedPostcode, number });

  // Step 1: Find 3-5 most recent comparable sales in the same postcode
  let comparables: any[] = [];
  let confidence = 'low';
  let avgPrice = null;
  let usedBedroomFilter = false;

  try {
    // Try to get the subject property details (for bedroom count)
    const subjectQuery = {
      bool: {
        must: [
          { match_phrase: { postcode: normalizedPostcode } },
          { match: { paon: number } },
        ],
      },
    };
    console.log('🔍 Subject property query:', JSON.stringify(subjectQuery, null, 2));
    
    const subjectResp = await esClient.search({
      index: 'properties-enhanced',
      body: {
        size: 1,
        query: subjectQuery,
      },
    });
    
    console.log('🔍 Subject property response hits:', subjectResp.hits.hits.length);
    
    const subject = subjectResp.hits.hits[0]?._source;
    const subjectAny = subject as any;
    let bedroomCount = subjectAny?.epc_bedrooms;
    let propertyType = subjectAny?.property_type_label;
    
    console.log('🔍 Subject property found:', { 
      found: !!subject, 
      bedroomCount, 
      propertyType,
      address: subjectAny?.full_address 
    });

    // Step 2: Find comparables (same postcode, ideally same bedrooms/property type)
    let must: any[] = [
      { match_phrase: { postcode: normalizedPostcode } },
    ];
    if (bedroomCount) {
      must.push({ match: { bedrooms: bedroomCount } });
      usedBedroomFilter = true;
    }
    if (propertyType) {
      must.push({ match: { propertyType } });
    }
    
    const comparableQuery = { bool: { must } };
    console.log('🔍 Comparable search query:', JSON.stringify(comparableQuery, null, 2));
    
    let resp = await esClient.search({
      index: 'properties-enhanced',
      body: {
        size: 5,
        sort: [{ date: { order: 'desc' } }],
        query: comparableQuery,
      },
    });
    
    console.log('🔍 Comparable search response hits:', resp.hits.hits.length);
    comparables = resp.hits.hits.map(formatComparable);

    // If not enough comparables, relax bedroom/propertyType filter
    if (comparables.length < 3) {
      console.log('🔍 Not enough comparables, relaxing filters...');
      must = [ { match_phrase: { postcode: normalizedPostcode } } ];
      resp = await esClient.search({
        index: 'properties-enhanced',
        body: {
          size: 5,
          sort: [{ date: { order: 'desc' } }],
          query: { bool: { must } },
        },
      });
      comparables = resp.hits.hits.map(formatComparable);
      usedBedroomFilter = false;
      console.log('🔍 Relaxed search response hits:', resp.hits.hits.length);
    }

    // Calculate average price
    const prices = comparables.map(c => c.price).filter(p => typeof p === 'number');
    if (prices.length > 0) {
      avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    }
    // Set confidence
    if (comparables.length >= 3) confidence = 'high';
    else if (comparables.length > 0) confidence = 'medium';
    else confidence = 'low';

    console.log('🔍 Final result:', { 
      estimatedValue: avgPrice, 
      confidence, 
      comparablesCount: comparables.length,
      usedBedroomFilter 
    });

    // Create subject object with requested details
    const subjectProperty = {
      address: `${number} ${normalizedPostcode}`,
      fullAddress: `${number}, ${normalizedPostcode}`,
      postcode: normalizedPostcode,
      propertyNumber: number,
      propertyType: propertyType || 'Unknown',
      bedrooms: bedroomCount || null,
    };

    return NextResponse.json({
      success: true,
      estimatedValue: avgPrice,
      confidence,
      comparables,
      usedBedroomFilter,
      subject: subjectProperty,
    });
  } catch (error: any) {
    console.error('🔍 Property analysis error:', error);
    return NextResponse.json({ success: false, error: error.message || error.toString() }, { status: 500 });
  }
} 