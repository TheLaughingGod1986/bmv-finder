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

    // Search for postcodes and addresses
    const formattedQuery = formatPostcode(query);
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
      postcodes: [...new Set(postcodes)],
      addresses: [...new Set(addresses)]
    });

  } catch (error) {
    console.error('Address suggestions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 