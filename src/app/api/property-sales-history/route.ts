import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const number = searchParams.get('number');

    if (!postcode || !number) {
      return NextResponse.json(
        { error: 'Postcode and property number are required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching sales history for:', { postcode, number });

    // Search for all sales for this specific property
    const response = await esClient.search({
      index: 'properties-enhanced',
      body: {
        query: {
          bool: {
            must: [
              { match_phrase: { postcode: postcode.toUpperCase() } },
              { match: { paon: number } }
            ]
          }
        },
        size: 50, // Get up to 50 sales for this property
        sort: [
          { date: { order: 'desc' } }
        ]
      }
    });

    const salesHistory = response.hits.hits.map(hit => {
      const source = hit._source as any;
      return {
        id: hit._id,
        price: source.price,
        date: source.date,
        propertyType: source.property_type_label || source.property_type,
        postcode: source.postcode,
        paon: source.paon,
        street: source.street,
        locality: source.locality,
        town_city: source.town_city,
        county: source.county,
        new_build: source.new_build_label === 'Y' || source.new_build === true,
        estate_type: source.estate_type_label || source.estate_type,
        transaction_category: source.transaction_category_label || source.transaction_category
      };
    });

    console.log(`✅ Found ${salesHistory.length} sales for ${number} ${postcode}`);

    return NextResponse.json({
      success: true,
      salesHistory,
      total: salesHistory.length,
      property: {
        number,
        postcode,
        address: `${number} ${salesHistory[0]?.street || ''}, ${postcode}`
      }
    });

  } catch (error) {
    console.error('❌ Error fetching property sales history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch property sales history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 