const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const axios = require('axios');
const csv = require('csv-parser');
const { Client } = require('@elastic/elasticsearch');

const pipelineAsync = promisify(pipeline);

// Configuration
const EPC_API_KEY = process.env.EPC_API_KEY || '52664ac273646603389548bd78d2de0c3ff13d0e';
const EPC_BASE_URL = 'https://epc.opendatacommunities.org';

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  }
});

const INDEX_NAME = 'epc_property_data';
const BATCH_SIZE = 5000;

class EPCDataManager {
  constructor() {
    this.apiKey = EPC_API_KEY;
    this.baseUrl = EPC_BASE_URL;
    this.indexName = INDEX_NAME;
  }

  /**
   * Check if API access is available
   */
  async checkAPIAccess() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/domestic/search?postcode=SW1A1AA&size=1`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Import EPC data from a local CSV file
   */
  async importFromCSV(csvFilePath) {
    console.log(`📊 Importing EPC data from: ${csvFilePath}`);
    
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }

    // Create index if it doesn't exist
    await this.createIndex();

    let totalIndexed = 0;
    let batch = [];
    let lineCount = 0;
    let startTime = Date.now();

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', async (row) => {
          lineCount++;
          
          try {
            const mappedData = this.mapEPCFields(row);
            batch.push(mappedData);
            
            if (batch.length >= BATCH_SIZE) {
              const indexed = await this.indexBatch(batch);
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
              const indexed = await this.indexBatch(batch);
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

  /**
   * Query EPC data for a specific property
   */
  async queryProperty(postcode, address = null) {
    console.log(`🔍 Querying EPC data for: ${address || 'N/A'}, ${postcode}`);
    
    // First, try to find in our indexed data
    const indexedResult = await this.searchIndexedData(postcode, address);
    if (indexedResult && indexedResult.length > 0) {
      console.log(`✅ Found ${indexedResult.length} records in indexed data`);
      return indexedResult;
    }

    // If not found in indexed data, try API (if available)
    const apiAvailable = await this.checkAPIAccess();
    if (apiAvailable) {
      console.log(`🌐 API access available, querying external API...`);
      const apiResult = await this.queryAPI(postcode, address);
      if (apiResult && apiResult.length > 0) {
        console.log(`✅ Found ${apiResult.length} records via API`);
        return apiResult;
      }
    } else {
      console.log(`⚠️  API access not available, only using indexed data`);
    }

    console.log(`❌ No EPC data found for: ${address || 'N/A'}, ${postcode}`);
    return [];
  }

  /**
   * Search indexed EPC data
   */
  async searchIndexedData(postcode, address = null) {
    try {
      const query = {
        bool: {
          must: [
            { term: { postcode: postcode.toUpperCase() } }
          ]
        }
      };

      if (address) {
        query.bool.must.push({
          multi_match: {
            query: address,
            fields: ['address_line_1', 'address_line_2', 'full_address']
          }
        });
      }

      const response = await esClient.search({
        index: this.indexName,
        body: {
          query: query,
          size: 10
        }
      });

      return response.hits.hits.map(hit => hit._source);
    } catch (error) {
      console.error('Error searching indexed data:', error);
      return [];
    }
  }

  /**
   * Query the EPC API
   */
  async queryAPI(postcode, address = null) {
    try {
      const params = {
        postcode: postcode,
        size: 50
      };

      if (address) {
        params.address = address;
      }

      const response = await axios.get(`${this.baseUrl}/api/v1/domestic/search`, {
        params: params,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.rows) {
        return response.data.rows.map(row => this.mapAPIFields(row));
      }

      return [];
    } catch (error) {
      console.error('Error querying API:', error);
      return [];
    }
  }

  /**
   * Create the EPC index
   */
  async createIndex() {
    try {
      const indexExists = await esClient.indices.exists({ index: this.indexName });
      
      if (indexExists) {
        console.log(`Index '${this.indexName}' already exists.`);
        return;
      }

      console.log(`Creating EPC index '${this.indexName}'...`);
      
      await esClient.indices.create({
        index: this.indexName,
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
              lmk_key: { type: 'keyword' },
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
              search_terms: { type: 'text' },
              indexed_at: { type: 'date' }
            }
          }
        }
      });

      console.log(`✅ EPC index '${this.indexName}' created successfully!`);
    } catch (error) {
      console.error('❌ Error creating EPC index:', error);
      throw error;
    }
  }

  /**
   * Index a batch of EPC records
   */
  async indexBatch(batch) {
    if (batch.length === 0) return 0;
    
    const operations = batch.flatMap(doc => [
      { index: { _index: this.indexName } },
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

  /**
   * Map CSV fields to our schema
   */
  mapEPCFields(row) {
    const mapped = {};
    
    // Map all the fields from the CSV
    const fieldMappings = {
      'LMK_KEY': 'lmk_key',
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
      'CONSTITUENCY_LABEL': 'constituency_label'
    };
    
    for (const [sourceField, targetField] of Object.entries(fieldMappings)) {
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

  /**
   * Map API response fields to our schema
   */
  mapAPIFields(row) {
    // API response fields are already in the correct format
    return {
      ...row,
      indexed_at: new Date().toISOString()
    };
  }

  /**
   * Get statistics about the indexed data
   */
  async getStats() {
    try {
      const countResponse = await esClient.count({ index: this.indexName });
      const statsResponse = await esClient.indices.stats({ index: this.indexName });
      
      return {
        total_records: countResponse.count,
        index_size: statsResponse.indices[this.indexName].total.store.size_in_bytes,
        index_size_mb: Math.round(statsResponse.indices[this.indexName].total.store.size_in_bytes / 1024 / 1024)
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }
}

// Example usage
async function main() {
  const manager = new EPCDataManager();
  
  console.log('🚀 EPC Data Manager');
  console.log('=' .repeat(50));
  
  // Check API access
  const apiAvailable = await manager.checkAPIAccess();
  console.log(`🌐 API Access Available: ${apiAvailable ? 'Yes' : 'No'}`);
  
  // Get stats
  const stats = await manager.getStats();
  if (stats) {
    console.log(`📊 Indexed Records: ${stats.total_records.toLocaleString()}`);
    console.log(`💾 Index Size: ${stats.index_size_mb} MB`);
  }
  
  // Example: Import from CSV if file exists
  const csvPath = path.join(__dirname, '..', 'data', 'domestic_epc.csv');
  if (fs.existsSync(csvPath)) {
    console.log(`\n📥 Found CSV file: ${csvPath}`);
    console.log('Importing CSV data...');
    await manager.importFromCSV(csvPath);
  } else {
    console.log(`\n📁 No CSV file found at: ${csvPath}`);
    console.log('Please download the CSV from the EPC portal and place it in the data/ directory');
  }
  
  // Example: Query a property
  console.log('\n🔍 Example: Query property data');
  const results = await manager.queryProperty('SW1A1AA', '10');
  console.log(`Found ${results.length} records`);
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = EPCDataManager; 