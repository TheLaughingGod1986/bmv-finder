#!/usr/bin/env node

/**
 * CSV to Elasticsearch Import Template
 * 
 * A robust, resumable CSV import script with:
 * - Progress tracking and resuming
 * - Memory-efficient streaming
 * - Error handling and retries
 * - Configurable batch sizes and timeouts
 * - Progress file management
 * 
 * Usage: node --max-old-space-size=8192 scripts/csv-to-elasticsearch-template.js
 */

const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('@elastic/elasticsearch');
const path = require('path');

// ============================================================================
// CONFIGURATION - MODIFY THESE VALUES FOR YOUR IMPORT
// ============================================================================

const CONFIG = {
  // Elasticsearch connection
  ELASTICSEARCH_URL: 'http://localhost:9201',
  
  // Index settings
  INDEX_NAME: 'your-index-name',
  
  // Import settings
  BATCH_SIZE: 25, // Documents per batch (adjust based on your data size)
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
  
  // File paths
  CSV_FILE_PATH: './data/your-file.csv',
  PROGRESS_FILE: './import-progress.json',
  
  // Timeouts (in milliseconds)
  REQUEST_TIMEOUT: 120000, // 2 minutes
  BATCH_TIMEOUT: 30000,    // 30 seconds per batch
};

// ============================================================================
// ELASTICSEARCH CLIENT SETUP
// ============================================================================

const client = new Client({
  node: CONFIG.ELASTICSEARCH_URL,
  requestTimeout: CONFIG.REQUEST_TIMEOUT,
  maxRetries: CONFIG.MAX_RETRIES,
  compression: false // Disable compression for better performance
});

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

let progress = {
  totalProcessed: 0,
  totalIndexed: 0,
  lastSuccessfulRow: 0,
  failedBatches: 0,
  startTime: Date.now(),
  isResuming: false
};

function loadProgress() {
  try {
    if (fs.existsSync(CONFIG.PROGRESS_FILE)) {
      const savedProgress = JSON.parse(fs.readFileSync(CONFIG.PROGRESS_FILE, 'utf8'));
      progress = { ...progress, ...savedProgress, isResuming: true };
      console.log(`📋 Resuming from row ${progress.lastSuccessfulRow + 1}`);
      return true;
    }
  } catch (error) {
    console.log('⚠️  Could not load progress file, starting fresh');
  }
  return false;
}

