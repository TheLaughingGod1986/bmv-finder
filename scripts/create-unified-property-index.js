const fs = require('fs');
const path = require('path');
const { Client } = require('@elastic/elasticsearch');
const csv = require('csv-parser');

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  requestTimeout: 60000,
  maxRetries: 3,
  retryOnTimeout: true,
});

// Configuration
const UNIFIED_INDEX = 'unified_properties';
const BATCH_SIZE = 1000;

// Data sources
const DATA_SOURCES = {
  landRegistry: 'pp-complete-updated.csv',
  epcData: 'data/epc-certificates-combined.csv',
  hpiData: 'data/hpi-regions.csv',
  cleanedProperties: 'data/cleaned/properties-cleaned-uid.csv',
  cleanedEPC: 'data/cleaned/epc-cleaned-uid.csv'
};

console.log('🚀 Creating Unified Property Index');
console.log('📊 Merging 4 data sources into single Elasticsearch index');

// Generate UID for property
function generatePropertyUID(property) {
  const number = (property.paon || property.house_number || '').toString().toLowerCase().trim();
  const street = (property.street || property.street_name || '').toLowerCase().trim();
  const postcode = (property.postcode || '').toLowerCase().trim();
  
  // Clean and normalize components
  const cleanNumber = number.replace(/[^a-z0-9]/g, '');
  const cleanStreet = street.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const cleanPostcode = postcode.replace(/\s+/g, '').toLowerCase();
  
  return `${cleanNumber}-${cleanStreet}-${cleanPostcode}`;
}

// Create unified index with comprehensive mapping
async function createUnifiedIndex() {
  console.log('🔧 Creating unified properties index...');
  
  try {
    const indexExists = await esClient.indices.exists({ index: UNIFIED_INDEX });
    if (indexExists) {
      console.log(`Index '${UNIFIED_INDEX}' already exists. Deleting...`);
      await esClient.indices.delete({ index: UNIFIED_INDEX });
    }

    await esClient.indices.create({
      index: UNIFIED_INDEX,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          'index.mapping.total_fields.limit': 2000,
          'index.refresh_interval': '30s'
        },
        mappings: {
          properties: {
            // UID and identification
            property_uid: { type: 'keyword' },
            transaction_id: { type: 'keyword' },
            
            // Address information
            paon: { type: 'keyword' },
            saon: { type: 'keyword' },
            street: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            locality: { type: 'text' },
            town_city: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            district: { type: 'text' },
            county: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            postcode: { type: 'keyword' },
            full_address: { type: 'text' },
            
            // Property details
            property_type: { type: 'keyword' },
            property_type_label: { type: 'text' },
            bedrooms: { type: 'integer' },
            property_size: { type: 'float' },
            floor_area_m2: { type: 'float' },
            
            // Transaction details
            price: { type: 'long' },
            date_of_transfer: { type: 'date' },
            year: { type: 'integer' },
            month: { type: 'integer' },
            duration: { type: 'keyword' },
            duration_label: { type: 'text' },
            new_build: { type: 'keyword' },
            new_build_label: { type: 'text' },
            transaction_category: { type: 'keyword' },
            
            // EPC data
            epc_rating: { type: 'keyword' },
            current_energy_rating: { type: 'keyword' },
            potential_energy_rating: { type: 'keyword' },
            construction_year: { type: 'integer' },
            epc_date: { type: 'date' },
            certificate_id: { type: 'keyword' },
            
            // HPI data
            hpi_region: { type: 'keyword' },
            hpi_value: { type: 'float' },
            hpi_change_monthly: { type: 'float' },
            hpi_change_yearly: { type: 'float' },
            hpi_date: { type: 'date' },
            
            // Computed fields
            price_range: { type: 'keyword' },
            estimated_current_value: { type: 'long' },
            growth_percentage: { type: 'float' },
            years_since_sale: { type: 'float' },
            
            // Data source tracking
            data_sources: { type: 'keyword' },
            last_updated: { type: 'date' }
          }
        }
      }
    });

    console.log('✅ Unified index created successfully');
  } catch (error) {
    console.error('❌ Error creating index:', error);
    throw error;
  }
}

