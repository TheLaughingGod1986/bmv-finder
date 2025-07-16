const fs = require('fs');
const path = require('path');
const { Client } = require('@elastic/elasticsearch');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Configuration
const CONFIG = {
  LAND_REGISTRY_FILE: 'data/land-registry-2006plus.csv',
  EPC_FILE: 'data/epc-certificates.csv',
  HPI_FILE: 'data/hpi-regions.csv',
  OUTPUT_FILE: 'data/unified-enhanced-dataset.csv',
  CHECKPOINT_FILE: 'data/overnight-checkpoint.json',
  LOG_FILE: 'logs/overnight-pipeline.log',
  BATCH_SIZE: 10000,
  ELASTICSEARCH_URL: 'http://localhost:9200',
  INDEX_NAME: 'enhanced-properties'
};

// Initialize Elasticsearch client
const esClient = new Client({
  node: CONFIG.ELASTICSEARCH_URL,
  auth: {
    username: 'elastic',
    password: 'changeme'
  }
});

// Logging function
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  // Ensure log directory exists
  const logDir = path.dirname(CONFIG.LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n');
}

// Load checkpoint
function loadCheckpoint() {
  try {
    if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
      const checkpoint = JSON.parse(fs.readFileSync(CONFIG.CHECKPOINT_FILE, 'utf8'));
      log(`Resuming from checkpoint: ${JSON.stringify(checkpoint)}`);
      return checkpoint;
    }
  } catch (error) {
    log(`Error loading checkpoint: ${error.message}`, 'WARN');
  }
  return { processed: 0, indexed: 0, stage: 'start' };
}

// Save checkpoint
function saveCheckpoint(checkpoint) {
  try {
    fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
    log(`Checkpoint saved: ${JSON.stringify(checkpoint)}`);
  } catch (error) {
    log(`Error saving checkpoint: ${error.message}`, 'ERROR');
  }
}

// Generate UID for property
function generateUID(property) {
  const address = (property.address || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const postcode = (property.postcode || '').toLowerCase().replace(/\s/g, '');
  const date = property.date_of_transfer || '';
  
  if (!address || !postcode) return null;
  
  return `${address}_${postcode}_${date}`;
}

// Normalize address for matching
function normalizeAddress(address) {
  if (!address) return '';
  
  return address
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Load EPC data into memory for matching
async function loadEPCData() {
  log('Loading EPC data into memory...');
  const epcMap = new Map();
  
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CONFIG.EPC_FILE)) {
      log('EPC file not found, skipping EPC matching', 'WARN');
      resolve(epcMap);
      return;
    }
    
    let count = 0;
    fs.createReadStream(CONFIG.EPC_FILE)
      .pipe(csv())
      .on('data', (row) => {
        const address = normalizeAddress(row.address);
        const postcode = (row.postcode || '').toLowerCase().replace(/\s/g, '');
        
        if (address && postcode) {
          const key = `${address}_${postcode}`;
          epcMap.set(key, row);
        }
        
        count++;
        if (count % 100000 === 0) {
          log(`Loaded ${count} EPC records`);
        }
      })
      .on('end', () => {
        log(`EPC data loaded: ${epcMap.size} unique properties`);
        resolve(epcMap);
      })
      .on('error', reject);
  });
}

// Load HPI data into memory for matching
async function loadHPIData() {
  log('Loading HPI data into memory...');
  const hpiMap = new Map();
  
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CONFIG.HPI_FILE)) {
      log('HPI file not found, skipping HPI matching', 'WARN');
      resolve(hpiMap);
      return;
    }
    
    let count = 0;
    fs.createReadStream(CONFIG.HPI_FILE)
      .pipe(csv())
      .on('data', (row) => {
        const region = (row.region || '').toLowerCase();
        const date = row.date;
        
        if (region && date) {
          const key = `${region}_${date}`;
          hpiMap.set(key, row);
        }
        
        count++;
        if (count % 10000 === 0) {
          log(`Loaded ${count} HPI records`);
        }
      })
      .on('end', () => {
        log(`HPI data loaded: ${hpiMap.size} unique region-date combinations`);
        resolve(hpiMap);
      })
      .on('error', reject);
  });
}