function saveProgress() {
  try {
    fs.writeFileSync(CONFIG.PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (error) {
    console.error('⚠️  Could not save progress:', error.message);
  }
}

// ============================================================================
// INDEX CREATION
// ============================================================================

async function createIndex() {
  try {
    console.log('🔍 Checking if index exists...');
    
    try {
      const indexInfo = await client.indices.get({ index: CONFIG.INDEX_NAME });
      console.log('✅ Index already exists with', Object.keys(indexInfo).length, 'shards');
      return;
    } catch (getError) {
      if (getError.meta && getError.meta.statusCode === 404) {
        console.log('📊 Index does not exist, will create it...');
      } else {
        console.log('⚠️  Could not check index status, assuming it exists:', getError.message);
        return;
      }
    }
    
    console.log('🏗️  Creating index...');
    
    // MODIFY THIS SECTION FOR YOUR DATA STRUCTURE
    await client.indices.create({
      index: CONFIG.INDEX_NAME,
      body: {
        mappings: {
          properties: {
            // Add your field mappings here
            // Example:
            // id: { type: 'keyword' },
            // name: { type: 'text' },
            // value: { type: 'float' },
            // date: { type: 'date' }
          }
        },
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          refresh_interval: '120s',
          'index.mapping.total_fields.limit': 100
        }
      }
    });
    
    console.log('✅ Index created successfully');
  } catch (error) {
    if (error.message.includes('resource_already_exists')) {
      console.log('✅ Index already exists');
    } else {
      console.error('❌ Error creating index:', error.message);
      throw error;
    }
  }
}

// ============================================================================
// DATA PROCESSING
// ============================================================================

function processRow(row) {
  // MODIFY THIS FUNCTION FOR YOUR DATA TRANSFORMATION
  // This is where you clean, validate, and transform your CSV data
  
  // Example transformation:
  const processed = {};
  
  // Copy all fields from CSV (modify as needed)
  Object.keys(row).forEach(key => {
    let value = row[key];
    
    // Handle empty values
    if (value === '' || value === 'N/A' || value === 'N') {
      value = null;
    }
    
    // Handle specific field types (modify based on your data)
    if (key.toLowerCase().includes('date') && value) {
      // Convert date strings to proper format if needed
      try {
        value = new Date(value).toISOString();
      } catch (e) {
        value = null;
      }
    }
    
    if (key.toLowerCase().includes('number') && value) {
      // Convert numeric strings to numbers
      const num = parseFloat(value);
      value = isNaN(num) ? null : num;
    }
    
    processed[key] = value;
  });
  
  return processed;
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

async function processBatch(batch, batchNumber) {
  const operations = [];
  
  batch.forEach(doc => {
    operations.push({ index: { _index: CONFIG.INDEX_NAME } });
    operations.push(doc);
  });
  
  try {
    const response = await client.bulk({
      body: operations,
      timeout: CONFIG.BATCH_TIMEOUT
    });
    
    if (response.errors) {
      const errors = response.items.filter(item => item.index && item.index.error);
      console.error(`❌ Batch ${batchNumber} had ${errors.length} errors:`, errors[0]?.index?.error?.reason);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Batch ${batchNumber} failed:`, error.message);
    return false;
  }
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

async function importCSV() {
  console.log('🚀 Starting CSV Import to Elasticsearch');
  console.log('==========================================');
  console.log(`📁 CSV file: ${CONFIG.CSV_FILE_PATH}`);
  console.log(`🔗 Elasticsearch: ${CONFIG.ELASTICSEARCH_URL}`);
  console.log(`📊 Index: ${CONFIG.INDEX_NAME}`);
  console.log(`📦 Batch size: ${CONFIG.BATCH_SIZE}`);
  
  try {
    // Load progress and create index
    loadProgress();
    await createIndex();
    
    let currentBatch = [];
    let rowCount = 0;
    let batchNumber = 0;
    
    // Skip rows if resuming
    if (progress.isResuming) {
      rowCount = progress.lastSuccessfulRow;
    }
    
    const stream = fs.createReadStream(CONFIG.CSV_FILE_PATH)
      .pipe(csv())
      .on('data', async (row) => {
        rowCount++;
        
        // Skip rows we've already processed
        if (progress.isResuming && rowCount <= progress.lastSuccessfulRow) {
          return;
        }
        
        // Process the row
        const processedDoc = processRow(row);
        currentBatch.push(processedDoc);
        
        // Process batch when it reaches the batch size
        if (currentBatch.length >= CONFIG.BATCH_SIZE) {
          batchNumber++;
          const success = await processBatch(currentBatch, batchNumber);
          
          if (success) {
            progress.totalIndexed += currentBatch.length;
            progress.lastSuccessfulRow = rowCount;
          } else {
            progress.failedBatches++;
          }
          
          progress.totalProcessed = rowCount;
          saveProgress();
          
          // Log progress
          const rate = (progress.totalIndexed / ((Date.now() - progress.startTime) / 1000)).toFixed(2);
          console.log(`📈 Row ${rowCount}: Processed ${rowCount}, Indexed ${progress.totalIndexed}, Rate: ${rate} docs/sec`);
          
          currentBatch = [];
        }
      })
      .on('end', async () => {
        // Process remaining documents in the last batch
        if (currentBatch.length > 0) {
          batchNumber++;
          const success = await processBatch(currentBatch, batchNumber);
          
          if (success) {
            progress.totalIndexed += currentBatch.length;
            progress.lastSuccessfulRow = rowCount;
          } else {
            progress.failedBatches++;
          }
          
          progress.totalProcessed = rowCount;
          saveProgress();
        }
        
        // Final summary
        const totalTime = ((Date.now() - progress.startTime) / 1000).toFixed(2);
        const avgRate = (progress.totalIndexed / totalTime).toFixed(2);
        
        console.log('\n🎉 Import completed!');
        console.log(`📊 Total processed: ${progress.totalProcessed}`);
        console.log(`✅ Total indexed: ${progress.totalIndexed}`);
        console.log(`❌ Failed batches: ${progress.failedBatches}`);
        console.log(`⏱️  Total time: ${totalTime} seconds`);
        console.log(`🚀 Average rate: ${avgRate} docs/sec`);
        
        // Refresh index and clean up
        try {
          await client.indices.refresh({ index: CONFIG.INDEX_NAME });
          console.log('🔄 Index refreshed');
          
          // Clean up progress file on successful completion
          if (fs.existsSync(CONFIG.PROGRESS_FILE)) {
            fs.unlinkSync(CONFIG.PROGRESS_FILE);
            console.log('🧹 Progress file cleaned up');
          }
        } catch (error) {
          console.error('⚠️  Could not refresh index or clean up:', error.message);
        }
      })
      .on('error', (error) => {
        console.error('❌ CSV stream error:', error.message);
        process.exit(1);
      });
      
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// ============================================================================
// RUN THE IMPORT
// ============================================================================

if (require.main === module) {
  importCSV().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { importCSV, CONFIG };
