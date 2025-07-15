const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const axios = require('axios');
const csv = require('csv-parser');
const { Client } = require('@elastic/elasticsearch');
const { createGunzip } = require('zlib');

const pipelineAsync = promisify(pipeline);

// Elasticsearch client configuration
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  }
});

// EPC API Configuration
const EPC_API_KEY = process.env.EPC_API_KEY || '52664ac273646603389548bd78d2de0c3ff13d0e';
const EPC_BASE_URL = 'https://epc.opendatacommunities.org';

const INDEX_NAME = 'epc_property_data';
const BATCH_SIZE = 5000; // Increased for better performance
const MAX_RECORDS = 1000000; // Limit to first 1M records for testing

// EPC data sources from the official portal with API key authentication
const EPC_DATA_SOURCES = [
  {
    name: 'domestic_epc',
    url: `${EPC_BASE_URL}/downloads/domestic_epc.csv`,
    description: 'Domestic EPC certificates (27.9M records)',
    expectedSize: '5.7GB'
  }
];

// EPC field mapping based on official schema
const EPC_FIELD_MAPPING = {
  'LMK_KEY': 'certificate_id',
  'ADDRESS1': 'address_line_1',
  'ADDRESS2': 'address_line_2', 
  'ADDRESS3': 'address_line_3',
  'POSTCODE': 'postcode',
  'BUILDING_REFERENCE_NUMBER': 'building_reference',
  'CURRENT_ENERGY_RATING': 'current_energy_rating',
  'POTENTIAL_ENERGY_RATING': 'potential_energy_rating',
  'CURRENT_ENERGY_EFFICIENCY': 'current_energy_efficiency',
  'POTENTIAL_ENERGY_EFFICIENCY': 'potential_energy_efficiency',
  'PROPERTY_TYPE': 'property_type',
  'BUILT_FORM': 'built_form',
  'INSPECTION_DATE': 'inspection_date',
  'LOCAL_AUTHORITY': 'local_authority',
  'CONSTITUENCY': 'constituency',
  'COUNTY': 'county',
  'LODGEMENT_DATE': 'lodgement_date',
  'TRANSACTION_TYPE': 'transaction_type',
  'ENVIRONMENT_IMPACT_CURRENT': 'environmental_impact_current',
  'ENVIRONMENT_IMPACT_POTENTIAL': 'environmental_impact_potential',
  'ENERGY_CONSUMPTION_CURRENT': 'energy_consumption_current',
  'ENERGY_CONSUMPTION_POTENTIAL': 'energy_consumption_potential',
  'CO2_EMISSIONS_CURRENT': 'co2_emissions_current',
  'CO2_EMISSIONS_POTENTIAL': 'co2_emissions_potential',
  'CO2_EMISSIONS_CURRENT_PER_FLOOR_AREA': 'co2_emissions_per_floor_area',
  'LIGHTING_COST_CURRENT': 'lighting_cost_current',
  'LIGHTING_COST_POTENTIAL': 'lighting_cost_potential',
  'HEATING_COST_CURRENT': 'heating_cost_current',
  'HEATING_COST_POTENTIAL': 'heating_cost_potential',
  'HOT_WATER_COST_CURRENT': 'hot_water_cost_current',
  'HOT_WATER_COST_POTENTIAL': 'hot_water_cost_potential',
  'TOTAL_FLOOR_AREA': 'total_floor_area',
  'ENERGY_TARIFF': 'energy_tariff',
  'MAINS_GAS_FLAG': 'mains_gas_flag',
  'FLOOR_LEVEL': 'floor_level',
  'FLAT_TOP_STOREY': 'flat_top_storey',
  'FLAT_STOREY_COUNT': 'flat_storey_count',
  'MAIN_HEATING_CONTROLS': 'main_heating_controls',
  'MULTI_GLAZE_PROPORTION': 'multi_glaze_proportion',
  'GLAZED_TYPE': 'glazed_type',
  'GLAZED_AREA': 'glazed_area',
  'EXTENSION_COUNT': 'extension_count',
  'NUMBER_HABITABLE_ROOMS': 'number_habitable_rooms',
  'NUMBER_HEATED_ROOMS': 'number_heated_rooms',
  'LOW_ENERGY_LIGHTING': 'low_energy_lighting',
  'NUMBER_OPEN_FIREPLACES': 'number_open_fireplaces',
  'HOTWATER_DESCRIPTION': 'hotwater_description',
  'HOT_WATER_ENERGY_EFF': 'hot_water_energy_efficiency',
  'HOT_WATER_ENV_EFF': 'hot_water_environmental_efficiency',
  'FLOOR_DESCRIPTION': 'floor_description',
  'FLOOR_ENERGY_EFF': 'floor_energy_efficiency',
  'FLOOR_ENV_EFF': 'floor_environmental_efficiency',
  'WINDOWS_DESCRIPTION': 'windows_description',
  'WINDOWS_ENERGY_EFF': 'windows_energy_efficiency',
  'WINDOWS_ENV_EFF': 'windows_environmental_efficiency',
  'WALLS_DESCRIPTION': 'walls_description',
  'WALLS_ENERGY_EFF': 'walls_energy_efficiency',
  'WALLS_ENV_EFF': 'walls_environmental_efficiency',
  'SECONDHEATING_DESCRIPTION': 'second_heating_description',
  'SHEATING_ENERGY_EFF': 'second_heating_energy_efficiency',
  'SHEATING_ENV_EFF': 'second_heating_environmental_efficiency',
  'ROOF_DESCRIPTION': 'roof_description',
  'ROOF_ENERGY_EFF': 'roof_energy_efficiency',
  'ROOF_ENV_EFF': 'roof_environmental_efficiency',
  'MAINHEATING_DESCRIPTION': 'main_heating_description',
  'MAINHEAT_ENERGY_EFF': 'main_heating_energy_efficiency',
  'MAINHEAT_ENV_EFF': 'main_heating_environmental_efficiency',
  'MAINHEATCONT_DESCRIPTION': 'main_heating_controls_description',
  'MAINHEATC_ENERGY_EFF': 'main_heating_controls_energy_efficiency',
  'MAINHEATC_ENV_EFF': 'main_heating_controls_environmental_efficiency',
  'LIGHTING_DESCRIPTION': 'lighting_description',
  'LIGHT_ENERGY_EFF': 'lighting_energy_efficiency',
  'LIGHT_ENV_EFF': 'lighting_environmental_efficiency',
  'MAIN_FUEL': 'main_fuel',
  'WIND_TURBINE_COUNT': 'wind_turbine_count',
  'HEAT_LOSS_CORRIDOR': 'heat_loss_corridor',
  'UNHEATED_CORRIDOR_LENGTH': 'unheated_corridor_length',
  'FLOOR_HEIGHT': 'floor_height',
  'PHOTO_SUPPLY': 'photo_supply',
  'SOLAR_WATER_HEATING_FLAG': 'solar_water_heating_flag',
  'MECHANICAL_VENTILATION': 'mechanical_ventilation',
  'ADDRESS': 'full_address',
  'LOCAL_AUTHORITY_LABEL': 'local_authority_label',
  'CONSTITUENCY_LABEL': 'constituency_label',
  'CERTIFICATE_HASH': 'certificate_hash'
};

