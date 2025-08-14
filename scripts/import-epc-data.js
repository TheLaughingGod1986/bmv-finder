#!/usr/bin/env node

/**
 * EPC Data Import Script
 * Imports Energy Performance Certificate data into Elasticsearch
 * 
 * Usage: node scripts/import-epc-data.js
 */

const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');

// Elasticsearch configuration
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  }
});

// Create a more flexible search method that bypasses strict typing
const flexibleSearch = async (params) => {
  return esClient.search(params);
};

const flexibleCount = async (params) => {
  return esClient.count(params);
};

const flexibleIndices = {
  exists: async (params) => esClient.indices.exists(params),
  create: async (params) => esClient.indices.create(params),
  delete: async (params) => esClient.indices.delete(params)
};

const flexibleBulk = async (params) => {
  return esClient.bulk(params);
};

// EPC Index configuration
const EPC_INDEX = 'epc_property_data';
const EPC_MAPPING = {
  mappings: {
    properties: {
      address: { type: 'text' },
      postcode: { type: 'keyword' },
      house_number: { type: 'keyword' },
      street: { type: 'text' },
      town: { type: 'text' },
      county: { type: 'keyword' },
      epc_rating: { type: 'keyword' },
      current_energy_rating: { type: 'keyword' },
      potential_energy_rating: { type: 'keyword' },
      epc_score: { type: 'integer' },
      potential_score: { type: 'integer' },
      epc_date: { type: 'date' },
      inspection_date: { type: 'date' },
      property_type: { type: 'keyword' },
      tenure: { type: 'keyword' },
      construction_year: { type: 'integer' },
      floor_area_m2: { type: 'float' },
      total_floor_area: { type: 'float' },
      bedrooms: { type: 'integer' },
      heating_cost: { type: 'float' },
      lighting_cost: { type: 'float' },
      hot_water_cost: { type: 'float' },
      total_cost: { type: 'float' },
      co2_rating: { type: 'keyword' },
      co2_emissions: { type: 'float' },
      windows: { type: 'text' },
      walls: { type: 'text' },
      roof: { type: 'text' },
      floor: { type: 'text' },
      main_heating: { type: 'text' },
      main_heating_controls: { type: 'text' },
      secondary_heating: { type: 'text' },
      hot_water: { type: 'text' },
      lighting: { type: 'text' },
      renewable_technologies: { type: 'text' },
      certificate_id: { type: 'keyword' },
      lodgement_date: { type: 'date' },
      created_at: { type: 'date' },
      updated_at: { type: 'date' }
    }
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        address_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'stop', 'snowball']
        }
      }
    }
  }
};

