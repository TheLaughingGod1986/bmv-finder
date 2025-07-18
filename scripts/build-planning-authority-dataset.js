const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  }
});

// Planning Permission Data Structure
const planningData = [
  // London - High activity areas
  {
    postcode_area: 'SW1A',
    planning_applications: [
      {
        application_id: '2024/1234',
        property_address: '10 SW1A 1AA',
        application_type: 'residential_extension',
        status: 'approved',
        decision_date: '2024-06-15',
        estimated_value: 50000,
        description: 'Single storey rear extension',
        impact_on_value: 'positive'
      },
      {
        application_id: '2024/1235',
        property_address: '15 SW1A 1AB',
        application_type: 'loft_conversion',
        status: 'pending',
        decision_date: null,
        estimated_value: 75000,
        description: 'Loft conversion with dormer window',
        impact_on_value: 'positive'
      }
    ],
    local_authority: {
      council_tax_band: 'H',
      planning_zone: 'residential',
      conservation_area: true,
      listed_building: false,
      flood_risk: 'low',
      transport_score: 9.5,
      school_score: 8.8,
      amenity_score: 9.2
    }
  },
  {
    postcode_area: 'SW1P',
    planning_applications: [
      {
        application_id: '2024/1236',
        property_address: '25 SW1P 1AA',
        application_type: 'basement_conversion',
        status: 'approved',
        decision_date: '2024-05-20',
        estimated_value: 120000,
        description: 'Basement conversion to living space',
        impact_on_value: 'positive'
      }
    ],
    local_authority: {
      council_tax_band: 'G',
      planning_zone: 'residential',
      conservation_area: true,
      listed_building: false,
      flood_risk: 'low',
      transport_score: 9.0,
      school_score: 8.5,
      amenity_score: 8.8
    }
  },
  // Manchester
  {
    postcode_area: 'M1',
    planning_applications: [
      {
        application_id: '2024/1237',
        property_address: '10 M1 1AA',
        application_type: 'commercial_residential',
        status: 'approved',
        decision_date: '2024-04-10',
        estimated_value: 80000,
        description: 'Commercial to residential conversion',
        impact_on_value: 'positive'
      }
    ],
    local_authority: {
      council_tax_band: 'D',
      planning_zone: 'mixed_use',
      conservation_area: false,
      listed_building: false,
      flood_risk: 'medium',
      transport_score: 8.5,
      school_score: 7.8,
      amenity_score: 8.2
    }
  },
  // Birmingham
  {
    postcode_area: 'B1',
    planning_applications: [
      {
        application_id: '2024/1238',
        property_address: '5 B1 1AA',
        application_type: 'new_build',
        status: 'approved',
        decision_date: '2024-03-15',
        estimated_value: 150000,
        description: 'New build residential development',
        impact_on_value: 'positive'
      }
    ],
    local_authority: {
      council_tax_band: 'C',
      planning_zone: 'residential',
      conservation_area: false,
      listed_building: false,
      flood_risk: 'low',
      transport_score: 8.0,
      school_score: 7.5,
      amenity_score: 7.8
    }
  },
  // Leeds
  {
    postcode_area: 'LS1',
    planning_applications: [
      {
        application_id: '2024/1239',
        property_address: '20 LS1 1AA',
        application_type: 'extension',
        status: 'pending',
        decision_date: null,
        estimated_value: 45000,
        description: 'Two storey side extension',
        impact_on_value: 'positive'
      }
    ],
    local_authority: {
      council_tax_band: 'D',
      planning_zone: 'residential',
      conservation_area: false,
      listed_building: false,
      flood_risk: 'low',
      transport_score: 8.2,
      school_score: 7.8,
      amenity_score: 8.0
    }
  },
  // Liverpool
  {
    postcode_area: 'L1',
    planning_applications: [
      {
        application_id: '2024/1240',
        property_address: '15 L1 1AA',
        application_type: 'refurbishment',
        status: 'approved',
        decision_date: '2024-02-28',
        estimated_value: 35000,
        description: 'Complete property refurbishment',
        impact_on_value: 'positive'
      }
    ],
    local_authority: {
      council_tax_band: 'C',
      planning_zone: 'residential',
      conservation_area: true,
      listed_building: false,
      flood_risk: 'medium',
      transport_score: 7.8,
      school_score: 7.2,
      amenity_score: 7.5
    }
  },
  // Newcastle
  {
    postcode_area: 'NE1',
    planning_applications: [
      {
        application_id: '2024/1241',
        property_address: '30 NE1 1AA',
        application_type: 'conversion',
        status: 'approved',
        decision_date: '2024-01-20',
        estimated_value: 60000,
        description: 'Office to residential conversion',
        impact_on_value: 'positive'
      }
    ],
    local_authority: {
      council_tax_band: 'D',
      planning_zone: 'mixed_use',
      conservation_area: false,
      listed_building: false,
      flood_risk: 'low',
      transport_score: 8.0,
      school_score: 7.5,
      amenity_score: 7.8
    }
  },
  // Sheffield
  {
    postcode_area: 'S1',
    planning_applications: [
      {
        application_id: '2024/1242',
        property_address: '8 S1 1AA',
        application_type: 'extension',
        status: 'pending',
        decision_date: null,
        estimated_value: 40000,
        description: 'Kitchen extension',
        impact_on_value: 'positive'
      }
    ],
    local_authority: {
      council_tax_band: 'C',
      planning_zone: 'residential',
      conservation_area: false,
      listed_building: false,
      flood_risk: 'low',
      transport_score: 7.5,
      school_score: 7.8,
      amenity_score: 7.6
    }
  },
  // Bristol
  {
    postcode_area: 'BS1',
    planning_applications: [
      {
        application_id: '2024/1243',
        property_address: '12 BS1 1AA',
        application_type: 'loft_conversion',
        status: 'approved',
        decision_date: '2024-06-01',
        estimated_value: 55000,
        description: 'Loft conversion with en-suite',
        impact_on_value: 'positive'
      }
    ],
    local_authority: {
      council_tax_band: 'E',
      planning_zone: 'residential',
      conservation_area: true,
      listed_building: false,
      flood_risk: 'medium',
      transport_score: 8.5,
      school_score: 8.2,
      amenity_score: 8.4
    }
  },
  // Edinburgh
  {
    postcode_area: 'EH1',
    planning_applications: [
      {
        application_id: '2024/1244',
        property_address: '25 EH1 1AA',
        application_type: 'basement_conversion',
        status: 'approved',
        decision_date: '2024-05-10',
        estimated_value: 90000,
        description: 'Basement conversion to living space',
        impact_on_value: 'positive'
      }
    ],
    local_authority: {
      council_tax_band: 'F',
      planning_zone: 'residential',
      conservation_area: true,
      listed_building: false,
      flood_risk: 'low',
      transport_score: 8.8,
      school_score: 8.5,
      amenity_score: 8.7
    }
  }
];