async function createEPCIndex() {
  try {
    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    
    if (indexExists) {
      console.log(`Index '${INDEX_NAME}' already exists. Skipping creation.`);
      return;
    }

    console.log(`Creating EPC index '${INDEX_NAME}'...`);
    
    await esClient.indices.create({
      index: INDEX_NAME,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              postcode_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'trim']
              }
            }
          }
        },
        mappings: {
          properties: {
            certificate_id: { type: 'keyword' },
            postcode: { 
              type: 'text',
              analyzer: 'postcode_analyzer',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            address_line_1: { type: 'text' },
            address_line_2: { type: 'text' },
            address_line_3: { type: 'text' },
            full_address: { type: 'text' },
            current_energy_rating: { type: 'keyword' },
            potential_energy_rating: { type: 'keyword' },
            current_energy_efficiency: { type: 'integer' },
            potential_energy_efficiency: { type: 'integer' },
            property_type: { type: 'keyword' },
            built_form: { type: 'keyword' },
            inspection_date: { type: 'date' },
            lodgement_date: { type: 'date' },
            local_authority: { type: 'keyword' },
            constituency: { type: 'keyword' },
            county: { type: 'keyword' },
            transaction_type: { type: 'keyword' },
            environmental_impact_current: { type: 'keyword' },
            environmental_impact_potential: { type: 'keyword' },
            energy_consumption_current: { type: 'float' },
            energy_consumption_potential: { type: 'float' },
            co2_emissions_current: { type: 'float' },
            co2_emissions_potential: { type: 'float' },
            co2_emissions_per_floor_area: { type: 'float' },
            lighting_cost_current: { type: 'float' },
            lighting_cost_potential: { type: 'float' },
            heating_cost_current: { type: 'float' },
            heating_cost_potential: { type: 'float' },
            hot_water_cost_current: { type: 'float' },
            hot_water_cost_potential: { type: 'float' },
            total_floor_area: { type: 'float' },
            energy_tariff: { type: 'keyword' },
            mains_gas_flag: { type: 'keyword' },
            floor_level: { type: 'keyword' },
            flat_top_storey: { type: 'keyword' },
            flat_storey_count: { type: 'integer' },
            main_heating_controls: { type: 'keyword' },
            multi_glaze_proportion: { type: 'keyword' },
            glazed_type: { type: 'keyword' },
            glazed_area: { type: 'keyword' },
            extension_count: { type: 'integer' },
            number_habitable_rooms: { type: 'integer' },
            number_heated_rooms: { type: 'integer' },
            low_energy_lighting: { type: 'keyword' },
            number_open_fireplaces: { type: 'integer' },
            hotwater_description: { type: 'text' },
            hot_water_energy_efficiency: { type: 'keyword' },
            hot_water_environmental_efficiency: { type: 'keyword' },
            floor_description: { type: 'text' },
            floor_energy_efficiency: { type: 'keyword' },
            floor_environmental_efficiency: { type: 'keyword' },
            windows_description: { type: 'text' },
            windows_energy_efficiency: { type: 'keyword' },
            windows_environmental_efficiency: { type: 'keyword' },
            walls_description: { type: 'text' },
            walls_energy_efficiency: { type: 'keyword' },
            walls_environmental_efficiency: { type: 'keyword' },
            second_heating_description: { type: 'text' },
            second_heating_energy_efficiency: { type: 'keyword' },
            second_heating_environmental_efficiency: { type: 'keyword' },
            roof_description: { type: 'text' },
            roof_energy_efficiency: { type: 'keyword' },
            roof_environmental_efficiency: { type: 'keyword' },
            main_heating_description: { type: 'text' },
            main_heating_energy_efficiency: { type: 'keyword' },
            main_heating_environmental_efficiency: { type: 'keyword' },
            main_heating_controls_description: { type: 'text' },
            main_heating_controls_energy_efficiency: { type: 'keyword' },
            main_heating_controls_environmental_efficiency: { type: 'keyword' },
            lighting_description: { type: 'text' },
            lighting_energy_efficiency: { type: 'keyword' },
            lighting_environmental_efficiency: { type: 'keyword' },
            main_fuel: { type: 'keyword' },
            wind_turbine_count: { type: 'integer' },
            heat_loss_corridor: { type: 'keyword' },
            unheated_corridor_length: { type: 'float' },
            floor_height: { type: 'float' },
            photo_supply: { type: 'keyword' },
            solar_water_heating_flag: { type: 'keyword' },
            mechanical_ventilation: { type: 'keyword' },
            local_authority_label: { type: 'text' },
            constituency_label: { type: 'text' },
            certificate_hash: { type: 'keyword' },
            building_reference: { type: 'keyword' },
            search_terms: { type: 'text' },
            indexed_at: { type: 'date' }
          }
        }
      }
    });

    console.log(`✅ EPC index '${INDEX_NAME}' created successfully!`);
  } catch (error) {
    console.error('❌ Error creating EPC index:', error);
    throw error;
  }
}

