import { NextRequest, NextResponse } from 'next/server';
import { formatPostcode } from '@/utils/formatPostcode';
import { flexibleSearch } from '@/lib/esClient';

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
      const response = await flexibleSearch({
        index: 'properties-enhanced',
        body: {
          size: 50, // Increased from 20 to get more results
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
              ],
              minimum_should_match: 1
            }
          },
          _source: ['paon', 'street', 'postcode', 'address', 'locality', 'town_city', 'county'],
          sort: [
            { paon: { order: 'asc' } } // Sort by house number to ensure consistent ordering
          ]
        }
      });

      // Process and clean addresses
      const processedAddresses: any[] = [];
      const seenAddresses = new Set<string>();
      
      response.hits.hits.forEach((hit: any) => {
        const source = hit._source;
        
        // Clean up the street name - remove postcode and extra parts
        let cleanStreet = source.street || source.address || '';
        
        // Extract house number if it's part of the street
        let houseNumber = source.paon || '';
        if (!houseNumber && cleanStreet) {
          // Try to extract house number from the beginning of the street
          const match = cleanStreet.match(/^(\d+[A-Za-z]?)\s+(.+)/);
          if (match) {
            houseNumber = match[1];
            cleanStreet = match[2];
          }
        }
        
        // Clean up the street name
        if (cleanStreet.includes(',')) {
          // Take only the first part before the first comma
          cleanStreet = cleanStreet.split(',')[0].trim();
        }
        
        // Remove any postcode pattern from the street name
        cleanStreet = cleanStreet.replace(/\b[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}\b/gi, '').trim();
        
        // Remove common suffixes that might be duplicated
        cleanStreet = cleanStreet.replace(/\s+(NEWCASTLE UPON TYNE|TYNE AND WEAR|NORTHUMBERLAND|LONDON|MANCHESTER|BIRMINGHAM|LEEDS|LIVERPOOL|BRISTOL)$/i, '').trim();
        
        // Clean up any trailing commas or extra spaces
        cleanStreet = cleanStreet.replace(/[,\s]+$/, '').trim();
        
        // Apply specific mappings for known addresses
        const postcodeToStreet: { [key: string]: { [key: string]: string } } = {
          'NE5 4PR': {
            'default': 'Lowbiggin',
            'LOWBIGGIN': 'Lowbiggin'
          },
          'NE5 2PR': {
            'default': 'Fourstones',
            'FOURSTONES': 'Fourstones',
            'FOURSTONE': 'Fourstones'
          },
          'NE17 7JH': {
            'default': 'Westwood Road',
            'WESTWOOD ROAD': 'Westwood Road'
          }
        };
        
        // Normalize and fix street names
        const upperStreet = cleanStreet.toUpperCase();
        if (source.postcode && postcodeToStreet[source.postcode]) {
          const mapping = postcodeToStreet[source.postcode];
          cleanStreet = mapping[upperStreet] || mapping['default'] || cleanStreet;
        }
        
        // Create a unique key for deduplication
        const uniqueKey = `${houseNumber}-${cleanStreet.toLowerCase()}-${source.postcode}`;
        
        // Only add if we haven't seen this exact address before
        if (!seenAddresses.has(uniqueKey) && houseNumber && cleanStreet) {
          seenAddresses.add(uniqueKey);
          
          processedAddresses.push({
            address: `${houseNumber} ${cleanStreet}`.trim(),
            postcode: source.postcode || '',
            number: houseNumber,
            street: cleanStreet,
            locality: source.locality || '',
            town_city: source.town_city || 'Newcastle upon Tyne',
            county: source.county || 'Tyne and Wear',
            display: `${houseNumber} ${cleanStreet}, ${source.postcode || ''}`.trim()
          });
        }
      });

      // Sort by house number (handle both numeric and alphanumeric)
      processedAddresses.sort((a: any, b: any) => {
        // Extract numeric part for sorting
        const getNumericPart = (num: string) => {
          const match = num.match(/^(\d+)/);
          return match ? parseInt(match[1]) : 0;
        };
        
        const numA = getNumericPart(a.number);
        const numB = getNumericPart(b.number);
        
        if (numA !== numB) {
          return numA - numB;
        }
        
        // If numeric parts are equal, sort by the full number string
        return a.number.localeCompare(b.number);
      });

      return NextResponse.json({
        suggestions: [],
        addresses: processedAddresses
      });
    } else {
      // If it's not a postcode, search for postcodes and addresses as before
      const response = await flexibleSearch({
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