// Load and index Land Registry data
async function loadLandRegistryData() {
  console.log('📖 Loading Land Registry data...');
  const properties = new Map();
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(DATA_SOURCES.landRegistry)
      .pipe(csv())
      .on('data', (row) => {
        const uid = generatePropertyUID(row);
        if (!properties.has(uid)) {
          properties.set(uid, {
            property_uid: uid,
            transaction_id: row.transactionId || row.id,
            paon: row.paon,
            saon: row.saon,
            street: row.street,
            locality: row.locality,
            town_city: row.town_city,
            district: row.district,
            county: row.county,
            postcode: row.postcode,
            full_address: `${row.paon || ''} ${row.saon || ''} ${row.street || ''} ${row.town_city || ''}`.trim(),
            property_type: row.propertyType,
            property_type_label: getPropertyTypeLabel(row.propertyType),
            price: parseInt(row.price) || 0,
            date_of_transfer: row.dateOfTransfer,
            year: new Date(row.dateOfTransfer).getFullYear(),
            month: new Date(row.dateOfTransfer).getMonth() + 1,
            duration: row.duration,
            duration_label: getDurationLabel(row.duration),
            new_build: row.old_new,
            new_build_label: getNewBuildLabel(row.old_new),
            transaction_category: row.transactionCategory,
            price_range: getPriceRange(parseInt(row.price)),
            data_sources: ['land_registry'],
            last_updated: new Date().toISOString()
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded ${properties.size} unique properties from Land Registry`);
        resolve(properties);
      })
      .on('error', reject);
  });
}

// Load and merge EPC data
async function mergeEPCData(properties) {
  console.log('📖 Loading and merging EPC data...');
  let matched = 0;
  let total = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(DATA_SOURCES.epcData)
      .pipe(csv())
      .on('data', (row) => {
        total++;
        const uid = generatePropertyUID(row);
        
        if (properties.has(uid)) {
          const property = properties.get(uid);
          property.bedrooms = parseInt(row.bedrooms) || property.bedrooms;
          property.property_size = parseFloat(row.property_size) || property.property_size;
          property.floor_area_m2 = parseFloat(row.floor_area_m2) || property.property_size;
          property.epc_rating = row.epc_rating || property.epc_rating;
          property.current_energy_rating = row.current_energy_rating || property.current_energy_rating;
          property.potential_energy_rating = row.potential_energy_rating || property.potential_energy_rating;
          property.construction_year = parseInt(row.construction_year) || property.construction_year;
          property.epc_date = row.epc_date || property.epc_date;
          property.certificate_id = row.certificate_id || property.certificate_id;
          
          if (!property.data_sources.includes('epc')) {
            property.data_sources.push('epc');
          }
          
          matched++;
        }
      })
      .on('end', () => {
        console.log(`✅ EPC data merged: ${matched} matches out of ${total} EPC records`);
        resolve(properties);
      })
      .on('error', reject);
  });
}

// Load and merge HPI data
async function mergeHPIData(properties) {
  console.log('📖 Loading and merging HPI data...');
  const hpiData = new Map();
  
  // First, load HPI data by region
  return new Promise((resolve, reject) => {
    fs.createReadStream(DATA_SOURCES.hpiData)
      .pipe(csv())
      .on('data', (row) => {
        const region = row.region?.toLowerCase().replace(/\s+/g, '-');
        if (region) {
          if (!hpiData.has(region)) {
            hpiData.set(region, []);
          }
          hpiData.get(region).push({
            date: row.date,
            hpi_value: parseFloat(row.hpiIndex),
            hpi_change_monthly: parseFloat(row.percentageChangeMonthly),
            hpi_change_yearly: parseFloat(row.percentageChangeYearly)
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded HPI data for ${hpiData.size} regions`);
        
        // Now merge HPI data into properties
        let hpiMatched = 0;
        properties.forEach(property => {
          const region = property.county?.toLowerCase().replace(/\s+/g, '-');
          if (region && hpiData.has(region)) {
            const regionHPI = hpiData.get(region);
            const latestHPI = regionHPI[regionHPI.length - 1];
            
            if (latestHPI) {
              property.hpi_region = region;
              property.hpi_value = latestHPI.hpi_value;
              property.hpi_change_monthly = latestHPI.hpi_change_monthly;
              property.hpi_change_yearly = latestHPI.hpi_change_yearly;
              property.hpi_date = latestHPI.date;
              
              // Calculate estimated current value and growth
              if (property.price && property.date_of_transfer) {
                const yearsSinceSale = (new Date() - new Date(property.date_of_transfer)) / (1000 * 60 * 60 * 24 * 365);
                const growthFactor = Math.pow(1 + (latestHPI.hpi_change_yearly / 100), yearsSinceSale);
                property.estimated_current_value = Math.round(property.price * growthFactor);
                property.growth_percentage = ((growthFactor - 1) * 100);
                property.years_since_sale = yearsSinceSale;
              }
              
              if (!property.data_sources.includes('hpi')) {
                property.data_sources.push('hpi');
              }
              
              hpiMatched++;
            }
          }
        });
        
        console.log(`✅ HPI data merged: ${hpiMatched} properties updated with HPI data`);
        resolve(properties);
      })
      .on('error', reject);
  });
}

