import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '../../../lib/esClient';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.toUpperCase() || '';
  
  if (!query || query.length < 2) {
    return NextResponse.json({ 
      suggestions: [],
      addresses: []
    });
  }

  try {
    // Check if input looks like a postcode
    const postcodePattern = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i;
    const shortPostcodePattern = /^[A-Z]{1,2}[0-9][0-9A-Z]?$/i;
    
    let suggestions: string[] = [];
    let addresses: Array<{
      address: string;
      postcode: string;
      number: string;
      street: string;
      display: string;
    }> = [];

    if (postcodePattern.test(query) || shortPostcodePattern.test(query)) {
      // Postcode search - get addresses for this postcode
      const formattedQuery = query.replace(/\s+/g, '');
      const withSpace = formattedQuery.length > 3 ? 
        formattedQuery.slice(0, -3) + ' ' + formattedQuery.slice(-3) : 
        formattedQuery;

      const response = await esClient.search({
        index: 'properties',
        size: 20,
        body: {
          query: {
            bool: {
              should: [
                { match_phrase: { postcode: formattedQuery } },
                { match_phrase: { postcode: withSpace } },
                { prefix: { postcode: formattedQuery } }
              ],
              minimum_should_match: 1
            }
          },
          sort: [
            { dateOfTransfer: { order: 'desc' } }
          ],
          aggs: {
            unique_addresses: {
              composite: {
                size: 50,
                sources: [
                  { postcode: { terms: { field: 'postcode.keyword' } } },
                  { paon: { terms: { field: 'paon.keyword' } } },
                  { street: { terms: { field: 'street.keyword' } } }
                ]
              }
            }
          }
        }
      });

      // Extract unique addresses
      const buckets = (response.aggregations?.unique_addresses as any)?.buckets || [];
      addresses = buckets.map((bucket: any) => {
        const postcode = bucket.key.postcode;
        const number = bucket.key.paon || '';
        const street = bucket.key.street || '';
        
        return {
          address: `${number} ${street}, ${postcode}`,
          postcode,
          number,
          street,
          display: `${number} ${street}, ${postcode}`
        };
      });

      // Also get postcode suggestions
      const postcodeResponse = await esClient.search({
        index: 'properties',
        size: 10,
        body: {
          query: {
            prefix: {
              postcode: formattedQuery
            }
          },
          aggs: {
            unique_postcodes: {
              terms: {
                field: 'postcode.keyword',
                size: 10
              }
            }
          }
        }
      });

      const postcodeBuckets = (postcodeResponse.aggregations?.unique_postcodes as any)?.buckets || [];
      suggestions = postcodeBuckets.map((bucket: any) => bucket.key);

    } else {
      // General search - look for streets, towns, etc.
      const response = await esClient.search({
        index: 'properties',
        size: 20,
        body: {
          query: {
            bool: {
              should: [
                { match: { street: { query, fuzziness: 'AUTO' } } },
                { match: { town_city: { query, fuzziness: 'AUTO' } } },
                { match: { locality: { query, fuzziness: 'AUTO' } } },
                { match: { county: { query, fuzziness: 'AUTO' } } }
              ],
              minimum_should_match: 1
            }
          },
          sort: [
            { dateOfTransfer: { order: 'desc' } }
          ]
        }
      });

      // Extract unique addresses from results
      const seenAddresses = new Set();
      addresses = response.hits.hits
        .map((hit: any) => {
          const source = hit._source;
          const address = `${source.paon || ''} ${source.street || ''}, ${source.postcode || ''}`.trim();
          
          if (!seenAddresses.has(address) && address.length > 0) {
            seenAddresses.add(address);
            return {
              address,
              postcode: source.postcode || '',
              number: source.paon || '',
              street: source.street || '',
              display: address
            };
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, 10);
    }

    return NextResponse.json({
      suggestions,
      addresses,
      query
    });

  } catch (error) {
    console.error('Address suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
} 