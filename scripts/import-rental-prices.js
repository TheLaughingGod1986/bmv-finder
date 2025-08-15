#!/usr/bin/env node

/**
 * Rental Price Data Import Script
 * Imports cleaned ONS rental price data into Elasticsearch
 * 
 * Usage: node scripts/import-rental-prices.js
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

// Rental Prices Index configuration
const RENTAL_INDEX = 'rental_prices';
const RENTAL_MAPPING = {
  mappings: {
    properties: {
      geo_code: { type: 'keyword' },
      geography: { type: 'keyword' },
      date: { type: 'date' },
      month: { type: 'integer' },
      year: { type: 'integer' },
      index_type: { type: 'keyword' },
      index_label: { type: 'keyword' },
      value: { type: 'float' },
      is_index: { type: 'boolean' },
      is_year_on_year: { type: 'boolean' },
      created_at: { type: 'date' },
      updated_at: { type: 'date' }
    }
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0
  }
};

// Rental prices data file path
const RENTAL_CSV_FILE = path.join(__dirname, '..', 'data', 'cleaned-datasets', 'rental-prices-cleaned.csv');

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

// Transform CSV row to rental price document
function transformRentalPriceRecord(values) {
  if (values.length < 12) return null;
  
  const [
    geo_code, geography, date, month, year, index_type, index_label, 
    value, is_index, is_year_on_year, created_at, updated_at
  ] = values;

  return {
    geo_code: geo_code || '',
    geography: geography || '',
    date: date || '',
    month: parseInt(month) || 0,
    year: parseInt(year) || 0,
    index_type: index_type || '',
    index_label: index_label || '',
    value: parseFloat(value) || 0,
    is_index: is_index === 'true',
    is_year_on_year: is_year_on_year === 'true',
    created_at: created_at || new Date().toISOString(),
    updated_at: updated_at || new Date().toISOString()
  };
}

async function createRentalIndex() {
  try {
    console.log('🔄 Creating rental prices index...');
    
    // Check if index exists
    const indexExists = await flexibleIndices.exists({ index: RENTAL_INDEX });
    
    if (indexExists) {
      console.log('📋 Rental prices index already exists, deleting...');
      await flexibleIndices.delete({ index: RENTAL_INDEX });
    }
    
    // Create new index
    await flexibleIndices.create({
      index: RENTAL_INDEX,
      body: RENTAL_MAPPING
    });
    
    console.log('✅ Rental prices index created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating rental prices index:', error.message);
    return false;
  }
}

async function importRentalPrices() {
  try {
    console.log('🔄 Importing rental price data from CSV...');
    
    // Check if CSV file exists
    if (!fs.existsSync(RENTAL_CSV_FILE)) {
      console.error(`❌ Rental prices CSV file not found: ${RENTAL_CSV_FILE}`);
      return 0;
    }
    
    console.log(`📁 Reading rental price data from: ${RENTAL_CSV_FILE}`);
    
    // Read CSV file
    const csvContent = fs.readFileSync(RENTAL_CSV_FILE, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      console.error('❌ CSV file is empty or has no data rows');
      return 0;
    }
    
    console.log(`📊 Found ${lines.length - 1} data rows to process`);
    
    // Process records in batches
    const BATCH_SIZE = 1000;
    let totalProcessed = 0;
    let totalBatches = 0;
    
    for (let i = 1; i < lines.length; i += BATCH_SIZE) {
      const batchLines = lines.slice(i, i + BATCH_SIZE);
      const operations = [];
      
      for (const line of batchLines) {
        try {
          const values = parseCSVLine(line);
          const record = transformRentalPriceRecord(values);
          
          if (record) {
            operations.push({ index: { _index: RENTAL_INDEX } });
            operations.push(record);
          }
        } catch (error) {
          console.warn(`⚠️  Skipping invalid line ${i + batchLines.indexOf(line) + 1}: ${error.message}`);
        }
      }
      
      if (operations.length > 0) {
        try {
          const result = await flexibleBulk({ body: operations });
          
          if (result.errors) {
            const errors = result.items.filter(item => item.index?.error);
            console.warn(`⚠️  ${errors.length} documents failed to index in batch ${totalBatches + 1}`);
          }
          
          totalProcessed += operations.length / 2;
          totalBatches++;
          
          console.log(`📦 Batch ${totalBatches}: Processed ${operations.length / 2} records (Total: ${totalProcessed.toLocaleString()})`);
          
          // Small delay to prevent overwhelming Elasticsearch
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`❌ Error processing batch ${totalBatches + 1}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Successfully processed ${totalProcessed.toLocaleString()} rental price records in ${totalBatches} batches`);
    return totalProcessed;
    
  } catch (error) {
    console.error('❌ Error importing rental price data:', error.message);
    return 0;
  }
}

async function verifyData() {
  try {
    console.log('🔍 Verifying imported data...');
    
    // Count documents
    const countResult = await flexibleCount({ index: RENTAL_INDEX });
    console.log(`📊 Total rental price records: ${countResult.count.toLocaleString()}`);
    
    // Get a sample document
    const searchResult = await flexibleSearch({
      index: RENTAL_INDEX,
      size: 1
    });
    
    if (searchResult.hits.hits.length > 0) {
      const sample = searchResult.hits.hits[0]._source;
      console.log('📋 Sample rental price record:');
      console.log(`   Geography: ${sample.geography}`);
      console.log(`   Date: ${sample.date}`);
      console.log(`   Type: ${sample.index_type}`);
      console.log(`   Value: ${sample.value}`);
    }
    
    return countResult.count;
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
    return 0;
  }
}

async function main() {
  try {
    console.log('🚀 Starting rental price data import...');
    
    // Test Elasticsearch connection
    await esClient.ping();
    console.log('✅ Elasticsearch connection successful');
    
    // Create index
    const indexCreated = await createRentalIndex();
    if (!indexCreated) {
      console.error('❌ Failed to create rental prices index');
      process.exit(1);
    }
    
    // Import data
    const importedCount = await importRentalPrices();
    if (importedCount === 0) {
      console.error('❌ Failed to import rental price data');
      process.exit(1);
    }
    
    // Verify data
    const verifiedCount = await verifyData();
    
    console.log('\n🎉 Rental price data import completed successfully!');
    console.log(`📊 Total rental price records: ${verifiedCount.toLocaleString()}`);
    console.log(`🌐 Index: ${RENTAL_INDEX}`);
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

module.exports = { createRentalIndex, importRentalPrices, verifyData };