async function downloadEPCData(source) {
  const filename = `${source.name}.csv`;
  const filepath = path.join(__dirname, '..', 'data', filename);
  
  console.log(`📥 Downloading ${source.description}...`);
  console.log(`   URL: ${source.url}`);
  console.log(`   Expected size: ${source.expectedSize}`);
  console.log(`   Target file: ${filepath}`);
  console.log(`   Using API key: ${EPC_API_KEY.substring(0, 8)}...`);
  
  try {
    const response = await axios({
      method: 'GET',
      url: source.url,
      responseType: 'stream',
      timeout: 600000, // 10 minutes
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'X-API-Key': EPC_API_KEY,
        'Accept': 'text/csv,application/csv,*/*'
      },
      validateStatus: function (status) {
        return status < 500; // Accept all status codes less than 500
      }
    });

    // Check if we got an HTML response (authentication error)
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      console.error(`❌ Authentication failed - received HTML instead of CSV`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Content-Type: ${contentType}`);
      console.error(`   Please check your API key and registration status`);
      return null;
    }

    const writer = fs.createWriteStream(filepath);
    await pipelineAsync(response.data, writer);
    
    const stats = fs.statSync(filepath);
    console.log(`✅ Downloaded ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    return filepath;
  } catch (error) {
    console.error(`❌ Error downloading ${source.name}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Headers:`, error.response.headers);
    }
    return null;
  }
}

