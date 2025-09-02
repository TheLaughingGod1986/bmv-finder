import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';
import { 
  HPIDocument,
  ElasticsearchResponse,
  extractSource,
  mapElasticsearchHits
} from '@/types/elasticsearch';

const HPI_INDEX = 'house_price_index';

export async function GET(request: NextRequest) {
  try {
    const response = await esClient.search({
      index: HPI_INDEX,
      size: 0,
      aggs: {
        min_date: { min: { field: 'date' } },
        max_date: { max: { field: 'date' } }
      }
    });

    const minDate = (response.aggregations?.min_date as { value_as_string: string })?.value_as_string;
    const maxDate = (response.aggregations?.max_date as { value_as_string: string })?.value_as_string;

    return NextResponse.json({
      success: true,
      minDate,
      maxDate
    });
  } catch (error) {
    console.error('Error fetching HPI date range:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch HPI date range',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 