// Helper functions
function getPropertyTypeLabel(type) {
  const map = {
    'D': 'Detached', 'S': 'Semi-detached', 'T': 'Terraced',
    'F': 'Flat/Maisonette', 'O': 'Other'
  };
  return map[type] || 'Unknown';
}

function getDurationLabel(duration) {
  const map = { 'F': 'Freehold', 'L': 'Leasehold' };
  return map[duration] || 'Unknown';
}

function getNewBuildLabel(newBuild) {
  const map = { 'Y': 'New Build', 'N': 'Existing' };
  return map[newBuild] || 'Unknown';
}

function getPriceRange(price) {
  if (price < 100000) return 'Under £100k';
  if (price < 200000) return '£100k-£200k';
  if (price < 300000) return '£200k-£300k';
  if (price < 500000) return '£300k-£500k';
  if (price < 1000000) return '£500k-£1M';
  return 'Over £1M';
}

// Index properties in batches
async function indexProperties(properties) {
  console.log('📊 Indexing unified properties...');
  
  const propertyArray = Array.from(properties.values());
  let indexed = 0;
  
  for (let i = 0; i < propertyArray.length; i += BATCH_SIZE) {
    const batch = propertyArray.slice(i, i + BATCH_SIZE);
    
    const body = batch.flatMap(property => [
      { index: { _index: UNIFIED_INDEX, _id: property.property_uid } },
      property
    ]);
    
    try {
      await esClient.bulk({ body, refresh: false });
      indexed += batch.length;
      
      if (indexed % 10000 === 0) {
        console.log(`  Indexed ${indexed.toLocaleString()} properties...`);
      }
    } catch (error) {
      console.error('Error indexing batch:', error);
    }
  }
  
  // Refresh index
  await esClient.indices.refresh({ index: UNIFIED_INDEX });
  console.log(`✅ Indexed ${indexed.toLocaleString()} unified properties`);
  
  return indexed;
}

// Main function
async function createUnifiedPropertyIndex() {
  try {
    const startTime = Date.now();
    
    // Step 1: Create index
    await createUnifiedIndex();
    
    // Step 2: Load Land Registry data
    let properties = await loadLandRegistryData();
    
    // Step 3: Merge EPC data
    properties = await mergeEPCData(properties);
    
    // Step 4: Merge HPI data
    properties = await mergeHPIData(properties);
    
    // Step 5: Index all properties
    const indexed = await indexProperties(properties);
    
    const totalTime = (Date.now() - startTime) / 1000;
    console.log('\n🎉 Unified Property Index Created Successfully!');
    console.log(`📊 Total properties indexed: ${indexed.toLocaleString()}`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(2)} seconds`);
    console.log(`🚀 Average rate: ${Math.round(indexed / totalTime)} properties/second`);
    
    // Show sample data
    console.log('\n📋 Sample Property Data:');
    const sampleProperty = Array.from(properties.values())[0];
    console.log(JSON.stringify(sampleProperty, null, 2));
    
  } catch (error) {
    console.error('❌ Error creating unified index:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createUnifiedPropertyIndex()
    .then(() => {
      console.log('\n✅ Unified property index creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed to create unified index:', error);
      process.exit(1);
    });
}

module.exports = { createUnifiedPropertyIndex }; 