// Transport & Infrastructure Data
const transportData = [
  {
    postcode_area: 'SW1A',
    transport: {
      nearest_tube: {
        station: 'Westminster',
        distance_meters: 450,
        lines: ['Circle', 'District', 'Jubilee'],
        frequency_minutes: 3
      },
      nearest_train: {
        station: 'London Waterloo',
        distance_meters: 1200,
        lines: ['South Western Railway'],
        frequency_minutes: 5
      },
      nearest_bus: {
        stops: ['Westminster Station', 'Parliament Square'],
        distance_meters: 200,
        routes: ['12', '24', '88', '148'],
        frequency_minutes: 2
      }
    },
    schools: [
      {
        name: 'Westminster School',
        distance_meters: 800,
        ofsted_rating: 'Outstanding',
        type: 'Independent',
        age_range: '13-18'
      },
      {
        name: 'St James\'s Primary School',
        distance_meters: 600,
        ofsted_rating: 'Good',
        type: 'State',
        age_range: '4-11'
      }
    ],
    amenities: {
      supermarkets: [
        { name: 'Tesco Express', distance_meters: 300 },
        { name: 'Sainsbury\'s Local', distance_meters: 400 }
      ],
      restaurants: [
        { name: 'The Ivy', distance_meters: 500, rating: 4.5 },
        { name: 'Sketch', distance_meters: 800, rating: 4.8 }
      ],
      parks: [
        { name: 'St James\'s Park', distance_meters: 400 },
        { name: 'Green Park', distance_meters: 600 }
      ]
    }
  }
];