// Match EPC data to property
function matchEPC(property, epcMap) {
  const address = normalizeAddress(property.property_address);
  const postcode = (property.postcode || '').toLowerCase().replace(/\s/g, '');
  
  if (!address || !postcode) return null;
  
  // Try exact match first
  const exactKey = `${address}_${postcode}`;
  if (epcMap.has(exactKey)) {
    return epcMap.get(exactKey);
  }
  
  // Try partial address matching
  const addressParts = address.split(' ');
  for (const [key, epcData] of epcMap.entries()) {
    if (key.includes(postcode)) {
      const epcAddress = normalizeAddress(epcData.address);
      const epcParts = epcAddress.split(' ');
      
      // Check if at least 2 parts match
      const matches = addressParts.filter(part => 
        epcParts.some(epcPart => epcPart.includes(part) || part.includes(epcPart))
      );
      
      if (matches.length >= 2) {
        return epcData;
      }
    }
  }
  
  return null;
}

// Match HPI data to property
function matchHPI(property, hpiMap) {
  const postcode = property.postcode || '';
  const date = property.date_of_transfer;
  
  if (!postcode || !date) return null;
  
  // Extract region from postcode (first 2-3 characters)
  const region = postcode.substring(0, 3).toLowerCase();
  const year = date.substring(0, 4);
  const month = date.substring(5, 7);
  
  // Try different date formats
  const dateFormats = [
    `${year}-${month}`,
    `${year}-${month}-01`,
    `${year}-${month}-15`
  ];
  
  for (const dateFormat of dateFormats) {
    const key = `${region}_${dateFormat}`;
    if (hpiMap.has(key)) {
      return hpiMap.get(key);
    }
  }
  
  return null;
}

