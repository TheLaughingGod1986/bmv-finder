import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@elastic/elasticsearch';

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');

    if (!postcode) {
      return NextResponse.json(
        { error: 'Postcode parameter is required' },
        { status: 400 }
      );
    }

    // Extract postcode area (first part before space)
    const postcodeArea = postcode.split(' ')[0];

    console.log(`Fetching planning authority data for postcode area: ${postcodeArea}`);

    // Search for planning authority data
    const response = await esClient.search({
      index: 'planning-authority-data',
      body: {
        query: {
          bool: {
            must: [
              {
                term: {
                  postcode_area: postcodeArea
                }
              }
            ]
          }
        },
        size: 1
      }
    });

    if (response.hits.hits.length === 0) {
      // Return mock data if no planning authority data found
      const mockData = {
        postcode_area: postcodeArea,
        local_authority: {
          council_tax_band: 'D',
          planning_zone: 'Residential',
          conservation_area: false,
          listed_building: false,
          flood_risk: 'Very Low',
          transport_score: 7,
          school_score: 6,
          amenity_score: 8
        },
        transport: {
          nearest_tube: {
            station: 'Nearest Tube Station',
            distance_meters: 800,
            lines: ['Central', 'Piccadilly'],
            frequency_minutes: 5
          },
          nearest_train: {
            station: 'Nearest Train Station',
            distance_meters: 1200,
            lines: ['Main Line'],
            frequency_minutes: 15
          },
          nearest_bus: {
            stops: ['Bus Stop 1', 'Bus Stop 2'],
            distance_meters: 200,
            routes: ['Route 1', 'Route 2'],
            frequency_minutes: 10
          }
        },
        schools: [
          {
            name: 'Local Primary School',
            distance_meters: 500,
            ofsted_rating: 'Good',
            type: 'Primary',
            age_range: '4-11'
          },
          {
            name: 'Local Secondary School',
            distance_meters: 1200,
            ofsted_rating: 'Outstanding',
            type: 'Secondary',
            age_range: '11-18'
          }
        ],
        amenities: {
          supermarkets: [
            {
              name: 'Local Supermarket',
              distance_meters: 300
            }
          ],
          restaurants: [
            {
              name: 'Local Restaurant',
              distance_meters: 400,
              rating: 4.2
            }
          ],
          parks: [
            {
              name: 'Local Park',
              distance_meters: 600
            }
          ]
        },
        market_metrics: {
          avg_days_on_market: 45,
          price_reduction_rate: 0.15,
          market_sentiment: 'positive',
          demand_score: 7,
          supply_score: 6,
          price_trend: 'increasing',
          rental_yield: 4.2,
          capital_growth_rate: 3.5
        },
        recent_activity: {
          properties_sold_last_month: 12,
          properties_listed_last_month: 8,
          avg_price_per_sqm: 4500,
          price_volatility: 'low'
        }
      };

      return NextResponse.json({
        success: true,
        data: mockData,
        message: 'Mock planning authority data returned'
      });
    }

    const planningData = response.hits.hits[0]._source;

    return NextResponse.json({
      success: true,
      data: planningData,
      message: 'Planning authority data retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching planning authority data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch planning authority data' },
      { status: 500 }
    );
  }
} 