// Sample EPC data for testing
const SAMPLE_EPC_DATA = [
  {
    address: '1 Buckingham Palace Road',
    postcode: 'SW1A1AA',
    house_number: '1',
    street: 'Buckingham Palace Road',
    town: 'London',
    county: 'Greater London',
    epc_rating: 'C',
    current_energy_rating: 'C',
    potential_energy_rating: 'B',
    epc_score: 72,
    potential_score: 85,
    epc_date: '2023-01-15',
    inspection_date: '2023-01-15',
    property_type: 'Terraced',
    tenure: 'Freehold',
    construction_year: 1985,
    floor_area_m2: 95.5,
    total_floor_area: 95.5,
    bedrooms: 3,
    heating_cost: 850,
    lighting_cost: 120,
    hot_water_cost: 180,
    total_cost: 1150,
    co2_rating: 'C',
    co2_emissions: 2.8,
    windows: 'Double glazed',
    walls: 'Cavity wall, insulated',
    roof: 'Pitched, 200mm insulation',
    floor: 'Suspended, insulated',
    main_heating: 'Gas boiler',
    main_heating_controls: 'Programmer, room thermostat',
    secondary_heating: 'None',
    hot_water: 'From main system',
    lighting: 'Low energy lighting',
    renewable_technologies: 'None',
    certificate_id: 'EPC001',
    lodgement_date: '2023-01-15',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    address: '10 Downing Street',
    postcode: 'SW1A2AA',
    house_number: '10',
    street: 'Downing Street',
    town: 'London',
    county: 'Greater London',
    epc_rating: 'B',
    current_energy_rating: 'B',
    potential_energy_rating: 'A',
    epc_score: 82,
    potential_score: 92,
    epc_date: '2023-02-20',
    inspection_date: '2023-02-20',
    property_type: 'Terraced',
    tenure: 'Freehold',
    construction_year: 1680,
    floor_area_m2: 120.0,
    total_floor_area: 120.0,
    bedrooms: 4,
    heating_cost: 720,
    lighting_cost: 150,
    hot_water_cost: 200,
    total_cost: 1070,
    co2_rating: 'B',
    co2_emissions: 1.8,
    windows: 'Triple glazed',
    walls: 'Solid wall, externally insulated',
    roof: 'Pitched, 300mm insulation',
    floor: 'Solid, insulated',
    main_heating: 'Heat pump',
    main_heating_controls: 'Smart controls, room sensors',
    secondary_heating: 'None',
    hot_water: 'Heat pump',
    lighting: 'LED lighting throughout',
    renewable_technologies: 'Solar panels, heat pump',
    certificate_id: 'EPC002',
    lodgement_date: '2023-02-20',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    address: '221B Baker Street',
    postcode: 'NW1 6XE',
    house_number: '221B',
    street: 'Baker Street',
    town: 'London',
    county: 'Greater London',
    epc_rating: 'D',
    current_energy_rating: 'D',
    potential_energy_rating: 'C',
    epc_score: 58,
    potential_score: 72,
    epc_date: '2023-03-10',
    inspection_date: '2023-03-10',
    property_type: 'Terraced',
    tenure: 'Leasehold',
    construction_year: 1900,
    floor_area_m2: 85.0,
    total_floor_area: 85.0,
    bedrooms: 2,
    heating_cost: 1100,
    lighting_cost: 100,
    hot_water_cost: 160,
    total_cost: 1360,
    co2_rating: 'D',
    co2_emissions: 3.5,
    windows: 'Single glazed',
    walls: 'Solid wall, uninsulated',
    roof: 'Pitched, minimal insulation',
    floor: 'Suspended, uninsulated',
    main_heating: 'Gas boiler (old)',
    main_heating_controls: 'Basic timer',
    secondary_heating: 'Open fire',
    hot_water: 'From main system',
    lighting: 'Standard lighting',
    renewable_technologies: 'None',
    certificate_id: 'EPC003',
    lodgement_date: '2023-03-10',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function createEPCIndex() {
  try {
    console.log('🔄 Creating EPC index...');
    
    // Check if index exists
    const indexExists = await flexibleIndices.exists({ index: EPC_INDEX });
    
    if (indexExists) {
      console.log('📋 EPC index already exists, deleting...');
      await flexibleIndices.delete({ index: EPC_INDEX });
    }
    
    // Create new index with mapping
    await flexibleIndices.create({
      index: EPC_INDEX,
      body: EPC_MAPPING
    });
    
    console.log('✅ EPC index created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating EPC index:', error.message);
    return false;
  }
}

async function importEPCData() {
  try {
    console.log('🔄 Importing EPC data...');
    
    // Bulk insert the sample data
    const operations = [];
    SAMPLE_EPC_DATA.forEach(property => {
      operations.push({ index: { _index: EPC_INDEX } });
      operations.push(property);
    });
    
    if (operations.length > 0) {
      const result = await flexibleBulk({ body: operations });
      
      if (result.errors) {
        console.error('❌ Some documents failed to index:', result.items.filter(item => item.index?.error));
      }
      
      console.log(`✅ Successfully indexed ${SAMPLE_EPC_DATA.length} EPC properties`);
      return SAMPLE_EPC_DATA.length;
    }
    
    return 0;
  } catch (error) {
    console.error('❌ Error importing EPC data:', error.message);
    return 0;
  }
}

async function verifyData() {
  try {
    console.log('🔍 Verifying imported data...');
    
    // Count documents
    const countResult = await flexibleCount({ index: EPC_INDEX });
    console.log(`📊 Total EPC records: ${countResult.count}`);
    
    // Get a sample document
    const searchResult = await flexibleSearch({
      index: EPC_INDEX,
      size: 1
    });
    
    if (searchResult.hits.hits.length > 0) {
      const sample = searchResult.hits.hits[0]._source;
      console.log('📋 Sample EPC record:');
      console.log(`   Address: ${sample.address}`);
      console.log(`   EPC Rating: ${sample.epc_rating}`);
      console.log(`   Score: ${sample.epc_score}`);
    }
    
    return countResult.count;
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
    return 0;
  }
}

async function main() {
  try {
    console.log('🚀 Starting EPC data import...');
    
    // Test Elasticsearch connection
    await esClient.ping();
    console.log('✅ Elasticsearch connection successful');
    
    // Create index
    const indexCreated = await createEPCIndex();
    if (!indexCreated) {
      console.error('❌ Failed to create EPC index');
      process.exit(1);
    }
    
    // Import data
    const importedCount = await importEPCData();
    if (importedCount === 0) {
      console.error('❌ Failed to import EPC data');
      process.exit(1);
    }
    
    // Verify data
    const verifiedCount = await verifyData();
    
    console.log('\n🎉 EPC data import completed successfully!');
    console.log(`📊 Total EPC properties: ${verifiedCount}`);
    console.log(`🌐 Index: ${EPC_INDEX}`);
    console.log(`🔗 Elasticsearch: ${process.env.ELASTICSEARCH_URL || 'http://localhost:9201'}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await esClient.close();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createEPCIndex, importEPCData, verifyData };
