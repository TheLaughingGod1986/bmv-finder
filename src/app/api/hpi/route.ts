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
      // 1. Get latest data for each region
      const response = await esClient.search({
        index: HPI_INDEX,
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
              size: 50
            },
            aggs: {
              latest_data: {
                top_hits: {
                  size: 1,
                  sort: [{ date: { order: 'desc' } }]
                }
              },
              prev_year_data: {
                top_hits: {
                  size: 1,
                  sort: [{ date: { order: 'desc' } }],
                  script_fields: {
                    prev_year_date: {
                      script: {
                        source: "def latest = doc['date'].value; return latest.minusYears(1).toString().substring(0,7);"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

              const regions = (response.aggregations?.regions as { buckets: Array<{ key: string; doc_count: number }> })?.buckets || [];
      // For each region, fetch the latest and previous year's index
      const data = await Promise.all(regions.map(async (bucket: any) => {
        const latest = bucket.latest_data.hits.hits[0]._source;
        const region = latest.region;
        const latestDate = latest.date;
        // Fetch previous year's index for the same region and month
        const prevYear = (parseInt(latestDate.substring(0, 4)) - 1) + latestDate.substring(4);
        const prevYearRes = await esClient.search({
          index: HPI_INDEX,
          query: {
            bool: {
              must: [
                { term: { region } },
                { term: { date: prevYear } }
              ]
            }
          },
          size: 1
        });
        let yoyGrowth = null;
        if (prevYearRes.hits.hits.length > 0) {
          const prevIndex = (prevYearRes.hits.hits[0]._source as HPIDocument).hpi_index || (prevYearRes.hits.hits[0]._source as HPIDocument).index_value || 100;
          yoyGrowth = prevIndex !== 0 ? ((latest.hpiIndex - prevIndex) / prevIndex) * 100 : null;
        }
        return {
          ...latest,
          yoyGrowth: yoyGrowth !== null ? parseFloat(yoyGrowth.toFixed(2)) : null
        };
      }));

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
      query,
      sort: [
        { region: { order: 'asc' } },
        { date: { order: 'asc' } }
      ],
      size: limit
    });

    const data = response.hits.hits.map(hit => hit._source);

    return NextResponse.json({
      success: true,
      data,
              total: (response.hits.total as { value: number })?.value || response.hits.total || 0,
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
            avg: { field: 'hpiIndex' }
          },
          min_index: {
            min: { field: 'hpiIndex' }
          },
          max_index: {
            max: { field: 'hpiIndex' }
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
      query,
      size: 0,
      aggs
    });

            const buckets = (response.aggregations?.time_series as { buckets: Array<{ key: string; doc_count: number }> })?.buckets || [];
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