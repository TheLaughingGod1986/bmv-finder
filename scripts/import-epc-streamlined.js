#!/usr/bin/env node

/**
 * Streamlined EPC Data Import Script
 * Imports only essential Energy Performance Certificate data into Elasticsearch
 * 
 * Usage: node scripts/import-epc-streamlined.js
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

// EPC Index configuration - streamlined mapping
const EPC_INDEX = 'epc_data';
const EPC_MAPPING = {
  mappings: {
    properties: {
      // Core identification
      lmk_key: { type: 'keyword' },
      uprn: { type: 'keyword' },
      
      // Address information
      postcode: { type: 'keyword' },
      full_address: { type: 'text' },
      local_authority: { type: 'keyword' },
      county: { type: 'keyword' },
      constituency: { type: 'keyword' },
      
      // Energy performance
      current_energy_rating: { type: 'keyword' },
      potential_energy_rating: { type: 'keyword' },
      current_energy_efficiency: { type: 'integer' },
      potential_energy_efficiency: { type: 'integer' },
      
      // Property details
      property_type: { type: 'keyword' },
      built_form: { type: 'keyword' },
      total_floor_area: { type: 'float' },
      number_habitable_rooms: { type: 'integer' },
      
      // Costs
      heating_cost_current: { type: 'float' },
      lighting_cost_current: { type: 'float' },
      hot_water_cost_current: { type: 'float' },
      total_cost: { type: 'float' },
      
      // Environmental impact
      co2_emissions_current: { type: 'float' },
      environment_impact_current: { type: 'integer' },
      energy_consumption_current: { type: 'float' },
      
      // Key features
      main_heating_controls: { type: 'text' },
      windows_description: { type: 'text' },
      walls_description: { type: 'text' },
      roof_description: { type: 'text' },
      mainheat_description: { type: 'text' },
      
      // Dates
      inspection_date: { type: 'date' },
      lodgement_date: { type: 'date' },
      
      // Additional useful fields
      construction_age_band: { type: 'keyword' },
      tenure: { type: 'keyword' },
      transaction_type: { type: 'keyword' },
      mains_gas_flag: { type: 'keyword' },
      
      // Metadata
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

// EPC data file path
const EPC_CSV_FILE = path.join(__dirname, '..', 'data', 'cleaned-datasets', 'epc-cleaned.csv');

// CSV parsing function
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Transform CSV row to streamlined EPC document
function transformEPCRecord(values) {
  if (values.length < 95) return null; // Skip incomplete records
  
  const [
    lmk_key, address1, address2, address3, postcode, building_ref, current_rating, potential_rating,
    current_efficiency, potential_efficiency, property_type, built_form, inspection_date, local_authority,
    constituency, county, lodgement_date, transaction_type, env_impact_current, env_impact_potential,
    energy_consumption_current, energy_consumption_potential, co2_current, co2_per_floor, co2_potential,
    lighting_cost_current, lighting_cost_potential, heating_cost_current, heating_cost_potential,
    hot_water_cost_current, hot_water_cost_potential, total_floor_area, energy_tariff, mains_gas_flag,
    floor_level, flat_top_storey, flat_storey_count, main_heating_controls, multi_glaze_proportion,
    glazed_type, glazed_area, extension_count, number_habitable_rooms, number_heated_rooms,
    low_energy_lighting, number_open_fireplaces, hotwater_description, hot_water_energy_eff,
    hot_water_env_eff, floor_description, floor_energy_eff, floor_env_eff, windows_description,
    windows_energy_eff, windows_env_eff, walls_description, walls_energy_eff, walls_env_eff,
    secondheat_description, sheating_energy_eff, sheating_env_eff, roof_description, roof_energy_eff,
    roof_env_eff, mainheat_description, mainheat_energy_eff, mainheat_env_eff, mainheatcont_description,
    mainheatc_energy_eff, mainheatc_env_eff, lighting_description, lighting_energy_eff, lighting_env_eff,
    main_fuel, wind_turbine_count, heat_loss_corridor, unheated_corridor_length, floor_height,
    photo_supply, solar_water_heating_flag, mechanical_ventilation, address, local_authority_label,
    constituency_label, posttown, construction_age_band, lodgement_datetime, tenure,
    fixed_lighting_outlets_count, low_energy_fixed_light_count, uprn, uprn_source, report_type,
    id, full_address
  ] = values;

  // Calculate total cost
  const total_cost = (parseFloat(heating_cost_current) || 0) + 
                     (parseFloat(lighting_cost_current) || 0) + 
                     (parseFloat(hot_water_cost_current) || 0);

  // Return only essential fields
  return {
    lmk_key: lmk_key || '',
    uprn: uprn || '',
    postcode: postcode || '',
    full_address: full_address || address || '',
    local_authority: local_authority_label || local_authority || '',
    county: county || '',
    constituency: constituency_label || constituency || '',
    current_energy_rating: current_rating || '',
    potential_energy_rating: potential_rating || '',
    current_energy_efficiency: parseInt(current_efficiency) || 0,
    potential_energy_efficiency: parseInt(potential_efficiency) || 0,
    property_type: property_type || '',
    built_form: built_form || '',
    total_floor_area: parseFloat(total_floor_area) || 0,
    number_habitable_rooms: parseInt(number_habitable_rooms) || 0,
    heating_cost_current: parseFloat(heating_cost_current) || 0,
    lighting_cost_current: parseFloat(lighting_cost_current) || 0,
    hot_water_cost_current: parseFloat(hot_water_cost_current) || 0,
    total_cost: total_cost,
    co2_emissions_current: parseFloat(co2_current) || 0,
    environment_impact_current: parseInt(env_impact_current) || 0,
    energy_consumption_current: parseFloat(energy_consumption_current) || 0,
    main_heating_controls: main_heating_controls || '',
    windows_description: windows_description || '',
    walls_description: walls_description || '',
    roof_description: roof_description || '',
    mainheat_description: mainheat_description || '',
    inspection_date: inspection_date || '',
    lodgement_date: lodgement_date || '',
    construction_age_band: construction_age_band || '',
    tenure: tenure || '',
    transaction_type: transaction_type || '',
    mains_gas_flag: mains_gas_flag || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function createEPCIndex() {
  try {
    console.log('🔄 Creating streamlined EPC index...');
    
    // Check if index exists
    const indexExists = await flexibleIndices.exists({ index: EPC_INDEX });
    
    if (indexExists) {
      console.log('📋 EPC index already exists, deleting...');
      await flexibleIndices.delete({ index: EPC_INDEX });
    }
    
    // Create new index with streamlined mapping
    await flexibleIndices.create({
      index: EPC_INDEX,
      body: EPC_MAPPING
    });
    
    console.log('✅ Streamlined EPC index created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating EPC index:', error.message);
    return false;
  }
}

async function importEPCData() {
  try {
    console.log('🔄 Importing streamlined EPC data from CSV...');
    
    // Check if CSV file exists
    if (!fs.existsSync(EPC_CSV_FILE)) {
      console.error(`❌ EPC CSV file not found: ${EPC_CSV_FILE}`);
      return 0;
    }
    
    console.log(`📁 Reading EPC data from: ${EPC_CSV_FILE}`);
    
    // Process CSV file using streaming to avoid memory issues
    const readStream = fs.createReadStream(EPC_CSV_FILE, { encoding: 'utf8' });
    const BATCH_SIZE = 1000;
    let totalProcessed = 0;
    let totalBatches = 0;
    let buffer = '';
    let lineNumber = 0;
    let operations = [];
    
    return new Promise((resolve, reject) => {
      readStream.on('data', async (chunk) => {
        buffer += chunk;
        let newlineIndex;
        
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.substring(0, newlineIndex);
          buffer = buffer.substring(newlineIndex + 1);
          lineNumber++;
          
          // Skip header line
          if (lineNumber === 1) continue;
          
          // Skip empty lines
          if (line.trim() === '') continue;
          
          try {
            const values = parseCSVLine(line);
            const record = transformEPCRecord(values);
            
            if (record) {
              operations.push({ index: { _index: EPC_INDEX } });
              operations.push(record);
            }
          } catch (error) {
            console.warn(`⚠️  Skipping invalid line ${lineNumber}: ${error.message}`);
          }
          
          // Process batch when it reaches the size limit
          if (operations.length >= BATCH_SIZE * 2) {
            await processBatch(operations);
            operations = [];
          }
        }
      });
      
      readStream.on('end', async () => {
        // Process remaining operations
        if (operations.length > 0) {
          await processBatch(operations);
        }
        
        console.log(`✅ Successfully processed ${totalProcessed.toLocaleString()} EPC properties in ${totalBatches} batches`);
        resolve(totalProcessed);
      });
      
      readStream.on('error', reject);
    });
    
    async function processBatch(batchOperations) {
      try {
        const result = await flexibleBulk({ body: batchOperations });
        
        if (result.errors) {
          const errors = result.items.filter(item => item.index?.error);
          console.warn(`⚠️  ${errors.length} documents failed to index in batch ${totalBatches + 1}`);
        }
        
        totalProcessed += batchOperations.length / 2; // Divide by 2 because each record has 2 operations (index + data)
        totalBatches++;
        
        console.log(`📦 Batch ${totalBatches}: Processed ${batchOperations.length / 2} records (Total: ${totalProcessed.toLocaleString()})`);
        
        // Small delay to prevent overwhelming Elasticsearch
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing batch ${totalBatches + 1}:`, error.message);
      }
    }
    
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
    console.log(`📊 Total EPC records: ${countResult.count.toLocaleString()}`);
    
    // Get a sample document
    const searchResult = await flexibleSearch({
      index: EPC_INDEX,
      size: 1
    });
    
    if (searchResult.hits.hits.length > 0) {
      const sample = searchResult.hits.hits[0]._source;
      console.log('📋 Sample EPC record:');
      console.log(`   Address: ${sample.full_address}`);
      console.log(`   EPC Rating: ${sample.current_energy_rating}`);
      console.log(`   Score: ${sample.current_energy_efficiency}`);
      console.log(`   Floor Area: ${sample.total_floor_area}m²`);
      console.log(`   Total Cost: £${sample.total_cost}`);
    }
    
    return countResult.count;
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
    return 0;
  }
}

async function main() {
  try {
    console.log('🚀 Starting streamlined EPC data import...');
    
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
    
    console.log('\n🎉 Streamlined EPC data import completed successfully!');
    console.log(`📊 Total EPC properties: ${verifiedCount.toLocaleString()}`);
    console.log(`🌐 Index: ${EPC_INDEX}`);
    console.log(`🔗 Elasticsearch: ${process.env.ELASTICSEARCH_URL || 'http://localhost:9201'}`);
    console.log(`📈 Reduced from 95 columns to 35 essential columns`);
    
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