// Market Sentiment Data
const marketSentimentData = [
  {
    postcode_area: 'SW1A',
    market_metrics: {
      avg_days_on_market: 45,
      price_reduction_rate: 0.15,
      market_sentiment: 'stable',
      demand_score: 8.2,
      supply_score: 6.8,
      price_trend: 'increasing',
      rental_yield: 4.2,
      capital_growth_rate: 3.8
    },
    recent_activity: {
      properties_sold_last_month: 12,
      properties_listed_last_month: 8,
      avg_price_per_sqm: 8500,
      price_volatility: 'low'
    }
  },
  {
    postcode_area: 'M1',
    market_metrics: {
      avg_days_on_market: 65,
      price_reduction_rate: 0.22,
      market_sentiment: 'stable',
      demand_score: 7.5,
      supply_score: 7.2,
      price_trend: 'stable',
      rental_yield: 5.1,
      capital_growth_rate: 2.5
    },
    recent_activity: {
      properties_sold_last_month: 8,
      properties_listed_last_month: 10,
      avg_price_per_sqm: 3200,
      price_volatility: 'medium'
    }
  }
];

async function createPlanningAuthorityIndex() {
  try {
    // Check if index exists
    const indexExists = await esClient.indices.exists({
      index: 'planning-authority-data'
    });

    if (indexExists) {
      console.log('Index planning-authority-data already exists, deleting...');
      await esClient.indices.delete({
        index: 'planning-authority-data'
      });
    }

    // Create index with mapping
    await esClient.indices.create({
      index: 'planning-authority-data',
      body: {
        mappings: {
          properties: {
            postcode_area: { type: 'keyword' },
            planning_applications: {
              type: 'nested',
              properties: {
                application_id: { type: 'keyword' },
                property_address: { type: 'text' },
                application_type: { type: 'keyword' },
                status: { type: 'keyword' },
                decision_date: { type: 'date' },
                estimated_value: { type: 'integer' },
                description: { type: 'text' },
                impact_on_value: { type: 'keyword' }
              }
            },
            local_authority: {
              properties: {
                council_tax_band: { type: 'keyword' },
                planning_zone: { type: 'keyword' },
                conservation_area: { type: 'boolean' },
                listed_building: { type: 'boolean' },
                flood_risk: { type: 'keyword' },
                transport_score: { type: 'float' },
                school_score: { type: 'float' },
                amenity_score: { type: 'float' }
              }
            },
            transport: {
              properties: {
                nearest_tube: {
                  properties: {
                    station: { type: 'keyword' },
                    distance_meters: { type: 'integer' },
                    lines: { type: 'keyword' },
                    frequency_minutes: { type: 'integer' }
                  }
                },
                nearest_train: {
                  properties: {
                    station: { type: 'keyword' },
                    distance_meters: { type: 'integer' },
                    lines: { type: 'keyword' },
                    frequency_minutes: { type: 'integer' }
                  }
                },
                nearest_bus: {
                  properties: {
                    stops: { type: 'keyword' },
                    distance_meters: { type: 'integer' },
                    routes: { type: 'keyword' },
                    frequency_minutes: { type: 'integer' }
                  }
                }
              }
            },
            schools: {
              type: 'nested',
              properties: {
                name: { type: 'keyword' },
                distance_meters: { type: 'integer' },
                ofsted_rating: { type: 'keyword' },
                type: { type: 'keyword' },
                age_range: { type: 'keyword' }
              }
            },
            amenities: {
              properties: {
                supermarkets: {
                  type: 'nested',
                  properties: {
                    name: { type: 'keyword' },
                    distance_meters: { type: 'integer' }
                  }
                },
                restaurants: {
                  type: 'nested',
                  properties: {
                    name: { type: 'keyword' },
                    distance_meters: { type: 'integer' },
                    rating: { type: 'float' }
                  }
                },
                parks: {
                  type: 'nested',
                  properties: {
                    name: { type: 'keyword' },
                    distance_meters: { type: 'integer' }
                  }
                }
              }
            },
            market_metrics: {
              properties: {
                avg_days_on_market: { type: 'integer' },
                price_reduction_rate: { type: 'float' },
                market_sentiment: { type: 'keyword' },
                demand_score: { type: 'float' },
                supply_score: { type: 'float' },
                price_trend: { type: 'keyword' },
                rental_yield: { type: 'float' },
                capital_growth_rate: { type: 'float' }
              }
            },
            recent_activity: {
              properties: {
                properties_sold_last_month: { type: 'integer' },
                properties_listed_last_month: { type: 'integer' },
                avg_price_per_sqm: { type: 'integer' },
                price_volatility: { type: 'keyword' }
              }
            }
          }
        }
      }
    });

    console.log('✅ Created planning-authority-data index');

    // Index the data
    const body = [];
    
    planningData.forEach(record => {
      // Add planning and authority data
      body.push({ index: { _index: 'planning-authority-data' } });
      body.push(record);
    });

    // Add transport data where available
    transportData.forEach(record => {
      const existingRecord = planningData.find(p => p.postcode_area === record.postcode_area);
      if (existingRecord) {
        body.push({ index: { _index: 'planning-authority-data' } });
        body.push({
          ...existingRecord,
          transport: record.transport,
          schools: record.schools,
          amenities: record.amenities
        });
      }
    });

    // Add market sentiment data where available
    marketSentimentData.forEach(record => {
      const existingRecord = planningData.find(p => p.postcode_area === record.postcode_area);
      if (existingRecord) {
        body.push({ index: { _index: 'planning-authority-data' } });
        body.push({
          ...existingRecord,
          market_metrics: record.market_metrics,
          recent_activity: record.recent_activity
        });
      }
    });

    if (body.length > 0) {
      const response = await esClient.bulk({ body });
      console.log(`✅ Indexed ${body.length / 2} planning authority records`);
      
      if (response.errors) {
        console.log('⚠️ Some errors occurred during indexing:');
        response.items.forEach((item, index) => {
          if (item.index && item.index.error) {
            console.log(`Error at index ${index}:`, item.index.error);
          }
        });
      }
    }

    // Get index stats
    const stats = await esClient.indices.stats({
      index: 'planning-authority-data'
    });

    console.log(`📊 Index stats: ${stats.indices['planning-authority-data'].total.docs.count} documents`);

  } catch (error) {
    console.error('❌ Error creating planning authority index:', error);
  }
}

