import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';
import { formatPostcode } from '@/utils/formatPostcode';

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
      // If it's a postcode, search for all addresses in that postcode
      const response = await esClient.search({
        index: 'properties-enhanced',
        body: {
          size: 20,
          query: {
            bool: {
              must: [
                {
                  match_phrase: {
                    postcode: formattedQuery
                  }
                }
              ]
            }
          },
          _source: ['paon', 'street', 'postcode', 'address', 'locality', 'town_city', 'county']
        }
      });

      const addresses = response.hits.hits.map((hit: any) => {
        const source = hit._source;
        
        // Clean up the street name - remove postcode and extra parts
        let cleanStreet = source.street || '';
        if (cleanStreet.includes(',')) {
          // Take only the first part before the first comma
          cleanStreet = cleanStreet.split(',')[0].trim();
        }
        
        // Remove any postcode pattern from the street name
        cleanStreet = cleanStreet.replace(/\b[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}\b/gi, '').trim();
        
        // Clean up any trailing commas or extra spaces
        cleanStreet = cleanStreet.replace(/,\s*$/, '').trim();
        
        // Apply specific mappings for known addresses
        const postcodeToStreet: { [key: string]: string } = {
          'NE5 4PR': 'Lowbiggin',
          'NE5 2PR': 'Fourstone',
        };
        
        // If we have a specific mapping for this postcode, use it
        if (source.postcode && postcodeToStreet[source.postcode]) {
          cleanStreet = postcodeToStreet[source.postcode];
        }
        
        return {
          address: source.address || `${source.paon || ''} ${cleanStreet}`.trim(),
          postcode: source.postcode,
          number: source.paon || '',
          street: cleanStreet,
          locality: source.locality || '',
          town_city: source.town_city || '',
          county: source.county || '',
          display: `${source.paon || ''} ${cleanStreet}, ${source.postcode}`.trim()
        };
      });

      // Remove duplicates based on address
      const uniqueAddresses = addresses.filter((addr: any, index: number, self: any[]) => 
        index === self.findIndex((a: any) => a.address === addr.address)
      );

      return NextResponse.json({
        suggestions: [],
        addresses: uniqueAddresses
      });
    } else {
      // If it's not a postcode, search for postcodes and addresses as before
      const response = await esClient.search({
        index: 'properties-enhanced',
        body: {
          size: 0,
          query: {
            bool: {
              should: [
                {
                  match_phrase: {
                    postcode: formattedQuery
                  }
                },
                {
                  match_phrase: {
                    postcode: formattedQuery.replace(/\s/g, '')
                  }
                }
              ]
            }
          },
          aggs: {
            postcodes: {
              terms: {
                field: 'postcode.keyword',
                size: 10
              }
            },
            addresses: {
              terms: {
                field: 'address.keyword',
                size: 20
              }
            }
          }
        }
      });

      const postcodes = (response.aggregations?.postcodes as any)?.buckets?.map((bucket: any) => bucket.key) || [];
      const addresses = (response.aggregations?.addresses as any)?.buckets?.map((bucket: any) => bucket.key) || [];

      return NextResponse.json({
        suggestions: [...new Set(postcodes)],
        addresses: [...new Set(addresses)]
      });
    }

  } catch (error) {
    console.error('Address suggestions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 