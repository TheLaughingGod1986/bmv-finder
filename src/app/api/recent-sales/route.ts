import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';
import { 
  RecentSaleDocument,
  ElasticsearchResponse,
  extractSource,
  mapElasticsearchHits
} from '@/types/elasticsearch';
import { withAPITracking } from '@/lib/apiPerformanceMonitor';
import { validateRecentSales } from '@/lib/validationMiddleware';

async function handleRecentSales(request: NextRequest) {
  try {
    // Validate input parameters
    const validation = validateRecentSales(request);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
        timestamp: new Date().toISOString()
      }, { status: validation.statusCode });
    }

    const { postcode, limit, months } = validation.data.query;
    const searchScope = request.nextUrl.searchParams.get('searchScope') || 'area';

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
            date_of_transfer: {
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
        { date_of_transfer: { order: 'desc' } }
      ],
      _source: [
        'paon',
        'saon', 
        'street',
        'postcode',
        'price',
        'date_of_transfer',
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
          { date_of_transfer: { order: 'desc' } }
        ],
        _source: [
          'paon',
          'saon', 
          'street',
          'postcode',
          'price',
          'date_of_transfer',
          'propertyType',
          'newBuild',
          'estateType'
        ]
      });
      hits = response.hits?.hits || [];
      usedBroaderArea = true;
    }

    const recentSales = hits.map(hit => {
              const source = hit._source as RecentSaleDocument;
      const price = source.price;
      return {
        id: hit._id,
        price: typeof price === 'number' && price > 0 ? price : null,
        ...source
      };
    });


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

// Export with API tracking
export const GET = withAPITracking(handleRecentSales); 