async function testPlanningAuthorityData() {
  try {
    console.log('\n🧪 Testing planning authority data...');
    
    // Test search for SW1A area
    const response = await esClient.search({
      index: 'planning-authority-data',
      body: {
        query: {
          term: {
            postcode_area: 'SW1A'
          }
        }
      }
    });

    if (response.hits.hits.length > 0) {
      const record = response.hits.hits[0]._source;
      console.log('✅ Found SW1A planning data:');
      console.log(`- Council Tax Band: ${record.local_authority?.council_tax_band}`);
      console.log(`- Conservation Area: ${record.local_authority?.conservation_area}`);
      console.log(`- Planning Applications: ${record.planning_applications?.length || 0}`);
      console.log(`- Transport Score: ${record.local_authority?.transport_score}`);
      console.log(`- Market Sentiment: ${record.market_metrics?.market_sentiment}`);
    } else {
      console.log('❌ No SW1A planning data found');
    }

  } catch (error) {
    console.error('❌ Error testing planning authority data:', error);
  }
}

async function main() {
  console.log('🚀 Building Planning Authority Dataset...');
  
  try {
    await createPlanningAuthorityIndex();
    await testPlanningAuthorityData();
    
    console.log('\n✅ Planning Authority Dataset successfully created and indexed!');
    console.log('\n📋 Dataset includes:');
    console.log('- Planning applications and permissions');
    console.log('- Local authority data (council tax, planning zones)');
    console.log('- Transport and infrastructure information');
    console.log('- School and amenity data');
    console.log('- Market sentiment and activity metrics');
    console.log('\n🔗 Ready to be integrated with your valuation API!');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createPlanningAuthorityIndex, testPlanningAuthorityData }; 