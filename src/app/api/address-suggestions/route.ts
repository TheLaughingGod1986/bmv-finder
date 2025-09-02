import { NextRequest, NextResponse } from 'next/server';
import { formatPostcode } from '@/utils/formatPostcode';
import { esClient } from '@/lib/esClient';
import { 
  RecentSaleDocument,
  ElasticsearchResponse,
  extractSource,
  mapElasticsearchHits
} from '@/types/elasticsearch';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    const formattedQuery = formatPostcode(query);
    
    // Check if the query looks like a postcode
    const isPostcode = /^[A-Z]{1,2}[0-9][0-9A-Z]? ?[0-9][A-Z]{2}$/i.test(formattedQuery);
    
    if (isPostcode) {
      // Simple search for postcode
      const response = await esClient.search({
        index: 'recent_sales',
        size: 20,
        body: {
          query: {
            match: {
              postcode: formattedQuery
            }
          }
        }
      });

      console.log('Search response:', JSON.stringify(response, null, 2));

      // Extract unique addresses
      const addresses = new Set<string>();
      const processedAddresses: any[] = [];
      
      response.hits.hits.forEach((hit) => {
        const source = hit._source as RecentSaleDocument;
        if (source.address && source.postcode) {
          const cleanAddress = source.address.replace(/^,\s*/, '').trim();
          if (cleanAddress && !addresses.has(cleanAddress)) {
            addresses.add(cleanAddress);
            
            // Extract house number from the address
            let houseNumber = '1';
            let street = cleanAddress;
            
            // The address field contains just the house number, so use it directly
            if (/^\d+[A-Za-z]?$/.test(cleanAddress)) {
              houseNumber = cleanAddress;
              street = source.locality || 'Fourstones'; // Use locality as street name
            } else {
              // Try to extract house number if it's in a different format
              const match = cleanAddress.match(/^(\d+[A-Za-z]?)\s+(.+)/);
              if (match) {
                houseNumber = match[1];
                street = match[2];
              }
            }
            
            processedAddresses.push({
              address: `${houseNumber} ${street}`.trim(),
              postcode: source.postcode,
              number: houseNumber,
              street: street,
              locality: source.locality || '',
              town_city: source.town_city || source.locality || '',
              county: source.county || '',
              display: `${houseNumber} ${street}, ${source.postcode}`.trim()
            });
          }
        }
      });

      return NextResponse.json({
        suggestions: [],
        addresses: processedAddresses
      });
    } else {
      // Simple search for non-postcode queries
      const response = await esClient.search({
        index: 'recent_sales',
        size: 0,
        body: {
          query: {
            multi_match: {
              query: formattedQuery,
              fields: ['postcode', 'address', 'locality']
            }
          },
          aggs: {
            postcodes: {
              terms: {
                field: 'postcode.keyword',
                size: 10
              }
            }
          }
        }
      });

              const postcodes = (response.aggregations?.postcodes as { buckets: Array<{ key: string; doc_count: number }> })?.buckets?.map((bucket) => bucket.key) || [];

      return NextResponse.json({
        suggestions: postcodes,
        addresses: []
      });
    }

  } catch (error) {
    console.error('Address suggestions error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 