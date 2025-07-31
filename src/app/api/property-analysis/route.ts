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
    paon: hit._source.paon || '', // Add house number for deduplication
  };
}

// Function to deduplicate comparables by property address, keeping only the most recent sale
function deduplicateComparables(comparables: any[]) {
  const propertyMap = new Map();
  
  comparables.forEach(comparable => {
    // Create a unique key based on house number and postcode
    const key = `${comparable.paon}_${comparable.postcode}`;
    
    if (!propertyMap.has(key) || new Date(comparable.date) > new Date(propertyMap.get(key).date)) {
      propertyMap.set(key, comparable);
    }
  });
  
  // Return deduplicated array, sorted by date (most recent first)
  return Array.from(propertyMap.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postcode = searchParams.get('postcode');
  let number = searchParams.get('number');

  if (!postcode || !number) {
    return NextResponse.json({ success: false, error: 'Missing postcode or number' }, { status: 400 });
  }

  // Clean the number parameter - it might be corrupted with postcode data
  // Extract just the house number part (before any postcode)
  const cleanNumber = number.split(' ')[0]; // Take only the first part before any space
  
  // Validate that we have a valid house number
  if (!cleanNumber || cleanNumber.trim() === '') {
    return NextResponse.json({ success: false, error: 'Invalid house number' }, { status: 400 });
  }
  
  const normalizedPostcode = normalizePostcode(postcode);
  // Debug logging reduced for cleaner console

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
          { match: { paon: cleanNumber } },
        ],
      },
    };
    // Subject property query logging removed
    
    const subjectResp = await esClient.search({
      index: 'properties-enhanced',
      body: {
        size: 1,
        query: subjectQuery,
      },
    });
    
    // Subject property response logging removed
    
    const subject = subjectResp.hits.hits[0]?._source;
    const subjectAny = subject as any;
    let bedroomCount = subjectAny?.epc_bedrooms;
    let propertyType = subjectAny?.property_type_label;
    
    // Subject property found logging removed

    // Step 2: Find comparables (same postcode, ideally same bedrooms/property type)
    // Calculate date 2 years ago for recent sales only
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const twoYearsAgoStr = twoYearsAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    let must: any[] = [
      { match_phrase: { postcode: normalizedPostcode } },
      { range: { date: { gte: twoYearsAgoStr } } }, // Only sales from last 2 years
    ];
    
    // Exclude the subject property from comparables
    let must_not: any[] = [
      { 
        bool: {
          must: [
            { match: { paon: cleanNumber } },
            { match_phrase: { postcode: normalizedPostcode } }
          ]
        }
      }
    ];
    
    if (bedroomCount) {
      must.push({ match: { bedrooms: bedroomCount } });
      usedBedroomFilter = true;
    }
    if (propertyType) {
      must.push({ match: { propertyType } });
    }
    
    const comparableQuery = { bool: { must, must_not } };
    // Comparable search query logging removed
    
    let resp = await esClient.search({
      index: 'properties-enhanced',
      body: {
        size: 5,
        sort: [{ date: { order: 'desc' } }],
        query: comparableQuery,
      },
    });
    
    // Comparable search response hits logging removed
    comparables = resp.hits.hits.map(formatComparable);

    // If not enough comparables, relax bedroom/propertyType filter
    if (comparables.length < 3) {
      // Not enough comparables logging removed
      must = [ { match_phrase: { postcode: normalizedPostcode } } ];
      resp = await esClient.search({
        index: 'properties-enhanced',
        body: {
          size: 5,
          sort: [{ date: { order: 'desc' } }],
          query: { 
            bool: { 
              must,
              must_not: [
                { 
                  bool: {
                    must: [
                      { match: { paon: cleanNumber } },
                      { match_phrase: { postcode: normalizedPostcode } }
                    ]
                  }
                }
              ]
            } 
          },
        },
      });
      comparables = resp.hits.hits.map(formatComparable);
      usedBedroomFilter = false;
      // Relaxed search response hits logging removed
    }

    // Deduplicate comparables to show only the most recent sale per property
    comparables = deduplicateComparables(comparables);

    // Calculate average price
    const prices = comparables.map(c => c.price).filter(p => typeof p === 'number');
    if (prices.length > 0) {
      avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    }
    // Set confidence
    if (comparables.length >= 3) confidence = 'high';
    else if (comparables.length > 0) confidence = 'medium';
    else confidence = 'low';

    // Final result calculated

    // Find subject property's sale history
    let subjectLastSale = null;
    try {
      const subjectSaleQuery = {
        bool: {
          must: [
            { match_phrase: { postcode: normalizedPostcode } },
            { match: { paon: cleanNumber } },
          ],
        },
      };
      
      const subjectSaleResp = await esClient.search({
        index: 'properties-clean',
        body: {
          size: 1,
          sort: [{ date: { order: 'desc' } }],
          query: subjectSaleQuery,
        },
      });
      
      if (subjectSaleResp.hits.hits.length > 0) {
        const sale = subjectSaleResp.hits.hits[0]._source as any;
        subjectLastSale = {
          price: sale.price,
          date: sale.date,
          propertyType: sale.property_type
        };
        // Subject property last sale found
      }
    } catch (error) {
      // Could not find subject property sale history
    }

    // Create subject object with requested details
    // Use the full address from the subject property response if available
    const subjectAddress = subjectAny?.address || subjectAny?.fullAddress;
    const streetName = subjectAny?.street || subjectAny?.street_name;
    
    const subjectProperty = {
      address: subjectAddress || `${cleanNumber} ${normalizedPostcode}`,
      fullAddress: subjectAddress || (streetName ? `${cleanNumber} ${streetName}, ${normalizedPostcode}` : `${cleanNumber}, ${normalizedPostcode}`),
      postcode: normalizedPostcode,
      propertyNumber: cleanNumber,
      propertyType: propertyType || 'Unknown',
      bedrooms: bedroomCount || null,
      lastSale: subjectLastSale,
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