// Create CSV writer
const csvWriter = createCsvWriter({
  path: CONFIG.OUTPUT_FILE,
  header: [
    { id: 'uid', title: 'uid' },
    { id: 'property_address', title: 'property_address' },
    { id: 'postcode', title: 'postcode' },
    { id: 'date_of_transfer', title: 'date_of_transfer' },
    { id: 'price_paid', title: 'price_paid' },
    { id: 'property_type', title: 'property_type' },
    { id: 'new_build', title: 'new_build' },
    { id: 'estate_type', title: 'estate_type' },
    { id: 'paon', title: 'paon' },
    { id: 'saon', title: 'saon' },
    { id: 'street', title: 'street' },
    { id: 'locality', title: 'locality' },
    { id: 'town_city', title: 'town_city' },
    { id: 'district', title: 'district' },
    { id: 'county', title: 'county' },
    { id: 'transaction_category', title: 'transaction_category' },
    { id: 'record_status', title: 'record_status' },
    { id: 'epc_rating', title: 'epc_rating' },
    { id: 'current_energy_rating', title: 'current_energy_rating' },
    { id: 'potential_energy_rating', title: 'potential_energy_rating' },
    { id: 'current_energy_consumption', title: 'current_energy_consumption' },
    { id: 'potential_energy_consumption', title: 'potential_energy_consumption' },
    { id: 'current_energy_efficiency', title: 'current_energy_efficiency' },
    { id: 'potential_energy_efficiency', title: 'potential_energy_efficiency' },
    { id: 'property_type_epc', title: 'property_type_epc' },
    { id: 'built_form', title: 'built_form' },
    { id: 'inspection_date', title: 'inspection_date' },
    { id: 'local_authority', title: 'local_authority' },
    { id: 'constituency', title: 'constituency' },
    { id: 'county_epc', title: 'county_epc' },
    { id: 'lodgement_date', title: 'lodgement_date' },
    { id: 'transaction_type', title: 'transaction_type' },
    { id: 'environment_impact_current', title: 'environment_impact_current' },
    { id: 'environment_impact_potential', title: 'environment_impact_potential' },
    { id: 'energy_consumption_current', title: 'energy_consumption_current' },
    { id: 'energy_consumption_potential', title: 'energy_consumption_potential' },
    { id: 'co2_emissions_current', title: 'co2_emissions_current' },
    { id: 'co2_emissions_potential', title: 'co2_emissions_potential' },
    { id: 'co2_emissions_current_per_floor_area', title: 'co2_emissions_current_per_floor_area' },
    { id: 'lighting_cost_current', title: 'lighting_cost_current' },
    { id: 'lighting_cost_potential', title: 'lighting_cost_potential' },
    { id: 'heating_cost_current', title: 'heating_cost_current' },
    { id: 'heating_cost_potential', title: 'heating_cost_potential' },
    { id: 'hot_water_cost_current', title: 'hot_water_cost_current' },
    { id: 'hot_water_cost_potential', title: 'hot_water_cost_potential' },
    { id: 'total_floor_area', title: 'total_floor_area' },
    { id: 'energy_tariff', title: 'energy_tariff' },
    { id: 'mains_gas_flag', title: 'mains_gas_flag' },
    { id: 'floor_level', title: 'floor_level' },
    { id: 'flat_top_storey', title: 'flat_top_storey' },
    { id: 'flat_storey_count', title: 'flat_storey_count' },
    { id: 'main_heating_controls', title: 'main_heating_controls' },
    { id: 'multi_glaze_proportion', title: 'multi_glaze_proportion' },
    { id: 'glazed_type', title: 'glazed_type' },
    { id: 'glazed_area', title: 'glazed_area' },
    { id: 'extension_count', title: 'extension_count' },
    { id: 'number_habitable_rooms', title: 'number_habitable_rooms' },
    { id: 'number_heated_rooms', title: 'number_heated_rooms' },
    { id: 'low_energy_lighting', title: 'low_energy_lighting' },
    { id: 'number_open_fireplaces', title: 'number_open_fireplaces' },
    { id: 'number_fixed_combustion_appliances', title: 'number_fixed_combustion_appliances' },
    { id: 'number_fixed_combustion_appliances_secondary', title: 'number_fixed_combustion_appliances_secondary' },
    { id: 'hot_water_description', title: 'hot_water_description' },
    { id: 'hot_water_energy_efficiency', title: 'hot_water_energy_efficiency' },
    { id: 'hot_water_environmental_efficiency', title: 'hot_water_environmental_efficiency' },
    { id: 'floor_description', title: 'floor_description' },
    { id: 'floor_energy_efficiency', title: 'floor_energy_efficiency' },
    { id: 'floor_environmental_efficiency', title: 'floor_environmental_efficiency' },
    { id: 'windows_description', title: 'windows_description' },
    { id: 'windows_energy_efficiency', title: 'windows_energy_efficiency' },
    { id: 'windows_environmental_efficiency', title: 'windows_environmental_efficiency' },
    { id: 'walls_description', title: 'walls_description' },
    { id: 'walls_energy_efficiency', title: 'walls_energy_efficiency' },
    { id: 'walls_environmental_efficiency', title: 'walls_environmental_efficiency' },
    { id: 'secondheat_description', title: 'secondheat_description' },
    { id: 'sheating_energy_efficiency', title: 'sheating_energy_efficiency' },
    { id: 'sheating_environmental_efficiency', title: 'sheating_environmental_efficiency' },
    { id: 'roof_description', title: 'roof_description' },
    { id: 'roof_energy_efficiency', title: 'roof_energy_efficiency' },
    { id: 'roof_environmental_efficiency', title: 'roof_environmental_efficiency' },
    { id: 'mainheat_description', title: 'mainheat_description' },
    { id: 'mainheat_energy_efficiency', title: 'mainheat_energy_efficiency' },
    { id: 'mainheat_environmental_efficiency', title: 'mainheat_environmental_efficiency' },
    { id: 'mainheatcont_description', title: 'mainheatcont_description' },
    { id: 'mainheatc_energy_efficiency', title: 'mainheatc_energy_efficiency' },
    { id: 'mainheatc_environmental_efficiency', title: 'mainheatc_environmental_efficiency' },
    { id: 'region', title: 'region' },
    { id: 'hpi_value', title: 'hpi_value' },
    { id: 'hpi_date', title: 'hpi_date' },
    { id: 'hpi_percentage_change', title: 'hpi_percentage_change' }
  ]
});

