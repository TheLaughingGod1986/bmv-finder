#!/usr/bin/env node

/**
 * ONSPD Data Import Script
 * Imports cleaned ONS Postcode Directory data into Elasticsearch
 *
 * Usage: node scripts/import-onspd-data.js
 */

const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

// ONSPD Index configuration
const ONSPD_INDEX = 'onspd';
const ONSPD_MAPPING = {
  mappings: {
    properties: {
      postcode: { type: 'keyword' },
      postcode_clean: { type: 'keyword' },
      x_coord: { type: 'float' },
      y_coord: { type: 'float' },
      latitude: { type: 'float' },
      longitude: { type: 'float' },
      object_id: { type: 'long' },
      introduction_date: { type: 'date' },
      termination_date: { type: 'date' },
      is_active: { type: 'boolean' },
      user_type: { type: 'integer' },
      os_grid_reference: { type: 'boolean' },
      easting_1m: { type: 'long' },
      northing_1m: { type: 'long' },
      
      // Administrative boundaries
      county: { type: 'keyword' },
      local_authority: { type: 'keyword' },
      ward: { type: 'keyword' },
      parish: { type: 'keyword' },
      constituency: { type: 'keyword' },
      
      // Health and NHS
      health_authority: { type: 'keyword' },
      nhs_region: { type: 'keyword' },
      
      // Statistical areas
      lsoa_2011: { type: 'keyword' },
      msoa_2011: { type: 'keyword' },
      lsoa_2021: { type: 'keyword' },
      msoa_2021: { type: 'keyword' },
      output_area_2011: { type: 'keyword' },
      output_area_2021: { type: 'keyword' },
      
      // Geographic regions
      country: { type: 'keyword' },
      region: { type: 'keyword' },
      european_electoral_region: { type: 'keyword' },
      travel_to_work_area: { type: 'keyword' },
      
      // Additional classifications
      urban_rural_2011: { type: 'keyword' },
      urban_rural_2021: { type: 'keyword' },
      built_up_area: { type: 'keyword' },
      national_park: { type: 'keyword' },
      
      // IMD and deprivation
      imd_decile: { type: 'integer' },
      
      // Global ID for reference
      global_id: { type: 'keyword' },
      
      // Metadata
      created_at: { type: 'date' },
      updated_at: { type: 'date' }
    }
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0
  }
};

// ONSPD data file path
const ONSPD_CSV_FILE = path.join(__dirname, '..', 'data', 'cleaned-datasets', 'onspd-cleaned.csv');

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

// Transform CSV row to ONSPD document
function transformONSPDRecord(values) {
  if (values.length < 37) return null;

  const [
    postcode, postcode_clean, x_coord, y_coord, latitude, longitude, object_id,
    introduction_date, termination_date, is_active, user_type, os_grid_reference,
    easting_1m, northing_1m, county, local_authority, ward, parish, constituency,
    health_authority, nhs_region, lsoa_2011, msoa_2011, lsoa_2021, msoa_2021,
    output_area_2011, output_area_2021, country, region, european_electoral_region,
    travel_to_work_area, urban_rural_2011, urban_rural_2021, built_up_area,
    national_park, imd_decile, global_id, created_at, updated_at
  ] = values;

  return {
    postcode: postcode || '',
    postcode_clean: postcode_clean || '',
    x_coord: parseFloat(x_coord) || 0,
    y_coord: parseFloat(y_coord) || 0,
    latitude: parseFloat(latitude) || 0,
    longitude: parseFloat(longitude) || 0,
    object_id: parseInt(object_id) || 0,
    introduction_date: introduction_date || null,
    termination_date: termination_date || null,
    is_active: is_active === 'true',
    user_type: parseInt(user_type) || 0,
    os_grid_reference: os_grid_reference === 'true',
    easting_1m: parseInt(easting_1m) || 0,
    northing_1m: parseInt(northing_1m) || 0,
    
    // Administrative boundaries
    county: county || null,
    local_authority: local_authority || null,
    ward: ward || null,
    parish: parish || null,
    constituency: constituency || null,
    
    // Health and NHS
    health_authority: health_authority || null,
    nhs_region: nhs_region || null,
    
    // Statistical areas
    lsoa_2011: lsoa_2011 || null,
    msoa_2011: msoa_2011 || null,
    lsoa_2021: lsoa_2021 || null,
    msoa_2021: msoa_2021 || null,
    output_area_2011: output_area_2011 || null,
    output_area_2021: output_area_2021 || null,
    
    // Geographic regions
    country: country || null,
    region: region || null,
    european_electoral_region: european_electoral_region || null,
    travel_to_work_area: travel_to_work_area || null,
    
    // Additional classifications
    urban_rural_2011: urban_rural_2011 || null,
    urban_rural_2021: urban_rural_2021 || null,
    built_up_area: built_up_area || null,
    national_park: national_park || null,
    
    // IMD and deprivation
    imd_decile: imd_decile ? parseInt(imd_decile) : null,
    
    // Global ID for reference
    global_id: global_id || null,
    
    // Metadata
    created_at: created_at || new Date().toISOString(),
    updated_at: updated_at || new Date().toISOString()
  };
}