function mapEPCFields(row) {
  const mapped = {};
  
  for (const [sourceField, targetField] of Object.entries(EPC_FIELD_MAPPING)) {
    if (row[sourceField] !== undefined && row[sourceField] !== '') {
      mapped[targetField] = row[sourceField];
    }
  }
  
  // Add search terms for better searchability
  const searchTerms = [
    mapped.postcode,
    mapped.address_line_1,
    mapped.address_line_2,
    mapped.address_line_3,
    mapped.full_address
  ].filter(Boolean).join(' ').toLowerCase();
  
  mapped.search_terms = searchTerms;
  mapped.indexed_at = new Date().toISOString();
  
  return mapped;
}

async function indexEPCBatch(batch) {
  if (batch.length === 0) return 0;
  
  const operations = batch.flatMap(doc => [
    { index: { _index: INDEX_NAME } },
    doc
  ]);
  
  try {
    const result = await esClient.bulk({ 
      body: operations,
      timeout: '120s',
      refresh: false
    });
    
    if (result.errors) {
      const errors = result.items.filter(item => item.index?.error);
      console.warn(`⚠️  Batch had ${errors.length} errors, but continuing...`);
    }
    
    return batch.length;
  } catch (error) {
    console.error('❌ Error indexing batch:', error);
    throw error;
  }
}

async function processEPCFile(filepath) {
  console.log(`📊 Processing EPC file: ${filepath}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Max records: ${MAX_RECORDS.toLocaleString()}`);
  
  let totalIndexed = 0;
  let batch = [];
  let lineCount = 0;
  let startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', async (row) => {
        lineCount++;
        
        // Limit processing for testing
        if (lineCount > MAX_RECORDS) {
          console.log(`🛑 Reached max records limit (${MAX_RECORDS.toLocaleString()})`);
          return;
        }
        
        try {
          const mappedData = mapEPCFields(row);
          batch.push(mappedData);
          
          if (batch.length >= BATCH_SIZE) {
            const indexed = await indexEPCBatch(batch);
            totalIndexed += indexed;
            batch = [];
            
            const elapsed = (Date.now() - startTime) / 1000;
            const rate = Math.round(totalIndexed / elapsed);
            
            if (lineCount % 50000 === 0) {
              console.log(`📊 Processed ${lineCount.toLocaleString()} lines, indexed ${totalIndexed.toLocaleString()} records (${rate} records/sec)`);
            }
          }
        } catch (error) {
          console.error(`❌ Error processing line ${lineCount}:`, error);
        }
      })
      .on('end', async () => {
        try {
          // Index remaining batch
          if (batch.length > 0) {
            const indexed = await indexEPCBatch(batch);
            totalIndexed += indexed;
          }
          
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = Math.round(totalIndexed / elapsed);
          
          console.log(`✅ Finished processing ${lineCount.toLocaleString()} lines`);
          console.log(`📊 Total indexed: ${totalIndexed.toLocaleString()} records`);
          console.log(`⏱️  Average rate: ${rate} records/sec`);
          console.log(`⏱️  Total time: ${(elapsed / 60).toFixed(2)} minutes`);
          
          resolve(totalIndexed);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function main() {
  try {
    console.log('🚀 Starting EPC bulk data import process...');
    console.log('=' .repeat(60));
    
    // Test Elasticsearch connection
    await esClient.ping();
    console.log('✅ Elasticsearch connection successful');
    
    // Create index if needed
    await createEPCIndex();
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    let totalIndexed = 0;
    
    // Process each EPC data source
    for (const source of EPC_DATA_SOURCES) {
      console.log(`\n📥 Processing ${source.description}...`);
      
      const filepath = await downloadEPCData(source);
      if (!filepath) {
        console.warn(`⚠️  Skipping ${source.name} due to download failure`);
        continue;
      }
      
      const indexed = await processEPCFile(filepath);
      totalIndexed += indexed;
      
      console.log(`✅ Completed ${source.description}: ${indexed.toLocaleString()} records`);
    }
    
    // Refresh index
    await esClient.indices.refresh({ index: INDEX_NAME });
    
    console.log('\n' + '=' .repeat(60));
    console.log(`🎉 EPC data import completed successfully!`);
    console.log(`📊 Total records indexed: ${totalIndexed.toLocaleString()}`);
    console.log(`💾 Index size: Check with: curl -s "http://localhost:9201/_cat/indices?v" | grep epc`);
    
  } catch (error) {
    console.error('❌ EPC data import failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, createEPCIndex, processEPCFile }; 