// Process properties and create enhanced dataset
async function processProperties() {
  log('Starting overnight data processing pipeline...');
  
  const checkpoint = loadCheckpoint();
  let processed = checkpoint.processed || 0;
  let epcMatches = 0;
  let hpiMatches = 0;
  let totalProperties = 0;
  
  // Load reference data
  const epcMap = await loadEPCData();
  const hpiMap = await loadHPIData();
  
  log('Starting property processing...');
  
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CONFIG.LAND_REGISTRY_FILE)) {
      reject(new Error(`Land Registry file not found: ${CONFIG.LAND_REGISTRY_FILE}`));
      return;
    }
    
    const batch = [];
    let batchCount = 0;
    
    fs.createReadStream(CONFIG.LAND_REGISTRY_FILE)
      .pipe(csv())
      .on('data', (row) => {
        // Skip if already processed
        if (processed > 0) {
          processed--;
          return;
        }
        
        totalProperties++;
        
        // Generate UID
        const uid = generateUID(row);
        if (!uid) return;
        
        // Match EPC data
        const epcData = matchEPC(row, epcMap);
        if (epcData) epcMatches++;
        
        // Match HPI data
        const hpiData = matchHPI(row, hpiMap);
        if (hpiData) hpiMatches++;
        
        // Create enhanced property record
        const enhancedProperty = {
          uid,
          ...row,
          ...(epcData && {
            epc_rating: epcData.current_energy_rating,
            current_energy_rating: epcData.current_energy_rating,
            potential_energy_rating: epcData.potential_energy_rating,
            current_energy_consumption: epcData.current_energy_consumption,
            potential_energy_consumption: epcData.potential_energy_consumption,
            current_energy_efficiency: epcData.current_energy_efficiency,
            potential_energy_efficiency: epcData.potential_energy_efficiency,
            property_type_epc: epcData.property_type,
            built_form: epcData.built_form,
            inspection_date: epcData.inspection_date,
            local_authority: epcData.local_authority,
            constituency: epcData.constituency,
            county_epc: epcData.county,
            lodgement_date: epcData.lodgement_date,
            transaction_type: epcData.transaction_type,
            environment_impact_current: epcData.environment_impact_current,
            environment_impact_potential: epcData.environment_impact_potential,
            energy_consumption_current: epcData.energy_consumption_current,
            energy_consumption_potential: epcData.energy_consumption_potential,
            co2_emissions_current: epcData.co2_emissions_current,
            co2_emissions_potential: epcData.co2_emissions_potential,
            co2_emissions_current_per_floor_area: epcData.co2_emissions_current_per_floor_area,
            lighting_cost_current: epcData.lighting_cost_current,
            lighting_cost_potential: epcData.lighting_cost_potential,
            heating_cost_current: epcData.heating_cost_current,
            heating_cost_potential: epcData.heating_cost_potential,
            hot_water_cost_current: epcData.hot_water_cost_current,
            hot_water_cost_potential: epcData.hot_water_cost_potential,
            total_floor_area: epcData.total_floor_area,
            energy_tariff: epcData.energy_tariff,
            mains_gas_flag: epcData.mains_gas_flag,
            floor_level: epcData.floor_level,
            flat_top_storey: epcData.flat_top_storey,
            flat_storey_count: epcData.flat_storey_count,
            main_heating_controls: epcData.main_heating_controls,
            multi_glaze_proportion: epcData.multi_glaze_proportion,
            glazed_type: epcData.glazed_type,
            glazed_area: epcData.glazed_area,
            extension_count: epcData.extension_count,
            number_habitable_rooms: epcData.number_habitable_rooms,
            number_heated_rooms: epcData.number_heated_rooms,
            low_energy_lighting: epcData.low_energy_lighting,
            number_open_fireplaces: epcData.number_open_fireplaces,
            number_fixed_combustion_appliances: epcData.number_fixed_combustion_appliances,
            number_fixed_combustion_appliances_secondary: epcData.number_fixed_combustion_appliances_secondary,
            hot_water_description: epcData.hot_water_description,
            hot_water_energy_efficiency: epcData.hot_water_energy_efficiency,
            hot_water_environmental_efficiency: epcData.hot_water_environmental_efficiency,
            floor_description: epcData.floor_description,
            floor_energy_efficiency: epcData.floor_energy_efficiency,
            floor_environmental_efficiency: epcData.floor_environmental_efficiency,
            windows_description: epcData.windows_description,
            windows_energy_efficiency: epcData.windows_energy_efficiency,
            windows_environmental_efficiency: epcData.windows_environmental_efficiency,
            walls_description: epcData.walls_description,
            walls_energy_efficiency: epcData.walls_energy_efficiency,
            walls_environmental_efficiency: epcData.walls_environmental_efficiency,
            secondheat_description: epcData.secondheat_description,
            sheating_energy_efficiency: epcData.sheating_energy_efficiency,
            sheating_environmental_efficiency: epcData.sheating_environmental_efficiency,
            roof_description: epcData.roof_description,
            roof_energy_efficiency: epcData.roof_energy_efficiency,
            roof_environmental_efficiency: epcData.roof_environmental_efficiency,
            mainheat_description: epcData.mainheat_description,
            mainheat_energy_efficiency: epcData.mainheat_energy_efficiency,
            mainheat_environmental_efficiency: epcData.mainheat_environmental_efficiency,
            mainheatcont_description: epcData.mainheatcont_description,
            mainheatc_energy_efficiency: epcData.mainheatc_energy_efficiency,
            mainheatc_environmental_efficiency: epcData.mainheatc_environmental_efficiency
          }),
          ...(hpiData && {
            region: hpiData.region,
            hpi_value: hpiData.hpi_value,
            hpi_date: hpiData.date,
            hpi_percentage_change: hpiData.percentage_change
          })
        };
        
        batch.push(enhancedProperty);
        batchCount++;
        
        // Process batch
        if (batch.length >= CONFIG.BATCH_SIZE) {
          csvWriter.writeRecords(batch);
          batch.length = 0;
          
          // Save checkpoint
          saveCheckpoint({
            processed: totalProperties,
            indexed: batchCount,
            stage: 'processing'
          });
          
          // Log progress
          if (totalProperties % 100000 === 0) {
            const epcRate = ((epcMatches / totalProperties) * 100).toFixed(2);
            const hpiRate = ((hpiMatches / totalProperties) * 100).toFixed(2);
            log(`Processed ${totalProperties.toLocaleString()} properties - EPC: ${epcRate}% (${epcMatches.toLocaleString()}), HPI: ${hpiRate}% (${hpiMatches.toLocaleString()})`);
          }
        }
      })
      .on('end', async () => {
        // Write remaining batch
        if (batch.length > 0) {
          await csvWriter.writeRecords(batch);
        }
        
        const epcRate = ((epcMatches / totalProperties) * 100).toFixed(2);
        const hpiRate = ((hpiMatches / totalProperties) * 100).toFixed(2);
        
        log(`Processing complete!`);
        log(`Total properties processed: ${totalProperties.toLocaleString()}`);
        log(`EPC matches: ${epcMatches.toLocaleString()} (${epcRate}%)`);
        log(`HPI matches: ${hpiMatches.toLocaleString()} (${hpiRate}%)`);
        
        saveCheckpoint({
          processed: totalProperties,
          indexed: batchCount,
          stage: 'processing_complete'
        });
        
        resolve({ totalProperties, epcMatches, hpiMatches });
      })
      .on('error', reject);
  });
}

