import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';

const HPI_INDEX = 'house_price_index';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '1000');

    // Build query
    const query: any = {
      bool: {
        must: []
      }
    };

    if (region) {
      query.bool.must.push({ term: { region: region } });
    }

    if (startDate || endDate) {
      const dateRange: any = {};
      if (startDate) dateRange.gte = startDate;
      if (endDate) dateRange.lte = endDate;
      query.bool.must.push({ range: { date: dateRange } });
    }

    // If no specific query, get latest data for all regions
    if (query.bool.must.length === 0) {
      const response = await esClient.search({
        index: HPI_INDEX,
        body: {
          query: { match_all: {} },
          sort: [
            { region: { order: 'asc' } },
            { date: { order: 'desc' } }
          ],
          size: 0,
          aggs: {
            regions: {
              terms: {
                field: 'region',
                size: 20
              },
              aggs: {
                latest_data: {
                  top_hits: {
                    size: 1,
                    sort: [{ date: { order: 'desc' } }]
                  }
                }
              }
            }
          }
        }
      });

      const regions = (response.aggregations?.regions as any)?.buckets || [];
      const data = regions.map((bucket: any) => bucket.latest_data.hits.hits[0]._source);

      return NextResponse.json({
        success: true,
        data,
        total: data.length,
        source: 'latest_by_region'
      });
    }

    // Execute search
    const response = await esClient.search({
      index: HPI_INDEX,
      body: {
        query,
        sort: [
          { region: { order: 'asc' } },
          { date: { order: 'asc' } }
        ],
        size: limit
      }
    });

    const data = response.hits.hits.map(hit => hit._source);

    return NextResponse.json({
      success: true,
      data,
      total: (response.hits.total as any)?.value || response.hits.total || 0,
      source: 'filtered_search'
    });

  } catch (error) {
    console.error('Error fetching HPI data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch HPI data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { region, startDate, endDate, groupBy = 'month' } = body;

    // Build aggregation query
    const aggs: any = {
      time_series: {
        date_histogram: {
          field: 'date',
          calendar_interval: groupBy,
          format: 'yyyy-MM'
        },
        aggs: {
          avg_index: {
            avg: { field: 'index' }
          },
          min_index: {
            min: { field: 'index' }
          },
          max_index: {
            max: { field: 'index' }
          }
        }
      }
    };

    const query: any = {
      bool: {
        must: []
      }
    };

    if (region) {
      query.bool.must.push({ term: { region: region } });
    }

    if (startDate || endDate) {
      const dateRange: any = {};
      if (startDate) dateRange.gte = startDate;
      if (endDate) dateRange.lte = endDate;
      query.bool.must.push({ range: { date: dateRange } });
    }

    const response = await esClient.search({
      index: HPI_INDEX,
      body: {
        query,
        size: 0,
        aggs
      }
    });

    const buckets = (response.aggregations?.time_series as any)?.buckets || [];
    const timeSeriesData = buckets.map((bucket: any) => ({
      date: bucket.key_as_string,
      timestamp: bucket.key,
      avgIndex: bucket.avg_index.value,
      minIndex: bucket.min_index.value,
      maxIndex: bucket.max_index.value,
      count: bucket.doc_count
    }));

    return NextResponse.json({
      success: true,
      data: timeSeriesData,
      total: timeSeriesData.length,
      source: 'time_series_aggregation'
    });

  } catch (error) {
    console.error('Error fetching HPI time series:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch HPI time series',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 