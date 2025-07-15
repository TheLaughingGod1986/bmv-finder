import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const limit = parseInt(searchParams.get('limit') || '10');
    const months = parseInt(searchParams.get('months') || '12');
    const searchScope = searchParams.get('searchScope') || 'area';

    if (!postcode) {
      return NextResponse.json(
        { error: 'Postcode parameter is required' },
        { status: 400 }
      );
    }

    // Calculate date range (e.g., last 12 months)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Normalize postcode (remove spaces, uppercase)
    const normalizedPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    // Extract postcode area (e.g., 'SS9' from 'SS9 5EL')
    const postcodeAreaMatch = postcode.match(/^[A-Z]{1,2}\d{1,2}/i);
    const postcodeArea = postcodeAreaMatch ? postcodeAreaMatch[0].toUpperCase() : normalizedPostcode.substring(0, 2);
    // Extract broader area (e.g., 'SS' from 'SS9 5EL')
    const broaderAreaMatch = postcode.match(/^[A-Z]{1,2}/i);
    const broaderArea = broaderAreaMatch ? broaderAreaMatch[0].toUpperCase() : normalizedPostcode.substring(0, 2);

    // Helper to build query for a given prefix
    const buildQuery = (prefix) => ({
      bool: {
        must: [
          {
            prefix: { postcode: prefix }
          },
          {
            range: {
              dateOfTransfer: {
                gte: startDate.toISOString().split('T')[0],
                lte: endDate.toISOString().split('T')[0]
              }
            }
          }
        ]
      }
    });

    let query, usedBroaderArea = false;
    if (searchScope === 'broader') {
      query = buildQuery(broaderArea);
      usedBroaderArea = true;
    } else {
      query = buildQuery(postcodeArea);
    }

    let response = await esClient.search({
      index: 'recent_sales',
      size: limit,
      query,
      sort: [
        { dateOfTransfer: { order: 'desc' } }
      ],
      _source: [
        'paon',
        'saon', 
        'street',
        'postcode',
        'pricePaid',
        'dateOfTransfer',
        'propertyType',
        'newBuild',
        'estateType'
      ]
    });

    let hits = response.hits?.hits || [];
    // If no results and not already using broader, retry with broader
    if (hits.length === 0 && searchScope !== 'broader') {
      query = buildQuery(broaderArea);
      response = await esClient.search({
        index: 'recent_sales',
        size: limit,
        query,
        sort: [
          { dateOfTransfer: { order: 'desc' } }
        ],
        _source: [
          'paon',
          'saon', 
          'street',
          'postcode',
          'pricePaid',
          'dateOfTransfer',
          'propertyType',
          'newBuild',
          'estateType'
        ]
      });
      hits = response.hits?.hits || [];
      usedBroaderArea = true;
    }

    const recentSales = hits.map(hit => {
      const source = hit._source as any;
      const pricePaid = source.pricePaid;
      return {
        id: hit._id,
        price: typeof pricePaid === 'number' && pricePaid > 0 ? pricePaid : null,
        ...source
      };
    });

    console.log(`[recent-sales] Found ${recentSales.length} recent sales for ${postcode}`);

    return NextResponse.json({
      success: true,
      data: recentSales,
      total: typeof response.hits?.total === 'object' ? response.hits.total.value : response.hits?.total || 0,
      postcode: postcode,
      area: postcodeArea,
      broaderArea,
      usedBroaderArea,
      dateRange: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('[recent-sales] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent sales', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 