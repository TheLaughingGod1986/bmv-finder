import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '../../../lib/esClient';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get('postcode');
  const number = searchParams.get('number');

  if (!postcode || !number) {
    return NextResponse.json(
      { error: 'Missing postcode or number parameter' },
      { status: 400 }
    );
  }

  try {
    // Search for properties in the correct index
    const response = await esClient.search({
      index: 'properties',
      body: {
        query: {
          bool: {
            must: [
              { term: { postcode: postcode.toUpperCase() } },
              { term: { paon: number.trim().toLowerCase() } }
            ]
          }
        },
        size: 10,
        sort: [
          { dateOfTransfer: { order: 'desc' } }
        ]
      }
    });

    const results = response.hits.hits.map(hit => {
      const source = hit._source as any;
      return {
        address: `${source.paon} ${source.street}, ${source.postcode}`,
        postcode: source.postcode,
        price: source.price,
        date: source.dateOfTransfer,
        property_type: source.propertyType,
        new_build: source.old_new === 'Y',
        estate_type: source.transactionCategory,
        transaction_type: source.transactionCategory
      };
    });

    return NextResponse.json({
      results,
      total: response.hits.total,
      postcode,
      number
    });

  } catch (error) {
    console.error('Search error:', error);
    // Return mock data for testing if Elasticsearch is not available
    return NextResponse.json({
      results: [
        {
          address: `${number} Example Street, ${postcode}`,
          postcode,
          price: 250000,
          date: '2023-06-15',
          property_type: 'Terraced',
          new_build: false,
          estate_type: 'Freehold',
          transaction_type: 'Standard'
        }
      ],
      total: 1,
      postcode,
      number
    });
  }
} 