async function createONSPDIndex() {
  try {
    console.log('🔄 Creating ONSPD index...');

    // Check if index exists
    const indexExists = await flexibleIndices.exists({ index: ONSPD_INDEX });

    if (indexExists) {
      console.log('📋 ONSPD index already exists, deleting...');
      await flexibleIndices.delete({ index: ONSPD_INDEX });
    }

    // Create new index
    await flexibleIndices.create({
      index: ONSPD_INDEX,
      body: ONSPD_MAPPING
    });

    console.log('✅ ONSPD index created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating ONSPD index:', error.message);
    return false;
  }
}

async function importONSPDData() {
  try {
    console.log('🔄 Importing ONSPD data from CSV...');

    // Check if CSV file exists
    if (!fs.existsSync(ONSPD_CSV_FILE)) {
      console.error(`❌ ONSPD CSV file not found: ${ONSPD_CSV_FILE}`);
      return 0;
    }

    console.log(`📁 Reading ONSPD data from: ${ONSPD_CSV_FILE}`);

    // Create read stream and readline interface
    const fileStream = fs.createReadStream(ONSPD_CSV_FILE);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineCount = 0;
    let processedCount = 0;
    let totalBatches = 0;
    let operations = [];

    console.log('📖 Processing ONSPD data line by line...');

    for await (const line of rl) {
      lineCount++;

      try {
        if (lineCount === 1) {
          // Skip header
          continue;
        }

        const values = parseCSVLine(line);
        const record = transformONSPDRecord(values);

        if (record) {
          operations.push({ index: { _index: ONSPD_INDEX } });
          operations.push(record);
          processedCount++;
        }

        // Process in batches
        if (operations.length >= 2000) {
          try {
            const result = await flexibleBulk({ body: operations });

            if (result.errors) {
              const errors = result.items.filter(item => item.index?.error);
              console.warn(`⚠️  ${errors.length} documents failed to index in batch ${totalBatches + 1}`);
            }

            totalBatches++;
            console.log(`📦 Batch ${totalBatches}: Processed ${operations.length / 2} records (Total: ${processedCount.toLocaleString()})`);

            // Reset operations array
            operations = [];

            // Small delay to prevent overwhelming Elasticsearch
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (error) {
            console.error(`❌ Error processing batch ${totalBatches + 1}:`, error.message);
          }
        }

        // Progress indicator
        if (lineCount % 100000 === 0) {
          console.log(`📈 Processed ${lineCount.toLocaleString()} lines...`);
        }

      } catch (error) {
        console.warn(`⚠️  Skipping line ${lineCount}: ${error.message}`);
      }
    }

    // Process remaining operations
    if (operations.length > 0) {
      try {
        const result = await flexibleBulk({ body: operations });

        if (result.errors) {
          const errors = result.items.filter(item => item.index?.error);
          console.warn(`⚠️  ${errors.length} documents failed to index in final batch`);
        }

        totalBatches++;
        console.log(`📦 Final batch: Processed ${operations.length / 2} records`);

      } catch (error) {
        console.error(`❌ Error processing final batch:`, error.message);
      }
    }

    console.log(`✅ Successfully processed ${processedCount.toLocaleString()} ONSPD records in ${totalBatches} batches`);
    return processedCount;

  } catch (error) {
    console.error('❌ Error importing ONSPD data:', error.message);
    return 0;
  }
}

async function verifyData() {
  try {
    console.log('🔍 Verifying imported data...');

    // Count documents
    const countResult = await flexibleCount({ index: ONSPD_INDEX });
    console.log(`📊 Total ONSPD records: ${countResult.count.toLocaleString()}`);

    // Get a sample document
    const searchResult = await flexibleSearch({
      index: ONSPD_INDEX,
      size: 1
    });

    if (searchResult.hits.hits.length > 0) {
      const sample = searchResult.hits.hits[0]._source;
      console.log('📋 Sample ONSPD record:');
      console.log(`   Postcode: ${sample.postcode}`);
      console.log(`   Coordinates: ${sample.latitude}, ${sample.longitude}`);
      console.log(`   Local Authority: ${sample.local_authority}`);
      console.log(`   Active: ${sample.is_active}`);
    }

    return countResult.count;
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
    return 0;
  }
}

async function main() {
  try {
    console.log('🚀 Starting ONSPD data import...');

    // Test Elasticsearch connection
    await esClient.ping();
    console.log('✅ Elasticsearch connection successful');

    // Create index
    const indexCreated = await createONSPDIndex();
    if (!indexCreated) {
      console.error('❌ Failed to create ONSPD index');
      process.exit(1);
    }

    // Import data
    const importedCount = await importONSPDData();
    if (importedCount === 0) {
      console.error('❌ Failed to import ONSPD data');
      process.exit(1);
    }

    // Verify data
    const verifiedCount = await verifyData();

    console.log('\n🎉 ONSPD data import completed successfully!');
    console.log(`📊 Total ONSPD records: ${verifiedCount.toLocaleString()}`);
    console.log(`🌐 Index: ${ONSPD_INDEX}`);
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

module.exports = { createONSPDIndex, importONSPDData, verifyData };
