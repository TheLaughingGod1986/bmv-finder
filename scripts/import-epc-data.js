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
const EPC_INDEX = 'epc_data';
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

// Transform CSV row to EPC document
function transformEPCRecord(values) {
  if (values.length < 85) return null; // Skip incomplete records
  
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

  return {
    lmk_key: lmk_key || '',
    address: full_address || address || '',
    postcode: postcode || '',
    house_number: address1 || '',
    street: address2 || address1 || '',
    town: posttown || '',
    county: county || '',
    epc_rating: current_rating || '',
    current_energy_rating: current_rating || '',
    potential_energy_rating: potential_rating || '',
    epc_score: parseInt(current_efficiency) || 0,
    potential_score: parseInt(potential_efficiency) || 0,
    epc_date: inspection_date || '',
    inspection_date: inspection_date || '',
    property_type: property_type || '',
    tenure: tenure || '',
    construction_year: 0, // Not available in EPC data
    floor_area_m2: parseFloat(total_floor_area) || 0,
    total_floor_area: parseFloat(total_floor_area) || 0,
    bedrooms: parseInt(number_habitable_rooms) || 0,
    heating_cost: parseFloat(heating_cost_current) || 0,
    lighting_cost: parseFloat(lighting_cost_current) || 0,
    hot_water_cost: parseFloat(hot_water_cost_current) || 0,
    total_cost: total_cost,
    co2_rating: current_rating || '',
    co2_emissions: parseFloat(co2_current) || 0,
    windows: windows_description || '',
    walls: walls_description || '',
    roof: roof_description || '',
    floor: floor_description || '',
    main_heating: mainheat_description || '',
    main_heating_controls: main_heating_controls || '',
    secondary_heating: secondheat_description || '',
    hot_water: hotwater_description || '',
    lighting: lighting_description || '',
    renewable_technologies: '',
    certificate_id: lmk_key || '',
    lodgement_date: lodgement_date || '',
    local_authority: local_authority_label || '',
    constituency: constituency_label || '',
    transaction_type: transaction_type || '',
    built_form: built_form || '',
    energy_consumption_current: parseFloat(energy_consumption_current) || 0,
    energy_consumption_potential: parseFloat(energy_consumption_potential) || 0,
    co2_emissions_potential: parseFloat(co2_potential) || 0,
    co2_emissions_per_floor_area: parseFloat(co2_per_floor) || 0,
    environmental_impact_current: parseInt(env_impact_current) || 0,
    environmental_impact_potential: parseInt(env_impact_potential) || 0,
    mains_gas: mains_gas_flag || '',
    energy_tariff: energy_tariff || '',
    glazed_type: glazed_type || '',
    glazed_area: parseFloat(glazed_area) || 0,
    extension_count: parseInt(extension_count) || 0,
    number_heated_rooms: parseInt(number_heated_rooms) || 0,
    low_energy_lighting_percentage: parseFloat(low_energy_lighting) || 0,
    open_fireplaces: parseInt(number_open_fireplaces) || 0,
    wind_turbines: parseInt(wind_turbine_count) || 0,
    floor_height: parseFloat(floor_height) || 0,
    solar_water_heating: solar_water_heating_flag || '',
    mechanical_ventilation: mechanical_ventilation || '',
    construction_age_band: construction_age_band || '',
    uprn: uprn || '',
    report_type: report_type || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

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
    console.log('🔄 Importing EPC data from CSV...');
    
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
    
    console.log(`✅ Successfully processed ${totalProcessed.toLocaleString()} EPC properties in ${totalBatches} batches`);
    return totalProcessed;
    
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