// Index data to Elasticsearch
async function indexToElasticsearch() {
  log('Starting Elasticsearch indexing...');
  
  const checkpoint = loadCheckpoint();
  let indexed = 0;
  
  // Check if index exists, create if not
  try {
    const indexExists = await esClient.indices.exists({ index: CONFIG.INDEX_NAME });
    if (!indexExists) {
      log('Creating enhanced properties index...');
      await esClient.indices.create({
        index: CONFIG.INDEX_NAME,
        body: {
          mappings: {
            properties: {
              uid: { type: 'keyword' },
              property_address: { type: 'text' },
              postcode: { type: 'keyword' },
              date_of_transfer: { type: 'date' },
              price_paid: { type: 'long' },
              property_type: { type: 'keyword' },
              epc_rating: { type: 'keyword' },
              current_energy_rating: { type: 'keyword' },
              potential_energy_rating: { type: 'keyword' },
              current_energy_consumption: { type: 'float' },
              potential_energy_consumption: { type: 'float' },
              total_floor_area: { type: 'float' },
              number_habitable_rooms: { type: 'integer' },
              heating_cost_current: { type: 'float' },
              hpi_value: { type: 'float' },
              hpi_date: { type: 'date' },
              hpi_percentage_change: { type: 'float' }
            }
          }
        }
      });
      log('Enhanced properties index created');
    }
  } catch (error) {
    log(`Error creating index: ${error.message}`, 'ERROR');
  }
  
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CONFIG.OUTPUT_FILE)) {
      reject(new Error(`Output file not found: ${CONFIG.OUTPUT_FILE}`));
      return;
    }
    
    const batch = [];
    let batchCount = 0;
    
    fs.createReadStream(CONFIG.OUTPUT_FILE)
      .pipe(csv())
      .on('data', async (row) => {
        // Skip if already indexed
        if (indexed > 0) {
          indexed--;
          return;
        }
        
        batch.push({
          index: { _index: CONFIG.INDEX_NAME, _id: row.uid }
        });
        batch.push(row);
        batchCount++;
        
        // Index batch
        if (batch.length >= CONFIG.BATCH_SIZE * 2) {
          try {
            await esClient.bulk({ body: batch });
            batch.length = 0;
            
            // Save checkpoint
            saveCheckpoint({
              processed: checkpoint.processed,
              indexed: batchCount,
              stage: 'indexing'
            });
            
            // Log progress
            if (batchCount % 100000 === 0) {
              log(`Indexed ${batchCount.toLocaleString()} properties`);
            }
          } catch (error) {
            log(`Error indexing batch: ${error.message}`, 'ERROR');
          }
        }
      })
      .on('end', async () => {
        // Index remaining batch
        if (batch.length > 0) {
          try {
            await esClient.bulk({ body: batch });
          } catch (error) {
            log(`Error indexing final batch: ${error.message}`, 'ERROR');
          }
        }
        
        log(`Indexing complete! Total indexed: ${batchCount.toLocaleString()}`);
        
        saveCheckpoint({
          processed: checkpoint.processed,
          indexed: batchCount,
          stage: 'complete'
        });
        
        resolve(batchCount);
      })
      .on('error', reject);
  });
}

// Main execution
async function main() {
  try {
    log('=== OVERNIGHT DATA PIPELINE STARTED ===');
    log(`Configuration: ${JSON.stringify(CONFIG, null, 2)}`);
    
    const checkpoint = loadCheckpoint();
    
    if (checkpoint.stage !== 'complete') {
      if (checkpoint.stage !== 'processing_complete') {
        log('Starting property processing...');
        await processProperties();
      }
      
      log('Starting Elasticsearch indexing...');
      await indexToElasticsearch();
    }
    
    log('=== OVERNIGHT DATA PIPELINE COMPLETED SUCCESSFULLY ===');
    
    // Clean up checkpoint file
    if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
      fs.unlinkSync(CONFIG.CHECKPOINT_FILE);
      log('Checkpoint file cleaned up');
    }
    
  } catch (error) {
    log(`Pipeline failed: ${error.message}`, 'ERROR');
    log(`Stack trace: ${error.stack}`, 'ERROR');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('Received SIGINT, saving checkpoint and shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, saving checkpoint and shutting down gracefully...');
  process.exit(0);
});

// Start the pipeline
main(); 